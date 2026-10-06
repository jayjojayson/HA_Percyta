"""Registrierung des HA-Percyta-Report-Panels und des WebSocket-Befehls."""

from __future__ import annotations

import logging
import os

import voluptuous as vol

from homeassistant.components import frontend, panel_custom, websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import (
    APP_NAME,
    DOMAIN,
    PANEL_ICON,
    PANEL_LOGO_URL,
    PANEL_STATIC_URL,
    PANEL_TITLE,
    PANEL_URL_PATH,
    VERSION,
    WS_TYPE_REPORT,
    WS_TYPE_REVEAL_SECRET,
    WS_TYPE_SET_OVERRIDE,
)
from .coordinator import HAPercytaCoordinator
from .report import generate_report
from .scanner import resolve_secret_value

_LOGGER = logging.getLogger(__name__)

_WS_FLAG = "_ws_registered"

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
            vol.Required("entry_id"): str,
            vol.Required("source"): vol.In(["data", "options"]),
            vol.Required("key"): str,
        }
    )
    @websocket_api.require_admin
    @callback
    def ws_reveal_secret(hass, connection, msg):
        """Liefert den Klartext eines erkannten Secrets (nur für Admins, auf Klick)."""
        entry = hass.config_entries.async_get_entry(msg["entry_id"])
        value = (
            resolve_secret_value(getattr(entry, msg["source"], None), msg["key"])
            if entry is not None
            else None
        )
        if value is None:
            connection.send_error(
                msg["id"], "not_found", "Secret nicht gefunden."
            )
            return
        connection.send_result(msg["id"], {"value": value})

    websocket_api.async_register_command(hass, ws_get_report)
    websocket_api.async_register_command(hass, ws_reveal_secret)
    websocket_api.async_register_command(hass, ws_set_override)
    hass.data.setdefault(DOMAIN, {})[_WS_FLAG] = True


async def async_setup_frontend(hass: HomeAssistant) -> None:
    """Statische JS-Datei ausliefern, WebSocket + Panel registrieren."""
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
