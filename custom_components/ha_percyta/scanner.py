"""Scanner-Logik für HA Percyta.

Liest alle Daten direkt über das interne Home-Assistant-Objekt (``hass``) aus –
ohne REST-API und ohne Token. Add-ons werden – falls ein Supervisor vorhanden ist –
über die Supervisor-API abgefragt.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from collections import Counter
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import Any

import aiohttp

from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import (
    DATAFLOW_TAGS,
    DOMAIN,
    MAX_ERRORS,
    RISK_LEVELS,
    SECRET_KEY_HINTS,
    SECRET_KEY_IGNORE,
    STALE_TOKEN_DAYS,
    SYSTEM_ACCESS_MAP,
    VERSION,
)
from .system import (
    collect_system_stats,
    measure_blueprint_sizes,
    measure_custom_card_sizes,
)

_LOGGER = logging.getLogger(__name__)

SUPERVISOR_URL = "http://supervisor"

# Helfer-Domains (über die Oberfläche angelegte Hilfsentitäten).
HELPER_DOMAINS = (
    "input_boolean",
    "input_button",
    "input_datetime",
    "input_number",
    "input_select",
    "input_text",
    "counter",
    "timer",
    "schedule",
)
MAX_UPDATES = 50  # max. Anzahl gelisteter Updates
MAX_DOMAINS = 25  # max. Anzahl gelisteter Entitäts-Domains
MAX_DISABLED_ROWS = 200  # max. Zeilen "deaktiviert nach Integration"
DB_TOP_ROWS = 30  # Top-Einträge je Datenbank-Tabelle
DB_STATS_TTL = 3600  # Datenbank-Auswertung höchstens 1x pro Stunde neu berechnen
DB_STATS_TIMEOUT = 45  # Sekunden, die ein Scan auf die Auswertung wartet
DB_CACHE_KEY = f"{DOMAIN}_db_stats"


def _query_db_stats(instance) -> dict[str, Any]:
    """Zählt die Einträge je Entität/Statistik (läuft im Recorder-Executor)."""
    from sqlalchemy import text  # noqa: PLC0415

    try:
        from homeassistant.helpers.recorder import session_scope  # noqa: PLC0415
    except ImportError:  # ältere Cores
        from homeassistant.components.recorder.util import (  # noqa: PLC0415
            session_scope,
        )

    def _counts(sql: str) -> list[tuple[str, int]]:
        try:
            with session_scope(
                session=instance.get_session(), read_only=True
            ) as session:
                return [
                    (str(row[0]), int(row[1]))
                    for row in session.execute(text(sql)).all()
                    if row[0] is not None
                ]
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Datenbank-Abfrage fehlgeschlagen: %s", err)
            return []

    states = _counts(
        "SELECT sm.entity_id, t.c FROM "
        "(SELECT metadata_id, COUNT(*) AS c FROM states GROUP BY metadata_id) t "
        "JOIN states_meta sm ON sm.metadata_id = t.metadata_id"
    )
    long_term = dict(
        _counts(
            "SELECT m.statistic_id, t.c FROM "
            "(SELECT metadata_id, COUNT(*) AS c FROM statistics GROUP BY metadata_id) t "
            "JOIN statistics_meta m ON m.id = t.metadata_id"
        )
    )
    short_term = dict(
        _counts(
            "SELECT m.statistic_id, t.c FROM "
            "(SELECT metadata_id, COUNT(*) AS c FROM statistics_short_term "
            "GROUP BY metadata_id) t "
            "JOIN statistics_meta m ON m.id = t.metadata_id"
        )
    )

    states.sort(key=lambda row: row[1], reverse=True)
    stat_ids = set(long_term) | set(short_term)
    stats = sorted(
        (
            {
                "statistic_id": sid,
                "long_term": long_term.get(sid, 0),
                "short_term": short_term.get(sid, 0),
                "rows": long_term.get(sid, 0) + short_term.get(sid, 0),
            }
            for sid in stat_ids
        ),
        key=lambda row: row["rows"],
        reverse=True,
    )

    try:
        engine = str(instance.engine.dialect.name)
    except Exception:  # noqa: BLE001
        engine = None

    return {
        "available": True,
        "engine": engine,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "states_total": sum(count for _, count in states),
        "states_entities": len(states),
        "states_top": [
            {"entity_id": entity_id, "rows": count}
            for entity_id, count in states[:DB_TOP_ROWS]
        ],
        "statistics_long_total": sum(long_term.values()),
        "statistics_short_total": sum(short_term.values()),
        "statistics_ids": len(stat_ids),
        "statistics_top": stats[:DB_TOP_ROWS],
    }
_GIB = 1024 ** 3


def is_secret_key(key: Any) -> bool:
    """Deutet der Feldname auf ein Secret (API-Key, Token, Passwort …) hin?"""
    low = str(key).lower()
    if any(ign in low for ign in SECRET_KEY_IGNORE):
        return False
    return any(hint in low for hint in SECRET_KEY_HINTS)


_MISSING = object()


def resolve_secret_value(mapping: Any, path: str) -> Any:
    """Liest den Klartext-Wert zu einem Secret-Pfad (z. B. ``token.access_token``).

    Gibt ``None`` zurück, wenn der Pfad nicht existiert oder das Feld nicht als
    Secret gilt – so lässt sich darüber keine beliebige Konfiguration auslesen.
    """

    def _resolve(current: Any, rest: str) -> tuple[Any, Any]:
        if not isinstance(current, Mapping):
            return _MISSING, _MISSING
        for key, value in current.items():
            name = str(key)
            if name == rest:
                return key, value
            if rest.startswith(f"{name}.") and isinstance(value, Mapping):
                found = _resolve(value, rest[len(name) + 1 :])
                if found[0] is not _MISSING:
                    return found
        return _MISSING, _MISSING

    key, value = _resolve(mapping, str(path))
    if key is _MISSING or isinstance(value, (Mapping, bool)) or value is None:
        return None
    if not is_secret_key(key):
        return None
    return str(value)


def _mask(value: Any) -> str:
    """Maskiert einen Secret-Wert (erste/letzte 4 Zeichen sichtbar)."""
    text = str(value)
    if len(text) <= 8:
        return "•" * len(text)
    return f"{text[:4]}{'•' * (len(text) - 8)}{text[-4:]}"


class HAPercytaScanner:
    """Scannt Home Assistant und sammelt Permissions-/Datenschutz-Daten."""

    def __init__(
        self,
        hass: HomeAssistant,
        *,
        include_addons: bool = True,
        include_secrets: bool = True,
        include_errors: bool = True,
        include_storage: bool = True,
        mask_secrets: bool = True,
        overrides: dict[str, str] | None = None,
    ) -> None:
        self.hass = hass
        self.include_addons = include_addons
        self.include_secrets = include_secrets
        self.include_errors = include_errors
        self.include_storage = include_storage
        self.mask_secrets = mask_secrets
        self.overrides = overrides or {}

    async def scan_all(self) -> dict[str, Any]:
        """Führt einen vollständigen Scan durch und gibt die Ergebnisse zurück."""
        integrations = await self._scan_integrations()
        addons = await self._scan_addons() if self.include_addons else []
        custom_cards = await self._scan_custom_cards()
        blueprints = await self._scan_blueprints()
        users, tokens = await self._scan_users_and_tokens()
        errors = self._scan_errors() if self.include_errors else []
        system = await self._scan_system()
        database = await self._scan_database() if self.include_storage else {}
        backup = await self._scan_backup()
        try:
            inventory = self._scan_inventory()
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Bestand/Zustand nicht ermittelbar: %s", err)
            inventory = {}

        # Daten-/Konfigurationsgröße je App (aus der Supervisor-Speicherübersicht).
        addon_sizes = getattr(self, "_addon_sizes", None) or {}
        for addon in addons:
            size = addon_sizes.get(addon.get("slug") or "")
            if not size:
                continue
            addon["size_data"] = size.get("data")
            addon["size_config"] = size.get("config")
            addon["size_bytes"] = (size.get("data") or 0) + (size.get("config") or 0)

        # Gesamtgröße aller Custom Cards (dedupliziert nach gemessenem Pfad) und
        # Eingliederung in die /config-Aufschlüsselung (der Anteil wird aus dem
        # www-Eintrag herausgerechnet, damit er nicht doppelt zählt).
        if isinstance(system, dict):
            config_dir = self.hass.config.config_dir
            www_prefix = os.path.join(config_dir, "www")
            seen: set[str] = set()
            total = 0
            www_sum = 0
            for card in custom_cards:
                size = card.get("size_bytes")
                path = card.get("size_path")
                if size and path and path not in seen:
                    seen.add(path)
                    total += size
                    if path == www_prefix or path.startswith(www_prefix + os.sep):
                        www_sum += size
            system["custom_cards_total"] = total

            storage = system.get("storage") or {}
            breakdown = storage.get("breakdown")
            if isinstance(breakdown, list) and total > 0:
                for item in breakdown:
                    if str(item.get("name", "")).startswith("www"):
                        item["bytes"] = max(0, (item.get("bytes") or 0) - www_sum)
                breakdown = [i for i in breakdown if (i.get("bytes") or 0) > 0]
                breakdown.append(
                    {"name": "Custom Cards", "bytes": total, "type": "cards"}
                )
                breakdown.sort(key=lambda x: x["bytes"], reverse=True)
                storage["breakdown"] = breakdown
                system["storage"] = storage

        ent_reg = er.async_get(self.hass)
        dev_reg = dr.async_get(self.hass)
        total_entities = len(ent_reg.entities)
        total_devices = len(dev_reg.devices)

        high_risk = sum(
            1 for i in integrations if i["analysis"]["risk_level"] == "high"
        )
        medium_risk = sum(
            1 for i in integrations if i["analysis"]["risk_level"] == "medium"
        )
        addon_high = sum(1 for a in addons if a["analysis"]["risk_level"] == "high")
        secrets_found = sum(
            len(i["analysis"]["secrets"]) for i in integrations
        )
        cloud_count = sum(
            1 for i in integrations if i["analysis"]["has_external_access"]
        )
        stale_tokens = sum(1 for t in tokens if t.get("stale"))
        long_lived_tokens = sum(1 for t in tokens if t.get("is_long_lived"))

        disk = system.get("disk", {}) or {}
        ram = system.get("ram", {}) or {}
        cpu = system.get("cpu", {}) or {}

        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "app_version": VERSION,
            "ha_version": self.hass.config.as_dict().get("version", "unknown"),
            "is_supervisor": bool(os.environ.get("SUPERVISOR_TOKEN")),
            "integrations": integrations,
            "addons": addons,
            "custom_cards": custom_cards,
            "blueprints": blueprints,
            "users": users,
            "tokens": tokens,
            "errors": errors,
            "system": system,
            "inventory": inventory,
            "database": database,
            "backup": backup,
            "counts": {
                "integrations": len(integrations),
                "addons": len(addons),
                "custom_cards": len(custom_cards),
                "blueprints": len(blueprints),
                "users": len(users),
                "tokens": len(tokens),
                "total_entities": total_entities,
                "total_devices": total_devices,
                "high_risk": high_risk + addon_high,
                "medium_risk": medium_risk,
                "risk_total": high_risk + medium_risk + addon_high,
                "secrets_found": secrets_found,
                "cloud": cloud_count,
                "long_lived_tokens": long_lived_tokens,
                "stale_tokens": stale_tokens,
                "errors": len(errors),
                "updates_available": len(inventory.get("updates", [])),
                "unavailable_entities": inventory.get("unavailable", 0),
                "disk_percent": disk.get("percent"),
                "disk_free": disk.get("free"),
                "ram_percent": ram.get("percent"),
                "cpu_percent": cpu.get("percent"),
            },
        }

    # ------------------------------------------------------------------ #
    # Integrationen
    # ------------------------------------------------------------------ #
    async def _scan_integrations(self) -> list[dict[str, Any]]:
        ent_reg = er.async_get(self.hass)
        dev_reg = dr.async_get(self.hass)
        result: list[dict[str, Any]] = []

        for entry in self.hass.config_entries.async_entries():
            entities = er.async_entries_for_config_entry(ent_reg, entry.entry_id)
            devices = dr.async_entries_for_config_entry(dev_reg, entry.entry_id)
            entity_domains = sorted({e.entity_id.split(".")[0] for e in entities})

            manifest = await self._integration_manifest(entry.domain)

            info: dict[str, Any] = {
                "entry_id": entry.entry_id,
                "domain": entry.domain,
                "title": entry.title,
                "state": str(getattr(entry.state, "value", entry.state)),
                "source": entry.source,
                "is_custom": manifest.get("is_custom"),
                "iot_class": manifest.get("iot_class"),
                "dependencies": manifest.get("dependencies", []),
                "after_dependencies": manifest.get("after_dependencies", []),
                "requirements": manifest.get("requirements", []),
                "entity_count": len(entities),
                "device_count": len(devices),
                "entity_domains": entity_domains,
                "disabled_by": str(entry.disabled_by) if entry.disabled_by else None,
            }
            info["analysis"] = self._analyze_integration(entry, info, entity_domains)
            result.append(info)

        result.sort(key=lambda i: ({"high": 0, "medium": 1, "low": 2}.get(
            i["analysis"]["risk_level"], 3), i["domain"]))
        return result

    async def _integration_manifest(self, domain: str) -> dict[str, Any]:
        """Liest Manifest-Infos einer Integration (defensiv)."""
        try:
            from homeassistant.loader import async_get_integration

            integration = await async_get_integration(self.hass, domain)
            return {
                "is_custom": not integration.is_built_in,
                "iot_class": integration.iot_class,
                "dependencies": list(integration.dependencies),
                "after_dependencies": list(integration.after_dependencies),
                "requirements": list(integration.requirements),
            }
        except Exception:  # noqa: BLE001 - Integration evtl. nicht (mehr) vorhanden
            return {"is_custom": None, "iot_class": None}

    def _find_secrets(self, entry) -> list[dict[str, str]]:
        """Sucht API-Keys/Tokens/Passwörter in data und options einer Integration.

        ``entry.data``/``entry.options`` sind in Home Assistant schreibgeschützte
        Mappings (kein ``dict``) und können verschachtelt sein (z. B. OAuth:
        ``token.access_token``) – deshalb wird rekursiv über ``Mapping`` gesucht.
        """
        secrets: list[dict[str, str]] = []

        def _walk(source_name: str, mapping: Mapping, prefix: str, depth: int) -> None:
            for key, value in mapping.items():
                path = f"{prefix}{key}"
                if isinstance(value, Mapping):
                    if depth < 3:
                        _walk(source_name, value, f"{path}.", depth + 1)
                    continue
                # Leere Werte und reine Schalter (True/False) sind keine Secrets.
                if isinstance(value, bool) or value in (None, "", [], {}):
                    continue
                if not is_secret_key(key):
                    continue
                secrets.append(
                    {
                        "source": source_name,
                        "key": path,
                        "value": _mask(value) if self.mask_secrets else str(value),
                        "masked": bool(self.mask_secrets),
                    }
                )

        for source_name, mapping in (("data", entry.data), ("options", entry.options)):
            if isinstance(mapping, Mapping):
                _walk(source_name, mapping, "", 0)
        return secrets

    def _analyze_integration(
        self, entry, info: dict[str, Any], entity_domains: list[str]
    ) -> dict[str, Any]:
        domain = entry.domain
        analysis: dict[str, Any] = {
            "system_access": [],
            "data_flow": [],
            "secrets": [],
            "has_secrets": False,
            "has_external_access": False,
            "has_gps": False,
            "has_camera": False,
            "risk_level": "low",
        }

        for tag, access in SYSTEM_ACCESS_MAP.items():
            if tag in domain and access not in analysis["system_access"]:
                analysis["system_access"].append(access)

        flows: set[str] = set()
        for tag, tag_flows in DATAFLOW_TAGS.items():
            if tag in domain:
                flows |= tag_flows
        analysis["data_flow"] = sorted(flows)

        analysis["has_gps"] = any(
            d in entity_domains for d in ("device_tracker", "geo_location")
        ) or "gps" in flows
        analysis["has_camera"] = "camera" in entity_domains

        iot_class = info.get("iot_class") or ""
        if "cloud" in iot_class or "external" in flows or "cloud" in flows:
            analysis["has_external_access"] = True

        if self.include_secrets:
            analysis["secrets"] = self._find_secrets(entry)
            analysis["has_secrets"] = bool(analysis["secrets"])

        # Risikobewertung (automatisch)
        if analysis["has_gps"] or analysis["has_camera"] or any(
            "Root" in s or "System" in s for s in analysis["system_access"]
        ):
            analysis["risk_level"] = "high"
        elif (
            analysis["has_external_access"]
            or analysis["has_secrets"]
            or len(analysis["system_access"]) >= 1
        ):
            analysis["risk_level"] = "medium"

        # Manueller Override (vom Benutzer im Panel gesetzt) hat Vorrang.
        analysis["risk_level_auto"] = analysis["risk_level"]
        override = self.overrides.get(entry.entry_id)
        if override in RISK_LEVELS:
            analysis["risk_level"] = override
            analysis["risk_overridden"] = True
        else:
            analysis["risk_overridden"] = False

        return analysis

    # ------------------------------------------------------------------ #
    # System / Speicher
    # ------------------------------------------------------------------ #
    async def _scan_system(self) -> dict[str, Any]:
        """CPU/RAM/Disk + Speicher-Aufschlüsselung (blockierend im Executor)."""
        config_dir = self.hass.config.config_dir
        try:
            system = await self.hass.async_add_executor_job(
                collect_system_stats, config_dir, self.include_storage
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("System-/Speicher-Scan fehlgeschlagen: %s", err)
            return {}

        # Bei Supervisor/HA OS liefert die Supervisor-API die echte Datenträger-
        # Belegung des Systems – diese ist aussagekräftiger als der Container-FS.
        host_disk = await self._scan_host_disk()
        if host_disk:
            system["disk_container"] = system.get("disk")
            system["disk"] = host_disk

        # Systemspeicher nach Kategorie (system, addons_data, media, backup …).
        categories = await self._scan_disk_categories()
        if categories:
            system["disk_categories"] = categories

        return system

    async def _scan_disk_categories(self) -> dict[str, Any]:
        """Speicher-Aufschlüsselung nach Kategorie über die Supervisor-Host-API.

        Nutzt ``/host/disks/default/usage`` (falls verfügbar) und liefert die
        Belegung je Kategorie (System, Add-on-Daten, Medien, Backups …).
        """
        token = os.environ.get("SUPERVISOR_TOKEN")
        if not token:
            return {}

        session = async_get_clientsession(self.hass)
        headers = {"Authorization": f"Bearer {token}"}
        self._addon_sizes = {}

        async def _fetch(params: dict[str, Any] | None, seconds: int) -> dict[str, Any]:
            async with session.get(
                f"{SUPERVISOR_URL}/host/disks/default/usage",
                headers=headers,
                params=params,
                timeout=aiohttp.ClientTimeout(total=seconds),
            ) as resp:
                payload = await resp.json()
            result = payload.get("data")
            return result if isinstance(result, dict) else {}

        # Mit max_depth=2 liefert der Supervisor zusätzlich die Unterordner je
        # Kategorie – bei "addons_data"/"addons_config" entspricht der Ordnername
        # dem App-Slug. Klappt das nicht, wird die einfache Übersicht geladen.
        data: dict[str, Any] = {}
        try:
            data = await _fetch({"max_depth": 2}, 45)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Speicher-Kategorien (Tiefe 2) nicht ladbar: %s", err)
        if not data.get("children"):
            try:
                data = await _fetch(None, 15)
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Speicher-Kategorien nicht ladbar: %s", err)
                return {}

        for child in data.get("children", []) or []:
            kind = {"addons_data": "data", "addons_config": "config"}.get(
                child.get("id", "")
            )
            if not kind:
                continue
            for sub in child.get("children", []) or []:
                slug = sub.get("id")
                used = sub.get("used_bytes")
                if not slug or used is None:
                    continue
                self._addon_sizes.setdefault(str(slug), {})[kind] = int(used)

        children = []
        for child in data.get("children", []) or []:
            used = child.get("used_bytes")
            if used is None:
                continue
            children.append(
                {
                    "id": child.get("id", ""),
                    "label": child.get("label") or child.get("id", ""),
                    "used": int(used),
                }
            )
        if not children and data.get("used_bytes") is None:
            return {}

        children.sort(key=lambda c: c["used"], reverse=True)
        return {
            "label": data.get("label") or data.get("id", "Datenträger"),
            "total": data.get("total_bytes"),
            "used": data.get("used_bytes"),
            "children": children,
        }

    async def _scan_host_disk(self) -> dict[str, Any]:
        """Datenträger-Belegung über die Supervisor-Host-API (falls vorhanden)."""
        token = os.environ.get("SUPERVISOR_TOKEN")
        if not token:
            return {}

        session = async_get_clientsession(self.hass)
        headers = {"Authorization": f"Bearer {token}"}
        timeout = aiohttp.ClientTimeout(total=15)
        try:
            async with session.get(
                f"{SUPERVISOR_URL}/host/info", headers=headers, timeout=timeout
            ) as resp:
                payload = await resp.json()
            data = payload.get("data", {})
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Supervisor-Host-Info nicht ladbar: %s", err)
            return {}

        total = data.get("disk_total")
        used = data.get("disk_used")
        free = data.get("disk_free")
        if total is None:
            return {}

        total_b = int(float(total) * _GIB)
        used_b = int(float(used) * _GIB) if used is not None else None
        free_b = int(float(free) * _GIB) if free is not None else None
        percent = (
            round(used_b / total_b * 100, 1)
            if used_b is not None and total_b
            else None
        )
        return {
            "total": total_b,
            "used": used_b,
            "free": free_b,
            "percent": percent,
            "path": "/ (HA Datenträger)",
            "source": "supervisor",
        }

    # ------------------------------------------------------------------ #
    # Bestand & Zustand
    # ------------------------------------------------------------------ #
    def _scan_inventory(self) -> dict[str, Any]:
        """Bestand (Automationen, Helfer …), Entitäts-Zustand und offene Updates."""
        try:
            states = self.hass.states.async_all()
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Zustände nicht lesbar: %s", err)
            return {}

        ent_reg = er.async_get(self.hass)
        by_domain: Counter[str] = Counter(state.domain for state in states)

        # Nicht verfügbare Entitäten – gruppiert nach der Integration dahinter.
        unavailable_by: Counter[str] = Counter()
        unavailable = 0
        for state in states:
            if state.state != "unavailable":
                continue
            unavailable += 1
            entry = ent_reg.async_get(state.entity_id)
            unavailable_by[(entry.platform if entry else None) or state.domain] += 1

        disabled = 0
        hidden = 0
        disabled_by: Counter[str] = Counter()
        for entry in ent_reg.entities.values():
            if entry.disabled_by:
                disabled += 1
                disabled_by[entry.platform or entry.domain] += 1
            if getattr(entry, "hidden_by", None):
                hidden += 1

        updates: list[dict[str, Any]] = []
        for state in states:
            if state.domain != "update" or state.state != "on":
                continue
            attrs = state.attributes
            updates.append(
                {
                    "entity_id": state.entity_id,
                    "name": attrs.get("title")
                    or attrs.get("friendly_name")
                    or state.entity_id,
                    "installed": attrs.get("installed_version"),
                    "latest": attrs.get("latest_version"),
                    "release_url": attrs.get("release_url"),
                }
            )
        updates.sort(key=lambda u: str(u["name"]).lower())

        def _registry_count(module_name: str, attr: str) -> int | None:
            """Anzahl der Einträge einer Registry (None, falls nicht vorhanden)."""
            try:
                module = __import__(
                    f"homeassistant.helpers.{module_name}", fromlist=["async_get"]
                )
                return len(getattr(module.async_get(self.hass), attr))
            except Exception:  # noqa: BLE001
                return None

        try:
            areas: int | None = len(ar.async_get(self.hass).areas)
        except Exception:  # noqa: BLE001
            areas = None

        total_states = len(states)
        return {
            "automations": by_domain.get("automation", 0),
            "scripts": by_domain.get("script", 0),
            "scenes": by_domain.get("scene", 0),
            "helpers": sum(by_domain.get(d, 0) for d in HELPER_DOMAINS),
            "areas": areas,
            "floors": _registry_count("floor_registry", "floors"),
            "labels": _registry_count("label_registry", "labels"),
            "states_total": total_states,
            "unavailable": unavailable,
            "disabled": disabled,
            "hidden": hidden,
            "unavailable_by_integration": [
                {"integration": name, "count": count}
                for name, count in unavailable_by.most_common(MAX_DOMAINS)
            ],
            "disabled_by_integration": [
                {"integration": name, "count": count}
                for name, count in disabled_by.most_common(MAX_DISABLED_ROWS)
            ],
            "domains": [
                {"domain": name, "count": count}
                for name, count in by_domain.most_common(MAX_DOMAINS)
            ],
            "domains_total": len(by_domain),
            "updates": updates[:MAX_UPDATES],
        }

    # ------------------------------------------------------------------ #
    # Datenbank (Recorder)
    # ------------------------------------------------------------------ #
    async def _scan_database(self) -> dict[str, Any]:
        """Welche Entitäten/Statistiken füllen die Recorder-Datenbank am stärksten?

        Die Auswertung ist bei großen Datenbanken teuer und wird deshalb
        zwischengespeichert (siehe ``DB_STATS_TTL``).
        """
        if "recorder" not in self.hass.config.components:
            return {}
        try:
            from homeassistant.components.recorder import (  # noqa: PLC0415
                get_instance,
            )

            instance = get_instance(self.hass)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Recorder nicht verfügbar: %s", err)
            return {}

        cache = self.hass.data.setdefault(DB_CACHE_KEY, {})
        cached = cache.get("data")
        if cached and time.monotonic() - cache.get("ts", 0) < DB_STATS_TTL:
            return cached

        future = cache.get("future")
        if future is None or future.done():
            try:
                future = instance.async_add_executor_job(_query_db_stats, instance)
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Datenbank-Auswertung nicht startbar: %s", err)
                return cached or {}
            cache["future"] = future

        try:
            result = await asyncio.wait_for(
                asyncio.shield(future), timeout=DB_STATS_TIMEOUT
            )
        except asyncio.TimeoutError:
            # Läuft im Hintergrund weiter – der nächste Scan übernimmt das Ergebnis.
            return cached or {"available": True, "pending": True}
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Datenbank-Auswertung fehlgeschlagen: %s", err)
            cache.pop("future", None)
            return cached or {}

        cache.pop("future", None)
        if isinstance(result, dict) and result.get("available"):
            cache["data"] = result
            cache["ts"] = time.monotonic()
            return result
        return cached or {}

    # ------------------------------------------------------------------ #
    # Backups
    # ------------------------------------------------------------------ #
    async def _scan_backup(self) -> dict[str, Any]:
        """Letztes Home-Assistant-Backup (Zeitpunkt, Größe, Name)."""
        result = await self._backup_from_core()
        if not result.get("date"):
            # Nichts über die Backup-Integration gefunden -> Supervisor fragen.
            fallback = await self._backup_from_supervisor()
            if fallback.get("date") or not result:
                result = fallback
        return result or {}

    async def _backup_from_core(self) -> dict[str, Any]:
        """Backups über die Backup-Integration von Home Assistant (alle Speicherorte)."""
        try:
            from homeassistant.components.backup.const import (  # noqa: PLC0415
                DATA_MANAGER,
            )

            manager = self.hass.data.get(DATA_MANAGER)
            if manager is None:
                return {}
            backups, _errors = await asyncio.wait_for(
                manager.async_get_backups(), timeout=15
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Backups (Core) nicht lesbar: %s", err)
            return {}

        entries = []
        for backup in (backups or {}).values():
            sizes = [
                getattr(status, "size", None)
                for status in (getattr(backup, "agents", None) or {}).values()
            ]
            sizes = [size for size in sizes if isinstance(size, (int, float))]
            entries.append(
                {
                    "date": getattr(backup, "date", None),
                    "name": getattr(backup, "name", None),
                    "size": int(max(sizes)) if sizes else None,
                }
            )
        return self._latest_backup(entries, "core")

    async def _backup_from_supervisor(self) -> dict[str, Any]:
        """Backups über die Supervisor-API (Fallback)."""
        token = os.environ.get("SUPERVISOR_TOKEN")
        if not token:
            return {}
        session = async_get_clientsession(self.hass)
        try:
            async with session.get(
                f"{SUPERVISOR_URL}/backups",
                headers={"Authorization": f"Bearer {token}"},
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                payload = await resp.json()
            raw = (payload.get("data") or {}).get("backups") or []
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Backups (Supervisor) nicht lesbar: %s", err)
            return {}

        entries = []
        for backup in raw:
            size = backup.get("size_bytes")
            if size is None and backup.get("size") is not None:
                size = float(backup["size"]) * 1024 * 1024  # MB -> Bytes
            entries.append(
                {
                    "date": backup.get("date"),
                    "name": backup.get("name"),
                    "size": int(size) if size is not None else None,
                }
            )
        return self._latest_backup(entries, "supervisor")

    @staticmethod
    def _latest_backup(entries: list[dict[str, Any]], source: str) -> dict[str, Any]:
        """Wählt aus den Backups das jüngste aus."""

        def _when(entry: dict[str, Any]) -> datetime:
            try:
                parsed = datetime.fromisoformat(str(entry.get("date")))
            except (TypeError, ValueError):
                return datetime.min.replace(tzinfo=timezone.utc)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)

        dated = [entry for entry in entries if entry.get("date")]
        if not dated:
            return {"count": 0, "source": source}
        latest = max(dated, key=_when)
        return {
            "count": len(dated),
            "source": source,
            "date": _when(latest).isoformat(),
            "name": latest.get("name"),
            "size": latest.get("size"),
        }

    # ------------------------------------------------------------------ #
    # Add-ons (Supervisor)
    # ------------------------------------------------------------------ #
    async def _scan_addons(self) -> list[dict[str, Any]]:
        token = os.environ.get("SUPERVISOR_TOKEN")
        if not token:
            _LOGGER.debug("Kein Supervisor gefunden – Add-on-Scan übersprungen")
            return []

        session = async_get_clientsession(self.hass)
        headers = {"Authorization": f"Bearer {token}"}
        timeout = aiohttp.ClientTimeout(total=30)
        addons: list[dict[str, Any]] = []

        try:
            async with session.get(
                f"{SUPERVISOR_URL}/addons", headers=headers, timeout=timeout
            ) as resp:
                payload = await resp.json()
            installed = payload.get("data", {}).get("addons", [])
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Add-on-Liste konnte nicht geladen werden: %s", err)
            return []

        for addon in installed:
            slug = addon.get("slug")
            info = addon
            stats: dict[str, Any] = {}
            if slug:
                try:
                    async with session.get(
                        f"{SUPERVISOR_URL}/addons/{slug}/info",
                        headers=headers,
                        timeout=timeout,
                    ) as resp:
                        detail = await resp.json()
                    info = detail.get("data", addon) or addon
                except Exception as err:  # noqa: BLE001
                    _LOGGER.debug("Add-on-Detail %s nicht ladbar: %s", slug, err)

                stats = await self._addon_stats(session, headers, timeout, slug)

            built = self._build_addon(info)
            built["stats"] = stats
            addons.append(built)

        addons.sort(key=lambda a: (
            {"high": 0, "medium": 1, "low": 2}.get(a["analysis"]["risk_level"], 3),
            a["name"],
        ))
        return addons

    async def _addon_stats(
        self,
        session,
        headers: dict[str, str],
        timeout,
        slug: str,
    ) -> dict[str, Any]:
        """Laufzeit-Ressourcen eines Add-ons (CPU/RAM) über die Supervisor-API."""
        try:
            async with session.get(
                f"{SUPERVISOR_URL}/addons/{slug}/stats",
                headers=headers,
                timeout=timeout,
            ) as resp:
                payload = await resp.json()
            data = payload.get("data", {})
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Add-on-Stats %s nicht ladbar: %s", slug, err)
            return {}

        return {
            "cpu_percent": data.get("cpu_percent"),
            "memory_usage": data.get("memory_usage"),
            "memory_limit": data.get("memory_limit"),
            "memory_percent": data.get("memory_percent"),
            "blk_read": data.get("blk_read"),
            "blk_write": data.get("blk_write"),
        }

    def _build_addon(self, info: dict[str, Any]) -> dict[str, Any]:
        analysis = self._analyze_addon(info)
        return {
            "slug": info.get("slug", ""),
            "name": info.get("name", info.get("slug", "Unbekannt")),
            "version": info.get("version", ""),
            "state": info.get("state", ""),
            "stage": info.get("stage", ""),
            "rating": info.get("rating"),
            "ingress": info.get("ingress", False),
            "url": info.get("url", ""),
            "analysis": analysis,
        }

    def _analyze_addon(self, info: dict[str, Any]) -> dict[str, Any]:
        access: list[str] = []
        risk = "low"

        privileged = info.get("privileged") or []
        if info.get("full_access"):
            access.append("⚠️ Full Hardware Access (Root)")
            risk = "high"
        if privileged:
            access.append("⚠️ Privileged: " + ", ".join(privileged))
            risk = "high"
        if info.get("host_pid"):
            access.append("⚠️ Host PID-Namespace")
            risk = "high"
        if info.get("host_ipc"):
            access.append("⚠️ Host IPC")
        if info.get("docker_api"):
            access.append("🐳 Docker-API (Root-äquivalent)")
            risk = "high"
        if info.get("host_dbus"):
            access.append("🔧 Host D-Bus")
        if info.get("host_network"):
            access.append("🌐 Host-Netzwerk")
            risk = "high" if risk == "high" else "medium"
        role = info.get("hassio_role")
        if info.get("hassio_api"):
            access.append(f"🔧 Supervisor-API ({role or 'default'})")
            if role in ("admin", "manager"):
                risk = "high"
            elif risk == "low":
                risk = "medium"
        if info.get("homeassistant_api"):
            access.append("🏠 Home-Assistant-API")
            if risk == "low":
                risk = "medium"
        if info.get("auth_api"):
            access.append("🔐 Auth-API (Login-Zugriff)")
            if risk == "low":
                risk = "medium"
        if info.get("gpio"):
            access.append("🔌 GPIO")
        if info.get("usb"):
            access.append("🔌 USB")
        devices = info.get("devices") or []
        if devices:
            access.append("🔌 Geräte: " + ", ".join(str(d) for d in devices))
        apparmor = info.get("apparmor")
        if apparmor in (False, "disable", "disabled"):
            access.append("⚠️ AppArmor deaktiviert")
            if risk == "low":
                risk = "medium"

        return {
            "system_access": access,
            "risk_level": risk,
            "full_access": bool(info.get("full_access")),
            "host_network": bool(info.get("host_network")),
            "privileged": privileged,
            "hassio_role": role,
        }

    # ------------------------------------------------------------------ #
    # Custom Cards / Lovelace-Ressourcen
    # ------------------------------------------------------------------ #
    async def _scan_custom_cards(self) -> list[dict[str, Any]]:
        cards: list[dict[str, Any]] = []
        lovelace = self.hass.data.get("lovelace")
        resources = None
        if lovelace is not None:
            resources = getattr(lovelace, "resources", None)
            if resources is None and isinstance(lovelace, dict):
                resources = lovelace.get("resources")

        if resources is None:
            return cards

        try:
            if hasattr(resources, "async_get_info"):
                await resources.async_get_info()
            items = resources.async_items()
            for item in items:
                cards.append(
                    {
                        "id": item.get("id", ""),
                        "type": item.get("type", ""),
                        "url": item.get("url", ""),
                    }
                )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Lovelace-Ressourcen nicht ladbar: %s", err)

        # Speichergröße je Card über das Dateisystem ermitteln (im Executor).
        if self.include_storage and cards:
            urls = [c["url"] for c in cards if c.get("url")]
            try:
                sizes = await self.hass.async_add_executor_job(
                    measure_custom_card_sizes, self.hass.config.config_dir, urls
                )
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Custom-Card-Größen nicht ermittelbar: %s", err)
                sizes = {}
            for card in cards:
                info = sizes.get(card.get("url")) or {}
                card["size_bytes"] = info.get("bytes")
                card["size_scope"] = info.get("scope")
                card["size_path"] = info.get("path")

        return cards

    # ------------------------------------------------------------------ #
    # Blueprints
    # ------------------------------------------------------------------ #
    async def _scan_blueprints(self) -> list[dict[str, Any]]:
        blueprints: list[dict[str, Any]] = []
        bp_data = self.hass.data.get("blueprint")
        if not bp_data:
            return blueprints

        for domain, domain_bp in list(bp_data.items()):
            try:
                results = await domain_bp.async_get_blueprints()
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Blueprints für %s nicht ladbar: %s", domain, err)
                continue

            for path, blueprint in results.items():
                if blueprint is None:
                    continue
                metadata = getattr(blueprint, "metadata", {}) or {}
                blueprints.append(
                    {
                        "domain": domain,
                        "path": path,
                        "name": metadata.get("name", path),
                        "author": metadata.get("author", ""),
                        "source_url": metadata.get("source_url", ""),
                    }
                )

        # Dateigröße der Blueprint-YAMLs ermitteln (im Executor).
        if self.include_storage and blueprints:
            specs = [(b["domain"], b["path"]) for b in blueprints]
            try:
                sizes = await self.hass.async_add_executor_job(
                    measure_blueprint_sizes, self.hass.config.config_dir, specs
                )
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Blueprint-Größen nicht ermittelbar: %s", err)
                sizes = []
            for blueprint, size in zip(blueprints, sizes):
                blueprint["size_bytes"] = size

        return blueprints

    # ------------------------------------------------------------------ #
    # Benutzer & Tokens
    # ------------------------------------------------------------------ #
    async def _scan_users_and_tokens(
        self,
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        users: list[dict[str, Any]] = []
        tokens: list[dict[str, Any]] = []
        now = datetime.now(timezone.utc)

        try:
            all_users = await self.hass.auth.async_get_users()
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Benutzer nicht ladbar: %s", err)
            return users, tokens

        for user in all_users:
            users.append(
                {
                    "id": user.id,
                    "name": user.name,
                    "is_owner": user.is_owner,
                    "is_active": user.is_active,
                    "system_generated": user.system_generated,
                    "groups": [g.id for g in user.groups],
                    "local_only": getattr(user, "local_only", False),
                }
            )

            for token in user.refresh_tokens.values():
                created = getattr(token, "created_at", None)
                last_used = getattr(token, "last_used_at", None)
                ttype = str(getattr(token.token_type, "value", token.token_type))
                is_long_lived = ttype == "long_lived_access_token"
                never_used = last_used is None
                days_since_used = (
                    (now - last_used).days if last_used is not None else None
                )
                stale = is_long_lived and (
                    never_used
                    or (
                        days_since_used is not None
                        and days_since_used >= STALE_TOKEN_DAYS
                    )
                )
                tokens.append(
                    {
                        "user": user.name,
                        "client_name": getattr(token, "client_name", None)
                        or getattr(token, "client_id", "") or "",
                        "type": ttype,
                        "is_long_lived": is_long_lived,
                        "never_used": never_used,
                        "days_since_used": days_since_used,
                        "stale": stale,
                        "created_at": created.isoformat() if created else "",
                        "last_used_at": last_used.isoformat() if last_used else "nie",
                        "last_used_ip": getattr(token, "last_used_ip", "") or "",
                    }
                )

        return users, tokens

    # ------------------------------------------------------------------ #
    # Wichtige Fehler (System-Log, nur ERROR/CRITICAL – keine Warnungen)
    # ------------------------------------------------------------------ #
    def _scan_errors(self) -> list[dict[str, Any]]:
        errors: list[dict[str, Any]] = []
        handler = self.hass.data.get("system_log")
        records = getattr(handler, "records", None)
        if records is None:
            return errors

        try:
            entries = records.to_list()
        except Exception:  # noqa: BLE001
            try:
                entries = [rec.to_dict() for rec in records.values()]
            except Exception:  # noqa: BLE001
                return errors

        for entry in entries:
            level = str(entry.get("level", "")).upper()
            if level not in ("ERROR", "CRITICAL"):
                continue

            message = entry.get("message", "")
            if isinstance(message, (list, tuple)):
                message = message[0] if message else ""

            source = entry.get("source", "")
            if isinstance(source, (list, tuple)):
                source = source[0] if source else ""

            timestamp = entry.get("timestamp")
            if isinstance(timestamp, (int, float)):
                timestamp = datetime.fromtimestamp(
                    timestamp, tz=timezone.utc
                ).isoformat()

            errors.append(
                {
                    "level": level,
                    "name": entry.get("name", ""),
                    "message": str(message)[:400],
                    "source": str(source),
                    "count": entry.get("count", 1),
                    "timestamp": timestamp or "",
                }
            )

        errors.sort(key=lambda e: e.get("timestamp", ""), reverse=True)
        return errors[:MAX_ERRORS]
