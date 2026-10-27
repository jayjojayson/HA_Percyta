"""Befund-Engine für HA Percyta.

Leitet aus den Scan-Daten (und dem Zustand von Home Assistant) konkrete
"Befunde" ab: Dinge, die man sich ansehen sollte – mit Ursache, Gewichtung und
einem Sprung an die passende Stelle in Home Assistant.

Die Texte (Titel, Ursache, Empfehlung) stehen NICHT hier, sondern im Panel
(zweisprachig). Ein Befund enthält nur neutrale Daten:

    id, type, category, severity, confidence, subject, subject_type,
    subject_ref, params, items, link, details

Alles hier ist lesend; es wird nichts in Home Assistant verändert.
"""

from __future__ import annotations

import logging
import re
from collections.abc import Mapping
from datetime import datetime, timedelta, timezone
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

try:  # Labels gibt es seit Home Assistant 2024.4
    from homeassistant.helpers import label_registry as lr
except ImportError:  # pragma: no cover
    lr = None
try:  # Etagen ebenso
    from homeassistant.helpers import floor_registry as fr
except ImportError:  # pragma: no cover
    fr = None

from .const import (
    BACKUP_MAX_AGE_DAYS,
    CRITICAL_DOMAINS,
    DB_HOTSPOT_MIN_ROWS,
    DB_HOTSPOT_SHARE,
    DISK_CRIT_PERCENT,
    DISK_WARN_PERCENT,
    MAX_FINDING_ITEMS,
    MAX_FINDINGS,
    NEVER_USED_TOKEN_GRACE_DAYS,
    UNUSED_AFTER_DAYS,
)

_LOGGER = logging.getLogger(__name__)

ENTITY_RE = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2, "info": 3}

# Config-Entry-Zustände, in denen eine Integration NICHT läuft.
NOT_RUNNING_STATES = {
    "setup_error",
    "setup_retry",
    "not_loaded",
    "migration_error",
    "failed_unload",
}

# Befundtypen je Quelle – nur Typen, deren Quelle in diesem Scan auswertbar war,
# können als "behoben" gelten (sonst würde z. B. ein pausierter DB-Scan alles "beheben").
TYPE_SOURCES = {
    "broken_reference": "refs",
    "integration_not_loaded": "entities",
    "unavailable_entities": "entities",
    "orphaned_entities": "entities",
    "unused_automation": "entities",
    "unused_script": "entities",
    "automation_invalid": "automations",
    "automation_errors": "traces",
    "automation_skipped": "traces",
    "automation_refs": "autorefs",
    "automations_off": "automations",
    "db_orphans": "database",
    "orphaned_devices": "devices",
    "stale_token": "tokens",
    "high_risk_integration": "integrations",
    "privileged_app": "addons",
    "secrets_stored": "integrations",
    "backup_old": "backup",
    "backup_missing": "backup",
    "disk_high": "disk",
    "db_hotspot": "database",
    "updates_available": "updates",
    "dashboard_refs": "dashboards",
    "dashboard_resources": "resources",
    "energy_refs": "energy",
    "area_sensor_refs": "areas",
    "empty_areas": "areas",
    "empty_floors": "areas",
    "unused_labels": "areas",
    "unused_blueprints": "blueprints",
}


# Automationen, die bewusst selten oder nie auslösen (Wasser, Rauch, Alarm …):
# Erkannt über HA-eigene Geräteklassen bzw. Domains der Trigger-Entitäten.
SAFETY_DEVICE_CLASSES = frozenset({
    "moisture", "smoke", "gas", "carbon_monoxide", "safety", "problem", "tamper", "heat", "cold",
})
SAFETY_DOMAINS = frozenset({"alarm_control_panel", "siren"})


# ---------------------------------------------------------------------- #
# Kontext: Registries, Bereiche/Labels und HA-eigene Ausschlüsse
# ---------------------------------------------------------------------- #
class _Ctx:
    """Registry-Zugriff für alle Befunde.

    Ausschlüsse folgen nur Home-Assistant-eigenen Mechanismen: deaktivierte
    Einträge (wie bisher) und – optional – Labels, die in den Optionen von
    HA Percyta als „nicht bewerten“ gewählt wurden. Ein Label wirkt auf
    Entität, Gerät, Bereich, Automation und Skript.
    """

    def __init__(self, hass: HomeAssistant, ignore_labels: Any = None) -> None:
        self.hass = hass
        self.ent_reg = er.async_get(hass)
        self.dev_reg = dr.async_get(hass)
        try:
            self.area_reg = ar.async_get(hass)
        except Exception:  # noqa: BLE001
            self.area_reg = None
        self.label_reg = None
        if lr is not None:
            try:
                self.label_reg = lr.async_get(hass)
            except Exception:  # noqa: BLE001
                self.label_reg = None
        self.ignore = {str(x) for x in (ignore_labels or []) if x}
        self.suppressed: dict[str, int] = {"label": 0, "safety": 0}
        self.hidden: set[str] = set()  # Objekte, die wegen eines Labels nicht bewertet wurden
        self._ent: dict[str, tuple[str | None, frozenset[str]]] = {}
        self._dev: dict[str, tuple[str | None, frozenset[str]]] = {}

    # --- Bereiche & Labels ---
    def _area_labels(self, area_id: str | None) -> set[str]:
        if not area_id or self.area_reg is None:
            return set()
        try:
            area = self.area_reg.async_get_area(area_id)
        except Exception:  # noqa: BLE001
            return set()
        return set(getattr(area, "labels", None) or [])

    def _device_raw(self, device_id: str) -> tuple[str | None, set[str]]:
        try:
            dev = self.dev_reg.async_get(device_id)
        except Exception:  # noqa: BLE001
            dev = None
        if dev is None:
            return None, set()
        return getattr(dev, "area_id", None), set(getattr(dev, "labels", None) or [])

    def device_meta(self, device_id: str) -> tuple[str | None, frozenset[str]]:
        if device_id not in self._dev:
            area, labels = self._device_raw(device_id)
            self._dev[device_id] = (area, frozenset(labels | self._area_labels(area)))
        return self._dev[device_id]

    def entity_meta(self, entity_id: str) -> tuple[str | None, frozenset[str]]:
        if entity_id not in self._ent:
            reg = self.ent_reg.async_get(entity_id)
            labels = set(getattr(reg, "labels", None) or []) if reg else set()
            area = getattr(reg, "area_id", None) if reg else None
            device_id = getattr(reg, "device_id", None) if reg else None
            if device_id:
                d_area, d_labels = self._device_raw(device_id)
                labels |= d_labels
                area = area or d_area
            self._ent[entity_id] = (area, frozenset(labels | self._area_labels(area)))
        return self._ent[entity_id]

    def area_name(self, area_id: str | None) -> str | None:
        if not area_id or self.area_reg is None:
            return None
        try:
            area = self.area_reg.async_get_area(area_id)
        except Exception:  # noqa: BLE001
            area = None
        return str(getattr(area, "name", None) or area_id)

    def label_name(self, label_id: str) -> str:
        if self.label_reg is not None:
            try:
                label = self.label_reg.async_get_label(label_id)
                if label is not None and getattr(label, "name", None):
                    return str(label.name)
            except Exception:  # noqa: BLE001
                pass
        return label_id

    # --- Ausschlüsse über Labels ---
    def ignored_entity(self, entity_id: str) -> bool:
        if not self.ignore or not entity_id:
            return False
        if self.entity_meta(entity_id)[1] & self.ignore:
            self.hidden.add(entity_id)
            self.suppressed["label"] = len(self.hidden)
            return True
        return False

    def ignored_device(self, device_id: str) -> bool:
        if not self.ignore or not device_id:
            return False
        if self.device_meta(device_id)[1] & self.ignore:
            self.hidden.add("device:" + device_id)
            self.suppressed["label"] = len(self.hidden)
            return True
        return False

    # --- Schutz-Automationen ---
    def is_safety_config(self, config: Any) -> bool:
        """True, wenn die Trigger auf Alarm-/Wasser-/Rauch-Sensoren o. Ä. zeigen."""
        if not isinstance(config, Mapping):
            return False
        refs: list[tuple[str, str]] = []
        known = SAFETY_DOMAINS | {"binary_sensor"}
        for key in ("triggers", "trigger"):
            if key in config:
                _collect_refs(config.get(key), key, refs, known)
        if "use_blueprint" in config:
            _collect_refs(config.get("use_blueprint"), "use_blueprint", refs, known, True)
        for eid, _path in refs:
            domain = eid.split(".")[0]
            if domain in SAFETY_DOMAINS:
                return True
            if domain != "binary_sensor":
                continue
            st = self.hass.states.get(eid)
            dc = st.attributes.get("device_class") if st is not None else None
            if not dc:
                reg = self.ent_reg.async_get(eid)
                dc = (getattr(reg, "device_class", None) or getattr(reg, "original_device_class", None)) if reg else None
            if str(dc or "") in SAFETY_DEVICE_CLASSES:
                return True
        return False


# ---------------------------------------------------------------------- #
# Hilfsfunktionen
# ---------------------------------------------------------------------- #
def _as_dt(value: Any) -> datetime | None:
    """datetime oder ISO-String → zeitzonenbehaftetes datetime (sonst None)."""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        parsed = value
    else:
        try:
            parsed = datetime.fromisoformat(str(value))
        except (TypeError, ValueError):
            return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _finding(
    fid: str,
    ftype: str,
    category: str,
    severity: str,
    confidence: int,
    subject: str,
    subject_type: str,
    *,
    subject_ref: str | None = None,
    params: dict[str, Any] | None = None,
    items: list[dict[str, Any]] | None = None,
    link: str | None = None,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    items = items or []
    return {
        "id": fid,
        "type": ftype,
        "category": category,
        "severity": severity,
        "confidence": confidence,
        "subject": subject,
        "subject_type": subject_type,
        "subject_ref": subject_ref,
        "params": params or {},
        "items_total": len(items),
        "items": items,  # gekürzt wird erst am Ende (nach Bereich/Label-Auswertung)
        "link": link,
        "details": {k: v for k, v in (details or {}).items() if v not in (None, "")},
    }


def _name(state: Any, fallback: str) -> str:
    if state is None:
        return fallback
    return str(state.attributes.get("friendly_name") or fallback)


# ---------------------------------------------------------------------- #
# Defekte Referenzen (Automationen / Skripte → nicht existierende Entitäten)
# ---------------------------------------------------------------------- #
def _split_ids(value: Any) -> list[str]:
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    if isinstance(value, (list, tuple)):
        out: list[str] = []
        for item in value:
            out.extend(_split_ids(item))
        return out
    return []


def _collect_refs(
    node: Any, path: str, out: list[tuple[str, str]], known_domains: set[str],
    loose: bool = False,
) -> None:
    """Sammelt (entity_id, Pfad) aus einer Automations-/Skript-Konfiguration.

    Streng: Werte unter dem Schlüssel ``entity_id``. Locker (nur für die
    Eingaben eines Blueprints): jeder String, der wie eine Entität einer
    bekannten Domain aussieht.
    """
    if isinstance(node, Mapping):
        for key, value in node.items():
            sub = f"{path}/{key}" if path else str(key)
            if key == "entity_id":
                for eid in _split_ids(value):
                    if ENTITY_RE.match(eid):
                        out.append((eid, sub))
            else:
                _collect_refs(
                    value, sub, out, known_domains,
                    loose or key in ("use_blueprint", "input"),
                )
    elif isinstance(node, (list, tuple)):
        for idx, value in enumerate(node):
            _collect_refs(value, f"{path}/{idx}", out, known_domains, loose)
    elif loose and isinstance(node, str):
        text = node.strip()
        if ENTITY_RE.match(text) and text.split(".")[0] in known_domains:
            out.append((text, path))


def _config_objects(hass: HomeAssistant):
    """Liefert (kind, entity) für alle geladenen Automationen und Skripte."""
    for kind in ("automation", "script"):
        component = hass.data.get(kind)
        entities = getattr(component, "entities", None)
        if entities is None:
            continue
        try:
            yield from ((kind, ent) for ent in list(entities))
        except TypeError:
            continue


def _object_link(kind: str, entity: Any) -> str:
    entity_id = str(getattr(entity, "entity_id", "") or "")
    if kind == "automation":
        unique = getattr(entity, "unique_id", None)
        return f"/config/automation/edit/{unique}" if unique else "/config/automation/dashboard"
    return f"/config/script/edit/{entity_id.split('.', 1)[-1]}" if entity_id else "/config/script/dashboard"


def _find_broken_refs(hass: HomeAssistant, ctx: _Ctx | None = None) -> list[dict[str, Any]] | None:
    """Findet Entitäten, auf die Automationen/Skripte zeigen, die es nicht gibt.

    Gibt None zurück, wenn die Konfigurationen nicht lesbar sind.
    """
    if not hass.is_running:
        return None  # direkt nach dem Start fehlen Entitäten noch → Fehlalarme

    ent_reg = er.async_get(hass)
    known_domains = {s.domain for s in hass.states.async_all()} | {
        e.domain for e in ent_reg.entities.values()
    }

    seen_any = False
    missing: dict[str, list[dict[str, Any]]] = {}
    for kind, entity in _config_objects(hass):
        seen_any = True
        config = getattr(entity, "raw_config", None)
        if not isinstance(config, Mapping):
            continue
        refs: list[tuple[str, str]] = []
        _collect_refs(config, "", refs, known_domains)
        if not refs:
            continue
        entity_id = str(getattr(entity, "entity_id", "") or "")
        if ctx is not None and ctx.ignored_entity(entity_id):
            continue
        state = hass.states.get(entity_id)
        by_target: dict[str, list[str]] = {}
        for eid, path in refs:
            if eid in ("all", "none"):
                continue
            if hass.states.get(eid) is not None or ent_reg.async_get(eid) is not None:
                continue
            by_target.setdefault(eid, []).append(path)
        for eid, paths in by_target.items():
            missing.setdefault(eid, []).append(
                {
                    "name": _name(state, entity_id),
                    "ref": entity_id,
                    "kind": kind,
                    "paths": sorted(set(paths))[:5],
                    "link": _object_link(kind, entity),
                    "active": bool(state is not None and state.state != "off")
                    if kind == "automation" else True,
                }
            )

    if not seen_any:
        return None

    findings: list[dict[str, Any]] = []
    for eid, deps in missing.items():
        deps.sort(key=lambda d: d["name"].lower())
        domain = eid.split(".")[0]
        if domain in CRITICAL_DOMAINS:
            severity = "high"
        elif any(d["active"] for d in deps):
            severity = "medium"
        else:
            severity = "low"
        findings.append(
            _finding(
                f"broken_reference:{eid}", "broken_reference", "integrity", severity, 95,
                eid, "entity", subject_ref=eid,
                params={"count": len(deps), "domain": domain},
                items=deps,
                link=deps[0]["link"] if len(deps) == 1 else None,
                details={"entity_id": eid, "domain": domain, "referenced_by": len(deps)},
            )
        )
    return findings


# ---------------------------------------------------------------------- #
# Entitäten: nicht verfügbar / verwaist / ungenutzt
# ---------------------------------------------------------------------- #
def _entity_findings(hass: HomeAssistant, now: datetime, ctx: _Ctx | None = None) -> list[dict[str, Any]]:
    ent_reg = er.async_get(hass)
    ctx = ctx or _Ctx(hass)
    findings: list[dict[str, Any]] = []
    entry_domains: set[str] = set()

    # Config-Entries, die nicht laufen → gemeinsame Ursache für ihre Entitäten.
    broken_entries: dict[str, Any] = {}
    for entry in hass.config_entries.async_entries():
        state = str(getattr(entry.state, "value", entry.state))
        if entry.source == "ignore":
            continue  # ignorierte Entdeckung – keine installierte Integration
        entry_domains.add(entry.domain)
        if state in NOT_RUNNING_STATES and not entry.disabled_by:
            broken_entries[entry.entry_id] = (entry, state)

    covered: set[str] = set()  # Entitäten, die schon durch "Integration läuft nicht" erklärt sind
    for entry_id, (entry, state_name) in broken_entries.items():
        items = []
        hidden = 0
        for ent in er.async_entries_for_config_entry(ent_reg, entry_id):
            st = hass.states.get(ent.entity_id)
            if st is not None and st.state == "unavailable":
                covered.add(ent.entity_id)
                if ctx.ignored_entity(ent.entity_id):
                    hidden += 1
                    continue
                items.append(
                    {"name": _name(st, ent.entity_id), "ref": ent.entity_id, "kind": "entity"}
                )
        if hidden and not items:
            continue  # alle Entitäten tragen ein ignoriertes Label → bewusst so gewollt
        # setup_retry: HA versucht es selbst weiter (meist Gerät aus/offline) → mittel.
        if state_name == "setup_retry":
            severity = "medium"
        else:
            severity = "high" if items else "medium"
        findings.append(
            _finding(
                f"integration_not_loaded:{entry_id}", "integration_not_loaded",
                "integrity", severity, 90,
                entry.title or entry.domain, "integration", subject_ref=entry_id,
                params={"state": state_name, "count": len(items), "domain": entry.domain},
                items=items,
                link=f"/config/integrations/integration/{entry.domain}",
                details={"domain": entry.domain, "entry_id": entry_id, "state": state_name,
                         "reason": getattr(entry, "reason", None)},
            )
        )

    unavailable: dict[str, list[dict[str, Any]]] = {}
    orphaned: dict[str, list[dict[str, Any]]] = {}
    for st in hass.states.async_all():
        if st.state != "unavailable" or st.entity_id in covered:
            continue
        if st.domain in ("automation", "script"):
            continue  # eigene Befunde unter "Automationen & Skripte"
        if ctx.ignored_entity(st.entity_id):
            continue
        reg = ent_reg.async_get(st.entity_id)
        platform = (reg.platform if reg else None) or st.domain
        item = {"name": _name(st, st.entity_id), "ref": st.entity_id, "kind": "entity"}
        if st.attributes.get("restored"):
            orphaned.setdefault(platform, []).append(item)
        else:
            unavailable.setdefault(platform, []).append(item)

    def _group_link(platform: str, items: list[dict[str, Any]]) -> str | None:
        """Genau ein Objekt → dessen Detail-Dialog; sonst die Integration (falls es sie als Eintrag gibt)."""
        if len(items) == 1:
            return f"#entity:{items[0]['ref']}"
        return f"/config/integrations/integration/{platform}" if platform in entry_domains else None

    for platform, items in unavailable.items():
        items.sort(key=lambda i: i["name"].lower())
        findings.append(
            _finding(
                # Nicht verfügbar ist oft gewollt (Gerät zeitweise aus) → immer nur „niedrig“.
                f"unavailable_entities:{platform}", "unavailable_entities", "orphans",
                "low", 75,
                platform, "integration", subject_ref=platform,
                params={"count": len(items), "domain": platform},
                items=items,
                link=_group_link(platform, items),
                details={"domain": platform, "unavailable": len(items)},
            )
        )
    for platform, items in orphaned.items():
        items.sort(key=lambda i: i["name"].lower())
        findings.append(
            _finding(
                f"orphaned_entities:{platform}", "orphaned_entities", "orphans",
                "low", 85, platform, "integration", subject_ref=platform,
                params={"count": len(items), "domain": platform},
                items=items,
                link=f"#entity:{items[0]['ref']}" if len(items) == 1 else None,
                details={"domain": platform, "orphaned": len(items)},
            )
        )

    # Ungenutzte Automationen / Skripte (lange nicht ausgelöst).
    limit = timedelta(days=UNUSED_AFTER_DAYS)
    configs: dict[str, Any] = {}
    for _kind, obj in _config_objects(hass):
        configs[str(getattr(obj, "entity_id", "") or "")] = getattr(obj, "raw_config", None)
    for st in hass.states.async_all():
        if st.domain == "automation":
            if st.state != "on":
                continue  # bewusst ausgeschaltet
            ftype, kind = "unused_automation", "automation"
        elif st.domain == "script":
            ftype, kind = "unused_script", "script"
        else:
            continue
        if ctx.ignored_entity(st.entity_id):
            continue
        last = _as_dt(st.attributes.get("last_triggered"))
        never = last is None
        if never:
            reg = ent_reg.async_get(st.entity_id)
            created = _as_dt(getattr(reg, "created_at", None)) if reg else None
            if created is None or now - created < limit:
                continue  # Alter unbekannt oder noch jung → kein Befund
            reference, confidence = created, 70
        else:
            if now - last < limit:
                continue
            reference, confidence = last, 60
        if kind == "automation" and ctx.is_safety_config(configs.get(st.entity_id)):
            # Wasser-/Rauch-/Alarm-Automationen sollen möglichst nie auslösen.
            ctx.suppressed["safety"] += 1
            continue
        days = (now - reference).days
        if kind == "automation":
            uid = st.attributes.get("id")
            link = f"/config/automation/edit/{uid}" if uid else "/config/automation/dashboard"
        else:
            link = f"/config/script/edit/{st.entity_id.split('.', 1)[-1]}"
        findings.append(
            _finding(
                f"{ftype}:{st.entity_id}", ftype, "automations", "low", confidence,
                _name(st, st.entity_id), kind, subject_ref=st.entity_id,
                params={"days": days, "never": never},
                link=link,
                details={
                    "entity_id": st.entity_id,
                    "last_triggered": None if never else last.isoformat(),
                    "created_at": reference.isoformat() if never else None,
                    "threshold_days": UNUSED_AFTER_DAYS,
                },
            )
        )
    return findings


# ---------------------------------------------------------------------- #
# Automationen & Skripte: Warum läuft etwas nicht?
# ---------------------------------------------------------------------- #
# Ausführungen, die gar nicht erst gestartet sind, weil die Automation noch lief.
SKIPPED_EXECUTIONS = {"failed_single", "failed_max_runs"}
# Ausführungen mit Fehler.
ERROR_EXECUTIONS = {"error"}
# Pfad-Teile, unter denen "service"/"action" KEINE Aktion bezeichnet (Nutzdaten).
_DATA_KEYS = {"data", "data_template", "event_data", "variables", "target", "fields"}
_TEMPLATE_RES = (
    re.compile(r"""\b(?:states|is_state|is_state_attr|state_attr|has_value|expand|state_translated)\(\s*['"]([a-z0-9_]+\.[a-z0-9_]+)['"]"""),
    re.compile(r"""\bstates\.([a-z0-9_]+)\.([a-z0-9_]+)\b"""),
)
MAX_TRACE_ITEMS = 10


def _object_key(kind: str, entity: Any) -> str | None:
    """Schlüssel, unter dem HA Traces ablegt (Automation: id, Skript: object_id)."""
    if kind == "automation":
        unique = getattr(entity, "unique_id", None)
        return str(unique) if unique else None
    entity_id = str(getattr(entity, "entity_id", "") or "")
    return entity_id.split(".", 1)[-1] if entity_id else None


def _trace_link(kind: str, key: str | None, fallback: str) -> str:
    return f"/config/{kind}/trace/{key}" if key else fallback


def _collect_traces(hass: HomeAssistant) -> dict[str, list[dict[str, Any]]] | None:
    """Kurzfassungen der gespeicherten Läufe je Automation/Skript (neueste zuerst).

    Home Assistant hält je Automation/Skript nur die letzten Läufe vor
    (Standard 5, einstellbar über ``stored_traces``). Gibt None zurück, wenn
    die Trace-Integration nicht geladen ist.
    """
    store = hass.data.get("trace")
    if not isinstance(store, Mapping):
        return None
    out: dict[str, list[dict[str, Any]]] = {}
    for key, bucket in list(store.items()):
        runs = getattr(bucket, "runs", bucket)  # neuere Cores: TraceBuckets
        try:
            traces = list(runs.values())
        except Exception:  # noqa: BLE001
            continue
        shorts: list[dict[str, Any]] = []
        for trace in traces:
            try:
                short = trace.as_short_dict()
            except Exception:  # noqa: BLE001
                continue
            if not isinstance(short, Mapping) or short.get("not_triggered"):
                continue
            if short.get("state") not in (None, "stopped"):
                continue  # läuft gerade noch
            shorts.append(dict(short))
        shorts.sort(key=lambda t: str((t.get("timestamp") or {}).get("start") or ""), reverse=True)
        out[str(key)] = shorts
    return out


def _trace_time(short: Mapping[str, Any]) -> str | None:
    value = (short.get("timestamp") or {}).get("start")
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value) if value else None


def _collect_extra_refs(
    node: Any, path: str, out: dict[str, list[tuple[str, str]]], known_domains: set[str],
    in_data: bool = False,
) -> None:
    """Sammelt Geräte, Bereiche, Aktionen und Entitäten in Templates."""
    if isinstance(node, Mapping):
        for key, value in node.items():
            skey = str(key)
            sub = f"{path}/{skey}" if path else skey
            if skey == "device_id":
                for dev in _split_ids(value):
                    if "{" not in dev:
                        out.setdefault("device", []).append((dev, sub))
                continue
            if skey == "area_id":
                for area in _split_ids(value):
                    if "{" not in area:
                        out.setdefault("area", []).append((area, sub))
                continue
            if skey in ("floor_id", "label_id"):
                for ref in _split_ids(value):
                    if "{" not in ref:
                        out.setdefault(skey[:-3], []).append((ref, sub))
                continue
            if skey in ("service", "action") and not in_data and isinstance(value, str):
                svc = value.strip()
                if ENTITY_RE.match(svc):
                    out.setdefault("action", []).append((svc, sub))
                continue
            _collect_extra_refs(value, sub, out, known_domains, in_data or skey in _DATA_KEYS)
    elif isinstance(node, (list, tuple)):
        for idx, value in enumerate(node):
            _collect_extra_refs(value, f"{path}/{idx}", out, known_domains, in_data)
    elif isinstance(node, str) and ("{{" in node or "{%" in node):
        found: set[str] = set()
        for match in _TEMPLATE_RES[0].finditer(node):
            found.add(match.group(1))
        for match in _TEMPLATE_RES[1].finditer(node):
            found.add(f"{match.group(1)}.{match.group(2)}")
        for eid in found:
            if eid.split(".")[0] in known_domains:
                out.setdefault("template", []).append((eid, path))


def _part_of(path: str) -> str:
    """Erster Pfadteil → trigger / condition / action (für die Anzeige)."""
    head = path.split("/", 1)[0]
    if head in ("trigger", "triggers"):
        return "trigger"
    if head in ("condition", "conditions"):
        return "condition"
    if head in ("action", "actions", "sequence"):
        return "action"
    if head in ("use_blueprint", "input"):
        return "blueprint"
    return "other"


def _entity_issue(
    hass: HomeAssistant, ent_reg: er.EntityRegistry, eid: str
) -> str | None:
    """Problem einer referenzierten Entität (None = in Ordnung)."""
    state = hass.states.get(eid)
    entry = ent_reg.async_get(eid)
    if state is None:
        if entry is None:
            return "missing"
        if entry.disabled_by:
            return "disabled"
        return "no_state"
    if state.attributes.get("restored"):
        return "orphaned"
    if state.state == "unavailable":
        return "unavailable"
    return None


# Gewicht der Probleme für die Schwere des Befunds.
_ISSUE_WEIGHT = {
    "missing": 2, "disabled": 2, "missing_device": 2, "missing_area": 1,
    "unknown_action": 2, "orphaned": 1, "no_state": 1, "unavailable": 0,
    "unknown_trigger_id": 2,
}


def _trigger_ids(config: Mapping[str, Any]) -> set[str] | None:
    """IDs, die die Trigger einer Automation liefern (ohne eigene ID: ihre Position)."""
    triggers = config.get("triggers", config.get("trigger"))
    if triggers is None:
        return None
    if isinstance(triggers, Mapping):
        triggers = [triggers]
    if not isinstance(triggers, (list, tuple)):
        return None
    ids: set[str] = set()
    for idx, trig in enumerate(triggers):
        if not isinstance(trig, Mapping):
            return None  # Trigger aus Vorlagen/Templates – nicht sicher auswertbar
        tid = trig.get("id")
        ids.add(str(idx) if tid is None else str(tid))
    return ids


def _trigger_id_conditions(node: Any, path: str, out: list[tuple[str, str]]) -> None:
    """Bedingungen „Trigger-ID“ (condition: trigger) mit ihren IDs und Pfaden."""
    if isinstance(node, Mapping):
        if node.get("condition") == "trigger" and "id" in node:
            raw = node.get("id")
            values = raw if isinstance(raw, (list, tuple)) else [raw]
            for val in values:
                if val is not None and "{" not in str(val):
                    out.append((str(val), path))
        for key, value in node.items():
            if key in ("triggers", "trigger"):
                continue
            _trigger_id_conditions(value, f"{path}/{key}" if path else str(key), out)
    elif isinstance(node, (list, tuple)):
        for idx, value in enumerate(node):
            _trigger_id_conditions(value, f"{path}/{idx}", out)


def _automation_findings(
    hass: HomeAssistant, traces: dict[str, list[dict[str, Any]]] | None, ctx: _Ctx | None = None
) -> dict[str, list[dict[str, Any]]]:
    """Analysiert jede Automation und jedes Skript.

    Liefert die Befunde je Quelle ("automations", "traces", "autorefs"), damit
    "behoben" nur aus tatsächlich auswertbaren Quellen abgeleitet wird.
    """
    result: dict[str, list[dict[str, Any]]] = {"automations": [], "autorefs": []}
    if traces is not None:
        result["traces"] = []
    if not hass.is_running:
        result.pop("autorefs", None)  # beim Start fehlen Entitäten noch → Fehlalarme

    ent_reg = er.async_get(hass)
    dev_reg = dr.async_get(hass)
    try:
        area_reg = ar.async_get(hass)
    except Exception:  # noqa: BLE001
        area_reg = None
    known_domains = {s.domain for s in hass.states.async_all()} | {
        e.domain for e in ent_reg.entities.values()
    }

    seen = False
    off_items: list[dict[str, Any]] = []
    for kind, entity in _config_objects(hass):
        seen = True
        entity_id = str(getattr(entity, "entity_id", "") or "")
        if not entity_id:
            continue
        if ctx is not None and ctx.ignored_entity(entity_id):
            continue
        state = hass.states.get(entity_id)
        name = _name(state, entity_id)
        key = _object_key(kind, entity)
        edit_link = _object_link(kind, entity)
        trace_link = _trace_link(kind, key, edit_link)
        config = getattr(entity, "raw_config", None)

        # 1) Konfiguration ungültig → HA legt die Automation "nicht verfügbar" an.
        validation_error = getattr(entity, "_validation_error", None)
        if validation_error is not None or type(entity).__name__.startswith("Unavailable"):
            status = getattr(entity, "_validation_status", None)
            status = str(getattr(status, "value", status) or "") or None
            result["automations"].append(
                _finding(
                    f"automation_invalid:{entity_id}", "automation_invalid", "automations",
                    "high", 95, name, kind, subject_ref=entity_id,
                    params={"kind": kind, "status": status},
                    link=edit_link,
                    details={"entity_id": entity_id, "validation_status": status,
                             "validation_error": str(validation_error or "")[:600]},
                )
            )
            continue

        # 2) Ausgeschaltete Automationen (laufen nie).
        if kind == "automation" and state is not None and state.state == "off":
            off_items.append(
                {"name": name, "ref": entity_id, "kind": "automation",
                 "when": state.last_changed.isoformat() if state.last_changed else None,
                 "link": edit_link}
            )

        # 3) Letzte Läufe: Fehler / übersprungen.
        runs = (traces or {}).get(f"{kind}.{key}") if key else None
        if traces is not None and runs:
            errors = [r for r in runs if r.get("error") or r.get("script_execution") in ERROR_EXECUTIONS]
            last = runs[0]
            last_failed = bool(last.get("error") or last.get("script_execution") in ERROR_EXECUTIONS)
            if last_failed:
                all_failed = len(errors) == len(runs) and len(runs) >= 2
                items = [
                    {"name": str(r.get("error") or r.get("script_execution") or "error")[:300],
                     "ref": str(r.get("last_step") or ""), "kind": "run",
                     "when": _trace_time(r), "issue": "error", "link": trace_link}
                    for r in errors[:MAX_TRACE_ITEMS]
                ]
                # Ausgeschaltet → läuft ohnehin nicht mehr; der alte Fehler ist nur noch Hinweis.
                switched_off = kind == "automation" and state is not None and state.state == "off"
                result["traces"].append(
                    _finding(
                        f"automation_errors:{entity_id}", "automation_errors", "automations",
                        "low" if switched_off else ("high" if all_failed else "medium"), 95, name, kind,
                        subject_ref=entity_id,
                        params={"kind": kind, "errors": len(errors), "runs": len(runs),
                                "error": str(last.get("error") or "")[:300], "active": not switched_off},
                        items=items, link=trace_link,
                        details={"entity_id": entity_id, "last_error": str(last.get("error") or "")[:600],
                                 "last_step": last.get("last_step"), "last_run": _trace_time(last),
                                 "runs_stored": len(runs), "runs_failed": len(errors)},
                    )
                )
            skipped = [r for r in runs if r.get("script_execution") in SKIPPED_EXECUTIONS]
            if skipped:
                mode = str((config or {}).get("mode") or "single") if isinstance(config, Mapping) else "single"
                result["traces"].append(
                    _finding(
                        f"automation_skipped:{entity_id}", "automation_skipped", "automations",
                        "low", 90, name, kind, subject_ref=entity_id,
                        params={"kind": kind, "count": len(skipped), "runs": len(runs), "mode": mode},
                        items=[{"name": str(r.get("script_execution")), "ref": str(r.get("run_id") or ""),
                                "kind": "run", "when": _trace_time(r), "issue": str(r.get("script_execution")),
                                "link": trace_link} for r in skipped[:MAX_TRACE_ITEMS]],
                        link=trace_link,
                        details={"entity_id": entity_id, "mode": mode, "runs_stored": len(runs),
                                 "runs_skipped": len(skipped)},
                    )
                )

        # 4) Verweise: fehlende, falsche, verwaiste Entitäten, Geräte, Bereiche, Aktionen.
        if "autorefs" not in result or not isinstance(config, Mapping):
            continue
        refs: list[tuple[str, str]] = []
        _collect_refs(config, "", refs, known_domains)
        extra: dict[str, list[tuple[str, str]]] = {}
        _collect_extra_refs(config, "", extra, known_domains)
        refs.extend(extra.get("template", []))
        template_ids = {eid for eid, _ in extra.get("template", [])}

        problems: dict[tuple[str, str], dict[str, Any]] = {}

        def add(kind_: str, ref: str, issue: str, path: str, label: str | None = None,
                link: str | None = None) -> None:
            item = problems.get((kind_, ref))
            if item is None:
                item = problems[(kind_, ref)] = {
                    "name": label or ref, "ref": ref, "kind": kind_, "issue": issue,
                    "paths": [], "parts": [], "link": link,
                }
            if path not in item["paths"]:
                item["paths"].append(path)
            part = _part_of(path)
            if part not in item["parts"]:
                item["parts"].append(part)

        for eid, path in refs:
            if eid in ("all", "none"):
                continue
            issue = _entity_issue(hass, ent_reg, eid)
            if issue is None:
                continue
            if ctx is not None and issue != "missing" and ctx.ignored_entity(eid):
                continue
            st = hass.states.get(eid)
            # "#entity:" öffnet im Panel den Detail-Dialog der Entität (Einstellungen, Verlauf).
            link = f"#entity:{eid}" if issue != "missing" else f"#finding:broken_reference:{eid}"
            add("template" if eid in template_ids and issue == "missing" else "entity",
                eid, issue, path, _name(st, eid), link)
        for dev, path in extra.get("device", []):
            if dev_reg.async_get(dev) is None:
                add("device", dev, "missing_device", path)
            else:
                device = dev_reg.async_get(dev)
                if getattr(device, "disabled_by", None) and not (ctx is not None and ctx.ignored_device(dev)):
                    add("device", dev, "disabled", path,
                        getattr(device, "name_by_user", None) or getattr(device, "name", None) or dev,
                        f"/config/devices/device/{dev}")
        if area_reg is not None:
            for area, path in extra.get("area", []):
                if area_reg.async_get_area(area) is None:
                    add("area", area, "missing_area", path)
        for svc, path in extra.get("action", []):
            domain, service = svc.split(".", 1)
            if not hass.services.has_service(domain, service):
                add("action", svc, "unknown_action", path)
        if kind == "automation" and "use_blueprint" not in config:
            defined = _trigger_ids(config)
            if defined is not None:
                used: list[tuple[str, str]] = []
                _trigger_id_conditions(config, "", used)
                for tid, path in used:
                    if tid not in defined:
                        add("trigger_id", tid, "unknown_trigger_id", path)

        if not problems:
            continue
        items = sorted(
            problems.values(),
            key=lambda i: (-_ISSUE_WEIGHT.get(i["issue"], 0), i["kind"], str(i["name"]).lower()),
        )
        for item in items:
            item["paths"] = item["paths"][:5]
        weight = max(_ISSUE_WEIGHT.get(i["issue"], 0) for i in items)
        active = kind == "script" or (state is not None and state.state == "on")
        crit = any(i["kind"] == "entity" and i["ref"].split(".")[0] in CRITICAL_DOMAINS
                   and _ISSUE_WEIGHT.get(i["issue"], 0) >= 2 for i in items)
        if crit and active:
            severity = "high"
        elif weight >= 2 and active:
            severity = "medium"
        else:
            severity = "low"
        counts: dict[str, int] = {}
        for item in items:
            counts[item["issue"]] = counts.get(item["issue"], 0) + 1
        result["autorefs"].append(
            _finding(
                f"automation_refs:{entity_id}", "automation_refs", "automations",
                severity, 85, name, kind, subject_ref=entity_id,
                params={"kind": kind, "count": len(items), "issues": counts, "active": active},
                items=items, link=edit_link,
                details={"entity_id": entity_id, "active": active,
                         **{f"issue_{k}": v for k, v in counts.items()}},
            )
        )

    if not seen:
        return {}
    if off_items:
        off_items.sort(key=lambda i: str(i["name"]).lower())
        result["automations"].append(
            _finding(
                "automations_off", "automations_off", "automations", "info", 100,
                "automations", "system", params={"count": len(off_items)},
                items=off_items, link="/config/automation/dashboard",
                details={"count": len(off_items)},
            )
        )
    return result


def _enrich_unused(findings: list[dict[str, Any]], traces: dict[str, list[dict[str, Any]]] | None,
                   hass: HomeAssistant) -> None:
    """Ergänzt 'lange nicht ausgelöst' um blockierende Bedingungen aus den Traces."""
    if not traces:
        return
    by_entity = {}
    for kind, entity in _config_objects(hass):
        key = _object_key(kind, entity)
        if key:
            by_entity[str(getattr(entity, "entity_id", ""))] = f"{kind}.{key}"
    for finding in findings:
        if finding["type"] not in ("unused_automation", "unused_script"):
            continue
        runs = traces.get(by_entity.get(finding["subject_ref"] or "", ""), [])
        blocked = [r for r in runs if r.get("script_execution") == "failed_conditions"]
        if blocked:
            finding["params"]["cond_blocked"] = len(blocked)
            finding["details"]["blocked_by_conditions"] = len(blocked)
            finding["details"]["last_blocked"] = _trace_time(blocked[0])


# ---------------------------------------------------------------------- #
# Sicherheit & Datenschutz
# ---------------------------------------------------------------------- #
def _token_findings(data: dict[str, Any], now: datetime) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    grace = timedelta(days=NEVER_USED_TOKEN_GRACE_DAYS)
    for tok in data.get("tokens", []) or []:
        if not tok.get("stale"):
            continue
        created = _as_dt(tok.get("created_at"))
        never = bool(tok.get("never_used"))
        if never and created is not None and now - created < grace:
            continue  # gerade erst angelegt
        days = tok.get("days_since_used")
        client = tok.get("client_name") or "—"
        fid = f"stale_token:{tok.get('user')}|{client}|{tok.get('created_at')}"
        findings.append(
            _finding(
                fid, "stale_token", "security", "medium", 80 if never else 90,
                f"{client}", "token", subject_ref=str(tok.get("user") or ""),
                params={"user": tok.get("user"), "never": never, "days": days, "token_id": tok.get("id")},
                link="/profile/security",
                details={
                    "user": tok.get("user"),
                    "client_name": client,
                    "created_at": tok.get("created_at"),
                    "last_used_at": tok.get("last_used_at"),
                    "last_used_ip": tok.get("last_used_ip"),
                },
            )
        )
    return findings


def _integration_findings(data: dict[str, Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    secret_items: list[dict[str, Any]] = []
    for integ in data.get("integrations", []) or []:
        ana = integ.get("analysis") or {}
        domain = integ.get("domain") or ""
        title = integ.get("title") or domain
        link = f"/config/integrations/integration/{domain}"
        if ana.get("risk_level") == "high" and not ana.get("risk_overridden"):
            reasons = []
            if ana.get("has_gps"):
                reasons.append("gps")
            if ana.get("has_camera"):
                reasons.append("camera")
            if any("Root" in s or "System" in s for s in ana.get("system_access", [])):
                reasons.append("system")
            findings.append(
                _finding(
                    f"high_risk_integration:{integ.get('entry_id')}", "high_risk_integration",
                    "security", "medium", 50, title, "integration",
                    subject_ref=integ.get("entry_id"),
                    params={"reasons": reasons, "domain": domain},
                    link=link,
                    details={
                        "domain": domain,
                        "iot_class": integ.get("iot_class"),
                        "custom": bool(integ.get("is_custom")),
                        "system_access": ", ".join(ana.get("system_access", [])),
                        "data_flow": ", ".join(ana.get("data_flow", [])),
                    },
                )
            )
        secrets = ana.get("secrets") or []
        if secrets:
            secret_items.append(
                {"name": title, "ref": integ.get("entry_id"), "kind": "integration",
                 "count": len(secrets), "link": link}
            )
    if secret_items:
        secret_items.sort(key=lambda i: i["name"].lower())
        total = sum(i["count"] for i in secret_items)
        findings.append(
            _finding(
                "secrets_stored", "secrets_stored", "security", "info", 40,
                "secrets", "system",
                params={"count": total, "integrations": len(secret_items)},
                items=secret_items,
                details={"values": total, "integrations": len(secret_items)},
            )
        )
    return findings


def _addon_findings(data: dict[str, Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for addon in data.get("addons", []) or []:
        ana = addon.get("analysis") or {}
        if ana.get("risk_level") != "high":
            continue
        slug = addon.get("slug") or ""
        findings.append(
            _finding(
                f"privileged_app:{slug}", "privileged_app", "security", "medium", 55,
                addon.get("name") or slug, "addon", subject_ref=slug,
                params={"full_access": bool(ana.get("full_access")),
                        "host_network": bool(ana.get("host_network")),
                        "privileged": ana.get("privileged") or [],
                        "role": ana.get("hassio_role")},
                link=f"/hassio/addon/{slug}/info" if slug else None,
                details={
                    "slug": slug,
                    "version": addon.get("version"),
                    "state": addon.get("state"),
                    "access": ", ".join(ana.get("system_access", [])),
                },
            )
        )
    return findings


def _backup_findings(data: dict[str, Any], now: datetime) -> list[dict[str, Any]] | None:
    backup = data.get("backup") or {}
    if not backup or "source" not in backup:
        return None  # Quelle nicht auswertbar
    if not backup.get("count") and not backup.get("date"):
        return [
            _finding(
                "backup_missing", "backup_missing", "security", "high", 80,
                "backup", "backup", link="/config/backup",
                details={"source": backup.get("source")},
            )
        ]
    date = _as_dt(backup.get("date"))
    if date is None:
        return []
    days = (now - date).days
    if days < BACKUP_MAX_AGE_DAYS:
        return []
    return [
        _finding(
            "backup_old", "backup_old", "security", "high" if days >= 30 else "medium", 90,
            "backup", "backup", params={"days": days}, link="/config/backup",
            details={"last_backup": date.isoformat(), "name": backup.get("name"),
                     "size": backup.get("size"), "source": backup.get("source")},
        )
    ]


# ---------------------------------------------------------------------- #
# Speicher, Datenbank, Updates
# ---------------------------------------------------------------------- #
def _disk_findings(data: dict[str, Any]) -> list[dict[str, Any]] | None:
    disk = (data.get("system") or {}).get("disk") or {}
    percent = disk.get("percent")
    if not isinstance(percent, (int, float)):
        return None
    if percent < DISK_WARN_PERCENT:
        return []
    return [
        _finding(
            "disk_high", "disk_high", "storage",
            "high" if percent >= DISK_CRIT_PERCENT else "medium", 95,
            "disk", "system", params={"percent": percent},
            link="/config/storage" if data.get("is_supervisor") else None,
            details={"percent": percent, "used": disk.get("used"),
                     "total": disk.get("total"), "free": disk.get("free")},
        )
    ]


def _db_findings(data: dict[str, Any]) -> list[dict[str, Any]] | None:
    db = data.get("database") or {}
    top = db.get("states_top")
    if not top:
        return None
    total = db.get("states_total") or 0
    findings: list[dict[str, Any]] = []
    for row in top[:3]:
        rows = row.get("rows") or 0
        share = round(rows * 100 / total, 1) if total else 0
        if rows >= DB_HOTSPOT_MIN_ROWS and share >= DB_HOTSPOT_SHARE:
            eid = row.get("entity_id")
            findings.append(
                _finding(
                    f"db_hotspot:{eid}", "db_hotspot", "storage", "low", 85,
                    str(eid), "entity", subject_ref=str(eid),
                    params={"rows": rows, "share": share},
                    link=f"#entity:{eid}",
                    details={"entity_id": eid, "rows": rows, "share_percent": share,
                             "states_total": total},
                )
            )
    return findings


def _device_findings(hass: HomeAssistant, ctx: _Ctx | None = None) -> list[dict[str, Any]]:
    """Geräte, deren Integration (Config-Entry) es nicht mehr gibt."""
    dev_reg = dr.async_get(hass)
    ent_reg = er.async_get(hass)
    counts: dict[str, int] = {}
    for ent in ent_reg.entities.values():
        if ent.device_id:
            counts[ent.device_id] = counts.get(ent.device_id, 0) + 1
    items = []
    for device in list(dev_reg.devices.values()):
        entries = list(getattr(device, "config_entries", None) or [])
        if not entries:
            continue
        if any(hass.config_entries.async_get_entry(e) is not None for e in entries):
            continue
        if ctx is not None and ctx.ignored_device(device.id):
            continue
        items.append({
            "name": getattr(device, "name_by_user", None) or device.name or device.id,
            "ref": device.id, "kind": "device", "count": counts.get(device.id, 0),
            "link": f"/config/devices/device/{device.id}",
        })
    if not items:
        return []
    items.sort(key=lambda i: str(i["name"]).lower())
    return [
        _finding(
            "orphaned_devices", "orphaned_devices", "orphans", "low", 90,
            "devices", "system", params={"count": len(items)},
            items=items, link="/config/devices/dashboard",
            details={"count": len(items)},
        )
    ]


def _db_orphan_findings(data: dict[str, Any]) -> list[dict[str, Any]] | None:
    """Datenleichen: Verlauf/Statistik von Entitäten, die es nicht mehr gibt."""
    db = data.get("database") or {}
    orphans = db.get("orphans")
    if orphans is None:
        return None
    if not orphans:
        return []
    rows = sum((o.get("states") or 0) + (o.get("stats") or 0) for o in orphans)
    items = [
        {"name": o.get("id"), "ref": o.get("id"), "kind": "db",
         "count": (o.get("states") or 0) + (o.get("stats") or 0)}
        for o in orphans
    ]
    total = db.get("orphans_total") or len(orphans)
    return [
        _finding(
            "db_orphans", "db_orphans", "storage",
            "low" if rows >= DB_HOTSPOT_MIN_ROWS else "info", 90,
            "database", "system", params={"count": total, "rows": rows},
            items=items, link="#percyta:db-orphans",
            details={"count": total, "rows": rows},
        )
    ]


def _update_findings(data: dict[str, Any]) -> list[dict[str, Any]] | None:
    inventory = data.get("inventory") or {}
    if not inventory:
        return None
    updates = inventory.get("updates") or []
    if not updates:
        return []
    items = [
        {"name": u.get("name"), "ref": u.get("entity_id"), "kind": "update",
         "installed": u.get("installed"), "latest": u.get("latest"),
         "link": u.get("release_url")}
        for u in updates
    ]
    return [
        _finding(
            "updates_available", "updates_available", "storage", "low", 100,
            "updates", "updates", params={"count": len(updates)},
            items=items, link="/config/updates",
            details={"count": len(updates)},
        )
    ]


# ---------------------------------------------------------------------- #
# Konfiguration: Dashboards, Ressourcen, Energie, Bereiche, Etagen, Labels, Blueprints
# ---------------------------------------------------------------------- #
_DASH_ENTITY_KEYS = ("entity", "entity_id", "camera_image", "image_entity")
MAX_DASH_REFS = 3000


def collect_dashboard_refs(config: Mapping[str, Any]) -> list[dict[str, str]]:
    """Entitäten und Bereiche, auf die ein Dashboard zeigt (mit Ansicht › Kartentyp)."""
    out: list[dict[str, str]] = []
    seen: set[tuple[str, str, str]] = set()

    def add(kind: str, ref: str, where: str) -> None:
        key = (kind, ref, where)
        if key in seen or len(out) >= MAX_DASH_REFS:
            return
        seen.add(key)
        out.append({"kind": kind, "ref": ref, "where": where})

    def walk(node: Any, view: str, card: str, depth: int) -> None:
        if depth > 40:
            return
        if isinstance(node, Mapping):
            ctype = node.get("type")
            if isinstance(ctype, str) and ctype:
                card = ctype
            where = f"{view} › {card}" if card else view
            for key, value in node.items():
                if key in _DASH_ENTITY_KEYS:
                    for eid in _split_ids(value):
                        if ENTITY_RE.match(eid):
                            add("entity", eid, where)
                elif key == "entities" and isinstance(value, (list, tuple)):
                    for item in value:
                        if isinstance(item, str):
                            if ENTITY_RE.match(item.strip()):
                                add("entity", item.strip(), where)
                        else:
                            walk(item, view, card, depth + 1)
                elif key in ("area", "area_id"):
                    for area in _split_ids(value):
                        if area and "{" not in area:
                            add("area", area, where)
                elif isinstance(value, (Mapping, list, tuple)):
                    walk(value, view, card, depth + 1)
        elif isinstance(node, (list, tuple)):
            for item in node:
                walk(item, view, card, depth + 1)

    views = config.get("views") if isinstance(config, Mapping) else None
    for idx, view in enumerate(views or []):
        if isinstance(view, Mapping):
            name = view.get("title") or view.get("path") or f"#{idx + 1}"
            walk(view, str(name), "", 0)
    return out


def collect_energy_refs(prefs: Any) -> list[dict[str, str]]:
    """Statistik-/Entitäts-IDs aus den Energie-Einstellungen (Netz, Solar, Batterie, Gas, Wasser, Geräte)."""
    out: list[dict[str, str]] = []

    def walk(node: Any, where: str) -> None:
        if isinstance(node, Mapping):
            here = str(node.get("type") or where)
            for key, value in node.items():
                if isinstance(value, str):
                    if (key.startswith("stat_") or key.startswith("entity_")) and ENTITY_RE.match(value):
                        out.append({"ref": value, "where": f"{here} · {key}"})
                else:
                    walk(value, here if key not in ("device_consumption", "device_consumption_water") else key)
        elif isinstance(node, (list, tuple)):
            for item in node:
                walk(item, where)

    walk(prefs, "energy")
    return out


def _entity_known(hass: HomeAssistant, ent_reg: Any, eid: str) -> bool:
    return hass.states.get(eid) is not None or ent_reg.async_get(eid) is not None


def config_usage(hass: HomeAssistant) -> dict[str, set]:
    """Was Automationen und Skripte verwenden: Bereiche, Etagen, Labels, Blueprints."""
    used: dict[str, set] = {"area": set(), "floor": set(), "label": set(), "blueprint": set()}
    for kind, entity in _config_objects(hass):
        config = getattr(entity, "raw_config", None)
        if not isinstance(config, Mapping):
            continue
        extra: dict[str, list[tuple[str, str]]] = {}
        _collect_extra_refs(config, "", extra, set())
        for key in ("area", "floor", "label"):
            used[key].update(ref for ref, _ in extra.get(key, []))
        bp = config.get("use_blueprint")
        if isinstance(bp, Mapping) and bp.get("path"):
            used["blueprint"].add(f"{kind}:{bp.get('path')}")
    return used


def _registry_list(reg: Any, list_attr: str, dict_attr: str) -> list[Any]:
    if reg is None:
        return []
    fn = getattr(reg, list_attr, None)
    try:
        if callable(fn):
            return list(fn())
        items = getattr(reg, dict_attr, None) or {}
        return list(items.values()) if isinstance(items, Mapping) else list(items)
    except Exception:  # noqa: BLE001
        return []


def _dashboard_findings(hass: HomeAssistant, data: dict[str, Any], ctx: _Ctx) -> list[dict[str, Any]] | None:
    dashboards = (data.get("config_refs") or {}).get("dashboards")
    if dashboards is None:
        return None
    findings: list[dict[str, Any]] = []
    for dash in dashboards:
        items: dict[tuple[str, str], dict[str, Any]] = {}
        for ref in dash.get("refs") or []:
            kind, rid, where = ref.get("kind"), ref.get("ref"), ref.get("where")
            if kind == "entity":
                if _entity_known(hass, ctx.ent_reg, rid):
                    continue
                issue = "missing"
            elif kind == "area":
                if ctx.area_reg is None or ctx.area_reg.async_get_area(rid) is not None:
                    continue
                issue = "missing_area"
            else:
                continue
            item = items.setdefault((kind, rid), {"name": rid, "ref": rid, "kind": kind, "issue": issue, "paths": []})
            if where and where not in item["paths"] and len(item["paths"]) < 5:
                item["paths"].append(where)
        if not items:
            continue
        url = "/" + str(dash.get("id") or "lovelace").lstrip("/")
        findings.append(
            _finding(
                f"dashboard_refs:{dash.get('id')}", "dashboard_refs", "config", "low", 90,
                str(dash.get("title") or dash.get("id")), "dashboard", subject_ref=str(dash.get("id")),
                params={"count": len(items)},
                items=sorted(items.values(), key=lambda i: (i["kind"], i["ref"])),
                link=url,
                details={"dashboard": dash.get("id"), "missing": len(items)},
            )
        )
    return findings


def _resource_findings(data: dict[str, Any]) -> list[dict[str, Any]] | None:
    resources = (data.get("config_refs") or {}).get("resources")
    if resources is None:
        return None
    items = []
    for res in resources:
        if res.get("duplicate"):
            items.append({"name": res.get("url"), "ref": res.get("url"), "kind": "resource", "issue": "duplicate",
                          "count": res.get("duplicate")})
        if res.get("missing_file"):
            items.append({"name": res.get("url"), "ref": res.get("url"), "kind": "resource", "issue": "missing_file"})
    if not items:
        return []
    return [
        _finding(
            "dashboard_resources", "dashboard_resources", "config", "low", 90,
            "resources", "system", params={"count": len(items)}, items=items,
            link="/config/lovelace/resources", details={"count": len(items)},
        )
    ]


def _energy_findings(hass: HomeAssistant, data: dict[str, Any], ctx: _Ctx) -> list[dict[str, Any]] | None:
    refs = (data.get("config_refs") or {}).get("energy")
    if refs is None:
        return None
    items: dict[str, dict[str, Any]] = {}
    for ref in refs:
        rid = ref.get("ref")
        if not rid or _entity_known(hass, ctx.ent_reg, rid):
            continue
        item = items.setdefault(rid, {"name": rid, "ref": rid, "kind": "entity", "issue": "missing", "paths": []})
        if ref.get("where") and len(item["paths"]) < 5:
            item["paths"].append(ref["where"])
    if not items:
        return []
    return [
        _finding(
            "energy_refs", "energy_refs", "config", "low", 90, "energy", "system",
            params={"count": len(items)}, items=sorted(items.values(), key=lambda i: i["ref"]),
            link="/config/energy", details={"count": len(items)},
        )
    ]


def _area_findings(hass: HomeAssistant, data: dict[str, Any], ctx: _Ctx) -> list[dict[str, Any]] | None:
    """Fehlende Bereichs-Sensoren, leere Bereiche/Etagen, ungenutzte Labels."""
    if ctx.area_reg is None or not hass.is_running:
        return None
    areas = _registry_list(ctx.area_reg, "async_list_areas", "areas")
    areas = [a for a in areas if getattr(a, "id", None)]
    devices = list(getattr(ctx.dev_reg, "devices", {}).values())
    entities = list(getattr(ctx.ent_reg, "entities", {}).values())
    usage = config_usage(hass)
    dash = (data.get("config_refs") or {}).get("dashboards") or []
    dash_areas = {r.get("ref") for d in dash for r in d.get("refs") or [] if r.get("kind") == "area"}
    findings: list[dict[str, Any]] = []

    # 1) Temperatur-/Feuchte-Sensor eines Bereichs gibt es nicht mehr.
    sensor_items = []
    for area in areas:
        for attr, issue in (("temperature_entity_id", "missing_temperature"), ("humidity_entity_id", "missing_humidity")):
            eid = getattr(area, attr, None)
            if eid and not _entity_known(hass, ctx.ent_reg, eid):
                sensor_items.append({"name": getattr(area, "name", area.id), "ref": area.id, "kind": "area",
                                     "issue": issue, "paths": [eid], "link": f"/config/areas/area/{area.id}"})
    if sensor_items:
        findings.append(_finding("area_sensor_refs", "area_sensor_refs", "config", "low", 95, "areas", "system",
                                 params={"count": len(sensor_items)}, items=sensor_items,
                                 link="/config/areas/dashboard", details={"count": len(sensor_items)}))

    # 2) Leere Bereiche: keine Geräte, keine Entitäten, kein Verweis.
    used_areas = {getattr(d, "area_id", None) for d in devices} | {getattr(e, "area_id", None) for e in entities}
    used_areas |= usage["area"] | dash_areas
    empty = []
    for area in areas:
        if area.id in used_areas:
            continue
        if ctx.ignore and set(getattr(area, "labels", None) or []) & ctx.ignore:
            continue
        empty.append({"name": getattr(area, "name", area.id), "ref": area.id, "kind": "area",
                      "link": f"/config/areas/area/{area.id}"})
    if empty:
        findings.append(_finding("empty_areas", "empty_areas", "config", "info", 80, "areas", "system",
                                 params={"count": len(empty)}, items=sorted(empty, key=lambda i: str(i["name"]).lower()),
                                 link="/config/areas/dashboard", details={"count": len(empty)}))

    # 3) Leere Etagen: kein Bereich auf der Etage, kein Verweis.
    floor_reg = None
    if fr is not None:
        try:
            floor_reg = fr.async_get(hass)
        except Exception:  # noqa: BLE001
            floor_reg = None
    floors = _registry_list(floor_reg, "async_list_floors", "floors")
    used_floors = {getattr(a, "floor_id", None) for a in areas} | usage["floor"]
    empty_f = [{"name": getattr(f, "name", f.floor_id), "ref": f.floor_id, "kind": "floor"}
               for f in floors if getattr(f, "floor_id", None) and f.floor_id not in used_floors]
    if empty_f:
        findings.append(_finding("empty_floors", "empty_floors", "config", "info", 80, "floors", "system",
                                 params={"count": len(empty_f)}, items=sorted(empty_f, key=lambda i: str(i["name"]).lower()),
                                 link="/config/areas/dashboard", details={"count": len(empty_f)}))

    # 4) Ungenutzte Labels: an nichts vergeben, nirgends verwendet, nicht als „nicht bewerten“ gewählt.
    if ctx.label_reg is not None:
        labels = _registry_list(ctx.label_reg, "async_list_labels", "labels")
        used_labels: set[str] = set(ctx.ignore) | usage["label"]
        for obj in devices + entities + areas + floors:
            used_labels |= set(getattr(obj, "labels", None) or [])
        unused = [{"name": getattr(lab, "name", lab.label_id), "ref": lab.label_id, "kind": "label"}
                  for lab in labels if getattr(lab, "label_id", None) and lab.label_id not in used_labels]
        if unused:
            findings.append(_finding("unused_labels", "unused_labels", "config", "info", 85, "labels", "system",
                                     params={"count": len(unused)}, items=sorted(unused, key=lambda i: str(i["name"]).lower()),
                                     link="/config/labels", details={"count": len(unused)}))
    return findings


def _blueprint_findings(hass: HomeAssistant, data: dict[str, Any]) -> list[dict[str, Any]] | None:
    blueprints = data.get("blueprints")
    if not isinstance(blueprints, list) or not hass.is_running:
        return None
    if not any(True for _ in _config_objects(hass)):
        return None  # Automationen/Skripte nicht lesbar → keine Aussage möglich
    used = config_usage(hass)["blueprint"]
    items = [{"name": b.get("name") or b.get("path"), "ref": f"{b.get('domain')}:{b.get('path')}", "kind": "blueprint",
              "paths": [f"{b.get('domain')}/{b.get('path')}"]}
             for b in blueprints if f"{b.get('domain')}:{b.get('path')}" not in used]
    if not items:
        return []
    return [_finding("unused_blueprints", "unused_blueprints", "config", "info", 85, "blueprints", "system",
                     params={"count": len(items)}, items=sorted(items, key=lambda i: str(i["name"]).lower()),
                     link="/config/blueprint/dashboard", details={"count": len(items)})]


# ---------------------------------------------------------------------- #
# Einstieg
# ---------------------------------------------------------------------- #
def _apply_meta(ctx: _Ctx, findings: list[dict[str, Any]]) -> dict[str, Any]:
    """Bereiche & Labels je Befund (für Filter im Panel), Bereich je Objekt; kürzt die Objektlisten."""
    area_ids: set[str] = set()
    label_ids: set[str] = set()
    for f in findings:
        areas: set[str] = set()
        labels: set[str] = set()

        def take(meta: tuple[str | None, frozenset[str]]) -> str | None:
            area, labs = meta
            if area:
                areas.add(area)
            labels.update(labs)
            return area

        ref = f.get("subject_ref")
        if f.get("subject_type") in ("automation", "script", "entity") and ref and ENTITY_RE.match(str(ref)):
            take(ctx.entity_meta(str(ref)))
        for item in f.get("items") or []:
            kind, iref = item.get("kind"), item.get("ref")
            if not iref or not isinstance(iref, str):
                continue
            area = None
            if kind in ("entity", "automation", "script") and ENTITY_RE.match(iref):
                area = take(ctx.entity_meta(iref))
            elif kind == "device":
                area = take(ctx.device_meta(iref))
            if area:
                item["area"] = ctx.area_name(area)
        f["areas"] = sorted(areas)
        f["labels"] = sorted(labels)
        f["items"] = (f.get("items") or [])[:MAX_FINDING_ITEMS]
        area_ids |= areas
        label_ids |= labels
    all_labels: set[str] = set()
    if ctx.label_reg is not None:
        try:
            all_labels = {str(getattr(lab, "label_id", None) or key) for key, lab in dict(getattr(ctx.label_reg, "labels", {}) or {}).items()}
        except Exception:  # noqa: BLE001
            all_labels = set()
    return {
        "area_names": {a: ctx.area_name(a) for a in sorted(area_ids)},
        # Alle Labels aus Home Assistant (auch ohne Befund) – für Filter und Auswahl im Panel.
        "label_names": {lab: ctx.label_name(lab) for lab in sorted(label_ids | ctx.ignore | all_labels)},
        "ignore_labels": sorted(ctx.ignore),
        "suppressed": dict(ctx.suppressed),
    }


def build_findings(
    hass: HomeAssistant, data: dict[str, Any], *, ignore_labels: Any = None,
    meta: dict[str, Any] | None = None,
) -> tuple[list[dict[str, Any]], list[str]]:
    """Erzeugt die Befundliste und nennt die Typen, die in diesem Scan auswertbar waren.

    ``ignore_labels``: Label-IDs aus Home Assistant, deren Objekte nicht bewertet werden.
    ``meta`` (optional) wird mit Bereichs-/Label-Namen und den Zählern für nicht
    gezählte Befunde gefüllt.
    """
    now = datetime.now(timezone.utc)
    ctx = _Ctx(hass, ignore_labels)
    findings: list[dict[str, Any]] = []
    sources_ok: set[str] = set()

    def run(source: str, fn, *args) -> None:
        try:
            result = fn(*args)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Befunde (%s) nicht ermittelbar: %s", source, err)
            return
        if result is None:
            return
        sources_ok.add(source)
        findings.extend(result)

    run("refs", _find_broken_refs, hass, ctx)
    run("entities", _entity_findings, hass, now, ctx)
    traces = None
    try:
        traces = _collect_traces(hass)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Traces nicht lesbar: %s", err)
    try:
        for source, result in _automation_findings(hass, traces, ctx).items():
            sources_ok.add(source)
            findings.extend(result)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Automations-Befunde nicht ermittelbar: %s", err)
    try:
        _enrich_unused(findings, traces, hass)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Traces für ungenutzte Automationen nicht auswertbar: %s", err)
    run("devices", _device_findings, hass, ctx)
    run("tokens", _token_findings, data, now)
    run("integrations", _integration_findings, data)
    if data.get("addons"):
        run("addons", _addon_findings, data)
    run("backup", _backup_findings, data, now)
    run("disk", _disk_findings, data)
    run("database", _db_findings, data)
    run("database", _db_orphan_findings, data)
    run("updates", _update_findings, data)
    run("dashboards", _dashboard_findings, hass, data, ctx)
    run("resources", _resource_findings, data)
    run("energy", _energy_findings, hass, data, ctx)
    run("areas", _area_findings, hass, data, ctx)
    run("blueprints", _blueprint_findings, hass, data)

    findings.sort(
        key=lambda f: (
            SEVERITY_ORDER.get(f["severity"], 9),
            f["category"],
            str(f["subject"]).lower(),
        )
    )
    findings = findings[:MAX_FINDINGS]
    try:
        info = _apply_meta(ctx, findings)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Bereiche/Labels nicht ermittelbar: %s", err)
        for f in findings:
            f["items"] = (f.get("items") or [])[:MAX_FINDING_ITEMS]
        info = {"suppressed": dict(ctx.suppressed)}
    if meta is not None:
        meta.update(info)
    evaluated = sorted(t for t, src in TYPE_SOURCES.items() if src in sources_ok)
    return findings, evaluated
