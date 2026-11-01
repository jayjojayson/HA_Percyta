"""Automation testen: auslösen und das Ergebnis des neuen Laufs abwarten.

Der Dienst ``automation.trigger`` meldet nur, dass der Lauf angestoßen wurde –
nicht, ob er geklappt hat. Deshalb wird hier die Ablaufverfolgung (Trace) des
neuen Laufs abgewartet und ausgewertet. Erkannt wird der Lauf über den Kontext
des Aufrufs (Home Assistant setzt ihn als ``parent_id`` des Laufs).
"""

from __future__ import annotations

import asyncio
import re
import time
from collections.abc import Mapping
from datetime import datetime
from typing import Any

from homeassistant.core import Context, HomeAssistant

from .const import AUTOMATION_TEST_WAIT
from .findings import ERROR_EXECUTIONS, SKIPPED_EXECUTIONS

ENTITY_RE = re.compile(r"^automation\.[a-z0-9_]+$")
POLL_SECONDS = 0.25
# Läufe, die regulär beendet wurden, aber nicht bis zum Ende kamen.
STOPPED_EXECUTIONS = {"aborted", "cancelled", "failed_conditions", "failed_trigger"}


def _runs(hass: HomeAssistant, key: str) -> dict[str, Any]:
    store = hass.data.get("trace")
    if not isinstance(store, Mapping):
        return {}
    bucket = store.get(key)
    if bucket is None:
        return {}
    runs = getattr(bucket, "runs", bucket)  # neuere Cores: TraceBuckets
    try:
        return dict(runs.items())
    except Exception:  # noqa: BLE001
        return {}


def _short(trace: Any) -> dict[str, Any]:
    try:
        short = trace.as_short_dict()
    except Exception:  # noqa: BLE001
        return {}
    return dict(short) if isinstance(short, Mapping) else {}


def _ts(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value)) if value else None
    except ValueError:
        return None


def _is_ours(trace: Any, ctx: Context) -> bool | None:
    """True/False, wenn der Kontext lesbar ist; None, wenn nicht."""
    context = getattr(trace, "context", None) or getattr(trace, "_context", None)
    if context is None:
        return None
    return ctx.id in (getattr(context, "parent_id", None), getattr(context, "id", None))


def evaluate(short: Mapping[str, Any]) -> dict[str, Any]:
    """Ergebnis eines beendeten Laufs."""
    execution = short.get("script_execution")
    error = short.get("error")
    if error or execution in ERROR_EXECUTIONS:
        outcome = "error"
    elif execution in SKIPPED_EXECUTIONS:
        outcome = "skipped"
    elif execution in STOPPED_EXECUTIONS:
        outcome = "stopped"
    else:
        outcome = "ok"
    stamp = short.get("timestamp") or {}
    start, finish = _ts(stamp.get("start")), _ts(stamp.get("finish"))
    duration = (finish - start).total_seconds() if start and finish else None
    return {
        "outcome": outcome,
        "execution": str(execution or ""),
        "error": str(error or "")[:400],
        "last_step": str(short.get("last_step") or ""),
        "run_id": str(short.get("run_id") or ""),
        "duration": round(duration, 2) if duration is not None else None,
    }


async def async_test_automation(
    hass: HomeAssistant, entity_id: str, user_id: str | None = None, wait: float = AUTOMATION_TEST_WAIT
) -> dict[str, Any]:
    """Automation ohne Bedingungen auslösen und auf das Ergebnis warten (max. ``wait`` s)."""
    if not ENTITY_RE.match(entity_id or ""):
        return {"error": "invalid_entity"}
    state = hass.states.get(entity_id)
    if state is None:
        return {"error": "not_found"}
    cfg_id = state.attributes.get("id")
    key = f"automation.{cfg_id}" if cfg_id else None
    link = f"/config/automation/trace/{cfg_id}" if cfg_id else None
    base = {"entity_id": entity_id, "link": link, "state": state.state}
    before = set(_runs(hass, key)) if key else set()

    ctx = Context(user_id=user_id)
    try:
        await hass.services.async_call(
            "automation", "trigger", {"entity_id": entity_id, "skip_condition": True},
            blocking=False, context=ctx,
        )
    except Exception as err:  # noqa: BLE001
        return {**base, "outcome": "error", "stage": "trigger", "error": str(err)[:400]}

    if not key or not isinstance(hass.data.get("trace"), Mapping):
        # Ohne Automations-ID (YAML ohne id) oder ohne Trace keine Auswertung möglich.
        return {**base, "outcome": "started", "reason": "no_trace"}

    deadline = time.monotonic() + wait
    seen: str | None = None
    while time.monotonic() < deadline:
        await asyncio.sleep(POLL_SECONDS)
        runs = _runs(hass, key)
        fresh = [(rid, tr) for rid, tr in runs.items() if rid not in before]
        if not fresh:
            continue
        ours = [(rid, tr) for rid, tr in fresh if _is_ours(tr, ctx) is not False]
        if not ours:
            continue
        rid, trace = ours[-1]
        seen = rid
        short = _short(trace)
        if short.get("state") not in (None, "stopped"):
            continue  # läuft noch
        return {**base, **evaluate(short)}
    if seen:
        return {**base, "outcome": "running", "run_id": seen, "waited": wait}
    return {**base, "outcome": "no_run", "waited": wait}
