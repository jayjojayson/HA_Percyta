"""Registrierung des HA-Percyta-Report-Panels und des WebSocket-Befehls."""

from __future__ import annotations

import logging
import os
import time

import voluptuous as vol

from homeassistant.components import frontend, panel_custom, websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import (
    APP_NAME,
    CONF_ALLOW_REVEAL,
    DB_MAX_IDS,
    DEFAULT_ALLOW_REVEAL,
    DOMAIN,
    PANEL_ICON,
    PANEL_LOGO_URL,
    PANEL_STATIC_URL,
    PANEL_TITLE,
    PANEL_URL_PATH,
    REVEAL_RATE_LIMIT,
    REVEAL_RATE_WINDOW,
    VERSION,
    WS_TYPE_DB_BACKUP,
    WS_TYPE_DB_BACKUP_DELETE,
    WS_TYPE_DB_INFO,
    WS_TYPE_DB_CLEANUP,
    WS_TYPE_DB_CLEANUP_PREVIEW,
    WS_TYPE_DEVICE_REMOVE,
    WS_TYPE_ENTITY_DISABLE,
    WS_TYPE_ENTRY_RELOAD,
    WS_TYPE_JOB_STATUS,
    WS_TYPE_DB_LIST,
    WS_TYPE_DB_LOG,
    WS_TYPE_REGISTRY_REMOVE,
    WS_TYPE_TOKEN_REVOKE,
    WS_TYPE_DB_PURGE,
    WS_TYPE_DB_RENAME,
    WS_TYPE_DB_REPLACE,
    WS_TYPE_REPORT,
    WS_TYPE_REVEAL_SECRET,
    WS_TYPE_SET_FINDING_STATE,
    WS_TYPE_SET_OVERRIDE,
)
from .coordinator import HAPercytaCoordinator
from .db_tools import DbToolError, DbTools
from .report import generate_report
from .scanner import resolve_secret_value

_LOGGER = logging.getLogger(__name__)

_WS_FLAG = "_ws_registered"
_TOOLS = "_tools"
_REVEAL_HITS = "_reveal_hits"

EMPTY_REPORT = (
    f"# 🛡️ {APP_NAME}\n\nNoch kein Scan-Ergebnis vorhanden.\n\n"
    "Bitte oben **Neu scannen** drücken oder den Button "
    "*HA Percyta Scan starten* nutzen."
)


def _get_coordinator(hass: HomeAssistant) -> HAPercytaCoordinator | None:
    for value in hass.data.get(DOMAIN, {}).values():
        if isinstance(value, HAPercytaCoordinator):
            return value
    return None


@callback
def _register_ws(hass: HomeAssistant) -> None:
    """WebSocket-Befehl zum Abrufen des Reports registrieren (einmalig)."""
    if hass.data.get(DOMAIN, {}).get(_WS_FLAG):
        return

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_REPORT})
    @websocket_api.require_admin
    @callback
    def ws_get_report(hass, connection, msg):
        coordinator = _get_coordinator(hass)
        data = coordinator.data if coordinator else None
        connection.send_result(
            msg["id"],
            {
                "data": data,
                "markdown": generate_report(data) if data else EMPTY_REPORT,
                "generated_at": data.get("generated_at") if data else None,
                "version": VERSION,
            },
        )

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_SET_OVERRIDE,
            vol.Required("entry_id"): str,
            vol.Optional("level"): vol.Any(None, str),
        }
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_set_override(hass, connection, msg):
        coordinator = _get_coordinator(hass)
        if coordinator is None:
            connection.send_error(
                msg["id"], "not_ready", "HA Percyta ist nicht eingerichtet."
            )
            return
        result = await coordinator.async_set_override(
            msg["entry_id"], msg.get("level")
        )
        connection.send_result(msg["id"], result)

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_REVEAL_SECRET,
            vol.Required("entry_id"): vol.All(str, vol.Length(min=1, max=64)),
            vol.Required("source"): vol.In(["data", "options"]),
            vol.Required("key"): vol.All(str, vol.Length(min=1, max=200)),
            vol.Optional("purpose", default="show"): vol.In(["show", "copy"]),
        }
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_reveal_secret(hass, connection, msg):
        """Klartext eines erkannten Secrets – nur Admins, auf Klick, begrenzt und protokolliert.

        * Abschaltbar über die Option "Klartext-Anzeige erlauben".
        * Höchstens REVEAL_RATE_LIMIT Abrufe je Benutzer in REVEAL_RATE_WINDOW Sekunden.
        * Nur Felder, die als Secret erkannt werden (keine beliebige Konfiguration).
        * Jeder Abruf landet im Protokoll (ohne den Wert) und im HA-Log.
        """
        coordinator = _get_coordinator(hass)
        user = connection.user
        user_name = getattr(user, "name", None) or getattr(user, "id", "?")
        if coordinator is None or not coordinator.entry.options.get(
            CONF_ALLOW_REVEAL, DEFAULT_ALLOW_REVEAL
        ):
            connection.send_error(msg["id"], "not_allowed", "Klartext-Anzeige ist deaktiviert.")
            return
        hits = hass.data.setdefault(DOMAIN, {}).setdefault(_REVEAL_HITS, {})
        now = time.monotonic()
        recent = [t for t in hits.get(user.id, []) if now - t < REVEAL_RATE_WINDOW]
        if len(recent) >= REVEAL_RATE_LIMIT:
            hits[user.id] = recent
            connection.send_error(msg["id"], "rate_limited", "Zu viele Abrufe – bitte kurz warten.")
            return
        recent.append(now)
        hits[user.id] = recent

        entry = hass.config_entries.async_get_entry(msg["entry_id"])
        value = (
            resolve_secret_value(getattr(entry, msg["source"], None), msg["key"])
            if entry is not None
            else None
        )
        tools = _get_tools(hass)
        target = f"{entry.domain if entry else '?'} / {msg['source']}.{msg['key']}"
        if tools is not None:
            await tools.async_log(user_name, "secret_" + msg["purpose"], value is not None, target=target)
        if value is None:
            connection.send_error(msg["id"], "not_found", "Secret nicht gefunden.")
            return
        _LOGGER.warning("HA Percyta: Secret %s wurde von %s abgerufen (%s)", target, user_name, msg["purpose"])
        connection.send_result(msg["id"], {"value": value})

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_SET_FINDING_STATE,
            vol.Required("ids"): vol.All([str], vol.Length(min=1, max=500)),
            vol.Required("status"): vol.In(["open", "known", "snoozed", "hidden"]),
            vol.Optional("days"): vol.All(int, vol.Range(min=1, max=365)),
            vol.Optional("note"): vol.All(str, vol.Length(max=200)),
        }
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_set_finding_state(hass, connection, msg):
        """Status von Befunden ändern (betrifft nur Percytas eigene Liste, nicht HA)."""
        coordinator = _get_coordinator(hass)
        if coordinator is None:
            connection.send_error(
                msg["id"], "not_ready", "HA Percyta ist nicht eingerichtet."
            )
            return
        result = await coordinator.async_set_finding_state(
            msg["ids"], msg["status"], msg.get("days"), msg.get("note")
        )
        connection.send_result(msg["id"], result)

    # ------------------------------------------------------------------ #
    # Datenbank-Werkzeuge
    # ------------------------------------------------------------------ #
    backup_choice = vol.In(["db_copy", "db_copy_replace", "ha_backup", "skip"])
    entity_list = vol.All([vol.All(str, vol.Length(min=3, max=255))], vol.Length(min=1, max=DB_MAX_IDS))

    async def _run(connection, msg, coro_fn):
        tools = _get_tools(hass)
        if tools is None:
            connection.send_error(msg["id"], "not_ready", "HA Percyta ist nicht eingerichtet.")
            return
        user = getattr(connection.user, "name", None) or getattr(connection.user, "id", None)
        try:
            if msg.get("background"):
                # Als Hintergrund-Auftrag starten; das Panel fragt den Fortschritt ab.
                params = {k: v for k, v in msg.items() if k in ("ids", "old", "new", "kind", "keep_days", "scopes", "repack")}
                if "ids" in params:
                    params["count"] = len(params["ids"])
                    params["ids"] = params["ids"][:20]
                job = tools.start_job(msg["type"].split("/", 1)[-1], lambda: coro_fn(tools, user), params)
                connection.send_result(msg["id"], {"job": job})
                return
            result = await coro_fn(tools, user)
        except DbToolError as err:
            connection.send_result(msg["id"], {"error": err.code, "message": str(err), "params": err.params})
            return
        except Exception as err:  # noqa: BLE001
            _LOGGER.exception("HA Percyta: Datenbank-Aktion fehlgeschlagen")
            connection.send_result(msg["id"], {"error": "action_failed", "message": str(err)})
            return
        connection.send_result(msg["id"], result)

    @websocket_api.websocket_command(
        {vol.Required("type"): WS_TYPE_DB_INFO, vol.Optional("ids", default=[]): vol.All([str], vol.Length(max=50))}
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_db_info(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_info(msg["ids"]))

    @websocket_api.websocket_command(
        {vol.Required("type"): WS_TYPE_DB_BACKUP, vol.Optional("background", default=False): bool, vol.Required("kind"): vol.In(["db_copy", "db_copy_replace", "ha_backup"])}
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_db_backup(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_backup(msg["kind"], u))

    @websocket_api.websocket_command(
        {vol.Required("type"): WS_TYPE_DB_BACKUP_DELETE, vol.Required("name"): vol.All(str, vol.Length(max=64))}
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_db_backup_delete(hass, connection, msg):
        async def _do(t, u):
            await t.async_delete_copy(msg["name"], u)
            return {"success": True}

        await _run(connection, msg, _do)

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_DB_PURGE, vol.Optional("background", default=False): bool,
            vol.Required("ids"): entity_list,
            vol.Required("scopes"): vol.All(
                [vol.In(["states", "statistics", "statistics_short", "statistics_long"])], vol.Length(min=1, max=4)
            ),
            vol.Optional("keep_days", default=0): vol.All(int, vol.Range(min=0, max=3650)),
            vol.Required("backup"): backup_choice,
            vol.Required("confirm"): True,
        }
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_db_purge(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_purge(msg["ids"], msg["scopes"], msg["backup"], u, msg["keep_days"]))

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_DB_LIST})
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_db_list(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_list())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_DB_CLEANUP, vol.Optional("background", default=False): bool,
            vol.Required("keep_days"): vol.All(int, vol.Range(min=1, max=3650)),
            vol.Optional("repack", default=False): bool,
            vol.Required("backup"): backup_choice,
            vol.Required("confirm"): True,
        }
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_db_cleanup(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_cleanup(msg["keep_days"], msg["repack"], msg["backup"], u))

    @websocket_api.websocket_command(
        {vol.Required("type"): WS_TYPE_DB_CLEANUP_PREVIEW, vol.Required("keep_days"): vol.All(int, vol.Range(min=1, max=3650))}
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_db_cleanup_preview(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_cleanup_preview(msg["keep_days"]))

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_REGISTRY_REMOVE, vol.Optional("background", default=False): bool,
            vol.Required("ids"): entity_list,
            vol.Optional("purge_data", default=False): bool,
            vol.Required("backup"): backup_choice,
            vol.Required("confirm"): True,
        }
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_registry_remove(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_registry_remove(msg["ids"], msg["purge_data"], msg["backup"], u))

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_TOKEN_REVOKE,
            vol.Required("token_id"): vol.All(str, vol.Length(min=1, max=128)),
            vol.Required("confirm"): True,
        }
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_token_revoke(hass, connection, msg):
        own = getattr(connection, "refresh_token_id", None)
        await _run(connection, msg, lambda t, u: t.async_revoke_token(msg["token_id"], own, u))

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_DB_RENAME, vol.Optional("background", default=False): bool,
            vol.Required("old"): vol.All(str, vol.Length(max=255)),
            vol.Required("new"): vol.All(str, vol.Length(max=255)),
            vol.Required("backup"): backup_choice,
            vol.Required("confirm"): True,
        }
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_db_rename(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_rename(msg["old"], msg["new"], msg["backup"], u))

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_DB_REPLACE, vol.Optional("background", default=False): bool,
            vol.Required("old"): vol.All(str, vol.Length(max=255)),
            vol.Required("new"): vol.All(str, vol.Length(max=255)),
            vol.Optional("remove_old", default=False): bool,
            vol.Optional("purge_new", default=False): bool,
            vol.Optional("force", default=False): bool,
            vol.Required("backup"): backup_choice,
            vol.Required("confirm"): True,
        }
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_db_replace(hass, connection, msg):
        await _run(
            connection, msg,
            lambda t, u: t.async_replace(
                msg["old"], msg["new"], remove_old=msg["remove_old"], purge_new=msg["purge_new"],
                force=msg["force"], backup=msg["backup"], user=u,
            ),
        )

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_JOB_STATUS})
    @websocket_api.require_admin
    @callback
    def ws_job_status(hass, connection, msg):
        tools = _get_tools(hass)
        connection.send_result(msg["id"], {"job": tools.job_public() if tools else None})

    websocket_api.async_register_command(hass, ws_job_status)

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_DB_LOG})
    @websocket_api.require_admin
    @callback
    def ws_db_log(hass, connection, msg):
        tools = _get_tools(hass)
        connection.send_result(msg["id"], {"entries": list(reversed(tools.audit)) if tools else []})

    @websocket_api.websocket_command(
        {vol.Required("type"): WS_TYPE_ENTITY_DISABLE, vol.Required("ids"): entity_list, vol.Required("confirm"): True}
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_entity_disable(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_disable_entities(msg["ids"], u))

    @websocket_api.websocket_command(
        {vol.Required("type"): WS_TYPE_ENTRY_RELOAD, vol.Required("entry_id"): vol.All(str, vol.Length(min=1, max=64))}
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_entry_reload(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_reload_entry(msg["entry_id"], u))

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_DEVICE_REMOVE, vol.Optional("background", default=False): bool,
            vol.Required("ids"): vol.All([vol.All(str, vol.Length(min=1, max=64))], vol.Length(min=1, max=200)),
            vol.Required("backup"): vol.In(["ha_backup", "skip"]),
            vol.Required("confirm"): True,
        }
    )
    @websocket_api.require_admin
    @websocket_api.async_response
    async def ws_device_remove(hass, connection, msg):
        await _run(connection, msg, lambda t, u: t.async_remove_devices(msg["ids"], msg["backup"], u))

    for handler in (ws_entity_disable, ws_entry_reload, ws_device_remove):
        websocket_api.async_register_command(hass, handler)

    for handler in (ws_db_info, ws_db_backup, ws_db_backup_delete, ws_db_purge, ws_db_rename, ws_db_replace, ws_db_log,
                    ws_db_list, ws_db_cleanup, ws_db_cleanup_preview, ws_registry_remove, ws_token_revoke):
        websocket_api.async_register_command(hass, handler)

    websocket_api.async_register_command(hass, ws_get_report)
    websocket_api.async_register_command(hass, ws_set_finding_state)
    websocket_api.async_register_command(hass, ws_reveal_secret)
    websocket_api.async_register_command(hass, ws_set_override)
    hass.data.setdefault(DOMAIN, {})[_WS_FLAG] = True


def _get_tools(hass: HomeAssistant) -> DbTools | None:
    return hass.data.get(DOMAIN, {}).get(_TOOLS)


async def async_setup_frontend(hass: HomeAssistant) -> None:
    """Statische JS-Datei ausliefern, WebSocket + Panel registrieren."""
    if _get_tools(hass) is None:

        def _changed() -> None:
            coordinator = _get_coordinator(hass)
            if coordinator is not None:
                hass.async_create_task(coordinator.async_request_refresh())

        tools = DbTools(hass, on_change=_changed)
        await tools.async_load()
        hass.data.setdefault(DOMAIN, {})[_TOOLS] = tools
    _register_ws(hass)

    js_path = os.path.join(
        os.path.dirname(__file__), "panel", "ha_percyta_panel.js"
    )

    logo_path = os.path.join(os.path.dirname(__file__), "brand", "icon.png")

    # Statische Ressourcen bereitstellen (Panel-Skript + Logo für die Überschrift).
    static_paths = [(PANEL_STATIC_URL, js_path)]
    if os.path.isfile(logo_path):
        static_paths.append((PANEL_LOGO_URL, logo_path))
    try:
        from homeassistant.components.http import StaticPathConfig

        await hass.http.async_register_static_paths(
            [StaticPathConfig(url, path, False) for url, path in static_paths]
        )
    except (ImportError, RuntimeError):
        # Ältere Cores oder bereits registriert – Fallback / ignorieren.
        for url, path in static_paths:
            try:
                hass.http.register_static_path(url, path, False)
            except Exception:  # noqa: BLE001
                pass

    # Panel nur registrieren, wenn noch nicht vorhanden.
    if PANEL_URL_PATH in hass.data.get("frontend_panels", {}):
        return

    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="ha-percyta-panel",
        frontend_url_path=PANEL_URL_PATH,
        module_url=PANEL_STATIC_URL,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        require_admin=True,
        embed_iframe=False,
    )


@callback
def async_remove_frontend(hass: HomeAssistant) -> None:
    """Panel wieder aus der Seitenleiste entfernen."""
    if PANEL_URL_PATH in hass.data.get("frontend_panels", {}):
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
