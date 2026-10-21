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
}


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
        "items": items[:MAX_FINDING_ITEMS],
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


def _find_broken_refs(hass: HomeAssistant) -> list[dict[str, Any]] | None:
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
def _entity_findings(hass: HomeAssistant, now: datetime) -> list[dict[str, Any]]:
    ent_reg = er.async_get(hass)
    findings: list[dict[str, Any]] = []

    # Config-Entries, die nicht laufen → gemeinsame Ursache für ihre Entitäten.
    broken_entries: dict[str, Any] = {}
    for entry in hass.config_entries.async_entries():
        state = str(getattr(entry.state, "value", entry.state))
        if entry.source == "ignore":
            continue  # ignorierte Entdeckung – keine installierte Integration
        if state in NOT_RUNNING_STATES and not entry.disabled_by:
            broken_entries[entry.entry_id] = (entry, state)

    covered: set[str] = set()  # Entitäten, die schon durch "Integration läuft nicht" erklärt sind
    for entry_id, (entry, state_name) in broken_entries.items():
        items = []
        for ent in er.async_entries_for_config_entry(ent_reg, entry_id):
            st = hass.states.get(ent.entity_id)
            if st is not None and st.state == "unavailable":
                covered.add(ent.entity_id)
                items.append(
                    {"name": _name(st, ent.entity_id), "ref": ent.entity_id, "kind": "entity"}
                )
        findings.append(
            _finding(
                f"integration_not_loaded:{entry_id}", "integration_not_loaded",
                "integrity", "high" if items else "medium", 90,
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
        reg = ent_reg.async_get(st.entity_id)
        platform = (reg.platform if reg else None) or st.domain
        item = {"name": _name(st, st.entity_id), "ref": st.entity_id, "kind": "entity"}
        if st.attributes.get("restored"):
            orphaned.setdefault(platform, []).append(item)
        else:
            unavailable.setdefault(platform, []).append(item)

    for platform, items in unavailable.items():
        items.sort(key=lambda i: i["name"].lower())
        findings.append(
            _finding(
                f"unavailable_entities:{platform}", "unavailable_entities", "orphans",
                "medium" if len(items) >= 10 else "low", 75,
                platform, "integration", subject_ref=platform,
                params={"count": len(items), "domain": platform},
                items=items,
                link=f"/config/integrations/integration/{platform}",
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
                link="/config/entities",
                details={"domain": platform, "orphaned": len(items)},
            )
        )

    # Ungenutzte Automationen / Skripte (lange nicht ausgelöst).
    limit = timedelta(days=UNUSED_AFTER_DAYS)
    for st in hass.states.async_all():
        if st.domain == "automation":
            if st.state != "on":
                continue  # bewusst ausgeschaltet
            ftype, kind = "unused_automation", "automation"
        elif st.domain == "script":
            ftype, kind = "unused_script", "script"
        else:
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
}


def _automation_findings(
    hass: HomeAssistant, traces: dict[str, list[dict[str, Any]]] | None
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
                if getattr(device, "disabled_by", None):
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
                    link=f"/history?entity_id={eid}",
                    details={"entity_id": eid, "rows": rows, "share_percent": share,
                             "states_total": total},
                )
            )
    return findings


def _device_findings(hass: HomeAssistant) -> list[dict[str, Any]]:
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
# Einstieg
# ---------------------------------------------------------------------- #
def build_findings(
    hass: HomeAssistant, data: dict[str, Any]
) -> tuple[list[dict[str, Any]], list[str]]:
    """Erzeugt die Befundliste und nennt die Typen, die in diesem Scan auswertbar waren."""
    now = datetime.now(timezone.utc)
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

    run("refs", _find_broken_refs, hass)
    run("entities", _entity_findings, hass, now)
    traces = None
    try:
        traces = _collect_traces(hass)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Traces nicht lesbar: %s", err)
    try:
        for source, result in _automation_findings(hass, traces).items():
            sources_ok.add(source)
            findings.extend(result)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Automations-Befunde nicht ermittelbar: %s", err)
    try:
        _enrich_unused(findings, traces, hass)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Traces für ungenutzte Automationen nicht auswertbar: %s", err)
    run("devices", _device_findings, hass)
    run("tokens", _token_findings, data, now)
    run("integrations", _integration_findings, data)
    if data.get("addons"):
        run("addons", _addon_findings, data)
    run("backup", _backup_findings, data, now)
    run("disk", _disk_findings, data)
    run("database", _db_findings, data)
    run("database", _db_orphan_findings, data)
    run("updates", _update_findings, data)

    findings.sort(
        key=lambda f: (
            SEVERITY_ORDER.get(f["severity"], 9),
            f["category"],
            str(f["subject"]).lower(),
        )
    )
    findings = findings[:MAX_FINDINGS]
    evaluated = sorted(t for t, src in TYPE_SOURCES.items() if src in sources_ok)
    return findings, evaluated
