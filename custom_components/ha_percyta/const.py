"""Konstanten für HA Percyta."""

from __future__ import annotations

DOMAIN = "ha_percyta"
VERSION = "1.2.1"

# Konfigurations-/Options-Keys
CONF_OUTPUT_DIR = "output_dir"
CONF_SCAN_AUTO_ENABLED = "scan_auto_enabled"
CONF_SCAN_AUTO_INTERVAL = "scan_auto_interval"
CONF_INCLUDE_ADDONS = "include_addons"
CONF_INCLUDE_SECRETS = "include_secrets"
CONF_INCLUDE_ERRORS = "include_errors"
CONF_INCLUDE_STORAGE = "include_storage"
CONF_MASK_SECRETS = "mask_secrets"
CONF_WRITE_REPORT = "write_report"

# Standard-Werte
DEFAULT_OUTPUT_DIR = "custom_components/ha_percyta/output"
DEFAULT_SCAN_AUTO_ENABLED = False
DEFAULT_SCAN_AUTO_INTERVAL = 3600  # 1 Stunde
DEFAULT_INCLUDE_ADDONS = True
DEFAULT_INCLUDE_SECRETS = True
DEFAULT_INCLUDE_ERRORS = True
DEFAULT_INCLUDE_STORAGE = True
DEFAULT_MASK_SECRETS = True
DEFAULT_WRITE_REPORT = True

MIN_SCAN_INTERVAL = 300  # 5 Minuten
MAX_ERRORS = 50  # max. Anzahl wichtiger Fehler im Report
STALE_TOKEN_DAYS = 90  # Long-Lived-Token gilt danach als "lange ungenutzt"

# Auswahlbare Scan-Intervalle (Label → Sekunden; None = kein Auto-Scan)
SCAN_INTERVAL_MANUAL = "Manuell"
SCAN_INTERVAL_OPTIONS: dict[str, int | None] = {
    SCAN_INTERVAL_MANUAL: None,
    "Stündlich": 3600,
    "Täglich": 86400,
    "Wöchentlich": 604800,
    "Monatlich": 2592000,
}

# Services
SERVICE_SCAN = "scan"
SERVICE_EXPORT = "export"

# Anzeigename / Branding (technische IDs wie DOMAIN bleiben unverändert)
APP_NAME = "HA Percyta"
APP_SUBTITLE = "Permissions, Privacy & Data"
APP_MODEL = "Permissions, Privacy & Data Scanner"

# Report-Panel (Custom-Panel in der Seitenleiste)
PANEL_URL_PATH = "ha_percyta_report"
PANEL_STATIC_URL = "/ha_percyta_static/ha_percyta_panel.js"
PANEL_LOGO_URL = "/ha_percyta_static/logo.png"
PANEL_TITLE = APP_NAME
PANEL_ICON = "mdi:shield-lock"
WS_TYPE_REPORT = "ha_percyta/report"
WS_TYPE_SET_OVERRIDE = "ha_percyta/set_override"
WS_TYPE_REVEAL_SECRET = "ha_percyta/reveal_secret"
WS_TYPE_SET_FINDING_STATE = "ha_percyta/set_finding_state"

# Persistenter Speicher für manuelle Risiko-Overrides (Store-Key)
OVERRIDES_STORAGE_KEY = "ha_percyta_overrides"
OVERRIDES_STORAGE_VERSION = 1
RISK_LEVELS = ("low", "medium", "high")

# Persistenter Speicher für den Vergleichsstand ("Neu seit letztem Scan")
SNAPSHOT_STORAGE_KEY = "ha_percyta_snapshot"
SNAPSHOT_STORAGE_VERSION = 1
EVENT_NEW_FINDINGS = "ha_percyta_new_findings"

# ---------------------------------------------------------------------------
# Befunde (findings.py)
# ---------------------------------------------------------------------------
FINDINGS_STORAGE_KEY = "ha_percyta_findings"
FINDINGS_STORAGE_VERSION = 1
FINDING_STATUSES = ("open", "known", "snoozed", "hidden")
SNOOZE_MAX_DAYS = 365
RESOLVED_KEEP_DAYS = 30  # "Zuletzt behoben" wird so lange vorgehalten
MAX_RESOLVED = 50
MAX_FINDINGS = 500
MAX_FINDING_ITEMS = 50  # betroffene Objekte je Befund
UNUSED_AFTER_DAYS = 90  # Automation/Skript gilt danach als "lange nicht ausgelöst"
NEVER_USED_TOKEN_GRACE_DAYS = 14  # frisch angelegte, noch nie genutzte Tokens zählen nicht
BACKUP_MAX_AGE_DAYS = 7
DISK_WARN_PERCENT = 85
DISK_CRIT_PERCENT = 95
DB_HOTSPOT_SHARE = 10  # % der Zustandszeilen, ab dem eine Entität auffällt
DB_HOTSPOT_MIN_ROWS = 50000
# Domains, deren Ausfall/Fehlverweis besonders ernst genommen wird.
CRITICAL_DOMAINS = frozenset({"lock", "alarm_control_panel", "valve", "siren"})

# ---------------------------------------------------------------------------
# Speicher / System-Analyse
# ---------------------------------------------------------------------------

# Bekannte Speicher-Verbraucher unter <config> für die Aufschlüsselung.
# (label, relativer_pfad, typ)  – typ: "dir" | "file" | "db"
STORAGE_TARGETS: tuple[tuple[str, str, str], ...] = (
    ("Recorder-Datenbank", "home-assistant_v2.db", "db"),
    ("Backups", "backups", "dir"),
    ("Custom Components", "custom_components", "dir"),
    ("Medien", "media", "dir"),
    ("www (lokale Web-Dateien)", "www", "dir"),
    ("Bilder-Upload", "image", "dir"),
    ("TTS-Cache", "tts", "dir"),
    ("Blueprints", "blueprints", "dir"),
    ("Themes", "themes", "dir"),
    ("Python-Abhängigkeiten (deps)", "deps", "dir"),
)

# Schlüssel-Hinweise zur Erkennung von API-Keys / Secrets in Integrationsdaten.
SECRET_KEY_HINTS = (
    "api_key",
    "apikey",
    "api_token",
    "access_token",
    "refresh_token",
    "token",
    "secret",
    "client_secret",
    "client_id",
    "password",
    "passwd",
    "pwd",
    "private_key",
    "app_key",
    "app_secret",
    "credential",
    "auth",
    "pin",
    "webhook",
    "key",
)

# Keys, die trotz Treffer im SECRET_KEY_HINTS NICHT als Secret gewertet werden.
SECRET_KEY_IGNORE = (
    "keyboard",
    "keep",
    "key_press",
    "monkey",
    "public_key",  # öffentliche Keys sind nicht schützenswert
    "auth_implementation",  # OAuth: nur der Name des Anmeldewegs
    "token_type",  # OAuth: z. B. "Bearer"
    "ping",  # enthält "pin", ist aber kein PIN
)

# System-Zugriffsmapping: Teil des Domain-Namens → beschreibender String
SYSTEM_ACCESS_MAP = {
    "hassio": "⚠️ System/Root-Zugriff (Supervisor)",
    "supervisor": "⚠️ System/Root-Zugriff (Supervisor)",
    "samba": "⚠️ System/Root-Zugriff (Netzwerk-Share)",
    "ssh": "⚠️ System/Root-Zugriff (SSH)",
    "shell_command": "⚠️ System/Shell-Ausführung",
    "command_line": "⚠️ System/Shell-Ausführung",
    "zwave_js": "📡 System/Device (Z-Wave)",
    "zha": "📡 System/Device (Zigbee)",
    "deconz": "📡 System/Device (ConBee)",
    "zwave": "📡 System/Device (Z-Wave)",
    "usb": "🔌 USB/Hardware",
    "serial": "🔌 Serial/Hardware",
    "gpio": "🔌 GPIO/Hardware",
    "mqtt": "🌐 Netzwerk/MQTT",
    "network": "🌐 Netzwerk",
    "recorder": "🗄️ Datenbank",
    "influxdb": "🗄️ Datenbank (InfluxDB)",
    "sql": "🗄️ Datenbank (SQL)",
    "camera": "📷 Kamera/Zugriff",
    "ffmpeg": "📷 Kamera/Zugriff",
    "stream": "📷 Kamera/Zugriff",
    "ring": "📷 Kamera/Cloud (Ring)",
    "reolink": "📷 Kamera (Reolink)",
    "onvif": "📷 Kamera (ONVIF)",
    "geo_location": "📍 GPS/Standort",
    "device_tracker": "📍 GPS/Standort",
    "mobile_app": "📍 GPS/Standort (Companion App)",
    "gps": "📍 GPS/Standort",
    "google_maps": "📍 GPS/Cloud (Google)",
    "life360": "📍 GPS/Cloud (Life360)",
    "owntracks": "📍 GPS/Standort (OwnTracks)",
    "nominatim": "📍 Geocoding",
    "openweathermap": "🌤️ Wetter/Standort-abhängig",
    "met": "🌤️ Wetter/Standort-abhängig",
    "google_assistant": "🌐 Cloud-API (Google)",
    "google": "🌐 Cloud-API (Google)",
    "nest": "🌐 Cloud-API (Google Nest)",
    "alexa": "🌐 Cloud-API (Amazon)",
    "amazon": "🌐 Cloud-API (Amazon)",
    "ifttt": "🌐 Cloud-API (IFTTT)",
    "twilio": "🌐 Cloud-API (Telefon)",
    "pushover": "🌐 Cloud-API (Push)",
    "pushbullet": "🌐 Cloud-API (Push)",
    "telegram": "🌐 Cloud-API (Telegram)",
    "openai": "🌐 Cloud-API (OpenAI)",
    "anthropic": "🌐 Cloud-API (Anthropic)",
    "google_generative": "🌐 Cloud-API (Google AI)",
    "aws": "🌐 Cloud-API (AWS)",
    "cloud": "🌐 Cloud (Nabu Casa)",
    "spotify": "🌐 Cloud (Spotify)",
    "sonos": "🌐 Netzwerk (Sonos)",
    "cast": "📡 Netzwerk/Device (Cast)",
}

# Data-Flow-Tags pro Domain-Teilstring
DATAFLOW_TAGS = {
    "hassio": {"local", "system"},
    "supervisor": {"local", "system"},
    "recorder": {"local", "database"},
    "influxdb": {"local", "database", "external"},
    "sql": {"local", "database"},
    "google_assistant": {"external", "cloud"},
    "google": {"external", "cloud"},
    "nest": {"external", "cloud"},
    "alexa": {"external", "cloud"},
    "ifttt": {"external", "cloud"},
    "twilio": {"external", "phone"},
    "pushover": {"external", "push"},
    "telegram": {"external", "push"},
    "openai": {"external", "cloud"},
    "anthropic": {"external", "cloud"},
    "aws": {"external", "cloud"},
    "cloud": {"external", "cloud"},
    "spotify": {"external", "network"},
    "sonos": {"external", "network", "local"},
    "mqtt": {"local", "network"},
    "camera": {"local", "storage"},
    "mobile_app": {"local", "external", "gps"},
    "google_maps": {"external", "gps", "cloud"},
    "life360": {"external", "gps", "cloud"},
    "owntracks": {"local", "gps"},
    "nominatim": {"external", "gps"},
}
