"""DataUpdateCoordinator für HA Percyta."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import (
    CONF_INCLUDE_ADDONS,
    CONF_INCLUDE_ERRORS,
    CONF_INCLUDE_SECRETS,
    CONF_INCLUDE_STORAGE,
    CONF_MASK_SECRETS,
    CONF_OUTPUT_DIR,
    CONF_SCAN_AUTO_ENABLED,
    CONF_SCAN_AUTO_INTERVAL,
    CONF_WRITE_REPORT,
    DEFAULT_INCLUDE_ADDONS,
    DEFAULT_INCLUDE_ERRORS,
    DEFAULT_INCLUDE_SECRETS,
    DEFAULT_INCLUDE_STORAGE,
    DEFAULT_MASK_SECRETS,
    DEFAULT_OUTPUT_DIR,
    DEFAULT_SCAN_AUTO_ENABLED,
    DEFAULT_SCAN_AUTO_INTERVAL,
    DEFAULT_WRITE_REPORT,
    DOMAIN,
    EVENT_NEW_FINDINGS,
    OVERRIDES_STORAGE_KEY,
    OVERRIDES_STORAGE_VERSION,
    RISK_LEVELS,
    SNAPSHOT_STORAGE_KEY,
    SNAPSHOT_STORAGE_VERSION,
)
from .report import generate_report
from .scanner import HAPercytaScanner

_LOGGER = logging.getLogger(__name__)


class HAPercytaCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Koordiniert Scans und stellt die Ergebnisse den Entities bereit."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.entry = entry
        options = entry.options

        # Manuelle Risiko-Overrides (entry_id -> "low"/"medium"/"high").
        self._store: Store = Store(
            hass, OVERRIDES_STORAGE_VERSION, OVERRIDES_STORAGE_KEY
        )
        self.overrides: dict[str, str] = {}

        # Vergleichsstand für "Neu seit letztem Scan".
        self._snapshot_store: Store = Store(
            hass, SNAPSHOT_STORAGE_VERSION, SNAPSHOT_STORAGE_KEY
        )
        self._baseline: dict | None = None

        auto_enabled = options.get(CONF_SCAN_AUTO_ENABLED, DEFAULT_SCAN_AUTO_ENABLED)
        interval = options.get(CONF_SCAN_AUTO_INTERVAL, DEFAULT_SCAN_AUTO_INTERVAL)
        update_interval = timedelta(seconds=interval) if auto_enabled else None

        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=update_interval,
        )

    @property
    def _write_report(self) -> bool:
        return self.entry.options.get(CONF_WRITE_REPORT, DEFAULT_WRITE_REPORT)

    @property
    def _output_dir(self) -> str:
        return self.entry.options.get(CONF_OUTPUT_DIR, DEFAULT_OUTPUT_DIR)

    async def async_load_overrides(self) -> None:
        """Manuelle Risiko-Overrides aus dem Store laden."""
        try:
            data = await self._store.async_load()
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Overrides konnten nicht geladen werden: %s", err)
            data = None
        overrides = (data or {}).get("overrides", {}) if isinstance(data, dict) else {}
        # Nur gültige Werte übernehmen.
        self.overrides = {
            str(k): v for k, v in overrides.items() if v in RISK_LEVELS
        }

    async def async_load_baseline(self) -> None:
        """Vergleichsstand für 'Neu seit letztem Scan' laden."""
        try:
            data = await self._snapshot_store.async_load()
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Snapshot konnte nicht geladen werden: %s", err)
            data = None
        self._baseline = data if isinstance(data, dict) else None

    @staticmethod
    def _card_ident(url: Any) -> str | None:
        """Identität einer Custom Card: URL ohne Query (z. B. ``?hacstag=…``).

        Der Query-Teil ändert sich bei jedem Update der Card – ohne ihn wird
        eine aktualisierte Card nicht fälschlich als "neu" gemeldet.
        """
        if not url:
            return None
        return str(url).split("?", 1)[0]

    @classmethod
    def _identities(cls, data: dict[str, Any]) -> dict[str, list]:
        return {
            "integrations": [
                i.get("entry_id") for i in data.get("integrations", []) if i.get("entry_id")
            ],
            "addons": [a.get("slug") for a in data.get("addons", []) if a.get("slug")],
            "custom_cards": [
                cls._card_ident(c.get("url"))
                for c in data.get("custom_cards", [])
                if c.get("url")
            ],
            "blueprints": [
                f"{b.get('domain')}/{b.get('path')}" for b in data.get("blueprints", [])
            ],
            "users": [u.get("id") for u in data.get("users", []) if u.get("id")],
        }

    async def _apply_new_since(self, data: dict[str, Any]) -> None:
        """Markiert neue Einträge gegenüber dem letzten Scan (is_new)."""
        baseline = self._baseline
        first = not isinstance(baseline, dict) or not baseline
        current = self._identities(data)
        new_total = 0
        new_items: list[dict[str, str]] = []
        new_by_type: dict[str, int] = {}

        def mark(items, key, idfn, namefn, normfn=None):
            nonlocal new_total
            base = set((baseline or {}).get(key, []) or [])
            if normfn is not None:
                # Ältere Vergleichsstände enthalten ggf. noch nicht normalisierte Werte.
                base = {normfn(value) for value in base}
            for item in items:
                ident = idfn(item)
                is_new = (not first) and ident is not None and ident not in base
                item["is_new"] = bool(is_new)
                if is_new:
                    new_total += 1
                    new_by_type[key] = new_by_type.get(key, 0) + 1
                    new_items.append({"type": key, "name": str(namefn(item) or ident)})

        def card_name(card):
            ident = self._card_ident(card.get("url")) or ""
            return ident.rstrip("/").rsplit("/", 1)[-1] or ident

        mark(
            data.get("integrations", []),
            "integrations",
            lambda i: i.get("entry_id"),
            lambda i: i.get("title") or i.get("domain"),
        )
        mark(
            data.get("addons", []),
            "addons",
            lambda a: a.get("slug"),
            lambda a: a.get("name") or a.get("slug"),
        )
        mark(
            data.get("custom_cards", []),
            "custom_cards",
            lambda c: self._card_ident(c.get("url")),
            card_name,
            self._card_ident,
        )
        mark(
            data.get("blueprints", []),
            "blueprints",
            lambda b: f"{b.get('domain')}/{b.get('path')}",
            lambda b: b.get("name") or b.get("path"),
        )
        mark(
            data.get("users", []),
            "users",
            lambda u: u.get("id"),
            lambda u: u.get("name"),
        )

        data["new_items"] = new_items
        data.setdefault("counts", {})["new_by_type"] = new_by_type
        data.setdefault("counts", {})["new_total"] = new_total
        data["new_since_available"] = not first

        self._baseline = current
        try:
            await self._snapshot_store.async_save(current)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Snapshot konnte nicht gespeichert werden: %s", err)

        if new_total > 0:
            self.hass.bus.async_fire(
                EVENT_NEW_FINDINGS,
                {"count": new_total, "by_type": new_by_type, "items": new_items},
            )

    async def async_set_override(self, entry_id: str, level: str | None) -> dict:
        """Setzt oder entfernt den manuellen Risiko-Override einer Integration."""
        if not entry_id:
            return {"error": "entry_id fehlt."}
        if level in RISK_LEVELS:
            self.overrides[entry_id] = level
        elif level in (None, "", "auto"):
            self.overrides.pop(entry_id, None)
        else:
            return {"error": f"Ungültige Stufe: {level}"}

        try:
            await self._store.async_save({"overrides": self.overrides})
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Override konnte nicht gespeichert werden: %s", err)
            return {"error": "Speichern fehlgeschlagen."}

        # Neu bewerten (auf Abschluss warten), damit Anzeige/Zähler sofort stimmen.
        await self.async_refresh()
        return {"success": True, "entry_id": entry_id, "level": level or "auto"}

    async def _async_update_data(self) -> dict[str, Any]:
        options = self.entry.options
        scanner = HAPercytaScanner(
            self.hass,
            include_addons=options.get(CONF_INCLUDE_ADDONS, DEFAULT_INCLUDE_ADDONS),
            include_secrets=options.get(
                CONF_INCLUDE_SECRETS, DEFAULT_INCLUDE_SECRETS
            ),
            include_errors=options.get(
                CONF_INCLUDE_ERRORS, DEFAULT_INCLUDE_ERRORS
            ),
            include_storage=options.get(
                CONF_INCLUDE_STORAGE, DEFAULT_INCLUDE_STORAGE
            ),
            mask_secrets=options.get(CONF_MASK_SECRETS, DEFAULT_MASK_SECRETS),
            overrides=self.overrides,
        )

        try:
            data = await scanner.scan_all()
        except Exception as err:  # noqa: BLE001
            raise UpdateFailed(f"Scan fehlgeschlagen: {err}") from err

        # Auto-Scan-Infos für die Anzeige (Letzter/Nächster Scan) mitgeben.
        data["auto_enabled"] = options.get(
            CONF_SCAN_AUTO_ENABLED, DEFAULT_SCAN_AUTO_ENABLED
        )
        data["auto_interval"] = options.get(
            CONF_SCAN_AUTO_INTERVAL, DEFAULT_SCAN_AUTO_INTERVAL
        )

        # "Neu seit letztem Scan" markieren (nach jedem Scan wird der Stand fortgeschrieben).
        await self._apply_new_since(data)

        if self._write_report:
            try:
                path = await self.hass.async_add_executor_job(
                    self._save_report, data
                )
                data["report_path"] = path
            except Exception as err:  # noqa: BLE001
                _LOGGER.warning("Report konnte nicht geschrieben werden: %s", err)
                data["report_path"] = None

        return data

    def _save_report(self, data: dict[str, Any]) -> str:
        """Schreibt den Markdown-Report (läuft im Executor)."""
        report = generate_report(data)
        output_dir = self._output_dir
        if not os.path.isabs(output_dir):
            output_dir = self.hass.config.path(output_dir)
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        path = os.path.join(output_dir, f"ha_percyta_{timestamp}.md")
        with open(path, "w", encoding="utf-8") as file:
            file.write(report)
        _LOGGER.info("HA Percyta-Report geschrieben: %s", path)
        return path
