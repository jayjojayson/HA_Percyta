"""HA Percyta – Home Assistant Permissions & Privacy Scanner.

Scannt Integrationen, Add-ons, Custom-Cards, Blueprints, Benutzer, Tokens sowie
gespeicherte API-Keys/Secrets und bewertet System-Zugriffe (GPS, Kamera, Root …).
Zusätzlich werden Speicher-, CPU- und RAM-Auslastung erfasst.
Läuft vollständig lokal innerhalb von Home Assistant – ohne Token, ohne REST-API.
"""

from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse

from .const import CONF_IGNORE_LABELS, DOMAIN, SERVICE_EXPORT, SERVICE_SCAN
from .coordinator import HAPercytaCoordinator
from .panel_setup import async_remove_frontend, async_setup_frontend
from .report import generate_report

_LOGGER = logging.getLogger(__name__)

PLATFORMS = ["sensor", "button", "select"]


def _has_coordinator(hass: HomeAssistant) -> bool:
    """Prüft, ob noch mindestens ein Coordinator (= Entry) aktiv ist."""
    return any(
        isinstance(v, HAPercytaCoordinator) for v in hass.data.get(DOMAIN, {}).values()
    )


async def _async_frontend(hass: HomeAssistant) -> None:
    """Panel, WebSocket-Befehle und Datenbank-Werkzeuge bereitstellen.

    Ein Fehler hier darf die Integration nie stoppen – er wird aber deutlich protokolliert.
    """
    try:
        await async_setup_frontend(hass)
    except Exception:  # noqa: BLE001
        _LOGGER.exception("HA Percyta: Panel konnte nicht eingerichtet werden")


def _options_key(options: dict) -> dict:
    """Optionen ohne die, die keinen Neustart der Integration brauchen."""
    return {k: v for k, v in dict(options).items() if k != CONF_IGNORE_LABELS}


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Integration aus einem Config-Entry aufsetzen."""
    # Panel zuerst: Es bleibt so auch erreichbar, wenn der erste Scan scheitert.
    await _async_frontend(hass)
    coordinator = HAPercytaCoordinator(hass, entry)
    coordinator.options_seen = _options_key(entry.options)
    await coordinator.async_load_overrides()
    await coordinator.async_load_baseline()
    await coordinator.async_load_finding_states()
    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    _register_services(hass)
    await _async_frontend(hass)  # falls das Panel zwischenzeitlich entfernt wurde
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Integration entladen."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        hass.data[DOMAIN].pop(entry.entry_id, None)
        if not _has_coordinator(hass):
            hass.services.async_remove(DOMAIN, SERVICE_SCAN)
            hass.services.async_remove(DOMAIN, SERVICE_EXPORT)
            # Beim Neuladen bleibt das Panel stehen (sonst verschwindet es kurz aus der
            # Seitenleiste – oder ganz, wenn das erneute Einrichten scheitert). Entfernt
            # wird es nur, wenn die Integration deaktiviert oder gelöscht wird.
            if entry.disabled_by:
                async_remove_frontend(hass)
    return unloaded


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Integration gelöscht → Panel aus der Seitenleiste entfernen."""
    if not _has_coordinator(hass):
        async_remove_frontend(hass)


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Nach Options-Änderung neu laden (z. B. Intervall/Auto-Scan).

    Ändern sich nur die ignorierten Labels, genügt ein neuer Scan – ohne Neuladen.
    """
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if isinstance(coordinator, HAPercytaCoordinator) and coordinator.options_seen == _options_key(entry.options):
        await coordinator.async_request_refresh()
        return
    await hass.config_entries.async_reload(entry.entry_id)


def _get_coordinator(hass: HomeAssistant) -> HAPercytaCoordinator | None:
    """Ersten verfügbaren Coordinator zurückgeben."""
    for value in hass.data.get(DOMAIN, {}).values():
        if isinstance(value, HAPercytaCoordinator):
            return value
    return None


def _register_services(hass: HomeAssistant) -> None:
    """Services registrieren (nur einmal)."""
    if hass.services.has_service(DOMAIN, SERVICE_SCAN):
        return

    async def handle_scan(call: ServiceCall) -> dict:
        coordinator = _get_coordinator(hass)
        if coordinator is None:
            return {"error": "HA Percyta ist nicht eingerichtet."}
        await coordinator.async_request_refresh()
        data = coordinator.data or {}
        return {
            "counts": data.get("counts", {}),
            "report_path": data.get("report_path"),
        }

    async def handle_export(call: ServiceCall) -> dict:
        coordinator = _get_coordinator(hass)
        if coordinator is None or not coordinator.data:
            return {"error": "Noch keine Scan-Daten vorhanden. Erst 'scan' ausführen."}
        markdown = await hass.async_add_executor_job(
            generate_report, coordinator.data
        )
        return {
            "report_path": coordinator.data.get("report_path"),
            "markdown": markdown,
        }

    hass.services.async_register(
        DOMAIN,
        SERVICE_SCAN,
        handle_scan,
        schema=vol.Schema({}),
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_EXPORT,
        handle_export,
        schema=vol.Schema({}),
        supports_response=SupportsResponse.ONLY,
    )
