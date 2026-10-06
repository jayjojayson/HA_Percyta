"""System- & Speicher-Analyse für HA Percyta.

Ermittelt CPU-Auslastung, RAM-/Swap-Nutzung, freien/belegten Speicherplatz sowie
eine Aufschlüsselung der größten Speicher-Verbraucher unterhalb des HA-Config-
Verzeichnisses.

Es werden ausschließlich Daten **gelesen** – nichts wird verändert.

Alle Funktionen sind blockierend (Datei-I/O, ggf. kurze CPU-Messung) und daher aus
dem Coordinator heraus im Executor auszuführen.
``psutil`` wird – falls vorhanden – für exaktere Werte genutzt, ist aber **keine**
Pflicht-Abhängigkeit: ohne psutil greifen stdlib-Fallbacks (``/proc``, ``shutil``).
"""

from __future__ import annotations

import logging
import os
import shutil
import time
from typing import Any

from .const import STORAGE_TARGETS

_LOGGER = logging.getLogger(__name__)

try:  # psutil ist optional – wenn vorhanden, liefert es die genauesten Werte.
    import psutil  # type: ignore

    _HAS_PSUTIL = True
except Exception:  # noqa: BLE001
    psutil = None  # type: ignore
    _HAS_PSUTIL = False


# --------------------------------------------------------------------------- #
# Größen-Helfer
# --------------------------------------------------------------------------- #
def _path_size(path: str) -> int:
    """Größe einer Datei oder eines Verzeichnisses in Bytes (rekursiv, defensiv)."""
    if not path or not os.path.exists(path):
        return 0
    if os.path.isfile(path):
        try:
            return os.path.getsize(path)
        except OSError:
            return 0

    total = 0
    for root, dirs, files in os.walk(path, followlinks=False):
        for name in files:
            fp = os.path.join(root, name)
            try:
                if not os.path.islink(fp):
                    total += os.path.getsize(fp)
            except OSError:
                continue
    return total


def _db_size(config_dir: str, db_name: str) -> int:
    """Recorder-DB inkl. WAL-/SHM-Begleitdateien summieren."""
    total = 0
    for suffix in ("", "-wal", "-shm"):
        total += _path_size(os.path.join(config_dir, db_name + suffix))
    return total


# --------------------------------------------------------------------------- #
# CPU / RAM / Swap
# --------------------------------------------------------------------------- #
def _cpu_from_proc(interval: float = 0.4) -> float | None:
    """CPU-Auslastung in % aus zwei /proc/stat-Messungen (Linux-Fallback)."""
    def _read() -> tuple[int, int] | None:
        try:
            with open("/proc/stat", encoding="utf-8") as file:
                for line in file:
                    if line.startswith("cpu "):
                        parts = [int(x) for x in line.split()[1:]]
                        idle = parts[3] + (parts[4] if len(parts) > 4 else 0)
                        return sum(parts), idle
        except (OSError, ValueError):
            return None
        return None

    first = _read()
    if first is None:
        return None
    time.sleep(interval)
    second = _read()
    if second is None:
        return None

    total_delta = second[0] - first[0]
    idle_delta = second[1] - first[1]
    if total_delta <= 0:
        return None
    return round((1 - idle_delta / total_delta) * 100, 1)


def _mem_from_proc() -> dict[str, Any]:
    """RAM/Swap aus /proc/meminfo (Linux-Fallback)."""
    info: dict[str, int] = {}
    try:
        with open("/proc/meminfo", encoding="utf-8") as file:
            for line in file:
                key, _, rest = line.partition(":")
                value = rest.strip().split()
                if value:
                    # Werte stehen in kB.
                    info[key.strip()] = int(value[0]) * 1024
    except (OSError, ValueError):
        return {"ram": {}, "swap": {}}

    total = info.get("MemTotal", 0)
    available = info.get("MemAvailable", info.get("MemFree", 0))
    used = max(total - available, 0)
    ram = {
        "total": total,
        "available": available,
        "used": used,
        "percent": round(used / total * 100, 1) if total else None,
    }

    swap_total = info.get("SwapTotal", 0)
    swap_free = info.get("SwapFree", 0)
    swap_used = max(swap_total - swap_free, 0)
    swap = {
        "total": swap_total,
        "used": swap_used,
        "percent": round(swap_used / swap_total * 100, 1) if swap_total else None,
    }
    return {"ram": ram, "swap": swap}


def _collect_cpu_ram() -> dict[str, Any]:
    """CPU-, RAM- und Swap-Kennzahlen ermitteln (psutil oder stdlib)."""
    result: dict[str, Any] = {"source": "psutil" if _HAS_PSUTIL else "fallback"}

    # Load-Average (Linux/Unix) – unabhängig von psutil verfügbar.
    try:
        load = os.getloadavg()
        result["load"] = {
            "1m": round(load[0], 2),
            "5m": round(load[1], 2),
            "15m": round(load[2], 2),
        }
    except (OSError, AttributeError):
        result["load"] = None

    if _HAS_PSUTIL:
        try:
            cpu_percent = psutil.cpu_percent(interval=0.4)
            vmem = psutil.virtual_memory()
            smem = psutil.swap_memory()
            result["cpu"] = {
                "percent": round(cpu_percent, 1),
                "count": psutil.cpu_count(logical=True),
            }
            result["ram"] = {
                "total": int(vmem.total),
                "available": int(vmem.available),
                "used": int(vmem.total - vmem.available),
                "percent": round(vmem.percent, 1),
            }
            result["swap"] = {
                "total": int(smem.total),
                "used": int(smem.used),
                "percent": round(smem.percent, 1),
            }
            return result
        except Exception as err:  # noqa: BLE001 – Fallback nutzen
            _LOGGER.debug("psutil-Auswertung fehlgeschlagen, nutze Fallback: %s", err)

    # stdlib-Fallback
    mem = _mem_from_proc()
    result["cpu"] = {
        "percent": _cpu_from_proc(),
        "count": os.cpu_count(),
    }
    result["ram"] = mem["ram"]
    result["swap"] = mem["swap"]
    return result


# --------------------------------------------------------------------------- #
# Disk / Storage
# --------------------------------------------------------------------------- #
def _disk_usage(config_dir: str) -> dict[str, Any]:
    """Belegung des Dateisystems, auf dem das Config-Verzeichnis liegt."""
    try:
        usage = shutil.disk_usage(config_dir)
        percent = round(usage.used / usage.total * 100, 1) if usage.total else None
        return {
            "total": int(usage.total),
            "used": int(usage.used),
            "free": int(usage.free),
            "percent": percent,
            "path": config_dir,
        }
    except OSError as err:
        _LOGGER.debug("Disk-Usage nicht ermittelbar: %s", err)
        return {}


def _storage_breakdown(config_dir: str) -> dict[str, Any]:
    """Größte Speicher-Verbraucher unter <config> aufschlüsseln."""
    items: list[dict[str, Any]] = []

    for label, rel, kind in STORAGE_TARGETS:
        path = os.path.join(config_dir, rel)
        if kind == "db":
            size = _db_size(config_dir, rel)
        else:
            size = _path_size(path)
        if size > 0:
            items.append(
                {"name": label, "path": path, "bytes": size, "type": kind}
            )

    items.sort(key=lambda x: x["bytes"], reverse=True)

    # Custom-Integrationen einzeln (nur Custom Components haben eine messbare
    # Datei-Größe auf der Platte).
    custom: list[dict[str, Any]] = []
    cc_dir = os.path.join(config_dir, "custom_components")
    if os.path.isdir(cc_dir):
        try:
            for entry in os.scandir(cc_dir):
                if entry.is_dir() and not entry.name.startswith("__"):
                    size = _path_size(entry.path)
                    if size > 0:
                        custom.append({"domain": entry.name, "bytes": size})
        except OSError as err:
            _LOGGER.debug("custom_components nicht lesbar: %s", err)
    custom.sort(key=lambda x: x["bytes"], reverse=True)

    return {
        "breakdown": items,
        "custom_integrations": custom,
        "measured_total": sum(i["bytes"] for i in items),
    }


# --------------------------------------------------------------------------- #
# Custom-Cards (Lovelace-Ressourcen) – Speichergröße
# --------------------------------------------------------------------------- #
def _resolve_card_path(config_dir: str, url: str) -> str | None:
    """Bildet eine Lovelace-Ressourcen-URL auf einen lokalen Dateipfad ab.

    ``/local/…`` → ``<config>/www/…``,
    ``/hacsfiles/…`` → ``<config>/www/community/…``,
    ``/config/…`` → ``<config>/…``.
    Externe URLs (http/https) liefern ``None``. Der Pfad muss innerhalb des
    Config-Verzeichnisses liegen (Sicherheits-Check).
    """
    if not url:
        return None
    clean = url.split("?", 1)[0].split("#", 1)[0]
    if clean.startswith(("http://", "https://", "//")):
        return None

    if clean.startswith("/local/"):
        rel = os.path.join("www", clean[len("/local/"):])
    elif clean.startswith("/hacsfiles/"):
        rel = os.path.join("www", "community", clean[len("/hacsfiles/"):])
    elif clean.startswith("/config/"):
        rel = clean[len("/config/"):]
    else:
        return None

    path = os.path.normpath(os.path.join(config_dir, rel))
    base = os.path.realpath(config_dir)
    real = os.path.realpath(path)
    if not (real == base or real.startswith(base + os.sep)):
        return None
    return real


def measure_custom_card_sizes(
    config_dir: str, urls: list[str]
) -> dict[str, dict[str, Any]]:
    """Ermittelt die Größe der zu den URLs gehörenden Custom-Card-Dateien.

    Liegt die Datei in einem Unterordner unterhalb von ``www`` (typisch für
    HACS-Karten), wird die Größe des Ordners gemeldet (``scope="folder"``),
    sonst die der Einzeldatei (``scope="file"``). Nicht auflösbare/externe URLs
    ergeben ``bytes=None``.
    """
    result: dict[str, dict[str, Any]] = {}
    www = os.path.realpath(os.path.join(config_dir, "www"))
    for url in urls:
        path = _resolve_card_path(config_dir, url)
        if not path or not os.path.exists(path):
            result[url] = {"bytes": None, "scope": None, "path": None}
            continue
        parent = os.path.dirname(path)
        parent_real = os.path.realpath(parent)
        in_subfolder = parent_real != www and parent_real.startswith(www + os.sep)
        if os.path.isfile(path) and in_subfolder:
            result[url] = {"bytes": _path_size(parent), "scope": "folder", "path": parent_real}
        else:
            result[url] = {"bytes": _path_size(path), "scope": "file", "path": path}
    return result


def measure_blueprint_sizes(
    config_dir: str, specs: list[tuple[str, str]]
) -> list[int | None]:
    """Größe der Blueprint-YAML-Dateien (in Byte), in Reihenfolge von ``specs``.

    ``specs`` ist eine Liste aus ``(domain, path)``. Gesucht wird unter
    ``<config>/blueprints/<domain>/<path>`` (mit Fallback ``.../<path>``).
    Der Pfad muss innerhalb von ``<config>/blueprints`` liegen (Sicherheits-Check).
    """
    out: list[int | None] = []
    bp_root = os.path.realpath(os.path.join(config_dir, "blueprints"))
    for domain, path in specs:
        size: int | None = None
        for cand in (
            os.path.join(config_dir, "blueprints", domain, path),
            os.path.join(config_dir, "blueprints", path),
        ):
            real = os.path.realpath(cand)
            if not (real == bp_root or real.startswith(bp_root + os.sep)):
                continue
            if os.path.isfile(real):
                size = _path_size(real)
                break
        out.append(size)
    return out


# --------------------------------------------------------------------------- #
# Öffentliche API
# --------------------------------------------------------------------------- #
def collect_system_stats(config_dir: str, include_storage: bool = True) -> dict[str, Any]:
    """Vollständige System-/Speicher-Kennzahlen erheben (blockierend)."""
    stats = _collect_cpu_ram()
    stats["disk"] = _disk_usage(config_dir)

    if include_storage:
        try:
            stats["storage"] = _storage_breakdown(config_dir)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Speicher-Aufschlüsselung fehlgeschlagen: %s", err)
            stats["storage"] = {}
    else:
        stats["storage"] = {}

    return stats
