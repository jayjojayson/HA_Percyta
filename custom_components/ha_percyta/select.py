"""Select-Entität für HA Percyta – Scan-Intervall bequem am Gerät wählen."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import (
    CONF_SCAN_AUTO_ENABLED,
    CONF_SCAN_AUTO_INTERVAL,
    DOMAIN,
    APP_MODEL,
    APP_NAME,
    SCAN_INTERVAL_MANUAL,
    SCAN_INTERVAL_OPTIONS,
    VERSION,
)
from .coordinator import HAPercytaCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Select-Entität einrichten."""
    coordinator: HAPercytaCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([HAPercytaIntervalSelect(coordinator, entry)])


class HAPercytaIntervalSelect(SelectEntity):
    """Wählt das Intervall für den automatischen Scan."""

    _attr_name = "HA Percyta Scan-Intervall"
    _attr_icon = "mdi:timer-cog"
    _attr_options = list(SCAN_INTERVAL_OPTIONS)

    def __init__(
        self, coordinator: HAPercytaCoordinator, entry: ConfigEntry
    ) -> None:
        self._coordinator = coordinator
        self._entry = entry
        self._attr_unique_id = f"{entry.entry_id}_scan_interval"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=APP_NAME,
            manufacturer="Wally",
            model=APP_MODEL,
            sw_version=VERSION,
        )

    @property
    def current_option(self) -> str:
        """Aktuell gewähltes Intervall anhand der Optionen ableiten."""
        options = self._entry.options
        if not options.get(CONF_SCAN_AUTO_ENABLED, False):
            return SCAN_INTERVAL_MANUAL
        interval = options.get(CONF_SCAN_AUTO_INTERVAL)
        for label, seconds in SCAN_INTERVAL_OPTIONS.items():
            if seconds == interval:
                return label
        return SCAN_INTERVAL_MANUAL

    async def async_select_option(self, option: str) -> None:
        """Neues Intervall speichern – lädt die Integration neu."""
        seconds = SCAN_INTERVAL_OPTIONS[option]
        new_options = dict(self._entry.options)
        if seconds is None:
            new_options[CONF_SCAN_AUTO_ENABLED] = False
        else:
            new_options[CONF_SCAN_AUTO_ENABLED] = True
            new_options[CONF_SCAN_AUTO_INTERVAL] = seconds

        # Löst über den Update-Listener ein Reload aus und übernimmt das Intervall.
        self.hass.config_entries.async_update_entry(
            self._entry, options=new_options
        )
