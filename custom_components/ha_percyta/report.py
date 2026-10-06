"""Markdown-Report-Generierung für HA Percyta."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

RISK_EMOJI = {"low": "🟢", "medium": "🟡", "high": "🔴"}


def _yesno(value: bool, yes: str = "Ja", no: str = "—") -> str:
    return yes if value else no


def _human_bytes(num: Any) -> str:
    """Bytes menschenlesbar formatieren."""
    if num is None:
        return "—"
    try:
        value = float(num)
    except (TypeError, ValueError):
        return "—"
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(value) < 1024.0:
            return f"{value:.1f} {unit}"
        value /= 1024.0
    return f"{value:.1f} PB"


def _pct(num: Any) -> str:
    return f"{num} %" if num is not None else "—"


def _append_system(lines: list[str], data: dict[str, Any]) -> None:
    """Speicher-/System-Abschnitt an den Report anhängen."""
    system = data.get("system") or {}
    if not system:
        return

    lines.append("\n## 💾 Speicher & System\n")

    disk = system.get("disk") or {}
    ram = system.get("ram") or {}
    swap = system.get("swap") or {}
    cpu = system.get("cpu") or {}
    load = system.get("load") or {}

    lines.append("| Ressource | Wert |")
    lines.append("|---|---|")
    lines.append(
        f"| 🖴 Speicher belegt | {_human_bytes(disk.get('used'))} / "
        f"{_human_bytes(disk.get('total'))} ({_pct(disk.get('percent'))}) |"
    )
    lines.append(f"| 🖴 Speicher frei | {_human_bytes(disk.get('free'))} |")
    lines.append(
        f"| 🧠 RAM | {_human_bytes(ram.get('used'))} / "
        f"{_human_bytes(ram.get('total'))} ({_pct(ram.get('percent'))}) |"
    )
    addon_ram = sum(
        (a.get("stats", {}) or {}).get("memory_usage") or 0
        for a in data.get("addons", [])
    )
    if addon_ram:
        lines.append(f"| 🧩 RAM (Apps) | {_human_bytes(addon_ram)} |")
    if swap.get("total"):
        lines.append(
            f"| 🔁 Swap | {_human_bytes(swap.get('used'))} / "
            f"{_human_bytes(swap.get('total'))} ({_pct(swap.get('percent'))}) |"
        )
    cpu_cores = f" ({cpu.get('count')} Kerne)" if cpu.get("count") else ""
    lines.append(f"| ⚙️ CPU-Auslastung | {_pct(cpu.get('percent'))}{cpu_cores} |")
    if load:
        lines.append(
            f"| 📈 Load (1/5/15 min) | {load.get('1m')} / "
            f"{load.get('5m')} / {load.get('15m')} |"
        )

    # Systemspeicher nach Kategorie (Supervisor)
    categories = system.get("disk_categories") or {}
    cat_children = list(categories.get("children") or [])
    if cat_children:
        lines.append("\n### 🗄️ Systemspeicher nach Kategorie\n")
        lines.append("| Kategorie | Belegt |")
        lines.append("|---|---|")
        for cat in cat_children:
            lines.append(
                f"| {cat.get('label', cat.get('id', '?'))} "
                f"| {_human_bytes(cat.get('used'))} |"
            )

    # Speicher-Aufschlüsselung
    storage = system.get("storage") or {}
    breakdown = storage.get("breakdown") or []
    if breakdown:
        lines.append("\n### 📂 Größte Speicher-Verbraucher (unter `/config`)\n")
        lines.append("| Bereich | Größe |")
        lines.append("|---|---|")
        for item in breakdown:
            lines.append(
                f"| {item.get('name', '?')} | {_human_bytes(item.get('bytes'))} |"
            )

    # Custom-Integrationen (Speicher)
    custom = storage.get("custom_integrations") or []
    if custom:
        lines.append("\n### 🧩 Speicherbedarf der Custom-Integrationen\n")
        lines.append("| Integration | Größe |")
        lines.append("|---|---|")
        for item in custom:
            lines.append(
                f"| `{item.get('domain', '?')}` | {_human_bytes(item.get('bytes'))} |"
            )

    # App-Ressourcen (falls Supervisor-Stats bzw. Größen vorhanden)
    addons = data.get("addons") or []
    addon_rows = [
        a for a in addons if a.get("stats") or a.get("size_bytes") is not None
    ]
    if addon_rows:
        has_size = any(a.get("size_bytes") is not None for a in addon_rows)
        lines.append("\n### 🧩 App-Ressourcen (Laufzeit)\n")
        lines.append("| App | CPU | RAM |" + (" Daten |" if has_size else ""))
        lines.append("|---|---|---|" + ("---|" if has_size else ""))
        for ad in addon_rows:
            stats = ad.get("stats") or {}
            cpu_p = stats.get("cpu_percent")
            mem = stats.get("memory_usage")
            mem_lim = stats.get("memory_limit")
            ram_txt = _human_bytes(mem)
            if mem_lim:
                ram_txt += f" / {_human_bytes(mem_lim)}"
            row = (
                f"| {ad.get('name', '?')} | {_pct(round(cpu_p, 1) if cpu_p is not None else None)} "
                f"| {ram_txt} |"
            )
            if has_size:
                row += f" {_human_bytes(ad.get('size_bytes'))} |"
            lines.append(row)
        if has_size:
            lines.append(
                "\n*Daten = App-Daten + App-Konfiguration laut Supervisor "
                "(ohne das Docker-Image der App).*"
            )


def _fmt_int(value: Any) -> str:
    """Ganzzahl mit Tausenderpunkt."""
    try:
        return f"{int(value):,}".replace(",", ".")
    except (TypeError, ValueError):
        return "—"


def _append_database(lines: list[str], data: dict[str, Any]) -> None:
    """Abschnitt 'Datenbank (Recorder)' – wer füllt die Datenbank am stärksten?"""
    db = data.get("database") or {}
    if not db.get("available"):
        return
    lines.append("\n## 🗄️ Datenbank (Recorder)\n")
    if db.get("pending"):
        lines.append("*Die Datenbank-Auswertung läuft noch – bitte später erneut scannen.*")
        return
    lines.append(
        f"- Zustände: **{_fmt_int(db.get('states_total'))}** Einträge "
        f"von {_fmt_int(db.get('states_entities'))} Entitäten"
    )
    lines.append(
        f"- Statistik: **{_fmt_int(db.get('statistics_long_total'))}** Langzeit- und "
        f"**{_fmt_int(db.get('statistics_short_total'))}** Kurzzeit-Einträge "
        f"von {_fmt_int(db.get('statistics_ids'))} Statistiken"
    )
    states = db.get("states_top") or []
    if states:
        total = db.get("states_total") or 0
        lines.append("\n### 📈 Zustände: Entitäten mit den meisten Einträgen\n")
        lines.append("| Entität | Einträge | Anteil |")
        lines.append("|---|---|---|")
        for row in states:
            share = f"{row.get('rows', 0) / total * 100:.1f} %" if total else "—"
            lines.append(
                f"| `{row.get('entity_id', '?')}` | {_fmt_int(row.get('rows'))} | {share} |"
            )
    stats = db.get("statistics_top") or []
    if stats:
        lines.append("\n### 📊 Langzeitstatistik: Statistiken mit den meisten Einträgen\n")
        lines.append("| Statistik-ID | Langzeit | Kurzzeit (5 min) |")
        lines.append("|---|---|---|")
        for row in stats:
            lines.append(
                f"| `{row.get('statistic_id', '?')}` | {_fmt_int(row.get('long_term'))} "
                f"| {_fmt_int(row.get('short_term'))} |"
            )


def _backup_line(data: dict[str, Any]) -> str | None:
    """Kopfzeile zum letzten HA-Backup."""
    backup = data.get("backup") or {}
    if not backup:
        return None
    if not backup.get("date"):
        return "**Letztes HA-Backup:** keines gefunden  "
    try:
        when = datetime.fromisoformat(str(backup["date"])).strftime("%Y-%m-%d %H:%M %Z")
    except (TypeError, ValueError):
        when = str(backup["date"])
    parts = [when.strip()]
    if backup.get("size") is not None:
        parts.append(_human_bytes(backup.get("size")))
    if backup.get("name"):
        parts.append(str(backup["name"]))
    return "**Letztes HA-Backup:** " + " · ".join(parts) + "  "


NEW_TYPE_LABELS = {
    "integrations": "📦 Integrationen",
    "addons": "🧩 Apps",
    "custom_cards": "🃏 Custom Cards",
    "blueprints": "📐 Blueprints",
    "users": "👤 Benutzer",
}


def _append_new_items(lines: list[str], data: dict[str, Any]) -> None:
    """Abschnitt 'Neu seit letztem Scan' – was genau neu ist."""
    items = data.get("new_items") or []
    if not items:
        return
    lines.append(f"\n## 🆕 Neu seit letztem Scan ({len(items)})\n")
    for key, label in NEW_TYPE_LABELS.items():
        names = [str(i.get("name", "?")) for i in items if i.get("type") == key]
        if names:
            lines.append(f"- {label} ({len(names)}): " + ", ".join(names))


def _append_inventory(lines: list[str], data: dict[str, Any]) -> None:
    """Abschnitt 'Bestand & Zustand'."""
    inv = data.get("inventory") or {}
    if not inv:
        return

    def _n(value: Any) -> str:
        return "—" if value is None else str(value)

    lines.append("\n## 📊 Bestand & Zustand\n")
    lines.append("| Kennzahl | Wert |")
    lines.append("|---|---|")
    lines.append(f"| 🤖 Automationen | {_n(inv.get('automations'))} |")
    lines.append(f"| 📜 Skripte | {_n(inv.get('scripts'))} |")
    lines.append(f"| 🎬 Szenen | {_n(inv.get('scenes'))} |")
    lines.append(f"| 🧰 Helfer | {_n(inv.get('helpers'))} |")
    lines.append(f"| 🏠 Bereiche | {_n(inv.get('areas'))} |")
    if inv.get("floors") is not None:
        lines.append(f"| 🏢 Etagen | {_n(inv.get('floors'))} |")
    if inv.get("labels") is not None:
        lines.append(f"| 🏷️ Labels | {_n(inv.get('labels'))} |")
    lines.append(f"| ⚠️ Nicht verfügbare Entitäten | {_n(inv.get('unavailable'))} |")
    lines.append(f"| 🚫 Deaktivierte Entitäten | {_n(inv.get('disabled'))} |")
    lines.append(f"| 🙈 Versteckte Entitäten | {_n(inv.get('hidden'))} |")
    lines.append(f"| ⬆️ Verfügbare Updates | {len(inv.get('updates') or [])} |")

    updates = inv.get("updates") or []
    if updates:
        lines.append("\n### ⬆️ Verfügbare Updates\n")
        lines.append("| Name | Installiert | Verfügbar |")
        lines.append("|---|---|---|")
        for upd in updates:
            lines.append(
                f"| {upd.get('name', '?')} | {_n(upd.get('installed'))} "
                f"| {_n(upd.get('latest'))} |"
            )

    broken = inv.get("unavailable_by_integration") or []
    if broken:
        lines.append("\n### ⚠️ Nicht verfügbare Entitäten nach Integration\n")
        lines.append("| Integration | Anzahl |")
        lines.append("|---|---|")
        for row in broken:
            lines.append(f"| `{row.get('integration', '?')}` | {row.get('count', 0)} |")

    disabled = inv.get("disabled_by_integration") or []
    if disabled:
        lines.append("\n### 🚫 Deaktivierte Entitäten nach Integration\n")
        lines.append("| Integration | Anzahl |")
        lines.append("|---|---|")
        for row in disabled:
            lines.append(f"| `{row.get('integration', '?')}` | {row.get('count', 0)} |")

    domains = inv.get("domains") or []
    if domains:
        lines.append("\n### 🔢 Entitäten nach Domain\n")
        lines.append("| Domain | Anzahl |")
        lines.append("|---|---|")
        for row in domains:
            lines.append(f"| `{row.get('domain', '?')}` | {row.get('count', 0)} |")


def generate_report(data: dict[str, Any]) -> str:
    """Erzeugt einen Markdown-Report aus den Scan-Daten."""
    counts = data.get("counts", {})
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    lines: list[str] = []

    lines.append("# 🛡️ HA Percyta – Permissions, Privacy & Data Report")
    lines.append("")
    lines.append(f"**Erstellt:** {now}  ")
    if data.get("app_version"):
        lines.append(f"**HA Percyta:** v{data.get('app_version')}  ")
    lines.append(f"**HA-Version:** {data.get('ha_version', 'unknown')}  ")
    lines.append(
        f"**Supervisor:** {'ja' if data.get('is_supervisor') else 'nein'}  "
    )
    backup_line = _backup_line(data)
    if backup_line:
        lines.append(backup_line)

    # Übersicht
    lines.append("\n## 📋 Übersicht\n")
    lines.append(f"- 📦 Integrationen: **{counts.get('integrations', 0)}**")
    lines.append(f"- 🖥️ Geräte: **{counts.get('total_devices', 0)}**")
    lines.append(f"- 🔢 Entitäten: **{counts.get('total_entities', 0)}**")
    lines.append(f"- 🧩 Apps: **{counts.get('addons', 0)}**")
    lines.append(f"- 🃏 Custom Cards: **{counts.get('custom_cards', 0)}**")
    lines.append(f"- 📐 Blueprints: **{counts.get('blueprints', 0)}**")
    lines.append(f"- 👤 Benutzer: **{counts.get('users', 0)}**")
    lines.append(f"- 🔑 Tokens: **{counts.get('tokens', 0)}**")
    lines.append(
        f"- 🔴 High Risk: **{counts.get('high_risk', 0)}** · "
        f"🟡 Medium Risk: **{counts.get('medium_risk', 0)}**"
    )
    lines.append(
        f"- 🔐 Gefundene API-Keys/Secrets: **{counts.get('secrets_found', 0)}**"
    )
    if counts.get("disk_percent") is not None or counts.get("ram_percent") is not None:
        lines.append(
            f"- 💾 Speicher belegt: **{_pct(counts.get('disk_percent'))}** · "
            f"🧠 RAM: **{_pct(counts.get('ram_percent'))}** · "
            f"⚙️ CPU: **{_pct(counts.get('cpu_percent'))}**"
        )

    # Neu seit letztem Scan (mit Namen)
    _append_new_items(lines, data)

    # Speicher & System
    _append_system(lines, data)

    # Bestand & Zustand
    _append_inventory(lines, data)

    # Datenbank (Recorder)
    _append_database(lines, data)

    # Integrationen
    lines.append("\n## 📦 Installierte Integrationen\n")
    integrations = data.get("integrations", [])
    if integrations:
        lines.append(
            "| Risiko | Domain | Titel | Zustand | Quelle | Custom | "
            "Extern | GPS | Kamera | Secrets | Entities |"
        )
        lines.append("|---|---|---|---|---|---|---|---|---|---|---|")
        for i in integrations:
            a = i["analysis"]
            lines.append(
                "| {emoji} {risk} | `{domain}` | {title} | {state} | {source} | "
                "{custom} | {ext} | {gps} | {cam} | {sec} | {ent} |".format(
                    emoji=RISK_EMOJI.get(a["risk_level"], "⚪"),
                    risk=a["risk_level"].upper(),
                    domain=i["domain"],
                    title=i["title"],
                    state=i["state"],
                    source=i["source"],
                    custom=_yesno(bool(i.get("is_custom"))),
                    ext=_yesno(a["has_external_access"]),
                    gps=_yesno(a["has_gps"]),
                    cam=_yesno(a["has_camera"]),
                    sec=_yesno(a["has_secrets"], yes=str(len(a["secrets"]))),
                    ent=i["entity_count"],
                )
            )
    else:
        lines.append("*Keine Integrationen gefunden.*")

    # System-Zugriffe der Integrationen
    lines.append("\n## ⚙️ System-Zugriffe & Datenfluss (Integrationen)\n")
    sys_rows = [i for i in integrations if i["analysis"]["system_access"]]
    if sys_rows:
        lines.append("| Domain | System-Zugriffe | Datenfluss | Risiko |")
        lines.append("|---|---|---|---|")
        for i in sys_rows:
            a = i["analysis"]
            lines.append(
                f"| `{i['domain']}` | {', '.join(a['system_access'])} | "
                f"{', '.join(a['data_flow']) or '—'} | {a['risk_level'].upper()} |"
            )
    else:
        lines.append("*Keine systemrelevanten Zugriffe erkannt.*")

    # API-Keys / Secrets
    lines.append("\n## 🔐 API-Keys, Tokens & Secrets\n")
    secret_rows = [i for i in integrations if i["analysis"]["secrets"]]
    if secret_rows:
        lines.append("| Integration | Quelle | Feld | Wert |")
        lines.append("|---|---|---|---|")
        for i in secret_rows:
            for s in i["analysis"]["secrets"]:
                lines.append(
                    f"| `{i['domain']}` | {s['source']} | `{s['key']}` | "
                    f"`{s['value']}` |"
                )
    else:
        lines.append("*Keine gespeicherten Credentials gefunden.*")

    # Apps (Add-ons)
    lines.append("\n## 🧩 Apps\n")
    addons = data.get("addons", [])
    if addons:
        lines.append("| Risiko | App | Version | Zugriffe |")
        lines.append("|---|---|---|---|")
        for ad in addons:
            a = ad["analysis"]
            access = ", ".join(a["system_access"]) if a["system_access"] else "—"
            lines.append(
                f"| {RISK_EMOJI.get(a['risk_level'], '⚪')} {a['risk_level'].upper()} "
                f"| {ad['name']} | {ad['version']} | {access} |"
            )
    elif data.get("is_supervisor"):
        lines.append("*Keine Apps installiert.*")
    else:
        lines.append("*Kein Supervisor – Apps nicht verfügbar (HA Core).*")

    # Cloud-Datenfluss
    lines.append("\n## ☁️ Cloud-Datenfluss\n")
    cloud_rows = [
        i for i in integrations if i["analysis"].get("has_external_access")
    ]
    if cloud_rows:
        lines.append(
            "*Diese Integrationen tauschen Daten mit externen/Cloud-Diensten aus:*\n"
        )
        lines.append("| Domain | Titel | Ziel/Zugriff | Datenfluss |")
        lines.append("|---|---|---|---|")
        for i in cloud_rows:
            a = i["analysis"]
            target = ", ".join(
                s for s in a.get("system_access", []) if "Cloud" in s or "🌐" in s
            ) or "extern"
            lines.append(
                f"| `{i['domain']}` | {i['title']} | {target} | "
                f"{', '.join(a.get('data_flow', [])) or '—'} |"
            )
    else:
        lines.append("*Keine Integrationen mit externem/Cloud-Datenfluss erkannt.*")

    # Custom Cards
    lines.append("\n## 🃏 Custom Cards (Lovelace-Ressourcen)\n")
    cards = data.get("custom_cards", [])
    if cards:
        has_size = any(c.get("size_bytes") is not None for c in cards)
        if has_size:
            lines.append("| Typ | Größe | URL |")
            lines.append("|---|---|---|")
            for c in cards:
                size = c.get("size_bytes")
                scope = " (Ordner)" if c.get("size_scope") == "folder" else ""
                size_txt = (_human_bytes(size) + scope) if size is not None else "—"
                lines.append(f"| {c.get('type', '')} | {size_txt} | `{c.get('url', '')}` |")
        else:
            lines.append("| Typ | URL |")
            lines.append("|---|---|")
            for c in cards:
                lines.append(f"| {c.get('type', '')} | `{c.get('url', '')}` |")
    else:
        lines.append("*Keine Custom-Card-Ressourcen gefunden.*")

    # Blueprints
    lines.append("\n## 📐 Blueprints\n")
    blueprints = data.get("blueprints", [])
    if blueprints:
        has_bp_size = any(b.get("size_bytes") is not None for b in blueprints)
        if has_bp_size:
            lines.append("| Domain | Name | Autor | Größe | Quelle |")
            lines.append("|---|---|---|---|---|")
            for b in blueprints:
                size = b.get("size_bytes")
                size_txt = _human_bytes(size) if size is not None else "—"
                lines.append(
                    f"| {b['domain']} | {b['name']} | {b.get('author', '') or '—'} | "
                    f"{size_txt} | {b.get('source_url', '') or '—'} |"
                )
        else:
            lines.append("| Domain | Name | Autor | Quelle |")
            lines.append("|---|---|---|---|")
            for b in blueprints:
                lines.append(
                    f"| {b['domain']} | {b['name']} | {b.get('author', '') or '—'} | "
                    f"{b.get('source_url', '') or '—'} |"
                )
    else:
        lines.append("*Keine Blueprints gefunden.*")

    # Benutzer
    lines.append("\n## 👤 Benutzer & Berechtigungen\n")
    users = data.get("users", [])
    if users:
        lines.append("| Name | Owner | Aktiv | System | Gruppen |")
        lines.append("|---|---|---|---|---|")
        for u in users:
            lines.append(
                f"| {u['name']} | {_yesno(u['is_owner'])} | "
                f"{_yesno(u['is_active'])} | {_yesno(u['system_generated'])} | "
                f"{', '.join(u['groups']) or '—'} |"
            )
    else:
        lines.append("*Keine Benutzer gefunden.*")

    # Tokens
    lines.append("\n## 🔑 Access Tokens\n")
    tokens = data.get("tokens", [])
    stale = [t for t in tokens if t.get("stale")]
    if stale:
        lines.append(
            f"> ⚠️ **{len(stale)} Long-Lived-Token** nie oder lange nicht genutzt – "
            "prüfen und ggf. im Profil widerrufen.\n"
        )
    if tokens:
        lines.append("| Benutzer | Client | Typ | Letzte Nutzung | Status |")
        lines.append("|---|---|---|---|---|")
        for t in tokens:
            if not t.get("is_long_lived"):
                status = "—"
            elif t.get("never_used"):
                status = "⚠️ nie genutzt"
            elif t.get("stale"):
                status = f"⚠️ {t.get('days_since_used')}d ungenutzt"
            else:
                status = "ok"
            lines.append(
                f"| {t['user']} | {t['client_name'] or '—'} | {t['type']} | "
                f"{t['last_used_at']} | {status} |"
            )
    else:
        lines.append("*Keine Tokens gefunden.*")

    # Wichtige Fehler
    errors = data.get("errors", [])
    if errors:
        lines.append("\n## ❗ Wichtige Fehler (aus dem HA-System-Log)\n")
        lines.append("| Zeit | Quelle | Anzahl | Meldung |")
        lines.append("|---|---|---|---|")
        for e in errors:
            msg = e.get("message", "").replace("\n", " ").replace("|", "¦")
            lines.append(
                f"| {e.get('timestamp', '')} | `{e.get('source', '')}` | "
                f"{e.get('count', 1)}x | {msg} |"
            )

    lines.append("\n---\n*HA Percyta – lokaler Scan, es werden keine Daten verändert.*")
    return "\n".join(lines)
