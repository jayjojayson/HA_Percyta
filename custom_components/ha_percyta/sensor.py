"""Sensoren für HA Percyta."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import PERCENTAGE, UnitOfInformation
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import APP_MODEL, APP_NAME, DOMAIN, VERSION
from .coordinator import HAPercytaCoordinator

_GIB = 1024 ** 3


@dataclass(frozen=True, kw_only=True)
class HAPercytaSensorDescription(SensorEntityDescription):
    """Beschreibt einen HA Percyta-Sensor inkl. Wert-/Attribut-Funktionen."""

    value_fn: Callable[[dict[str, Any]], Any]
    attr_fn: Callable[[dict[str, Any]], dict[str, Any]] | None = None


def _last_scan(data: dict[str, Any]) -> datetime | None:
    raw = data.get("generated_at")
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw)
    except (ValueError, TypeError):
        return None


def _next_scan(data: dict[str, Any]) -> datetime | None:
    if not data.get("auto_enabled"):
        return None
    last = _last_scan(data)
    interval = data.get("auto_interval")
    if last is None or not interval:
        return None
    return last + timedelta(seconds=interval)


def _sys(data: dict[str, Any], *keys: str) -> Any:
    """Verschachtelten Wert aus data['system'] defensiv lesen."""
    node: Any = data.get("system", {}) or {}
    for key in keys:
        if not isinstance(node, dict):
            return None
        node = node.get(key)
    return node


def _gib(value: Any) -> Any:
    """Bytes → GiB (1 Nachkommastelle), None-sicher."""
    if value is None:
        return None
    try:
        return round(float(value) / _GIB, 1)
    except (TypeError, ValueError):
        return None


SENSORS: tuple[HAPercytaSensorDescription, ...] = (
    HAPercytaSensorDescription(
        key="risk_total",
        name="HA Percyta Sicherheitsfunde",
        icon="mdi:shield-alert",
        native_unit_of_measurement="Funde",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d.get("counts", {}).get("risk_total", 0),
        attr_fn=lambda d: {
            "high_risk": d.get("counts", {}).get("high_risk", 0),
            "medium_risk": d.get("counts", {}).get("medium_risk", 0),
        },
    ),
    HAPercytaSensorDescription(
        key="integrations",
        name="HA Percyta Integrationen",
        icon="mdi:puzzle",
        native_unit_of_measurement="Integrationen",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d.get("counts", {}).get("integrations", 0),
        attr_fn=lambda d: {
            "high_risk_domains": [
                i["domain"]
                for i in d.get("integrations", [])
                if i["analysis"]["risk_level"] == "high"
            ],
        },
    ),
    HAPercytaSensorDescription(
        key="addons",
        name="HA Percyta Apps",
        icon="mdi:package-variant",
        native_unit_of_measurement="Add-ons",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d.get("counts", {}).get("addons", 0),
        attr_fn=lambda d: {
            "root_addons": [
                a["name"]
                for a in d.get("addons", [])
                if a["analysis"].get("full_access")
                or a["analysis"].get("privileged")
            ],
        },
    ),
    HAPercytaSensorDescription(
        key="secrets_found",
        name="HA Percyta API-Keys & Secrets",
        icon="mdi:key-variant",
        native_unit_of_measurement="Secrets",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d.get("counts", {}).get("secrets_found", 0),
        attr_fn=lambda d: {
            "integrations_with_secrets": [
                i["domain"]
                for i in d.get("integrations", [])
                if i["analysis"]["has_secrets"]
            ],
        },
    ),
    HAPercytaSensorDescription(
        key="stale_tokens",
        name="HA Percyta Ungenutzte Tokens",
        icon="mdi:key-remove",
        native_unit_of_measurement="Tokens",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d.get("counts", {}).get("stale_tokens", 0),
        attr_fn=lambda d: {
            "long_lived_total": d.get("counts", {}).get("long_lived_tokens", 0),
            "stale_users": sorted(
                {t["user"] for t in d.get("tokens", []) if t.get("stale")}
            ),
        },
    ),
    HAPercytaSensorDescription(
        key="cloud",
        name="HA Percyta Cloud-Integrationen",
        icon="mdi:cloud-upload",
        native_unit_of_measurement="Integrationen",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d.get("counts", {}).get("cloud", 0),
        attr_fn=lambda d: {
            "domains": [
                i["domain"]
                for i in d.get("integrations", [])
                if i["analysis"].get("has_external_access")
            ],
        },
    ),
    HAPercytaSensorDescription(
        key="total_devices",
        name="HA Percyta Geräte",
        icon="mdi:devices",
        native_unit_of_measurement="Geräte",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d.get("counts", {}).get("total_devices", 0),
    ),
    HAPercytaSensorDescription(
        key="total_entities",
        name="HA Percyta Entitäten",
        icon="mdi:shape",
        native_unit_of_measurement="Entitäten",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d.get("counts", {}).get("total_entities", 0),
    ),
    HAPercytaSensorDescription(
        key="new_findings",
        name="HA Percyta Neue Funde",
        icon="mdi:new-box",
        native_unit_of_measurement="Funde",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d.get("counts", {}).get("new_total", 0),
        attr_fn=lambda d: {
            "new_integrations": [
                i["domain"] for i in d.get("integrations", []) if i.get("is_new")
            ],
            "new_apps": [
                a["name"] for a in d.get("addons", []) if a.get("is_new")
            ],
            "new_blueprints": [
                b.get("name") or b.get("path")
                for b in d.get("blueprints", [])
                if b.get("is_new")
            ],
            "new_custom_cards": [
                i.get("name") for i in d.get("new_items", []) if i.get("type") == "custom_cards"
            ],
            "new_users": [
                u.get("name") for u in d.get("users", []) if u.get("is_new")
            ],
        },
    ),
    # ----------------------------------------------------------------- #
    # System / Speicher (neu ab v1.1.1)
    # ----------------------------------------------------------------- #
    HAPercytaSensorDescription(
        key="cpu_percent",
        name="HA Percyta CPU-Auslastung",
        icon="mdi:cpu-64-bit",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: _sys(d, "cpu", "percent"),
        attr_fn=lambda d: {
            "cores": _sys(d, "cpu", "count"),
            "load_1m": (_sys(d, "load", "1m")),
            "load_5m": (_sys(d, "load", "5m")),
            "load_15m": (_sys(d, "load", "15m")),
        },
    ),
    HAPercytaSensorDescription(
        key="ram_percent",
        name="HA Percyta RAM-Auslastung",
        icon="mdi:memory",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: _sys(d, "ram", "percent"),
        attr_fn=lambda d: {
            "total_gib": _gib(_sys(d, "ram", "total")),
            "used_gib": _gib(_sys(d, "ram", "used")),
            "available_gib": _gib(_sys(d, "ram", "available")),
            "swap_percent": _sys(d, "swap", "percent"),
        },
    ),
    HAPercytaSensorDescription(
        key="disk_percent",
        name="HA Percyta Speicher-Belegung",
        icon="mdi:harddisk",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: _sys(d, "disk", "percent"),
        attr_fn=lambda d: {
            "total_gib": _gib(_sys(d, "disk", "total")),
            "used_gib": _gib(_sys(d, "disk", "used")),
            "free_gib": _gib(_sys(d, "disk", "free")),
            "source": _sys(d, "disk", "source") or "lokal",
        },
    ),
    HAPercytaSensorDescription(
        key="disk_free",
        name="HA Percyta Speicher frei",
        icon="mdi:harddisk-plus",
        native_unit_of_measurement=UnitOfInformation.GIBIBYTES,
        device_class=SensorDeviceClass.DATA_SIZE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: _gib(_sys(d, "disk", "free")),
    ),
    HAPercytaSensorDescription(
        key="last_scan",
        name="HA Percyta Letzter Scan",
        icon="mdi:clock-check",
        device_class=SensorDeviceClass.TIMESTAMP,
        value_fn=_last_scan,
    ),
    HAPercytaSensorDescription(
        key="next_scan",
        name="HA Percyta Nächster Scan",
        icon="mdi:clock-alert",
        device_class=SensorDeviceClass.TIMESTAMP,
        value_fn=_next_scan,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Sensoren einrichten."""
    coordinator: HAPercytaCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        HAPercytaSensor(coordinator, entry, description) for description in SENSORS
    )


class HAPercytaSensor(CoordinatorEntity[HAPercytaCoordinator], SensorEntity):
    """Sensor, der Kennzahlen des letzten Scans anzeigt."""

    entity_description: HAPercytaSensorDescription
    _attr_has_entity_name = False

    def __init__(
        self,
        coordinator: HAPercytaCoordinator,
        entry: ConfigEntry,
        description: HAPercytaSensorDescription,
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=APP_NAME,
            manufacturer="Wally",
            model=APP_MODEL,
            sw_version=VERSION,
        )

    @property
    def native_value(self) -> Any:
        return self.entity_description.value_fn(self.coordinator.data or {})

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        if self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(self.coordinator.data or {})
