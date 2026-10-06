"""Button für HA Percyta – löst einen manuellen Scan aus."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import APP_MODEL, APP_NAME, DOMAIN, VERSION
from .coordinator import HAPercytaCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Button einrichten."""
    coordinator: HAPercytaCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([HAPercytaScanButton(coordinator, entry)])


class HAPercytaScanButton(ButtonEntity):
    """Button, der einen manuellen Scan startet."""

    _attr_name = "HA Percyta Scan starten"
    _attr_icon = "mdi:shield-search"

    def __init__(
        self, coordinator: HAPercytaCoordinator, entry: ConfigEntry
    ) -> None:
        self._coordinator = coordinator
        self._attr_unique_id = f"{entry.entry_id}_scan_button"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=APP_NAME,
            manufacturer="Wally",
            model=APP_MODEL,
            sw_version=VERSION,
        )

    async def async_press(self) -> None:
        """Scan auslösen."""
        await self._coordinator.async_request_refresh()
