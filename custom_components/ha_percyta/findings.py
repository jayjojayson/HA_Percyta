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
                f"{ftype}:{st.entity_id}", ftype, "orphans", "low", confidence,
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
                params={"user": tok.get("user"), "never": never, "days": days},
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
    run("tokens", _token_findings, data, now)
    run("integrations", _integration_findings, data)
    if data.get("addons"):
        run("addons", _addon_findings, data)
    run("backup", _backup_findings, data, now)
    run("disk", _disk_findings, data)
    run("database", _db_findings, data)
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
