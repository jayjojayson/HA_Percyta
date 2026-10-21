"""Datenbank-Werkzeuge für HA Percyta (Recorder).

Ermöglicht es, gezielt an der Recorder-Datenbank zu arbeiten:

* Vorschau: wie viele Zustände/Statistiken liegen zu einer Entität vor?
* Daten löschen: Verlauf (Zustände) und/oder Langzeitstatistik einzelner Entitäten
* Umbenennen: Entität (inkl. Verlauf) auf eine neue, freie ID umbenennen
* Ersetzen: Eine neue Entität übernimmt die ID einer alten (z. B. nach Gerätetausch),
  damit Verlauf und Statistik nahtlos weiterlaufen
* Sicherung: Kopie der SQLite-Datenbank oder ein Home-Assistant-Backup

Sicherheitsprinzipien:

* Es werden ausschließlich die offiziellen Wege von Home Assistant genutzt
  (Dienst ``recorder.purge_entities``, ``Recorder.async_clear_statistics``,
  ``Recorder.async_update_states_metadata``/``async_update_statistics_metadata``,
  Entitäten-Registry). Es wird kein eigenes SQL schreibend ausgeführt.
* Vor jeder Änderung wird – auf Wunsch – eine Sicherung erstellt. Schlägt sie
  fehl, wird die Änderung NICHT ausgeführt.
* Nur eine Aktion gleichzeitig; keine Aktion während einer Datenbank-Migration.
* Jede Aktion wird protokolliert (Store ``ha_percyta_audit`` + Log).
"""

from __future__ import annotations

import asyncio
import errno
import logging
import os
import re
import shutil
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store

from .const import (
    AUDIT_STORAGE_KEY,
    AUDIT_STORAGE_VERSION,
    DB_BACKUP_DIR,
    DB_BACKUP_KEEP,
    DB_BACKUP_MIN_FREE,
    DOMAIN,
    MAX_AUDIT,
)

_LOGGER = logging.getLogger(__name__)

ENTITY_RE = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
# Statistik-IDs: Entitäten (sensor.x) oder externe Statistiken (quelle:name).
STATISTIC_RE = re.compile(r"^[a-z0-9_]+[.:][a-z0-9_]+$")
BACKUP_NAME_RE = re.compile(r"^home-assistant_v2_\d{8}_\d{6}\.db$")
DB_CACHE_KEY = f"{DOMAIN}_db_stats"
RECORDER_WAIT = 90  # Sekunden, die auf den Recorder gewartet wird
JOB_MAX_LINES = 300
PURGE_WATCH_MAX = 3600  # so lange wird der Löschfortschritt höchstens beobachtet (s)
PURGE_POLL = 3
WATCH_MARGIN = 3600  # neue Werte/Nachberechnungen der letzten Stunde zählen beim Beobachten nicht mit (s)


class DbToolError(Exception):
    """Fehler mit Code (wird im Panel übersetzt)."""

    def __init__(self, code: str, message: str = "", **params: Any) -> None:
        super().__init__(message or code)
        self.code = code
        self.params = params


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _ts(value: Any) -> str | None:
    try:
        return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat()
    except (TypeError, ValueError, OSError):
        return None


# ---------------------------------------------------------------------- #
# Lesende Abfragen (laufen im Recorder-Executor, nur lesend)
# ---------------------------------------------------------------------- #
def _session_scope():
    try:
        from homeassistant.helpers.recorder import session_scope  # noqa: PLC0415
    except ImportError:  # ältere Cores
        from homeassistant.components.recorder.util import session_scope  # noqa: PLC0415
    return session_scope


def query_entity_info(instance, ids: list[str], before_ts: float | None = None) -> dict[str, dict[str, Any]]:
    """Zählt Zustände und Statistikzeilen je ID (parametrisierte, lesende Abfragen)."""
    from sqlalchemy import bindparam, text  # noqa: PLC0415

    session_scope = _session_scope()
    out: dict[str, dict[str, Any]] = {
        i: {"states": 0, "stats_long": 0, "stats_short": 0} for i in ids
    }
    if not ids:
        return out
    states_sql = text(
        "SELECT sm.entity_id, COUNT(s.state_id), MIN(s.last_updated_ts), "
        "MAX(s.last_updated_ts) FROM states_meta sm "
        "LEFT JOIN states s ON s.metadata_id = sm.metadata_id "
        "WHERE sm.entity_id IN :ids GROUP BY sm.entity_id"
    ).bindparams(bindparam("ids", expanding=True))
    meta_sql = text(
        "SELECT id, statistic_id, source, unit_of_measurement FROM statistics_meta "
        "WHERE statistic_id IN :ids"
    ).bindparams(bindparam("ids", expanding=True))
    count_sql = {
        "stats_long": text(
            "SELECT COUNT(*), MIN(start_ts), MAX(start_ts) FROM statistics WHERE metadata_id = :mid"
        ),
        "stats_short": text(
            "SELECT COUNT(*), MIN(start_ts), MAX(start_ts) FROM statistics_short_term "
            "WHERE metadata_id = :mid"
        ),
    }
    old_sql = None
    if before_ts is not None:
        old_sql = {
            "states_old": text(
                "SELECT COUNT(*) FROM states s JOIN states_meta sm ON sm.metadata_id = s.metadata_id "
                "WHERE sm.entity_id = :eid AND s.last_updated_ts < :ts"
            ),
            "stats_long_old": text("SELECT COUNT(*) FROM statistics WHERE metadata_id = :mid AND start_ts < :ts"),
            "stats_short_old": text("SELECT COUNT(*) FROM statistics_short_term WHERE metadata_id = :mid AND start_ts < :ts"),
        }
    with session_scope(session=instance.get_session(), read_only=True) as session:
        for entity_id, count, first, last in session.execute(states_sql, {"ids": ids}).all():
            info = out.setdefault(str(entity_id), {"states": 0, "stats_long": 0, "stats_short": 0})
            info["in_states_meta"] = True
            info["states"] = int(count or 0)
            info["states_first"] = _ts(first)
            info["states_last"] = _ts(last)
            if old_sql is not None:
                info["states_old"] = int(session.execute(old_sql["states_old"], {"eid": entity_id, "ts": before_ts}).scalar() or 0)
        for mid, statistic_id, source, unit in session.execute(meta_sql, {"ids": ids}).all():
            info = out.setdefault(str(statistic_id), {"states": 0, "stats_long": 0, "stats_short": 0})
            info["in_statistics_meta"] = True
            info["stats_source"] = source
            info["stats_unit"] = unit
            for key, sql in count_sql.items():
                count, first, last = session.execute(sql, {"mid": mid}).one()
                info[key] = int(count or 0)
                if key == "stats_long":
                    info["stats_first"] = _ts(first)
                    info["stats_last"] = _ts(last)
                else:
                    info["stats_short_first"] = _ts(first)
                    info["stats_short_last"] = _ts(last)
                if old_sql is not None:
                    info[key + "_old"] = int(session.execute(old_sql[key + "_old"], {"mid": mid, "ts": before_ts}).scalar() or 0)
    return out


def query_cleanup_preview(instance, before_ts: float, top: int = 10) -> dict[str, Any]:
    """Was „Aufräumen“ (recorder.purge) löschen würde: Zeilen älter als ``before_ts``.

    Gezählt wird, was der Recorder beim Purge entfernt: Zustände, Ereignisse und
    Kurzzeitstatistik. Langzeitstatistik bleibt erhalten. Nur lesende Abfragen.
    """
    from sqlalchemy import text  # noqa: PLC0415

    session_scope = _session_scope()
    out: dict[str, Any] = {"before": _ts(before_ts)}
    with session_scope(session=instance.get_session(), read_only=True) as session:
        def one(sql: str, **params: Any) -> Any:
            try:
                return session.execute(text(sql), params).scalar()
            except Exception as err:  # noqa: BLE001  (z. B. ältere Schemata)
                _LOGGER.debug("Vorschau-Abfrage fehlgeschlagen: %s", err)
                return None

        out["states"] = int(one("SELECT COUNT(*) FROM states WHERE last_updated_ts < :ts", ts=before_ts) or 0)
        out["states_total"] = int(one("SELECT COUNT(*) FROM states") or 0)
        out["events"] = int(one("SELECT COUNT(*) FROM events WHERE time_fired_ts < :ts", ts=before_ts) or 0)
        out["events_total"] = int(one("SELECT COUNT(*) FROM events") or 0)
        out["stats_short"] = int(one("SELECT COUNT(*) FROM statistics_short_term WHERE start_ts < :ts", ts=before_ts) or 0)
        out["stats_short_total"] = int(one("SELECT COUNT(*) FROM statistics_short_term") or 0)
        out["stats_long_total"] = int(one("SELECT COUNT(*) FROM statistics") or 0)
        out["oldest"] = _ts(one("SELECT MIN(last_updated_ts) FROM states"))
        try:
            rows = session.execute(text(
                "SELECT sm.entity_id, COUNT(*) AS c FROM states s "
                "JOIN states_meta sm ON sm.metadata_id = s.metadata_id "
                "WHERE s.last_updated_ts < :ts GROUP BY sm.entity_id ORDER BY c DESC LIMIT :n"
            ), {"ts": before_ts, "n": top}).all()
            out["top"] = [{"id": str(r[0]), "rows": int(r[1] or 0)} for r in rows]
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Vorschau (Top-Entitäten) fehlgeschlagen: %s", err)
            out["top"] = []
    return out


def _sqlite_path(instance) -> str | None:
    """Pfad der SQLite-Datei (None bei MariaDB/PostgreSQL)."""
    try:
        from sqlalchemy.engine import make_url  # noqa: PLC0415

        url = make_url(str(instance.db_url))
        if url.get_backend_name() != "sqlite":
            return None
        path = url.database
    except Exception:  # noqa: BLE001
        return None
    if not path or path == ":memory:":
        return None
    return path


def _engine_name(instance) -> str | None:
    try:
        return str(instance.engine.dialect.name)
    except Exception:  # noqa: BLE001
        try:
            from sqlalchemy.engine import make_url  # noqa: PLC0415

            return make_url(str(instance.db_url)).get_backend_name()
        except Exception:  # noqa: BLE001
            return None


def db_file_size(src: str) -> int:
    size = os.path.getsize(src)
    if os.path.exists(src + "-wal"):
        size += os.path.getsize(src + "-wal")
    return size


def file_size(path: str) -> int:
    try:
        return os.path.getsize(path)
    except OSError:
        return 0


def copy_sqlite(src: str, dest_dir: str, keep: int, state: dict[str, Any] | None = None,
                replace: bool = False) -> dict[str, Any]:
    """Konsistente Kopie der SQLite-Datenbank (Online-Backup-API von SQLite).

    Die Kopie entsteht in einem Lesevorgang (Snapshot), der Recorder schreibt
    währenddessen weiter. Danach wird die Kopie mit ``PRAGMA quick_check``
    geprüft; erst dann bekommt sie ihren endgültigen Namen.
    """
    os.makedirs(dest_dir, exist_ok=True)
    size = os.path.getsize(src)
    for suffix in ("-wal",):
        if os.path.exists(src + suffix):
            size += os.path.getsize(src + suffix)
    # Reste abgebrochener Kopien (*.db.part) belegen nur Platz – entfernen.
    for left in os.listdir(dest_dir):
        if left.endswith(".part") and BACKUP_NAME_RE.match(left[:-5]):
            try:
                os.remove(os.path.join(dest_dir, left))
            except OSError:
                pass
    own = sorted(f for f in os.listdir(dest_dir) if BACKUP_NAME_RE.match(f))
    own_size = sum(file_size(os.path.join(dest_dir, f)) for f in own)
    free = shutil.disk_usage(dest_dir).free
    needed = size + DB_BACKUP_MIN_FREE
    if free + (own_size if replace else 0) < needed:
        # Nichts löschen, wenn es auch mit dem Ersetzen nicht reichen würde.
        raise DbToolError("no_space", needed=needed, free=free, copies=len(own), copies_size=own_size)
    removed = []
    if replace:
        # Auf Wunsch: vorhandene Percyta-Kopien vorher löschen, um Platz zu schaffen.
        for old in own:
            try:
                os.remove(os.path.join(dest_dir, old))
                removed.append(old)
            except OSError:
                pass
        if state is not None:
            state["replaced"] = removed
        free = shutil.disk_usage(dest_dir).free
        if free < needed:
            raise DbToolError("no_space", needed=needed, free=free, copies=0, copies_size=0)

    name = f"home-assistant_v2_{_now().strftime('%Y%m%d_%H%M%S')}.db"
    dest = os.path.join(dest_dir, name)
    tmp = dest + ".part"
    if state is not None:
        state.update(phase="copy", tmp=tmp, total=size)
    source = sqlite3.connect(src, timeout=60)
    target = sqlite3.connect(tmp)
    try:
        source.backup(target)  # pages=-1: alles in einem Schritt → konsistenter Stand
    except Exception as err:
        target.close()
        source.close()
        try:
            os.remove(tmp)  # halbe Kopie (z. B. Speicher voll) nicht liegen lassen
        except OSError:
            pass
        if "full" in str(err).lower() or getattr(err, "errno", None) == errno.ENOSPC:
            left = [f for f in os.listdir(dest_dir) if BACKUP_NAME_RE.match(f)]
            raise DbToolError(
                "no_space", needed=needed, free=shutil.disk_usage(dest_dir).free, copies=len(left),
                copies_size=sum(file_size(os.path.join(dest_dir, f)) for f in left),
            ) from err
        raise
    target.close()
    source.close()
    if state is not None:
        state["phase"] = "check"
    check = sqlite3.connect(tmp)
    try:
        result = check.execute("PRAGMA quick_check").fetchone()
    finally:
        check.close()
    if not result or result[0] != "ok":
        os.remove(tmp)
        raise DbToolError("backup_check_failed", detail=str(result))
    os.replace(tmp, dest)

    # Ältere Kopien aufräumen (nur eigene Dateien).
    copies = sorted(f for f in os.listdir(dest_dir) if BACKUP_NAME_RE.match(f))
    for old in copies[:-keep] if keep > 0 else []:
        try:
            os.remove(os.path.join(dest_dir, old))
        except OSError:
            pass
    return {"kind": "db_copy", "name": name, "size": os.path.getsize(dest), "replaced": removed}


def space_info(src: str | None, dest_dir: str) -> dict[str, Any]:
    """Größe der Datenbank und freier Platz am Ziel der Kopien."""
    probe = dest_dir if os.path.isdir(dest_dir) else os.path.dirname(dest_dir)
    out: dict[str, Any] = {}
    try:
        out["free"] = shutil.disk_usage(probe).free
    except OSError:
        pass
    if src:
        try:
            out["db_size"] = db_file_size(src)
            out["needed"] = out["db_size"] + DB_BACKUP_MIN_FREE
        except OSError:
            pass
    return out


def list_copies(dest_dir: str) -> list[dict[str, Any]]:
    if not os.path.isdir(dest_dir):
        return []
    out = []
    for name in sorted(os.listdir(dest_dir), reverse=True):
        if not BACKUP_NAME_RE.match(name):
            continue
        path = os.path.join(dest_dir, name)
        try:
            stat = os.stat(path)
        except OSError:
            continue
        out.append({
            "name": name,
            "size": stat.st_size,
            "created": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        })
    return out


def make_clear_stats_task(ids: list[str], short: bool, long: bool, before_ts: float | None):
    """Recorder-Aufgabe: Statistikzeilen gezielt löschen (Kurz- und/oder Langzeit).

    Läuft im Recorder-Thread über dessen eigene Sitzung und Tabellenmodelle –
    genau wie ``clear_statistics_range`` von Home Assistant. Die Metadaten
    bleiben erhalten, damit z. B. die Langzeitstatistik weiterläuft, wenn nur die
    Kurzzeitstatistik gelöscht wird.
    """
    try:
        from homeassistant.components.recorder.db_schema import (  # noqa: PLC0415
            Statistics,
            StatisticsShortTerm,
        )
        from homeassistant.components.recorder.tasks import RecorderTask  # noqa: PLC0415
    except ImportError as err:
        raise DbToolError("not_supported") from err
    session_scope = _session_scope()
    tables = ([StatisticsShortTerm] if short else []) + ([Statistics] if long else [])
    statistic_ids = set(ids)

    class _ClearStatisticsRowsTask(RecorderTask):
        commit_before = True

        def run(self, instance) -> None:  # noqa: D102
            with session_scope(session=instance.get_session()) as session:
                metadata = instance.statistics_meta_manager.get_many(session, statistic_ids=statistic_ids)
                metadata_ids = [mid for mid, _ in metadata.values()]
                if not metadata_ids:
                    return
                for table in tables:
                    query = session.query(table).filter(table.metadata_id.in_(metadata_ids))
                    if before_ts is not None:
                        query = query.filter(table.start_ts < before_ts)
                    query.delete(synchronize_session=False)
            if short:
                try:
                    from homeassistant.components.recorder.statistics import (  # noqa: PLC0415
                        get_short_term_statistics_run_cache,
                    )

                    get_short_term_statistics_run_cache(instance.hass).remove_metadata_ids(metadata_ids)
                except Exception:  # noqa: BLE001
                    pass

    return _ClearStatisticsRowsTask()


# ---------------------------------------------------------------------- #
# Werkzeuge
# ---------------------------------------------------------------------- #
def purge_deltas(info: dict[str, dict[str, Any]], scopes: list[str], keep_days: int) -> dict[str, dict[str, int]]:
    """Zeilen je ID, die ein Löschen entfernt (aus der vorher gezählten Vorschau)."""
    suffix = "_old" if keep_days > 0 else ""
    out: dict[str, dict[str, int]] = {}
    for sid, row in (info or {}).items():
        row = row or {}
        out[sid] = {
            "states": int(row.get("states" + suffix, 0) or 0) if "states" in scopes and ENTITY_RE.match(sid) else 0,
            "stats_short": int(row.get("stats_short" + suffix, 0) or 0) if "statistics_short" in scopes else 0,
            "stats_long": int(row.get("stats_long" + suffix, 0) or 0) if "statistics_long" in scopes else 0,
        }
    return out


def patch_db_cache(data: dict[str, Any], deltas: dict[str, dict[str, int]],
                   moves: list[tuple[str, str]]) -> None:
    """Gespeicherte DB-Auswertung um bekannte Änderungen korrigieren (ohne neu zu zählen)."""
    all_states = data.get("_all_states")
    all_stats = data.get("_all_stats")
    states_top = data.get("states_top") or []
    stats_top = data.get("statistics_top") or []
    for sid, d in deltas.items():
        st, sh, lo = int(d.get("states", 0)), int(d.get("stats_short", 0)), int(d.get("stats_long", 0))
        if isinstance(all_states, dict) and st and sid in all_states:
            all_states[sid] = max(0, all_states[sid] - st)
            if not all_states[sid]:
                all_states.pop(sid)
        if isinstance(all_stats, dict) and (sh or lo) and sid in all_stats:
            all_stats[sid] = max(0, all_stats[sid] - sh - lo)
            if not all_stats[sid]:
                all_stats.pop(sid)
        data["states_total"] = max(0, int(data.get("states_total", 0) or 0) - st)
        data["statistics_short_total"] = max(0, int(data.get("statistics_short_total", 0) or 0) - sh)
        data["statistics_long_total"] = max(0, int(data.get("statistics_long_total", 0) or 0) - lo)
        for row in states_top:
            if row.get("entity_id") == sid:
                row["rows"] = max(0, int(row.get("rows", 0)) - st)
        for row in stats_top:
            if row.get("statistic_id") == sid:
                row["short_term"] = max(0, int(row.get("short_term", 0) or 0) - sh)
                row["long_term"] = max(0, int(row.get("long_term", 0) or 0) - lo)
    for old, new in moves:
        for table in (all_states, all_stats):
            if isinstance(table, dict) and old in table:
                table[new] = table.get(new, 0) + table.pop(old)
        for row in states_top:
            if row.get("entity_id") == old:
                row["entity_id"] = new
        for row in stats_top:
            if row.get("statistic_id") == old:
                row["statistic_id"] = new
    data["states_top"] = [r for r in states_top if r.get("rows")]
    data["statistics_top"] = [r for r in stats_top if r.get("short_term") or r.get("long_term")]
    if isinstance(all_states, dict):
        data["states_entities"] = len(all_states)
    if isinstance(all_stats, dict):
        data["statistics_ids"] = len(all_stats)


class DbTools:
    """Datenbank-Aktionen mit Sicherung, Sperre und Protokoll."""

    def __init__(self, hass: HomeAssistant, on_change=None) -> None:
        self.hass = hass
        self._lock = asyncio.Lock()
        self._store: Store = Store(hass, AUDIT_STORAGE_VERSION, AUDIT_STORAGE_KEY)
        self.audit: list[dict[str, Any]] = []
        self._on_change = on_change
        self.job: dict[str, Any] | None = None  # laufender oder zuletzt beendeter Auftrag

    # ---------------- Hintergrund-Aufträge mit Fortschritt ----------------
    def job_public(self) -> dict[str, Any] | None:
        job = self.job
        if job is None:
            return None
        out = {k: v for k, v in job.items() if not k.startswith("_")}
        out["elapsed"] = round((job.get("_end") or time.monotonic()) - job["_start"], 1)
        if job.get("_phase_start") is not None:
            out["phase_elapsed"] = round(time.monotonic() - job["_phase_start"], 1) if job["status"] == "running" else None
        out["lines"] = list(job["lines"])[-JOB_MAX_LINES:]
        return out

    def _step(self, key: str, kind: str = "info", **params: Any) -> None:
        """Schreibt eine Zeile ins Protokoll des laufenden Auftrags (Text im Panel übersetzt)."""
        job = self.job
        if job is None or job.get("status") != "running":
            return
        job["lines"].append({"t": round(time.monotonic() - job["_start"], 1), "k": key, "kind": kind,
                             "p": {k: v for k, v in params.items() if v is not None}})
        del job["lines"][:-JOB_MAX_LINES]

    def _phase(self, phase: str, progress: float | None = None) -> None:
        job = self.job
        if job is None or job.get("status") != "running":
            return
        if job.get("phase") != phase:
            job["phase"] = phase
            job["_phase_start"] = time.monotonic()
        job["progress"] = None if progress is None else max(0.0, min(100.0, round(progress, 1)))

    def start_job(self, action: str, factory, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """Startet eine Aktion im Hintergrund. Das Panel fragt den Fortschritt ab und
        darf zwischendurch geschlossen werden – der Auftrag läuft weiter."""
        if (self.job and self.job.get("status") == "running") or self._lock.locked():
            raise DbToolError("busy")
        job = {
            "id": f"{int(time.time() * 1000)}", "action": action, "status": "running",
            "params": params or {}, "phase": "start", "progress": None, "lines": [],
            "started": _now().isoformat(), "result": None, "error": None,
            "_start": time.monotonic(), "_phase_start": time.monotonic(), "_end": None,
        }
        self.job = job
        self._step("start", action=action)

        async def _runner() -> None:
            try:
                result = await factory()
                job["result"] = result
                self._step("done_bg" if isinstance(result, dict) and result.get("done") is False else "done", "ok")
                job["status"] = "done"
            except DbToolError as err:
                self._step("failed", "err", code=err.code)
                job["status"] = "error"
                job["error"] = {"error": err.code, "message": str(err), "params": err.params}
            except Exception as err:  # noqa: BLE001
                _LOGGER.exception("HA Percyta: Hintergrund-Auftrag fehlgeschlagen")
                self._step("failed", "err", code="action_failed")
                job["status"] = "error"
                job["error"] = {"error": "action_failed", "message": str(err)}
            finally:
                job["_end"] = time.monotonic()
                job["finished"] = _now().isoformat()
                job["progress"] = 100.0 if job["status"] == "done" else job.get("progress")

        create = getattr(self.hass, "async_create_background_task", None)
        if create is not None:
            create(_runner(), f"{DOMAIN}_db_job")
        else:
            self.hass.async_create_task(_runner())
        return self.job_public()

    async def async_load(self) -> None:
        try:
            data = await self._store.async_load()
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Protokoll nicht ladbar: %s", err)
            data = None
        entries = (data or {}).get("entries") if isinstance(data, dict) else None
        self.audit = [e for e in entries or [] if isinstance(e, dict)][-MAX_AUDIT:]

    async def async_log(self, user: str | None, action: str, ok: bool, **fields: Any) -> None:
        entry = {"at": _now().isoformat(), "user": user or "?", "action": action, "ok": ok}
        entry.update({k: v for k, v in fields.items() if v not in (None, "", [])})
        self.audit.append(entry)
        self.audit = self.audit[-MAX_AUDIT:]
        try:
            await self._store.async_save({"entries": self.audit})
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Protokoll nicht speicherbar: %s", err)

    # ---------------- Hilfen ----------------
    @property
    def backup_dir(self) -> str:
        return self.hass.config.path(DB_BACKUP_DIR)

    def _instance(self):
        if "recorder" not in self.hass.config.components:
            raise DbToolError("recorder_unavailable")
        try:
            from homeassistant.components.recorder import get_instance  # noqa: PLC0415

            instance = get_instance(self.hass)
        except Exception as err:  # noqa: BLE001
            raise DbToolError("recorder_unavailable", str(err)) from err
        if getattr(instance, "migration_in_progress", False):
            raise DbToolError("migration")
        return instance

    async def _wait_recorder(self, instance, timeout: int = RECORDER_WAIT) -> bool:
        """Wartet, bis der Recorder die eingereihten Aufgaben abgearbeitet hat."""
        waiter = getattr(instance, "async_block_till_done", None)
        if waiter is None:
            await asyncio.sleep(2)
            return False
        try:
            await asyncio.wait_for(waiter(), timeout=timeout)
            return True
        except Exception:  # noqa: BLE001
            return False

    def _invalidate(self, deltas: dict[str, dict[str, int]] | None = None,
                    moves: list[tuple[str, str]] | None = None) -> None:
        """Zwischenspeicher der DB-Auswertung nach einer Änderung anpassen.

        Die bekannten Änderungen (gelöschte Zeilen, umbenannte IDs) werden sofort in
        die gespeicherten Zahlen übernommen, damit Panel und Pflege-Center direkt den
        neuen Stand zeigen. Zusätzlich wird neu gezählt, sobald der nächste Scan läuft
        (bei großen Datenbanken kann das länger dauern als ein Scan wartet).
        """
        cache = self.hass.data.get(DB_CACHE_KEY)
        if isinstance(cache, dict):
            data = cache.get("data")
            if isinstance(data, dict):
                try:
                    patch_db_cache(data, deltas or {}, moves or [])
                except Exception as err:  # noqa: BLE001
                    _LOGGER.debug("DB-Zwischenspeicher nicht anpassbar: %s", err)
            cache["ts"] = 0
            cache["gen"] = int(cache.get("gen", 0)) + 1  # laufende Zählung von vorher verwerfen
            cache.pop("future", None)
        if self._on_change is not None:
            self._on_change()

    async def _info(self, instance, ids: list[str], before_ts: float | None = None) -> dict[str, dict[str, Any]]:
        return await instance.async_add_executor_job(query_entity_info, instance, ids, before_ts)

    # ---------------- Vorschau ----------------
    async def async_info(self, ids: list[str]) -> dict[str, Any]:
        ids = [i for i in dict.fromkeys(ids) if STATISTIC_RE.match(i)]
        instance = self._instance()
        info = await self._info(instance, ids)
        ent_reg = er.async_get(self.hass)
        result: dict[str, Any] = {}
        for i in ids:
            row = dict(info.get(i) or {})
            entry = ent_reg.async_get(i) if ENTITY_RE.match(i) else None
            state = self.hass.states.get(i) if ENTITY_RE.match(i) else None
            row["registry"] = (
                {
                    "platform": entry.platform,
                    "disabled": bool(entry.disabled_by),
                    "has_unique_id": bool(entry.unique_id),
                    "name": entry.name or entry.original_name,
                }
                if entry
                else None
            )
            row["state"] = (
                {
                    "state": state.state,
                    "unit": state.attributes.get("unit_of_measurement"),
                    "state_class": state.attributes.get("state_class"),
                    "restored": bool(state.attributes.get("restored")),
                    "name": state.attributes.get("friendly_name"),
                }
                if state
                else None
            )
            result[i] = row
        sqlite_path = _sqlite_path(instance)
        copies = await self.hass.async_add_executor_job(list_copies, self.backup_dir)
        space = await self.hass.async_add_executor_job(space_info, sqlite_path, self.backup_dir)
        return {
            "space": space,
            "ids": result,
            "engine": _engine_name(instance),
            "sqlite": bool(sqlite_path),
            "copies": copies,
            "busy": self._lock.locked(),
            "backup_services": self._backup_services(),
        }

    def _backup_services(self) -> list[str]:
        services = []
        for domain, service in (
            ("hassio", "backup_partial"),
            ("hassio", "backup_full"),
            ("backup", "create_automatic"),
            ("backup", "create"),
        ):
            if self.hass.services.has_service(domain, service):
                services.append(f"{domain}.{service}")
        return services

    # ---------------- Sicherung ----------------
    async def async_backup(self, kind: str, user: str | None = None, *, locked: bool = False) -> dict[str, Any]:
        """Erstellt eine Sicherung. ``locked`` = Sperre wird bereits gehalten."""
        if not locked:
            if self._lock.locked():
                raise DbToolError("busy")
            async with self._lock:
                return await self.async_backup(kind, user, locked=True)
        instance = self._instance()
        try:
            if kind in ("db_copy", "db_copy_replace"):
                path = _sqlite_path(instance)
                if not path:
                    raise DbToolError("not_sqlite")
                result = await self._copy_with_progress(path, replace=kind == "db_copy_replace")
            elif kind == "ha_backup":
                self._phase("ha_backup")
                self._step("bk_ha")
                result = await self._ha_backup(bool(_sqlite_path(instance)))
                self._step("bk_ha_done", "ok", name=result.get("name"))
            else:
                raise DbToolError("invalid_backup")
        except DbToolError as err:
            await self.async_log(user, "backup", False, kind=kind, error=err.code)
            raise
        except Exception as err:  # noqa: BLE001
            await self.async_log(user, "backup", False, kind=kind, error=str(err)[:200])
            raise DbToolError("backup_failed", str(err)) from err
        await self.async_log(user, "backup", True, kind=kind, name=result.get("name"))
        _LOGGER.info("HA Percyta: Sicherung erstellt (%s) %s", kind, result.get("name") or "")
        return result

    async def _copy_with_progress(self, path: str, replace: bool = False) -> dict[str, Any]:
        """Datenbank kopieren und dabei den Fortschritt (Größe der Kopie) melden."""
        total = await self.hass.async_add_executor_job(db_file_size, path)
        self._phase("bk_copy", 0)
        self._step("bk_copy", size=total)
        state: dict[str, Any] = {}
        future = asyncio.ensure_future(
            self.hass.async_add_executor_job(copy_sqlite, path, self.backup_dir, DB_BACKUP_KEEP, state, replace)
        )
        replaced_logged = False
        check_logged = False
        while not future.done():
            await asyncio.wait({future}, timeout=1)
            if state.get("replaced") and not replaced_logged:
                replaced_logged = True
                self._step("bk_replaced", n=len(state["replaced"]))
            if state.get("phase") == "copy" and state.get("tmp"):
                done = await self.hass.async_add_executor_job(file_size, state["tmp"])
                self._phase("bk_copy", min(99.0, done * 100 / total) if total else None)
            elif state.get("phase") == "check" and not check_logged:
                check_logged = True
                self._phase("bk_check")
                self._step("bk_check")
        result = await future
        self._step("bk_done", "ok", name=result.get("name"), size=result.get("size"))
        return result

    async def _ha_backup(self, sqlite: bool) -> dict[str, Any]:
        name = f"HA Percyta {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        services = self._backup_services()
        if "hassio.backup_partial" in services and sqlite:
            # Teil-Backup "Home Assistant" enthält die Konfiguration inkl. Datenbank.
            await self.hass.services.async_call(
                "hassio", "backup_partial", {"name": name, "homeassistant": True}, blocking=True
            )
            return {"kind": "ha_backup", "name": name, "service": "hassio.backup_partial"}
        if "hassio.backup_full" in services:
            # Externe Datenbank (z. B. MariaDB-App): nur ein Voll-Backup enthält sie.
            await self.hass.services.async_call("hassio", "backup_full", {"name": name}, blocking=True)
            return {"kind": "ha_backup", "name": name, "service": "hassio.backup_full"}
        for svc in ("create_automatic", "create"):
            if f"backup.{svc}" in services:
                await self.hass.services.async_call("backup", svc, {}, blocking=True)
                return {"kind": "ha_backup", "service": f"backup.{svc}"}
        raise DbToolError("no_backup_service")

    async def async_delete_copy(self, name: str, user: str | None) -> None:
        if not BACKUP_NAME_RE.match(name or ""):
            raise DbToolError("invalid_name")
        path = os.path.join(self.backup_dir, name)

        def _remove() -> None:
            if os.path.isfile(path):
                os.remove(path)

        await self.hass.async_add_executor_job(_remove)
        await self.async_log(user, "backup_delete", True, name=name)

    async def _maybe_backup(self, backup: str, user: str | None) -> dict[str, Any] | None:
        if backup == "skip":
            return None
        return await self.async_backup(backup, user, locked=True)

    # ---------------- Löschen ----------------
    async def async_purge(
        self, ids: list[str], scopes: list[str], backup: str, user: str | None,
        keep_days: int = 0,
    ) -> dict[str, Any]:
        ids = list(dict.fromkeys(ids))
        bad = [i for i in ids if not STATISTIC_RE.match(i)]
        if bad or not ids:
            raise DbToolError("invalid_id", ids=bad)
        # "statistics" (alt) = Kurz- und Langzeitstatistik.
        if "statistics" in scopes:
            scopes = [s for s in scopes if s != "statistics"] + ["statistics_short", "statistics_long"]
        scopes = list(dict.fromkeys(s for s in scopes if s in ("states", "statistics_short", "statistics_long")))
        if not scopes:
            raise DbToolError("no_scope")
        if self._lock.locked():
            raise DbToolError("busy")
        async with self._lock:
            instance = self._instance()
            short = "statistics_short" in scopes
            long = "statistics_long" in scopes
            stats_task = None
            if (short or long) and not (short and long and keep_days <= 0):
                # Vorab erstellen: Kann diese HA-Version das nicht, wird NICHTS geändert.
                before = (_now() - timedelta(days=keep_days)).timestamp() if keep_days > 0 else None
                stats_task = make_clear_stats_task(ids, short, long, before)
            before_ts = (_now() - timedelta(days=keep_days)).timestamp() if keep_days > 0 else None
            self._phase("count")
            self._step("count", n=len(ids))
            initial = await self._info(instance, ids, before_ts)
            todo = self._purge_amount(initial, scopes, keep_days)
            self._step("count_done", rows=todo)
            backup_result = await self._maybe_backup(backup, user)
            state_ids = [i for i in ids if ENTITY_RE.match(i)]
            # Beobachtet werden nur Zeilen von VOR dem Löschen: Eine laufende Entität schreibt
            # danach neue Werte (und HA berechnet die Statistik der letzten Stunde nach) – die
            # gehören nicht zum Auftrag. Ohne diese Grenze zählt die Anzeige wieder hoch und
            # der Auftrag wird nie fertig.
            watch_ts = before_ts if before_ts is not None else time.time() - WATCH_MARGIN
            self._phase("purge", 0)
            self._step("purge_start", rows=todo, scopes=",".join(scopes))
            try:
                if "states" in scopes and state_ids:
                    await self.hass.services.async_call(
                        "recorder", "purge_entities",
                        {"entity_id": state_ids, "keep_days": keep_days}, blocking=True,
                    )
                if short and long and keep_days <= 0:
                    # Offizieller Weg: Statistik komplett inkl. Metadaten entfernen.
                    instance.async_clear_statistics(ids)
                elif stats_task is not None:
                    # Nur eine Tabelle und/oder nur ältere Zeilen: als Recorder-Aufgabe
                    # im Recorder-Thread (wie HA selbst es für Zeiträume macht).
                    instance.queue_task(stats_task)
            except DbToolError as err:
                await self.async_log(user, "purge", False, ids=ids[:50], scopes=scopes, error=err.code)
                raise
            except Exception as err:  # noqa: BLE001
                await self.async_log(user, "purge", False, ids=ids[:50], scopes=scopes, error=str(err)[:200])
                raise DbToolError("action_failed", str(err)) from err
            done = await self._watch_purge(instance, ids, scopes, watch_ts, todo)
            await self.async_log(user, "purge", True, ids=ids[:50], count=len(ids), scopes=scopes,
                                 keep_days=keep_days or None,
                                 backup=(backup_result or {}).get("name") or backup)
            _LOGGER.warning("HA Percyta: Daten gelöscht (%s) für %d ID(s) durch %s", ",".join(scopes), len(ids), user)
        self._invalidate(purge_deltas(initial, scopes, keep_days))
        return {"success": True, "done": done, "count": len(ids), "backup": backup_result}

    @staticmethod
    def _purge_amount(info: dict[str, dict[str, Any]], scopes: list[str], keep_days: int, old: bool = False) -> int:
        """Zeilen, die das Löschen entfernen wird (bzw. die noch übrig sind).

        ``old=True``: nur Zeilen vor der Zeitgrenze der Abfrage (Felder ``*_old``)."""
        suffix = "_old" if (keep_days > 0 or old) else ""
        keys = []
        if "states" in scopes:
            keys.append("states")
        if "statistics_short" in scopes:
            keys.append("stats_short")
        if "statistics_long" in scopes:
            keys.append("stats_long")
        return sum(int((row or {}).get(k + suffix, 0) or 0) for row in info.values() for k in keys)

    async def _watch_purge(self, instance, ids, scopes, watch_ts, todo) -> bool:
        """Beobachtet, wie die Zeilen weniger werden (der Recorder löscht in Etappen).

        Gezählt werden nur Zeilen vor ``watch_ts`` – neue Werte einer laufenden Entität
        zählen nicht als „noch übrig“."""
        if todo <= 0:
            await self._wait_recorder(instance)
            self._phase("purge", 100)
            return True
        start = time.monotonic()
        last = None
        stable = 0
        while time.monotonic() - start < PURGE_WATCH_MAX:
            await asyncio.sleep(PURGE_POLL)
            try:
                now_info = await self._info(instance, ids, watch_ts)
            except Exception:  # noqa: BLE001
                continue
            left = min(todo, self._purge_amount(now_info, scopes, 0, old=True))
            self._phase("purge", (todo - left) * 100 / todo)
            if left != last:
                self._step("purge_left", left=left, done=max(0, todo - left))
                last = left
                stable = 0
            else:
                stable += 1
            if left <= 0:
                return True
            if stable >= 20:  # ~1 min ohne Veränderung → Recorder ist fertig oder blockiert
                self._step("purge_stalled", "warn", left=left)
                return False
        self._step("purge_timeout", "warn")
        return False

    # ---------------- Umbenennen ----------------
    async def async_rename(self, old: str, new: str, backup: str, user: str | None) -> dict[str, Any]:
        self._check_pair(old, new)
        ent_reg = er.async_get(self.hass)
        if ent_reg.async_get(new) is not None or self.hass.states.get(new) is not None:
            raise DbToolError("target_in_use", target=new)
        if self._lock.locked():
            raise DbToolError("busy")
        async with self._lock:
            instance = self._instance()
            info = await self._info(instance, [old, new])
            target = info.get(new) or {}
            if target.get("in_states_meta") or target.get("in_statistics_meta"):
                # Ziel hat schon eigene Daten → HA würde den Verlauf nicht übernehmen.
                raise DbToolError("target_has_data", target=new)
            source = info.get(old) or {}
            entry = ent_reg.async_get(old)
            if entry is None and not (source.get("in_states_meta") or source.get("in_statistics_meta")):
                raise DbToolError("no_data", target=old)
            backup_result = await self._maybe_backup(backup, user)
            try:
                self._phase("apply")
                if entry is not None:
                    # Offizieller Weg: Registry umbenennen – der Recorder zieht Verlauf
                    # und Statistik automatisch mit.
                    self._step("rn_registry", old=old, new=new)
                    ent_reg.async_update_entity(old, new_entity_id=new)
                else:
                    # Nur noch Daten in der Datenbank (keine Entität mehr).
                    self._step("rn_history", old=old, new=new)
                    if source.get("in_states_meta"):
                        instance.async_update_states_metadata(old, new)
                    if source.get("in_statistics_meta"):
                        self._update_statistic_id(instance, old, new)
            except ValueError as err:
                await self.async_log(user, "rename", False, old=old, new=new, error=str(err)[:200])
                raise DbToolError("registry_refused", str(err)) from err
            except Exception as err:  # noqa: BLE001
                await self.async_log(user, "rename", False, old=old, new=new, error=str(err)[:200])
                raise DbToolError("action_failed", str(err)) from err
            done = await self._wait_recorder(instance)
            await self.async_log(user, "rename", True, old=old, new=new,
                                 registry=entry is not None,
                                 backup=(backup_result or {}).get("name") or backup)
            _LOGGER.warning("HA Percyta: %s → %s umbenannt durch %s", old, new, user)
        self._invalidate(moves=[(old, new)])
        return {"success": True, "done": done, "registry": entry is not None, "backup": backup_result}

    def _update_statistic_id(self, instance, old: str, new: str) -> None:
        method = getattr(instance, "async_update_statistics_metadata", None)
        if method is not None:
            method(old, new_statistic_id=new)
            return
        from homeassistant.components.recorder.statistics import (  # noqa: PLC0415
            async_update_statistics_metadata,
        )

        async_update_statistics_metadata(self.hass, old, new_statistic_id=new)

    @staticmethod
    def _check_pair(old: str, new: str) -> None:
        if not ENTITY_RE.match(old or "") or not ENTITY_RE.match(new or ""):
            raise DbToolError("invalid_id", ids=[x for x in (old, new) if not ENTITY_RE.match(x or "")])
        if old == new:
            raise DbToolError("same_id")
        if old.split(".")[0] != new.split(".")[0]:
            raise DbToolError("domain_mismatch")

    # ---------------- Ersetzen (Gerätetausch) ----------------
    async def async_replace(
        self, old: str, new: str, *, remove_old: bool, purge_new: bool, force: bool,
        backup: str, user: str | None,
    ) -> dict[str, Any]:
        """Neue Entität übernimmt die ID (und damit Verlauf + Statistik) der alten.

        Ablauf (offizielle HA-Wege):
        1. Sicherung (optional, Standard)
        2. Alte Entität aus der Registry entfernen (falls noch vorhanden)
        3. Neue Entität auf die alte ID umbenennen – sie schreibt ab jetzt in den
           vorhandenen Verlauf/die vorhandene Statistik der alten ID weiter.
           (Der Recorder meldet dabei im Log, dass er den Verlauf der neuen ID
           nicht verschieben kann, weil die alte ID belegt ist – das ist erwartet.)
        4. Optional: den kurzen eigenen Verlauf der neuen ID löschen.
        """
        self._check_pair(old, new)
        ent_reg = er.async_get(self.hass)
        new_entry = ent_reg.async_get(new)
        if new_entry is None or not new_entry.unique_id:
            raise DbToolError("new_not_registered", target=new)
        old_entry = ent_reg.async_get(old)
        old_state = self.hass.states.get(old)
        old_active = bool(
            old_state is not None
            and old_state.state not in ("unavailable", "unknown")
            and not old_state.attributes.get("restored")
        )
        if old_entry is None and old_state is not None and old_active:
            raise DbToolError("old_unmanaged", target=old)  # z. B. YAML-Entität ohne unique_id
        if old_entry is not None and not remove_old:
            raise DbToolError("old_registered", target=old)
        if old_active and not force:
            raise DbToolError("old_active", target=old)
        if self._lock.locked():
            raise DbToolError("busy")

        async with self._lock:
            instance = self._instance()
            info = await self._info(instance, [old, new])
            src = info.get(old) or {}
            if not (src.get("in_states_meta") or src.get("in_statistics_meta")):
                raise DbToolError("no_data", target=old)
            new_state = self.hass.states.get(new)
            new_unit = new_state.attributes.get("unit_of_measurement") if new_state else None
            old_unit = src.get("stats_unit")
            if src.get("in_statistics_meta") and (old_unit or None) != (new_unit or None) and not force:
                raise DbToolError("unit_mismatch", old_unit=old_unit, new_unit=new_unit)

            backup_result = await self._maybe_backup(backup, user)
            steps: list[str] = []
            self._phase("apply")
            try:
                if old_entry is not None:
                    self._step("rp_remove_old", old=old)
                    ent_reg.async_remove(old)
                    steps.append("removed_old")
                # Zustand der alten ID muss weg sein, sonst ist die ID nicht frei.
                for _ in range(50):
                    if self.hass.states.get(old) is None:
                        break
                    await asyncio.sleep(0.1)
                leftover = self.hass.states.get(old)
                if leftover is not None:
                    if leftover.state in ("unavailable", "unknown") or leftover.attributes.get("restored") or force:
                        self.hass.states.async_remove(old)
                        steps.append("removed_state")
                    else:
                        raise DbToolError("old_active", target=old)
                self._step("rp_rename", old=old, new=new)
                ent_reg.async_update_entity(new, new_entity_id=old)
                steps.append("renamed_new")
                if purge_new:
                    self._step("rp_purge_new", new=new)
                    await asyncio.sleep(0.5)  # Recorder hat das Umbenennen eingereiht
                    await self.hass.services.async_call(
                        "recorder", "purge_entities", {"entity_id": [new], "keep_days": 0}, blocking=True
                    )
                    instance.async_clear_statistics([new])
                    steps.append("purged_new")
            except DbToolError as err:
                await self.async_log(user, "replace", False, old=old, new=new, steps=steps, error=err.code)
                raise
            except ValueError as err:
                await self.async_log(user, "replace", False, old=old, new=new, steps=steps, error=str(err)[:200])
                raise DbToolError("registry_refused", str(err), steps=steps) from err
            except Exception as err:  # noqa: BLE001
                await self.async_log(user, "replace", False, old=old, new=new, steps=steps, error=str(err)[:200])
                raise DbToolError("action_failed", str(err), steps=steps) from err
            done = await self._wait_recorder(instance)
            await self.async_log(user, "replace", True, old=old, new=new, steps=steps,
                                 backup=(backup_result or {}).get("name") or backup)
            _LOGGER.warning("HA Percyta: %s übernimmt Verlauf von %s (durch %s)", new, old, user)
        self._invalidate(purge_deltas({new: info.get(new) or {}}, ["states", "statistics_short", "statistics_long"], 0)
                         if purge_new else None)
        return {"success": True, "done": done, "steps": steps, "backup": backup_result}

    # ---------------- Auswahlliste (Picker) ----------------
    async def async_list(self) -> dict[str, Any]:
        """Alle IDs mit Daten in der Datenbank – für die Auswahl im Panel.

        Nutzt die (höchstens 1 h alte) Auswertung aus dem Scan; fehlt sie, wird
        sie einmal neu erstellt (nur lesend).
        """
        instance = self._instance()
        cache = self.hass.data.setdefault(DB_CACHE_KEY, {})
        data = cache.get("data")
        if not data or data.get("_all_states") is None:
            from .scanner import _query_db_stats  # noqa: PLC0415

            data = await instance.async_add_executor_job(_query_db_stats, instance)
            if isinstance(data, dict) and data.get("available"):
                cache["data"] = data
                cache["ts"] = __import__("time").monotonic()
        all_states: dict[str, int] = (data or {}).get("_all_states") or {}
        all_stats: dict[str, int] = (data or {}).get("_all_stats") or {}
        ent_reg = er.async_get(self.hass)
        flt = getattr(instance, "entity_filter", None)
        out = []
        for i in set(all_states) | set(all_stats):
            is_entity = bool(ENTITY_RE.match(i))
            state = self.hass.states.get(i) if is_entity else None
            entry = ent_reg.async_get(i) if is_entity else None
            row: dict[str, Any] = {
                "id": i,
                "states": all_states.get(i, 0),
                "stats": all_stats.get(i, 0),
                "name": (state.attributes.get("friendly_name") if state else None)
                or (entry.name or entry.original_name if entry else None),
                "exists": state is not None or entry is not None,
                "external": not is_entity,
            }
            if state is not None:
                row["state"] = str(state.state)[:40]
                if state.attributes.get("restored"):
                    row["restored"] = True
            if entry is not None and entry.disabled_by:
                row["disabled"] = True
            if is_entity and flt is not None:
                try:
                    row["recorded"] = bool(flt(i))
                except Exception:  # noqa: BLE001
                    pass
            out.append(row)
        out.sort(key=lambda r: r["states"] + r["stats"], reverse=True)
        return {"items": out, "generated_at": (data or {}).get("generated_at")}

    # ---------------- Datenbank aufräumen ----------------
    async def async_cleanup_preview(self, keep_days: int) -> dict[str, Any]:
        """Vorschau für „Aufräumen“: was älter als ``keep_days`` gelöscht würde."""
        if keep_days < 1:
            raise DbToolError("invalid_days")
        instance = self._instance()
        before = (_now() - timedelta(days=keep_days)).timestamp()
        result = await instance.async_add_executor_job(query_cleanup_preview, instance, before)
        sqlite_path = _sqlite_path(instance)
        if sqlite_path:
            result["db_size"] = await self.hass.async_add_executor_job(db_file_size, sqlite_path)
        result["keep_days"] = keep_days
        return result

    async def async_cleanup(self, keep_days: int, repack: bool, backup: str, user: str | None) -> dict[str, Any]:
        """Gesamte Datenbank: alles älter als ``keep_days`` löschen, optional verkleinern.

        Nutzt ``recorder.purge``. Langzeitstatistiken bleiben dabei erhalten
        (so arbeitet der Recorder). ``repack`` gibt den Platz frei (VACUUM) –
        das braucht vorübergehend freien Speicher in Größe der Datenbank.
        """
        if keep_days < 1:
            raise DbToolError("invalid_days")
        if self._lock.locked():
            raise DbToolError("busy")
        async with self._lock:
            instance = self._instance()
            backup_result = await self._maybe_backup(backup, user)
            self._phase("cleanup")
            self._step("cl_purge", days=keep_days)
            if repack:
                self._step("cl_repack")
            try:
                await self.hass.services.async_call(
                    "recorder", "purge", {"keep_days": keep_days, "repack": repack}, blocking=True
                )
            except Exception as err:  # noqa: BLE001
                await self.async_log(user, "cleanup", False, keep_days=keep_days, error=str(err)[:200])
                raise DbToolError("action_failed", str(err)) from err
            done = await self._wait_recorder(instance, 1800)
            await self.async_log(user, "cleanup", True, keep_days=keep_days, repack=repack,
                                 backup=(backup_result or {}).get("name") or backup)
            _LOGGER.warning("HA Percyta: Datenbank aufgeräumt (älter als %d Tage, repack=%s) durch %s",
                            keep_days, repack, user)
        self._invalidate()
        return {"success": True, "done": done, "backup": backup_result}

    # ---------------- Verwaiste Entitäten aus der Registry ----------------
    async def async_registry_remove(
        self, ids: list[str], purge_data: bool, backup: str, user: str | None
    ) -> dict[str, Any]:
        """Entfernt Registry-Einträge, die von keiner Integration mehr bereitgestellt werden.

        Erlaubt nur für Entitäten ohne aktiven Zustand (verwaist/nicht verfügbar
        oder ganz ohne Zustand) – eine laufende Entität würde sofort neu angelegt.
        """
        ids = list(dict.fromkeys(ids))
        bad = [i for i in ids if not ENTITY_RE.match(i)]
        if bad or not ids:
            raise DbToolError("invalid_id", ids=bad)
        ent_reg = er.async_get(self.hass)
        active = []
        for i in ids:
            state = self.hass.states.get(i)
            if state is not None and not state.attributes.get("restored") and state.state not in ("unavailable",):
                active.append(i)
        if active:
            raise DbToolError("still_active", ids=active)
        missing = [i for i in ids if ent_reg.async_get(i) is None]
        if self._lock.locked():
            raise DbToolError("busy")
        async with self._lock:
            instance = self._instance() if purge_data else None
            backup_result = await self._maybe_backup(backup, user)
            removed = []
            self._phase("apply")
            self._step("rg_remove", n=len(ids))
            for i in ids:
                if ent_reg.async_get(i) is not None:
                    ent_reg.async_remove(i)
                    removed.append(i)
            await asyncio.sleep(0.2)
            for i in removed:
                left = self.hass.states.get(i)
                if left is not None and (left.attributes.get("restored") or left.state == "unavailable"):
                    self.hass.states.async_remove(i)
            pre: dict[str, dict[str, Any]] = {}
            if purge_data and instance is not None:
                pre = await self._info(instance, ids)
                self._step("rg_purge")
                await self.hass.services.async_call(
                    "recorder", "purge_entities", {"entity_id": ids, "keep_days": 0}, blocking=True
                )
                instance.async_clear_statistics(ids)
                await self._wait_recorder(instance)
            await self.async_log(user, "registry_remove", True, ids=ids[:50], count=len(removed),
                                 purge=purge_data, backup=(backup_result or {}).get("name") or backup)
            _LOGGER.warning("HA Percyta: %d Entität(en) aus der Registry entfernt durch %s", len(removed), user)
        self._invalidate(purge_deltas(pre, ["states", "statistics_short", "statistics_long"], 0) if pre else None)
        return {"success": True, "removed": removed, "not_found": missing, "backup": backup_result}

    # ---------------- Zugriffstoken widerrufen ----------------
    async def async_revoke_token(self, token_id: str, own_token_id: str | None, user: str | None) -> dict[str, Any]:
        """Widerruft einen Refresh-/Langzeit-Token (offizielle Auth-API)."""
        if not token_id or not isinstance(token_id, str):
            raise DbToolError("invalid_id")
        if own_token_id and token_id == own_token_id:
            raise DbToolError("own_token")
        auth = self.hass.auth
        token = auth.async_get_refresh_token(token_id)
        if token is None:
            raise DbToolError("not_found")
        label = f"{getattr(token.user, 'name', '?')} / {getattr(token, 'client_name', None) or getattr(token, 'client_id', None) or '—'}"
        result = auth.async_remove_refresh_token(token)
        if asyncio.iscoroutine(result):  # ältere Cores
            await result
        await self.async_log(user, "token_revoke", True, target=label)
        _LOGGER.warning("HA Percyta: Token %s widerrufen durch %s", label, user)
        if self._on_change is not None:
            self._on_change()
        return {"success": True, "target": label}

    # ---------------- Entitäten deaktivieren ----------------
    async def async_disable_entities(self, ids: list[str], user: str | None) -> dict[str, Any]:
        """Deaktiviert Entitäten (umkehrbar in Einstellungen › Entitäten)."""
        ids = list(dict.fromkeys(ids))
        if not ids or any(not ENTITY_RE.match(i) for i in ids):
            raise DbToolError("invalid_id")
        ent_reg = er.async_get(self.hass)
        done, skipped = [], []
        for i in ids:
            entry = ent_reg.async_get(i)
            if entry is None or entry.disabled_by:
                skipped.append(i)
                continue
            try:
                ent_reg.async_update_entity(i, disabled_by=er.RegistryEntryDisabler.USER)
                done.append(i)
            except Exception:  # noqa: BLE001
                skipped.append(i)
        await self.async_log(user, "entity_disable", bool(done), ids=done[:50], count=len(done))
        if self._on_change is not None:
            self._on_change()
        return {"success": True, "disabled": done, "skipped": skipped}

    # ---------------- Integration neu laden ----------------
    async def async_reload_entry(self, entry_id: str, user: str | None) -> dict[str, Any]:
        entry = self.hass.config_entries.async_get_entry(entry_id)
        if entry is None:
            raise DbToolError("not_found")
        try:
            ok = await self.hass.config_entries.async_reload(entry_id)
        except Exception as err:  # noqa: BLE001
            await self.async_log(user, "entry_reload", False, target=entry.title or entry.domain, error=str(err)[:200])
            raise DbToolError("action_failed", str(err)) from err
        state = str(getattr(entry.state, "value", entry.state))
        await self.async_log(user, "entry_reload", bool(ok), target=entry.title or entry.domain, state=state)
        if self._on_change is not None:
            self._on_change()
        return {"success": bool(ok), "state": state, "error": None if ok else "reload_failed"}

    # ---------------- Verwaiste Geräte entfernen ----------------
    async def async_remove_devices(self, ids: list[str], backup: str, user: str | None) -> dict[str, Any]:
        """Entfernt Geräte, deren Integration es nicht mehr gibt (verwaist).

        Geräte einer noch eingerichteten Integration werden NICHT angefasst –
        dafür ist die Integration selbst zuständig.
        """
        from homeassistant.helpers import device_registry as dr  # noqa: PLC0415

        dev_reg = dr.async_get(self.hass)
        ids = list(dict.fromkeys(ids))
        blocked = []
        for i in ids:
            device = dev_reg.async_get(i)
            if device is None:
                continue
            if any(self.hass.config_entries.async_get_entry(e) is not None for e in device.config_entries):
                blocked.append(getattr(device, "name_by_user", None) or device.name or i)
        if blocked:
            raise DbToolError("device_in_use", ids=blocked)
        if self._lock.locked():
            raise DbToolError("busy")
        async with self._lock:
            backup_result = await self._maybe_backup(backup, user)
            removed = []
            self._phase("apply")
            self._step("dv_remove", n=len(ids))
            for i in ids:
                device = dev_reg.async_get(i)
                if device is None:
                    continue
                dev_reg.async_remove_device(i)
                removed.append(getattr(device, "name_by_user", None) or device.name or i)
            await self.async_log(user, "device_remove", True, ids=removed[:50], count=len(removed),
                                 backup=(backup_result or {}).get("name") or backup)
            _LOGGER.warning("HA Percyta: %d verwaiste(s) Gerät(e) entfernt durch %s", len(removed), user)
        if self._on_change is not None:
            self._on_change()
        return {"success": True, "removed": removed, "backup": backup_result}
