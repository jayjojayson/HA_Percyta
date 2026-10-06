"""Config- und Options-Flow für HA Percyta.

Es wird KEIN Token benötigt: Die Integration läuft innerhalb von Home Assistant
und liest alle Daten direkt über das interne ``hass``-Objekt aus.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback

from .const import (
    CONF_INCLUDE_ADDONS,
    CONF_INCLUDE_ERRORS,
    CONF_INCLUDE_SECRETS,
    CONF_INCLUDE_STORAGE,
    CONF_MASK_SECRETS,
    CONF_OUTPUT_DIR,
    CONF_SCAN_AUTO_ENABLED,
    CONF_SCAN_AUTO_INTERVAL,
    CONF_WRITE_REPORT,
    DEFAULT_INCLUDE_ADDONS,
    DEFAULT_INCLUDE_ERRORS,
    DEFAULT_INCLUDE_SECRETS,
    DEFAULT_INCLUDE_STORAGE,
    DEFAULT_MASK_SECRETS,
    DEFAULT_OUTPUT_DIR,
    DEFAULT_SCAN_AUTO_ENABLED,
    DEFAULT_SCAN_AUTO_INTERVAL,
    DEFAULT_WRITE_REPORT,
    DOMAIN,
    MIN_SCAN_INTERVAL,
)


def _build_schema(defaults: dict[str, Any]) -> vol.Schema:
    """Erzeugt das Optionsschema mit den gegebenen Vorgabewerten."""
    return vol.Schema(
        {
            vol.Optional(
                CONF_INCLUDE_ADDONS,
                default=defaults.get(CONF_INCLUDE_ADDONS, DEFAULT_INCLUDE_ADDONS),
            ): bool,
            vol.Optional(
                CONF_INCLUDE_SECRETS,
                default=defaults.get(CONF_INCLUDE_SECRETS, DEFAULT_INCLUDE_SECRETS),
            ): bool,
            vol.Optional(
                CONF_INCLUDE_ERRORS,
                default=defaults.get(CONF_INCLUDE_ERRORS, DEFAULT_INCLUDE_ERRORS),
            ): bool,
            vol.Optional(
                CONF_INCLUDE_STORAGE,
                default=defaults.get(CONF_INCLUDE_STORAGE, DEFAULT_INCLUDE_STORAGE),
            ): bool,
            vol.Optional(
                CONF_MASK_SECRETS,
                default=defaults.get(CONF_MASK_SECRETS, DEFAULT_MASK_SECRETS),
            ): bool,
            vol.Optional(
                CONF_WRITE_REPORT,
                default=defaults.get(CONF_WRITE_REPORT, DEFAULT_WRITE_REPORT),
            ): bool,
            vol.Optional(
                CONF_OUTPUT_DIR,
                default=defaults.get(CONF_OUTPUT_DIR, DEFAULT_OUTPUT_DIR),
            ): str,
            vol.Optional(
                CONF_SCAN_AUTO_ENABLED,
                default=defaults.get(
                    CONF_SCAN_AUTO_ENABLED, DEFAULT_SCAN_AUTO_ENABLED
                ),
            ): bool,
            vol.Optional(
                CONF_SCAN_AUTO_INTERVAL,
                default=defaults.get(
                    CONF_SCAN_AUTO_INTERVAL, DEFAULT_SCAN_AUTO_INTERVAL
                ),
            ): vol.All(vol.Coerce(int), vol.Range(min=MIN_SCAN_INTERVAL)),
        }
    )


class HAPercytaConfigFlow(ConfigFlow, domain=DOMAIN):
    """Config-Flow für HA Percyta."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Erster (und einziger) Schritt der Einrichtung."""
        # Nur eine Instanz erlauben.
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            return self.async_create_entry(
                title="HA Percyta",
                data={},
                options=user_input,
            )

        return self.async_show_form(
            step_id="user",
            data_schema=_build_schema({}),
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Options-Flow bereitstellen."""
        return HAPercytaOptionsFlow()


class HAPercytaOptionsFlow(OptionsFlow):
    """Options-Flow zum nachträglichen Anpassen der Einstellungen."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Optionen bearbeiten."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=_build_schema(dict(self.config_entry.options)),
        )
