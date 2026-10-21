// HA Percyta Report-Panel – moderne, gerenderte Ansicht des Scan-Reports in Home Assistant.

const RISK_LABEL = { high: "HIGH", medium: "MEDIUM", low: "LOW" };
const RISK_SEV = { high: 3, medium: 2, low: 1 };
const LS_MODE = "hapercyta_view_mode"; // "single" | "accordion"
const LS_WIDTH = "hapercyta_view_width"; // "full" | "narrow"
const LS_PK_VIEW = "hapercyta_picker_view"; // "chips" | "list" – Darstellung der Auswahl in Dialogen
const LS_VIEW = "hapercyta_view_state"; // offene Boxen, Sortierung, Erklär-Card
const LOGO_URL = "/ha_percyta_static/logo.png";

// Übersetzungen (Oberfläche folgt der HA-Sprache; de sonst en).
// Gruppen der Boxen auf der Übersicht (Reihenfolge = Anzeige).
const SECTION_GROUPS = [
  ["grp_security", ["integrations", "addons", "sysaccess", "cloud", "secrets", "users", "tokens"]],
  ["grp_system", ["system", "inventory", "findings", "database", "errors", "cards", "blueprints"]],
];
// Material-Design-Icons von Home Assistant je Box (Fallback: Emoji aus dem Titel).
const SECTION_ICONS = {
  integrations: "mdi:puzzle-outline", addons: "mdi:apps", sysaccess: "mdi:cog-outline", cloud: "mdi:cloud-upload-outline",
  secrets: "mdi:lock-outline", users: "mdi:account-multiple-outline", tokens: "mdi:key-outline", system: "mdi:harddisk",
  inventory: "mdi:chart-box-outline", findings: "mdi:compass-outline", database: "mdi:database-outline",
  errors: "mdi:alert-circle-outline", cards: "mdi:cards-outline", blueprints: "mdi:floor-plan",
};

const STR = {
  de: {
    dl_md_title: "Als Markdown herunterladen", dl_html_title: "Als HTML herunterladen",
    rescan: "Neu scannen", scanning: "Scanne …", sidebar_toggle: "Seitenleiste ein-/ausblenden",
    to_top: "Nach oben", loading: "Lade Report …", load_error: "Fehler beim Laden: ",
    no_result: "Noch kein Scan-Ergebnis vorhanden.", press_rescan: "Bitte oben auf 'Neu scannen' drücken.",
    as_of: "Stand: ", new_since: "🆕 {n} neu seit letztem Scan",
    k_integrations: "Integrationen", k_devices: "Geräte", k_entities: "Entitäten", k_apps: "Apps",
    k_cards: "Custom Cards", k_blueprints: "Blueprints", k_users: "Benutzer", k_tokens: "Tokens",
    k_high: "High Risk", k_medium: "Medium Risk", k_secrets: "API-Keys / Secrets",
    k_cloud: "Cloud-Integrationen", k_stale: "Ungenutzte Tokens",
    riskdist: "Risiko-Verteilung (Integrationen + Apps)", total: "gesamt",
    why: "ℹ️ Warum?", why_hide: "ℹ️ Erklärung ausblenden",
    why_intro: "So wird eingestuft – die höchste zutreffende Stufe gewinnt:",
    crit_high: "GPS-/Standortzugriff, Kamerazugriff oder Root-/System-/Supervisor-Rechte.",
    crit_medium: "externer/Cloud-Datenfluss, gespeicherte Secrets oder ein Systembezug.",
    crit_low: "keine sensiblen Zugriffe erkannt.",
    cur_intro: "Aktuell tragen dazu bei:", f_cam: "Kamera", f_ext: "Cloud/Extern", f_sysrel: "Systembezug",
    low_none: "keine sensiblen Zugriffe", examples_high: "Beispiele High:", more: "weitere",
    why_note: "Hinweis: Eine Integration kann mehrere Faktoren erfüllen (Mehrfachnennung möglich); Apps zählen nur in die High-Wertung ein.",
    search_ph: "Alles durchsuchen…", search_clear: "Suche leeren",
    seg_single: "Einzeln", seg_single_t: "Boxen einzeln öffnen",
    seg_accordion: "Akkordeon", seg_accordion_t: "Beim Öffnen schließt sich die vorherige Box",
    width_narrow: "▭ Schmale Ansicht", width_wide: "⇔ Breite Ansicht", width_t: "Breite umschalten",
    expand_all: "▼ Alle ausklappen", collapse_all: "▲ Alle einklappen",
    sec_system: "💾 Speicher & System", sec_integrations: "📦 Installierte Integrationen",
    sec_apps: "🧩 Apps", sec_cards: "🃏 Custom Cards", sec_blueprints: "📐 Blueprints",
    sec_sysaccess: "⚙️ System-Zugriffe & Datenfluss", sec_cloud: "☁️ Cloud-Datenfluss",
    sec_secrets: "🔐 API-Keys, Tokens & Secrets", sec_users: "👤 Benutzer & Berechtigungen",
    sec_tokens: "🔑 Access Tokens", sec_errors: "❗ Wichtige Fehler (System-Log)",
    sub_categories: "🗄️ Systemspeicher nach Kategorie",
    sub_consumers: "📂 Größte Speicher-Verbraucher (unter /config)",
    sub_custom_int: "🧩 Speicherbedarf der Custom-Integrationen", sub_app_res: "🧩 App-Ressourcen (Laufzeit)",
    c_disk_used: "Speicher belegt", c_disk_free: "Speicher frei", c_ram: "RAM", c_cpu: "CPU",
    src: "Quelle: ", cores: "Kerne", apps_ram: "Apps: ", swap: "🔁 Swap: ",
    swap_expl: "Auslagerungsspeicher: Teil der Festplatte, den das System als Reserve nutzt, wenn der RAM knapp wird – deutlich langsamer als RAM. Hohe Swap-Nutzung bei gleichzeitig hoher RAM-Auslastung kann das System verlangsamen.",
    th_risk: "Risiko", th_domain: "Domain", th_title: "Titel", th_state: "Zustand", th_source: "Quelle",
    th_access: "Zugriffe", th_entities: "Entities", th_devices: "Geräte", th_adjust: "Anpassen",
    th_category: "Kategorie", th_used: "Belegt", th_share: "Anteil", th_area: "Bereich", th_size: "Größe",
    th_integration: "Integration", th_app: "App", th_version: "Version", th_sysaccess: "System-Zugriffe",
    th_dataflow: "Datenfluss", th_target: "Ziel/Zugriff", th_type: "Typ", th_url: "URL", th_name: "Name",
    th_author: "Autor", th_owner: "Owner", th_active: "Aktiv", th_system: "System", th_groups: "Gruppen",
    th_user: "Benutzer", th_client: "Client", th_last_used: "Letzte Nutzung", th_status: "Status",
    th_time: "Zeit", th_count: "Anzahl", th_message: "Meldung", th_field: "Feld", th_value: "Wert",
    empty_integrations: "Keine Integrationen gefunden.", empty_apps_sup: "Keine Apps installiert.",
    empty_apps_core: "Kein Supervisor – Apps nicht verfügbar (HA Core).",
    empty_cards: "Keine Custom-Card-Ressourcen gefunden.", empty_blueprints: "Keine Blueprints gefunden.",
    empty_sysaccess: "Keine systemrelevanten Zugriffe erkannt.",
    cloud_hint: "Diese Integrationen tauschen Daten mit externen/Cloud-Diensten aus.",
    empty_cloud: "Kein externer/Cloud-Datenfluss erkannt.",
    empty_secrets: "Keine gespeicherten Credentials gefunden.", empty_users: "Keine Benutzer gefunden.",
    empty_tokens: "Keine Tokens gefunden.", extern: "extern", chip_extern: "Extern", chip_cam: "Kamera",
    chip_custom: "Custom", chip_secret: "{n} Secret", chip_new: "NEU",
    ov_auto: "Automatisch", ov_title: "Risiko-Einstufung manuell setzen",
    ov_mark: "manuell gesetzt (automatisch: {auto})",
    yes: "Ja", no: "Nein", tok_never: "nie genutzt", tok_unused: "{d}d ungenutzt", tok_ok: "ok",
    tok_never_ts: "nie", tok_longlived: "long-lived",
    tok_hint: "⚠️ {n} Long-Lived-Token nie oder lange nicht genutzt – im Profil prüfen/widerrufen.",
    open_in_ha: "In Home Assistant öffnen", jump_title: "Zur Box springen",
    new_title: "Neu seit letztem Scan", new_toggle_t: "Details ein-/ausblenden",
    nt_integrations_1: "Integration", nt_integrations_n: "Integrationen", nt_addons_1: "App", nt_addons_n: "Apps",
    nt_cards_1: "Custom Card", nt_cards_n: "Custom Cards", nt_blueprints_1: "Blueprint", nt_blueprints_n: "Blueprints",
    nt_users_1: "Benutzer", nt_users_n: "Benutzer",
    th_app_size: "Daten",
    app_size_hint: "Daten = App-Daten + App-Konfiguration laut Supervisor. Das Docker-Image der App ist darin nicht enthalten.",
    sec_inventory: "📊 Bestand & Zustand",
    i_automations: "Automationen", i_scripts: "Skripte", i_scenes: "Szenen", i_helpers: "Helfer",
    i_areas: "Bereiche", i_floors: "Etagen", i_labels: "Labels", i_unavailable: "Nicht verfügbar",
    i_updates: "Updates verfügbar", i_hidden: "versteckt", i_of_states: "von {n} Entitäten",
    i_up_to_date: "alles aktuell", i_disabled_c: "Deaktivierte Entitäten",
    sub_updates: "⬆️ Verfügbare Updates", sub_unavail: "⚠️ Nicht verfügbare Entitäten nach Integration",
    sub_domains: "🔢 Entitäten nach Domain", th_installed: "Installiert", th_latest: "Verfügbar",
    sub_disabled: "🚫 Deaktivierte Entitäten nach Integration",
    sec_reveal: "👁 Anzeigen", sec_hide: "🙈 Verbergen", sec_reveal_t: "Wert vollständig anzeigen",
    sec_reveal_err: "Wert konnte nicht gelesen werden",
    sec_database: "🗄️ Datenbank (Recorder)",
    db_states: "📈 Zustände: Entitäten mit den meisten Einträgen",
    db_stats: "📊 Langzeitstatistik: Statistiken mit den meisten Einträgen",
    th_entity: "Entität", th_rows: "Einträge", th_statistic: "Statistik-ID", th_lts: "Langzeit", th_sts: "Kurzzeit (5 min)",
    db_c_states: "Zustände", db_c_lts: "Langzeitstatistik", db_c_sts: "Kurzzeitstatistik", db_c_size: "Datenbank-Datei",
    db_rows_of: "Einträge von {n} Entitäten", db_rows_stats: "Einträge von {n} Statistiken", db_rows: "Einträge",
    db_hint: "Gezählt werden Einträge (Zeilen) in der Recorder-Datenbank – je mehr Einträge, desto mehr Platz belegt die Entität. Zustände werden nach der eingestellten Aufbewahrungszeit gelöscht, Langzeitstatistiken dagegen nie: Sie wachsen dauerhaft um einen Eintrag pro Stunde. Die Auswertung wird höchstens einmal pro Stunde neu berechnet.",
    db_as_of: "Stand der Auswertung: ", db_pending: "Die Datenbank-Auswertung läuft noch – bitte in ein paar Minuten erneut scannen.",
    open_history: "Verlauf in Home Assistant öffnen",
    backup_last: "💾 Letztes HA-Backup: ", backup_none: "💾 Kein HA-Backup gefunden",
    ago_now: "gerade eben", ago_min: "vor {n} Min.", ago_h: "vor {n} Std.", ago_d1: "vor 1 Tag", ago_d: "vor {n} Tagen",
  },
  en: {
    dl_md_title: "Download as Markdown", dl_html_title: "Download as HTML",
    rescan: "Rescan", scanning: "Scanning …", sidebar_toggle: "Toggle sidebar",
    to_top: "Back to top", loading: "Loading report …", load_error: "Error loading: ",
    no_result: "No scan result yet.", press_rescan: "Please press 'Rescan' above.",
    as_of: "As of: ", new_since: "🆕 {n} new since last scan",
    k_integrations: "Integrations", k_devices: "Devices", k_entities: "Entities", k_apps: "Apps",
    k_cards: "Custom Cards", k_blueprints: "Blueprints", k_users: "Users", k_tokens: "Tokens",
    k_high: "High Risk", k_medium: "Medium Risk", k_secrets: "API keys / secrets",
    k_cloud: "Cloud integrations", k_stale: "Unused tokens",
    riskdist: "Risk distribution (integrations + apps)", total: "total",
    why: "ℹ️ Why?", why_hide: "ℹ️ Hide explanation",
    why_intro: "How it's rated – the highest matching level wins:",
    crit_high: "GPS/location access, camera access or root/system/supervisor rights.",
    crit_medium: "external/cloud data flow, stored secrets or a system relation.",
    crit_low: "no sensitive access detected.",
    cur_intro: "Currently contributing:", f_cam: "Camera", f_ext: "Cloud/External", f_sysrel: "System relation",
    low_none: "no sensitive access", examples_high: "High examples:", more: "more",
    why_note: "Note: an integration can meet several factors (multiple counting possible); apps only count toward the High rating.",
    search_ph: "Search everything…", search_clear: "Clear search",
    seg_single: "Single", seg_single_t: "Open boxes individually",
    seg_accordion: "Accordion", seg_accordion_t: "Opening one closes the previous box",
    width_narrow: "▭ Narrow view", width_wide: "⇔ Wide view", width_t: "Toggle width",
    expand_all: "▼ Expand all", collapse_all: "▲ Collapse all",
    sec_system: "💾 Storage & System", sec_integrations: "📦 Installed integrations",
    sec_apps: "🧩 Apps", sec_cards: "🃏 Custom Cards", sec_blueprints: "📐 Blueprints",
    sec_sysaccess: "⚙️ System access & data flow", sec_cloud: "☁️ Cloud data flow",
    sec_secrets: "🔐 API keys, tokens & secrets", sec_users: "👤 Users & permissions",
    sec_tokens: "🔑 Access tokens", sec_errors: "❗ Important errors (system log)",
    sub_categories: "🗄️ System storage by category",
    sub_consumers: "📂 Largest storage consumers (under /config)",
    sub_custom_int: "🧩 Storage footprint of custom integrations", sub_app_res: "🧩 App resources (runtime)",
    c_disk_used: "Disk used", c_disk_free: "Disk free", c_ram: "RAM", c_cpu: "CPU",
    src: "Source: ", cores: "cores", apps_ram: "Apps: ", swap: "🔁 Swap: ",
    swap_expl: "Swap space: part of the disk the system uses as a reserve when RAM runs low – noticeably slower than RAM. High swap use together with high RAM usage can slow the system down.",
    th_risk: "Risk", th_domain: "Domain", th_title: "Title", th_state: "State", th_source: "Source",
    th_access: "Access", th_entities: "Entities", th_devices: "Devices", th_adjust: "Adjust",
    th_category: "Category", th_used: "Used", th_share: "Share", th_area: "Area", th_size: "Size",
    th_integration: "Integration", th_app: "App", th_version: "Version", th_sysaccess: "System access",
    th_dataflow: "Data flow", th_target: "Target/access", th_type: "Type", th_url: "URL", th_name: "Name",
    th_author: "Author", th_owner: "Owner", th_active: "Active", th_system: "System", th_groups: "Groups",
    th_user: "User", th_client: "Client", th_last_used: "Last used", th_status: "Status",
    th_time: "Time", th_count: "Count", th_message: "Message", th_field: "Field", th_value: "Value",
    empty_integrations: "No integrations found.", empty_apps_sup: "No apps installed.",
    empty_apps_core: "No Supervisor – apps unavailable (HA Core).",
    empty_cards: "No custom card resources found.", empty_blueprints: "No blueprints found.",
    empty_sysaccess: "No system-relevant access detected.",
    cloud_hint: "These integrations exchange data with external/cloud services.",
    empty_cloud: "No external/cloud data flow detected.",
    empty_secrets: "No stored credentials found.", empty_users: "No users found.",
    empty_tokens: "No tokens found.", extern: "external", chip_extern: "External", chip_cam: "Camera",
    chip_custom: "Custom", chip_secret: "{n} secret", chip_new: "NEW",
    ov_auto: "Automatic", ov_title: "Set risk level manually",
    ov_mark: "manually set (automatic: {auto})",
    yes: "Yes", no: "No", tok_never: "never used", tok_unused: "{d}d unused", tok_ok: "ok",
    tok_never_ts: "never", tok_longlived: "long-lived",
    tok_hint: "⚠️ {n} long-lived tokens never or long unused – review/revoke in your profile.",
    open_in_ha: "Open in Home Assistant", jump_title: "Jump to section",
    new_title: "New since last scan", new_toggle_t: "Show/hide details",
    nt_integrations_1: "integration", nt_integrations_n: "integrations", nt_addons_1: "app", nt_addons_n: "apps",
    nt_cards_1: "custom card", nt_cards_n: "custom cards", nt_blueprints_1: "blueprint", nt_blueprints_n: "blueprints",
    nt_users_1: "user", nt_users_n: "users",
    th_app_size: "Data",
    app_size_hint: "Data = app data + app configuration as reported by the Supervisor. The app's Docker image is not included.",
    sec_inventory: "📊 Inventory & Health",
    i_automations: "Automations", i_scripts: "Scripts", i_scenes: "Scenes", i_helpers: "Helpers",
    i_areas: "Areas", i_floors: "floors", i_labels: "labels", i_unavailable: "Unavailable",
    i_updates: "Updates available", i_hidden: "hidden", i_of_states: "of {n} entities",
    i_up_to_date: "all up to date", i_disabled_c: "Disabled entities",
    sub_updates: "⬆️ Available updates", sub_unavail: "⚠️ Unavailable entities by integration",
    sub_domains: "🔢 Entities by domain", th_installed: "Installed", th_latest: "Available",
    sub_disabled: "🚫 Disabled entities by integration",
    sec_reveal: "👁 Show", sec_hide: "🙈 Hide", sec_reveal_t: "Show the full value",
    sec_reveal_err: "The value could not be read",
    sec_database: "🗄️ Database (Recorder)",
    db_states: "📈 States: entities with the most rows",
    db_stats: "📊 Long-term statistics: statistics with the most rows",
    th_entity: "Entity", th_rows: "Rows", th_statistic: "Statistic ID", th_lts: "Long-term", th_sts: "Short-term (5 min)",
    db_c_states: "States", db_c_lts: "Long-term statistics", db_c_sts: "Short-term statistics", db_c_size: "Database file",
    db_rows_of: "rows from {n} entities", db_rows_stats: "rows from {n} statistics", db_rows: "rows",
    db_hint: "Counted are rows in the recorder database – the more rows, the more space an entity uses. States are purged after the configured retention period, long-term statistics never are: they grow by one row per hour forever. The analysis is recalculated at most once per hour.",
    db_as_of: "Analysis as of: ", db_pending: "The database analysis is still running – please rescan in a few minutes.",
    open_history: "Open history in Home Assistant",
    backup_last: "💾 Last HA backup: ", backup_none: "💾 No HA backup found",
    ago_now: "just now", ago_min: "{n} min ago", ago_h: "{n} h ago", ago_d1: "1 day ago", ago_d: "{n} days ago",
  },
};

// ---------- Befunde: Konstanten und Texte ----------
const SEV_ORDER = { high: 0, medium: 1, low: 2, info: 3 };
const CATEGORIES = ["security", "automations", "integrity", "orphans", "storage"];
const CAT_ICON = { security: "🛡️", automations: "🤖", integrity: "🔗", orphans: "🧹", storage: "💾" };
const TYPE_ICON = {
  broken_reference: "🔗", integration_not_loaded: "🔌", unavailable_entities: "📡", orphaned_entities: "👻",
  unused_automation: "💤", unused_script: "💤", stale_token: "🗝️", high_risk_integration: "⚠️",
  privileged_app: "🧩", secrets_stored: "🔐", backup_old: "💾", backup_missing: "💾",
  disk_high: "🖴", db_hotspot: "🗄️", updates_available: "⬆️",
};
const STATUSES = ["open", "known", "snoozed", "hidden"];
const SNOOZE_DAYS = [7, 30, 90];

const FSTR = {
  de: {
    sec_findings: "🧭 Reports",
    f_all: "Alle", cat_security: "Sicherheit & Datenschutz", cat_integrity: "Defekte Verweise",
    cat_orphans: "Ungenutzt & verwaist", cat_storage: "Speicher & Wartung",
    sev_high: "Hoch", sev_medium: "Mittel", sev_low: "Niedrig", sev_info: "Hinweis",
    sev_all: "Alle Schweregrade",
    st_open: "Offen", st_known: "Erlaubt", st_snoozed: "Zurückgestellt", st_hidden: "Ausgeblendet",
    st_open_t: "Wieder offen", st_known_t: "Als erlaubt markieren", st_snoozed_t: "Zurückstellen", st_hidden_t: "Ausblenden",
    snooze_for: "für {n} Tage", snooze_until: "bis {d}",
    f_select_page: "Seite auswählen", f_clear_sel: "Auswahl leeren", f_selected: "{n} ausgewählt",
    f_reopen: "Wieder öffnen", f_th_sev: "Schwere", f_th_finding: "Befund", f_th_cat: "Kategorie",
    f_th_affected: "Betroffen", f_th_since: "Seit",
    f_empty_open: "Keine offenen Befunde – alles in Ordnung. 🎉", f_empty_other: "Hier ist nichts eingetragen.",
    f_empty_filter: "Kein Befund passt zu den gewählten Filtern.",
    f_resolved: "Zuletzt behoben (letzte 30 Tage)", f_resolved_when: "behoben {a}",
    f_hint: "Erlaubt, zurückgestellt und ausgeblendet gilt nur in HA Percyta – in Home Assistant wird nichts geändert.",
    f_open_ha: "In Home Assistant öffnen", f_open: "Öffnen", f_back: "← Zur Übersicht", f_prev: "Vorheriger Befund", f_next: "Nächster Befund",
    f_gone_title: "Dieser Befund ist nicht mehr vorhanden", f_gone_text: "Er wurde vermutlich behoben. Beim nächsten Scan erscheint er unter „Zuletzt behoben“, falls er in der Liste verschwunden ist.",
    fd_tab_diag: "Diagnose", fd_tab_items: "Betroffene Objekte", fd_tab_tech: "Technische Daten",
    fd_found: "Beobachtung", fd_cause: "Mögliche Ursache", fd_impact: "Auswirkung", fd_fix: "So gehst du vor",
    fd_glance: "Auf einen Blick", fd_sev: "Schwere", fd_conf: "Gewissheit", fd_conf_t: "Wie sicher Percyta bei diesem Befund ist",
    fd_cat: "Kategorie", fd_since: "Erstmals beobachtet", fd_affected: "Betroffene Objekte", fd_status: "Status",
    fd_manage: "Status verwalten", fd_note_ph: "Notiz (optional), z. B. Grund",
    fd_note_label: "Notiz", fd_th_name: "Name", fd_th_id: "ID", fd_th_where: "Fundstelle", fd_th_version: "Version", fd_th_count: "Anzahl",
    fd_more: "… und {n} weitere (Liste auf {m} Einträge begrenzt)",
    fd_k_entity_id: "Entität", fd_k_domain: "Domain", fd_k_referenced_by: "Verwendet in", fd_k_entry_id: "Entry-ID",
    fd_k_state: "Zustand", fd_k_reason: "Grund", fd_k_unavailable: "Nicht verfügbar", fd_k_orphaned: "Verwaist",
    fd_k_last_triggered: "Zuletzt ausgelöst", fd_k_created_at: "Angelegt", fd_k_threshold_days: "Schwelle (Tage)",
    fd_k_user: "Benutzer", fd_k_client_name: "Name", fd_k_last_used_at: "Zuletzt verwendet", fd_k_last_used_ip: "Letzte IP",
    fd_k_iot_class: "IoT-Klasse", fd_k_custom: "Custom-Integration", fd_k_system_access: "Systemzugriffe", fd_k_data_flow: "Datenfluss",
    fd_k_slug: "Slug", fd_k_version: "Version", fd_k_access: "Rechte", fd_k_values: "Werte", fd_k_integrations: "Integrationen",
    fd_k_last_backup: "Letztes Backup", fd_k_name: "Name", fd_k_size: "Größe", fd_k_source: "Quelle",
    fd_k_percent: "Belegt (%)", fd_k_used: "Belegt", fd_k_total: "Gesamt", fd_k_free: "Frei",
    fd_k_rows: "Zeilen", fd_k_share_percent: "Anteil (%)", fd_k_states_total: "Zustände gesamt", fd_k_count: "Anzahl",
    r_gps: "Standortzugriff", r_camera: "Kamera", r_system: "System-/Root-Zugriff",
    p_full_access: "Vollzugriff (Root)", p_host_network: "Host-Netzwerk", p_role: "Supervisor-Rolle {r}", yes: "ja", no: "nein",
  },
  en: {
    sec_findings: "🧭 Reports",
    f_all: "All", cat_security: "Security & privacy", cat_integrity: "Broken references",
    cat_orphans: "Unused & orphaned", cat_storage: "Storage & upkeep",
    sev_high: "High", sev_medium: "Medium", sev_low: "Low", sev_info: "Notice",
    sev_all: "All severities",
    st_open: "Open", st_known: "Allowed", st_snoozed: "Snoozed", st_hidden: "Hidden",
    st_open_t: "Reopen", st_known_t: "Mark as allowed", st_snoozed_t: "Snooze", st_hidden_t: "Hide",
    snooze_for: "for {n} days", snooze_until: "until {d}",
    f_select_page: "Select page", f_clear_sel: "Clear selection", f_selected: "{n} selected",
    f_reopen: "Reopen", f_th_sev: "Severity", f_th_finding: "Finding", f_th_cat: "Category",
    f_th_affected: "Affected", f_th_since: "Since",
    f_empty_open: "No open findings – all good. 🎉", f_empty_other: "Nothing here.",
    f_empty_filter: "No finding matches the selected filters.",
    f_resolved: "Recently resolved (last 30 days)", f_resolved_when: "resolved {a}",
    f_hint: "Allowed, snoozed and hidden only apply inside HA Percyta – nothing is changed in Home Assistant.",
    f_open_ha: "Open in Home Assistant", f_open: "Open", f_back: "← Back to overview", f_prev: "Previous finding", f_next: "Next finding",
    f_gone_title: "This finding no longer exists", f_gone_text: "It has probably been resolved. If it disappeared from the list it will show up under “Recently resolved” after the next scan.",
    fd_tab_diag: "Diagnosis", fd_tab_items: "Affected objects", fd_tab_tech: "Technical data",
    fd_found: "Observation", fd_cause: "Possible cause", fd_impact: "Impact", fd_fix: "What to do",
    fd_glance: "At a glance", fd_sev: "Severity", fd_conf: "Certainty", fd_conf_t: "How sure Percyta is about this finding",
    fd_cat: "Category", fd_since: "First observed", fd_affected: "Affected objects", fd_status: "Status",
    fd_manage: "Manage status", fd_note_ph: "Note (optional), e.g. reason",
    fd_note_label: "Note", fd_th_name: "Name", fd_th_id: "ID", fd_th_where: "Location", fd_th_version: "Version", fd_th_count: "Count",
    fd_more: "… and {n} more (list limited to {m} entries)",
    fd_k_entity_id: "Entity", fd_k_domain: "Domain", fd_k_referenced_by: "Used in", fd_k_entry_id: "Entry ID",
    fd_k_state: "State", fd_k_reason: "Reason", fd_k_unavailable: "Unavailable", fd_k_orphaned: "Orphaned",
    fd_k_last_triggered: "Last triggered", fd_k_created_at: "Created", fd_k_threshold_days: "Threshold (days)",
    fd_k_user: "User", fd_k_client_name: "Name", fd_k_last_used_at: "Last used", fd_k_last_used_ip: "Last IP",
    fd_k_iot_class: "IoT class", fd_k_custom: "Custom integration", fd_k_system_access: "System access", fd_k_data_flow: "Data flow",
    fd_k_slug: "Slug", fd_k_version: "Version", fd_k_access: "Permissions", fd_k_values: "Values", fd_k_integrations: "Integrations",
    fd_k_last_backup: "Last backup", fd_k_name: "Name", fd_k_size: "Size", fd_k_source: "Source",
    fd_k_percent: "Used (%)", fd_k_used: "Used", fd_k_total: "Total", fd_k_free: "Free",
    fd_k_rows: "Rows", fd_k_share_percent: "Share (%)", fd_k_states_total: "States total", fd_k_count: "Count",
    r_gps: "location access", r_camera: "camera", r_system: "system/root access",
    p_full_access: "full access (root)", p_host_network: "host network", p_role: "supervisor role {r}", yes: "yes", no: "no",
  },
};
Object.assign(STR.de, FSTR.de);
Object.assign(STR.en, FSTR.en);

// Diagnose-Texte je Befundtyp (Variablen in {…} werden aus den Befunddaten gefüllt).
const FDOC = {
  de: {
    broken_reference: {
      title: "Defekte Referenz",
      what: "Die Entität {subject} existiert nicht, wird aber in {count} Automation(en) oder Skript(en) verwendet.",
      cause: "Die Entität wurde gelöscht oder umbenannt, oder ihre Integration bzw. ihr Gerät wurde entfernt. Die Konfiguration verweist noch auf die alte ID.",
      impact: "An diesen Stellen läuft der Verweis ins Leere: Trigger lösen nie aus, Bedingungen sind nie erfüllt, Aktionen schlagen fehl oder werden übersprungen.",
      steps: [
        "Prüfe in der Entitätenliste, ob die Entität umbenannt wurde und wie sie jetzt heißt.",
        "Öffne unter „Betroffene Objekte“ die jeweilige Automation bzw. das Skript und ersetze die alte ID durch die neue – oder entferne den Verweis.",
        "Starte danach einen neuen Scan: Der Befund verschwindet und erscheint unter „Zuletzt behoben“.",
      ],
    },
    integration_not_loaded: {
      title: "Integration läuft nicht",
      what: "{subject} ist nicht geladen (Status: {state}). {count} Entität(en) sind dadurch nicht verfügbar.",
      cause: "Die Integration konnte nicht starten oder erreicht ihr Gerät bzw. ihren Dienst nicht (z. B. Gerät offline, Zugangsdaten abgelaufen, Netzwerkproblem).",
      impact: "Alle Entitäten dieser Integration fehlen; Automationen und Dashboards, die sie nutzen, funktionieren nicht wie gewünscht.",
      steps: [
        "Öffne die Integration und lies die Fehlermeldung am Eintrag.",
        "Prüfe Gerät, Netzwerk und Zugangsdaten; lade die Integration neu oder melde dich erneut an.",
        "Wird die Integration nicht mehr gebraucht, lösche den Eintrag.",
      ],
    },
    unavailable_entities: {
      title: "Nicht verfügbare Entitäten",
      what: "{count} Entität(en) von {subject} sind aktuell nicht verfügbar.",
      cause: "Das dahinterliegende Gerät oder der Dienst antwortet nicht (Batterie leer, außer Reichweite, offline) oder meldet die Entität nicht mehr.",
      impact: "Zustände fehlen; Automationen und Dashboards, die diese Entitäten nutzen, zeigen nichts an oder reagieren nicht.",
      steps: [
        "Prüfe die betroffenen Geräte (Strom, Batterie, Funkverbindung).",
        "Starte die Integration neu, wenn mehrere Geräte gleichzeitig betroffen sind.",
        "Dauerhaft entfernte Geräte in Home Assistant löschen, damit keine Karteileichen bleiben.",
      ],
    },
    orphaned_entities: {
      title: "Verwaiste Entitäten",
      what: "{count} Entität(en) von {subject} sind noch registriert, werden aber von keiner Integration mehr bereitgestellt.",
      cause: "Das Gerät oder die Integration wurde entfernt oder die Entität umbenannt; ihr Eintrag in der Entitäten-Registry ist übrig geblieben.",
      impact: "Sie belegen Namen und Registry-Einträge, liefern keine Werte und können Verweise in Automationen vortäuschen.",
      steps: [
        "Öffne die Entitätenliste, suche die unter „Betroffene Objekte“ genannten Einträge und lösche sie.",
        "Prüfe vorher, ob noch Automationen oder Dashboards auf sie verweisen.",
      ],
    },
    unused_automation: {
      title: "Lange nicht ausgelöst",
      what: "Die Automation wurde seit {days} Tagen nicht ausgelöst.",
      what_never: "Die Automation wurde seit ihrer Anlage (vor {days} Tagen) noch nie ausgelöst.",
      cause: "Die Trigger-Bedingungen treffen nie zu, der Auslöser existiert nicht mehr oder die Automation wird schlicht nicht mehr gebraucht.",
      impact: "Kein akuter Fehler, aber toter Ballast: Die Konfiguration wird unübersichtlicher und vermittelt falsche Sicherheit.",
      steps: [
        "Prüfe den Trigger: Gibt es das auslösende Ereignis (Entität, Zeit, Zustand) noch?",
        "Wird die Automation noch gebraucht (z. B. saisonal), markiere den Befund als „Erlaubt“.",
        "Sonst schalte sie aus und lösche sie nach einiger Zeit – oder blende den Befund hier aus.",
      ],
    },
    unused_script: {
      title: "Skript lange nicht ausgeführt",
      what: "Das Skript wurde seit {days} Tagen nicht ausgeführt.",
      what_never: "Das Skript wurde seit seiner Anlage (vor {days} Tagen) noch nie ausgeführt.",
      cause: "Kein Dashboard, keine Automation und niemand ruft das Skript noch auf.",
      impact: "Kein akuter Fehler, aber toter Ballast in der Konfiguration.",
      steps: [
        "Prüfe, ob Dashboards, Automationen oder Sprachassistenten das Skript noch aufrufen.",
        "Wird es nur selten gebraucht, markiere den Befund als „Erlaubt“.",
        "Sonst Skript löschen oder den Befund ausblenden.",
      ],
    },
    stale_token: {
      title: "Ungenutzter Zugriffstoken",
      what: "Der Langzeit-Token „{subject}“ von {user} wurde seit {days} Tagen nicht verwendet.",
      what_never: "Der Langzeit-Token „{subject}“ von {user} wurde noch nie verwendet.",
      cause: "Ein Langzeit-Token wurde für eine App, ein Skript oder einen Dienst angelegt, der ihn nicht (mehr) nutzt.",
      impact: "Ein gültiger, vergessener Token bleibt dauerhaft ein Zugang zu deinem Home Assistant – wer ihn kennt, braucht kein Passwort.",
      steps: [
        "Öffne die Sicherheitsseite des Benutzerprofils und prüfe, ob der Token noch gebraucht wird (Tokens anderer Benutzer sind nur in deren eigenem Profil sichtbar).",
        "Nicht mehr benötigt: Token widerrufen.",
        "Wird er nur selten gebraucht (z. B. Backup-Skript), markiere den Befund als „Erlaubt“.",
      ],
    },
    high_risk_integration: {
      title: "Integration mit hohem Risiko",
      what: "{subject} wurde als hohes Risiko eingestuft ({reasons}).",
      cause: "Die Integration greift auf besonders sensible Daten oder Systembereiche zu (Standort, Kamera, Root-/System-Rechte).",
      impact: "Das ist kein Fehler, aber ein erhöhtes Datenschutz- und Sicherheitsrisiko, falls die Integration kompromittiert wird oder Daten weitergibt.",
      steps: [
        "Prüfe, ob du die Integration wirklich brauchst und ob sie aus einer vertrauenswürdigen Quelle stammt.",
        "Beschränke Zugriffe, wo möglich (z. B. Kamera- oder Standort-Entitäten deaktivieren).",
        "Ist das Risiko für dich akzeptabel, ändere die Risikostufe im Bereich „Installierte Integrationen“ (Spalte „Anpassen“) oder markiere den Befund als „Erlaubt“.",
      ],
    },
    privileged_app: {
      title: "App mit weitreichenden Rechten",
      what: "{subject} hat erweiterte Rechte ({rights}).",
      cause: "Die App benötigt laut Konfiguration weitreichende Systemrechte, z. B. für Hardware-, Netzwerk- oder Supervisor-Zugriff.",
      impact: "Eine kompromittierte oder fehlerhafte App mit solchen Rechten kann das gesamte System beeinflussen.",
      steps: [
        "Prüfe, ob die App aus einer vertrauenswürdigen Quelle stammt und aktuell ist.",
        "Nicht mehr benötigte Apps stoppen und deinstallieren.",
        "Gehören die Rechte zum Zweck der App, markiere den Befund als „Erlaubt“.",
      ],
    },
    secrets_stored: {
      title: "Gespeicherte Zugangsdaten",
      what: "In {integrations} Integration(en) wurden {count} gespeicherte Zugangsdaten (Passwörter, Tokens, API-Keys) gefunden.",
      cause: "Integrationen speichern ihre Zugangsdaten bei der Einrichtung in der Konfiguration von Home Assistant – das ist normal.",
      impact: "Ein Hinweis, kein Fehler: Die Werte liegen unverschlüsselt in der Konfiguration und damit auch in Backups. Wer Zugriff darauf hat, kann sie lesen.",
      steps: [
        "Gib Backups und den Konfigurationsordner nur an vertrauenswürdige Stellen weiter.",
        "Verschlüssele Backups, wenn möglich.",
        "Im Bereich „API-Keys, Tokens & Secrets“ siehst du, welche Felder betroffen sind.",
      ],
    },
    backup_old: {
      title: "Backup ist veraltet",
      what: "Das letzte Backup ist {days} Tage alt.",
      cause: "Es läuft keine (oder keine erfolgreiche) automatische Sicherung.",
      impact: "Bei einem Defekt oder Fehler gehen alle Änderungen seit dem letzten Backup verloren.",
      steps: [
        "Öffne die Backup-Seite und erstelle jetzt ein Backup.",
        "Richte automatische Backups ein und prüfe, ob sie wirklich laufen.",
        "Bewahre mindestens eine Kopie außerhalb des Geräts auf.",
      ],
    },
    backup_missing: {
      title: "Kein Backup gefunden",
      what: "Es wurde kein Home-Assistant-Backup gefunden.",
      cause: "Backups wurden nie eingerichtet oder gelöscht – oder HA Percyta kann die Backup-Quelle auf diesem System nicht lesen.",
      impact: "Ohne Backup lässt sich die Installation nach einem Defekt nicht wiederherstellen.",
      steps: [
        "Öffne die Backup-Seite und prüfe, ob dort Backups vorhanden sind.",
        "Falls nicht: Erstelle ein Backup und richte automatische Backups ein.",
      ],
    },
    disk_high: {
      title: "Speicherplatz wird knapp",
      what: "Der Systemspeicher ist zu {percent} % belegt.",
      cause: "Datenbank, Backups, Medien oder Logs haben viel Platz belegt.",
      impact: "Ist der Speicher voll, können Datenbank, Backups und Updates fehlschlagen – im Extremfall läuft Home Assistant nicht mehr sauber.",
      steps: [
        "Sieh im Bereich „Speicher & System“ nach den größten Verbrauchern.",
        "Lösche alte Backups und Medien; verkürze die Aufbewahrung des Recorders oder schließe große Entitäten aus.",
        "Verwende bei Bedarf einen größeren Datenträger.",
      ],
    },
    db_hotspot: {
      title: "Datenbank-Hotspot",
      what: "{subject} verursacht {share} % aller Zustandseinträge ({rows} Zeilen).",
      cause: "Die Entität ändert sich sehr oft (z. B. Leistungsmesser oder Messwerte im Sekundentakt).",
      impact: "Sie bläht die Datenbank auf, verlangsamt Verlauf und Logbuch und vergrößert Backups.",
      steps: [
        "Prüfe, ob die Aufzeichnung dieser Entität nötig ist.",
        "Schließe sie im Recorder aus oder reduziere die Aktualisierungsrate an der Quelle.",
        "Optional: Verkürze die Aufbewahrungsdauer des Recorders.",
      ],
    },
    updates_available: {
      title: "Updates verfügbar",
      what: "{count} Update(s) warten auf die Installation.",
      cause: "Neue Versionen von Home Assistant, Apps, Integrationen oder Geräten wurden veröffentlicht.",
      impact: "Updates enthalten oft Fehlerbehebungen und Sicherheitskorrekturen; veraltete Software bleibt angreifbar.",
      steps: [
        "Lies die Release-Notes (Link unter „Betroffene Objekte“).",
        "Erstelle ein Backup und installiere die Updates.",
        "Nicht gewünschte Updates kannst du im Update-Dialog überspringen.",
      ],
    },
  },
  en: {
    broken_reference: {
      title: "Broken reference",
      what: "The entity {subject} does not exist but is used in {count} automation(s) or script(s).",
      cause: "The entity was deleted or renamed, or its integration or device was removed. The configuration still points to the old ID.",
      impact: "These references lead nowhere: triggers never fire, conditions are never met, actions fail or are skipped.",
      steps: [
        "Check the entity list to see whether the entity was renamed and what it is called now.",
        "Under “Affected objects” open each automation or script and replace the old ID with the new one – or remove the reference.",
        "Then run a new scan: the finding disappears and shows up under “Recently resolved”.",
      ],
    },
    integration_not_loaded: {
      title: "Integration not running",
      what: "{subject} is not loaded (status: {state}). {count} entity(ies) are unavailable because of this.",
      cause: "The integration could not start or cannot reach its device or service (e.g. device offline, expired credentials, network problem).",
      impact: "All entities of this integration are missing; automations and dashboards that use them do not work as intended.",
      steps: [
        "Open the integration and read the error message on the entry.",
        "Check the device, network and credentials; reload the integration or sign in again.",
        "If the integration is no longer needed, delete the entry.",
      ],
    },
    unavailable_entities: {
      title: "Unavailable entities",
      what: "{count} entity(ies) of {subject} are currently unavailable.",
      cause: "The device or service behind them does not respond (battery empty, out of range, offline) or no longer reports the entity.",
      impact: "States are missing; automations and dashboards using these entities show nothing or do not react.",
      steps: [
        "Check the affected devices (power, battery, radio link).",
        "Restart the integration if several devices are affected at once.",
        "Delete permanently removed devices in Home Assistant so no leftovers remain.",
      ],
    },
    orphaned_entities: {
      title: "Orphaned entities",
      what: "{count} entity(ies) of {subject} are still registered but no longer provided by any integration.",
      cause: "The device or integration was removed or the entity was renamed; its entry in the entity registry was left behind.",
      impact: "They occupy names and registry entries, deliver no values and can fake references in automations.",
      steps: [
        "Open the entity list, find the entries named under “Affected objects” and delete them.",
        "Before that, check whether automations or dashboards still refer to them.",
      ],
    },
    unused_automation: {
      title: "Not triggered for a long time",
      what: "The automation has not been triggered for {days} days.",
      what_never: "The automation has never been triggered since it was created {days} days ago.",
      cause: "Its trigger conditions never match, the trigger no longer exists, or the automation is simply no longer needed.",
      impact: "Not an acute error, but dead weight: the configuration gets harder to oversee and gives a false sense of security.",
      steps: [
        "Check the trigger: does the triggering event (entity, time, state) still exist?",
        "If it is still needed (e.g. seasonal), mark the finding as “Allowed”.",
        "Otherwise turn it off and delete it after a while – or hide the finding here.",
      ],
    },
    unused_script: {
      title: "Script not run for a long time",
      what: "The script has not been run for {days} days.",
      what_never: "The script has never been run since it was created {days} days ago.",
      cause: "No dashboard, automation or person calls the script any more.",
      impact: "Not an acute error, but dead weight in the configuration.",
      steps: [
        "Check whether dashboards, automations or voice assistants still call the script.",
        "If it is only needed rarely, mark the finding as “Allowed”.",
        "Otherwise delete the script or hide the finding.",
      ],
    },
    stale_token: {
      title: "Unused access token",
      what: "The long-lived token “{subject}” of {user} has not been used for {days} days.",
      what_never: "The long-lived token “{subject}” of {user} has never been used.",
      cause: "A long-lived token was created for an app, script or service that does not (or no longer) use it.",
      impact: "A valid, forgotten token remains a permanent way into your Home Assistant – whoever knows it needs no password.",
      steps: [
        "Open the security page of the user profile and check whether the token is still needed (tokens of other users are only visible in their own profile).",
        "No longer needed: revoke the token.",
        "If it is only used rarely (e.g. a backup script), mark the finding as “Allowed”.",
      ],
    },
    high_risk_integration: {
      title: "High-risk integration",
      what: "{subject} was rated high risk ({reasons}).",
      cause: "The integration accesses particularly sensitive data or system areas (location, camera, root/system rights).",
      impact: "This is not an error, but an increased privacy and security risk if the integration is compromised or passes data on.",
      steps: [
        "Check whether you really need the integration and whether it comes from a trusted source.",
        "Limit access where possible (e.g. disable camera or location entities).",
        "If the risk is acceptable for you, change the risk level in “Installed integrations” (column “Adjust”) or mark the finding as “Allowed”.",
      ],
    },
    privileged_app: {
      title: "App with far-reaching rights",
      what: "{subject} has extended rights ({rights}).",
      cause: "According to its configuration the app needs far-reaching system rights, e.g. for hardware, network or Supervisor access.",
      impact: "A compromised or faulty app with such rights can affect the entire system.",
      steps: [
        "Check whether the app comes from a trusted source and is up to date.",
        "Stop and uninstall apps you no longer need.",
        "If the rights belong to the purpose of the app, mark the finding as “Allowed”.",
      ],
    },
    secrets_stored: {
      title: "Stored credentials",
      what: "{count} stored credential(s) (passwords, tokens, API keys) were found in {integrations} integration(s).",
      cause: "Integrations store their credentials in the Home Assistant configuration during setup – this is normal.",
      impact: "A notice, not an error: the values sit unencrypted in the configuration and therefore also in backups. Anyone with access to them can read them.",
      steps: [
        "Only hand out backups and the configuration folder to trusted places.",
        "Encrypt backups if possible.",
        "The “API keys, tokens & secrets” section shows which fields are affected.",
      ],
    },
    backup_old: {
      title: "Backup is outdated",
      what: "The last backup is {days} days old.",
      cause: "No (or no successful) automatic backup is running.",
      impact: "After a failure or mistake, all changes since the last backup are lost.",
      steps: [
        "Open the backup page and create a backup now.",
        "Set up automatic backups and check that they really run.",
        "Keep at least one copy outside the device.",
      ],
    },
    backup_missing: {
      title: "No backup found",
      what: "No Home Assistant backup was found.",
      cause: "Backups were never set up or were deleted – or HA Percyta cannot read the backup source on this system.",
      impact: "Without a backup the installation cannot be restored after a failure.",
      steps: [
        "Open the backup page and check whether backups exist there.",
        "If not: create a backup and set up automatic backups.",
      ],
    },
    disk_high: {
      title: "Storage is running low",
      what: "The system storage is {percent} % full.",
      cause: "Database, backups, media or logs use a lot of space.",
      impact: "If the storage is full, the database, backups and updates can fail – in the worst case Home Assistant no longer runs properly.",
      steps: [
        "Check “Storage & system” for the largest consumers.",
        "Delete old backups and media; shorten the recorder retention or exclude large entities.",
        "Use a larger drive if needed.",
      ],
    },
    db_hotspot: {
      title: "Database hotspot",
      what: "{subject} causes {share} % of all state rows ({rows} rows).",
      cause: "The entity changes very often (e.g. power meters or readings every second).",
      impact: "It bloats the database, slows down history and logbook and makes backups larger.",
      steps: [
        "Check whether recording this entity is necessary.",
        "Exclude it in the recorder or reduce the update rate at the source.",
        "Optionally: shorten the recorder retention period.",
      ],
    },
    updates_available: {
      title: "Updates available",
      what: "{count} update(s) are waiting to be installed.",
      cause: "New versions of Home Assistant, apps, integrations or devices were released.",
      impact: "Updates often contain bug fixes and security fixes; outdated software stays vulnerable.",
      steps: [
        "Read the release notes (link under “Affected objects”).",
        "Create a backup and install the updates.",
        "You can skip unwanted updates in the update dialog.",
      ],
    },
  },
};

// ---------- v1.2.2: Automationen, Verlauf, Datenbank-Werkzeuge, Secrets ----------
const XSTR = {
  de: {
    cat_automations: "Automationen & Skripte",
    obj_automation: "Die Automation", obj_script: "Das Skript",
    iss_missing: "Existiert nicht", iss_disabled: "Deaktiviert", iss_no_state: "Ohne Zustand (Integration nicht geladen?)",
    iss_orphaned: "Verwaist", iss_unavailable: "Nicht verfügbar", iss_missing_device: "Gerät existiert nicht",
    iss_missing_area: "Bereich existiert nicht", iss_unknown_action: "Aktion unbekannt", iss_error: "Fehler",
    iss_failed_single: "Lief noch (Modus single)", iss_failed_max_runs: "Max. Läufe erreicht",
    part_trigger: "Auslöser", part_condition: "Bedingung", part_action: "Aktion", part_blueprint: "Blueprint-Eingabe", part_other: "Sonstiges",
    kind_entity: "Entität", kind_template: "Template", kind_device: "Gerät", kind_area: "Bereich", kind_action: "Aktion",
    fd_th_when: "Zeitpunkt", fd_th_issue: "Problem", fd_th_part: "Teil", fd_th_kind: "Art", fd_th_now: "Jetzt",
    fd_tab_history: "Verlauf", fd_hist_first: "Erstmals beobachtet", fd_hist_resolved: "Behoben",
    fd_hist_added: "Hinzugekommen: {n}", fd_hist_removed: "Entfallen: {n}", fd_hist_sev: "Schwere: {a} → {b}",
    fd_hist_total: "Betroffene Objekte: {a} → {b}", fd_hist_none: "Seit der ersten Beobachtung keine Änderung.",
    fd_k_validation_status: "Prüfstatus", fd_k_validation_error: "Fehlermeldung", fd_k_last_error: "Letzter Fehler",
    fd_k_last_step: "Fehlerhafter Schritt", fd_k_last_run: "Letzter Lauf", fd_k_runs_stored: "Gespeicherte Läufe",
    fd_k_runs_failed: "Davon fehlerhaft", fd_k_runs_skipped: "Davon übersprungen", fd_k_mode: "Modus", fd_k_active: "Aktiv",
    fd_k_blocked_by_conditions: "Durch Bedingungen blockiert", fd_k_last_blocked: "Zuletzt blockiert",
    fd_k_issue_missing: "Existiert nicht", fd_k_issue_disabled: "Deaktiviert", fd_k_issue_no_state: "Ohne Zustand",
    fd_k_issue_orphaned: "Verwaist", fd_k_issue_unavailable: "Nicht verfügbar", fd_k_issue_missing_device: "Gerät fehlt",
    fd_k_issue_missing_area: "Bereich fehlt", fd_k_issue_unknown_action: "Aktion unbekannt",
    r_resolved_badge: "✔ Behoben", r_resolved_at: "Behoben am", r_duration: "Bestand", r_title_prefix: "Behoben",
    r_was: "Was war das Problem?", r_now_ok: "Beim Scan am {d} war dieser Befund nicht mehr vorhanden – alle betroffenen Objekte sind seitdem in Ordnung.",
    r_no_snapshot: "Für Befunde, die vor Version 1.2.2 behoben wurden, sind keine Details gespeichert.",
    r_open_t: "Details anzeigen", r_back: "← Zur Übersicht", r_days: "{n} Tage", r_hours: "{n} Std.",
    r_now_missing: "fehlt weiterhin", r_now_ok_state: "ok",
    sec_hint_safe: "🔒 Werte werden serverseitig maskiert – Klartext gelangt nie in Report, Datei, Sensor oder HTML-Export. Anzeigen/Kopieren holt den Wert auf Klick (nur Admins, max. 10/min) und wird protokolliert; die Anzeige verschwindet nach 20 Sekunden automatisch.",
    sec_reveal_off: "Klartext-Anzeige ist in den Optionen deaktiviert.",
    sec_copy: "📋 Kopieren", sec_copy_t: "In die Zwischenablage kopieren (ohne Anzeige)", sec_copied: "✔ Kopiert",
    sec_rate: "Zu viele Abrufe – bitte kurz warten", sec_audit: "🧾 Protokoll: Abrufe von Secrets",
    sec_audit_empty: "Noch keine Abrufe protokolliert.", th_action: "Aktion", th_target: "Ziel", th_result: "Ergebnis",
    // Datenbank-Werkzeuge
    db_tools: "🛠️ Datenbank bearbeiten", db_warn: "⚠️ Änderungen an der Datenbank sind endgültig. Ist die Datenbank beschädigt, startet Home Assistant nicht mehr richtig – deshalb wird vor jeder Aktion standardmäßig eine Sicherung erstellt.",
    db_t_replace: "🔁 Entität ersetzen", db_t_replace_t: "Neues Gerät übernimmt Verlauf und Statistik des alten",
    db_t_rename: "✏️ Umbenennen", db_t_purge: "🗑️ Daten löschen", db_t_backup: "💾 Sicherungen", db_t_log: "📜 Protokoll",
    db_row_menu: "Aktionen", db_orphans: "🧟 Datenleichen (Daten ohne Entität)", db_orphans_hint: "Entitäts-IDs mit Verlauf oder Statistik in der Datenbank, die es in Home Assistant nicht mehr gibt. Typisch nach Gerätetausch, Umbenennung oder Löschen.",
    db_orphans_none: "Keine Datenleichen gefunden. 🎉", db_sel_delete: "🗑️ Ausgewählte löschen", db_sel_n: "{n} ausgewählt",
    th_states: "Zustände", th_stats: "Statistik",
    dlg_close: "Schließen", dlg_cancel: "Abbrechen", dlg_run: "Ausführen",
    dlg_running: "Wird ausgeführt … (inkl. Sicherung, das kann einige Minuten dauern)", dlg_done: "✔ Erledigt",
    dlg_done_bg: "✔ Auftrag angenommen – der Recorder arbeitet ihn im Hintergrund ab.", dlg_error: "❌ Fehler: ",
    dlg_old: "Alte Entität (deren Verlauf übernommen wird)", dlg_new: "Neue Entität (übernimmt die alte ID)",
    dlg_from: "Aktuelle ID", dlg_to: "Neue ID",
    dlg_replace_title: "🔁 Entität ersetzen – Verlauf & Statistik übernehmen",
    dlg_replace_intro: "Für den Gerätetausch: Die neue Entität bekommt die ID der alten. Verlauf und Langzeitstatistik laufen dadurch nahtlos weiter (z. B. im Energie-Dashboard). Ablauf: Sicherung → alte Entität aus der Registry entfernen → neue Entität auf die alte ID umbenennen.",
    dlg_replace_note: "Hinweis: Der Recorder schreibt dabei eine Warnung ins Log („Cannot migrate history … already in use“). Das ist erwartet – genau dadurch schreibt die neue Entität in den bestehenden Verlauf weiter.",
    dlg_remove_old: "Alte Entität aus der Entitäten-Registry entfernen (nötig, damit die ID frei wird)",
    dlg_purge_new: "Bisherigen (kurzen) Verlauf der neuen Entität löschen", dlg_force: "Warnungen übergehen (z. B. abweichende Einheit, alte Entität noch aktiv)",
    dlg_rename_title: "✏️ Entität / Verlauf umbenennen",
    dlg_rename_intro: "Benennt eine Entität samt Verlauf und Statistik um. Gibt es die Entität nicht mehr (nur noch Daten in der Datenbank), werden nur Verlauf und Statistik umbenannt. Die neue ID muss frei sein und darf noch keine Daten haben – sonst „Entität ersetzen“ verwenden.",
    dlg_purge_title: "🗑️ Daten aus der Datenbank löschen",
    dlg_purge_intro: "Wähle die Entitäten aus und entscheide dann einzeln, was gelöscht wird: Verlauf, Kurzzeitstatistik und/oder Langzeitstatistik. Die Entitäten selbst bleiben bestehen; laufende Entitäten zeichnen danach neu auf.",
    dlg_scope_states: "Verlauf (Zustände & Ereignisse)",
    dlg_backup_title: "Sicherung vor der Änderung", dlg_bk_copy: "Kopie der Datenbank-Datei erstellen (schnell, empfohlen)",
    dlg_bk_ha: "Home-Assistant-Backup erstellen", dlg_bk_skip: "Keine Sicherung – ich habe bereits ein aktuelles Backup",
    dlg_bk_ext: "Externe Datenbank (MariaDB/PostgreSQL): Ein HA-Teil-Backup enthält sie nicht. Mit Supervisor wird ein Voll-Backup erstellt – sonst bitte die Datenbank selbst sichern.",
    dlg_confirm: "Ich habe verstanden, dass diese Änderung nicht rückgängig gemacht werden kann (außer über die Sicherung).",
    dlg_pv_states: "Zustände", dlg_pv_stats: "Statistik (Langzeit / Kurzzeit)", dlg_pv_range: "Zeitraum",
    dlg_pv_entity: "Aktuell", dlg_pv_none: "keine Daten", dlg_pv_missing: "existiert nicht", dlg_pv_reg: "in Registry",
    w_unit: "⚠️ Einheit der Statistik ({a}) weicht von der neuen Entität ({b}) ab – Home Assistant meldet dann ein Statistik-Problem.",
    w_old_active: "⚠️ Die alte Entität ist noch aktiv ({s}). Ist das alte Gerät wirklich entfernt?",
    w_no_state_class: "⚠️ Die neue Entität hat keine state_class – die Langzeitstatistik wird dann nicht fortgeschrieben.",
    w_target_data: "⚠️ Die neue ID hat bereits Daten – Umbenennen würde sie nicht zusammenführen. Nutze „Entität ersetzen“.",
    w_old_nodata: "⚠️ Zur alten ID gibt es keine Daten in der Datenbank – es gibt nichts zu übernehmen.",
    w_same_domain: "⚠️ Beide IDs müssen dieselbe Domain haben (z. B. sensor.).",
    bk_title: "💾 Sicherungen der Datenbank", bk_intro: "Kopien der SQLite-Datenbank liegen unter /config/ha_percyta_db_backups (die letzten 2 werden behalten). Wiederherstellen: Home Assistant stoppen, Kopie als /config/home-assistant_v2.db zurückkopieren, Home Assistant starten.",
    bk_make_copy: "Datenbank jetzt kopieren", bk_make_ha: "HA-Backup jetzt erstellen", bk_none: "Noch keine Kopie vorhanden.",
    bk_delete: "Löschen", bk_not_sqlite: "Datei-Kopie nur bei SQLite möglich (aktuell: {e}).", th_created: "Erstellt",
    log_title: "📜 Protokoll der Datenbank-Aktionen", log_empty: "Noch keine Aktionen protokolliert.",
    a_backup: "Sicherung", a_backup_delete: "Sicherung gelöscht", a_purge: "Daten gelöscht", a_rename: "Umbenannt", a_replace: "Ersetzt",
    a_secret_show: "Secret angezeigt", a_secret_copy: "Secret kopiert", ok: "ok", failed: "fehlgeschlagen",
    e_recorder_unavailable: "Der Recorder ist nicht verfügbar.", e_migration: "Die Datenbank wird gerade migriert – bitte später erneut versuchen.",
    e_busy: "Es läuft bereits eine Datenbank-Aktion.", e_invalid_id: "Ungültige ID.", e_same_id: "Alte und neue ID sind gleich.",
    e_domain_mismatch: "Beide IDs müssen dieselbe Domain haben.", e_target_in_use: "Die neue ID ist bereits vergeben.",
    e_target_has_data: "Die neue ID hat bereits Daten – nutze „Entität ersetzen“.", e_no_data: "Zur alten ID gibt es keine Daten.",
    e_new_not_registered: "Die neue Entität steht nicht in der Entitäten-Registry (keine eindeutige ID) und kann nicht umbenannt werden.",
    e_old_registered: "Die alte Entität ist noch registriert – bitte „aus der Registry entfernen“ auswählen.",
    e_old_active: "Die alte Entität ist noch aktiv. Gerät entfernen oder „Warnungen übergehen“ wählen.",
    e_old_unmanaged: "Die alte Entität hat keine eindeutige ID (z. B. YAML) und kann nicht automatisch entfernt werden.",
    e_unit_mismatch: "Die Einheiten weichen ab. Mit „Warnungen übergehen“ trotzdem ausführen.",
    e_no_space: "Nicht genug freier Speicher für die Datenbank-Kopie.", e_not_sqlite: "Keine SQLite-Datenbank – bitte HA-Backup wählen.",
    e_backup_check_failed: "Die Kopie hat die Prüfung nicht bestanden – es wurde nichts geändert.",
    e_backup_failed: "Die Sicherung ist fehlgeschlagen – es wurde nichts geändert.", e_no_backup_service: "Kein Backup-Dienst verfügbar.",
    e_registry_refused: "Home Assistant hat die Umbenennung abgelehnt.", e_action_failed: "Aktion fehlgeschlagen.",
    // v1.2.2b: Auswahl & weitere Werkzeuge
    pk_search: "Suchen oder auswählen …", pk_open: "Liste öffnen", pk_loading: "Lade Liste aus der Datenbank …",
    pk_f_all: "Alle", pk_f_orphan: "🧟 Datenleichen", pk_f_restored: "👻 Verwaist", pk_f_stats: "📊 Mit Statistik", pk_f_norec: "🚫 Nicht aufgezeichnet",
    pk_all_domains: "Alle Domains", pk_remove: "Aus der Auswahl nehmen", pk_none_sel: "Noch nichts ausgewählt – unten suchen und anklicken.",
    pk_nothing: "Keine Treffer.", pk_count: "{n} Treffer (zeige {m})", pk_add_all: "Alle Treffer auswählen ({n})", pk_add_lim: "Erste {n} von {m} Treffern auswählen",
    pk_b_external: "externe Statistik", pk_b_orphan: "ohne Entität", pk_b_restored: "verwaist", pk_b_disabled: "deaktiviert", pk_b_norec: "nicht aufgezeichnet",
    pk_states: "Zustände", pk_stats: "Statistik", pk_ph_old: "Alte ID suchen (z. B. Datenleiche) …", pk_ph_new: "Neue Entität suchen …",
    dlg_ids_pick: "Entitäten / Statistiken auswählen (Mehrfachauswahl)", dlg_keep: "Umfang", dlg_keep_all: "Alles löschen",
    dlg_keep_n: "Nur Daten älter als {n} Tage löschen",
    w_purge_live: "ℹ️ {n} der ausgewählten Entitäten sind aktiv – sie zeichnen nach dem Löschen weiter auf.",
    dlg_reg_title: "👻 Verwaiste Entitäten entfernen", dlg_reg_intro: "Entfernt Einträge aus der Entitäten-Registry, die von keiner Integration mehr bereitgestellt werden (z. B. nach dem Entfernen eines Geräts). Aktive Entitäten sind gesperrt. Auf Wunsch werden auch ihr Verlauf und ihre Statistik gelöscht.",
    dlg_reg_pick: "Verwaiste / nicht verfügbare Entitäten auswählen", dlg_reg_purge: "Auch Verlauf und Statistik dieser Entitäten aus der Datenbank löschen",
    dlg_reg_note: "Die Entitäten-Registry liegt in .storage – sie ist im Home-Assistant-Backup enthalten, nicht in der Datenbank-Kopie.",
    db_t_cleanup: "🧹 Aufräumen", db_t_cleanup_t: "Alte Daten der ganzen Datenbank löschen und optional verkleinern",
    db_t_registry: "👻 Verwaiste Entitäten", db_t_registry_t: "Registry-Einträge ohne Integration entfernen",
    cl_title: "🧹 Datenbank aufräumen & verkleinern", cl_intro: "Löscht in der ganzen Datenbank alle Zustände, Ereignisse und Kurzzeitstatistiken, die älter als die gewählte Zeit sind (wie der nächtliche Recorder-Lauf, aber sofort). Langzeitstatistiken bleiben erhalten.",
    cl_days: "Aufbewahren", cl_repack: "Datenbank danach verkleinern (repack/VACUUM) – gibt Speicher frei, dauert länger und braucht vorübergehend freien Platz in Größe der Datenbank",
    cl_note: "Hinweis: Hat der Recorder eine kürzere Aufbewahrung eingestellt, löscht er ohnehin früher. Während des Verkleinerns kann Home Assistant kurz träge reagieren.",
    tk_title: "🔑 Zugriffstoken widerrufen", tk_intro: "Token „{c}“ von {u} wird sofort ungültig. Apps, Skripte oder Dienste, die ihn nutzen, verlieren den Zugriff.",
    tk_warn: "⚠️ Das lässt sich nicht rückgängig machen – bei Bedarf muss ein neuer Token erstellt werden. Den Token deiner aktuellen Sitzung kannst du hier nicht widerrufen.",
    tk_confirm: "Ich möchte diesen Token endgültig widerrufen.", tk_revoke: "🚫 Widerrufen",
    au_turn_on: "▶ Einschalten", au_turn_off: "⏸ Ausschalten", au_trigger: "▶ Jetzt testen", hs_purge_old: "🗑️ Alten Verlauf löschen",
    a_cleanup: "Datenbank aufgeräumt", a_registry_remove: "Entitäten entfernt", a_token_revoke: "Token widerrufen",
    e_not_supported: "Diese Home-Assistant-Version unterstützt das teilweise Löschen der Statistik nicht – bitte „Alles löschen“ wählen oder nur den Verlauf.",
    e_invalid_days: "Ungültige Anzahl Tage.", e_still_active: "Diese Entitäten sind noch aktiv und werden nicht entfernt", e_own_token: "Den Token der aktuellen Sitzung kannst du nicht widerrufen.", e_not_found: "Nicht gefunden.",
    // v1.2.2c
    dlg_scope_title: "Was soll gelöscht werden?",
    dlg_scope_states_h: "Zustandsverlauf, den du im Verlauf und Logbuch siehst.",
    dlg_scope_short: "Kurzzeitstatistik (5-Minuten-Werte)", dlg_scope_short_h: "Feine Werte der letzten Tage; der Recorder räumt sie ohnehin regelmäßig auf.",
    dlg_scope_long: "Langzeitstatistik (Stundenwerte, für immer)", dlg_scope_long_h: "Grundlage für Energie-Dashboard, Statistik-Karten und Jahresvergleiche – meist behalten!",
    w_long: "⚠️ Die Langzeitstatistik wird gelöscht. Für diese Entitäten fehlen danach Werte im Energie-Dashboard und in Langzeit-Diagrammen.",
    db_calm: "💡 Keine Sorge: Jeder Button öffnet zuerst nur ein Fenster. Dort wählst du in Ruhe aus, siehst eine Vorschau und entscheidest erst am Ende mit „Ausführen“, ob und wie gelöscht wird. Abbrechen geht jederzeit.",
    tk_box_t: "Was bedeutet „Widerrufen“?", tk_box_1: "Der Token wird sofort und endgültig ungültig.",
    tk_box_2: "Apps, Skripte oder Dienste, die ihn nutzen (z. B. Grafana, Node-RED, iOS-Kurzbefehle), verlieren sofort den Zugriff und brauchen einen neuen Token.",
    tk_box_3: "Es öffnet sich vorher ein Fenster zur Bestätigung. Deine eigene, aktuelle Anmeldung ist geschützt.",
    tk_what: "Was passiert beim Widerrufen?", tk_w1: "Der Token wird sofort gelöscht und ist danach ungültig.",
    tk_w2: "Alles, was mit diesem Token auf Home Assistant zugreift, wird ab sofort abgewiesen.",
    tk_w3: "Benutzer und andere Tokens bleiben unverändert.", tk_w4: "Wird der Zugang noch gebraucht: im Benutzerprofil (Sicherheit) einen neuen Langzeit-Token erstellen und dort eintragen.",
    sec_care: "🧽 Pflege-Center", rk_title: "Risiko & Datenschutz",
    cc_intro: "Alles auf einen Blick, was sich in deinem Home Assistant aufräumen oder verbessern lässt. Jeder Button öffnet zuerst ein Fenster mit Erklärung und Vorschau – geändert wird erst nach deiner Bestätigung.",
    cc_clean: "✓ Alles sauber", cc_btn_clean: "Aufräumen …", cc_btn_remove: "Entfernen …", cc_btn_review: "Prüfen …", cc_btn_reload: "Neu laden …",
    cc_btn_show: "Anzeigen", cc_btn_backup: "Sichern …", cc_btn_open: "Öffnen ↗", cc_days: "{n} Tage",
    cc_dbo: "Datenleichen in der Datenbank", cc_dbo_d: "{r} Zeilen von Entitäten, die es nicht mehr gibt.",
    cc_rest: "Verwaiste Entitäten", cc_rest_d: "Noch registriert, aber von keiner Integration mehr bereitgestellt.",
    cc_dev: "Verwaiste Geräte", cc_dev_d: "Geräte einer Integration, die gelöscht wurde.",
    cc_unav: "Nicht verfügbare Entitäten", cc_unav_d: "Dauerhaft tote Entitäten lassen sich deaktivieren oder – wie „Löschen“ in HA – ganz entfernen. Das räumt Listen, Geräte und Dashboards auf.",
    cc_int: "Integrationen mit Fehler", cc_int_d: "Laufen nicht – oft hilft ein Neuladen.",
    cc_auto: "Automationen mit Problemen", cc_auto_d: "Ungültig, fehlerhaft oder mit kaputten Verweisen.",
    cc_off: "Ausgeschaltete Automationen", cc_off_d: "Laufen nie – vergessen oder gewollt?",
    cc_tok: "Ungenutzte Zugriffstokens", cc_tok_d: "Vergessene Zugänge – am besten widerrufen.",
    cc_db: "Datenbank", cc_db_d: "Alte Daten löschen und die Datei verkleinern.",
    cc_bk: "Letztes HA-Backup",
    cc_upd: "Verfügbare Updates", cc_upd_d: "Wartende Updates für Home Assistant, Apps und Geräte.",
    ed_title: "📡 Nicht verfügbare Entitäten", ed_what: "Was passiert beim Deaktivieren?",
    ed_mode: "Was soll passieren?", ed_mode_disable: "Deaktivieren", ed_mode_disable_h: "Umkehrbar – Entität und Verlauf bleiben erhalten, sie wird nur ausgeblendet.",
    ed_mode_remove: "Aus Home Assistant entfernen", ed_mode_remove_h: "Wie „Löschen“ in den Entitäts-Einstellungen von HA – sie verschwindet auch unter ihrem Gerät.",
    rm_what: "Was passiert beim Entfernen?",
    rm_w1: "Die Entität wird aus der Entitäten-Registry gelöscht – genau wie mit „Löschen“ in den Entitäts-Einstellungen von Home Assistant. Sie verschwindet auch unter ihrem Gerät.",
    rm_w2: "Stellt die Integration die Entität weiterhin bereit (z. B. Gerät nur vorübergehend offline), legt sie sie beim nächsten Neuladen oder Neustart wieder an – dann besser deaktivieren.",
    rm_w3: "Optional werden auch Verlauf und Statistik gelöscht. Die Entitäten-Registry steckt im Home-Assistant-Backup – deshalb ist es als Sicherung vorausgewählt.",
    rm_confirm: "Ausgewählte Entitäten aus Home Assistant entfernen.", rm_run: "🗑️ Entfernen", rm_btn: "🗑️ Aus HA entfernen …", rm_notfound: "{n} ohne Registry-Eintrag ({ids}) – diese stammen meist aus YAML und lassen sich nur dort entfernen.",
    ed_w1: "Die Entität verschwindet aus Dashboards, Auswahllisten und dem Verlauf; es wird nichts mehr aufgezeichnet.",
    ed_w2: "Sie wird NICHT gelöscht – der bisherige Verlauf bleibt erhalten.",
    ed_w3: "Rückgängig jederzeit: Einstellungen › Entitäten › Filter „Deaktiviert“ › Entität öffnen › „Aktiviert“ einschalten.",
    ed_pick: "Nicht verfügbare Entitäten auswählen", ed_confirm: "Ausgewählte Entitäten deaktivieren.", ed_run: "⏸ Deaktivieren",
    dv_title: "📵 Verwaiste Geräte entfernen", dv_what: "Was passiert beim Entfernen?",
    dv_w1: "Die Geräte werden aus der Geräte-Registry gelöscht – samt ihrer Entitäten.",
    dv_w2: "Nur Geräte, deren Integration es nicht mehr gibt, können entfernt werden; alles andere ist gesperrt.",
    dv_w3: "Richtest du die Integration später neu ein, legt sie ihre Geräte von selbst wieder an.",
    dv_pick: "Geräte auswählen", dv_ents: "{n} Entität(en)", dv_run: "🗑️ Geräte entfernen",
    rl_title: "🔌 Integrationen neu laden", rl_what: "Was passiert beim Neuladen?",
    rl_w1: "Die Integration wird beendet und neu gestartet – wie „Neu laden“ in Home Assistant. Einstellungen bleiben erhalten.",
    rl_w2: "Hilft bei kurzzeitigen Verbindungsproblemen. Klappt es nicht, öffne die Integration und lies die Fehlermeldung.",
    rl_w3: "Ein Klick auf den Namen oder „Öffnen“ führt direkt zur Integration in Home Assistant – dort steht die genaue Fehlermeldung und du kannst sie neu konfigurieren oder löschen.",
    clp_title: "Vorschau: gelöscht wird alles vor dem {d}", clp_states: "Verlauf (Zustände)", clp_events: "Ereignisse (Logbuch)",
    clp_short: "Kurzzeitstatistik (5-Minuten-Werte)", clp_long: "Langzeitstatistik (Stundenwerte)", clp_kept: "bleibt erhalten",
    clp_sum: "Zusammen werden {n} Zeilen gelöscht", clp_nothing: "Mit dieser Einstellung wird nichts gelöscht.", clp_est: "gibt ca. {s} in der Datenbank frei",
    clp_oldest: "Ältester Eintrag im Verlauf: {d}", clp_top: "Am meisten betroffen (Verlauf):", clp_rows: "{n} Zeilen",
    clp_note: "Die Platz-Angabe ist eine grobe Schätzung (Datenbankgröße ÷ Zeilenzahl). Die Datei wird erst mit „Danach verkleinern“ (oder der automatischen monatlichen Verkleinerung) kleiner.",
    copy_id: "ID kopieren", open_entity: "Entität in Home Assistant öffnen (Rechtsklick: Verlauf in neuem Tab)",
    rl_btn: "🔄 Neu laden", rl_open: "Öffnen ↗", rl_open_t: "Integration in Home Assistant öffnen",
    refreshing: "⟳ Daten werden aktualisiert …", dlg_pv_size: "Platz (ca.)",
    pv_est_sum: "Gibt zusammen ca. {s} in der Datenbank frei (grobe Schätzung: Datenbankgröße ÷ Zeilenzahl). Die Datei selbst wird erst kleiner, wenn sie verkleinert wird – Werkzeug „Aufräumen“ mit „Verkleinern“ oder die automatische Verkleinerung des Recorders am zweiten Sonntag im Monat (Standard, „auto_repack“). Bis dahin nutzt der Recorder den Platz für neue Daten.",
    pv_est_sum_max: "Gibt zusammen höchstens ca. {s} frei – mit „nur älter als …“ wird nur ein Teil gelöscht (grobe Schätzung). Die Datei selbst wird erst kleiner, wenn sie verkleinert wird (Werkzeug „Aufräumen“ mit „Verkleinern“).",
    a_entity_disable: "Entitäten deaktiviert", a_entry_reload: "Integration neu geladen", a_device_remove: "Geräte entfernt",
    e_device_in_use: "Diese Geräte gehören zu einer eingerichteten Integration und werden nicht entfernt", e_reload_failed: "Neuladen fehlgeschlagen.",
    cc_rep: "Offene Reparaturen", cc_rep_d: "Hinweise von Home Assistant selbst (Einstellungen › Reparaturen).",
    cc_err: "Wichtige Fehler im Log", cc_err_d: "Fehler und kritische Meldungen aus dem System-Log.",
    cc_cfg: "Konfiguration prüfen", cc_cfg_d: "YAML-Konfiguration testen – wie vor einem Neustart. Ändert nichts.", cc_btn_check: "Prüfen …",
    cfg_title: "🧪 Konfiguration prüfen", cfg_what: "Was passiert?", cfg_w1: "Home Assistant prüft configuration.yaml und alle eingebundenen Dateien – genau wie „Konfiguration prüfen“ vor einem Neustart.",
    cfg_w2: "Es wird nichts geändert und nichts neu gestartet.", cfg_running: "Prüfe Konfiguration …",
    cfg_ok: "✔ Konfiguration ist gültig – ein Neustart wäre sicher.", cfg_bad: "❌ Die Konfiguration enthält Fehler – vor einem Neustart beheben:",
    // v1.2.2d: Fortschritt & Pflege-Center-Seite
    pv_r_states: "Verlauf", pv_r_long: "Langzeitstatistik", pv_r_short: "Kurzzeitstatistik",
    jv_title: "Laufende Aktion", jv_details: "Details (Protokoll)", jv_done: "Fertig", jv_failed: "Fehlgeschlagen",
    jv_elapsed: "läuft seit {t}", jv_eta: "noch ca. {t}", jv_close_bg: "Schließen – läuft weiter",
    jv_hint: "Du kannst dieses Fenster schließen – die Aktion läuft in Home Assistant weiter. Den Stand siehst du oben in der Leiste (⏳) und kannst ihn dort jederzeit wieder öffnen.",
    jp_start: "Startet …", jp_count: "Zähle betroffene Zeilen", jp_bk_copy: "Sicherung: Datenbank wird kopiert", jp_bk_check: "Sicherung: Kopie wird geprüft",
    jp_ha_backup: "Home-Assistant-Backup wird erstellt", jp_purge: "Recorder löscht Daten", jp_apply: "Änderungen werden angewendet", jp_cleanup: "Datenbank wird aufgeräumt",
    ja_db_purge: "Daten löschen", ja_db_replace: "Entität ersetzen", ja_db_rename: "Umbenennen", ja_db_cleanup: "Datenbank aufräumen", ja_db_backup: "Sicherung",
    ja_registry_remove: "Verwaiste Entitäten entfernen", ja_device_remove: "Geräte entfernen", ja_: "Aktion",
    js_states: "Verlauf", js_statistics_short: "Kurzzeitstatistik", js_statistics_long: "Langzeitstatistik",
    jl_start: "▶ Gestartet: {action}", jl_count: "🔢 Zähle die betroffenen Zeilen für {n} ID(s) …", jl_count_done: "🔢 Zu löschen: {rows} Zeilen",
    jl_bk_copy: "💾 Sicherung: Kopie der Datenbank ({size}) …", jl_bk_check: "🔍 Prüfe die Kopie (PRAGMA quick_check) – bei großen Datenbanken dauert das einige Minuten …",
    jl_bk_done: "✔ Sicherung fertig: {name} ({size})", jl_bk_ha: "💾 Home-Assistant-Backup wird erstellt …", jl_bk_ha_done: "✔ HA-Backup erstellt {name}",
    jl_purge_start: "🗑️ Recorder löscht {rows} Zeilen ({scopes}) – in Etappen …", jl_purge_left: "   … noch {left} Zeilen übrig ({done} gelöscht)",
    jl_purge_stalled: "⚠️ Seit einer Minute keine Änderung – {left} Zeilen übrig. Der Recorder macht später weiter.",
    jl_purge_timeout: "⚠️ Beobachtung nach 60 Minuten beendet – der Recorder arbeitet im Hintergrund weiter.",
    jl_rn_registry: "✏️ Benenne {old} → {new} um (Verlauf zieht mit)", jl_rn_history: "✏️ Benenne Verlauf/Statistik {old} → {new} um",
    jl_rp_remove_old: "🧹 Entferne die alte Entität {old} aus der Registry", jl_rp_rename: "🔁 {new} übernimmt die ID {old}", jl_rp_purge_new: "🗑️ Lösche den kurzen Eigenverlauf von {new}",
    jl_cl_purge: "🧹 Recorder löscht alles älter als {days} Tage …", jl_cl_repack: "📦 Danach wird die Datenbank verkleinert (VACUUM) …",
    jl_rg_remove: "👻 Entferne {n} Entität(en) aus der Registry", jl_rg_purge: "🗑️ Lösche ihren Verlauf und ihre Statistik", jl_dv_remove: "📵 Entferne {n} Gerät(e)",
    jl_done: "✅ Fertig", jl_done_bg: "✅ Erledigt – der Recorder räumt im Hintergrund noch nach", jl_failed: "❌ Fehlgeschlagen: {code}",
    cc_open: "Pflege-Center öffnen", cc_todo: "{n} Punkte zum Aufräumen", cc_all_ok: "✓ Alles in Ordnung",
    cc_l_findings: "Befunde", cc_l_db: "Datenbank (Recorder)", cc_h_todo: "🧽 Aufräumen & Prüfen", cc_h_system: "🩺 System & Wartung",
    cc_h_tools: "🛠️ Werkzeuge", cc_h_log: "📜 Letzte Aktionen",
    ct_replace: "Gerät getauscht? Neue Entität übernimmt Verlauf & Statistik.", ct_rename: "Entität samt Verlauf auf eine neue ID umbenennen.",
    ct_purge: "Verlauf, Kurz- oder Langzeitstatistik gezielt löschen.", ct_cleanup: "Alles älter als N Tage löschen, Datei verkleinern.",
    ct_registry: "Registry-Einträge ohne Integration entfernen.", ct_backup: "Datenbank kopieren oder HA-Backup erstellen.",
    ct_db: "Größte Verbraucher, Datenleichen, Statistiken.", ct_findings: "Alle Befunde mit Diagnose und Anleitung.",
    cc_ring_n: "Pflegebedarf {n} % – je kleiner, desto besser. „Warum?“ zeigt, wie der Wert entsteht.", cc_ring_lbl: "Bedarf",
    sc_lvl_ok: "Kein Pflegebedarf", sc_lvl_low: "Geringer Pflegebedarf", sc_lvl_mid: "Mittlerer Pflegebedarf", sc_lvl_high: "Hoher Pflegebedarf",
    sc_unav: "Nicht verfügbare Entitäten", sc_int: "Integrationen mit Fehlern", sc_auto: "Automationen/Skripte mit Problemen",
    sc_orph: "Verwaiste Entitäten + Geräte", sc_disk: "Speicherbelegung", sc_dbo: "Datenleichen in der Datenbank", sc_bk: "Alter des letzten Backups",
    sc_tok: "Veraltete Tokens", sc_rep: "Offene Reparaturen", sc_err: "Fehler im Log", sc_upd: "Ausstehende Updates", sc_none: "keins",
    sc_intro: "Der Pflegebedarf zeigt, wie viel in deinem System zu tun ist – 0 % heißt: alles in Ordnung. Jeder Bereich wird im Verhältnis zur Größe deiner Installation bewertet (z. B. nicht verfügbare Entitäten im Verhältnis zu allen Entitäten) und hat ein festes Höchstgewicht. Zusammen ergeben alle Bereiche höchstens 100 Punkte.",
    sc_h_area: "Bereich", sc_h_val: "Aktuell", sc_h_pts: "Punkte", sc_full: "Volles Gewicht ab {f}",
    sc_total: "Summe: {n} von 100 Punkten = Pflegebedarf in Prozent.",
    sc_scale: "Farben: bis 10 % grün · bis 35 % gelb · bis 60 % orange · darüber rot. Der Speicher zählt erst ab 80 % Belegung, das Backup erst ab 7 Tagen. Die Gewichtung ist eine Faustregel, kein offizieller Home-Assistant-Wert.",
    cc_fnd: "Befunde (Reports)", cc_fnd_d: "Alle offenen Befunde aus dem Scan – Sicherheit, Automationen, Datenbank und mehr.",
    k_secfind: "Sicherheits-Befunde",
    cc_bk_ago: "Erstellt {a}. Vor größeren Aufräumaktionen ein frisches Backup erstellen.", cc_bk_none: "Kein Backup gefunden – vor dem Aufräumen unbedingt eines erstellen.",
    pk_clear_all: "✕ Alle abwählen ({n})", pk_sel_n: "{n} ausgewählt", pk_view_list: "☰ Liste", pk_view_chips: "▦ Kacheln",
    pk_sel_search: "In Auswahl suchen …",
    pv_loading: "⏳ Vorschau wird geladen …", pv_slow: "Bei großen Datenbanken kann das einige Sekunden dauern.",
    pv_empty: "Bitte zuerst mindestens eine Entität auswählen – in der Liste anklicken oder die ID eintippen und Enter drücken.",
    pv_busy: "Ein anderer Auftrag läuft gerade – die Vorschau kann etwas länger dauern.",
    jl_bk_replaced: "♻️ {n} vorhandene Percyta-Kopie(n) gelöscht, um Platz zu schaffen",
    dlg_bk_replace: "Vorhandene Percyta-Kopie ersetzen (die alte Kopie wird erst gelöscht – spart Speicher)",
    bk_space: "Datenbank {db} · benötigt {need} · frei {free}",
    bk_space_low: "⚠️ Zu wenig freier Speicher für eine zusätzliche Kopie – empfohlen: „Vorhandene Percyta-Kopie ersetzen“ (ist vorausgewählt).",
    bk_space_none: "⚠️ Der freie Speicher reicht nicht für eine Kopie der Datenbank. Bitte Speicher freigeben (z. B. alte Backups unter Einstellungen → System → Backups löschen) oder ein HA-Backup an einem externen Speicherort erstellen.",
    ns_title: "💾 Nicht genug Speicherplatz für die Sicherung",
    ns_text: "Für die Kopie der Datenbank werden {need} benötigt, frei sind nur {free}. Es wurde nichts gelöscht oder verändert.",
    ns_hint: "Tipp: Percyta-Sicherungskopien liegen im Ordner /config/ha_percyta_db_backups. Löschst du sie hier, wird Speicher frei. Mit „Vorhandene Kopie ersetzen“ wird die alte Kopie automatisch durch eine aktuelle ersetzt.",
    ns_copies: "Vorhandene Percyta-Kopien ({n}, zusammen {s}):", ns_no_copies: "Es gibt keine Percyta-Kopien, die gelöscht werden könnten.",
    ns_replace: "♻️ Vorhandene Kopie ersetzen", ns_ha: "💾 HA-Backup verwenden", ns_chosen: "Auswahl übernommen – jetzt erneut „Ausführen“ klicken.",
    ns_ok_t: "✅ Jetzt ist genug Speicher frei", ns_ok: "Frei: {free}. Du kannst die Aktion jetzt erneut ausführen.",
    ns_text2: "Benötigt werden {need}, frei sind jetzt {free} – das reicht noch nicht.", bk_replace_btn: "♻️ Kopie ersetzen",
    grp_security: "Sicherheit & Datenschutz", grp_system: "System & Details",
    sm_integrations: "{n} installiert · {c} eigene", sm_installed: "{n} installiert", sm_sysaccess: "{n} mit Systembezug",
    sm_none: "keine", sm_secrets: "in {n} Integrationen", sm_users: "{a} Admin · {u} Benutzer", sm_tokens: "{l} Langzeit · {s} ungenutzt",
    sm_system: "RAM {r} · CPU {c}", sm_inventory: "{a} Automationen · {u} nicht verfügbar", sm_updates: "{n} Updates", sm_update1: "1 Update",
    sm_findings: "{h} hoch · {m} mittel · {l} niedrig", sm_database: "{r} Zeilen · {o} Datenleichen", sm_db_pending: "wird ausgewertet …",
    sm_errors: "letzter {a}",
    fh_title: "ℹ️ Was bedeuten Offen, Erlaubt, Zurückgestellt und Ausgeblendet?",
    fh_open: "Neu gefundene oder weiter bestehende Befunde. Sie zählen als „offene Befunde“ und erscheinen im Pflege-Center.",
    fh_known: "Du hast den Befund geprüft und akzeptierst ihn bewusst (z. B. eine gewollte Cloud-Integration). Er zählt nicht mehr als offen, wird aber bei jedem Scan weiter geprüft.",
    fh_snoozed: "Für 7, 30 oder 90 Tage beiseitegelegt. Danach wird der Befund automatisch wieder „Offen“, falls das Problem noch besteht.",
    fh_hidden: "Dauerhaft ausgeblendet – z. B. weil er für dich nicht zutrifft. Er bleibt so lange ausgeblendet, bis du ihn unter „Ausgeblendet“ wieder öffnest.",
    fh_note: "Der Status wird nur in HA Percyta gespeichert – in Home Assistant wird dadurch nichts geändert, gelöscht oder abgeschaltet. Ist ein Problem tatsächlich behoben, verschwindet der Befund beim nächsten Scan aus jedem Status und steht unter „Zuletzt behoben“. Mit „Wieder öffnen“ holst du einen Befund jederzeit zurück.",
    cc_pbk: "Letzte Percyta-Sicherung", cc_pbk_d: "Erstellt {a} · {n} Kopie(n), zusammen {s} in /config/ha_percyta_db_backups.",
    cc_pbk_none: "Noch keine Kopie – „Sichern …“ erstellt eine schnelle Kopie der Datenbank-Datei.",
    er_kind: "Einordnung", dg_dep_k: "📦 Abhängigkeit", dg_auth_k: "🔐 Anmeldung", dg_net_k: "📡 Erreichbarkeit", dg_tmpl_k: "🧩 Template",
    dg_entity_k: "🏷️ Entität", dg_code_k: "🐞 Programmfehler", dg_setup_k: "⚙️ Einrichtung", dg_fetch_k: "🔄 Datenabruf", dg_custom_k: "🧩 Eigene Integration", dg_generic_k: "❔ Unklar",
    er_title: "❗ Fehler im Detail", er_click: "Für Details, mögliche Ursache und Lösungsvorschläge auf einen Fehler klicken.",
    er_msg: "Meldung", er_src: "Quelle", er_logger: "Logger", er_count: "Anzahl", er_last: "Zuletzt", er_first: "Zuerst", er_int: "Betroffene Integration",
    er_trace: "Technische Details (Traceback)", er_cause: "🔎 Mögliche Ursache", er_steps: "🛠️ Das kannst du tun",
    er_open_int: "Integration öffnen ↗", er_reload: "🔄 Integration neu laden", er_logs: "Protokolle öffnen ↗", er_copy: "📋 Meldung kopieren", er_copied: "✔ Kopiert",
    er_note: "Die Diagnose ist eine automatische Einschätzung anhand des Fehlertexts und kann danebenliegen. Im Zweifel hilft der vollständige Eintrag unter Einstellungen → System → Protokolle.",
    er_custom: "Eigene Integration (HACS)", er_core: "Home-Assistant-Integration", er_unknown: "nicht erkennbar",
    dg_dep_c: "Ein benötigtes Python-Paket konnte nicht installiert werden oder passt nicht zu einem anderen Paket (Versionskonflikt).",
    dg_dep_s: ["Integration (z. B. über HACS) auf die neueste Version aktualisieren.", "Prüfen, ob eine andere Integration dasselbe Paket in einer anderen Version verlangt.", "Wenn es bleibt: beim Entwickler der Integration melden (Issue mit der Meldung)."],
    dg_entity_c: "Eine Entität konnte nicht angelegt werden – oft weil es schon eine Entität mit derselben eindeutigen ID gibt oder die Integration ungültige Daten liefert.",
    dg_entity_s: ["Integration neu laden.", "Unter Einstellungen → Entitäten nach doppelten oder verwaisten Einträgen dieser Integration suchen und sie entfernen.", "Integration aktualisieren; hilft das nicht, den Fehler beim Entwickler melden."],
    dg_setup_c: "Die Integration konnte (Teile von) sich nicht starten. Häufig ist sie nicht mit der installierten Home-Assistant-Version kompatibel.",
    dg_setup_s: ["Integration auf die neueste Version aktualisieren.", "Integration neu laden oder Home Assistant neu starten.", "Changelog/Issues der Integration auf bekannte Probleme mit deiner HA-Version prüfen."],
    dg_code_c: "Ein Programmfehler in der Integration (z. B. AttributeError, TypeError, KeyError). Das liegt fast immer an der Integration selbst, nicht an deiner Konfiguration.",
    dg_code_s: ["Integration aktualisieren – solche Fehler werden oft schnell behoben.", "Integration neu laden.", "Wenn es bleibt: Fehler mit dem Traceback beim Entwickler melden."],
    dg_net_c: "Ein Gerät oder Online-Dienst war nicht erreichbar (Zeitüberschreitung oder Verbindungsfehler).",
    dg_net_s: ["Prüfen, ob das Gerät eingeschaltet und im Netzwerk erreichbar ist bzw. ob der Dienst gerade Störungen hat.", "Netzwerk/Internet und DNS prüfen; bei festen IP-Adressen prüfen, ob sich die Adresse geändert hat.", "Tritt der Fehler nur gelegentlich auf, ist er meist harmlos – die Integration versucht es erneut."],
    dg_auth_c: "Anmeldung abgelehnt (401/403) – Zugangsdaten, Token oder Berechtigung stimmen nicht (mehr).",
    dg_auth_s: ["Integration öffnen und neu authentifizieren (Zugangsdaten bzw. Token erneuern).", "Prüfen, ob sich Passwort oder API-Schlüssel beim Anbieter geändert haben.", "Integration danach neu laden."],
    dg_fetch_c: "Daten konnten bei einer Aktualisierung nicht abgerufen werden – meist ein vorübergehendes Problem der Datenquelle.",
    dg_fetch_s: ["Abwarten – die Integration versucht es beim nächsten Intervall erneut.", "Tritt es dauerhaft auf: Erreichbarkeit der Quelle prüfen und Integration neu laden."],
    dg_tmpl_c: "Ein Template verweist auf etwas, das es nicht gibt, oder rechnet mit einem ungültigen Wert.",
    dg_tmpl_s: ["Das Template (z. B. in einer Automation, einem Template-Sensor oder einer Karte) unter Entwicklerwerkzeuge → Template testen.", "Für fehlende Werte Standardwerte nutzen, z. B. | float(0) oder | default(…).", "Verweise auf umbenannte oder gelöschte Entitäten korrigieren."],
    dg_custom_c: "Fehler in einer eigenen (HACS-)Integration.",
    dg_custom_s: ["Integration über HACS aktualisieren.", "Integration neu laden.", "Wenn es bleibt: Fehler beim Entwickler melden."],
    dg_generic_c: "Aus dem Fehlertext lässt sich keine eindeutige Ursache ableiten.",
    dg_generic_s: ["Vollständigen Eintrag unter Einstellungen → System → Protokolle ansehen.", "Integration neu laden; hilft das nicht, Home Assistant neu starten.", "Nach der Meldung in den Issues der Integration oder im Community-Forum suchen."],
    e_no_scope: "Bitte auswählen, was gelöscht werden soll.", e_invalid_name: "Ungültiger Dateiname.", e_not_ready: "HA Percyta ist nicht eingerichtet.",
  },
  en: {
    cat_automations: "Automations & scripts",
    obj_automation: "The automation", obj_script: "The script",
    iss_missing: "Does not exist", iss_disabled: "Disabled", iss_no_state: "No state (integration not loaded?)",
    iss_orphaned: "Orphaned", iss_unavailable: "Unavailable", iss_missing_device: "Device does not exist",
    iss_missing_area: "Area does not exist", iss_unknown_action: "Unknown action", iss_error: "Error",
    iss_failed_single: "Still running (mode single)", iss_failed_max_runs: "Max runs reached",
    part_trigger: "Trigger", part_condition: "Condition", part_action: "Action", part_blueprint: "Blueprint input", part_other: "Other",
    kind_entity: "Entity", kind_template: "Template", kind_device: "Device", kind_area: "Area", kind_action: "Action",
    fd_th_when: "Time", fd_th_issue: "Problem", fd_th_part: "Part", fd_th_kind: "Type", fd_th_now: "Now",
    fd_tab_history: "History", fd_hist_first: "First observed", fd_hist_resolved: "Resolved",
    fd_hist_added: "Added: {n}", fd_hist_removed: "Gone: {n}", fd_hist_sev: "Severity: {a} → {b}",
    fd_hist_total: "Affected objects: {a} → {b}", fd_hist_none: "No change since it was first observed.",
    fd_k_validation_status: "Validation status", fd_k_validation_error: "Error message", fd_k_last_error: "Last error",
    fd_k_last_step: "Failing step", fd_k_last_run: "Last run", fd_k_runs_stored: "Stored runs",
    fd_k_runs_failed: "Of which failed", fd_k_runs_skipped: "Of which skipped", fd_k_mode: "Mode", fd_k_active: "Active",
    fd_k_blocked_by_conditions: "Blocked by conditions", fd_k_last_blocked: "Last blocked",
    fd_k_issue_missing: "Does not exist", fd_k_issue_disabled: "Disabled", fd_k_issue_no_state: "No state",
    fd_k_issue_orphaned: "Orphaned", fd_k_issue_unavailable: "Unavailable", fd_k_issue_missing_device: "Device missing",
    fd_k_issue_missing_area: "Area missing", fd_k_issue_unknown_action: "Unknown action",
    r_resolved_badge: "✔ Resolved", r_resolved_at: "Resolved on", r_duration: "Existed for", r_title_prefix: "Resolved",
    r_was: "What was the problem?", r_now_ok: "The scan on {d} no longer found this finding – all affected objects have been fine since.",
    r_no_snapshot: "No details are stored for findings resolved before version 1.2.2.",
    r_open_t: "Show details", r_back: "← Back to overview", r_days: "{n} days", r_hours: "{n} h",
    r_now_missing: "still missing", r_now_ok_state: "ok",
    sec_hint_safe: "🔒 Values are masked on the server – plain text never ends up in the report, file, sensor or HTML export. Show/copy fetches the value on click (admins only, max. 10/min) and is logged; the display disappears automatically after 20 seconds.",
    sec_reveal_off: "Showing plain text is disabled in the options.",
    sec_copy: "📋 Copy", sec_copy_t: "Copy to clipboard (without showing it)", sec_copied: "✔ Copied",
    sec_rate: "Too many requests – please wait a moment", sec_audit: "🧾 Log: secret access",
    sec_audit_empty: "No access logged yet.", th_action: "Action", th_target: "Target", th_result: "Result",
    db_tools: "🛠️ Edit database", db_warn: "⚠️ Changes to the database are permanent. If the database is damaged, Home Assistant no longer starts properly – that's why a backup is created before every action by default.",
    db_t_replace: "🔁 Replace entity", db_t_replace_t: "New device takes over history and statistics of the old one",
    db_t_rename: "✏️ Rename", db_t_purge: "🗑️ Delete data", db_t_backup: "💾 Backups", db_t_log: "📜 Log",
    db_row_menu: "Actions", db_orphans: "🧟 Orphaned data (data without entity)", db_orphans_hint: "Entity IDs with history or statistics in the database that no longer exist in Home Assistant. Typical after replacing a device, renaming or deleting.",
    db_orphans_none: "No orphaned data found. 🎉", db_sel_delete: "🗑️ Delete selected", db_sel_n: "{n} selected",
    th_states: "States", th_stats: "Statistics",
    dlg_close: "Close", dlg_cancel: "Cancel", dlg_run: "Run",
    dlg_running: "Running … (incl. backup, this can take a few minutes)", dlg_done: "✔ Done",
    dlg_done_bg: "✔ Job accepted – the recorder processes it in the background.", dlg_error: "❌ Error: ",
    dlg_old: "Old entity (whose history is taken over)", dlg_new: "New entity (takes over the old ID)",
    dlg_from: "Current ID", dlg_to: "New ID",
    dlg_replace_title: "🔁 Replace entity – take over history & statistics",
    dlg_replace_intro: "For a device swap: the new entity gets the ID of the old one, so history and long-term statistics continue seamlessly (e.g. in the energy dashboard). Steps: backup → remove the old entity from the registry → rename the new entity to the old ID.",
    dlg_replace_note: "Note: the recorder writes a warning to the log (“Cannot migrate history … already in use”). That is expected – it is exactly why the new entity keeps writing into the existing history.",
    dlg_remove_old: "Remove the old entity from the entity registry (needed to free the ID)",
    dlg_purge_new: "Delete the new entity's previous (short) history", dlg_force: "Ignore warnings (e.g. different unit, old entity still active)",
    dlg_rename_title: "✏️ Rename entity / history",
    dlg_rename_intro: "Renames an entity together with its history and statistics. If the entity no longer exists (only data in the database), only history and statistics are renamed. The new ID must be free and must not have data yet – otherwise use “Replace entity”.",
    dlg_purge_title: "🗑️ Delete data from the database",
    dlg_purge_intro: "Select the entities and then decide separately what is deleted: history, short-term statistics and/or long-term statistics. The entities themselves remain; running entities start recording again.",
    dlg_scope_states: "History (states & events)",
    dlg_backup_title: "Backup before the change", dlg_bk_copy: "Copy the database file (fast, recommended)",
    dlg_bk_ha: "Create a Home Assistant backup", dlg_bk_skip: "No backup – I already have a recent one",
    dlg_bk_ext: "External database (MariaDB/PostgreSQL): a partial HA backup does not contain it. With Supervisor a full backup is created – otherwise please back up the database yourself.",
    dlg_confirm: "I understand that this change cannot be undone (except via the backup).",
    dlg_pv_states: "States", dlg_pv_stats: "Statistics (long / short)", dlg_pv_range: "Range",
    dlg_pv_entity: "Current", dlg_pv_none: "no data", dlg_pv_missing: "does not exist", dlg_pv_reg: "in registry",
    w_unit: "⚠️ The statistics unit ({a}) differs from the new entity ({b}) – Home Assistant will then report a statistics issue.",
    w_old_active: "⚠️ The old entity is still active ({s}). Is the old device really gone?",
    w_no_state_class: "⚠️ The new entity has no state_class – long-term statistics will not continue.",
    w_target_data: "⚠️ The new ID already has data – renaming would not merge it. Use “Replace entity”.",
    w_old_nodata: "⚠️ There is no data for the old ID in the database – nothing to take over.",
    w_same_domain: "⚠️ Both IDs must have the same domain (e.g. sensor.).",
    bk_title: "💾 Database backups", bk_intro: "Copies of the SQLite database are stored in /config/ha_percyta_db_backups (the last 2 are kept). To restore: stop Home Assistant, copy the file back to /config/home-assistant_v2.db, start Home Assistant.",
    bk_make_copy: "Copy database now", bk_make_ha: "Create HA backup now", bk_none: "No copy yet.",
    bk_delete: "Delete", bk_not_sqlite: "File copy only possible with SQLite (currently: {e}).", th_created: "Created",
    log_title: "📜 Log of database actions", log_empty: "No actions logged yet.",
    a_backup: "Backup", a_backup_delete: "Backup deleted", a_purge: "Data deleted", a_rename: "Renamed", a_replace: "Replaced",
    a_secret_show: "Secret shown", a_secret_copy: "Secret copied", ok: "ok", failed: "failed",
    e_recorder_unavailable: "The recorder is not available.", e_migration: "The database is being migrated – please try again later.",
    e_busy: "A database action is already running.", e_invalid_id: "Invalid ID.", e_same_id: "Old and new ID are identical.",
    e_domain_mismatch: "Both IDs must have the same domain.", e_target_in_use: "The new ID is already taken.",
    e_target_has_data: "The new ID already has data – use “Replace entity”.", e_no_data: "There is no data for the old ID.",
    e_new_not_registered: "The new entity is not in the entity registry (no unique ID) and cannot be renamed.",
    e_old_registered: "The old entity is still registered – please select “remove from the registry”.",
    e_old_active: "The old entity is still active. Remove the device or choose “ignore warnings”.",
    e_old_unmanaged: "The old entity has no unique ID (e.g. YAML) and cannot be removed automatically.",
    e_unit_mismatch: "The units differ. Run anyway with “ignore warnings”.",
    e_no_space: "Not enough free space for the database copy.", e_not_sqlite: "Not an SQLite database – please choose an HA backup.",
    e_backup_check_failed: "The copy failed the integrity check – nothing was changed.",
    e_backup_failed: "The backup failed – nothing was changed.", e_no_backup_service: "No backup service available.",
    e_registry_refused: "Home Assistant refused the rename.", e_action_failed: "Action failed.",
    pk_search: "Search or select …", pk_open: "Open list", pk_loading: "Loading list from the database …",
    pk_f_all: "All", pk_f_orphan: "🧟 Orphaned data", pk_f_restored: "👻 Orphaned", pk_f_stats: "📊 With statistics", pk_f_norec: "🚫 Not recorded",
    pk_all_domains: "All domains", pk_remove: "Remove from selection", pk_none_sel: "Nothing selected yet – search below and click.",
    pk_nothing: "No matches.", pk_count: "{n} matches (showing {m})", pk_add_all: "Select all matches ({n})", pk_add_lim: "Select first {n} of {m} matches",
    pk_b_external: "external statistic", pk_b_orphan: "no entity", pk_b_restored: "orphaned", pk_b_disabled: "disabled", pk_b_norec: "not recorded",
    pk_states: "states", pk_stats: "statistics", pk_ph_old: "Search old ID (e.g. orphaned data) …", pk_ph_new: "Search new entity …",
    dlg_ids_pick: "Select entities / statistics (multiple selection)", dlg_keep: "Scope", dlg_keep_all: "Delete everything",
    dlg_keep_n: "Only delete data older than {n} days",
    w_purge_live: "ℹ️ {n} of the selected entities are active – they keep recording after the deletion.",
    dlg_reg_title: "👻 Remove orphaned entities", dlg_reg_intro: "Removes entity registry entries that are no longer provided by any integration (e.g. after removing a device). Active entities are blocked. Optionally their history and statistics are deleted too.",
    dlg_reg_pick: "Select orphaned / unavailable entities", dlg_reg_purge: "Also delete the history and statistics of these entities from the database",
    dlg_reg_note: "The entity registry lives in .storage – it is part of the Home Assistant backup, not of the database copy.",
    db_t_cleanup: "🧹 Clean up", db_t_cleanup_t: "Delete old data of the whole database and optionally shrink it",
    db_t_registry: "👻 Orphaned entities", db_t_registry_t: "Remove registry entries without an integration",
    cl_title: "🧹 Clean up & shrink the database", cl_intro: "Deletes all states, events and short-term statistics older than the chosen period in the whole database (like the nightly recorder run, but now). Long-term statistics are kept.",
    cl_days: "Keep", cl_repack: "Shrink the database afterwards (repack/VACUUM) – frees disk space, takes longer and temporarily needs free space the size of the database",
    cl_note: "Note: if the recorder is set to a shorter retention it deletes earlier anyway. Home Assistant may react slowly while shrinking.",
    tk_title: "🔑 Revoke access token", tk_intro: "Token “{c}” of {u} becomes invalid immediately. Apps, scripts or services using it lose access.",
    tk_warn: "⚠️ This cannot be undone – a new token has to be created if needed. The token of your current session cannot be revoked here.",
    tk_confirm: "I want to revoke this token permanently.", tk_revoke: "🚫 Revoke",
    au_turn_on: "▶ Turn on", au_turn_off: "⏸ Turn off", au_trigger: "▶ Test now", hs_purge_old: "🗑️ Delete old history",
    a_cleanup: "Database cleaned up", a_registry_remove: "Entities removed", a_token_revoke: "Token revoked",
    e_not_supported: "This Home Assistant version does not support partially deleting statistics – choose “Delete everything” or only the history.",
    e_invalid_days: "Invalid number of days.", e_still_active: "These entities are still active and are not removed", e_own_token: "The token of the current session cannot be revoked.", e_not_found: "Not found.",
    dlg_scope_title: "What should be deleted?",
    dlg_scope_states_h: "State history you see in history and logbook.",
    dlg_scope_short: "Short-term statistics (5-minute values)", dlg_scope_short_h: "Fine-grained values of the last days; the recorder purges them regularly anyway.",
    dlg_scope_long: "Long-term statistics (hourly values, kept forever)", dlg_scope_long_h: "Basis for the energy dashboard, statistics cards and yearly comparisons – usually keep them!",
    w_long: "⚠️ Long-term statistics will be deleted. These entities will then have gaps in the energy dashboard and long-term charts.",
    db_calm: "💡 Don't worry: every button only opens a window first. There you select at your own pace, see a preview and only decide at the end with “Run” whether and how data is deleted. You can cancel at any time.",
    tk_box_t: "What does “Revoke” mean?", tk_box_1: "The token becomes invalid immediately and permanently.",
    tk_box_2: "Apps, scripts or services using it (e.g. Grafana, Node-RED, iOS Shortcuts) lose access immediately and need a new token.",
    tk_box_3: "A confirmation window opens first. Your own current login is protected.",
    tk_what: "What happens when revoking?", tk_w1: "The token is deleted immediately and is invalid afterwards.",
    tk_w2: "Anything accessing Home Assistant with this token is rejected from now on.",
    tk_w3: "The user and other tokens stay unchanged.", tk_w4: "If the access is still needed: create a new long-lived token in the user profile (Security) and enter it there.",
    sec_care: "🧽 Care center", rk_title: "Risk & privacy",
    cc_intro: "Everything at a glance that can be cleaned up or improved in your Home Assistant. Every button first opens a window with explanation and preview – nothing changes until you confirm.",
    cc_clean: "✓ All clean", cc_btn_clean: "Clean up …", cc_btn_remove: "Remove …", cc_btn_review: "Review …", cc_btn_reload: "Reload …",
    cc_btn_show: "Show", cc_btn_backup: "Back up …", cc_btn_open: "Open ↗", cc_days: "{n} days",
    cc_dbo: "Orphaned database data", cc_dbo_d: "{r} rows of entities that no longer exist.",
    cc_rest: "Orphaned entities", cc_rest_d: "Still registered, but no longer provided by any integration.",
    cc_dev: "Orphaned devices", cc_dev_d: "Devices of an integration that was deleted.",
    cc_unav: "Unavailable entities", cc_unav_d: "Permanently dead entities can be disabled or – like “Delete” in HA – removed completely. This tidies up lists, devices and dashboards.",
    cc_int: "Integrations with errors", cc_int_d: "Not running – a reload often helps.",
    cc_auto: "Automations with problems", cc_auto_d: "Invalid, failing or with broken references.",
    cc_off: "Automations turned off", cc_off_d: "Never run – forgotten or intended?",
    cc_tok: "Unused access tokens", cc_tok_d: "Forgotten access – best revoke them.",
    cc_db: "Database", cc_db_d: "Delete old data and shrink the file.",
    cc_bk: "Last HA backup",
    cc_upd: "Available updates", cc_upd_d: "Pending updates for Home Assistant, apps and devices.",
    ed_title: "📡 Unavailable entities", ed_what: "What happens when disabling?",
    ed_mode: "What should happen?", ed_mode_disable: "Disable", ed_mode_disable_h: "Reversible – the entity and its history are kept, it is only hidden.",
    ed_mode_remove: "Remove from Home Assistant", ed_mode_remove_h: "Like “Delete” in the entity settings of HA – it also disappears from its device.",
    rm_what: "What happens when removing?",
    rm_w1: "The entity is deleted from the entity registry – exactly like “Delete” in the entity settings of Home Assistant. It also disappears from its device.",
    rm_w2: "If the integration still provides the entity (e.g. the device is only offline for now), it creates it again with the next reload or restart – then disabling is the better choice.",
    rm_w3: "Optionally its history and statistics are deleted too. The entity registry is part of the Home Assistant backup – so that is pre-selected as backup.",
    rm_confirm: "Remove the selected entities from Home Assistant.", rm_run: "🗑️ Remove", rm_btn: "🗑️ Remove from HA …", rm_notfound: "{n} without registry entry ({ids}) – these usually come from YAML and can only be removed there.",
    ed_w1: "The entity disappears from dashboards, pickers and history; nothing is recorded any more.",
    ed_w2: "It is NOT deleted – the existing history is kept.",
    ed_w3: "Undo at any time: Settings › Entities › filter “Disabled” › open the entity › switch on “Enabled”.",
    ed_pick: "Select unavailable entities", ed_confirm: "Disable the selected entities.", ed_run: "⏸ Disable",
    dv_title: "📵 Remove orphaned devices", dv_what: "What happens when removing?",
    dv_w1: "The devices are deleted from the device registry – together with their entities.",
    dv_w2: "Only devices whose integration no longer exists can be removed; everything else is blocked.",
    dv_w3: "If you set the integration up again later, it recreates its devices by itself.",
    dv_pick: "Select devices", dv_ents: "{n} entity(ies)", dv_run: "🗑️ Remove devices",
    rl_title: "🔌 Reload integrations", rl_what: "What happens when reloading?",
    rl_w1: "The integration is stopped and started again – like “Reload” in Home Assistant. Settings are kept.",
    rl_w2: "Helps with temporary connection problems. If it does not work, open the integration and read the error message.",
    rl_w3: "Clicking the name or “Open” takes you straight to the integration in Home Assistant – it shows the exact error and lets you reconfigure or delete it.",
    clp_title: "Preview: everything before {d} is deleted", clp_states: "History (states)", clp_events: "Events (logbook)",
    clp_short: "Short-term statistics (5-minute values)", clp_long: "Long-term statistics (hourly values)", clp_kept: "kept",
    clp_sum: "{n} rows will be deleted in total", clp_nothing: "Nothing is deleted with this setting.", clp_est: "frees about {s} in the database",
    clp_oldest: "Oldest history entry: {d}", clp_top: "Most affected (history):", clp_rows: "{n} rows",
    clp_note: "The space value is a rough estimate (database size ÷ number of rows). The file only gets smaller with “Shrink afterwards” (or the automatic monthly repack).",
    copy_id: "Copy ID", open_entity: "Open the entity in Home Assistant (right-click: history in a new tab)",
    rl_btn: "🔄 Reload", rl_open: "Open ↗", rl_open_t: "Open the integration in Home Assistant",
    refreshing: "⟳ Updating data …", dlg_pv_size: "Space (approx.)",
    pv_est_sum: "Frees about {s} in the database in total (rough estimate: database size ÷ number of rows). The file itself only gets smaller once it is shrunk – tool “Clean up” with “Shrink” or the recorder's automatic repack on the second Sunday of the month (default, “auto_repack”). Until then the recorder reuses the space for new data.",
    pv_est_sum_max: "Frees at most about {s} in total – with “only older than …” only part is deleted (rough estimate). The file itself only gets smaller once it is shrunk (tool “Clean up” with “Shrink”).",
    a_entity_disable: "Entities disabled", a_entry_reload: "Integration reloaded", a_device_remove: "Devices removed",
    e_device_in_use: "These devices belong to an integration that is set up and are not removed", e_reload_failed: "Reload failed.",
    cc_rep: "Open repairs", cc_rep_d: "Notices from Home Assistant itself (Settings › Repairs).",
    cc_err: "Important log errors", cc_err_d: "Errors and critical messages from the system log.",
    cc_cfg: "Check configuration", cc_cfg_d: "Test the YAML configuration – like before a restart. Changes nothing.", cc_btn_check: "Check …",
    cfg_title: "🧪 Check configuration", cfg_what: "What happens?", cfg_w1: "Home Assistant checks configuration.yaml and all included files – exactly like “Check configuration” before a restart.",
    cfg_w2: "Nothing is changed and nothing is restarted.", cfg_running: "Checking configuration …",
    cfg_ok: "✔ Configuration is valid – a restart would be safe.", cfg_bad: "❌ The configuration has errors – fix them before restarting:",
    pv_r_states: "History", pv_r_long: "Long-term statistics", pv_r_short: "Short-term statistics",
    jv_title: "Running action", jv_details: "Details (log)", jv_done: "Done", jv_failed: "Failed",
    jv_elapsed: "running for {t}", jv_eta: "approx. {t} left", jv_close_bg: "Close – keeps running",
    jv_hint: "You can close this window – the action keeps running in Home Assistant. You see its progress in the top bar (⏳) and can reopen it there at any time.",
    jp_start: "Starting …", jp_count: "Counting affected rows", jp_bk_copy: "Backup: copying the database", jp_bk_check: "Backup: verifying the copy",
    jp_ha_backup: "Creating Home Assistant backup", jp_purge: "Recorder is deleting data", jp_apply: "Applying changes", jp_cleanup: "Cleaning up the database",
    ja_db_purge: "Delete data", ja_db_replace: "Replace entity", ja_db_rename: "Rename", ja_db_cleanup: "Clean up database", ja_db_backup: "Backup",
    ja_registry_remove: "Remove orphaned entities", ja_device_remove: "Remove devices", ja_: "Action",
    js_states: "history", js_statistics_short: "short-term statistics", js_statistics_long: "long-term statistics",
    jl_start: "▶ Started: {action}", jl_count: "🔢 Counting affected rows for {n} ID(s) …", jl_count_done: "🔢 To delete: {rows} rows",
    jl_bk_copy: "💾 Backup: copying the database ({size}) …", jl_bk_check: "🔍 Verifying the copy (PRAGMA quick_check) – takes a few minutes for large databases …",
    jl_bk_done: "✔ Backup done: {name} ({size})", jl_bk_ha: "💾 Creating Home Assistant backup …", jl_bk_ha_done: "✔ HA backup created {name}",
    jl_purge_start: "🗑️ Recorder deletes {rows} rows ({scopes}) – in batches …", jl_purge_left: "   … {left} rows left ({done} deleted)",
    jl_purge_stalled: "⚠️ No change for a minute – {left} rows left. The recorder continues later.",
    jl_purge_timeout: "⚠️ Watching stopped after 60 minutes – the recorder continues in the background.",
    jl_rn_registry: "✏️ Renaming {old} → {new} (history moves along)", jl_rn_history: "✏️ Renaming history/statistics {old} → {new}",
    jl_rp_remove_old: "🧹 Removing the old entity {old} from the registry", jl_rp_rename: "🔁 {new} takes over the ID {old}", jl_rp_purge_new: "🗑️ Deleting the short own history of {new}",
    jl_cl_purge: "🧹 Recorder deletes everything older than {days} days …", jl_cl_repack: "📦 Afterwards the database is shrunk (VACUUM) …",
    jl_rg_remove: "👻 Removing {n} entity(ies) from the registry", jl_rg_purge: "🗑️ Deleting their history and statistics", jl_dv_remove: "📵 Removing {n} device(s)",
    jl_done: "✅ Done", jl_done_bg: "✅ Done – the recorder is still tidying up in the background", jl_failed: "❌ Failed: {code}",
    cc_open: "Open care center", cc_todo: "{n} items to clean up", cc_all_ok: "✓ All good",
    cc_l_findings: "Findings", cc_l_db: "Database (Recorder)", cc_h_todo: "🧽 Clean up & check", cc_h_system: "🩺 System & upkeep",
    cc_h_tools: "🛠️ Tools", cc_h_log: "📜 Recent actions",
    ct_replace: "Replaced a device? The new entity takes over history & statistics.", ct_rename: "Rename an entity incl. history to a new ID.",
    ct_purge: "Delete history, short- or long-term statistics selectively.", ct_cleanup: "Delete everything older than N days, shrink the file.",
    ct_registry: "Remove registry entries without an integration.", ct_backup: "Copy the database or create an HA backup.",
    ct_db: "Largest consumers, orphaned data, statistics.", ct_findings: "All findings with diagnosis and instructions.",
    cc_ring_n: "Maintenance need {n} % – lower is better. “Why?” shows how the value is calculated.", cc_ring_lbl: "need",
    sc_lvl_ok: "No maintenance needed", sc_lvl_low: "Low maintenance need", sc_lvl_mid: "Medium maintenance need", sc_lvl_high: "High maintenance need",
    sc_unav: "Unavailable entities", sc_int: "Integrations with errors", sc_auto: "Automations/scripts with problems",
    sc_orph: "Orphaned entities + devices", sc_disk: "Disk usage", sc_dbo: "Orphaned data in the database", sc_bk: "Age of the last backup",
    sc_tok: "Stale tokens", sc_rep: "Open repairs", sc_err: "Errors in the log", sc_upd: "Pending updates", sc_none: "none",
    sc_intro: "The maintenance need shows how much there is to do in your system – 0 % means everything is fine. Each area is rated relative to the size of your installation (e.g. unavailable entities relative to all entities) and has a fixed maximum weight. All areas together add up to at most 100 points.",
    sc_h_area: "Area", sc_h_val: "Current", sc_h_pts: "Points", sc_full: "Full weight from {f}",
    sc_total: "Total: {n} of 100 points = maintenance need in percent.",
    sc_scale: "Colours: up to 10 % green · up to 35 % yellow · up to 60 % orange · above red. Disk only counts above 80 % usage, the backup only after 7 days. The weighting is a rule of thumb, not an official Home Assistant value.",
    cc_fnd: "Findings (reports)", cc_fnd_d: "All open findings from the scan – security, automations, database and more.",
    k_secfind: "Security findings",
    cc_bk_ago: "Created {a}. Create a fresh backup before bigger clean-ups.", cc_bk_none: "No backup found – create one before cleaning up.",
    pk_clear_all: "✕ Deselect all ({n})", pk_sel_n: "{n} selected", pk_view_list: "☰ List", pk_view_chips: "▦ Tiles",
    pk_sel_search: "Search selection …",
    pv_loading: "⏳ Loading preview …", pv_slow: "With large databases this can take a few seconds.",
    pv_empty: "Please select at least one entity first – click it in the list or type the ID and press Enter.",
    pv_busy: "Another job is running – the preview may take a little longer.",
    jl_bk_replaced: "♻️ Deleted {n} existing Percyta copy/copies to free space",
    dlg_bk_replace: "Replace the existing Percyta copy (the old copy is deleted first – saves space)",
    bk_space: "Database {db} · needed {need} · free {free}",
    bk_space_low: "⚠️ Not enough free space for an additional copy – recommended: “Replace the existing Percyta copy” (pre-selected).",
    bk_space_none: "⚠️ There is not enough free space for a copy of the database. Please free up space (e.g. delete old backups under Settings → System → Backups) or create an HA backup to an external location.",
    ns_title: "💾 Not enough space for the backup",
    ns_text: "The database copy needs {need}, but only {free} is free. Nothing was deleted or changed.",
    ns_hint: "Tip: Percyta backup copies are stored in /config/ha_percyta_db_backups. Deleting them here frees up space. With “Replace the existing copy” the old copy is automatically replaced by a current one.",
    ns_copies: "Existing Percyta copies ({n}, {s} in total):", ns_no_copies: "There are no Percyta copies that could be deleted.",
    ns_replace: "♻️ Replace existing copy", ns_ha: "💾 Use HA backup", ns_chosen: "Selection applied – now click “Run” again.",
    ns_ok_t: "✅ Enough free space now", ns_ok: "Free: {free}. You can run the action again now.",
    ns_text2: "{need} is needed, {free} is free now – that's not enough yet.", bk_replace_btn: "♻️ Replace copy",
    grp_security: "Security & privacy", grp_system: "System & details",
    sm_integrations: "{n} installed · {c} custom", sm_installed: "{n} installed", sm_sysaccess: "{n} with system access",
    sm_none: "none", sm_secrets: "in {n} integrations", sm_users: "{a} admin · {u} users", sm_tokens: "{l} long-lived · {s} unused",
    sm_system: "RAM {r} · CPU {c}", sm_inventory: "{a} automations · {u} unavailable", sm_updates: "{n} updates", sm_update1: "1 update",
    sm_findings: "{h} high · {m} medium · {l} low", sm_database: "{r} rows · {o} orphaned", sm_db_pending: "being analysed …",
    sm_errors: "latest {a}",
    fh_title: "ℹ️ What do Open, Allowed, Snoozed and Hidden mean?",
    fh_open: "Newly found or still existing findings. They count as “open findings” and appear in the care center.",
    fh_known: "You checked the finding and consciously accept it (e.g. an intended cloud integration). It no longer counts as open but is still checked with every scan.",
    fh_snoozed: "Put aside for 7, 30 or 90 days. Afterwards the finding automatically becomes “Open” again if the problem still exists.",
    fh_hidden: "Hidden permanently – e.g. because it does not apply to you. It stays hidden until you reopen it under “Hidden”.",
    fh_note: "The status is only stored in HA Percyta – nothing is changed, deleted or switched off in Home Assistant. When a problem is actually fixed, the finding disappears from every status with the next scan and is listed under “Recently resolved”. “Reopen” brings a finding back at any time.",
    cc_pbk: "Last Percyta backup", cc_pbk_d: "Created {a} · {n} copy/copies, {s} in total in /config/ha_percyta_db_backups.",
    cc_pbk_none: "No copy yet – “Back up …” creates a quick copy of the database file.",
    er_kind: "Category", dg_dep_k: "📦 Dependency", dg_auth_k: "🔐 Login", dg_net_k: "📡 Reachability", dg_tmpl_k: "🧩 Template",
    dg_entity_k: "🏷️ Entity", dg_code_k: "🐞 Code error", dg_setup_k: "⚙️ Setup", dg_fetch_k: "🔄 Data fetch", dg_custom_k: "🧩 Custom integration", dg_generic_k: "❔ Unclear",
    er_title: "❗ Error details", er_click: "Click an error for details, possible cause and suggested fixes.",
    er_msg: "Message", er_src: "Source", er_logger: "Logger", er_count: "Count", er_last: "Last", er_first: "First", er_int: "Affected integration",
    er_trace: "Technical details (traceback)", er_cause: "🔎 Possible cause", er_steps: "🛠️ What you can do",
    er_open_int: "Open integration ↗", er_reload: "🔄 Reload integration", er_logs: "Open logs ↗", er_copy: "📋 Copy message", er_copied: "✔ Copied",
    er_note: "The diagnosis is an automatic assessment based on the error text and may be wrong. If in doubt, see the full entry under Settings → System → Logs.",
    er_custom: "Custom integration (HACS)", er_core: "Home Assistant integration", er_unknown: "not detectable",
    dg_dep_c: "A required Python package could not be installed or conflicts with another package (version conflict).",
    dg_dep_s: ["Update the integration (e.g. via HACS) to the latest version.", "Check whether another integration requires the same package in a different version.", "If it persists: report it to the integration's developer (issue with the message)."],
    dg_entity_c: "An entity could not be created – often because an entity with the same unique ID already exists or the integration delivers invalid data.",
    dg_entity_s: ["Reload the integration.", "Look for duplicate or orphaned entries of this integration under Settings → Entities and remove them.", "Update the integration; if that doesn't help, report the error to the developer."],
    dg_setup_c: "The integration (or part of it) could not start. Often it is not compatible with the installed Home Assistant version.",
    dg_setup_s: ["Update the integration to the latest version.", "Reload the integration or restart Home Assistant.", "Check the integration's changelog/issues for known problems with your HA version."],
    dg_code_c: "A programming error in the integration (e.g. AttributeError, TypeError, KeyError). This is almost always caused by the integration itself, not by your configuration.",
    dg_code_s: ["Update the integration – such errors are often fixed quickly.", "Reload the integration.", "If it persists: report the error with the traceback to the developer."],
    dg_net_c: "A device or online service could not be reached (timeout or connection error).",
    dg_net_s: ["Check that the device is powered on and reachable on the network, or whether the service currently has an outage.", "Check network/internet and DNS; with fixed IP addresses check whether the address has changed.", "If the error only occurs occasionally it is usually harmless – the integration retries."],
    dg_auth_c: "Login rejected (401/403) – credentials, token or permission are not (or no longer) valid.",
    dg_auth_s: ["Open the integration and re-authenticate (renew credentials or token).", "Check whether the password or API key was changed at the provider.", "Reload the integration afterwards."],
    dg_fetch_c: "Data could not be fetched during an update – usually a temporary problem of the data source.",
    dg_fetch_s: ["Wait – the integration retries at the next interval.", "If it persists: check that the source is reachable and reload the integration."],
    dg_tmpl_c: "A template refers to something that doesn't exist or calculates with an invalid value.",
    dg_tmpl_s: ["Test the template (e.g. in an automation, a template sensor or a card) under Developer tools → Template.", "Use defaults for missing values, e.g. | float(0) or | default(…).", "Fix references to renamed or deleted entities."],
    dg_custom_c: "Error in a custom (HACS) integration.",
    dg_custom_s: ["Update the integration via HACS.", "Reload the integration.", "If it persists: report the error to the developer."],
    dg_generic_c: "No clear cause can be derived from the error text.",
    dg_generic_s: ["View the full entry under Settings → System → Logs.", "Reload the integration; if that doesn't help, restart Home Assistant.", "Search for the message in the integration's issues or the community forum."],
    e_no_scope: "Please choose what to delete.", e_invalid_name: "Invalid file name.", e_not_ready: "HA Percyta is not set up.",
  },
};
Object.assign(STR.de, XSTR.de);
Object.assign(STR.en, XSTR.en);

const XDOC = {
  de: {
    automation_invalid: {
      title: "Konfiguration ungültig",
      what: "{Obj} „{subject}“ läuft nicht: Home Assistant hat die Konfiguration beim Laden abgelehnt. Meldung: {verror}",
      cause: "Ein Pflichtfeld fehlt, ein Auslöser, eine Bedingung oder eine Aktion ist falsch geschrieben, eine benötigte Integration fehlt – oder das zugrunde liegende Blueprint wurde gelöscht bzw. geändert.",
      impact: "Sie ist „nicht verfügbar“ und wird nie ausgeführt – auch nicht von Hand.",
      steps: [
        "Öffne sie im Editor – oben steht die genaue Fehlermeldung (auch unter Einstellungen › Reparaturen).",
        "Korrigiere den genannten Teil oder stelle das fehlende Blueprint bzw. die fehlende Integration wieder her.",
        "Speichern und neu scannen: Der Befund erscheint dann unter „Zuletzt behoben“.",
      ],
    },
    automation_errors: {
      title: "Fehler beim Ausführen",
      what: "{Obj} „{subject}“ ist beim letzten Lauf mit einem Fehler abgebrochen ({errors} von {runs} gespeicherten Läufen fehlerhaft). Letzte Meldung: {error}",
      cause: "Eine Aktion ist fehlgeschlagen – z. B. war ein Gerät nicht erreichbar, eine Entität fehlt, eine Aktion bekam einen ungültigen Wert oder ein Template wirft einen Fehler.",
      impact: "Alle Schritte nach dem fehlerhaften werden nicht mehr ausgeführt (außer bei continue_on_error).",
      steps: [
        "Öffne die Ablaufverfolgung (Trace) – der fehlerhafte Schritt ist dort rot markiert.",
        "Unter „Betroffene Objekte“ steht je Lauf die Meldung und der Schritt (Spalte ID, z. B. action/2).",
        "Behebe die Ursache; bei unzuverlässigen Geräten hilft „continue_on_error: true“ am Schritt.",
        "Teste die Automation (⋮ › Ausführen) und scanne danach neu.",
      ],
    },
    automation_skipped: {
      title: "Ausführung übersprungen",
      what: "{Obj} „{subject}“ wurde {count}× ausgelöst, während sie noch lief – diese Läufe wurden verworfen (Modus: {mode}).",
      cause: "Im Modus „single“ (Standard) wird ein neuer Auslöser ignoriert, solange noch ein Lauf aktiv ist – z. B. wegen einer Verzögerung (delay) oder eines wait_for_trigger. Bei „queued“/„parallel“ wurde die Höchstzahl (max) erreicht.",
      impact: "Auslöser gehen verloren; scheinbar reagiert sie „manchmal nicht“.",
      steps: [
        "Prüfe, ob lange Wartezeiten (delay, wait) nötig sind.",
        "Stelle den Modus passend ein: „restart“ (neu starten), „queued“ (nacheinander) oder „parallel“.",
        "Ist das Verhalten gewollt, markiere den Befund als „Erlaubt“.",
      ],
    },
    automation_refs: {
      title: "Problematische Verweise",
      what: "{Obj} „{subject}“ verweist auf {count} Objekt(e), die fehlen oder nicht funktionieren: {issues}.",
      cause: "Entitäten wurden gelöscht, umbenannt oder deaktiviert, Geräte entfernt, Integrationen deinstalliert (deren Aktionen gibt es dann nicht mehr) oder Geräte sind offline.",
      impact: "Auslöser feuern nicht, Bedingungen sind nie erfüllt, Aktionen schlagen fehl – sie läuft ins Leere oder nur teilweise.",
      steps: [
        "Öffne „Betroffene Objekte“: „Problem“ nennt den Grund, „Teil“ zeigt, ob Auslöser, Bedingung oder Aktion betroffen ist, „Fundstelle“ den genauen Pfad.",
        "Fehlende Entitäten: neue ID eintragen – „Öffnen“ führt zum passenden Befund „Defekte Referenz“.",
        "Deaktivierte Entitäten/Geräte wieder aktivieren oder den Verweis entfernen; unbekannte Aktionen: Integration (wieder) installieren oder die Aktion ersetzen.",
        "Nicht verfügbare Entitäten: Gerät prüfen (Strom, Funk, Batterie).",
      ],
    },
    automations_off: {
      title: "Ausgeschaltete Automationen",
      what: "{count} Automation(en) sind ausgeschaltet und laufen deshalb nie.",
      cause: "Sie wurden von Hand, per Skript/Automation oder über initial_state: off ausgeschaltet.",
      impact: "Kein Fehler – aber vergessene, ausgeschaltete Automationen sind ein häufiger Grund für „das lief doch früher“.",
      steps: [
        "Prüfe die Liste unter „Betroffene Objekte“: Seit wann ist welche Automation aus?",
        "Benötigte wieder einschalten, nicht mehr benötigte löschen.",
        "Ist alles so gewollt, markiere den Befund als „Erlaubt“.",
      ],
    },
    db_orphans: {
      title: "Datenleichen in der Datenbank",
      what: "{count} Entität(en), die es nicht mehr gibt, belegen noch {rows} Zeilen (Verlauf/Statistik) in der Datenbank.",
      cause: "Beim Löschen oder Umbenennen einer Entität bleibt ihre Langzeitstatistik dauerhaft erhalten; der Verlauf bleibt bis zum Ende der Aufbewahrungszeit.",
      impact: "Belegt Speicher, vergrößert Backups; alte Statistiken tauchen z. B. im Energie-Dashboard oder in Statistik-Karten auf.",
      steps: [
        "Öffne in der Box „Datenbank (Recorder)“ den Bereich „Datenleichen“ (Button oben rechts).",
        "Gehört eine Datenleiche zu einem ersetzten Gerät? Dann „Entität ersetzen“ – die neue Entität übernimmt Verlauf und Statistik.",
        "Sonst auswählen und löschen – vorher wird eine Sicherung erstellt.",
      ],
    },
  },
  en: {
    automation_invalid: {
      title: "Invalid configuration",
      what: "{Obj} “{subject}” does not run: Home Assistant rejected its configuration while loading. Message: {verror}",
      cause: "A required field is missing, a trigger, condition or action is misspelled, a required integration is missing – or the underlying blueprint was deleted or changed.",
      impact: "It is “unavailable” and never runs – not even manually.",
      steps: [
        "Open it in the editor – the exact error message is shown at the top (also under Settings › Repairs).",
        "Fix the mentioned part or restore the missing blueprint or integration.",
        "Save and rescan: the finding then shows up under “Recently resolved”.",
      ],
    },
    automation_errors: {
      title: "Error while running",
      what: "{Obj} “{subject}” stopped with an error on its last run ({errors} of {runs} stored runs failed). Last message: {error}",
      cause: "An action failed – e.g. a device was unreachable, an entity is missing, an action got an invalid value or a template raises an error.",
      impact: "All steps after the failing one are not executed (unless continue_on_error is set).",
      steps: [
        "Open the trace – the failing step is highlighted in red.",
        "“Affected objects” lists the message and step per run (column ID, e.g. action/2).",
        "Fix the cause; for unreliable devices “continue_on_error: true” on the step helps.",
        "Test it (⋮ › Run) and rescan afterwards.",
      ],
    },
    automation_skipped: {
      title: "Runs skipped",
      what: "{Obj} “{subject}” was triggered {count}× while it was still running – these runs were dropped (mode: {mode}).",
      cause: "In mode “single” (default) a new trigger is ignored while a run is still active – e.g. because of a delay or wait_for_trigger. With “queued”/“parallel” the maximum (max) was reached.",
      impact: "Triggers get lost; it seems to “sometimes not react”.",
      steps: [
        "Check whether long waits (delay, wait) are necessary.",
        "Choose a suitable mode: “restart”, “queued” (one after another) or “parallel”.",
        "If the behaviour is intended, mark the finding as “Allowed”.",
      ],
    },
    automation_refs: {
      title: "Problematic references",
      what: "{Obj} “{subject}” refers to {count} object(s) that are missing or not working: {issues}.",
      cause: "Entities were deleted, renamed or disabled, devices removed, integrations uninstalled (their actions no longer exist) or devices are offline.",
      impact: "Triggers do not fire, conditions are never met, actions fail – it runs into nothing or only partially.",
      steps: [
        "Open “Affected objects”: “Problem” names the reason, “Part” shows whether a trigger, condition or action is affected, “Location” the exact path.",
        "Missing entities: enter the new ID – “Open” leads to the matching “Broken reference” finding.",
        "Re-enable disabled entities/devices or remove the reference; unknown actions: (re)install the integration or replace the action.",
        "Unavailable entities: check the device (power, radio, battery).",
      ],
    },
    automations_off: {
      title: "Automations turned off",
      what: "{count} automation(s) are turned off and therefore never run.",
      cause: "They were turned off manually, by a script/automation or via initial_state: off.",
      impact: "Not an error – but forgotten, disabled automations are a common reason for “this used to work”.",
      steps: [
        "Check the list under “Affected objects”: which automation has been off since when?",
        "Turn the needed ones back on, delete the ones no longer needed.",
        "If everything is intended, mark the finding as “Allowed”.",
      ],
    },
    db_orphans: {
      title: "Orphaned data in the database",
      what: "{count} entity(ies) that no longer exist still occupy {rows} rows (history/statistics) in the database.",
      cause: "When an entity is deleted or renamed, its long-term statistics are kept forever; history stays until the retention period ends.",
      impact: "Uses space, makes backups larger; old statistics show up e.g. in the energy dashboard or statistics cards.",
      steps: [
        "In the “Database (Recorder)” section open “Orphaned data” (button at the top right).",
        "Does an orphan belong to a replaced device? Use “Replace entity” – the new entity takes over history and statistics.",
        "Otherwise select and delete them – a backup is created first.",
      ],
    },
  },
};
Object.assign(FDOC.de, XDOC.de);
Object.assign(FDOC.en, XDOC.en);
FDOC.de.unused_automation.blocked = "Laut den letzten Ablaufverfolgungen wurde sie {cond_blocked}× ausgelöst, aber ihre Bedingungen waren nicht erfüllt.";
FDOC.en.unused_automation.blocked = "According to the latest traces it was triggered {cond_blocked}× but its conditions were not met.";
FDOC.de.unused_script.blocked = FDOC.de.unused_automation.blocked;
FDOC.en.unused_script.blocked = FDOC.en.unused_automation.blocked;
Object.assign(TYPE_ICON, {
  automation_invalid: "⛔", automation_errors: "💥", automation_skipped: "⏭️", automation_refs: "🧷",
  automations_off: "⏸️", db_orphans: "🧟", orphaned_devices: "📵",
});
FDOC.de.orphaned_devices = {
  title: "Verwaiste Geräte",
  what: "{count} Gerät(e) gehören zu einer Integration, die es nicht mehr gibt.",
  cause: "Die Integration wurde gelöscht, aber ihre Geräteeinträge sind in der Geräte-Registry übrig geblieben.",
  impact: "Sie tauchen in Gerätelisten, Bereichen und Auswahlfeldern auf, liefern aber nichts mehr.",
  steps: [
    "Prüfe unter „Betroffene Objekte“, ob ein Gerät noch gebraucht wird (z. B. weil du die Integration neu einrichten willst).",
    "Nicht mehr benötigte Geräte mit „Geräte entfernen“ löschen – ihre Entitäten werden dabei mit entfernt.",
  ],
};
FDOC.en.orphaned_devices = {
  title: "Orphaned devices",
  what: "{count} device(s) belong to an integration that no longer exists.",
  cause: "The integration was deleted, but its device entries were left behind in the device registry.",
  impact: "They show up in device lists, areas and pickers but no longer deliver anything.",
  steps: [
    "Check under “Affected objects” whether a device is still needed (e.g. because you want to set the integration up again).",
    "Remove devices you no longer need with “Remove devices” – their entities are removed as well.",
  ],
};
const REVEAL_SECONDS = 20;
// Aktionen, die als Hintergrund-Auftrag mit Fortschritt laufen (Fenster darf geschlossen werden).
const JOB_TYPES = new Set(["ha_percyta/db_purge", "ha_percyta/db_replace", "ha_percyta/db_rename", "ha_percyta/db_cleanup",
  "ha_percyta/registry_remove", "ha_percyta/device_remove", "ha_percyta/db_backup"]); // so lange bleibt ein aufgedecktes Secret sichtbar

class HaPercytaPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._data = null;
    this._error = null;
    this._search = "";
    this._mode = "single";
    this._width = "full";
    this._suppressAccordion = false;
    this._autoScanPending = false;
    this._scrollHandler = (e) => this._evaluateTopButton(e);
    try {
      const m = window.localStorage.getItem(LS_MODE);
      if (m === "single" || m === "accordion") this._mode = m;
      const w = window.localStorage.getItem(LS_WIDTH);
      if (w === "full" || w === "narrow") this._width = w;
    } catch (e) {}
    // Zuletzt eingestellte Ansicht (bleibt auch erhalten, wenn man das Panel verlässt).
    this._storedView = this._readStoredView();
    this._sortMem = (this._storedView && this._storedView.sort) || {};
  }

  _readStoredView() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(LS_VIEW) || "null");
      if (!raw || typeof raw !== "object" || typeof raw.open !== "object" || !raw.open) return null;
      return { open: raw.open, why: !!raw.why, sort: raw.sort && typeof raw.sort === "object" ? raw.sort : {}, scroll: [] };
    } catch (e) {
      return null;
    }
  }

  // Ansicht speichern (kurz verzögert, damit mehrere Änderungen zusammengefasst werden).
  _queueSaveView() {
    clearTimeout(this._saveViewTimer);
    this._saveViewTimer = setTimeout(() => this._saveView(), 150);
  }

  _saveView() {
    // Während einer Suche öffnen sich Boxen automatisch – das ist keine gewählte Ansicht.
    if (this._search) return;
    const content = this.shadowRoot.getElementById("content");
    const view = content && this._captureView(content);
    if (!view) return;
    this._storedView = { open: view.open, why: view.why, sort: this._sortMem || {}, scroll: [] };
    try {
      window.localStorage.setItem(LS_VIEW, JSON.stringify({ open: view.open, why: view.why, sort: this._sortMem || {} }));
    } catch (e) {}
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) {
      this._built = true;
      this._build();
    }
    this._maybeAutoScan();
  }

  set panel(panel) {
    this._panel = panel;
  }

  // Logo einmalig laden und als Data-URL halten (damit es auch im HTML-Download enthalten ist).
  _loadLogo() {
    if (this._logoRequested) return;
    this._logoRequested = true;
    fetch(LOGO_URL)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("logo"))))
      .then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }))
      .then((dataUrl) => {
        this._logo = dataUrl;
        const slot = this.shadowRoot.querySelector(".title-logo-slot");
        if (slot) slot.replaceWith(this._logoNode());
      })
      .catch(() => {});
  }

  _logoNode() {
    if (this._logo) {
      return this._el("img", { class: "title-logo title-logo-slot", attrs: { src: this._logo, alt: "HA Percyta" } });
    }
    return this._el("span", { class: "title-logo-slot", text: "🛡️" });
  }

  connectedCallback() {
    this._loadLogo();
    window.addEventListener("scroll", this._scrollHandler, true);
    window.addEventListener("resize", this._scrollHandler);
    this._keyHandler = this._keyHandler || ((e) => {
      if (e.key !== "Escape") return;
      if (this._modal) { this._closeModal(); return; }
      if (!this._detailId && !this._resolvedKey && !this._page) return;
      const t = e.composedPath && e.composedPath()[0];
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || "")) return;
      this._closeDetail();
    });
    window.addEventListener("keydown", this._keyHandler);
    // Zurück-Taste (Maus/Browser) führt aus Unterseiten (Pflege-Center, Befund) zurück.
    this._popHandler = this._popHandler || ((e) => this._onPopState(e));
    window.addEventListener("popstate", this._popHandler);
    this._navDepth = (history.state && history.state.percyta) || 0;
    // Aufgedeckte Secrets verschwinden, sobald der Tab in den Hintergrund geht.
    this._visHandler = this._visHandler || (() => { if (document.hidden) this._hideSecrets(); });
    document.addEventListener("visibilitychange", this._visHandler);
    this._autoScanPending = true;
    this._maybeAutoScan();
  }

  disconnectedCallback() {
    // Beim Verlassen des Panels die aktuelle Ansicht sofort sichern.
    clearTimeout(this._saveViewTimer);
    if (this._built) this._saveView();
    window.removeEventListener("scroll", this._scrollHandler, true);
    window.removeEventListener("resize", this._scrollHandler);
    if (this._keyHandler) window.removeEventListener("keydown", this._keyHandler);
    if (this._popHandler) window.removeEventListener("popstate", this._popHandler);
    if (this._visHandler) document.removeEventListener("visibilitychange", this._visHandler);
    this._hideSecrets();
  }

  _maybeAutoScan() {
    if (!this._built || !this._hass || !this._autoScanPending) return;
    if (!this.isConnected) return;
    this._autoScanPending = false;
    // Zuerst letzten Stand zeigen, dann im Hintergrund neu scannen.
    this._loadReport().then(() => this._runScan());
  }

  // ---------- i18n ----------
  _lang() {
    const l =
      (this._hass && (this._hass.language || (this._hass.locale && this._hass.locale.language))) ||
      "en";
    return String(l).toLowerCase().startsWith("de") ? "de" : "en";
  }

  _t(key) {
    const L = this._lang();
    return (STR[L] && STR[L][key]) != null ? STR[L][key] : STR.en[key] != null ? STR.en[key] : key;
  }

  _ti(key, vars) {
    let s = this._t(key);
    for (const k in vars) s = s.replace("{" + k + "}", vars[k]);
    return s;
  }

  // ---------- DOM-Helfer ----------
  _el(tag, opts = {}, children = []) {
    const node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.attrs) for (const k in opts.attrs) node.setAttribute(k, opts.attrs[k]);
    if (opts.style) node.style.cssText = opts.style;
    for (const c of [].concat(children)) if (c) node.appendChild(c);
    return node;
  }

  _fmtBytes(n) {
    if (n == null || isNaN(n)) return "—";
    let v = Number(n);
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let i = 0;
    while (Math.abs(v) >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return v.toFixed(1) + " " + units[i];
  }

  _pct(n) {
    return n == null ? "—" : n + " %";
  }

  _num(v) {
    if (typeof v === "number") return isNaN(v) ? null : v;
    if (v == null) return null;
    const m = String(v).replace(/\s/g, "").match(/-?\d+(?:[.,]\d+)?/);
    if (!m) return null;
    const n = parseFloat(m[0].replace(",", "."));
    return isNaN(n) ? null : n;
  }

  _usageClass(percent) {
    if (percent == null) return "ok";
    if (percent >= 90) return "crit";
    if (percent >= 70) return "warn";
    return "ok";
  }

  _meter(percent, cls) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    return this._el("div", { class: "meter" }, [
      this._el("span", { class: cls || this._usageClass(percent), style: `width:${p}%` }),
    ]);
  }

  _sharePct(value, max) {
    if (!value || value <= 0) return 0;
    const r = Math.max(0, Math.min(1, value / (max || 1)));
    return Math.max(Math.sqrt(r) * 100, 2);
  }

  _riskBadge(level) {
    return this._el("span", { class: `badge risk-${level || "low"}`, text: RISK_LABEL[level] || "LOW" });
  }

  _chip(text, cls) {
    return this._el("span", { class: `chip ${cls || ""}`, text });
  }

  _newTag(item) {
    return item && item.is_new ? this._chip(this._t("chip_new"), "new") : null;
  }

  _cellWithNew(text, item) {
    const tag = this._newTag(item);
    if (!tag) return text;
    return {
      node: this._el("div", { style: "display:flex;align-items:center;gap:6px" }, [
        this._el("span", { text: text == null ? "" : String(text) }),
        tag,
      ]),
    };
  }

  _ago(date) {
    const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
    if (mins < 2) return this._t("ago_now");
    if (mins < 90) return this._ti("ago_min", { n: mins });
    const hours = Math.round(mins / 60);
    if (hours < 36) return this._ti("ago_h", { n: hours });
    const days = Math.round(hours / 24);
    return days === 1 ? this._t("ago_d1") : this._ti("ago_d", { n: days });
  }

  // Infozeile "Letztes HA-Backup" unter der Versionszeile.
  _backupLine(d) {
    const b = d.backup;
    if (!b || !Object.keys(b).length) return null;
    let text;
    let old = false;
    if (!b.date) {
      text = this._t("backup_none");
      old = true;
    } else {
      const when = new Date(b.date);
      if (isNaN(when.getTime())) return null;
      const parts = [`${when.toLocaleString(this._lang())} (${this._ago(when)})`];
      if (b.size != null) parts.push(this._fmtBytes(b.size));
      if (b.name) parts.push(b.name);
      text = this._t("backup_last") + parts.join("  ·  ");
      old = Date.now() - when.getTime() > 7 * 86400000;
    }
    const line = this._el("div", { class: "backup-line clickable" + (old ? " warn" : ""), text, attrs: { title: this._t("open_in_ha") } });
    line.addEventListener("click", () => this._navigate("/config/backup"));
    return line;
  }

  // Neue Einträge seit dem letzten Scan, gruppiert nach Art (mit Namen).
  _newGroups(d) {
    const cardName = (url) => {
      const base = String(url || "").split("?")[0].replace(/\/+$/, "");
      return base.split("/").pop() || base;
    };
    const defs = [
      ["integrations", "integrations", "📦", (i) => i.title || i.domain],
      ["addons", "addons", "🧩", (a) => a.name || a.slug],
      ["cards", "custom_cards", "🃏", (x) => cardName(x.url)],
      ["blueprints", "blueprints", "📐", (b) => b.name || b.path],
      ["users", "users", "👤", (u) => u.name],
    ];
    return defs
      .map(([key, prop, icon, nameFn]) => ({
        key,
        icon,
        names: (d[prop] || []).filter((x) => x && x.is_new).map((x) => String(nameFn(x) || "?")),
      }))
      .filter((g) => g.names.length);
  }

  _newPanel(groups) {
    const rows = groups.map((g) => {
      const label = this._el("span", {
        class: "np-type",
        text: `${g.icon} ${this._t("nt_" + g.key + "_n")} (${g.names.length})`,
        attrs: { title: this._t("jump_title") },
      });
      label.addEventListener("click", () => this._jumpTo(g.key));
      return this._el("div", { class: "np-row" }, [
        label,
        this._el("div", { class: "np-names" }, g.names.map((n) => this._chip(n, "new-item"))),
      ]);
    });
    return this._el("div", { class: "new-panel" }, [
      this._el("div", { class: "np-title", text: "🆕 " + this._t("new_title") }),
      ...rows,
    ]);
  }

  _statCard(icon, value, label, accent, target) {
    const card = this._el(
      "div",
      { class: `stat ${accent || ""}${target ? " clickable" : ""}`, attrs: target ? { title: this._t("jump_title") } : {} },
      [
        this._el("div", { class: "stat-icon", text: icon }),
        this._el("div", { class: "stat-body" }, [
          this._el("div", { class: "stat-value", text: String(value) }),
          this._el("div", { class: "stat-label", text: label }),
        ]),
      ]
    );
    if (target) card.addEventListener("click", () => this._jumpTo(target));
    return card;
  }

  _section(title, count, bodyNode, open) {
    const summary = this._el("summary", { class: "sec-summary" }, [
      this._el("span", { class: "sec-title", text: title }),
      count != null ? this._el("span", { class: "sec-count", text: String(count) }) : null,
    ]);
    const details = this._el("details", { class: "section" }, [summary, bodyNode]);
    if (open) details.setAttribute("open", "");
    return details;
  }

  // ---------- Sortierbare Tabelle ----------
  _cellNode(cell) {
    const td = document.createElement("td");
    if (cell == null) {
      td.textContent = "";
    } else if (cell instanceof Node) {
      td.appendChild(cell);
    } else if (typeof cell === "object") {
      if (cell.node instanceof Node) td.appendChild(cell.node);
      else td.textContent = cell.text == null ? "" : String(cell.text);
      if (cell.nosrch) td.classList.add("nosrch");
    } else {
      td.textContent = String(cell);
    }
    return td;
  }

  _cellSortValue(cell) {
    if (cell && typeof cell === "object" && !(cell instanceof Node) && "sort" in cell) return cell.sort;
    if (cell instanceof Node) return cell.textContent || "";
    if (cell && typeof cell === "object")
      return cell.text != null ? String(cell.text) : cell.node ? cell.node.textContent : "";
    return cell == null ? "" : String(cell);
  }

  _table(headers, rows, opts = {}) {
    // Sortierung je Tabelle merken, damit sie eine Aktualisierung der Daten übersteht.
    const base = headers.join("|");
    this._tableSeq = this._tableSeq || {};
    this._tableSeq[base] = (this._tableSeq[base] || 0) + 1;
    const memKey = opts.memKey || base + "#" + this._tableSeq[base];
    const cols = opts.cols || [];
    this._sortMem = this._sortMem || {};
    const state = this._sortMem[memKey] || { idx: opts.sortIdx != null ? opts.sortIdx : -1, dir: opts.sortDir || "asc" };
    const tbody = document.createElement("tbody");

    const renderBody = () => {
      let data = rows.slice();
      if (state.idx >= 0) {
        const i = state.idx;
        data.sort((a, b) => {
          const av = this._cellSortValue(a[i]);
          const bv = this._cellSortValue(b[i]);
          const an = this._num(av);
          const bn = this._num(bv);
          let cmp;
          if (an != null && bn != null) cmp = an - bn;
          else cmp = String(av).localeCompare(String(bv), "de", { numeric: true, sensitivity: "base" });
          return state.dir === "asc" ? cmp : -cmp;
        });
      }
      tbody.replaceChildren();
      for (const cells of data) {
        const tr = document.createElement("tr");
        cells.forEach((cell, ci) => {
          const td = this._cellNode(cell);
          if (cols[ci] && cols[ci].cls) td.classList.add(cols[ci].cls);
          tr.appendChild(td);
        });
        tr.hidden = opts.noSearch ? false : !this._rowMatches(tr);
        tbody.appendChild(tr);
      }
    };

    const ths = headers.map((h, i) => {
      const col = cols[i] || {};
      if (col.nosort) return this._el("th", { class: col.cls || "", attrs: { "data-idx": String(i) } }, [this._el("span", { text: h })]);
      return this._el("th", { class: "sortable" + (col.cls ? " " + col.cls : ""), attrs: { "data-idx": String(i) } }, [
        this._el("span", { text: h }),
        this._el("span", { class: "sort-ind", text: "" }),
      ]);
    });
    const updateIndicators = () => {
      ths.forEach((th, i) => {
        const ind = th.querySelector(".sort-ind");
        if (!ind) return;
        ind.textContent = state.idx === i ? (state.dir === "asc" ? " ▲" : " ▼") : "";
        th.classList.toggle("active", state.idx === i);
      });
    };
    ths.forEach((th, i) => {
      if ((cols[i] || {}).nosort) return;
      th.addEventListener("click", () => {
        if (state.idx === i) state.dir = state.dir === "asc" ? "desc" : "asc";
        else {
          state.idx = i;
          state.dir = "asc";
        }
        this._sortMem[memKey] = state;
        this._queueSaveView();
        updateIndicators();
        renderBody();
      });
    });

    const thead = this._el("thead", {}, [this._el("tr", {}, ths)]);
    updateIndicators();
    renderBody();
    return this._el("div", { class: "table-wrap" }, [this._el("table", {}, [thead, tbody])]);
  }

  _build() {
    const style = document.createElement("style");
    style.textContent = `
      :host { display:block; height:100%; overflow:auto;
        /* Buttons etwas dunkler als die Primärfarbe (HA-Farbskala, Fallback: Primärfarbe) */
        --pc-btn:var(--ha-color-primary-40, var(--primary-color,#3f9dff));
        background:var(--primary-background-color); color:var(--primary-text-color);
        font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif); }
      .toolbar { position:sticky; top:0; z-index:6; display:flex; align-items:center;
        gap:12px; height:56px; padding:0 20px; box-sizing:border-box;
        background:var(--app-header-background-color, var(--primary-color));
        color:var(--app-header-text-color,#fff); box-shadow:0 2px 10px rgba(0,0,0,.18); }
      .toolbar .title { flex:1; font-size:20px; font-weight:600; letter-spacing:.01em;
        display:flex; align-items:baseline; gap:8px; }
      .toolbar .title .app-ver { font-size:12px; font-weight:400; opacity:.8; }
      .toolbar .meta { font-size:13px; opacity:.85; margin-right:4px; }
      .toolbar button { cursor:pointer; border:none; border-radius:20px; padding:8px 16px;
        font-size:14px; background:rgba(255,255,255,.16); color:inherit; transition:background .12s; }
      .toolbar button:hover { background:rgba(255,255,255,.30); }
      .toolbar button[disabled] { opacity:.5; cursor:default; }
      .toolbar .menu-btn { font-size:18px; line-height:1; padding:8px 14px; }

      .content { padding:18px 22px 48px; box-sizing:border-box; position:relative; container:percyta / inline-size; }
      h1.report-title { font-size:24px; font-weight:600; margin:0 0 4px; display:flex; align-items:center; gap:10px; }
      .subline { color:var(--secondary-text-color); font-size:13px; margin-bottom:18px;
        display:flex; gap:14px; flex-wrap:wrap; align-items:center; }
      .sup-badge { padding:2px 10px; border-radius:12px; font-size:12px; font-weight:600;
        background:var(--success-color,#43a047); color:#fff; }
      .sup-badge.off { background:var(--secondary-text-color,#888); }
      .new-badge { padding:2px 10px; border-radius:12px; font-size:12px; font-weight:700;
        background:var(--info-color,#3f9dff); color:#fff; }
      .reveal-btn { border:1px solid var(--divider-color); background:var(--secondary-background-color,#2b2b2b);
        color:var(--primary-text-color); border-radius:8px; padding:4px 10px; font-size:12px; cursor:pointer; white-space:nowrap; }
      .reveal-btn:hover { border-color:var(--primary-color,#03a9f4); }
      .reveal-btn[disabled] { opacity:.5; cursor:default; }
      .secret-val { word-break:break-all; }
      .title-logo { height:40px; width:40px; object-fit:contain; flex:none; }
      .backup-line { margin:-12px 0 16px; font-size:13px; color:var(--secondary-text-color); }
      .backup-line.clickable { cursor:pointer; width:fit-content; }
      .backup-line.clickable:hover { text-decoration:underline; }
      .backup-line.warn { color:var(--warning-color,#ffa600); }
      .sys-card.clickable { cursor:pointer; transition:transform .12s ease, border-color .12s ease; }
      .sys-card.clickable:hover { transform:translateY(-2px); border-color:var(--primary-color,#03a9f4); }
      .new-badge.clickable { cursor:pointer; user-select:none; }
      .new-badge.clickable:hover { filter:brightness(1.12); }
      .new-panel { margin:-6px 0 16px; padding:12px 16px; border-radius:14px;
        background:var(--card-background-color,#1c1c1c); border:1px solid var(--info-color,#3f9dff); }
      .new-panel[hidden] { display:none; }
      .np-title { font-size:13px; font-weight:700; margin-bottom:6px; }
      .np-row { display:flex; gap:12px; align-items:baseline; padding:4px 0; flex-wrap:wrap; }
      .np-type { min-width:150px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }
      .np-type:hover { text-decoration:underline; }
      .np-names { flex:1; min-width:200px; }
      .chip.new-item { background:var(--secondary-background-color,#2b2b2b); border:1px solid var(--divider-color); }
      .hint-line { padding:2px 14px 10px; font-size:12px; line-height:1.45; color:var(--secondary-text-color); font-style:italic; }

      .stat-grid { display:grid; gap:14px; margin-bottom:14px; }
      .grid-inv { grid-template-columns:repeat(4, 1fr); }
      .grid-sec { grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); }
      @media (min-width:1500px) { .grid-inv { grid-template-columns:repeat(8, 1fr); } }
      @media (max-width:1100px) { .grid-inv { grid-template-columns:repeat(2, 1fr); } }
      @media (max-width:560px) { .grid-inv { grid-template-columns:repeat(2, 1fr); } }
      .stat { display:flex; align-items:center; gap:13px; padding:15px 18px; border-radius:16px;
        background:var(--card-background-color,#1c1c1c); box-shadow:var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,.20));
        border:1px solid var(--divider-color); transition:transform .12s ease, box-shadow .12s ease; }
      .stat:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.24); }
      .stat.accent-red { background:rgba(219,68,55,.16); border-color:rgba(219,68,55,.34); }
      .stat.accent-amber { background:rgba(255,166,0,.16); border-color:rgba(255,166,0,.34); }
      .stat.accent-orange { background:rgba(255,112,67,.17); border-color:rgba(255,112,67,.36); }
      .stat.accent-green { background:rgba(67,160,71,.15); border-color:rgba(67,160,71,.30); }
      .stat.clickable { cursor:pointer; }
      .stat.clickable:hover { border-color:var(--primary-color,#3f9dff); }
      .stat-icon { font-size:25px; line-height:1; flex:0 0 auto; }
      .stat-body { min-width:0; }
      .stat-value { font-size:25px; font-weight:700; line-height:1.1; }
      .stat-label { font-size:12.5px; color:var(--secondary-text-color); }

      .riskbar-card { background:var(--card-background-color,#1c1c1c); border:1px solid var(--divider-color);
        border-radius:14px; padding:16px 18px; margin-bottom:16px; box-shadow:var(--ha-card-box-shadow,0 2px 6px rgba(0,0,0,.2)); }
      .riskbar-head { display:flex; justify-content:space-between; font-size:13px; color:var(--secondary-text-color); margin-bottom:8px; }
      .rb-head-right { display:flex; align-items:center; gap:10px; }
      .why-btn { border:1px solid var(--divider-color); background:var(--secondary-background-color,#2b2b2b);
        color:var(--primary-text-color); border-radius:20px; padding:3px 12px; font-size:12.5px; cursor:pointer; transition:background .12s, color .12s; }
      .why-btn:hover { background:var(--divider-color); }
      .why-btn.active { background:var(--pc-btn); color:#fff; border-color:transparent; }
      .risk-why { margin-top:14px; padding-top:13px; border-top:1px dashed var(--divider-color); font-size:13px; animation:fadeIn .18s ease; }
      @keyframes fadeIn { from{opacity:0; transform:translateY(-4px);} to{opacity:1; transform:none;} }
      .risk-why .crit-row { display:flex; gap:9px; align-items:flex-start; margin:7px 0; line-height:1.45; }
      .risk-why .crit-row .cdot { width:11px; height:11px; border-radius:50%; margin-top:4px; flex:0 0 auto; }
      .risk-why .cur { margin-top:13px; }
      .risk-why .cur-line { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:7px 0; }
      .risk-why .cur-line > b { min-width:82px; }
      .risk-why .note { color:var(--secondary-text-color); font-size:12px; margin-top:10px; }
      .riskbar { display:flex; height:14px; border-radius:8px; overflow:hidden; background:var(--divider-color); }
      .riskbar > span { display:block; }
      .riskbar .b-high { background:var(--error-color,#db4437); }
      .riskbar .b-medium { background:var(--warning-color,#ffa600); }
      .riskbar .b-low { background:var(--success-color,#43a047); }
      .legend { display:flex; gap:16px; margin-top:10px; font-size:12.5px; flex-wrap:wrap; }
      .legend span { display:inline-flex; align-items:center; gap:6px; }
      .dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
      .dot.high{background:var(--error-color,#db4437);} .dot.medium{background:var(--warning-color,#ffa600);} .dot.low{background:var(--success-color,#43a047);}

      .viewbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin:2px 0 16px;
        padding:10px 14px; border-radius:12px; background:var(--card-background-color,#1c1c1c); border:1px solid var(--divider-color); }
      .segmented { display:inline-flex; border:1px solid var(--divider-color); border-radius:10px; overflow:hidden; }
      .segmented button { border:none; background:transparent; color:var(--primary-text-color); padding:7px 14px;
        font-size:13.5px; cursor:pointer; transition:background .12s, color .12s; }
      .segmented button:not(:last-child){ border-right:1px solid var(--divider-color); }
      .segmented button.active { background:var(--pc-btn); color:#fff; font-weight:600; }
      .vb-btn { border:1px solid var(--divider-color); background:var(--secondary-background-color,#2b2b2b);
        color:var(--primary-text-color); border-radius:10px; padding:7px 14px; font-size:13.5px; cursor:pointer;
        display:inline-flex; align-items:center; gap:7px; transition:background .12s; white-space:nowrap; }
      .vb-btn:hover { background:var(--divider-color); }
      .vb-search { flex:0 1 300px; min-width:150px; position:relative; display:flex; align-items:center; }
      .vb-search input { width:100%; box-sizing:border-box; padding:8px 30px 8px 32px; border-radius:10px;
        border:1px solid var(--divider-color); background:var(--secondary-background-color,#2b2b2b); color:var(--primary-text-color); font-size:13.5px; }
      .vb-search .vs-icon { position:absolute; left:10px; font-size:13px; opacity:.7; pointer-events:none; }
      .vb-search .vs-clear { position:absolute; right:8px; cursor:pointer; border:none; background:transparent;
        color:var(--secondary-text-color); font-size:16px; line-height:1; padding:2px 4px; display:none; }
      .vb-search .vs-clear.show { display:block; }

      .sections { display:grid; gap:14px; align-items:start; grid-template-columns:repeat(auto-fill, minmax(560px, 1fr)); }
      @media (max-width:620px) { .sections { grid-template-columns:1fr; } }
      .sections > details.section[open] { grid-column:1 / -1; }
      .content.narrow { max-width:1180px; margin-left:auto; margin-right:auto; }
      .content.narrow .sections { grid-template-columns:1fr; }
      .content.narrow .grid-inv { grid-template-columns:repeat(4,1fr); }

      details.section { background:var(--card-background-color,#1c1c1c); border:1px solid var(--divider-color);
        border-radius:14px; margin:0; overflow:hidden; box-shadow:var(--ha-card-box-shadow,0 2px 6px rgba(0,0,0,.2)); transition:box-shadow .12s ease;
        scroll-margin-top:70px; }
      details.section[open] { box-shadow:0 6px 20px rgba(0,0,0,.22); }
      .sec-summary { cursor:pointer; list-style:none; display:flex; align-items:center; gap:10px; padding:15px 18px;
        font-size:16px; font-weight:600; user-select:none; transition:background .12s; }
      .sec-summary:hover { background:rgba(127,127,127,.06); }
      .sec-summary::-webkit-details-marker { display:none; }
      .sec-summary::before { content:"▸"; transition:transform .15s; color:var(--secondary-text-color); }
      details[open] > .sec-summary::before { transform:rotate(90deg); }
      .sec-count { margin-left:auto; background:var(--secondary-background-color,#2b2b2b); color:var(--secondary-text-color);
        border-radius:12px; padding:2px 10px; font-size:13px; font-weight:600; }
      /* Listen-Layout der Übersicht: Gruppen mit kompakten Zeilen */
      .sec-groups { display:flex; flex-direction:column; gap:18px; }
      .sec-group[hidden] { display:none; }
      .sec-group-title { font-size:12.5px; font-weight:600; color:var(--secondary-text-color); margin:0 0 7px 6px; letter-spacing:.02em; }
      .sections.grouped { display:flex; flex-direction:column; align-items:stretch; gap:0; border:1px solid var(--divider-color); border-radius:14px; overflow:hidden;
        background:var(--card-background-color,#1c1c1c); box-shadow:var(--ha-card-box-shadow,0 2px 6px rgba(0,0,0,.2)); }
      .sections.grouped > details.section { border:none; border-radius:0; box-shadow:none; background:transparent; }
      .sections.grouped > details.section:not([hidden]) ~ details.section:not([hidden]) { border-top:1px solid var(--divider-color); }
      .sections.grouped > details.section[open] { background:rgba(127,127,127,.03); }
      .sec-row > .sec-summary { padding:11px 16px; font-size:14.5px; gap:12px; }
      .sec-row > .sec-summary .sec-title { flex:0 0 auto; min-width:min(240px, 40%); }
      .sec-ico { --mdc-icon-size:20px; width:20px; height:20px; flex:none; display:inline-flex; align-items:center; justify-content:center;
        color:var(--secondary-text-color); font-size:16px; line-height:1; }
      .sec-sub { flex:1; min-width:0; font-size:13px; font-weight:400; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .sec-count.lvl-ok { color:var(--success-color,#43a047); background:rgba(67,160,71,.14); }
      .sec-count.lvl-warn { color:var(--warning-color,#ffa600); background:rgba(255,166,0,.15); }
      .sec-count.lvl-bad { color:var(--error-color,#db4437); background:rgba(219,68,55,.15); }
      .sec-count.lvl-info { color:var(--info-color,#3f9dff); background:rgba(63,157,255,.15); }
      @media (max-width:620px) { .sec-row > .sec-summary .sec-title { min-width:0; flex:1; } .sec-sub { display:none; } }


      .table-wrap { overflow-x:auto; padding:0 10px 12px; }
      table { border-collapse:collapse; width:100%; font-size:13.5px; }
      th, td { text-align:left; padding:9px 12px; border-bottom:1px solid var(--divider-color); vertical-align:middle; }
      th { color:var(--secondary-text-color); font-weight:600; font-size:12.5px; text-transform:uppercase; letter-spacing:.03em; }
      th.sortable { cursor:pointer; white-space:nowrap; user-select:none; transition:color .12s; }
      th.sortable:hover { color:var(--primary-text-color); }
      th.sortable.active { color:var(--primary-color,#3f9dff); }
      .sort-ind { font-size:11px; }
      tbody tr:hover { background:rgba(127,127,127,.08); }
      td code, .mono { font-family:var(--code-font-family,monospace); background:var(--secondary-background-color,#2b2b2b);
        padding:1px 6px; border-radius:5px; font-size:12.5px; }

      .badge { font-size:11px; font-weight:700; padding:3px 9px; border-radius:10px; color:#fff; letter-spacing:.02em; }
      .risk-high{background:var(--error-color,#db4437);} .risk-medium{background:var(--warning-color,#ffa600);} .risk-low{background:var(--success-color,#43a047);}
      .chip { display:inline-block; font-size:11.5px; padding:3px 9px; border-radius:10px; margin:2px 4px 2px 0;
        background:var(--secondary-background-color,#2b2b2b); color:var(--primary-text-color); white-space:nowrap; }
      .chip.warn{background:rgba(255,166,0,.18); color:var(--warning-color,#ffa600);}
      .chip.danger{background:rgba(219,68,55,.18); color:var(--error-color,#db4437);}
      .chip.info{background:rgba(63,157,255,.16); color:var(--info-color,#3f9dff);}
      .chip.new{ background:var(--info-color,#3f9dff); color:#fff; font-weight:700; }
      .muted { color:var(--secondary-text-color); }
      .link-num { color:var(--primary-color,#3f9dff); cursor:pointer; font-weight:600; }
      .link-num:hover { text-decoration:underline; }
      .ov-select { background:var(--secondary-background-color,#2b2b2b); color:var(--primary-text-color);
        border:1px solid var(--divider-color); border-radius:8px; padding:4px 8px; font-size:12.5px; cursor:pointer; }
      .ov-mark { color:var(--warning-color,#ffa600); font-size:12px; cursor:help; }
      .empty { padding:36px; text-align:center; color:var(--secondary-text-color); }
      .status { padding:40px; text-align:center; color:var(--secondary-text-color); }

      .sys-cards { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; padding:8px 12px 4px; }
      @media (max-width:900px){ .sys-cards{grid-template-columns:repeat(2,1fr);} }
      .sys-card { background:var(--secondary-background-color,#2b2b2b); border-radius:12px; padding:14px 16px; border:1px solid var(--divider-color); }
      .sys-card .lbl { font-size:12.5px; color:var(--secondary-text-color); display:flex; gap:6px; align-items:center; }
      .sys-card .val { font-size:23px; font-weight:700; margin-top:3px; }
      .sys-card .sub { font-size:12px; color:var(--secondary-text-color); margin-top:3px; }
      .meter { height:8px; border-radius:6px; background:var(--divider-color); overflow:hidden; margin-top:8px; }
      .meter > span { display:block; height:100%; }
      .meter .ok { background:var(--success-color,#43a047); }
      .meter .warn { background:var(--warning-color,#ffa600); }
      .meter .crit { background:var(--error-color,#db4437); }
      .sub-head { padding:10px 12px 4px; font-size:13px; font-weight:600; color:var(--secondary-text-color); }
      .swap-expl { padding:0 14px 8px; font-size:12px; line-height:1.45; color:var(--secondary-text-color); font-style:italic; }
      .bar-cell { min-width:120px; }

      /* ----- Befunde ----- */
      .sev { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:700; padding:3px 10px 3px 8px;
        border-radius:999px; white-space:nowrap; letter-spacing:.02em; }
      .sev-dot { width:8px; height:8px; border-radius:50%; background:currentColor; }
      .sev-high { background:rgba(219,68,55,.16); color:var(--error-color,#db4437); }
      .sev-medium { background:rgba(255,166,0,.16); color:var(--warning-color,#ffa600); }
      .sev-low { background:rgba(63,157,255,.16); color:var(--info-color,#3f9dff); }
      .sev-info { background:rgba(127,127,127,.18); color:var(--secondary-text-color,#9aa0aa); }
      .small { font-size:12px; }

      .f-cats { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:10px; padding:4px 12px 10px; }
      .f-cat { position:relative; overflow:hidden; cursor:pointer; user-select:none; padding:10px 12px 10px 16px; border-radius:12px;
        background:var(--secondary-background-color,#2b2b2b); border:1px solid var(--divider-color); transition:border-color .12s, transform .12s; }
      .f-cat::before { content:""; position:absolute; left:0; top:0; bottom:0; width:5px; background:var(--divider-color); }
      .f-cat.fc-high::before { background:var(--error-color,#db4437); }
      .f-cat.fc-high .f-cat-n { color:var(--error-color,#db4437); }
      .f-cat.fc-medium::before { background:var(--warning-color,#ffa600); }
      .f-cat.fc-medium .f-cat-n { color:var(--warning-color,#ffa600); }
      .f-cat.fc-low::before { background:var(--info-color,#3f9dff); }
      .f-cat.fc-low .f-cat-n { color:var(--info-color,#3f9dff); }
      .f-cat.fc-info::before { background:var(--secondary-text-color,#9aa0aa); }
      .f-cat.fc-info .f-cat-n { color:var(--secondary-text-color,#9aa0aa); }
      .f-cat:hover { transform:translateY(-1px); border-color:var(--primary-color,#3f9dff); }
      .f-cat.active { border-color:var(--primary-color,#3f9dff); box-shadow:inset 0 0 0 1px var(--primary-color,#3f9dff); }
      .f-cat-top { display:flex; align-items:center; justify-content:space-between; }
      .f-cat-icon { font-size:19px; }
      .f-cat-n { font-size:22px; font-weight:700; }
      .f-cat-label { font-size:12.5px; color:var(--secondary-text-color); margin-top:2px; }

      .f-tools { padding:2px 12px 8px; display:flex; flex-direction:column; gap:8px; }
      .f-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
      .f-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-left:auto; }
      .f-sel-info { font-size:13px; min-width:90px; }
      .vb-btn[disabled], .ov-select[disabled] { opacity:.45; cursor:default; }
      .vb-btn.small { padding:4px 10px; font-size:12.5px; }
      .f-list .table-wrap { padding-top:2px; }
      th.f-check, td.f-check { width:34px; padding-right:0; }
      th.f-go, td.f-go { width:34px; text-align:right; }
      .f-cb { width:16px; height:16px; cursor:pointer; accent-color:var(--primary-color,#3f9dff); }
      .f-title { font-weight:600; cursor:pointer; }
      .f-title:hover { color:var(--primary-color,#3f9dff); text-decoration:underline; }
      .f-sub { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:2px; font-size:12.5px; color:var(--secondary-text-color); }
      .f-subject { color:var(--primary-text-color); opacity:.85; }
      .f-go-btn { cursor:pointer; font-size:20px; line-height:1; color:var(--secondary-text-color); padding:2px 8px; border-radius:8px; }
      .f-go-btn:hover { background:var(--divider-color); color:var(--primary-text-color); }
      .f-resolved { padding:2px 14px 12px; }
      .f-res-row { display:flex; align-items:baseline; gap:10px; padding:6px 0; border-bottom:1px solid var(--divider-color); flex-wrap:wrap; }
      .f-res-ico { color:var(--success-color,#43a047); font-weight:700; }
      .f-res-title { font-weight:600; }
      .f-res-when { margin-left:auto; font-size:12.5px; }
      .f-resolved-box { margin:6px 12px 10px; box-shadow:none; background:var(--secondary-background-color,#2b2b2b); }
      .f-resolved-box .sec-summary { padding:11px 14px; font-size:14px; }

      .fd { max-width:1280px; margin:0 auto; }
      .fd-top { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
      .fd-crumb { font-size:13px; }
      .fd-nav { margin-left:auto; display:flex; align-items:center; gap:8px; }
      .fd-hero { position:relative; overflow:hidden; display:flex; align-items:center; gap:18px; padding:20px 22px 20px 28px;
        border-radius:16px; margin-bottom:16px; background:var(--card-background-color,#1c1c1c); border:1px solid var(--divider-color);
        box-shadow:var(--ha-card-box-shadow,0 2px 8px rgba(0,0,0,.2)); }
      .fd-hero::before { content:""; position:absolute; left:0; top:0; bottom:0; width:7px; background:var(--sev); }
      .fd-ico { flex:none; width:60px; height:60px; border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:30px;
        background:color-mix(in srgb, var(--sev) 16%, transparent); }
      .fd-hero-main { flex:1; min-width:0; }
      .fd-badges { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:6px; }
      .fd-title { margin:0 0 4px; font-size:23px; font-weight:700; }
      .fd-open { flex:none; cursor:pointer; border:none; border-radius:12px; padding:10px 18px; font-size:14px; font-weight:600;
        background:var(--pc-btn); color:#fff; }
      .fd-open:hover { filter:brightness(1.1); }
      a.fd-open, a.vb-btn, a.cc-open { text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
      .id-cell { display:inline-flex; align-items:center; gap:4px; max-width:100%; }
      .id-link { color:var(--primary-color,#3f9dff); text-decoration:none; cursor:pointer; word-break:break-all; }
      .id-link:hover { text-decoration:underline; }
      .copy-btn { border:none; background:transparent; color:var(--secondary-text-color); cursor:pointer; padding:2px 4px; border-radius:6px;
        display:inline-flex; align-items:center; --mdc-icon-size:16px; font-size:13px; line-height:1; flex:none; }
      .copy-btn:hover { background:rgba(127,127,127,.15); color:var(--primary-text-color); }
      .copy-btn.ok { color:var(--success-color,#43a047); }
      .clp { padding:10px 12px; border-radius:10px; background:var(--secondary-background-color,#2b2b2b); margin:6px 0 10px; font-size:13px; }
      .clp .dlg-sub { margin-top:4px; }
      .clp-row { display:flex; justify-content:space-between; gap:12px; padding:3px 0; }
      .clp-row.keep b { color:var(--success-color,#43a047); }
      .clp-sum { margin:8px 0 4px; padding-top:6px; border-top:1px solid var(--divider-color); }
      .clp-top { max-height:180px; overflow:auto; }
      .clp-top .mono { word-break:break-all; }
      .fd-grid { display:grid; grid-template-columns:minmax(0, 2fr) minmax(280px, 1fr); gap:16px; align-items:start; }
      @media (max-width:980px) { .fd-grid { grid-template-columns:1fr; } .fd-hero { flex-wrap:wrap; } }
      .fd-card { background:var(--card-background-color,#1c1c1c); border:1px solid var(--divider-color); border-radius:14px;
        padding:16px 18px; box-shadow:var(--ha-card-box-shadow,0 2px 6px rgba(0,0,0,.2)); }
      .fd-card h3 { margin:0 0 12px; font-size:15px; }
      .fd-side { display:flex; flex-direction:column; gap:16px; }
      .fd-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--divider-color); }
      .fd-tab { cursor:pointer; border:1px solid var(--divider-color); background:transparent; color:var(--primary-text-color);
        border-radius:999px; padding:6px 14px; font-size:13.5px; transition:background .12s; }
      .fd-tab:hover { background:var(--divider-color); }
      .fd-tab.active { background:var(--pc-btn); border-color:transparent; color:#fff; font-weight:600; }
      .fd-panel[hidden] { display:none; }
      .fd-steps { list-style:none; margin:0; padding:0; }
      .fd-step { display:grid; grid-template-columns:36px 1fr; gap:14px; position:relative; padding-bottom:20px; }
      .fd-step:last-child { padding-bottom:0; }
      .fd-step:not(:last-child)::before { content:""; position:absolute; left:17px; top:38px; bottom:2px; width:2px; background:var(--divider-color); }
      .fd-node { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px;
        background:var(--secondary-background-color,#2b2b2b); border:2px solid var(--divider-color); }
      .fd-step.fix .fd-node { border-color:var(--success-color,#43a047); }
      .fd-step-body h4 { margin:3px 0 4px; font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--secondary-text-color); }
      .fd-step-body p { margin:0; line-height:1.6; font-size:14px; }
      .fd-fixlist { margin:2px 0 0; padding-left:20px; line-height:1.65; font-size:14px; }
      .fd-fixlist li { margin-bottom:5px; }
      .fd-kv th.fd-k { width:34%; text-transform:none; letter-spacing:0; font-size:13px; }
      .fd-fact { display:flex; justify-content:space-between; gap:14px; padding:9px 0; border-bottom:1px solid var(--divider-color); font-size:13.5px; }
      .fd-fact:last-child { border-bottom:none; }
      .fd-fact-l { color:var(--secondary-text-color); }
      .fd-fact-v { text-align:right; }
      .fd-conf { display:flex; align-items:center; gap:8px; justify-content:flex-end; }
      .fd-conf-bar { width:90px; height:7px; border-radius:6px; background:var(--divider-color); overflow:hidden; }
      .fd-conf-bar > span { display:block; height:100%; background:var(--primary-color,#3f9dff); }
      .fd-status-seg { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .fd-st { cursor:pointer; padding:9px 10px; font-size:13px; border-radius:10px; border:1px solid var(--divider-color);
        background:var(--secondary-background-color,#2b2b2b); color:var(--primary-text-color); transition:background .12s; }
      .fd-st:hover { background:var(--divider-color); }
      .fd-st.active { background:var(--pc-btn); color:#fff; border-color:transparent; font-weight:600; }
      .fd-manage-row { margin:10px 0 8px; }
      .fd-note { width:100%; box-sizing:border-box; padding:8px 10px; border-radius:10px; border:1px solid var(--divider-color);
        background:var(--secondary-background-color,#2b2b2b); color:var(--primary-text-color); font-size:13px; }
      .fd-gone { text-align:center; padding:40px 20px; }
      .fd-gone-ico { font-size:38px; color:var(--success-color,#43a047); }

      /* ----- v1.2.2 ----- */
      .f-res-row.clickable { cursor:pointer; border-radius:8px; padding:6px 8px; margin:0 -8px; align-items:center; }
      .f-res-row.clickable:hover, .f-res-row.clickable:focus { background:rgba(127,127,127,.10); outline:none; }
      .f-res-row .f-go-btn { font-size:18px; }
      .chip.ok-chip { background:rgba(67,160,71,.18); color:var(--success-color,#43a047); font-weight:700; }
      .res-ok { display:flex; gap:12px; align-items:flex-start; padding:12px 14px; margin-bottom:16px; border-radius:12px;
        background:rgba(67,160,71,.12); border:1px solid rgba(67,160,71,.35); }
      .res-ok p { margin:0; line-height:1.5; font-size:14px; }
      .res-ok-ico { font-size:20px; }
      .secret-val.shown { background:rgba(255,166,0,.18); }
      .secret-actions { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
      .safe-line { font-style:normal; }
      .db-toolbar { margin:6px 12px 10px; padding:10px 12px; border-radius:12px; border:1px solid rgba(255,166,0,.35); background:rgba(255,166,0,.07); }
      .db-warn { font-size:12.5px; line-height:1.45; margin-bottom:8px; }
      .db-tool-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
      .db-tool-title { font-weight:700; font-size:13.5px; margin-right:4px; }
      .db-row-menu { padding:2px 6px; }
      .db-sel-bar { padding:2px 12px 8px; }
      .modal-back { position:fixed; inset:0; z-index:10000; background:rgba(0,0,0,.55); display:flex; align-items:flex-start; justify-content:center; padding:min(6vh, 48px) 16px 16px; box-sizing:border-box; }
      .modal { width:min(920px, 100%); max-height:calc(100vh - min(6vh, 48px) - 16px); display:flex; flex-direction:column; border-radius:16px;
        background:var(--card-background-color,#1c1c1c); border:1px solid var(--divider-color); box-shadow:0 18px 50px rgba(0,0,0,.5); }
      .modal-head { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid var(--divider-color); }
      .modal-head h3 { margin:0; font-size:17px; flex:1; }
      .modal-x { border:none; background:transparent; color:var(--secondary-text-color); font-size:24px; cursor:pointer; line-height:1; }
      .modal-body { padding:14px 18px; overflow:auto; }
      .modal-foot { display:flex; gap:10px; justify-content:flex-end; padding:12px 18px; border-top:1px solid var(--divider-color); flex-wrap:wrap; }
      .fd-open.danger { background:var(--error-color,#db4437); }
      .fd-open[disabled] { opacity:.45; cursor:default; filter:none; }
      .dlg-intro { margin:0 0 12px; line-height:1.5; font-size:13.5px; }
      .dlg-field { display:flex; flex-direction:column; gap:4px; margin-bottom:10px; font-size:13px; color:var(--secondary-text-color); }
      .dlg-check { display:flex; gap:8px; align-items:flex-start; margin:6px 0; font-size:13.5px; line-height:1.4; cursor:pointer; }
      .dlg-check input { margin-top:2px; accent-color:var(--primary-color,#3f9dff); }
      .dlg-sub { font-weight:700; font-size:13px; margin:12px 0 4px; }
      .dlg-backup { margin:8px 0; padding:8px 12px; border-radius:10px; background:var(--secondary-background-color,#2b2b2b); }
      .dlg-warn { margin:6px 0; padding:8px 10px; border-radius:8px; font-size:13px; line-height:1.4;
        background:rgba(255,166,0,.14); color:var(--primary-text-color); border:1px solid rgba(255,166,0,.35); }
      .dlg-preview .table-wrap { padding:0; margin:8px 0; }
      .dlg-preview table { font-size:12.5px; }
      .dlg-preview td .mono { word-break:break-all; }
      .dlg-status { margin-top:10px; font-size:13.5px; font-weight:600; }
      .dlg-status.busy { color:var(--info-color,#3f9dff); }
      .dlg-status.ok { color:var(--success-color,#43a047); }
      .dlg-status.err { color:var(--error-color,#db4437); }
      .dlg-ids { resize:vertical; font-family:var(--code-font-family,monospace); }
      .pk { position:relative; }
      .pk-field { display:flex; align-items:center; position:relative; }
      .pk-field .pk-input { padding-right:34px; }
      .pk-caret { position:absolute; right:6px; border:none; background:transparent; color:var(--secondary-text-color); font-size:15px; cursor:pointer; padding:4px 6px; }
      .pk-chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px; min-height:0; align-items:center; }
      .pk-chips:empty { display:none; }
      .pk-head { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }
      .pk-head-info { flex:1; min-width:120px; }
      .pk-view { border:1px solid var(--divider-color); background:transparent; color:var(--primary-text-color); border-radius:999px; font-size:12px; padding:3px 10px; cursor:pointer; }
      .pk-view:hover { background:rgba(127,127,127,.14); }
      .pk-sel-search { flex:0 1 200px; min-width:120px; padding:4px 10px; border-radius:999px; border:1px solid var(--divider-color);
        background:var(--secondary-background-color,#2b2b2b); color:var(--primary-text-color); font-size:12px; }
      .pk-head [hidden] { display:none; }
      .pk-chips.list { display:block; max-height:320px; overflow:auto; border:1px solid var(--divider-color); border-radius:10px; }
      .pk-lrow { display:flex; align-items:center; gap:10px; padding:6px 6px 6px 12px; border-bottom:1px solid var(--divider-color); }
      .pk-lrow:last-child { border-bottom:none; }
      .pk-lrow:hover { background:rgba(127,127,127,.08); }
      .pk-lmain { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
      .pk-lname { font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .pk-lid { font-size:11.5px; color:var(--secondary-text-color); word-break:break-all; align-self:flex-start; max-width:100%; }
      .pk-lnote { font-size:12px; color:var(--secondary-text-color); white-space:nowrap; }
      .pk-lrow .pk-x { font-size:18px; padding:2px 10px; border-radius:8px; }
      .pk-lrow .pk-x:hover { background:rgba(219,68,55,.15); color:var(--error-color,#db4437); }
      .pk-chip { display:inline-flex; align-items:center; gap:4px; font-size:12px; padding:3px 4px 3px 9px; border-radius:999px;
        background:rgba(63,157,255,.16); border:1px solid rgba(63,157,255,.35); }
      .pk-x { border:none; background:transparent; color:var(--secondary-text-color); cursor:pointer; font-size:15px; line-height:1; padding:0 4px; }
      .pk-panel { margin-top:4px; border:1px solid var(--divider-color); border-radius:10px; background:var(--secondary-background-color,#2b2b2b); overflow:hidden; }
      .pk-panel[hidden] { display:none; }
      .pk-bar { display:flex; flex-wrap:wrap; gap:6px; padding:8px; border-bottom:1px solid var(--divider-color); align-items:center; }
      .pk-f { border:1px solid var(--divider-color); background:transparent; color:var(--primary-text-color); border-radius:999px; padding:3px 10px; font-size:12px; cursor:pointer; }
      .pk-f.active { background:var(--pc-btn); color:#fff; border-color:transparent; }
      .pk-dom { margin-left:auto; }
      .pk-list { max-height:260px; overflow:auto; }
      .pk-row { display:flex; gap:10px; align-items:flex-start; padding:7px 10px; cursor:pointer; border-bottom:1px solid rgba(127,127,127,.12); }
      .pk-row:hover { background:rgba(127,127,127,.12); }
      .pk-row.sel { background:rgba(63,157,255,.14); }
      .pk-cb { font-size:16px; line-height:1.2; color:var(--primary-color,#3f9dff); }
      .pk-main { min-width:0; flex:1; }
      .pk-id { font-size:12.5px; word-break:break-all; }
      .pk-sub { display:flex; flex-wrap:wrap; gap:8px; font-size:11.5px; margin-top:2px; align-items:center; }
      .pk-badge { font-size:10.5px; padding:1px 7px; border-radius:999px; background:rgba(127,127,127,.2); color:var(--primary-text-color); }
      .pk-badge.warn { background:rgba(255,166,0,.2); color:var(--warning-color,#ffa600); }
      .pk-empty { padding:14px; text-align:center; font-size:13px; }
      .pk-foot { display:flex; gap:8px; align-items:center; padding:6px 8px; border-top:1px solid var(--divider-color); flex-wrap:wrap; }
      .pk-foot .muted { margin-right:auto; }
      .fd-hero-acts { display:flex; flex-direction:column; gap:8px; flex:none; }
      .vb-btn.warn-btn { border-color:rgba(255,166,0,.5); }
      .db-calm { font-size:12.5px; line-height:1.45; margin:-2px 0 10px; padding:7px 10px; border-radius:8px;
        background:rgba(63,157,255,.10); border:1px solid rgba(63,157,255,.28); }
      .dlg-check-h { display:block; font-size:12px; color:var(--secondary-text-color); margin-top:1px; }
      .dlg-explain { margin:0 0 12px; padding:10px 14px; border-radius:10px; background:rgba(63,157,255,.10); border:1px solid rgba(63,157,255,.28); }
      .dlg-explain-t { font-weight:700; font-size:13.5px; margin-bottom:4px; }
      .dlg-explain ul { margin:0; padding-left:20px; font-size:13px; line-height:1.55; }
      .table-wrap + .dlg-explain, .dlg-explain + .muted { margin-top:6px; }
      details.section > div > .dlg-explain { margin:8px 12px 6px; }
      .cc-intro { padding:6px 14px 10px; font-size:13px; line-height:1.5; color:var(--secondary-text-color); }
      .cc-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(210px, 1fr)); gap:10px; padding:0 12px 14px; }
      .cc-tile { display:flex; flex-direction:column; gap:4px; padding:12px 14px; border-radius:12px; background:var(--secondary-background-color,#2b2b2b);
        border:1px solid var(--divider-color); position:relative; overflow:hidden; }
      .cc-tile::before { content:""; position:absolute; left:0; right:0; bottom:0; height:3px; background:var(--info-color,#3f9dff); opacity:.85; }
      .cc-tile.ok::before { background:var(--success-color,#43a047); }
      .cc-tile.warn::before { background:var(--warning-color,#ffa600); }
      .cc-top { display:flex; justify-content:space-between; align-items:center; }
      .cc-ico { font-size:20px; }
      .cc-n { font-size:20px; font-weight:700; }
      .cc-tile.ok .cc-n { color:var(--success-color,#43a047); }
      .cc-tile.warn .cc-n { color:var(--warning-color,#ffa600); }
      .cc-title { font-weight:600; font-size:13.5px; }
      .cc-desc { font-size:12px; line-height:1.4; color:var(--secondary-text-color); flex:1; }
      .cc-tile .vb-btn { align-self:flex-start; margin-top:6px; }
      .rl-list { display:flex; flex-direction:column; gap:8px; }
      .rl-title { display:flex; flex-direction:column; align-items:flex-start; gap:2px; min-width:0; border:none; background:transparent; color:var(--primary-text-color);
        padding:0; text-align:left; cursor:pointer; font:inherit; }
      .rl-title:hover .f-res-title { color:var(--primary-color,#3f9dff); text-decoration:underline; }
      .rl-title[disabled] { cursor:default; }
      .toolbar .meta.refreshing { color:var(--info-color,#3f9dff); opacity:1; }
      .rl-row { display:grid; grid-template-columns:1fr auto auto auto; gap:12px; align-items:center; padding:8px 10px; border-radius:10px; background:var(--secondary-background-color,#2b2b2b); }
      .ok-text { color:var(--success-color,#43a047); }
      .cfg-out { white-space:pre-wrap; word-break:break-word; font-family:var(--code-font-family,monospace); font-size:12.5px; line-height:1.5;
        background:var(--secondary-background-color,#2b2b2b); border-radius:10px; padding:10px 12px; max-height:320px; overflow:auto; }
      /* ----- Kopf: kompakte Kennzahlen, Risiko + Pflege-Center ----- */
      .stat-grid.kpi { grid-template-columns:repeat(8, minmax(0, 1fr)); gap:10px; margin-bottom:14px; }
      /* Tablet: 2 Reihen à 4 statt 7 + 1, Handy: 2 Spalten (nach Breite des Inhalts, nicht des Fensters) */
      @container percyta (max-width: 1200px) { .stat-grid.kpi { grid-template-columns:repeat(4, minmax(0, 1fr)); } }
      @container percyta (max-width: 540px) { .stat-grid.kpi { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
      .kpi .stat { padding:9px 12px; gap:10px; border-radius:12px; box-shadow:none; }
      .kpi .stat-icon { font-size:18px; }
      .kpi .stat-value { font-size:19px; }
      .kpi .stat-label { font-size:11.5px; line-height:1.25; }
      .hero-grid { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1.25fr); gap:14px; margin-bottom:16px; align-items:stretch; }
      @media (max-width:1000px) { .hero-grid { grid-template-columns:1fr; } }
      .hero-grid > .riskbar-card { margin-bottom:0; }
      .rk-card { display:flex; flex-direction:column; gap:10px; }
      .rk-card .riskbar { margin-top:2px; }
      .rk-card .legend { margin-top:0; }
      .rk-shield { flex:none; width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px;
        background:rgba(63,157,255,.12); }
      .rk-list { padding-top:8px; border-top:1px dashed var(--divider-color); }
      .cc-p-n.bad { background:rgba(219,68,55,.18); color:var(--error-color,#db4437); }
      .cc-p-n.ok { background:rgba(67,160,71,.16); color:var(--success-color,#43a047); }
      .cc-preview { display:flex; flex-direction:column; gap:10px; }
      .cc-p-head { display:flex; align-items:center; gap:14px; }
      .cc-ring { --p:0; flex:none; width:58px; height:58px; border-radius:50%;
        background:conic-gradient(var(--success-color,#43a047) calc(var(--p) * 1%), var(--divider-color) 0); display:flex; align-items:center; justify-content:center; }
      .cc-ring-in { width:46px; height:46px; border-radius:50%; background:var(--card-background-color,#1c1c1c); display:flex; flex-direction:column; align-items:center; justify-content:center; line-height:1.05; }
      .cc-ring-in b { font-size:13px; }
      .cc-ring-in span { font-size:9.5px; color:var(--secondary-text-color); }
      .cc-p-title { flex:1; min-width:0; }
      .cc-p-name { font-size:15px; font-weight:700; }
      .cc-p-sum { font-size:12.5px; font-weight:600; margin-top:2px; }
      .cc-p-sum.warn { color:var(--warning-color,#ffa600); }
      .cc-p-sum.ok { color:var(--success-color,#43a047); }
      .cc-open { flex:none; cursor:pointer; border:none; border-radius:10px; padding:8px 14px; font-size:13px; font-weight:600; background:var(--pc-btn); color:#fff; text-decoration:none; }
      .cc-open:hover { filter:brightness(1.1); }
      .cc-p-list { display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:4px 10px; }
      .cc-p-row { display:flex; align-items:center; gap:8px; padding:5px 8px; border-radius:8px; border:none; background:transparent; color:var(--primary-text-color);
        cursor:pointer; text-align:left; font-size:12.5px; }
      .cc-p-row:hover { background:rgba(127,127,127,.12); }
      .cc-p-ico { width:18px; text-align:center; }
      .cc-p-lbl { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .cc-p-row.ok .cc-p-lbl { color:var(--secondary-text-color); }
      .cc-p-ok { color:var(--success-color,#43a047); font-weight:700; }
      .cc-p-n { font-weight:700; font-size:12px; padding:1px 8px; border-radius:999px; background:rgba(63,157,255,.16); color:var(--info-color,#3f9dff); }
      .cc-p-n.warn { background:rgba(255,166,0,.18); color:var(--warning-color,#ffa600); }
      .cc-p-n.info { background:rgba(127,127,127,.18); color:var(--primary-text-color); }
      .cc-links { display:flex; flex-wrap:wrap; gap:6px; padding-top:8px; border-top:1px dashed var(--divider-color); }
      .cc-link { cursor:pointer; border:1px solid var(--divider-color); background:var(--secondary-background-color,#2b2b2b); color:var(--primary-text-color);
        border-radius:999px; padding:4px 11px; font-size:12px; }
      .cc-link:hover { border-color:var(--primary-color,#3f9dff); }
      .care-page .cc-hero { align-items:center; padding-left:22px; }
      .cc-hero::before { display:none; }
      .care-page .cc-ring { width:72px; height:72px; }
      .care-page .cc-ring-in { width:58px; height:58px; }
      .care-page .cc-ring-in b { font-size:16px; }
      /* Pflegebedarf: Ring färbt sich nach Stufe, 0 % = grüner Ring */
      .cc-ring.lvl-ok { --c:var(--success-color,#43a047); --tr:rgba(67,160,71,.55); }
      .cc-ring.lvl-low { --c:#e6b800; --tr:rgba(230,184,0,.22); }
      .cc-ring.lvl-mid { --c:#ff8c1a; --tr:rgba(255,140,26,.22); }
      .cc-ring.lvl-high { --c:var(--error-color,#db4437); --tr:rgba(219,68,55,.22); }
      .cc-ring[class*="lvl-"] { background:conic-gradient(var(--c) calc(var(--p) * 1%), var(--tr) 0); }
      .cc-ring.lvl-ok .cc-ring-in b { color:var(--success-color,#43a047); }
      .cc-p-sum.lvl-ok { color:var(--success-color,#43a047); }
      .cc-p-sum.lvl-low { color:#d4a900; }
      .cc-p-sum.lvl-mid { color:#ff8c1a; }
      .cc-p-sum.lvl-high { color:var(--error-color,#db4437); }
      .cc-hero.lvl-ok { --sev:var(--success-color,#43a047); }
      .cc-hero.lvl-low { --sev:#e6b800; }
      .cc-hero.lvl-mid { --sev:#ff8c1a; }
      .cc-hero.lvl-high { --sev:var(--error-color,#db4437); }
      .cc-p-head { flex-wrap:wrap; }
      .cc-p-btns { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      .sc-why { padding:12px 2px 2px; border-top:1px dashed var(--divider-color); font-size:13px; animation:fadeIn .18s ease; }
      .care-page .sc-why { padding:16px 18px; margin-bottom:16px; border-top:none; }
      .sc-row { display:grid; grid-template-columns:20px minmax(0,1.6fr) minmax(0,1.3fr) 70px 58px; gap:8px; align-items:center; padding:4px 0; }
      .sc-row.sc-head { font-size:11.5px; text-transform:uppercase; letter-spacing:.03em; padding-bottom:2px; }
      .sc-row.ok .sc-lbl { color:var(--secondary-text-color); }
      .sc-lbl { overflow:hidden; text-overflow:ellipsis; }
      .sc-val { font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .sc-bar { height:7px; border-radius:99px; background:rgba(127,127,127,.18); overflow:hidden; }
      .sc-bar span { display:block; height:100%; border-radius:99px; background:var(--success-color,#43a047); }
      .sc-bar.lvl-mid span { background:#ff8c1a; }
      .sc-bar.lvl-high span { background:var(--error-color,#db4437); }
      .sc-bar.lvl-low span { background:#e6b800; }
      .sc-row.ok .sc-bar span { background:var(--success-color,#43a047); }
      .sc-pts { text-align:right; font-variant-numeric:tabular-nums; font-size:12px; font-weight:600; }
      .sc-total { margin-top:8px; padding-top:8px; border-top:1px solid var(--divider-color); }
      .sc-why .note { color:var(--secondary-text-color); font-size:12px; margin-top:8px; line-height:1.45; }
      @media (max-width:560px) { .sc-row { grid-template-columns:20px minmax(0,1fr) 54px; } .sc-val, .sc-bar, .sc-bar-h { display:none; } }
      details.section.cc-reports { margin:0 0 16px; }
      .f-help { margin:2px 0 10px; }
      .f-help > summary { cursor:pointer; font-size:13px; color:var(--secondary-text-color); padding:4px 0; }
      .f-help > summary:hover { color:var(--primary-text-color); }
      .f-help .dlg-explain { margin:6px 0 0; }
      .pk-clear { border:1px solid var(--divider-color); background:transparent; color:var(--secondary-text-color); border-radius:999px; font-size:12px; padding:3px 10px; cursor:pointer; }
      .pk-clear:hover { color:var(--primary-text-color); background:rgba(127,127,127,.14); }
      .dlg-preview.loading .table-wrap { opacity:.45; transition:opacity .2s; }
      .pv-loading { display:flex; flex-wrap:wrap; gap:4px 10px; align-items:baseline; font-size:13px; color:var(--info-color,#3f9dff); margin:6px 0; }
      .bk-space { margin-top:6px; }
      .ns-box { margin:10px 0; padding:10px 14px; border-radius:10px; font-size:13px; line-height:1.45; background:rgba(219,68,55,.08); border:1px solid rgba(219,68,55,.35); }
      .ns-title { font-weight:700; margin-bottom:4px; }
      .ns-box.ok { background:rgba(67,160,71,.08); border-color:rgba(67,160,71,.4); }
      .ns-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; padding:4px 0; border-bottom:1px solid var(--divider-color); }
      .ns-row .mono { flex:1; min-width:0; word-break:break-all; }
      .err-table tbody tr { cursor:pointer; }
      .err-table tbody tr:hover { background:rgba(127,127,127,.10); }
      .er-msg { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; word-break:break-word; }
      .err-table table { table-layout:fixed; width:100%; }
      .err-table th:nth-child(1) { width:13%; } .err-table th:nth-child(2) { width:22%; } .err-table th:nth-child(3) { width:7%; }
      .err-table th:nth-child(5) { width:17%; } .err-table th:nth-child(6) { width:48px; }
      .err-table td { overflow:hidden; }
      .err-table td .mono { word-break:break-all; }
      .er-kind { font-size:12px; word-break:break-word; }
      .er-go { padding:2px 10px; }
      .er-message { padding:10px 12px; border-radius:10px; background:var(--secondary-background-color,#2b2b2b); margin-bottom:10px; word-break:break-word; }
      .er-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:6px 16px; margin-bottom:12px; font-size:13px; }
      .er-kv { display:flex; flex-direction:column; gap:1px; min-width:0; }
      .er-kv span:last-child { word-break:break-word; }
      .er-diag ol { margin:0; padding-left:20px; font-size:13px; line-height:1.55; }
      .er-trace summary { cursor:pointer; font-size:13px; margin:8px 0 4px; }
      .cc-block { margin-bottom:16px; }
      .cc-block .cc-grid { padding:0; }
      .cc-tools { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:10px; }
      .cc-tool { display:flex; gap:12px; align-items:flex-start; text-align:left; cursor:pointer; padding:12px 14px; border-radius:12px;
        border:1px solid var(--divider-color); background:var(--secondary-background-color,#2b2b2b); color:var(--primary-text-color); }
      .cc-tool:hover { border-color:var(--primary-color,#3f9dff); transform:translateY(-1px); }
      .cc-tool-ico { font-size:22px; }
      .cc-tool-txt { display:flex; flex-direction:column; gap:2px; font-size:12.5px; line-height:1.4; }
      .cc-tool-txt b { font-size:13.5px; }
      /* ----- Fortschritt / Protokoll ----- */
      .jv { margin-top:8px; padding:12px 14px; border-radius:12px; background:var(--secondary-background-color,#2b2b2b); border:1px solid var(--divider-color); }
      .jv.done { border-color:rgba(67,160,71,.5); }
      .jv.error { border-color:rgba(219,68,55,.5); }
      .jv-head { display:flex; align-items:center; gap:10px; justify-content:space-between; }
      .jv-phase { font-weight:700; font-size:13.5px; }
      .jv-toggle { border:none; background:transparent; color:var(--primary-color,#3f9dff); cursor:pointer; font-size:12.5px; padding:2px 4px; }
      .jv-bar { height:8px; border-radius:6px; background:var(--divider-color); overflow:hidden; margin:10px 0 6px; position:relative; }
      .jv-bar > span { display:block; height:100%; background:var(--primary-color,#3f9dff); transition:width .6s ease; }
      .jv.done .jv-bar > span { background:var(--success-color,#43a047); }
      .jv.error .jv-bar > span { background:var(--error-color,#db4437); }
      .jv-bar.indet > span { position:absolute; animation:jvIndet 1.4s ease-in-out infinite; }
      @keyframes jvIndet { 0% { left:-30%; } 100% { left:100%; } }
      .jv-meta { font-size:12.5px; }
      .jv-term { margin:10px 0 0; max-height:220px; overflow:auto; padding:10px 12px; border-radius:8px; background:#0b0e12; color:#c9f2c9;
        font-family:var(--code-font-family,monospace); font-size:12px; line-height:1.55; white-space:pre-wrap; word-break:break-word; }
      .jv-term[hidden] { display:none; }
      .jv-hint { font-size:12px; margin-top:8px; line-height:1.45; }
      .job-pill { font-weight:600; }
      .job-pill[hidden] { display:none; }
      .job-pill.running { background:rgba(255,166,0,.30) !important; }
      .job-pill.done { background:rgba(67,160,71,.35) !important; }
      .job-pill.error { background:rgba(219,68,55,.40) !important; }
      .pv-ranges { display:flex; flex-direction:column; gap:2px; white-space:nowrap; font-size:12.5px; }
      .pv-range { display:flex; gap:6px; }
      .to-top { position:fixed; right:26px; bottom:26px; z-index:9999; width:46px; height:46px; border-radius:50%;
        border:none; cursor:pointer; background:var(--pc-btn); color:#fff; font-size:22px; line-height:1;
        box-shadow:0 4px 16px rgba(0,0,0,.38); opacity:0; transform:translateY(14px); pointer-events:none;
        transition:opacity .18s ease, transform .18s ease; display:flex; align-items:center; justify-content:center; }
      .to-top.show { opacity:.92; transform:translateY(0); pointer-events:auto; }
      .to-top:hover { opacity:1; box-shadow:0 6px 20px rgba(0,0,0,.45); }
    `;

    const bar = this._el("div", { class: "toolbar" }, [
      this._el("div", { class: "title" }, [
        this._el("span", { text: "HA Percyta" }),
        this._el("span", { class: "app-ver", attrs: { id: "app-ver" } }),
      ]),
      this._el("div", { class: "meta", attrs: { id: "meta" } }),
      this._el("button", { text: "⤓ MD", attrs: { id: "dl-md", title: this._t("dl_md_title") } }),
      this._el("button", { text: "⤓ HTML", attrs: { id: "dl-html", title: this._t("dl_html_title") } }),
      this._el("button", { class: "job-pill", attrs: { id: "job-pill", hidden: "", title: this._t("jv_title") } }),
      this._el("button", { text: this._t("rescan"), attrs: { id: "scan" } }),
      this._el("button", { class: "menu-btn", text: "☰", attrs: { id: "toggle-menu", title: this._t("sidebar_toggle"), "aria-label": this._t("sidebar_toggle") } }),
    ]);
    const content = this._el("div", { class: "content", attrs: { id: "content" } }, [
      this._el("div", { class: "status", text: this._t("loading") }),
    ]);
    const toTop = this._el("button", { class: "to-top", text: "↑", attrs: { id: "to-top", title: this._t("to_top"), "aria-label": this._t("to_top") } });

    this.shadowRoot.append(style, bar, content, toTop);
    this.shadowRoot.getElementById("scan").addEventListener("click", () => this._runScan());
    this.shadowRoot.getElementById("job-pill").addEventListener("click", () => this._jobDialog());
    this.shadowRoot.getElementById("dl-md").addEventListener("click", () => this._download("md"));
    this.shadowRoot.getElementById("dl-html").addEventListener("click", () => this._download("html"));
    this.shadowRoot.getElementById("toggle-menu").addEventListener("click", () => this._toggleHaMenu());
    toTop.addEventListener("click", () => this._scrollToTop());
    this.addEventListener("scroll", this._scrollHandler);
    const contentEl = this.shadowRoot.getElementById("content");
    contentEl.addEventListener("toggle", () => this._queueSaveView(), true);
    contentEl.addEventListener("click", (e) => {
      if (e.target && e.target.closest && e.target.closest(".why-btn")) this._queueSaveView();
    });
  }

  _scrollOffset(e) {
    let top = 0;
    const t = e && e.target;
    if (t && t.nodeType === 1 && typeof t.scrollTop === "number") top = t.scrollTop;
    const se = document.scrollingElement || document.documentElement;
    return Math.max(top, this.scrollTop || 0, (se && se.scrollTop) || 0, window.pageYOffset || 0);
  }

  _evaluateTopButton(e) {
    const btn = this.shadowRoot.getElementById("to-top");
    if (!btn) return;
    let show = this._scrollOffset(e) > 300;
    if (!show) {
      const anchor = this.shadowRoot.getElementById("top-anchor");
      if (anchor) show = anchor.getBoundingClientRect().top < -300;
    }
    btn.classList.toggle("show", show);
  }

  _scrollToTop() {
    const anchor = this.shadowRoot.getElementById("top-anchor");
    if (anchor && anchor.scrollIntoView) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    try { this.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
  }

  _toggleHaMenu() {
    this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  // Nur interne HA-Pfade (beginnen mit genau einem "/") – nie javascript:, data: o. Ä.
  _isInternalPath(path) {
    return typeof path === "string" && /^\/(?![\/\\])[^\s]*$/.test(path);
  }

  _navigate(path) {
    if (!this._isInternalPath(path)) return;
    try {
      history.pushState(null, "", path);
      window.dispatchEvent(new Event("location-changed"));
    } catch (e) {}
  }

  // Zieladresse für einen echten Link (Rechtsklick → „In neuem Tab öffnen“).
  _hrefFor(link) {
    if (!link || typeof link !== "string") return null;
    if (link.startsWith("#entity:")) return "/history?entity_id=" + encodeURIComponent(link.slice(8));
    if (link.startsWith("#")) return null;
    if (/^https?:\/\//i.test(link)) return link;
    return this._isInternalPath(link) ? link : null;
  }

  // Button als Link: Linksklick bleibt im Panel (wie bisher), Strg/Cmd-/Mittel-/Rechtsklick öffnet einen neuen Tab.
  _linkBtn(label, link, cls, before) {
    const href = this._hrefFor(link);
    const el = this._el(href ? "a" : "button", { class: cls, text: label, attrs: href ? { href, rel: "noopener noreferrer" } : { type: "button" } });
    el.addEventListener("click", (e) => {
      if (href && (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)) return; // Browser übernimmt (neuer Tab)
      e.preventDefault();
      if (before) before();
      this._openLink(link);
    });
    return el;
  }

  // Detail-Dialog einer Entität in Home Assistant öffnen (Einstellungen, Verlauf …).
  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  _copyBtn(text) {
    const b = this._el("button", { class: "copy-btn", attrs: { type: "button", title: this._t("copy_id"), "aria-label": this._t("copy_id") } });
    const icon = () => (window.customElements && customElements.get("ha-icon")
      ? (() => { const i = document.createElement("ha-icon"); i.setAttribute("icon", "mdi:content-copy"); return i; })()
      : this._el("span", { text: "⧉" }));
    b.appendChild(icon());
    b.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(text);
        b.classList.add("ok");
        b.replaceChildren(this._el("span", { text: "✓" }));
        setTimeout(() => { b.classList.remove("ok"); b.replaceChildren(icon()); }, 1500);
      } catch (err) {
        b.replaceChildren(this._el("span", { text: "⚠️" }));
      }
    });
    return b;
  }

  // ID in „Betroffene Objekte“: anklickbar (Entität → Detail-Dialog, Gerät/Bereich → HA-Seite) + Kopieren.
  _idCell(it, noLinks) {
    const ref = String(it.ref || "");
    if (!ref) return this._el("span", { class: "mono", text: "" });
    const missing = ["missing", "missing_device", "missing_area"].includes(it.issue);
    let link = null;
    if (!noLinks && !missing && it.kind !== "run" && it.kind !== "action") {
      if (it.kind === "device") link = "/config/devices/device/" + encodeURIComponent(ref);
      else if (it.kind === "area") link = "/config/areas/area/" + encodeURIComponent(ref);
      else if (/^[a-z0-9_]+\.[a-z0-9_]+$/.test(ref)) link = "#entity:" + ref;
    }
    const idEl = link ? this._linkBtn(ref, link, "mono id-link") : this._el("span", { class: "mono", text: ref });
    if (link) idEl.setAttribute("title", this._t(link.startsWith("#entity:") ? "open_entity" : "open_in_ha"));
    return this._el("span", { class: "id-cell" }, [idEl, this._copyBtn(ref)]);
  }

  _linkNum(n, path) {
    const el = this._el("span", { class: "link-num", text: String(n), attrs: { title: this._t("open_in_ha") } });
    el.addEventListener("click", () => this._navigate(path));
    return el;
  }

  _jumpTo(key) {
    // Aus einer Detail- oder Unterseite heraus erst zurück zum Bericht.
    if (this._page || this._detailId || this._resolvedKey) return this._goReport(key);
    const keys = String(key).split("+");
    this._suppressAccordion = true;
    keys.forEach((k) => {
      // Ziel und alle umschließenden Boxen öffnen (z. B. Custom Cards in "Speicher & System").
      let el = this.shadowRoot.getElementById("sec-" + k);
      while (el) {
        if (!el.open) el.open = true;
        el = el.parentElement ? el.parentElement.closest("details") : null;
      }
    });
    // Akkordeon: alle anderen Boxen schließen. Die „toggle“-Ereignisse kommen erst später
    // (auch die vom Neuaufbau) – sie dürfen das Ziel nicht wieder zuklappen.
    if (this._mode === "accordion") {
      const tops = new Set(keys.map((k) => this._topSectionOf(this.shadowRoot.getElementById("sec-" + k))).filter(Boolean));
      if (tops.size) {
        this._topSections().forEach((d) => { if (!tops.has(d) && d.open) d.open = false; });
        this._jumpTargets = tops;
        clearTimeout(this._jumpTimer);
        this._jumpTimer = setTimeout(() => { this._jumpTargets = null; }, 500);
      }
    }
    this._suppressAccordion = false;
    this._updateExpandAllLabel();
    const first = this.shadowRoot.getElementById("sec-" + keys[0]);
    if (first) requestAnimationFrame(() => first.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  _download(kind) {
    if (!this._data) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "");
    let blob, filename;
    if (kind === "md") {
      blob = new Blob([this._data.markdown || ""], { type: "text/markdown" });
      filename = `ha_percyta_report_${ts}.md`;
    } else {
      const styleText = this.shadowRoot.querySelector("style").textContent;
      const clone = this.shadowRoot.getElementById("content").cloneNode(true);
      clone.querySelectorAll(".filter, .viewbar, .reveal-btn, .secret-actions, .f-tools, .f-check, .f-go, .db-toolbar, .db-sel-bar, .audit-body, .copy-btn").forEach((n) => n.remove());
      clone.querySelectorAll(".secret-val[data-masked]").forEach((n) => (n.textContent = n.getAttribute("data-masked")));
      clone.querySelectorAll("[hidden]").forEach((el) => el.removeAttribute("hidden"));
      clone.querySelectorAll("details").forEach((d) => d.setAttribute("open", ""));
      clone.querySelectorAll("ha-icon").forEach((i) => {
        const span = document.createElement("span");
        span.className = "sec-ico emoji";
        span.textContent = i.dataset.emoji || "";
        i.replaceWith(span);
      });
      const html =
        `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">` +
        `<title>HA Percyta Report</title><style>` +
        `body{margin:0;background:#111418;color:#e1e1e1;` +
        `--card-background-color:#1c1f26;--secondary-background-color:#2b2f38;` +
        `--divider-color:#3a3f4b;--secondary-text-color:#9aa0aa;--primary-text-color:#e1e1e1;}` +
        styleText +
        `</style></head><body>${clone.outerHTML}</body></html>`;
      blob = new Blob([html], { type: "text/html" });
      filename = `ha_percyta_report_${ts}.html`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // onlyIfNew: nur übernehmen und neu zeichnen, wenn ein neuer Scan vorliegt.
  async _loadReport(onlyIfNew) {
    if (!this._hass) return false;
    try {
      const res = await this._hass.connection.sendMessagePromise({ type: "ha_percyta/report" });
      if (onlyIfNew && this._data && res && res.generated_at === this._data.generated_at) return false;
      this._data = res;
      this._error = null;
      this._loadCopies();
      if (!this._jobChecked) {
        this._jobChecked = true;
        this._ws({ type: "ha_percyta/job_status" }).then((r) => {
          if (r && r.job && r.job.status === "running") this._trackJob(r.job);
        });
      }
    } catch (err) {
      this._error = (err && err.message) || String(err);
    }
    this._render();
    return true;
  }

  // Nach einer Aktion: warten, bis Home Assistant neu gescannt hat, und dann den neuen
  // Stand zeigen (der Scan läuft im Hintergrund an; große Datenbanken brauchen etwas).
  // scan = true: Scan selbst anstoßen (Aktionen, die nicht über HA Percyta laufen).
  _refreshSoon(scan) {
    if (this._refreshRun) return this._refreshRun;
    this._refreshRun = (async () => {
      this._refreshing = true;
      this._updateMeta();
      try {
        if (scan) { try { await this._hass.callService("ha_percyta", "scan"); } catch (e) {} }
        const until = Date.now() + 120000;
        while (Date.now() < until && this.isConnected) {
          if (await this._loadReport(true)) break;
          await new Promise((r) => setTimeout(r, 2500));
        }
      } finally {
        this._refreshing = false;
        this._refreshRun = null;
        this._updateMeta();
      }
    })();
    return this._refreshRun;
  }

  _updateMeta() {
    const meta = this.shadowRoot && this.shadowRoot.getElementById("meta");
    if (!meta) return;
    const generated = this._data && this._data.generated_at;
    const base = generated ? this._t("as_of") + new Date(generated).toLocaleString() : "";
    meta.textContent = this._refreshing ? `${base}  ·  ${this._t("refreshing")}` : base;
    meta.classList.toggle("refreshing", !!this._refreshing);
  }

  // Percyta-Sicherungskopien (Datum, Größe) – für die Kachel „Letzte Percyta-Sicherung“.
  async _loadCopies() {
    const info = await this._ws({ type: "ha_percyta/db_info", ids: [] });
    const next = info && !info.error ? { sqlite: info.sqlite !== false, copies: info.copies || [] } : null;
    const changed = JSON.stringify(next) !== JSON.stringify(this._pcopies || null);
    this._pcopies = next;
    if (changed && this._data) this._render();
  }

  async _runScan() {
    const btn = this.shadowRoot.getElementById("scan");
    if (btn) { btn.setAttribute("disabled", ""); btn.textContent = this._t("scanning"); }
    try {
      await this._hass.callService("ha_percyta", "scan");
    } catch (e) {}
    // Kam der Scan-Wunsch kurz nach einem anderen Scan, startet HA ihn etwas später → abwarten.
    if (!(await this._loadReport(true))) await this._refreshSoon();
    if (btn) { btn.removeAttribute("disabled"); btn.textContent = this._t("rescan"); }
  }

  // ---------- Ansicht-Modus ----------
  _topSections() {
    return Array.from(this.shadowRoot.querySelectorAll(".sections > details.section"));
  }

  _setMode(mode) {
    this._mode = mode;
    try { window.localStorage.setItem(LS_MODE, mode); } catch (e) {}
    const seg = this.shadowRoot.querySelector(".segmented");
    if (seg) seg.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
    if (mode === "accordion") {
      const open = this._topSections().filter((d) => d.open);
      this._suppressAccordion = true;
      open.slice(1).forEach((d) => (d.open = false));
      this._suppressAccordion = false;
    }
  }

  _topSectionOf(el) {
    let t = el;
    while (t && t.parentElement && !t.parentElement.classList.contains("sections")) t = t.parentElement.closest("details");
    return t && t.parentElement ? t : null;
  }

  _onSectionToggle(details) {
    if (this._suppressAccordion) return;
    if (this._jumpTargets && !this._jumpTargets.has(details)) return; // Ereignis von vor dem Sprung
    if (this._mode !== "accordion" || !details.open) return;
    this._suppressAccordion = true;
    this._topSections().forEach((d) => { if (d !== details) d.open = false; });
    this._suppressAccordion = false;
    this._updateExpandAllLabel();
  }

  _updateExpandAllLabel() {
    const btn = this.shadowRoot.getElementById("expand-all");
    if (!btn) return;
    // Sobald mindestens eine Box offen ist, bietet der Button "Alle einklappen" an.
    const anyOpen = this._topSections().some((d) => d.open);
    btn.textContent = anyOpen ? this._t("collapse_all") : this._t("expand_all");
  }

  _toggleAll() {
    const sections = this._topSections();
    const anyOpen = sections.some((d) => d.open);
    this._suppressAccordion = true;
    sections.forEach((d) => (d.open = !anyOpen));
    this._suppressAccordion = false;
    this._updateExpandAllLabel();
  }

  _viewbar() {
    const seg = this._el("div", { class: "segmented" }, [
      this._el("button", { text: this._t("seg_single"), attrs: { "data-mode": "single", title: this._t("seg_single_t") } }),
      this._el("button", { text: this._t("seg_accordion"), attrs: { "data-mode": "accordion", title: this._t("seg_accordion_t") } }),
    ]);
    seg.querySelectorAll("button").forEach((b) => {
      if (b.dataset.mode === this._mode) b.classList.add("active");
      b.addEventListener("click", () => this._setMode(b.dataset.mode));
    });

    const input = this._el("input", { attrs: { type: "text", placeholder: this._t("search_ph"), value: this._search, id: "global-search" } });
    const clearBtn = this._el("button", { class: "vs-clear", text: "×", attrs: { title: this._t("search_clear") } });
    input.addEventListener("input", (e) => {
      this._search = (e.target.value || "").toLowerCase();
      clearBtn.classList.toggle("show", !!this._search);
      this._applySearch();
    });
    clearBtn.addEventListener("click", () => {
      this._search = "";
      input.value = "";
      clearBtn.classList.remove("show");
      this._applySearch();
      input.focus();
    });
    if (this._search) clearBtn.classList.add("show");
    const search = this._el("div", { class: "vb-search" }, [
      this._el("span", { class: "vs-icon", text: "🔍" }),
      input,
      clearBtn,
    ]);

    const widthBtn = this._el("button", { class: "vb-btn", attrs: { id: "width-toggle", title: this._t("width_t") } });
    widthBtn.addEventListener("click", () => this._setWidth(this._width === "narrow" ? "full" : "narrow"));

    const expandBtn = this._el("button", { class: "vb-btn", text: this._t("expand_all"), attrs: { id: "expand-all" } });
    expandBtn.addEventListener("click", () => this._toggleAll());

    return this._el("div", { class: "viewbar" }, [search, seg, widthBtn, expandBtn]);
  }

  _applyWidth() {
    const content = this.shadowRoot.getElementById("content");
    if (content) content.classList.toggle("narrow", this._width === "narrow");
    const btn = this.shadowRoot.getElementById("width-toggle");
    if (btn) btn.textContent = this._width === "narrow" ? this._t("width_wide") : this._t("width_narrow");
  }

  _setWidth(w) {
    this._width = w;
    try { window.localStorage.setItem(LS_WIDTH, w); } catch (e) {}
    this._applyWidth();
  }

  // ---------- Globale Suche ----------
  _rowMatches(tr) {
    if (!this._search) return true;
    let text = "";
    for (const td of tr.children) {
      if (td.classList && td.classList.contains("nosrch")) continue;
      text += " " + (td.textContent || "");
    }
    return text.toLowerCase().includes(this._search);
  }

  _setCount(det, n) {
    const pill = det.querySelector(".sec-count");
    if (!pill) return;
    if (det.dataset.origCount == null) det.dataset.origCount = pill.textContent;
    pill.textContent = String(n);
  }

  _restoreCount(det) {
    const pill = det.querySelector(".sec-count");
    if (!pill) return;
    if (det.dataset.origCount != null) {
      pill.textContent = det.dataset.origCount;
      delete det.dataset.origCount;
    }
  }

  _applySearch() {
    const q = this._search;
    this._suppressAccordion = true;
    for (const det of this._topSections()) {
      const bodies = det.querySelectorAll("tbody");
      if (!bodies.length) { det.hidden = !!q; continue; }
      let matches = 0;
      bodies.forEach((tb) =>
        tb.querySelectorAll("tr").forEach((tr) => {
          const m = this._rowMatches(tr);
          tr.hidden = !m;
          if (m) matches++;
        })
      );
      if (q) {
        det.hidden = matches === 0;
        if (matches > 0) det.open = true;
        this._setCount(det, matches);
        det.querySelectorAll("details.section").forEach((sub) => {
          const any = Array.from(sub.querySelectorAll("tbody tr")).some((tr) => !tr.hidden);
          if (any) sub.open = true;
        });
      } else {
        det.hidden = false;
        this._restoreCount(det);
      }
    }
    this._suppressAccordion = false;
    this.shadowRoot.querySelectorAll(".sec-group").forEach((g) => {
      g.hidden = !!q && !Array.from(g.querySelectorAll(".sections > details.section")).some((det) => !det.hidden);
    });
    this._updateExpandAllLabel();
  }

  // Schlüssel einer (auch verschachtelten) Box: IDs bzw. Titel entlang der Hierarchie.
  _detailsKey(det) {
    const parts = [];
    let el = det;
    while (el) {
      const title = el.querySelector(":scope > summary .sec-title");
      parts.unshift(el.id || (title ? title.textContent : "?"));
      el = el.parentElement ? el.parentElement.closest("details") : null;
    }
    return parts.join(" > ");
  }

  // Merkt sich die aktuelle Ansicht (offene Boxen, Scroll-Position, Erklär-Card).
  _captureView(content) {
    if (!content.querySelector(".sections")) return null;
    const open = {};
    content.querySelectorAll("details").forEach((det) => (open[this._detailsKey(det)] = det.open));
    const scroll = [];
    let node = content;
    while (node) {
      if (node.nodeType === 1 && node.scrollTop > 0) scroll.push([node, node.scrollTop]);
      node = node.parentNode || node.host;
    }
    const se = document.scrollingElement;
    if (se && se.scrollTop > 0 && !scroll.some((x) => x[0] === se)) scroll.push([se, se.scrollTop]);
    const why = content.querySelector(".risk-why");
    return { open, scroll, why: !!why && !why.hidden };
  }

  _restoreView(content, view) {
    if (!view) return;
    this._suppressAccordion = true;
    content.querySelectorAll("details").forEach((det) => {
      const key = this._detailsKey(det);
      if (key in view.open) det.open = view.open[key];
    });
    this._suppressAccordion = false;
    if (view.why) {
      const why = content.querySelector(".risk-why");
      const btn = content.querySelector(".why-btn");
      if (why && why.hidden && btn) btn.click();
    }
    view.scroll.forEach(([el, top]) => { el.scrollTop = top; });
  }

  _render() {
    const content = this.shadowRoot.getElementById("content");
    const meta = this.shadowRoot.getElementById("meta");
    // Bei einer Aktualisierung (z. B. Scan im Hintergrund) bleibt die Ansicht erhalten.
    // Beim ersten Aufbau (z. B. nach Rückkehr von einer anderen HA-Seite) gilt die gespeicherte Ansicht.
    const view = this._captureView(content) || this._storedView;
    this._tableSeq = {};
    content.replaceChildren();
    this._hideSecrets();

    const ver = this._data && this._data.version;
    const av = this.shadowRoot.getElementById("app-ver");
    if (av) av.textContent = ver ? "v" + ver : "";

    if (this._error) {
      content.appendChild(this._el("div", { class: "empty", text: "⚠️ " + this._t("load_error") + this._error }));
      return;
    }

    const d = this._data && this._data.data;
    const generated = this._data && this._data.generated_at;
    meta.textContent = generated ? this._t("as_of") + new Date(generated).toLocaleString() : "";
    if (this._refreshing) this._updateMeta();

    content.appendChild(this._el("div", { attrs: { id: "top-anchor" }, style: "position:absolute;top:0;height:1px;width:1px" }));

    if (!d) {
      this._detailId = null;
      this._resolvedKey = null;
      this._page = null;
      content.appendChild(
        this._el("div", { class: "empty" }, [
          this._el("div", { style: "font-size:40px;margin-bottom:10px", text: "🛡️" }),
          this._el("div", { text: this._t("no_result") }),
          this._el("div", { class: "muted", style: "margin-top:6px", text: this._t("press_rescan") }),
        ])
      );
      return;
    }

    // Detailansicht eines Befunds ersetzt den Bericht (Ansicht des Berichts bleibt gemerkt).
    const dlHtml = this.shadowRoot.getElementById("dl-html");
    if (dlHtml) dlHtml.hidden = !!(this._detailId || this._resolvedKey || this._page);
    if (this._page === "care") {
      content.appendChild(this._carePage(d));
      return;
    }
    if (this._resolvedKey) {
      const r = (d.findings_resolved || []).find((x) => this._resKey(x) === this._resolvedKey);
      content.appendChild(r ? this._resolvedView(d, r) : this._goneView());
      return;
    }
    if (this._detailId) {
      const found = (d.findings || []).find((x) => x.id === this._detailId);
      content.appendChild(found ? this._detailView(d, found) : this._goneView());
      return;
    }

    const c = d.counts || {};

    content.appendChild(this._el("h1", { class: "report-title" }, [
      this._logoNode(),
      this._el("span", { text: "Permissions, Privacy & Data" }),
    ]));
    const subline = [
      this._el("span", { text: "HA " + (d.ha_version || "?") }),
      this._el("span", { class: "sup-badge" + (d.is_supervisor ? "" : " off"), text: d.is_supervisor ? "Supervisor" : "HA Core" }),
    ];
    const newGroups = this._newGroups(d);
    const newCount = newGroups.reduce((sum, g) => sum + g.names.length, 0) || c.new_total || 0;
    let newPanel = null;
    if (newCount > 0) {
      const summary = newGroups
        .map((g) => `${g.names.length} ${this._t("nt_" + g.key + (g.names.length === 1 ? "_1" : "_n"))}`)
        .join(", ");
      const badge = this._el("span", {
        class: "new-badge" + (newGroups.length ? " clickable" : ""),
        text: this._ti("new_since", { n: newCount }) + (summary ? ": " + summary : ""),
        attrs: newGroups.length ? { title: this._t("new_toggle_t") } : {},
      });
      subline.push(badge);
      if (newGroups.length) {
        newPanel = this._newPanel(newGroups);
        newPanel.hidden = this._newOpen === false;
        badge.addEventListener("click", () => {
          this._newOpen = newPanel.hidden;
          newPanel.hidden = !newPanel.hidden;
        });
      }
    }
    content.appendChild(this._el("div", { class: "subline" }, subline));
    const backupLine = this._backupLine(d);
    if (backupLine) content.appendChild(backupLine);
    if (newPanel) content.appendChild(newPanel);

    const grid = this._el("div", { class: "stat-grid kpi" });
    grid.append(
      this._statCard("🖥️", c.total_devices || 0, this._t("k_devices")),
      this._statCard("🔢", c.total_entities || 0, this._t("k_entities")),
      this._statCard("📦", c.integrations || 0, this._t("k_integrations"), "", "integrations"),
      this._statCard("🧩", c.addons || 0, this._t("k_apps"), "", "addons"),
      this._statCard("🃏", c.custom_cards || 0, this._t("k_cards"), "", "cards"),
      this._statCard("📐", c.blueprints || 0, this._t("k_blueprints"), "", "blueprints"),
      this._statCard("👤", c.users || 0, this._t("k_users"), "", "users"),
      this._statCard("🔑", c.tokens || 0, this._t("k_tokens"), "", "tokens")
    );
    content.appendChild(grid);

    // Kopf: Risiko & Datenschutz links, Pflege-Center-Vorschau rechts.
    content.appendChild(this._el("div", { class: "hero-grid" }, [this._riskDistribution(d), this._carePreview(d)]));
    content.appendChild(this._viewbar());

    const systemSection = this._sectionSystem(d);
    const defs = [
      ["system", systemSection],
      ["inventory", this._sectionInventory(d)],
      ["findings", this._sectionFindings(d)],
      ["database", this._sectionDatabase(d)],
      ["integrations", this._sectionIntegrations(d)],
      ["addons", this._sectionAddons(d)],
      ["sysaccess", this._sectionSystemAccess(d)],
      ["cloud", this._sectionCloud(d)],
      ["secrets", this._sectionSecrets(d)],
      ["users", this._sectionUsers(d)],
      ["tokens", this._sectionTokens(d)],
    ];
    // Ohne System-Box (keine System-Daten) bleiben Custom Cards/Blueprints eigene Boxen.
    if (!systemSection) defs.push(["cards", this._sectionCards(d)], ["blueprints", this._sectionBlueprints(d)]);
    if ((d.errors || []).length) defs.push(["errors", this._sectionErrors(d)]);
    // Boxen als kompakte Zeilen in Gruppen (Icon · Titel · Kernaussage · Status).
    const nodes = {};
    for (const [key, node] of defs) {
      if (!node) continue;
      node.id = "sec-" + key;
      this._decorateSection(node, key, d);
      if (!view) node.open = false; // erster Aufbau: alles zugeklappt – die Zeilen sind die Übersicht
      nodes[key] = node;
    }
    const groups = this._el("div", { class: "sec-groups" });
    SECTION_GROUPS.forEach(([gKey, keys]) => {
      const list = keys.filter((k) => nodes[k]).map((k) => nodes[k]);
      if (!list.length) return;
      groups.appendChild(this._el("div", { class: "sec-group", attrs: { "data-group": gKey } }, [
        this._el("div", { class: "sec-group-title", text: this._t(gKey) }),
        this._el("div", { class: "sections grouped" }, list),
      ]));
    });
    content.appendChild(groups);

    this._topSections().forEach((det) =>
      det.addEventListener("toggle", () => {
        this._onSectionToggle(det);
        this._updateExpandAllLabel();
      })
    );
    this._restoreView(content, view);
    this._setMode(this._mode);
    this._applyWidth();
    if (this._search) this._applySearch();
    this._updateExpandAllLabel();
    if (view) view.scroll.forEach(([el, top]) => { el.scrollTop = top; });
  }

  _icon(mdi, emoji) {
    if (mdi && window.customElements && customElements.get("ha-icon")) {
      const i = document.createElement("ha-icon");
      i.setAttribute("icon", mdi);
      i.className = "sec-ico";
      i.dataset.emoji = emoji || "";
      return i;
    }
    return this._el("span", { class: "sec-ico emoji", text: emoji || "•" });
  }

  // Kopfzeile einer Box im Listen-Layout: Icon · Titel · Kernaussage · Status-Badge.
  _decorateSection(det, key, d) {
    const sum = det.querySelector(":scope > summary");
    if (!sum) return;
    const titleEl = sum.querySelector(".sec-title");
    const countEl = sum.querySelector(".sec-count");
    const raw = titleEl ? titleEl.textContent : "";
    const m = raw.match(/^(\S+)\s+(.*)$/);
    const hasEmoji = !!m && !/[A-Za-z0-9ÄÖÜäöü]/.test(m[1]);
    const emoji = hasEmoji ? m[1] : "";
    const title = hasEmoji ? m[2] : raw;
    let meta = {};
    try { meta = this._sectionMeta(key, d) || {}; } catch (e) { meta = {}; }
    const badgeText = meta.badge != null ? String(meta.badge) : (countEl ? countEl.textContent : null);
    const parts = [
      this._icon(SECTION_ICONS[key], emoji),
      this._el("span", { class: "sec-title", text: title }),
      this._el("span", { class: "sec-sub", text: meta.sub || "" }),
    ];
    if (badgeText != null && badgeText !== "") parts.push(this._el("span", { class: "sec-count lvl-" + (meta.lvl || "none"), text: badgeText }));
    sum.replaceChildren(...parts);
    det.classList.add("sec-row");
  }

  // Kernaussage und Status je Box (aus den Scan-Daten).
  _sectionMeta(key, d) {
    const c = d.counts || {};
    const n = (x) => this._fmtInt(x || 0);
    const pct = (x) => (x == null ? "—" : Number(x).toLocaleString(this._lang(), { maximumFractionDigits: 0 }) + " %");
    const ints = d.integrations || [];
    const risk = (list, lvl) => list.filter((i) => (i.analysis || {}).risk_level === lvl).length;
    switch (key) {
      case "integrations": {
        const high = risk(ints, "high"), med = risk(ints, "medium");
        return { sub: this._ti("sm_integrations", { n: n(ints.length), c: n(ints.filter((i) => i.is_custom).length) }),
          badge: high ? `${high} high` : med ? `${med} medium` : "ok", lvl: high ? "bad" : med ? "warn" : "ok" };
      }
      case "addons": {
        const list = d.addons || [];
        const high = risk(list, "high");
        return { sub: this._ti("sm_installed", { n: n(list.length) }), badge: high ? `${high} high` : "ok", lvl: high ? "bad" : "ok" };
      }
      case "sysaccess": {
        const k = ints.filter((i) => ((i.analysis || {}).system_access || []).length).length;
        return { sub: this._ti("sm_sysaccess", { n: n(k) }), badge: n(k), lvl: "none" };
      }
      case "cloud": {
        const list = ints.filter((i) => (i.analysis || {}).has_external_access);
        const names = list.slice(0, 3).map((i) => i.title || i.domain).join(", ") + (list.length > 3 ? " …" : "");
        return { sub: list.length ? names : this._t("sm_none"), badge: n(list.length), lvl: list.length ? "info" : "ok" };
      }
      case "secrets": {
        const k = ints.filter((i) => ((i.analysis || {}).secrets || []).length).length;
        const total = c.secrets_found || 0;
        return { sub: k ? this._ti("sm_secrets", { n: n(k) }) : this._t("sm_none"), badge: n(total), lvl: total ? "warn" : "ok" };
      }
      case "users": {
        const list = (d.users || []).filter((u) => !u.system_generated);
        const admins = list.filter((u) => u.is_owner || (u.groups || []).includes("system-admin")).length;
        return { sub: this._ti("sm_users", { a: n(admins), u: n(list.length) }), badge: n(list.length), lvl: "none" };
      }
      case "tokens": {
        const list = d.tokens || [];
        const stale = c.stale_tokens || 0;
        return { sub: this._ti("sm_tokens", { l: n(list.filter((t) => t.is_long_lived).length), s: n(stale) }),
          badge: stale ? n(stale) : n(list.length), lvl: stale ? "bad" : "none" };
      }
      case "system": {
        const sys = d.system || {};
        const disk = (sys.disk || {}).percent;
        return { sub: this._ti("sm_system", { r: pct((sys.ram || {}).percent), c: pct((sys.cpu || {}).percent) }),
          badge: pct(disk), lvl: disk == null ? "none" : disk >= 90 ? "bad" : disk >= 80 ? "warn" : "ok" };
      }
      case "inventory": {
        const inv = d.inventory || {};
        const upd = (inv.updates || []).length;
        return { sub: this._ti("sm_inventory", { a: n(inv.automations), u: n(inv.unavailable) }),
          badge: upd ? this._ti(upd === 1 ? "sm_update1" : "sm_updates", { n: n(upd) }) : "ok", lvl: upd ? "info" : "ok" };
      }
      case "findings": {
        const open = (d.findings || []).filter((f) => f.status === "open");
        const by = (sv) => open.filter((f) => f.severity === sv).length;
        const h = by("high"), md = by("medium");
        return { sub: this._ti("sm_findings", { h: n(h), m: n(md), l: n(by("low") + by("info")) }),
          badge: n(open.length), lvl: h ? "bad" : md ? "warn" : open.length ? "info" : "ok" };
      }
      case "database": {
        const db = d.database || {};
        const file = (((d.system || {}).storage || {}).breakdown || []).find((x) => x.type === "db");
        if (db.pending) return { sub: this._t("sm_db_pending"), badge: file ? this._fmtBytes(file.bytes) : null, lvl: "none" };
        const rows = (db.states_total || 0) + (db.statistics_long_total || 0) + (db.statistics_short_total || 0);
        return { sub: this._ti("sm_database", { r: this._fmtCompact(rows), o: n(db.orphans_total) }),
          badge: file ? this._fmtBytes(file.bytes) : null, lvl: db.orphans_total ? "warn" : "none" };
      }
      case "errors": {
        const list = d.errors || [];
        const last = list.map((e) => e.timestamp).filter(Boolean).sort().pop();
        return { sub: last ? this._ti("sm_errors", { a: this._ago(new Date(last)) }) : "", badge: n(list.length), lvl: list.length ? "bad" : "ok" };
      }
      case "cards": case "blueprints": {
        const list = (key === "cards" ? d.custom_cards : d.blueprints) || [];
        const size = list.reduce((a, x) => a + (x.size_bytes || 0), 0);
        return { sub: size ? this._fmtBytes(size) : "", badge: n(list.length), lvl: "none" };
      }
      default:
        return {};
    }
  }

  _riskDistribution(d) {
    const items = (d.integrations || []).concat((d.addons || []).map((a) => ({ analysis: a.analysis })));
    const high = items.filter((i) => i.analysis.risk_level === "high").length;
    const medium = items.filter((i) => i.analysis.risk_level === "medium").length;
    const low = items.length - high - medium;
    const total = items.length || 1;
    const pct = (n) => (n / total) * 100 + "%";

    const bar = this._el("div", { class: "riskbar" }, [
      this._el("span", { class: "b-high", style: `width:${pct(high)}` }),
      this._el("span", { class: "b-medium", style: `width:${pct(medium)}` }),
      this._el("span", { class: "b-low", style: `width:${pct(low)}` }),
    ]);
    const legend = this._el("div", { class: "legend" }, [
      this._el("span", {}, [this._el("i", { class: "dot high" }), this._el("span", { text: `High (${high})` })]),
      this._el("span", {}, [this._el("i", { class: "dot medium" }), this._el("span", { text: `Medium (${medium})` })]),
      this._el("span", {}, [this._el("i", { class: "dot low" }), this._el("span", { text: `Low (${low})` })]),
    ]);

    const whyBtn = this._el("button", { class: "why-btn", text: this._t("why") });
    const explain = this._riskExplain(d, { high, medium, low });
    explain.hidden = true;
    whyBtn.addEventListener("click", () => {
      explain.hidden = !explain.hidden;
      whyBtn.classList.toggle("active", !explain.hidden);
      whyBtn.textContent = explain.hidden ? this._t("why") : this._t("why_hide");
    });

    // Sicherheits-Kennzahlen kompakt im selben Kasten (früher eigene Kachelreihe).
    const c = d.counts || {};
    // Nur Sicherheits- & Datenschutz-Befunde – alle anderen Befunde stehen im Pflege-Center.
    const secOpen = (d.findings || []).filter((f) => f.status === "open" && f.category === "security");
    const open = secOpen.length;
    const fcls = open === 0 ? "ok" : secOpen.some((f) => f.severity === "high") ? "bad" : "warn";
    const mini = [
      ["🔴", this._t("k_high"), c.high_risk || 0, c.high_risk ? "bad" : "ok", "integrations+addons"],
      ["🟡", this._t("k_medium"), c.medium_risk || 0, c.medium_risk ? "warn" : "ok", "integrations+addons"],
      ["🧭", this._t("k_secfind"), open, fcls, "findings"],
      ["🔐", this._t("k_secrets"), c.secrets_found || 0, c.secrets_found ? "warn" : "ok", "secrets"],
      ["☁️", this._t("k_cloud"), c.cloud || 0, c.cloud ? "info" : "ok", "cloud"],
      ["🗝️", this._t("k_stale"), c.stale_tokens || 0, c.stale_tokens ? "bad" : "ok", "tokens"],
    ];
    const list = this._el("div", { class: "cc-p-list rk-list" }, mini.map(([icon, label, n, cls, target]) => {
      const row = this._el("button", { class: "cc-p-row" + (cls === "ok" ? " ok" : ""), attrs: { type: "button", title: this._t("jump_title") } }, [
        this._el("span", { class: "cc-p-ico", text: icon }),
        this._el("span", { class: "cc-p-lbl", text: label }),
        cls === "ok" && !n ? this._el("span", { class: "cc-p-ok", text: "✓" }) : this._el("span", { class: "cc-p-n " + cls, text: String(n) }),
      ]);
      row.addEventListener("click", () => (target === "findings" ? this._showFindings("security") : this._jumpTo(target)));
      return row;
    }));

    return this._el("div", { class: "riskbar-card rk-card" }, [
      this._el("div", { class: "cc-p-head" }, [
        this._el("div", { class: "rk-shield", text: "🛡️" }),
        this._el("div", { class: "cc-p-title" }, [
          this._el("div", { class: "cc-p-name", text: this._t("rk_title") }),
          this._el("div", { class: "muted small", text: `${this._t("riskdist")} · ${items.length} ${this._t("total")}` }),
        ]),
        whyBtn,
      ]),
      bar,
      legend,
      list,
      explain,
    ]);
  }

  _riskExplain(d, counts) {
    const ints = d.integrations || [];
    const highI = ints.filter((i) => i.analysis.risk_level === "high");
    const medI = ints.filter((i) => i.analysis.risk_level === "medium");
    const rx = /Root|System|Supervisor/;
    const f = {
      gps: highI.filter((i) => i.analysis.has_gps).length,
      cam: highI.filter((i) => i.analysis.has_camera).length,
      root: highI.filter((i) => (i.analysis.system_access || []).some((s) => rx.test(s))).length,
      appsHigh: (d.addons || []).filter((a) => a.analysis.risk_level === "high").length,
      ext: medI.filter((i) => i.analysis.has_external_access).length,
      sec: medI.filter((i) => i.analysis.has_secrets).length,
      sys: medI.filter((i) => (i.analysis.system_access || []).length && !i.analysis.has_external_access && !i.analysis.has_secrets).length,
    };

    const critRow = (level, label, text) =>
      this._el("div", { class: "crit-row" }, [
        this._el("span", { class: `cdot ${level}` }),
        this._el("div", {}, [this._el("b", { text: label + ": " }), this._el("span", { text })]),
      ]);
    const chips = (pairs) => {
      const nodes = pairs.filter((p) => p[1] > 0).map((p) => this._chip(`${p[0]} ×${p[1]}`, p[2]));
      return nodes.length ? nodes : [this._el("span", { class: "muted", text: "—" })];
    };
    const curLine = (dotCls, label, count, chipNodes) =>
      this._el("div", { class: "cur-line" }, [
        this._el("i", { class: `dot ${dotCls}` }),
        this._el("b", { text: `${label} (${count}):` }),
        ...chipNodes,
      ]);

    const parts = [
      this._el("div", { class: "muted", style: "margin-bottom:4px", text: this._t("why_intro") }),
      critRow("high", "🔴 High", this._t("crit_high")),
      critRow("medium", "🟡 Medium", this._t("crit_medium")),
      critRow("low", "🟢 Low", this._t("crit_low")),
      this._el("div", { class: "cur" }, [
        this._el("div", { class: "muted", style: "margin-bottom:2px", text: this._t("cur_intro") }),
        curLine("high", "High", counts.high,
          chips([["GPS", f.gps, "danger"], [this._t("f_cam"), f.cam, "danger"], ["Root/System", f.root, "danger"], [this._t("k_apps"), f.appsHigh, "danger"]])),
        curLine("medium", "Medium", counts.medium,
          chips([[this._t("f_ext"), f.ext, "info"], ["Secrets", f.sec, "warn"], [this._t("f_sysrel"), f.sys, "warn"]])),
        curLine("low", "Low", counts.low, [this._el("span", { class: "muted", text: this._t("low_none") })]),
      ]),
    ];
    if (highI.length) {
      parts.push(
        this._el("div", { class: "cur-line" }, [
          this._el("b", { text: this._t("examples_high") }),
          ...highI.slice(0, 5).map((i) => this._chip(i.domain, "danger")),
          highI.length > 5 ? this._el("span", { class: "muted", text: `+${highI.length - 5} ${this._t("more")}` }) : null,
        ])
      );
    }
    parts.push(this._el("div", { class: "note", text: this._t("why_note") }));
    return this._el("div", { class: "risk-why" }, parts);
  }

  _sysCard(icon, label, value, sub, percent, path) {
    const card = this._el("div", { class: "sys-card" + (path ? " clickable" : ""), attrs: path ? { title: this._t("open_in_ha") } : {} }, [
      this._el("div", { class: "lbl" }, [this._el("span", { text: icon }), this._el("span", { text: label })]),
      this._el("div", { class: "val", text: value }),
      sub ? this._el("div", { class: "sub", text: sub }) : null,
      percent != null ? this._meter(percent) : null,
    ]);
    if (path) card.addEventListener("click", () => this._navigate(path));
    return card;
  }

  _fmtInt(n) {
    if (n == null || isNaN(n)) return "—";
    try { return Number(n).toLocaleString(this._lang()); } catch (e) { return String(n); }
  }

  _sectionSystem(d) {
    const sys = d.system;
    if (!sys || (!sys.disk && !sys.ram && !sys.cpu)) return null;
    const disk = sys.disk || {}, ram = sys.ram || {}, swap = sys.swap || {}, cpu = sys.cpu || {}, load = sys.load || {}, storage = sys.storage || {};

    const addonRam = (d.addons || []).reduce((s, a) => s + ((a.stats && a.stats.memory_usage) || 0), 0);
    const ramSub = `${this._fmtBytes(ram.used)} / ${this._fmtBytes(ram.total)}` + (addonRam > 0 ? `  ·  ${this._t("apps_ram")}${this._fmtBytes(addonRam)}` : "");

    const cards = this._el("div", { class: "sys-cards" });
    cards.append(
      this._sysCard("🖴", this._t("c_disk_used"), this._pct(disk.percent), `${this._fmtBytes(disk.used)} / ${this._fmtBytes(disk.total)}`, disk.percent),
      this._sysCard("🟢", this._t("c_disk_free"), this._fmtBytes(disk.free), disk.source ? this._t("src") + disk.source : "", null),
      this._sysCard("🧠", this._t("c_ram"), this._pct(ram.percent), ramSub, ram.percent),
      this._sysCard("⚙️", this._t("c_cpu"), this._pct(cpu.percent),
        (cpu.count ? cpu.count + " " + this._t("cores") : "") + (load && load["1m"] != null ? `  ·  Load ${load["1m"]}/${load["5m"]}/${load["15m"]}` : ""),
        cpu.percent)
    );
    const parts = [cards];

    if (swap && swap.total) {
      parts.push(this._el("div", { class: "muted", style: "padding:6px 14px 2px;font-size:12.5px",
        text: `${this._t("swap")}${this._fmtBytes(swap.used)} / ${this._fmtBytes(swap.total)} (${this._pct(swap.percent)})` }));
      parts.push(this._el("div", { class: "swap-expl", text: this._t("swap_expl") }));
    }

    const cats = (sys.disk_categories || {}).children || [];
    if (cats.length) {
      const maxUsed = cats.reduce((m, x) => Math.max(m, x.used || 0), 0) || 1;
      const rows = cats.map((cat) => [
        cat.label || cat.id || "?",
        { text: this._fmtBytes(cat.used), sort: cat.used || 0 },
        { node: this._el("div", { class: "bar-cell" }, [this._meter(this._sharePct(cat.used, maxUsed), "ok")]), sort: cat.used || 0 },
      ]);
      parts.push(this._el("div", { class: "sub-head", text: this._t("sub_categories") }));
      parts.push(this._table([this._t("th_category"), this._t("th_used"), this._t("th_share")], rows, { sortIdx: 1, sortDir: "desc" }));
    }

    const breakdown = storage.breakdown || [];
    if (breakdown.length) {
      const maxRef = breakdown.reduce((m, i) => Math.max(m, i.bytes || 0), 0) || 1;
      const rows = breakdown.map((it) => [
        it.name || "?",
        { text: this._fmtBytes(it.bytes), sort: it.bytes || 0 },
        { node: this._el("div", { class: "bar-cell" }, [this._meter(this._sharePct(it.bytes, maxRef), "ok")]), sort: it.bytes || 0 },
      ]);
      parts.push(this._el("div", { class: "sub-head", text: this._t("sub_consumers") }));
      parts.push(this._table([this._t("th_area"), this._t("th_size"), this._t("th_share")], rows, { sortIdx: 1, sortDir: "desc" }));
    }

    const custom = storage.custom_integrations || [];
    if (custom.length) {
      const rows = custom.map((it) => [
        this._el("span", { class: "mono", text: it.domain }),
        { text: this._fmtBytes(it.bytes), sort: it.bytes || 0 },
      ]);
      parts.push(this._section(this._t("sub_custom_int"), custom.length, this._table([this._t("th_integration"), this._t("th_size")], rows, { sortIdx: 1, sortDir: "desc" })));
    }

    const addonRows = (d.addons || []).filter((a) => (a.stats && Object.keys(a.stats).length) || a.size_bytes != null);
    if (addonRows.length) {
      const hasSize = addonRows.some((a) => a.size_bytes != null);
      const rows = addonRows.map((a) => {
        const s = a.stats || {};
        let ram_txt = this._fmtBytes(s.memory_usage);
        if (s.memory_limit) ram_txt += " / " + this._fmtBytes(s.memory_limit);
        const row = [
          a.name,
          { text: s.cpu_percent != null ? Number(s.cpu_percent).toFixed(1) + " %" : "—", sort: s.cpu_percent || 0 },
          { text: ram_txt, sort: s.memory_usage || 0 },
        ];
        if (hasSize) row.push(a.size_bytes != null ? { text: this._fmtBytes(a.size_bytes), sort: a.size_bytes } : { text: "—", sort: -1 });
        return row;
      });
      const headers = [this._t("th_app"), "CPU", "RAM"];
      if (hasSize) headers.push(this._t("th_app_size"));
      const body = this._el("div", {}, [
        this._table(headers, rows, { sortIdx: 2, sortDir: "desc" }),
        hasSize ? this._el("div", { class: "hint-line", text: this._t("app_size_hint") }) : null,
      ]);
      parts.push(this._section(this._t("sub_app_res"), addonRows.length, body));
    }

    // Custom Cards und Blueprints als aufklappbare Tabellen (wichtigste Info: Speichergröße).
    for (const [key, node] of [["cards", this._sectionCards(d)], ["blueprints", this._sectionBlueprints(d)]]) {
      node.id = "sec-" + key;
      parts.push(node);
    }

    return this._section(this._t("sec_system"), null, this._el("div", {}, parts), true);
  }

  _sectionInventory(d) {
    const inv = d.inventory;
    if (!inv || !Object.keys(inv).length) return null;
    const n = (v) => (v == null ? "—" : String(v));
    const updates = inv.updates || [];
    const areaSub = [
      inv.floors != null ? `${inv.floors} ${this._t("i_floors")}` : null,
      inv.labels != null ? `${inv.labels} ${this._t("i_labels")}` : null,
    ].filter(Boolean).join("  ·  ");
    const unavailPct = inv.states_total ? Math.round(((inv.unavailable || 0) / inv.states_total) * 1000) / 10 : null;

    const cards = this._el("div", { class: "sys-cards" });
    cards.append(
      this._sysCard("🤖", this._t("i_automations"), n(inv.automations), "", null, "/config/automation/dashboard"),
      this._sysCard("📜", this._t("i_scripts"), n(inv.scripts), "", null, "/config/script/dashboard"),
      this._sysCard("🎬", this._t("i_scenes"), n(inv.scenes), "", null, "/config/scene/dashboard"),
      this._sysCard("🧰", this._t("i_helpers"), n(inv.helpers), "", null, "/config/helpers"),
      this._sysCard("🏠", this._t("i_areas"), n(inv.areas), areaSub, null, "/config/areas/dashboard"),
      this._sysCard("⚠️", this._t("i_unavailable"), n(inv.unavailable),
        (inv.states_total ? this._ti("i_of_states", { n: inv.states_total }) + (unavailPct != null ? ` (${unavailPct} %)` : "") : ""), null, "/config/entities"),
      this._sysCard("🚫", this._t("i_disabled_c"), n(inv.disabled), `${n(inv.hidden)} ${this._t("i_hidden")}`, null, "/config/entities"),
      this._sysCard("⬆️", this._t("i_updates"), String(updates.length), updates.length ? "" : this._t("i_up_to_date"), null, "/config/updates")
    );
    const parts = [cards];

    if (updates.length) {
      const rows = updates.map((u) => [
        u.name || u.entity_id || "?",
        this._el("span", { class: "mono", text: n(u.installed) }),
        this._el("span", { class: "mono", text: n(u.latest) }),
      ]);
      parts.push(this._el("div", { class: "sub-head", text: this._t("sub_updates") }));
      parts.push(this._table([this._t("th_name"), this._t("th_installed"), this._t("th_latest")], rows));
    }

    const broken = inv.unavailable_by_integration || [];
    if (broken.length) {
      const maxB = broken.reduce((m, x) => Math.max(m, x.count || 0), 0) || 1;
      const rows = broken.map((x) => [
        this._el("span", { class: "mono", text: x.integration }),
        { text: String(x.count), sort: x.count || 0 },
        { node: this._el("div", { class: "bar-cell" }, [this._meter(this._sharePct(x.count, maxB), "warn")]), sort: x.count || 0 },
      ]);
      parts.push(this._el("div", { class: "sub-head", text: this._t("sub_unavail") }));
      parts.push(this._table([this._t("th_integration"), this._t("th_count"), this._t("th_share")], rows, { sortIdx: 1, sortDir: "desc" }));
    }

    const disabledRows = inv.disabled_by_integration || [];
    if (disabledRows.length) {
      const maxX = disabledRows.reduce((m, x) => Math.max(m, x.count || 0), 0) || 1;
      const rows = disabledRows.map((x) => [
        this._el("span", { class: "mono", text: x.integration }),
        { text: String(x.count), sort: x.count || 0 },
        { node: this._el("div", { class: "bar-cell" }, [this._meter(this._sharePct(x.count, maxX), "ok")]), sort: x.count || 0 },
      ]);
      parts.push(this._section(this._t("sub_disabled"), inv.disabled != null ? inv.disabled : disabledRows.length,
        this._table([this._t("th_integration"), this._t("th_count"), this._t("th_share")], rows, { sortIdx: 1, sortDir: "desc" })));
    }

    const domains = inv.domains || [];
    if (domains.length) {
      const maxD = domains.reduce((m, x) => Math.max(m, x.count || 0), 0) || 1;
      const rows = domains.map((x) => [
        this._el("span", { class: "mono", text: x.domain }),
        { text: String(x.count), sort: x.count || 0 },
        { node: this._el("div", { class: "bar-cell" }, [this._meter(this._sharePct(x.count, maxD), "ok")]), sort: x.count || 0 },
      ]);
      parts.push(this._section(this._t("sub_domains"), inv.domains_total || domains.length,
        this._table([this._t("th_domain"), this._t("th_count"), this._t("th_share")], rows, { sortIdx: 1, sortDir: "desc" })));
    }

    return this._section(this._t("sec_inventory"), null, this._el("div", {}, parts));
  }

  _sectionDatabase(d) {
    const db = d.database;
    if (!db || !db.available) return null;
    if (db.pending) {
      return this._section(this._t("sec_database"), null, this._el("div", { class: "empty", text: this._t("db_pending") }));
    }
    const breakdown = ((d.system || {}).storage || {}).breakdown || [];
    const dbFile = breakdown.find((x) => x.type === "db");

    const cards = this._el("div", { class: "sys-cards" });
    cards.append(
      this._sysCard("📈", this._t("db_c_states"), this._fmtInt(db.states_total), this._ti("db_rows_of", { n: this._fmtInt(db.states_entities) }), null),
      this._sysCard("📊", this._t("db_c_lts"), this._fmtInt(db.statistics_long_total), this._ti("db_rows_stats", { n: this._fmtInt(db.statistics_ids) }), null),
      this._sysCard("⏱️", this._t("db_c_sts"), this._fmtInt(db.statistics_short_total), this._t("db_rows"), null),
      this._sysCard("🗄️", this._t("db_c_size"), dbFile ? this._fmtBytes(dbFile.bytes) : "—", db.engine || "", null)
    );
    const parts = [cards, this._el("div", { class: "hint-line", text: this._t("db_hint") }), this._dbToolbar(d)];

    const states = db.states_top || [];
    if (states.length) {
      const total = db.states_total || 0;
      const maxS = states.reduce((m, x) => Math.max(m, x.rows || 0), 0) || 1;
      const rows = states.map((x) => {
        const link = this._el("span", { class: "mono link-num", text: x.entity_id, attrs: { title: this._t("open_history") } });
        link.addEventListener("click", () => this._navigate("/history?entity_id=" + encodeURIComponent(x.entity_id)));
        return [
          { node: link, sort: x.entity_id },
          { text: this._fmtInt(x.rows), sort: x.rows || 0 },
          { text: total ? ((x.rows / total) * 100).toFixed(1) + " %" : "—", sort: x.rows || 0 },
          { node: this._el("div", { class: "bar-cell" }, [this._meter(this._sharePct(x.rows, maxS), "ok")]), sort: x.rows || 0, nosrch: true },
          { node: this._dbRowMenu(x.entity_id), nosrch: true, sort: "" },
        ];
      });
      parts.push(this._el("div", { class: "sub-head", text: this._t("db_states") }));
      parts.push(this._table([this._t("th_entity"), this._t("th_rows"), "%", this._t("th_share"), ""], rows,
        { sortIdx: 1, sortDir: "desc", cols: [{}, {}, {}, {}, { cls: "f-go", nosort: true }] }));
    }

    const stats = db.statistics_top || [];
    if (stats.length) {
      const maxL = stats.reduce((m, x) => Math.max(m, x.long_term || 0), 0) || 1;
      const isEntity = (id) => /^[a-z0-9_]+\.[a-z0-9_]+$/.test(String(id || ""));
      const statCell = (id) => {
        // Externe Statistiken (z. B. "energy:…") haben keine Entität und damit keinen Verlauf.
        if (!isEntity(id)) return this._el("span", { class: "mono", text: id });
        const link = this._el("span", { class: "mono link-num", text: id, attrs: { title: this._t("open_history") } });
        link.addEventListener("click", () => this._navigate("/history?entity_id=" + encodeURIComponent(id)));
        return { node: link, sort: id };
      };
      const rows = stats.map((x) => [
        statCell(x.statistic_id),
        { text: this._fmtInt(x.long_term), sort: x.long_term || 0 },
        { text: this._fmtInt(x.short_term), sort: x.short_term || 0 },
        { node: this._el("div", { class: "bar-cell" }, [this._meter(this._sharePct(x.long_term, maxL), "ok")]), sort: x.long_term || 0, nosrch: true },
        { node: this._dbRowMenu(x.statistic_id, !isEntity(x.statistic_id)), nosrch: true, sort: "" },
      ]);
      parts.push(this._section(this._t("db_stats"), stats.length,
        this._table([this._t("th_statistic"), this._t("th_lts"), this._t("th_sts"), this._t("th_share"), ""], rows,
          { sortIdx: 1, sortDir: "desc", cols: [{}, {}, {}, {}, { cls: "f-go", nosort: true }] })));
    }
    const orphans = this._dbOrphansSection(db);
    if (orphans) parts.push(orphans);

    if (db.generated_at) {
      const when = new Date(db.generated_at);
      if (!isNaN(when.getTime())) {
        parts.push(this._el("div", { class: "hint-line", text: this._t("db_as_of") + when.toLocaleString(this._lang()) }));
      }
    }
    return this._section(this._t("sec_database"), null, this._el("div", {}, parts));
  }

  _overrideSelect(i) {
    const a = i.analysis || {};
    const current = a.risk_overridden ? a.risk_level : "auto";
    const sel = this._el("select", { class: "ov-select", attrs: { title: this._t("ov_title") } });
    [["auto", this._t("ov_auto")], ["low", "🟢 Low"], ["medium", "🟡 Medium"], ["high", "🔴 High"]].forEach(([val, label]) => {
      const opt = this._el("option", { text: label, attrs: { value: val } });
      if (val === current) opt.setAttribute("selected", "");
      sel.appendChild(opt);
    });
    sel.addEventListener("change", (e) => this._setOverride(i.entry_id, e.target.value));
    return sel;
  }

  _riskCell(a) {
    const badge = this._riskBadge(a.risk_level);
    if (!a.risk_overridden) return { node: badge, sort: RISK_SEV[a.risk_level] || 0 };
    const auto = (a.risk_level_auto || "?").toUpperCase();
    const wrap = this._el("span", {}, [
      badge,
      this._el("span", { class: "ov-mark", text: " ✎", attrs: { title: this._ti("ov_mark", { auto }) } }),
    ]);
    return { node: wrap, sort: RISK_SEV[a.risk_level] || 0 };
  }

  _sectionIntegrations(d) {
    const list = d.integrations || [];
    const rows = list.map((i) => {
      const a = i.analysis || {};
      const chips = this._el("div", {}, [
        this._newTag(i),
        a.has_external_access ? this._chip(this._t("chip_extern"), "info") : null,
        a.has_gps ? this._chip("GPS", "danger") : null,
        a.has_camera ? this._chip(this._t("chip_cam"), "danger") : null,
        a.has_secrets ? this._chip(this._ti("chip_secret", { n: (a.secrets || []).length }), "warn") : null,
        i.is_custom ? this._chip(this._t("chip_custom")) : null,
      ]);
      return [
        this._riskCell(a),
        this._el("span", { class: "mono", text: i.domain }),
        i.title || "—",
        i.state,
        i.source,
        chips,
        i.entity_count && i.entry_id
          ? { node: this._linkNum(i.entity_count, `/config/entities?historyBack=1&config_entry=${i.entry_id}`), sort: i.entity_count }
          : { text: String(i.entity_count || 0), sort: i.entity_count || 0 },
        i.device_count && i.entry_id
          ? { node: this._linkNum(i.device_count, `/config/devices/dashboard?historyBack=1&config_entry=${i.entry_id}`), sort: i.device_count }
          : { text: String(i.device_count || 0), sort: i.device_count || 0 },
        { node: this._overrideSelect(i), nosrch: true },
      ];
    });
    const body = rows.length
      ? this._table(
          [this._t("th_risk"), this._t("th_domain"), this._t("th_title"), this._t("th_state"), this._t("th_source"), this._t("th_access"), this._t("th_entities"), this._t("th_devices"), this._t("th_adjust")],
          rows
        )
      : this._el("div", { class: "empty", text: this._t("empty_integrations") });
    return this._section(this._t("sec_integrations"), list.length, body, true);
  }

  async _setOverride(entryId, level) {
    if (!this._hass || !entryId) return;
    try {
      await this._hass.connection.sendMessagePromise({ type: "ha_percyta/set_override", entry_id: entryId, level: level === "auto" ? null : level });
    } catch (e) {}
    await this._loadReport(); // Änderung ist sofort übernommen …
    this._refreshSoon(); // … abhängige Befunde kommen mit dem Hintergrund-Scan
  }

  _sectionSystemAccess(d) {
    const rows = (d.integrations || [])
      .filter((i) => (i.analysis.system_access || []).length)
      .map((i) => [
        this._el("span", { class: "mono", text: i.domain }),
        this._el("div", {}, (i.analysis.system_access || []).map((s) => this._chip(s, "warn"))),
        this._el("div", {}, (i.analysis.data_flow || []).map((s) => this._chip(s, "info"))),
        { node: this._riskBadge(i.analysis.risk_level), sort: RISK_SEV[i.analysis.risk_level] || 0 },
      ]);
    const body = rows.length
      ? this._table([this._t("th_domain"), this._t("th_sysaccess"), this._t("th_dataflow"), this._t("th_risk")], rows)
      : this._el("div", { class: "empty", text: this._t("empty_sysaccess") });
    return this._section(this._t("sec_sysaccess"), rows.length, body);
  }

  _sectionCloud(d) {
    const rows = (d.integrations || [])
      .filter((i) => i.analysis.has_external_access)
      .map((i) => {
        const a = i.analysis || {};
        const targets = (a.system_access || []).filter((s) => s.includes("Cloud") || s.includes("🌐"));
        return [
          this._el("span", { class: "mono", text: i.domain }),
          i.title || "—",
          this._el("div", {}, targets.length ? targets.map((s) => this._chip(s, "info")) : [this._chip(this._t("extern"), "info")]),
          this._el("div", {}, (a.data_flow || []).map((s) => this._chip(s))),
        ];
      });
    const body = rows.length
      ? this._el("div", {}, [
          this._el("div", { class: "muted", style: "padding:8px 12px 4px;font-size:13px", text: this._t("cloud_hint") }),
          this._table([this._t("th_domain"), this._t("th_title"), this._t("th_target"), this._t("th_dataflow")], rows),
        ])
      : this._el("div", { class: "empty", text: this._t("empty_cloud") });
    return this._section(this._t("sec_cloud"), rows.length, body);
  }

  // ---------- Secrets (abgesichert) ----------
  // Der Klartext kommt nur auf Klick vom Server, wird ausschließlich per textContent
  // gesetzt (kein HTML), nirgends zwischengespeichert und nach REVEAL_SECONDS wieder
  // durch die Maske ersetzt – ebenso beim Neuaufbau, Verlassen des Panels oder
  // wenn der Browser-Tab in den Hintergrund geht.
  _hideSecrets() {
    (this._revealed || []).forEach((fn) => { try { fn(); } catch (e) {} });
    this._revealed = [];
  }

  async _fetchSecret(entryId, secret, purpose) {
    return this._hass.connection.sendMessagePromise({
      type: "ha_percyta/reveal_secret", entry_id: entryId, source: secret.source, key: secret.key, purpose,
    });
  }

  _secretError(btn, err, label, title) {
    const code = err && err.code;
    btn.textContent = "⚠️";
    btn.setAttribute("title", code === "rate_limited" ? this._t("sec_rate") : code === "not_allowed" ? this._t("sec_reveal_off") : this._t("sec_reveal_err"));
    setTimeout(() => { btn.textContent = label; btn.setAttribute("title", title); }, 2500);
  }

  _secretCells(entryId, secret, allowReveal) {
    const masked = String(secret.value || "••••••••");
    const valueEl = this._el("span", { class: "mono secret-val", text: masked, attrs: { "data-masked": masked } });
    if (!entryId || !allowReveal) return [valueEl, { text: "", nosrch: true }];
    const btn = this._el("button", { class: "reveal-btn", text: this._t("sec_reveal"), attrs: { title: this._t("sec_reveal_t") } });
    const copy = this._el("button", { class: "reveal-btn", text: this._t("sec_copy"), attrs: { title: this._t("sec_copy_t") } });
    let timer = null;
    let tick = null;
    const hide = () => {
      clearTimeout(timer);
      clearInterval(tick);
      timer = tick = null;
      valueEl.textContent = masked;
      valueEl.classList.remove("shown");
      btn.textContent = this._t("sec_reveal");
    };
    btn.addEventListener("click", async () => {
      if (timer) { hide(); return; }
      btn.setAttribute("disabled", "");
      try {
        const res = await this._fetchSecret(entryId, secret, "show");
        if (!res || res.value == null) throw new Error("empty");
        this._hideSecrets(); // immer nur ein Wert gleichzeitig sichtbar
        valueEl.textContent = String(res.value);
        valueEl.classList.add("shown");
        let left = REVEAL_SECONDS;
        btn.textContent = `${this._t("sec_hide")} (${left})`;
        tick = setInterval(() => { left -= 1; btn.textContent = `${this._t("sec_hide")} (${Math.max(left, 0)})`; }, 1000);
        timer = setTimeout(hide, REVEAL_SECONDS * 1000);
        this._revealed = (this._revealed || []).concat([hide]);
      } catch (err) {
        this._secretError(btn, err, this._t("sec_reveal"), this._t("sec_reveal_t"));
      }
      btn.removeAttribute("disabled");
    });
    copy.addEventListener("click", async () => {
      copy.setAttribute("disabled", "");
      try {
        const res = await this._fetchSecret(entryId, secret, "copy");
        if (!res || res.value == null || !navigator.clipboard) throw new Error("clipboard");
        await navigator.clipboard.writeText(String(res.value));
        copy.textContent = this._t("sec_copied");
        setTimeout(() => { copy.textContent = this._t("sec_copy"); }, 1800);
      } catch (err) {
        this._secretError(copy, err, this._t("sec_copy"), this._t("sec_copy_t"));
      }
      copy.removeAttribute("disabled");
    });
    return [valueEl, { node: this._el("div", { class: "secret-actions" }, [btn, copy]), sort: "", nosrch: true }];
  }

  _sectionSecrets(d) {
    const rows = [];
    const allow = d.allow_reveal !== false;
    for (const i of d.integrations || []) {
      for (const s of i.analysis.secrets || []) {
        rows.push([
          this._el("span", { class: "mono", text: i.domain }),
          s.source,
          this._el("span", { class: "mono", text: s.key }),
          ...this._secretCells(i.entry_id, s, allow),
        ]);
      }
    }
    const audit = this._section(this._t("sec_audit"), null, this._el("div", { class: "audit-body" }, [this._el("div", { class: "muted small", style: "padding:8px 14px", text: "…" })]));
    audit.addEventListener("toggle", () => { if (audit.open) this._loadAudit(audit.querySelector(".audit-body"), "secret_"); });
    const body = rows.length
      ? this._el("div", {}, [
          this._el("div", { class: "hint-line safe-line", text: allow ? this._t("sec_hint_safe") : this._t("sec_reveal_off") }),
          this._table([this._t("th_integration"), this._t("th_source"), this._t("th_field"), this._t("th_value"), ""], rows),
          audit,
        ])
      : this._el("div", { class: "empty", text: this._t("empty_secrets") });
    return this._section(this._t("sec_secrets"), rows.length, body);
  }

  _sectionAddons(d) {
    const list = d.addons || [];
    let body;
    if (list.length) {
      const rows = list.map((a) => [
        { node: this._riskBadge(a.analysis.risk_level), sort: RISK_SEV[a.analysis.risk_level] || 0 },
        this._cellWithNew(a.name, a),
        this._el("span", { class: "mono", text: a.version || "—" }),
        this._el("div", {}, (a.analysis.system_access || []).length
          ? a.analysis.system_access.map((s) => this._chip(s, a.analysis.risk_level === "high" ? "danger" : "warn"))
          : [this._el("span", { class: "muted", text: "—" })]),
      ]);
      body = this._table([this._t("th_risk"), this._t("th_app"), this._t("th_version"), this._t("th_access")], rows);
    } else {
      body = this._el("div", { class: "empty", text: d.is_supervisor ? this._t("empty_apps_sup") : this._t("empty_apps_core") });
    }
    return this._section(this._t("sec_apps"), list.length, body);
  }

  _sectionCards(d) {
    const list = d.custom_cards || [];
    const hasSize = list.some((c) => c.size_bytes != null);
    const body = list.length
      ? this._table(
          hasSize ? [this._t("th_type"), this._t("th_url"), this._t("th_size")] : [this._t("th_type"), this._t("th_url")],
          list.map((c) => {
            const row = [this._cellWithNew(c.type || "—", c), this._el("span", { class: "mono", text: c.url || "" })];
            if (hasSize) {
              row.push(c.size_bytes != null
                ? { text: this._fmtBytes(c.size_bytes) + (c.size_scope === "folder" ? " 📁" : ""), sort: c.size_bytes }
                : { text: "—", sort: -1 });
            }
            return row;
          }),
          hasSize ? { sortIdx: 2, sortDir: "desc" } : {}
        )
      : this._el("div", { class: "empty", text: this._t("empty_cards") });
    return this._section(this._t("sec_cards"), list.length, body);
  }

  _sectionBlueprints(d) {
    const list = d.blueprints || [];
    const hasSize = list.some((b) => b.size_bytes != null);
    const body = list.length
      ? this._table(
          hasSize ? [this._t("th_domain"), this._t("th_name"), this._t("th_author"), this._t("th_size")] : [this._t("th_domain"), this._t("th_name"), this._t("th_author")],
          list.map((b) => {
            const row = [this._chip(b.domain), this._cellWithNew(b.name || b.path, b), b.author || "—"];
            if (hasSize) row.push(b.size_bytes != null ? { text: this._fmtBytes(b.size_bytes), sort: b.size_bytes } : { text: "—", sort: -1 });
            return row;
          }),
          hasSize ? { sortIdx: 3, sortDir: "desc" } : {}
        )
      : this._el("div", { class: "empty", text: this._t("empty_blueprints") });
    return this._section(this._t("sec_blueprints"), list.length, body);
  }

  _sectionUsers(d) {
    const list = d.users || [];
    const body = list.length
      ? this._table([this._t("th_name"), this._t("th_owner"), this._t("th_active"), this._t("th_system"), this._t("th_groups")], list.map((u) => [
          this._cellWithNew(u.name, u),
          u.is_owner ? this._chip("Owner", "danger") : "—",
          u.is_active ? this._t("yes") : this._t("no"),
          u.system_generated ? this._t("yes") : this._t("no"),
          this._el("div", {}, (u.groups || []).map((g) => this._chip(g))),
        ]))
      : this._el("div", { class: "empty", text: this._t("empty_users") });
    return this._section(this._t("sec_users"), list.length, body);
  }

  _sectionTokens(d) {
    const list = (d.tokens || []).slice().sort((a, b) => (b.stale ? 1 : 0) - (a.stale ? 1 : 0));
    const fmt = (t) => (t && t !== "nie" ? new Date(t).toLocaleString() : this._t("tok_never_ts"));
    const statusCell = (t) => {
      if (!t.is_long_lived) return this._el("span", { class: "muted", text: "—" });
      if (t.never_used) return this._chip(this._t("tok_never"), "danger");
      if (t.stale) return this._chip(this._ti("tok_unused", { d: t.days_since_used }), "danger");
      return this._chip(this._t("tok_ok"), "");
    };
    const stale = list.filter((t) => t.stale).length;
    const hint = stale
      ? this._el("div", { class: "muted", style: "padding:8px 12px 4px;font-size:13px", text: this._ti("tok_hint", { n: stale }) })
      : null;
    const body = list.length
      ? this._el("div", {}, [
          this._explain(this._t("tk_box_t"), [this._t("tk_box_1"), this._t("tk_box_2"), this._t("tk_box_3")]),
          hint,
          this._table([this._t("th_user"), this._t("th_client"), this._t("th_type") || "Typ", this._t("th_last_used"), this._t("th_status"), ""], list.map((t) => {
            let act = { text: "", nosrch: true };
            if (t.id) {
              const b = this._el("button", { class: "vb-btn small" + (t.stale ? " warn-btn" : ""), text: this._t("tk_revoke") });
              b.addEventListener("click", () => this._revokeDialog(t));
              act = { node: b, nosrch: true, sort: "" };
            }
            return [
              t.user,
              t.client_name || "—",
              this._chip(t.is_long_lived ? this._t("tok_longlived") : t.type, t.is_long_lived ? "warn" : ""),
              fmt(t.last_used_at),
              { node: statusCell(t) },
              act,
            ];
          }), { cols: [{}, {}, {}, {}, {}, { cls: "f-go", nosort: true }] }),
        ])
      : this._el("div", { class: "empty", text: this._t("empty_tokens") });
    return this._section(this._t("sec_tokens"), list.length, body);
  }

  // ---------- Befunde ----------
  _fdoc(f) {
    const L = this._lang();
    const doc = (FDOC[L] && FDOC[L][f.type]) || FDOC.en[f.type] || { title: String(f.type), what: String(f.subject), cause: "", impact: "", steps: [] };
    const p = f.params || {};
    const reasons = (p.reasons || []).map((r) => this._t("r_" + r)).join(", ");
    const rights = [];
    if (p.full_access) rights.push(this._t("p_full_access"));
    if (p.host_network) rights.push(this._t("p_host_network"));
    (p.privileged || []).forEach((x) => rights.push(String(x)));
    if (p.role) rights.push(this._ti("p_role", { r: p.role }));
    const det = f.details || {};
    const issues = Object.entries(p.issues || {})
      .map(([k, n]) => `${n}× ${this._t("iss_" + k)}`)
      .join(", ");
    const obj = this._t(p.kind === "script" ? "obj_script" : "obj_automation");
    const vars = {
      subject: f.subject, count: p.count != null ? p.count : f.items_total, days: p.days, percent: p.percent,
      share: p.share, rows: this._fmtInt(p.rows), state: p.state, user: p.user, integrations: p.integrations,
      reasons: reasons || "—", rights: rights.join(", ") || "—",
      Obj: obj, errors: p.errors, runs: p.runs, mode: p.mode, error: p.error || "—", issues: issues || "—",
      verror: det.validation_error || p.status || "—", cond_blocked: p.cond_blocked,
    };
    const fill = (s) => String(s || "").replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    let what = p.never && doc.what_never ? doc.what_never : doc.what;
    if (p.cond_blocked && doc.blocked) what = what + " " + doc.blocked;
    return { title: fill(doc.title), what: fill(what), cause: fill(doc.cause), impact: fill(doc.impact), steps: (doc.steps || []).map(fill) };
  }

  _sevBadge(sev) {
    return this._el("span", { class: "sev sev-" + sev }, [
      this._el("span", { class: "sev-dot" }),
      document.createTextNode(this._t("sev_" + sev)),
    ]);
  }

  _fmtDateTime(iso) {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? String(iso || "—") : d.toLocaleString();
  }

  // Links aus Befunden: interne Sprünge (#finding:…, #percyta:…), HA-Pfade oder http(s).
  _openLink(link) {
    if (!link || typeof link !== "string") return;
    if (link.startsWith("#entity:")) { this._moreInfo(link.slice(8)); return; }
    if (link.startsWith("#finding:")) {
      const id = link.slice(9);
      const exists = this._data && this._data.data && (this._data.data.findings || []).some((f) => f.id === id);
      if (exists) {
        if (!this._detailId && !this._resolvedKey) {
          this._backScroll = this.scrollTop;
          this._pushNav();
        }
        this._enterFromPage();
        this._detailList = [id];
        this._detailId = id;
        this._render();
        this.scrollTop = 0;
      }
      return;
    }
    if (link === "#percyta:db-orphans") {
      if (this._page || this._detailId || this._resolvedKey) this._unwindNav();
      this._returnPage = null;
      this._page = null;
      this._resolvedKey = null;
      this._detailId = null;
      this._render();
      this._jumpTo("database");
      requestAnimationFrame(() => {
        const sub = this.shadowRoot.getElementById("db-orphans");
        if (sub) { sub.open = true; sub.scrollIntoView({ behavior: "smooth", block: "start" }); }
      });
      return;
    }
    let url = null;
    try { url = new URL(link, window.location.origin); } catch (e) { return; }
    if (/^https?:\/\//i.test(link)) {
      if (url.protocol === "https:" || url.protocol === "http:") window.open(url.href, "_blank", "noopener,noreferrer");
      return;
    }
    this._navigate(link);
  }

  _fStatusText(f) {
    let s = this._t("st_" + f.status);
    if (f.status === "snoozed" && f.until) s += " · " + this._ti("snooze_until", { d: new Date(f.until).toLocaleDateString() });
    return s;
  }

  // Zeile unter dem Titel: Name bzw. ID des betroffenen Objekts.
  _fSubject(f) {
    const nodes = [];
    const t = f.subject_type;
    if (t === "system" || t === "backup" || t === "updates") return nodes;
    nodes.push(this._el("span", { class: "f-subject", text: String(f.subject) }));
    const ref = f.subject_ref;
    if ((t === "automation" || t === "script") && ref && ref !== f.subject) {
      nodes.push(this._el("span", { class: "mono", text: String(ref) }));
    }
    return nodes;
  }

  async _setFindingState(ids, status, days, note) {
    if (!this._hass || !ids || !ids.length) return;
    const msg = { type: "ha_percyta/set_finding_state", ids, status };
    if (days) msg.days = days;
    if (note) msg.note = note;
    try {
      await this._hass.connection.sendMessagePromise(msg);
    } catch (e) {}
    if (this._fs) this._fs.sel.clear();
    if (this._fsCare) this._fsCare.sel.clear();
    await this._loadReport();
  }

  _findingRow(f, fs, onSel) {
    const doc = this._fdoc(f);
    const cb = this._el("input", { class: "f-cb", attrs: { type: "checkbox", "data-fid": f.id } });
    cb.checked = fs.sel.has(f.id);
    cb.addEventListener("change", () => {
      if (cb.checked) fs.sel.add(f.id);
      else fs.sel.delete(f.id);
      onSel();
    });

    const title = this._el("span", { class: "f-title", text: doc.title, attrs: { "data-fid": f.id, title: this._t("f_open") } });
    title.addEventListener("click", () => this._openDetail(f.id));
    const sub = this._el("div", { class: "f-sub" }, this._fSubject(f));
    if (f.status !== "open") sub.appendChild(this._chip(this._fStatusText(f), f.status === "hidden" ? "" : "info"));
    if (f.note) sub.appendChild(this._el("span", { class: "muted f-note", text: "— " + f.note }));

    const go = this._el("span", { class: "f-go-btn", text: "›", attrs: { title: this._t("f_open") } });
    go.addEventListener("click", () => this._openDetail(f.id));
    const since = Date.parse(f.first_seen) || 0;
    return [
      { node: cb, nosrch: true, sort: 0 },
      { node: this._sevBadge(f.severity), sort: SEV_ORDER[f.severity] != null ? SEV_ORDER[f.severity] : 9 },
      { node: this._el("div", {}, [title, sub]), sort: doc.title + " " + f.subject },
      { text: CAT_ICON[f.category] + " " + this._t("cat_" + f.category), sort: this._t("cat_" + f.category) },
      { text: f.items_total ? String(f.items_total) : "—", sort: f.items_total || 0 },
      { text: since ? this._ago(new Date(since)) : "—", sort: since },
      { node: go, nosrch: true, sort: "" },
    ];
  }

  // noSearch: eigenständige Kopie (Pflege-Center) – die Suche der Übersicht wirkt hier nicht.
  _sectionFindings(d, noSearch) {
    if (!Array.isArray(d.findings)) return null;
    const c = d.counts || {};
    // Eigener Filter-Zustand je Ort (Übersicht / Pflege-Center), damit sich beide nicht beeinflussen.
    const key = noSearch ? "_fsCare" : "_fs";
    const fs = (this[key] = this[key] || { tab: "open", cat: "all", sev: "all", sel: new Set(), resolvedOpen: false });
    const all = d.findings;
    const ids = new Set(all.map((f) => f.id));
    Array.from(fs.sel).forEach((i) => { if (!ids.has(i)) fs.sel.delete(i); });
    const body = this._el("div", { class: "f-body" });

    const build = () => {
      body.replaceChildren();
      const byStatus = { open: 0, known: 0, snoozed: 0, hidden: 0 };
      all.forEach((f) => { byStatus[f.status] = (byStatus[f.status] || 0) + 1; });
      const tabList = all.filter((f) => f.status === fs.tab);

      // Kategorien-Kacheln (filtern die Liste)
      const cats = this._el("div", { class: "f-cats" });
      const mkCat = (key, icon, label, list) => {
        const worst = list.reduce((w, f) => Math.min(w, SEV_ORDER[f.severity] != null ? SEV_ORDER[f.severity] : 9), 9);
        const sev = ["high", "medium", "low", "info"][worst] || "none";
        const tile = this._el("div", { class: "f-cat fc-" + sev + (fs.cat === key ? " active" : "") }, [
          this._el("div", { class: "f-cat-top" }, [
            this._el("span", { class: "f-cat-icon", text: icon }),
            this._el("span", { class: "f-cat-n", text: String(list.length) }),
          ]),
          this._el("div", { class: "f-cat-label", text: label }),
        ]);
        tile.addEventListener("click", () => { fs.cat = fs.cat === key ? "all" : key; build(); });
        return tile;
      };
      cats.appendChild(mkCat("all", "🧭", this._t("f_all"), tabList));
      CATEGORIES.forEach((cat) => cats.appendChild(mkCat(cat, CAT_ICON[cat], this._t("cat_" + cat), tabList.filter((f) => f.category === cat))));
      body.appendChild(cats);

      // Werkzeugleiste: Status-Reiter, Schweregrad, Auswahl, Aktionen
      const tabs = this._el("div", { class: "segmented f-tabs" });
      STATUSES.forEach((st) => {
        const b = this._el("button", { text: `${this._t("st_" + st)} ${byStatus[st] || 0}` });
        if (fs.tab === st) b.classList.add("active");
        b.addEventListener("click", () => { fs.tab = st; fs.sel.clear(); build(); });
        tabs.appendChild(b);
      });
      const sevSel = this._el("select", { class: "ov-select" });
      [["all", this._t("sev_all")], ...["high", "medium", "low", "info"].map((s) => [s, this._t("sev_" + s)])].forEach(([val, label]) => {
        const opt = this._el("option", { text: label, attrs: { value: val } });
        if (val === fs.sev) opt.setAttribute("selected", "");
        sevSel.appendChild(opt);
      });
      sevSel.addEventListener("change", (e) => { fs.sev = e.target.value; build(); });

      const selInfo = this._el("span", { class: "f-sel-info muted" });
      const btnPage = this._el("button", { class: "vb-btn", text: this._t("f_select_page") });
      const btnClear = this._el("button", { class: "vb-btn", text: this._t("f_clear_sel") });
      const actions = this._el("div", { class: "f-actions" });
      const act = (label, status, extra) => {
        const b = this._el("button", { class: "vb-btn", text: label });
        b.addEventListener("click", () => this._setFindingState(Array.from(fs.sel), status, extra ? extra() : undefined));
        return b;
      };
      if (fs.tab === "open") {
        const days = this._el("select", { class: "ov-select", attrs: { title: this._t("st_snoozed_t") } });
        SNOOZE_DAYS.forEach((n) => days.appendChild(this._el("option", { text: this._ti("snooze_for", { n }), attrs: { value: String(n) } })));
        const snooze = this._el("button", { class: "vb-btn", text: this._t("st_snoozed_t") });
        snooze.addEventListener("click", () => this._setFindingState(Array.from(fs.sel), "snoozed", parseInt(days.value, 10)));
        actions.append(act(this._t("st_known_t"), "known"), snooze, days, act(this._t("st_hidden_t"), "hidden"));
      } else {
        actions.append(act(this._t("f_reopen"), "open"));
      }
      const tools = this._el("div", { class: "f-tools" }, [
        this._el("div", { class: "f-row" }, [tabs, sevSel]),
        this._el("div", { class: "f-row" }, [btnPage, btnClear, selInfo, actions]),
      ]);
      body.appendChild(tools);

      // Erklärung der Status (was im Hintergrund passiert).
      const help = this._el("details", { class: "f-help" }, [
        this._el("summary", { text: this._t("fh_title") }),
        this._el("div", { class: "dlg-explain" }, [
          this._el("ul", {}, ["open", "known", "snoozed", "hidden"].map((st) => this._el("li", {}, [
            this._el("b", { text: this._t("st_" + st) + ": " }), this._el("span", { text: this._t("fh_" + st) }),
          ]))),
          this._el("div", { class: "muted small", style: "margin-top:6px;line-height:1.5", text: this._t("fh_note") }),
        ]),
      ]);
      help.open = !!this._fsHelpOpen;
      help.addEventListener("toggle", () => { this._fsHelpOpen = help.open; });
      body.appendChild(help);

      // Liste
      const rowsData = tabList.filter((f) => (fs.cat === "all" || f.category === fs.cat) && (fs.sev === "all" || f.severity === fs.sev));
      const listWrap = this._el("div", { class: "f-list" });
      const updateSel = () => {
        selInfo.textContent = fs.sel.size ? this._ti("f_selected", { n: fs.sel.size }) : "";
        actions.querySelectorAll("button, select").forEach((el) => { el.disabled = !fs.sel.size; });
        btnClear.disabled = !fs.sel.size;
      };
      if (!rowsData.length) {
        const msg = !tabList.length ? (fs.tab === "open" ? "f_empty_open" : "f_empty_other") : "f_empty_filter";
        listWrap.appendChild(this._el("div", { class: "empty", text: this._t(msg) }));
      } else {
        const rows = rowsData.map((f) => this._findingRow(f, fs, updateSel));
        listWrap.appendChild(
          this._table(
            ["", this._t("f_th_sev"), this._t("f_th_finding"), this._t("f_th_cat"), this._t("f_th_affected"), this._t("f_th_since"), ""],
            rows,
            {
              sortIdx: 1, sortDir: "asc", memKey: "findings", noSearch: !!noSearch,
              cols: [{ cls: "f-check", nosort: true }, {}, {}, {}, {}, {}, { cls: "f-go", nosort: true }],
            }
          )
        );
      }
      body.appendChild(listWrap);
      btnPage.addEventListener("click", () => {
        listWrap.querySelectorAll("tbody tr:not([hidden]) input.f-cb").forEach((cb) => { cb.checked = true; fs.sel.add(cb.dataset.fid); });
        updateSel();
      });
      btnClear.addEventListener("click", () => {
        fs.sel.clear();
        listWrap.querySelectorAll("input.f-cb").forEach((cb) => { cb.checked = false; });
        updateSel();
      });
      updateSel();

      // Zuletzt behoben
      const res = d.findings_resolved || [];
      if (res.length) {
        const list = this._el("div", { class: "f-resolved" }, res.map((r) => {
          const doc = (FDOC[this._lang()] || FDOC.en)[r.type];
          const label = doc ? doc.title : r.type;
          const subj = r.subject ? String(r.subject) : String(r.id || "").split(":").slice(1).join(":");
          const row = this._el("div", { class: "f-res-row clickable", attrs: { title: this._t("r_open_t"), tabindex: "0", role: "button" } }, [
            this._el("span", { class: "f-res-ico", text: "✔" }),
            r.severity ? this._sevBadge(r.severity) : null,
            this._el("span", { class: "f-res-title", text: label }),
            subj && !["system", "backup", "updates"].includes(r.subject_type) ? this._el("span", { class: "mono", text: subj }) : null,
            this._el("span", { class: "muted f-res-when", text: this._ti("f_resolved_when", { a: this._ago(new Date(r.resolved_at)) }) }),
            this._el("span", { class: "f-go-btn", text: "›" }),
          ]);
          const open = () => this._openResolved(r, res);
          row.addEventListener("click", open);
          row.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
          return row;
        }));
        const det = this._section(this._t("f_resolved"), res.length, list, fs.resolvedOpen);
        det.classList.add("f-resolved-box");
        det.addEventListener("toggle", () => { fs.resolvedOpen = det.open; });
        body.appendChild(det);
      }
      body.appendChild(this._el("div", { class: "hint-line", text: this._t("f_hint") }));
    };
    build();
    return this._section(this._t("sec_findings"), c.findings_open != null ? c.findings_open : all.length, body, true);
  }

  // ---------- Befund-Detailansicht ----------
  _openDetail(id) {
    const content = this.shadowRoot.getElementById("content");
    const view = content && this._captureView(content);
    if (view) this._storedView = { open: view.open, why: view.why, sort: this._sortMem || {}, scroll: [] };
    this._backScroll = this.scrollTop;
    // Reihenfolge der aktuell sichtbaren Liste für „Vorheriger/Nächster“.
    const order = Array.from(this.shadowRoot.querySelectorAll(".f-list tbody tr:not([hidden]) .f-title")).map((n) => n.dataset.fid);
    this._detailList = order.length ? order : [id];
    if (!this._detailId && !this._resolvedKey) this._pushNav();
    this._enterFromPage();
    this._detailId = id;
    this._render();
    this.scrollTop = 0;
  }

  // Detail aus einer Unterseite (z. B. Pflege-Center) öffnen: „Zurück“ führt wieder dorthin.
  _enterFromPage() {
    if (!this._page) return;
    this._returnPage = this._page;
    this._returnBack = this._pageBackScroll;
    this._page = null;
  }

  // ---------- Browser-Verlauf: Zurück-Taste der Maus/des Browsers ----------
  _pushNav() {
    try {
      history.pushState({ percyta: (this._navDepth || 0) + 1 }, "", location.href);
      this._navDepth = (this._navDepth || 0) + 1;
    } catch (e) {}
  }

  _onPopState(e) {
    if (this._ignorePop) { this._ignorePop = false; return; }
    // Jeder eigene Eintrag trägt seine Tiefe. Nur wenn es zurück (flacher) geht, schließen wir
    // Unterseiten – Vorwärts oder die Rückkehr von einer anderen HA-Seite ändern nichts.
    const target = (e && e.state && e.state.percyta) || 0;
    if (target >= (this._navDepth || 0)) return;
    if (this._modal && !this._modalBusy) this._closeModal();
    while (this._navDepth > target) {
      this._navDepth -= 1;
      if (this._detailId || this._resolvedKey || this._page) this._closeDetail(true);
    }
  }

  // Alle eigenen Verlaufs-Einträge auf einmal verlassen (z. B. Sprung zurück in den Bericht).
  _unwindNav() {
    if (!this._navDepth) return;
    const n = this._navDepth;
    this._navDepth = 0;
    this._ignorePop = true;
    try { history.go(-n); } catch (e) { this._ignorePop = false; }
  }

  _closeDetail(fromPop) {
    // Über den Browser-Verlauf zurück, damit Zurück-Taste und Button dasselbe tun.
    if (fromPop !== true && this._navDepth > 0) { history.back(); return; }
    const ret = this._detailId || this._resolvedKey ? this._returnPage : null;
    this._returnPage = null;
    this._detailId = null;
    this._resolvedKey = null;
    this._page = ret || null;
    this._render();
    const top = this._backScroll || 0;
    if (ret) this._backScroll = this._returnBack || 0;
    this.scrollTop = top;
    requestAnimationFrame(() => { this.scrollTop = top; });
  }

  _stepDetail(delta) {
    const list = this._detailList || [];
    const pos = list.indexOf(this._detailId);
    const next = list[pos + delta];
    if (pos < 0 || !next) return;
    this._detailId = next;
    this._render();
    this.scrollTop = 0;
  }

  _goneView() {
    const back = this._el("button", { class: "vb-btn", text: this._t("f_back") });
    back.addEventListener("click", () => this._closeDetail());
    return this._el("div", { class: "fd" }, [
      this._el("div", { class: "fd-top" }, [back]),
      this._el("div", { class: "fd-card fd-gone" }, [
        this._el("div", { class: "fd-gone-ico", text: "✔" }),
        this._el("h3", { text: this._t("f_gone_title") }),
        this._el("p", { class: "muted", text: this._t("f_gone_text") }),
      ]),
    ]);
  }

  _fmtDetail(key, v) {
    if (typeof v === "boolean") return this._t(v ? "yes" : "no");
    if (Array.isArray(v)) return v.join(", ");
    if (/(_at|last_triggered|last_backup)$/.test(key)) return this._fmtDateTime(v);
    if (["used", "total", "free", "size"].includes(key) && typeof v === "number") return this._fmtBytes(v);
    if (typeof v === "number") return this._fmtInt(v);
    return String(v);
  }

  _itemsPanel(f, opts = {}) {
    const items = f.items || [];
    const has = (fn) => items.some(fn);
    const hasKind = has((i) => i.issue && i.kind && i.kind !== "run");
    const hasIssue = has((i) => i.issue);
    const hasPart = has((i) => i.parts && i.parts.length);
    const hasWhere = has((i) => i.paths && i.paths.length);
    const hasWhen = has((i) => i.when);
    const hasVer = has((i) => i.installed || i.latest);
    const hasCount = has((i) => i.count != null);
    const hasNow = !!opts.now && has((i) => /^[a-z0-9_]+\.[a-z0-9_]+$/.test(String(i.ref || "")) && i.kind !== "run");
    const headers = [this._t("fd_th_name"), this._t("fd_th_id")];
    const cols = [{}, {}];
    const push = (cond, key) => { if (cond) { headers.push(this._t(key)); cols.push({}); } };
    push(hasKind, "fd_th_kind");
    push(hasIssue, "fd_th_issue");
    push(hasPart, "fd_th_part");
    push(hasWhen, "fd_th_when");
    push(hasWhere, "fd_th_where");
    push(hasVer, "fd_th_version");
    push(hasCount, "fd_th_count");
    push(hasNow, "fd_th_now");
    headers.push(""); cols.push({ cls: "f-go", nosort: true });
    const states = (this._hass && this._hass.states) || {};
    const rows = items.map((it) => {
      const row = [{ text: it.name == null ? "" : String(it.name) }, { node: this._idCell(it, opts.noLinks), sort: String(it.ref || "") }];
      if (hasKind) row.push({ text: it.kind && it.kind !== "run" ? this._t("kind_" + it.kind) : "" });
      if (hasIssue) {
        const bad = ["missing", "disabled", "missing_device", "missing_area", "unknown_action", "error"].includes(it.issue);
        row.push({ node: it.issue ? this._chip(this._t("iss_" + it.issue), bad ? "danger" : "warn") : this._el("span"), sort: it.issue || "" });
      }
      if (hasPart) row.push({ text: (it.parts || []).map((x) => this._t("part_" + x)).join(", ") });
      if (hasWhen) {
        const t = Date.parse(it.when);
        row.push({ text: t ? this._fmtDateTime(it.when) : "—", sort: t || 0 });
      }
      if (hasWhere) row.push({ node: this._el("span", { class: "mono", text: (it.paths || []).join(", ") }) });
      if (hasVer) row.push({ text: [it.installed, it.latest].filter(Boolean).join(" → ") });
      if (hasCount) row.push({ text: it.count != null ? this._fmtInt(it.count) : "", sort: it.count || 0 });
      if (hasNow) {
        const st = states[it.ref];
        let node;
        if (it.kind === "run" || !/^[a-z0-9_]+\.[a-z0-9_]+$/.test(String(it.ref || ""))) node = this._el("span", { class: "muted", text: "—" });
        else if (!st) node = this._chip(this._t("r_now_missing"), "danger");
        else if (st.state === "unavailable") node = this._chip(this._t("iss_unavailable"), "warn");
        else node = this._chip("✔ " + this._t("r_now_ok_state") + " (" + String(st.state).slice(0, 24) + ")", "");
        row.push({ node, sort: node.textContent });
      }
      let cell = "";
      if (f.type === "automations_off" && it.kind === "automation" && !opts.noLinks && it.ref) {
        const on = this._el("button", { class: "vb-btn small", text: this._t("au_turn_on") });
        on.addEventListener("click", () => this._automationAction(on, "turn_on", it.ref));
        const wrapB = this._el("div", { class: "secret-actions" }, [on]);
        if (it.link) wrapB.appendChild(this._linkBtn(this._t("f_open") + " ↗", it.link, "vb-btn small"));
        row.push({ node: wrapB, nosrch: true });
        return row;
      }
      if (it.link && !opts.noLinks) {
        cell = { node: this._linkBtn(this._t("f_open") + (String(it.link).startsWith("#") && !String(it.link).startsWith("#entity:") ? " ›" : " ↗"), it.link, "vb-btn small"), nosrch: true };
      }
      row.push(cell);
      return row;
    });
    const wrap = this._el("div", {});
    const savedSearch = this._search;
    this._search = ""; // Die globale Suche gilt nur für die Übersicht.
    wrap.appendChild(this._table(headers, rows, { memKey: "fd-items", cols }));
    this._search = savedSearch;
    if (f.items_total > items.length) {
      wrap.appendChild(this._el("div", { class: "hint-line", text: this._ti("fd_more", { n: f.items_total - items.length, m: items.length }) }));
    }
    return wrap;
  }

  _techPanel(f) {
    const tbody = this._el("tbody", {});
    const add = (label, node) => tbody.appendChild(this._el("tr", {}, [this._el("th", { class: "fd-k", text: label }), this._el("td", {}, [node])]));
    add("ID", this._el("span", { class: "mono", text: String(f.id) }));
    Object.entries(f.details || {}).forEach(([k, v]) => {
      const label = STR[this._lang()]["fd_k_" + k] || k;
      add(label, this._el("span", { text: this._fmtDetail(k, v) }));
    });
    return this._el("div", { class: "table-wrap" }, [this._el("table", { class: "fd-kv" }, [tbody])]);
  }

  _detailView(d, f) {
    const doc = this._fdoc(f);
    const colors = { high: "var(--error-color,#db4437)", medium: "var(--warning-color,#ffa600)", low: "var(--info-color,#3f9dff)", info: "var(--secondary-text-color,#9aa0aa)" };
    const sevColor = colors[f.severity] || colors.info;
    const list = this._detailList || [f.id];
    const pos = list.indexOf(f.id);
    const wrap = this._el("div", { class: "fd" });

    // Kopfzeile: Zurück, Pfad, Vor/Zurück innerhalb der Liste
    const back = this._el("button", { class: "vb-btn", text: this._t("f_back") });
    back.addEventListener("click", () => this._closeDetail());
    const nav = this._el("div", { class: "fd-nav" });
    if (pos >= 0 && list.length > 1) {
      const prev = this._el("button", { class: "vb-btn", text: "‹", attrs: { title: this._t("f_prev") } });
      const next = this._el("button", { class: "vb-btn", text: "›", attrs: { title: this._t("f_next") } });
      prev.disabled = pos <= 0;
      next.disabled = pos >= list.length - 1;
      prev.addEventListener("click", () => this._stepDetail(-1));
      next.addEventListener("click", () => this._stepDetail(1));
      nav.append(prev, this._el("span", { class: "muted", text: `${pos + 1} / ${list.length}` }), next);
    }
    const crumb = this._t("sec_findings").replace(/^\S+\s*/, "") + " › " + doc.title;
    wrap.appendChild(this._el("div", { class: "fd-top" }, [back, this._el("span", { class: "muted fd-crumb", text: crumb }), nav]));

    // Kopfkarte
    const badges = this._el("div", { class: "fd-badges" }, [
      this._sevBadge(f.severity),
      this._chip(CAT_ICON[f.category] + " " + this._t("cat_" + f.category)),
    ]);
    if (f.status !== "open") badges.appendChild(this._chip(this._fStatusText(f), "info"));
    const heroMain = this._el("div", { class: "fd-hero-main" }, [
      badges,
      this._el("h2", { class: "fd-title", text: doc.title }),
      this._el("div", { class: "f-sub" }, this._fSubject(f)),
    ]);
    const hero = this._el("div", { class: "fd-hero", style: `--sev:${sevColor}` }, [
      this._el("div", { class: "fd-ico", text: TYPE_ICON[f.type] || "🧭" }),
      heroMain,
    ]);
    if (f.link) {
      const internal = String(f.link).startsWith("#");
      hero.appendChild(this._linkBtn(internal ? this._t("f_open") + " ›" : this._t("f_open_ha") + " ↗", f.link, "fd-open"));
    }
    const heroActs = this._heroActions(f);
    if (heroActs.length) hero.appendChild(this._el("div", { class: "fd-hero-acts" }, heroActs));
    wrap.appendChild(hero);

    // Reiter: Diagnose / Betroffene Objekte / Technische Daten
    const step = (cls, icon, label, content) =>
      this._el("li", { class: "fd-step " + cls }, [
        this._el("div", { class: "fd-node", text: icon }),
        this._el("div", { class: "fd-step-body" }, [this._el("h4", { text: label }), content]),
      ]);
    const fixList = this._el("ol", { class: "fd-fixlist" }, doc.steps.map((s) => this._el("li", { text: s })));
    const steps = this._el("ul", { class: "fd-steps" }, [
      step("", "🔎", this._t("fd_found"), this._el("p", { text: doc.what })),
      step("", "🧩", this._t("fd_cause"), this._el("p", { text: doc.cause })),
      step("", "⚡", this._t("fd_impact"), this._el("p", { text: doc.impact })),
      step("fix", "🛠️", this._t("fd_fix"), fixList),
    ]);
    const panels = [["diag", this._t("fd_tab_diag"), steps]];
    if ((f.items || []).length) panels.push(["items", `${this._t("fd_tab_items")} ${f.items_total}`, this._itemsPanel(f)]);
    panels.push(["history", `${this._t("fd_tab_history")}${(f.history || []).length ? " " + f.history.length : ""}`, this._historyPanel(f)]);
    panels.push(["tech", this._t("fd_tab_tech"), this._techPanel(f)]);
    const tabBar = this._el("div", { class: "fd-tabs" });
    const panelBox = this._el("div", { class: "fd-panels" });
    const show = (key) => {
      this._detailTab = key;
      tabBar.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.key === key));
      panelBox.querySelectorAll(".fd-panel").forEach((p) => { p.hidden = p.dataset.key !== key; });
    };
    panels.forEach(([key, label, node]) => {
      const b = this._el("button", { class: "fd-tab", text: label, attrs: { "data-key": key } });
      b.addEventListener("click", () => show(key));
      tabBar.appendChild(b);
      panelBox.appendChild(this._el("div", { class: "fd-panel", attrs: { "data-key": key } }, [node]));
    });
    const main = this._el("div", { class: "fd-card fd-main" }, [tabBar, panelBox]);

    // Seitenleiste: Auf einen Blick + Status verwalten
    const row = (label, node) =>
      this._el("div", { class: "fd-fact" }, [this._el("div", { class: "fd-fact-l", text: label }), this._el("div", { class: "fd-fact-v" }, [node])]);
    const conf = Math.max(0, Math.min(100, Number(f.confidence) || 0));
    const confNode = this._el("div", { class: "fd-conf", attrs: { title: this._t("fd_conf_t") } }, [
      this._el("div", { class: "fd-conf-bar" }, [this._el("span", { style: `width:${conf}%` })]),
      this._el("span", { text: conf + " %" }),
    ]);
    const first = f.first_seen ? new Date(f.first_seen) : null;
    const sinceNode = this._el("div", {}, [
      this._el("div", { text: first ? this._fmtDateTime(f.first_seen) : "—" }),
      first ? this._el("div", { class: "muted small", text: this._ago(first) }) : null,
    ]);
    const statusNode = this._el("div", {}, [
      this._el("span", { text: this._fStatusText(f) }),
      f.note ? this._el("div", { class: "muted small", text: this._t("fd_note_label") + ": " + f.note }) : null,
    ]);
    const facts = this._el("div", { class: "fd-card fd-facts" }, [
      this._el("h3", { text: this._t("fd_glance") }),
      row(this._t("fd_sev"), this._sevBadge(f.severity)),
      row(this._t("fd_conf"), confNode),
      row(this._t("fd_cat"), this._el("span", { text: CAT_ICON[f.category] + " " + this._t("cat_" + f.category) })),
      row(this._t("fd_since"), sinceNode),
      f.items_total ? row(this._t("fd_affected"), this._el("span", { text: String(f.items_total) })) : null,
      row(this._t("fd_status"), statusNode),
    ]);

    const note = this._el("input", { class: "fd-note", attrs: { type: "text", maxlength: "200", placeholder: this._t("fd_note_ph"), value: f.note || "" } });
    const days = this._el("select", { class: "ov-select" });
    SNOOZE_DAYS.forEach((n) => days.appendChild(this._el("option", { text: this._ti("snooze_for", { n }), attrs: { value: String(n) } })));
    const seg = this._el("div", { class: "fd-status-seg" });
    STATUSES.forEach((st) => {
      const b = this._el("button", { class: "fd-st" + (f.status === st ? " active" : ""), text: this._t("st_" + st) });
      b.addEventListener("click", () => {
        if (f.status === st && st !== "snoozed") return;
        this._setFindingState([f.id], st, st === "snoozed" ? parseInt(days.value, 10) : undefined, st === "open" ? undefined : note.value.trim());
      });
      seg.appendChild(b);
    });
    const manage = this._el("div", { class: "fd-card fd-manage" }, [
      this._el("h3", { text: this._t("fd_manage") }),
      seg,
      this._el("div", { class: "fd-manage-row" }, [days]),
      note,
      this._el("div", { class: "hint-line", text: this._t("f_hint") }),
    ]);

    wrap.appendChild(this._el("div", { class: "fd-grid" }, [main, this._el("div", { class: "fd-side" }, [facts, manage])]));
    show(panels.some((p) => p[0] === this._detailTab) ? this._detailTab : "diag");
    return wrap;
  }

  // Zusätzliche Aktionen in der Kopfkarte eines Befunds (steuern statt nur anzeigen).
  _heroActions(f) {
    const p = f.params || {};
    const acts = [];
    const btn = (label, fn, cls) => {
      const b = this._el("button", { class: "vb-btn" + (cls ? " " + cls : ""), text: label });
      b.addEventListener("click", () => fn(b));
      acts.push(b);
    };
    const ref = f.subject_ref;
    if (p.kind === "automation" && ref && ["automation_errors", "automation_skipped", "automation_refs"].includes(f.type)) {
      btn(this._t("au_trigger"), (b) => this._automationAction(b, "trigger", ref, { skip_condition: true }));
      btn(this._t("au_turn_off"), (b) => this._automationAction(b, "turn_off", ref));
    }
    if (f.type === "unused_automation" && ref) btn(this._t("au_turn_off"), (b) => this._automationAction(b, "turn_off", ref));
    if (f.type === "stale_token" && p.token_id) {
      btn(this._t("tk_revoke"), () => this._revokeDialog({ id: p.token_id, user: p.user, client_name: f.subject }), "warn-btn");
    }
    if (f.type === "db_orphans") {
      const ids = (f.items || []).map((i) => i.ref).filter(Boolean);
      btn(this._t("db_sel_delete"), () => this._dbDialog("purge", { ids }), "warn-btn");
    }
    if (f.type === "orphaned_entities") {
      const ids = (f.items || []).map((i) => i.ref).filter(Boolean);
      btn(this._t("db_t_registry"), () => this._dbDialog("registry", { ids }), "warn-btn");
    }
    if (f.type === "integration_not_loaded") {
      btn(this._t("rl_btn"), () => this._reloadDialog([f]));
    }
    if (f.type === "unavailable_entities") {
      const refs = (f.items || []).map((i) => i.ref).filter(Boolean);
      btn(this._t("ed_run"), () => this._disableDialog(refs, "disable"));
      btn(this._t("rm_btn"), () => this._disableDialog(refs, "remove"), "warn-btn");
    }
    if (f.type === "orphaned_devices") {
      btn(this._t("dv_run"), () => this._deviceDialog(f), "warn-btn");
    }
    if (f.type === "backup_old" || f.type === "backup_missing") {
      btn(this._t("cc_btn_backup"), () => this._backupDialog());
    }
    if (f.type === "db_hotspot" && ref) {
      btn(this._t("hs_purge_old"), () => this._dbDialog("purge", { ids: [ref], scopes: ["states"] }), "warn-btn");
    }
    return acts;
  }

  // ---------- Verlauf eines Befunds ----------
  _historyPanel(f, resolved) {
    const events = [];
    if (f.first_seen) events.push({ at: f.first_seen, icon: "🔎", title: this._t("fd_hist_first"), lines: [] });
    (f.history || []).forEach((h) => {
      const lines = [];
      if (h.added && h.added.length) lines.push(this._ti("fd_hist_added", { n: h.added.join(", ") }));
      if (h.removed && h.removed.length) lines.push(this._ti("fd_hist_removed", { n: h.removed.join(", ") }));
      if (h.sev_from) lines.push(this._ti("fd_hist_sev", { a: this._t("sev_" + h.sev_from), b: this._t("sev_" + h.sev_to) }));
      if (h.total_from != null) lines.push(this._ti("fd_hist_total", { a: h.total_from, b: h.total_to }));
      const better = (h.removed && h.removed.length && !(h.added && h.added.length)) || (h.total_to != null && h.total_to < h.total_from);
      events.push({ at: h.at, icon: better ? "📉" : "📈", title: this._fmtDateTime(h.at), lines, plain: true });
    });
    if (resolved) events.push({ at: resolved.resolved_at, icon: "✅", title: this._t("fd_hist_resolved"), lines: [], ok: true });
    const list = this._el("ul", { class: "fd-steps" }, events.map((e) =>
      this._el("li", { class: "fd-step" + (e.ok ? " fix" : "") }, [
        this._el("div", { class: "fd-node", text: e.icon }),
        this._el("div", { class: "fd-step-body" }, [
          this._el("h4", { text: e.plain ? e.title : `${e.title} · ${this._fmtDateTime(e.at)}` }),
          ...e.lines.map((l) => this._el("p", { text: l })),
        ]),
      ])));
    const wrap = this._el("div", {}, [list]);
    if (!(f.history || []).length) wrap.appendChild(this._el("div", { class: "hint-line", text: this._t("fd_hist_none") }));
    return wrap;
  }

  // ---------- Zuletzt behoben: Detailansicht ----------
  _resKey(r) {
    return `${r.id}@${r.resolved_at}`;
  }

  _openResolved(r, list) {
    const content = this.shadowRoot.getElementById("content");
    const view = content && this._captureView(content);
    if (view) this._storedView = { open: view.open, why: view.why, sort: this._sortMem || {}, scroll: [] };
    this._backScroll = this.scrollTop;
    this._resolvedList = (list || [r]).map((x) => this._resKey(x));
    if (!this._detailId && !this._resolvedKey) this._pushNav();
    this._enterFromPage();
    this._resolvedKey = this._resKey(r);
    this._detailId = null;
    this._render();
    this.scrollTop = 0;
  }

  _stepResolved(delta) {
    const list = this._resolvedList || [];
    const next = list[list.indexOf(this._resolvedKey) + delta];
    if (!next) return;
    this._resolvedKey = next;
    this._render();
    this.scrollTop = 0;
  }

  _resolvedView(d, r) {
    const f = Object.assign({ params: {}, details: {}, items: [], items_total: 0, subject: r.subject || String(r.id || "").split(":").slice(1).join(":") }, r);
    f.severity = f.severity || "info";
    f.category = f.category || "storage";
    const hasSnap = !!(r.details || r.items || r.params);
    const doc = this._fdoc(f);
    const wrap = this._el("div", { class: "fd" });
    const back = this._el("button", { class: "vb-btn", text: this._t("r_back") });
    back.addEventListener("click", () => this._closeDetail());
    const list = this._resolvedList || [];
    const pos = list.indexOf(this._resolvedKey);
    const nav = this._el("div", { class: "fd-nav" });
    if (pos >= 0 && list.length > 1) {
      const prev = this._el("button", { class: "vb-btn", text: "‹", attrs: { title: this._t("f_prev") } });
      const next = this._el("button", { class: "vb-btn", text: "›", attrs: { title: this._t("f_next") } });
      prev.disabled = pos <= 0;
      next.disabled = pos >= list.length - 1;
      prev.addEventListener("click", () => this._stepResolved(-1));
      next.addEventListener("click", () => this._stepResolved(1));
      nav.append(prev, this._el("span", { class: "muted", text: `${pos + 1} / ${list.length}` }), next);
    }
    wrap.appendChild(this._el("div", { class: "fd-top" }, [back, this._el("span", { class: "muted fd-crumb", text: this._t("f_resolved") + " › " + doc.title }), nav]));

    const badges = this._el("div", { class: "fd-badges" }, [
      this._chip(this._t("r_resolved_badge"), "ok-chip"),
      this._sevBadge(f.severity),
      this._chip(CAT_ICON[f.category] + " " + this._t("cat_" + f.category)),
    ]);
    const hero = this._el("div", { class: "fd-hero resolved", style: "--sev:var(--success-color,#43a047)" }, [
      this._el("div", { class: "fd-ico", text: TYPE_ICON[f.type] || "🧭" }),
      this._el("div", { class: "fd-hero-main" }, [
        badges,
        this._el("h2", { class: "fd-title", text: doc.title }),
        this._el("div", { class: "f-sub" }, this._fSubject(f)),
      ]),
    ]);
    if (f.link && !String(f.link).startsWith("#")) {
      hero.appendChild(this._linkBtn(this._t("f_open_ha") + " ↗", f.link, "fd-open"));
    }
    wrap.appendChild(hero);

    const okBox = this._el("div", { class: "res-ok" }, [
      this._el("span", { class: "res-ok-ico", text: "✅" }),
      this._el("p", { text: this._ti("r_now_ok", { d: this._fmtDateTime(r.resolved_at) }) }),
    ]);
    const diag = this._el("div", {}, [
      okBox,
      hasSnap ? this._el("ul", { class: "fd-steps" }, [
        this._el("li", { class: "fd-step" }, [this._el("div", { class: "fd-node", text: "🔎" }), this._el("div", { class: "fd-step-body" }, [this._el("h4", { text: this._t("r_was") }), this._el("p", { text: doc.what })])]),
        this._el("li", { class: "fd-step" }, [this._el("div", { class: "fd-node", text: "🧩" }), this._el("div", { class: "fd-step-body" }, [this._el("h4", { text: this._t("fd_cause") }), this._el("p", { text: doc.cause })])]),
        this._el("li", { class: "fd-step" }, [this._el("div", { class: "fd-node", text: "⚡" }), this._el("div", { class: "fd-step-body" }, [this._el("h4", { text: this._t("fd_impact") }), this._el("p", { text: doc.impact })])]),
      ]) : this._el("div", { class: "hint-line", text: this._t("r_no_snapshot") }),
    ]);
    const panels = [["diag", this._t("fd_tab_diag"), diag]];
    if ((f.items || []).length) panels.push(["items", `${this._t("fd_tab_items")} ${f.items_total || f.items.length}`, this._itemsPanel(f, { now: true })]);
    panels.push(["history", this._t("fd_tab_history"), this._historyPanel(f, r)]);
    if (hasSnap) panels.push(["tech", this._t("fd_tab_tech"), this._techPanel(f)]);
    const tabBar = this._el("div", { class: "fd-tabs" });
    const panelBox = this._el("div", { class: "fd-panels" });
    const show = (key) => {
      this._detailTab = key;
      tabBar.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.key === key));
      panelBox.querySelectorAll(".fd-panel").forEach((p) => { p.hidden = p.dataset.key !== key; });
    };
    panels.forEach(([key, label, node]) => {
      const b = this._el("button", { class: "fd-tab", text: label, attrs: { "data-key": key } });
      b.addEventListener("click", () => show(key));
      tabBar.appendChild(b);
      panelBox.appendChild(this._el("div", { class: "fd-panel", attrs: { "data-key": key } }, [node]));
    });
    const row = (label, node) =>
      this._el("div", { class: "fd-fact" }, [this._el("div", { class: "fd-fact-l", text: label }), this._el("div", { class: "fd-fact-v" }, [node])]);
    const start = Date.parse(r.first_seen);
    const end = Date.parse(r.resolved_at);
    let dur = "—";
    if (start && end && end >= start) {
      const h = Math.round((end - start) / 3600000);
      dur = h >= 48 ? this._ti("r_days", { n: Math.round(h / 24) }) : this._ti("r_hours", { n: Math.max(h, 1) });
    }
    const facts = this._el("div", { class: "fd-card fd-facts" }, [
      this._el("h3", { text: this._t("fd_glance") }),
      row(this._t("r_resolved_at"), this._el("div", {}, [this._el("div", { text: this._fmtDateTime(r.resolved_at) }), this._el("div", { class: "muted small", text: this._ago(new Date(r.resolved_at)) })])),
      row(this._t("fd_since"), this._el("span", { text: r.first_seen ? this._fmtDateTime(r.first_seen) : "—" })),
      row(this._t("r_duration"), this._el("span", { text: dur })),
      row(this._t("fd_sev"), this._sevBadge(f.severity)),
      f.items_total ? row(this._t("fd_affected"), this._el("span", { text: String(f.items_total) })) : null,
      r.status && r.status !== "open" ? row(this._t("fd_status"), this._el("span", { text: this._t("st_" + r.status) })) : null,
      r.note ? row(this._t("fd_note_label"), this._el("span", { text: r.note })) : null,
    ]);
    wrap.appendChild(this._el("div", { class: "fd-grid" }, [this._el("div", { class: "fd-card fd-main" }, [tabBar, panelBox]), this._el("div", { class: "fd-side" }, [facts])]));
    show(panels.some((p) => p[0] === this._detailTab) ? this._detailTab : "diag");
    return wrap;
  }

  // ---------- Protokoll ----------
  async _loadAudit(box, prefix) {
    if (!box || !this._hass) return;
    let entries = [];
    try {
      const res = await this._hass.connection.sendMessagePromise({ type: "ha_percyta/db_log" });
      entries = (res && res.entries) || [];
    } catch (e) {}
    entries = entries.filter((e) => (prefix ? String(e.action).startsWith(prefix) : !String(e.action).startsWith("secret_")));
    box.replaceChildren();
    if (!entries.length) {
      box.appendChild(this._el("div", { class: "empty", text: this._t(prefix ? "sec_audit_empty" : "log_empty") }));
      return;
    }
    const rows = entries.map((e) => {
      const target = e.target || (e.old && e.new ? `${e.old} → ${e.new}` : (e.ids || []).join(", ")) || e.name || e.kind || "";
      return [
        { text: this._fmtDateTime(e.at), sort: Date.parse(e.at) || 0 },
        e.user || "?",
        this._t("a_" + e.action),
        { node: this._el("span", { class: "mono", text: String(target).slice(0, 300) }) },
        { node: this._chip(e.ok ? this._t("ok") : this._t("failed") + (e.error ? ": " + e.error : ""), e.ok ? "" : "danger") },
      ];
    });
    const saved = this._search;
    this._search = "";
    box.appendChild(this._table([this._t("th_time"), this._t("th_user"), this._t("th_action"), this._t("th_target"), this._t("th_result")], rows, { sortIdx: 0, sortDir: "desc", memKey: "audit-" + (prefix || "db") }));
    this._search = saved;
  }

  // ---------- Datenbank-Werkzeuge ----------
  _dbToolbar(d) {
    const mk = (label, title, fn) => {
      const b = this._el("button", { class: "vb-btn", text: label, attrs: title ? { title } : {} });
      b.addEventListener("click", fn);
      return b;
    };
    return this._el("div", { class: "db-toolbar" }, [
      this._el("div", { class: "db-warn", text: this._t("db_warn") }),
      this._el("div", { class: "db-calm", text: this._t("db_calm") }),
      this._el("div", { class: "db-tool-row" }, [
        this._el("span", { class: "db-tool-title", text: this._t("db_tools") }),
        mk(this._t("db_t_replace"), this._t("db_t_replace_t"), () => this._dbDialog("replace", {})),
        mk(this._t("db_t_rename"), "", () => this._dbDialog("rename", {})),
        mk(this._t("db_t_purge"), "", () => this._dbDialog("purge", {})),
        mk(this._t("db_t_cleanup"), this._t("db_t_cleanup_t"), () => this._cleanupDialog()),
        mk(this._t("db_t_registry"), this._t("db_t_registry_t"), () => this._dbDialog("registry", {})),
        mk(this._t("db_t_backup"), "", () => this._backupDialog()),
        mk(this._t("db_t_log"), "", () => this._logDialog()),
      ]),
    ]);
  }

  _dbRowMenu(id, statOnly) {
    const sel = this._el("select", { class: "ov-select db-row-menu", attrs: { title: this._t("db_row_menu"), "aria-label": this._t("db_row_menu") } });
    const opts = [["", "⋯"]];
    if (!statOnly) opts.push(["replace", this._t("db_t_replace")], ["rename", this._t("db_t_rename")]);
    opts.push(["purge", this._t("db_t_purge")]);
    opts.forEach(([v, l]) => sel.appendChild(this._el("option", { text: l, attrs: { value: v } })));
    sel.addEventListener("change", () => {
      const v = sel.value;
      sel.value = "";
      if (v === "replace") this._dbDialog("replace", { old: id });
      else if (v === "rename") this._dbDialog("rename", { old: id });
      else if (v === "purge") this._dbDialog("purge", { ids: [id] });
    });
    return sel;
  }

  _dbOrphansSection(db) {
    if (!Array.isArray(db.orphans)) return null;
    const list = db.orphans;
    const sel = (this._orphanSel = this._orphanSel || new Set());
    Array.from(sel).forEach((i) => { if (!list.some((o) => o.id === i)) sel.delete(i); });
    let body;
    if (!list.length) {
      body = this._el("div", { class: "empty", text: this._t("db_orphans_none") });
    } else {
      const info = this._el("span", { class: "muted f-sel-info" });
      const del = this._el("button", { class: "vb-btn", text: this._t("db_sel_delete") });
      const update = () => {
        info.textContent = sel.size ? this._ti("db_sel_n", { n: sel.size }) : "";
        del.disabled = !sel.size;
      };
      del.addEventListener("click", () => this._dbDialog("purge", { ids: Array.from(sel) }));
      const all = this._el("button", { class: "vb-btn", text: this._t("f_select_page") });
      const none = this._el("button", { class: "vb-btn", text: this._t("f_clear_sel") });
      const maxR = list.reduce((m, o) => Math.max(m, (o.states || 0) + (o.stats || 0)), 0) || 1;
      const rows = list.map((o) => {
        const cb = this._el("input", { class: "f-cb", attrs: { type: "checkbox", "data-id": o.id } });
        cb.checked = sel.has(o.id);
        cb.addEventListener("change", () => { if (cb.checked) sel.add(o.id); else sel.delete(o.id); update(); });
        const sum = (o.states || 0) + (o.stats || 0);
        return [
          { node: cb, nosrch: true, sort: 0 },
          { node: this._el("span", { class: "mono", text: o.id }), sort: o.id },
          { text: this._fmtInt(o.states), sort: o.states || 0 },
          { text: this._fmtInt(o.stats), sort: o.stats || 0 },
          { node: this._el("div", { class: "bar-cell" }, [this._meter(this._sharePct(sum, maxR), "warn")]), sort: sum, nosrch: true },
          { node: this._dbRowMenu(o.id), nosrch: true, sort: "" },
        ];
      });
      const table = this._table(["", this._t("th_entity"), this._t("th_states"), this._t("th_stats"), this._t("th_share"), ""], rows,
        { sortIdx: 4, sortDir: "desc", memKey: "db-orphans", cols: [{ cls: "f-check", nosort: true }, {}, {}, {}, {}, { cls: "f-go", nosort: true }] });
      all.addEventListener("click", () => {
        table.querySelectorAll("tbody tr:not([hidden]) input.f-cb").forEach((cb) => { cb.checked = true; sel.add(cb.dataset.id); });
        update();
      });
      none.addEventListener("click", () => { sel.clear(); table.querySelectorAll("input.f-cb").forEach((cb) => { cb.checked = false; }); update(); });
      update();
      body = this._el("div", {}, [
        this._el("div", { class: "hint-line", text: this._t("db_orphans_hint") }),
        this._el("div", { class: "f-row db-sel-bar" }, [all, none, info, del]),
        table,
      ]);
    }
    const sec = this._section(this._t("db_orphans"), db.orphans_total != null ? db.orphans_total : list.length, body);
    sec.id = "db-orphans";
    return sec;
  }

  // Modal (liegt außerhalb von #content und übersteht deshalb Aktualisierungen).
  _openModal(title, bodyNode, footerNodes) {
    this._closeModal();
    const close = this._el("button", { class: "modal-x", text: "×", attrs: { title: this._t("dlg_close"), "aria-label": this._t("dlg_close") } });
    close.addEventListener("click", () => this._closeModal());
    const modal = this._el("div", { class: "modal", attrs: { role: "dialog", "aria-modal": "true" } }, [
      this._el("div", { class: "modal-head" }, [this._el("h3", { text: title }), close]),
      this._el("div", { class: "modal-body" }, [bodyNode]),
      this._el("div", { class: "modal-foot" }, footerNodes || []),
    ]);
    const back = this._el("div", { class: "modal-back" }, [modal]);
    back.addEventListener("click", (e) => { if (e.target === back && !this._modalBusy) this._closeModal(); });
    this.shadowRoot.appendChild(back);
    this._modal = back;
    return modal;
  }

  _closeModal() {
    if (this._modalBusy) return;
    if (this._modal) this._modal.remove();
    this._modal = null;
  }

  _errText(res) {
    const code = (res && (res.error || res.code)) || "action_failed";
    const key = "e_" + code;
    const txt = STR[this._lang()][key] || STR.en[key] || code;
    return res && res.message && res.message !== code && !STR.en[key] ? `${txt} (${res.message})` : txt;
  }

  async _ws(msg) {
    try {
      return await this._hass.connection.sendMessagePromise(msg);
    } catch (err) {
      return { error: (err && err.code) || "action_failed", message: (err && err.message) || String(err) };
    }
  }

  _check(label, checked, hint) {
    const cb = this._el("input", { attrs: { type: "checkbox" } });
    cb.checked = !!checked;
    const text = hint
      ? this._el("span", {}, [this._el("span", { text: label }), this._el("span", { class: "dlg-check-h", text: hint })])
      : this._el("span", { text: label });
    return { cb, node: this._el("label", { class: "dlg-check" }, [cb, text]) };
  }

  // Zeitraum je Datenart (Verlauf / Langzeit- / Kurzzeitstatistik).
  _rangeCell(x) {
    const rows = [];
    if (x.states) rows.push(["📈", this._t("pv_r_states"), x.states_first, x.states_last]);
    if (x.stats_long) rows.push(["📊", this._t("pv_r_long"), x.stats_first, x.stats_last]);
    if (x.stats_short) rows.push(["⏱️", this._t("pv_r_short"), x.stats_short_first, x.stats_short_last]);
    if (!rows.length) return this._el("span", { class: "muted", text: "—" });
    return this._el("div", { class: "pv-ranges" }, rows.map(([i, l, a, b]) =>
      this._el("div", { class: "pv-range", attrs: { title: l } }, [this._el("span", { text: i }), this._el("span", { text: this._fmtRange(a, b) })])));
  }

  _fmtRange(a, b) {
    if (!a && !b) return "—";
    const f = (x) => {
      const t = new Date(x);
      return isNaN(t.getTime()) ? "?" : t.toLocaleDateString(this._lang(), { day: "2-digit", month: "2-digit", year: "2-digit" });
    };
    return `${f(a)} – ${f(b)}`;
  }

  // Zeilen, die beim Löschen mit den gewählten Häkchen wegfallen.
  _estRows(x, est) {
    x = x || {};
    return (est.states ? x.states || 0 : 0) + (est.short ? x.stats_short || 0 : 0) + (est.long ? x.stats_long || 0 : 0);
  }

  _previewTable(info, ids, est) {
    const rows = ids.map((id) => {
      const x = (info && info.ids && info.ids[id]) || {};
      const st = x.state;
      const ent = st ? `${st.state}${st.unit ? " " + st.unit : ""}` : (x.registry ? this._t("dlg_pv_reg") : this._t("dlg_pv_missing"));
      const row = [
        { node: this._el("span", { class: "mono", text: id }) },
        ent,
        x.states ? this._fmtInt(x.states) : this._t("dlg_pv_none"),
        x.stats_long || x.stats_short
          ? `${this._fmtInt(x.stats_long)} / ${this._fmtInt(x.stats_short)}${x.stats_unit ? " (" + x.stats_unit + ")" : ""}` : this._t("dlg_pv_none"),
        { node: this._rangeCell(x), sort: x.states_first || x.stats_first || "" },
      ];
      if (est) {
        const b = this._estRows(x, est) * est.bpr;
        row.push({ text: b ? (est.partial ? "≤ " : "≈ ") + this._fmtBytes(b) : "—", sort: b });
      }
      return row;
    });
    const heads = [this._t("th_entity"), this._t("dlg_pv_entity"), this._t("dlg_pv_states"), this._t("dlg_pv_stats"), this._t("dlg_pv_range")];
    if (est) heads.push(this._t("dlg_pv_size"));
    const saved = this._search;
    this._search = "";
    const t = this._table(heads, rows, { memKey: "dlg-preview" + (est ? "-est" : "") });
    this._search = saved;
    return t;
  }

  _backupChooser(info, preferHa) {
    const sqlite = !info || info.sqlite !== false;
    const name = "bk-" + Math.random().toString(36).slice(2);
    const opt = (val, label, checked, disabled) => {
      const r = this._el("input", { attrs: { type: "radio", name, value: val } });
      r.checked = !!checked;
      r.disabled = !!disabled;
      return this._el("label", { class: "dlg-check" }, [r, this._el("span", { text: label })]);
    };
    const hasHa = !info || (info.backup_services || []).length > 0;
    const copies = (info && info.copies) || [];
    const sp = this._spaceState(info);
    const haFirst = (preferHa && hasHa) || !sqlite;
    // Reicht der Platz nur, wenn die alte Kopie ersetzt wird? Dann das vorschlagen.
    const replaceFirst = sqlite && !haFirst && sp && !sp.fitsNew && sp.fitsReplace && copies.length > 0;
    const box = this._el("div", { class: "dlg-backup" }, [
      this._el("div", { class: "dlg-sub", text: this._t("dlg_backup_title") }),
      opt("db_copy", this._t("dlg_bk_copy"), sqlite && !haFirst && !replaceFirst, !sqlite),
      copies.length && sqlite ? opt("db_copy_replace", this._t("dlg_bk_replace"), replaceFirst, false) : null,
      opt("ha_backup", this._t("dlg_bk_ha"), haFirst, !hasHa),
      opt("skip", this._t("dlg_bk_skip"), false, false),
      !sqlite ? this._el("div", { class: "dlg-warn", text: this._t("dlg_bk_ext") }) : null,
      sqlite && sp ? this._el("div", { class: "muted small bk-space", text: sp.text }) : null,
      sqlite && sp && !sp.fitsNew ? this._el("div", { class: "dlg-warn", text: this._t(sp.fitsReplace && copies.length ? "bk_space_low" : "bk_space_none") }) : null,
    ]);
    box.value = () => { const r = box.querySelector("input:checked"); return r ? r.value : "db_copy"; };
    box.setValue = (v) => {
      const r = box.querySelector(`input[value="${v}"]`);
      if (r && !r.disabled) { r.checked = true; return true; }
      return false;
    };
    return box;
  }

  // Platz für eine Datenbank-Kopie: reicht er neu bzw. wenn die vorhandenen Kopien ersetzt werden?
  _spaceState(info) {
    const sp = info && info.space;
    if (!sp || sp.free == null || sp.needed == null) return null;
    const copiesSize = ((info && info.copies) || []).reduce((a, c) => a + (c.size || 0), 0);
    return {
      fitsNew: sp.free >= sp.needed,
      fitsReplace: sp.free + copiesSize >= sp.needed,
      copiesSize,
      text: this._ti("bk_space", { db: this._fmtBytes(sp.db_size), need: this._fmtBytes(sp.needed), free: this._fmtBytes(sp.free) }),
    };
  }

  // Hilfe bei „nicht genug Speicher“: vorhandene Percyta-Kopien zeigen (löschbar) und Alternativen anbieten.
  async _noSpaceHelp(slot, err, api) {
    const chooser = api && api.get ? api.get() : null;
    const p = (err && err.params) || {};
    const box = this._el("div", { class: "ns-box" });
    slot.replaceChildren(box);
    let deleted = false;
    const render = async () => {
      const info = await this._ws({ type: "ha_percyta/db_info", ids: [] });
      const copies = (info && !info.error && info.copies) || [];
      const free = info && info.space && info.space.free != null ? info.space.free : p.free;
      const needed = (info && info.space && info.space.needed) || p.needed;
      const fits = deleted && free != null && needed != null && free >= needed;
      box.classList.toggle("ok", !!fits);
      box.replaceChildren(
        this._el("div", { class: "ns-title", text: this._t(fits ? "ns_ok_t" : "ns_title") }),
        this._el("div", { text: fits ? this._ti("ns_ok", { free: this._fmtBytes(free) }) : this._ti(deleted ? "ns_text2" : "ns_text", { need: this._fmtBytes(needed), free: this._fmtBytes(free) }) }),
        this._el("div", { class: "muted small", style: "margin-top:6px;line-height:1.5", text: this._t("ns_hint") }),
      );
      if (copies.length) {
        const total = copies.reduce((a, c) => a + (c.size || 0), 0);
        box.appendChild(this._el("div", { class: "dlg-sub", text: this._ti("ns_copies", { n: copies.length, s: this._fmtBytes(total) }) }));
        copies.forEach((c) => {
          const del = this._el("button", { class: "vb-btn small", text: this._t("bk_delete"), attrs: { type: "button" } });
          del.addEventListener("click", async () => {
            del.disabled = true;
            const r = await this._ws({ type: "ha_percyta/db_backup_delete", name: c.name });
            if (r && r.error) { del.disabled = false; del.textContent = "⚠️ " + this._errText(r); return; }
            deleted = true;
            this._loadCopies();
            if (api && api.refresh) await api.refresh();
            await render();
          });
          box.appendChild(this._el("div", { class: "ns-row" }, [
            this._el("span", { class: "mono small", text: c.name }),
            this._el("span", { class: "muted small", text: `${this._fmtDateTime(c.created)} · ${this._fmtBytes(c.size)}` }),
            del,
          ]));
        });
      } else {
        box.appendChild(this._el("div", { class: "muted small", style: "margin-top:6px", text: this._t("ns_no_copies") }));
      }
      const note = this._el("div", { class: "small ok-text" });
      const pick = (val, label) => {
        const b = this._el("button", { class: "vb-btn small", text: label, attrs: { type: "button" } });
        b.addEventListener("click", () => {
          const ch = api && api.get ? api.get() : null;
          if (ch && ch.setValue(val)) note.textContent = this._t("ns_chosen");
        });
        return b;
      };
      const btns = [];
      if (chooser && copies.length && chooser.querySelector('input[value="db_copy_replace"]')) btns.push(pick("db_copy_replace", this._t("ns_replace")));
      if (chooser && (info.backup_services || []).length) btns.push(pick("ha_backup", this._t("ns_ha")));
      if (btns.length) box.appendChild(this._el("div", { class: "f-row", style: "margin-top:8px" }, btns));
      box.appendChild(note);
    };
    await render();
    requestAnimationFrame(() => box.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  // ---------- Auswahl-Komponente (durchsuchbares Dropdown, Einzel- oder Mehrfachauswahl) ----------
  async _loadDbList(force) {
    if (this._dbList && !force) return this._dbList;
    const res = await this._ws({ type: "ha_percyta/db_list" });
    this._dbList = res && !res.error ? res.items || [] : [];
    return this._dbList;
  }

  // Quelle "db": IDs mit Daten in der Datenbank; "entities": aktuelle Entitäten (+ DB-Zahlen);
  // "restored": verwaiste Entitäten (noch registriert, von keiner Integration bereitgestellt).
  _pickerItems(source, dbList) {
    const states = (this._hass && this._hass.states) || {};
    const byId = new Map((dbList || []).map((x) => [x.id, x]));
    if (source === "db") return (dbList || []).slice();
    const out = [];
    Object.keys(states).forEach((id) => {
      const st = states[id];
      const restored = !!(st.attributes && st.attributes.restored);
      if (source === "restored" && !restored && st.state !== "unavailable") return;
      const db = byId.get(id) || {};
      out.push({
        id, name: (st.attributes && st.attributes.friendly_name) || db.name, exists: true, restored,
        state: st.state, states: db.states || 0, stats: db.stats || 0, recorded: db.recorded,
      });
    });
    out.sort((a, b) => (b.restored - a.restored) || (b.states + b.stats - a.states - a.stats) || a.id.localeCompare(b.id));
    return out;
  }

  _fmtCompact(n) {
    try { return new Intl.NumberFormat(this._lang(), { notation: "compact", maximumFractionDigits: 1 }).format(n || 0); } catch (e) { return String(n || 0); }
  }

  _picker(opts) {
    const multi = !!opts.multi;
    const items = opts.items || [];
    const selected = new Set(opts.preset || []);
    let filter = "all";
    let domain = "";
    const changeCbs = [];
    const root = this._el("div", { class: "pk" + (multi ? " multi" : "") });
    const chips = this._el("div", { class: "pk-chips" });
    const input = this._el("input", { class: "fd-note mono pk-input", attrs: { type: "text", placeholder: opts.placeholder || this._t("pk_search"), spellcheck: "false", autocomplete: "off" } });
    if (!multi && opts.preset && opts.preset[0]) input.value = opts.preset[0];
    const caret = this._el("button", { class: "pk-caret", text: "▾", attrs: { type: "button", title: this._t("pk_open"), tabindex: "-1" } });
    const field = this._el("div", { class: "pk-field" }, [input, caret]);
    const panel = this._el("div", { class: "pk-panel" });
    panel.hidden = true;
    const bar = this._el("div", { class: "pk-bar" });
    const list = this._el("div", { class: "pk-list", attrs: { role: "listbox" } });
    const foot = this._el("div", { class: "pk-foot" });
    panel.append(bar, list, foot);

    const domains = Array.from(new Set(items.map((x) => String(x.id).split(/[.:]/)[0]))).sort();
    const fdefs = [["all", "pk_f_all"], ["orphan", "pk_f_orphan"], ["restored", "pk_f_restored"], ["stats", "pk_f_stats"], ["norec", "pk_f_norec"]]
      .filter(([k]) => k === "all" || items.some((x) => this._pkMatchFilter(x, k)));
    fdefs.forEach(([k, label]) => {
      const b = this._el("button", { class: "pk-f" + (k === filter ? " active" : ""), text: this._t(label), attrs: { type: "button", "data-f": k } });
      b.addEventListener("click", (e) => { e.preventDefault(); filter = k; bar.querySelectorAll(".pk-f").forEach((x) => x.classList.toggle("active", x.dataset.f === k)); render(); });
      bar.appendChild(b);
    });
    if (domains.length > 1) {
      const sel = this._el("select", { class: "ov-select pk-dom" });
      sel.appendChild(this._el("option", { text: this._t("pk_all_domains"), attrs: { value: "" } }));
      domains.forEach((d) => sel.appendChild(this._el("option", { text: d, attrs: { value: d } })));
      sel.addEventListener("change", () => { domain = sel.value; render(); });
      bar.appendChild(sel);
    }

    const emit = () => changeCbs.forEach((cb) => { try { cb(); } catch (e) {} });
    const matches = () => {
      const q = (multi ? input.value : (panel.hidden ? "" : input.value)).trim().toLowerCase();
      return items.filter((x) =>
        this._pkMatchFilter(x, filter) &&
        (!domain || String(x.id).split(/[.:]/)[0] === domain) &&
        (!q || x.id.toLowerCase().includes(q) || String(x.name || "").toLowerCase().includes(q)));
    };
    // Kopfzeile der Auswahl: Anzahl · Suche in der Auswahl (Liste) · Ansicht Liste/Kacheln · Alle abwählen.
    const byId = new Map(items.map((it) => [it.id, it]));
    let listView = false;
    try { listView = window.localStorage.getItem(LS_PK_VIEW) === "list"; } catch (e) {}
    let selFilter = "";
    const headInfo = this._el("span", { class: "pk-head-info muted small" });
    const selSearch = this._el("input", { class: "pk-sel-search", attrs: { type: "text", placeholder: this._t("pk_sel_search"), spellcheck: "false", autocomplete: "off" } });
    selSearch.addEventListener("input", () => { selFilter = selSearch.value.trim().toLowerCase(); renderChips(); });
    const viewBtn = this._el("button", { class: "pk-view", attrs: { type: "button" } });
    viewBtn.addEventListener("click", (e) => {
      e.preventDefault();
      listView = !listView;
      try { window.localStorage.setItem(LS_PK_VIEW, listView ? "list" : "chips"); } catch (err) {}
      renderChips();
    });
    const clr = this._el("button", { class: "pk-clear", attrs: { type: "button" } });
    // Vorauswahl mit einem Klick leeren (z. B. alle vorgeschlagenen Einträge abwählen).
    clr.addEventListener("click", (e) => { e.preventDefault(); selected.clear(); renderChips(); if (!panel.hidden) render(); emit(); });
    const head = this._el("div", { class: "pk-head" }, [headInfo, selSearch, viewBtn, clr]);
    root.append(multi ? head : null, multi ? chips : null, field, panel);
    const renderChips = () => {
      const st = (this._hass && this._hass.states) || {};
      headInfo.textContent = selected.size ? this._ti("pk_sel_n", { n: this._fmtInt(selected.size) }) : this._t("pk_none_sel");
      viewBtn.textContent = listView ? this._t("pk_view_chips") : this._t("pk_view_list");
      viewBtn.hidden = !selected.size;
      clr.hidden = !selected.size;
      clr.textContent = this._ti("pk_clear_all", { n: selected.size });
      selSearch.hidden = !listView || selected.size < 8;
      chips.className = "pk-chips" + (listView ? " list" : "");
      chips.replaceChildren();
      Array.from(selected).forEach((id) => {
        const item = byId.get(id);
        const x = this._el("button", { class: "pk-x", text: "×", attrs: { type: "button", title: this._t("pk_remove") } });
        x.addEventListener("click", (e) => { e.preventDefault(); selected.delete(id); renderChips(); render(); emit(); });
        if (listView) {
          const name = (item && item.name) || (st[id] && st[id].attributes && st[id].attributes.friendly_name) || "";
          if (selFilter && !(`${id} ${name}`.toLowerCase().includes(selFilter))) return;
          const note = (item && item.note) || (st[id] ? String(st[id].state) : "");
          chips.appendChild(this._el("div", { class: "pk-lrow" }, [
            this._el("div", { class: "pk-lmain" }, [
              this._el("span", { class: "pk-lname", text: name ? String(name) : id }),
              name ? this._el("span", { class: "pk-lid mono", text: id }) : null,
            ]),
            note ? this._el("span", { class: "pk-lnote", text: note }) : null,
            x,
          ]));
          return;
        }
        const label = opts.chipName && item && item.name ? String(item.name) : id;
        chips.appendChild(this._el("span", { class: "pk-chip" + (opts.chipName && item ? "" : " mono"), attrs: { title: id } }, [this._el("span", { text: label }), x]));
      });
      if (listView && selected.size && !chips.children.length) chips.appendChild(this._el("div", { class: "pk-empty muted", text: this._t("pk_nothing") }));
    };
    const badge = (text, cls) => this._el("span", { class: "pk-badge " + (cls || ""), text });
    const render = () => {
      const all = matches();
      const shown = all.slice(0, 150);
      list.replaceChildren();
      if (!shown.length) {
        list.appendChild(this._el("div", { class: "pk-empty muted", text: this._t("pk_nothing") }));
      }
      shown.forEach((x) => {
        const isSel = multi ? selected.has(x.id) : input.value.trim() === x.id;
        const badges = [];
        if (x.external) badges.push(badge(this._t("pk_b_external"), ""));
        else if (!x.exists) badges.push(badge(this._t("pk_b_orphan"), "warn"));
        if (x.restored) badges.push(badge(this._t("pk_b_restored"), "warn"));
        if (x.disabled) badges.push(badge(this._t("pk_b_disabled"), ""));
        if (x.recorded === false) badges.push(badge(this._t("pk_b_norec"), ""));
        const counts = x.note ? x.note : (x.states || x.stats) ? `${this._fmtCompact(x.states)} ${this._t("pk_states")} · ${this._fmtCompact(x.stats)} ${this._t("pk_stats")}` : this._t("dlg_pv_none");
        const row = this._el("div", { class: "pk-row" + (isSel ? " sel" : ""), attrs: { role: "option", "aria-selected": String(isSel) } }, [
          multi ? this._el("span", { class: "pk-cb", text: isSel ? "☑" : "☐" }) : null,
          this._el("div", { class: "pk-main" }, [
            this._el("div", { class: "pk-id mono", text: x.id }),
            this._el("div", { class: "pk-sub muted" }, [
              x.name ? this._el("span", { text: String(x.name) }) : null,
              this._el("span", { text: counts }),
              ...badges,
            ]),
          ]),
        ]);
        row.addEventListener("mousedown", (e) => e.preventDefault()); // Fokus im Eingabefeld halten
        row.addEventListener("click", () => {
          if (multi) {
            if (selected.has(x.id)) selected.delete(x.id);
            else if (selected.size < (opts.limit || 200)) selected.add(x.id);
            renderChips();
            render();
          } else {
            input.value = x.id;
            panel.hidden = true;
          }
          emit();
        });
        list.appendChild(row);
      });
      foot.replaceChildren();
      foot.appendChild(this._el("span", { class: "muted small", text: this._ti("pk_count", { n: all.length, m: shown.length }) }));
      if (multi && all.length) {
        const lim = opts.limit || 200;
        const addAll = this._el("button", { class: "vb-btn small", text: all.length > lim ? this._ti("pk_add_lim", { n: lim, m: all.length }) : this._ti("pk_add_all", { n: all.length }), attrs: { type: "button" } });
        addAll.addEventListener("click", (e) => {
          e.preventDefault();
          for (const x of all) { if (selected.size >= (opts.limit || 200)) break; selected.add(x.id); }
          renderChips(); render(); emit();
        });
        const clear = this._el("button", { class: "vb-btn small", text: this._t("f_clear_sel"), attrs: { type: "button" } });
        clear.addEventListener("click", (e) => { e.preventDefault(); selected.clear(); renderChips(); render(); emit(); });
        foot.append(addAll, clear);
      }
    };
    const open = () => { panel.hidden = false; render(); };
    input.addEventListener("focus", open);
    input.addEventListener("click", open);
    input.addEventListener("input", () => { panel.hidden = false; render(); if (!multi) emit(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const v = input.value.trim();
        const first = matches()[0];
        if (multi) {
          if (/^[a-z0-9_]+[.:][a-z0-9_]+$/.test(v) && (opts.allowFree || items.some((x) => x.id === v))) { selected.add(v); input.value = ""; }
          else if (first) selected.add(first.id);
          renderChips(); render(); emit();
        } else if (first && !items.some((x) => x.id === v)) {
          input.value = first.id; panel.hidden = true; emit();
        } else { panel.hidden = true; emit(); }
      } else if (e.key === "Escape" && !panel.hidden) {
        e.stopPropagation();
        panel.hidden = true;
      }
    });
    caret.addEventListener("click", (e) => { e.preventDefault(); if (panel.hidden) { input.focus(); open(); } else panel.hidden = true; });
    input.addEventListener("blur", () => setTimeout(() => { if (!root.contains(this.shadowRoot.activeElement)) panel.hidden = true; }, 150));
    renderChips();
    return {
      node: root,
      values: () => (multi ? Array.from(selected) : [input.value.trim()].filter(Boolean)),
      onChange: (cb) => changeCbs.push(cb),
      focus: () => input.focus(),
      // Eingetippte, noch nicht übernommene ID übernehmen (Mehrfachauswahl).
      commitPending: () => {
        const v = input.value.trim();
        if (!multi || !v) return false;
        if (/^[a-z0-9_]+[.:][a-z0-9_]+$/.test(v) && (opts.allowFree || items.some((x) => x.id === v))) {
          selected.add(v); input.value = ""; renderChips(); emit(); return true;
        }
        return false;
      },
    };
  }

  _pkMatchFilter(x, f) {
    if (f === "orphan") return !x.exists && !x.external;
    if (f === "restored") return !!x.restored;
    if (f === "stats") return (x.stats || 0) > 0;
    if (f === "norec") return x.recorded === false;
    return true;
  }

  async _dbDialog(kind, pre) {
    const body = this._el("div", { class: "dlg" });
    const intro = { replace: "dlg_replace_intro", rename: "dlg_rename_intro", purge: "dlg_purge_intro", registry: "dlg_reg_intro" }[kind];
    body.appendChild(this._el("p", { class: "dlg-intro", text: this._t(intro) }));
    const loading = this._el("div", { class: "muted small", text: this._t("pk_loading") });
    body.appendChild(loading);
    const status = this._el("div", { class: "dlg-status" });
    const cancel = this._el("button", { class: "vb-btn", text: this._t("dlg_cancel") });
    const run = this._el("button", { class: "fd-open danger", text: this._t("dlg_run") });
    run.disabled = true;
    cancel.addEventListener("click", () => this._closeModal());
    const title = { replace: "dlg_replace_title", rename: "dlg_rename_title", purge: "dlg_purge_title", registry: "dlg_reg_title" }[kind];
    this._openModal(this._t(title), body, [cancel, run]);

    const dbList = await this._loadDbList(!!pre.reload);
    loading.remove();
    let oldPk, newPk, newIn, idsPk, removeOld, purgeNew, force, scopeStates, scopeShort, scopeStats, keepSel, purgeData;
    const field = (label, node) => this._el("div", { class: "dlg-field" }, [this._el("span", { text: label }), node]);
    if (kind === "replace") {
      oldPk = this._picker({ items: this._pickerItems("db", dbList), preset: pre.old ? [pre.old] : [], placeholder: this._t("pk_ph_old") });
      newPk = this._picker({ items: this._pickerItems("entities", dbList), preset: pre.new ? [pre.new] : [], placeholder: this._t("pk_ph_new") });
      body.append(field(this._t("dlg_old"), oldPk.node), field(this._t("dlg_new"), newPk.node));
      removeOld = this._check(this._t("dlg_remove_old"), true);
      purgeNew = this._check(this._t("dlg_purge_new"), true);
      force = this._check(this._t("dlg_force"), false);
      body.append(removeOld.node, purgeNew.node, force.node, this._el("div", { class: "hint-line", text: this._t("dlg_replace_note") }));
    } else if (kind === "rename") {
      const items = this._pickerItems("db", dbList);
      const ids = new Set(items.map((x) => x.id));
      this._pickerItems("entities", dbList).forEach((x) => { if (!ids.has(x.id)) items.push(x); });
      oldPk = this._picker({ items, preset: pre.old ? [pre.old] : [], placeholder: this._t("pk_ph_old") });
      newIn = this._el("input", { class: "fd-note mono", attrs: { type: "text", value: pre.new || "", placeholder: "sensor.…", spellcheck: "false", autocomplete: "off" } });
      body.append(field(this._t("dlg_from"), oldPk.node), field(this._t("dlg_to"), newIn));
      oldPk.onChange(() => { if (!newIn.value) { const v = oldPk.values()[0] || ""; newIn.value = v; } });
    } else if (kind === "purge") {
      idsPk = this._picker({ multi: true, items: this._pickerItems("db", dbList), preset: pre.ids || [], allowFree: true, placeholder: this._t("pk_search") });
      body.append(field(this._t("dlg_ids_pick"), idsPk.node));
      // Standard: Verlauf + Kurzzeitstatistik; Langzeitstatistik nur bewusst (z. B. Energie-Dashboard).
      const scopes = pre.scopes || ["states", "statistics_short"];
      scopeStates = this._check(this._t("dlg_scope_states"), scopes.includes("states"), this._t("dlg_scope_states_h"));
      scopeShort = this._check(this._t("dlg_scope_short"), scopes.includes("statistics_short"), this._t("dlg_scope_short_h"));
      scopeStats = this._check(this._t("dlg_scope_long"), scopes.includes("statistics_long"), this._t("dlg_scope_long_h"));
      const longWarn = this._el("div", { class: "dlg-warn", text: this._t("w_long") });
      longWarn.hidden = !scopeStats.cb.checked;
      scopeStats.cb.addEventListener("change", () => { longWarn.hidden = !scopeStats.cb.checked; });
      keepSel = this._el("select", { class: "ov-select" });
      [[0, "dlg_keep_all"], [7, ""], [30, ""], [90, ""], [365, ""]].forEach(([n, key]) =>
        keepSel.appendChild(this._el("option", { text: key ? this._t(key) : this._ti("dlg_keep_n", { n }), attrs: { value: String(n) } })));
      body.append(this._el("div", { class: "dlg-sub", text: this._t("dlg_scope_title") }), scopeStates.node, scopeShort.node, scopeStats.node, longWarn, field(this._t("dlg_keep"), keepSel));
    } else {
      idsPk = this._picker({ multi: true, items: this._pickerItems("restored", dbList), preset: pre.ids || [], placeholder: this._t("pk_search") });
      body.append(field(this._t("dlg_reg_pick"), idsPk.node));
      purgeData = this._check(this._t("dlg_reg_purge"), false);
      body.append(purgeData.node, this._el("div", { class: "hint-line", text: this._t("dlg_reg_note") }));
    }
    const preview = this._el("div", { class: "dlg-preview" });
    const warns = this._el("div", { class: "dlg-warns" });
    body.append(preview, warns);
    const backupSlot = this._el("div", {});
    const nsSlot = this._el("div", {});
    body.append(backupSlot, nsSlot);
    const confirm = this._check(this._t("dlg_confirm"), false);
    body.append(confirm.node, status);
    let backup = this._backupChooser(null, kind === "registry");
    backupSlot.appendChild(backup);
    const setBackup = (info) => {
      const choice = backup.value();
      backup.remove();
      backup = this._backupChooser(info, kind === "registry");
      // Bisherige Wahl beibehalten – außer der Platz reicht nur noch mit „Kopie ersetzen“.
      const sp = this._spaceState(info);
      if (!(choice === "db_copy" && sp && !sp.fitsNew)) backup.setValue(choice);
      backupSlot.appendChild(backup);
    };
    const backupApi = {
      get: () => backup,
      refresh: async () => {
        const info = await this._ws({ type: "ha_percyta/db_info", ids: [] });
        if (info && !info.error) setBackup(info);
      },
    };

    const ids = () => {
      if (kind === "purge" || kind === "registry") return idsPk.values();
      return [oldPk.values()[0], kind === "replace" ? newPk.values()[0] : newIn.value.trim()].filter(Boolean);
    };
    const refreshRun = () => { run.disabled = !confirm.cb.checked || !ids().length || this._modalBusy || (kind !== "purge" && kind !== "registry" && ids().length < 2); };
    confirm.cb.addEventListener("change", refreshRun);
    [oldPk, newPk, idsPk].forEach((pk) => pk && pk.onChange(refreshRun));
    if (newIn) newIn.addEventListener("input", refreshRun);

    let pvSeq = 0;
    let lastInfo = null;
    // Geschätzter Platz: Datenbankgröße ÷ alle Zeilen = grober Durchschnitt je Zeile.
    const estimate = () => {
      if (kind !== "purge" || !lastInfo) return null;
      const db = (this._data && this._data.data && this._data.data.database) || {};
      const rows = (db.states_total || 0) + (db.statistics_long_total || 0) + (db.statistics_short_total || 0);
      const size = lastInfo.info.space && lastInfo.info.space.db_size;
      if (!rows || !size) return null;
      return { bpr: size / rows, states: scopeStates.cb.checked, short: scopeShort.cb.checked, long: scopeStats.cb.checked,
        partial: parseInt(keepSel.value, 10) > 0 };
    };
    const renderTable = () => {
      if (!lastInfo) return;
      const est = estimate();
      const old = preview.querySelector(".pv-loading");
      preview.replaceChildren();
      if (old) preview.appendChild(old);
      preview.appendChild(this._previewTable(lastInfo.info, lastInfo.list, est));
      if (est) {
        const total = lastInfo.list.reduce((a, id) => a + this._estRows(lastInfo.info.ids[id], est) * est.bpr, 0);
        preview.appendChild(this._el("div", { class: "hint-line pv-est", text: this._ti(est.partial ? "pv_est_sum_max" : "pv_est_sum", { s: this._fmtBytes(total) }) }));
      }
    };
    if (kind === "purge") [scopeStates, scopeShort, scopeStats].forEach((x) => x.cb.addEventListener("change", renderTable));
    if (kind === "purge") keepSel.addEventListener("change", renderTable);
    const loadPreview = async () => {
      const list = ids().slice(0, 50);
      const seq = ++pvSeq;
      if (!list.length) {
        preview.replaceChildren(this._el("div", { class: "hint-line", text: this._t("pv_empty") }));
        warns.replaceChildren();
        return;
      }
      // Bisherige Tabelle stehen lassen (abgedunkelt), bis die neuen Daten da sind – kein Flackern.
      preview.classList.add("loading");
      const spin = this._el("div", { class: "pv-loading" }, [
        this._el("span", { text: this._t("pv_loading") }),
        this._el("span", { class: "muted small", text: (this._job && this._job.status === "running") ? this._t("pv_busy") : this._t("pv_slow") }),
      ]);
      const old = preview.querySelector(".pv-loading");
      if (old) old.remove();
      preview.prepend(spin);
      const info = await this._ws({ type: "ha_percyta/db_info", ids: list });
      if (seq !== pvSeq || !preview.isConnected) return; // neuere Anfrage läuft bereits
      preview.classList.remove("loading");
      preview.replaceChildren();
      warns.replaceChildren();
      if (!info || info.error) { lastInfo = null; preview.appendChild(this._el("div", { class: "dlg-warn", text: this._errText(info || {}) })); return; }
      lastInfo = { info, list };
      renderTable();
      setBackup(info);
      const w = (t) => warns.appendChild(this._el("div", { class: "dlg-warn", text: t }));
      if (kind === "replace" || kind === "rename") {
        const [o, n] = list;
        const oi = info.ids[o] || {};
        const ni = (n && info.ids[n]) || {};
        if (o && n && o.split(".")[0] !== n.split(".")[0]) w(this._t("w_same_domain"));
        if (kind === "replace") {
          if (!(oi.states || oi.stats_long || oi.stats_short || oi.in_states_meta || oi.in_statistics_meta)) w(this._t("w_old_nodata"));
          if (oi.state && !oi.state.restored && !["unavailable", "unknown"].includes(oi.state.state)) w(this._ti("w_old_active", { s: oi.state.state }));
          if (oi.stats_unit != null && ni.state && (ni.state.unit || null) !== (oi.stats_unit || null)) w(this._ti("w_unit", { a: oi.stats_unit || "—", b: ni.state.unit || "—" }));
          if ((oi.stats_long || oi.stats_short) && ni.state && !ni.state.state_class) w(this._t("w_no_state_class"));
        } else if (ni.in_states_meta || ni.in_statistics_meta) {
          w(this._t("w_target_data"));
        }
      }
      if (kind === "purge") {
        const live = list.filter((i) => info.ids[i] && info.ids[i].state && !info.ids[i].state.restored);
        if (live.length) w(this._ti("w_purge_live", { n: live.length }));
      }
    };
    if (kind !== "registry") {
      [oldPk, newPk, idsPk].forEach((pk) => pk && pk.onChange(() => { clearTimeout(this._pvTimer); this._pvTimer = setTimeout(loadPreview, 700); }));
      if (ids().length) loadPreview();
      else backupApi.refresh();
    } else {
      backupApi.refresh();
    }

    run.addEventListener("click", async () => {
      [oldPk, newPk, idsPk].forEach((pk) => pk && pk.commitPending && pk.commitPending());
      const msg = { confirm: true, backup: backup.value() };
      if (kind === "replace") Object.assign(msg, { type: "ha_percyta/db_replace", old: oldPk.values()[0], new: newPk.values()[0], remove_old: removeOld.cb.checked, purge_new: purgeNew.cb.checked, force: force.cb.checked });
      else if (kind === "rename") Object.assign(msg, { type: "ha_percyta/db_rename", old: oldPk.values()[0], new: newIn.value.trim() });
      else if (kind === "registry") Object.assign(msg, { type: "ha_percyta/registry_remove", ids: ids().slice(0, 200), purge_data: purgeData.cb.checked });
      else {
        const scopes = [];
        if (scopeStates.cb.checked) scopes.push("states");
        if (scopeShort.cb.checked) scopes.push("statistics_short");
        if (scopeStats.cb.checked) scopes.push("statistics_long");
        Object.assign(msg, { type: "ha_percyta/db_purge", ids: ids().slice(0, 200), scopes, keep_days: parseInt(keepSel.value, 10) || 0 });
        if (!scopes.length) { status.textContent = this._t("dlg_error") + this._t("e_no_scope"); return; }
      }
      nsSlot.replaceChildren();
      await this._runModalAction(msg, { run, cancel, status }, async () => {
        if (kind === "purge") (this._orphanSel || new Set()).clear();
        this._dbList = null;
        // Nach dem Auftrag: Bestätigung zurücksetzen, Vorschau wieder möglich und aktualisiert.
        confirm.cb.checked = false;
        refreshRun();
        if (kind !== "registry") loadPreview();
        else backupApi.refresh();
        this._refreshSoon();
      }, (err) => {
        refreshRun();
        if (err && err.error === "no_space") this._noSpaceHelp(nsSlot, err, backupApi);
      });
    });
  }

  // Führt eine Aktion aus dem Dialog aus (Sperren, Status, Fehlertext).
  async _runModalAction(msg, ui, onOk, onErr) {
    if (JOB_TYPES.has(msg.type)) return this._startJob(msg, ui, onOk, onErr);
    this._modalBusy = true;
    [ui.run, ui.alt, ui.cancel].forEach((b) => { if (b) b.disabled = true; });
    ui.status.className = "dlg-status busy";
    ui.status.textContent = this._t("dlg_running");
    const res = await this._ws(msg);
    this._modalBusy = false;
    if (ui.cancel) { ui.cancel.disabled = false; ui.cancel.textContent = this._t("dlg_close"); }
    if (res && res.error) {
      ui.status.className = "dlg-status err";
      const extra = res.params && res.params.ids && res.params.ids.length ? ": " + res.params.ids.join(", ") : "";
      ui.status.textContent = this._t("dlg_error") + this._errText(res) + extra;
      if (ui.alt) ui.alt.disabled = false;
      if (onErr) onErr(res);
      return null;
    }
    ui.status.className = "dlg-status ok";
    ui.status.textContent = (res && res.done === false) ? this._t("dlg_done_bg") : this._t("dlg_done");
    if (onOk) await onOk(res);
    return res;
  }

  // Ganze Datenbank aufräumen (recorder.purge) und optional verkleinern.
  _cleanupDialog() {
    const body = this._el("div", { class: "dlg" }, [this._el("p", { class: "dlg-intro", text: this._t("cl_intro") })]);
    const days = this._el("select", { class: "ov-select" });
    [3, 7, 10, 14, 30, 60, 90, 180, 365].forEach((n) => {
      const o = this._el("option", { text: this._ti("dlg_keep_n", { n }), attrs: { value: String(n) } });
      if (n === 10) o.setAttribute("selected", "");
      days.appendChild(o);
    });
    const repack = this._check(this._t("cl_repack"), false);
    const pv = this._el("div", { class: "dlg-preview cl-preview" });
    body.append(this._el("div", { class: "dlg-field" }, [this._el("span", { text: this._t("cl_days") }), days]), pv, repack.node,
      this._el("div", { class: "hint-line", text: this._t("cl_note") }));
    // Vorschau: was mit der gewählten Zeit gelöscht würde (Zeilen, betroffene Entitäten, Platz ca.).
    let pvSeq = 0;
    const loadPv = async () => {
      const seq = ++pvSeq;
      pv.classList.add("loading");
      const old = pv.querySelector(".pv-loading");
      if (old) old.remove();
      pv.prepend(this._el("div", { class: "pv-loading" }, [this._el("span", { text: this._t("pv_loading") }), this._el("span", { class: "muted small", text: this._t("pv_slow") })]));
      const res = await this._ws({ type: "ha_percyta/db_cleanup_preview", keep_days: parseInt(days.value, 10) });
      if (seq !== pvSeq || !pv.isConnected) return;
      pv.classList.remove("loading");
      pv.replaceChildren(this._cleanupPreview(res));
    };
    days.addEventListener("change", loadPv);
    loadPv();
    const backupSlot = this._el("div", {});
    const nsSlot = this._el("div", {});
    let backup = this._backupChooser(null);
    backupSlot.appendChild(backup);
    const confirm = this._check(this._t("dlg_confirm"), false);
    const status = this._el("div", { class: "dlg-status" });
    body.append(backupSlot, nsSlot, confirm.node, status);
    const backupApi = {
      get: () => backup,
      refresh: async () => {
        const info = await this._ws({ type: "ha_percyta/db_info", ids: [] });
        if (!info || info.error) return;
        const choice = backup.value();
        const sp = this._spaceState(info);
        backup.remove();
        backup = this._backupChooser(info);
        if (!(choice === "db_copy" && sp && !sp.fitsNew)) backup.setValue(choice);
        backupSlot.appendChild(backup);
      },
    };
    const cancel = this._el("button", { class: "vb-btn", text: this._t("dlg_cancel") });
    const run = this._el("button", { class: "fd-open danger", text: this._t("dlg_run") });
    run.disabled = true;
    cancel.addEventListener("click", () => this._closeModal());
    confirm.cb.addEventListener("change", () => { run.disabled = !confirm.cb.checked || this._modalBusy; });
    this._openModal(this._t("cl_title"), body, [cancel, run]);
    backupApi.refresh();
    run.addEventListener("click", () => {
      nsSlot.replaceChildren();
      this._runModalAction(
        { type: "ha_percyta/db_cleanup", keep_days: parseInt(days.value, 10), repack: repack.cb.checked, backup: backup.value(), confirm: true },
        { run, cancel, status }, async () => { this._dbList = null; confirm.cb.checked = false; this._refreshSoon(); },
        (err) => {
          run.disabled = !confirm.cb.checked;
          if (err && err.error === "no_space") this._noSpaceHelp(nsSlot, err, backupApi);
        });
    });
  }

  _cleanupPreview(r) {
    if (!r || r.error) return this._el("div", { class: "dlg-warn", text: this._errText(r || {}) });
    const pct = (a, b) => (b ? ` (${((a * 100) / b).toLocaleString(this._lang(), { maximumFractionDigits: 1 })} %)` : "");
    const rowsAll = (r.states_total || 0) + (r.events_total || 0) + (r.stats_short_total || 0) + (r.stats_long_total || 0);
    const del = (r.states || 0) + (r.events || 0) + (r.stats_short || 0);
    const est = r.db_size && rowsAll ? (del * r.db_size) / rowsAll : null;
    const line = (label, a, b, keep) => this._el("div", { class: "clp-row" + (keep ? " keep" : "") }, [
      this._el("span", { text: label }),
      this._el("b", { text: keep ? this._t("clp_kept") : `${this._fmtInt(a)} / ${this._fmtInt(b)}${pct(a, b)}` }),
    ]);
    const box = this._el("div", { class: "clp" }, [
      this._el("div", { class: "dlg-sub", text: this._ti("clp_title", { d: this._fmtDateTime(r.before) }) }),
      line(this._t("clp_states"), r.states, r.states_total),
      line(this._t("clp_events"), r.events, r.events_total),
      line(this._t("clp_short"), r.stats_short, r.stats_short_total),
      line(this._t("clp_long"), 0, r.stats_long_total, true),
      this._el("div", { class: "clp-sum" }, [
        this._el("b", { text: del ? this._ti("clp_sum", { n: this._fmtInt(del) }) : this._t("clp_nothing") }),
        est ? this._el("span", { class: "muted", text: " · " + this._ti("clp_est", { s: this._fmtBytes(est) }) }) : null,
      ]),
      r.oldest ? this._el("div", { class: "muted small", text: this._ti("clp_oldest", { d: this._fmtDateTime(r.oldest) }) }) : null,
    ]);
    if ((r.top || []).length && r.states) {
      box.appendChild(this._el("div", { class: "dlg-sub", text: this._t("clp_top") }));
      box.appendChild(this._el("div", { class: "clp-top" }, r.top.map((t) => this._el("div", { class: "clp-row" }, [
        this._el("span", { class: "mono", text: t.id }), this._el("span", { class: "muted", text: this._ti("clp_rows", { n: this._fmtInt(t.rows) }) }),
      ]))));
    }
    box.appendChild(this._el("div", { class: "muted small", style: "margin-top:6px;line-height:1.45", text: this._t("clp_note") }));
    return box;
  }

  // Zugriffstoken widerrufen (mit Bestätigung).
  _revokeDialog(token) {
    const body = this._el("div", { class: "dlg" }, [
      this._explain(this._t("tk_what"), [this._t("tk_w1"), this._t("tk_w2"), this._t("tk_w3"), this._t("tk_w4")]),
      this._el("p", { class: "dlg-intro", text: this._ti("tk_intro", { u: token.user || "?", c: token.client_name || "—" }) }),
      this._el("div", { class: "dlg-warn", text: this._t("tk_warn") }),
    ]);
    const confirm = this._check(this._t("tk_confirm"), false);
    const status = this._el("div", { class: "dlg-status" });
    body.append(confirm.node, status);
    const cancel = this._el("button", { class: "vb-btn", text: this._t("dlg_cancel") });
    const run = this._el("button", { class: "fd-open danger", text: this._t("tk_revoke") });
    run.disabled = true;
    cancel.addEventListener("click", () => this._closeModal());
    confirm.cb.addEventListener("change", () => { run.disabled = !confirm.cb.checked || this._modalBusy; });
    this._openModal(this._t("tk_title"), body, [cancel, run]);
    run.addEventListener("click", () => this._runModalAction(
      { type: "ha_percyta/token_revoke", token_id: token.id, confirm: true },
      { run, cancel, status }, async () => { run.disabled = true; this._refreshSoon(); }));
  }

  // Automation ein-/ausschalten bzw. testweise auslösen (offizielle HA-Dienste).
  async _automationAction(btn, service, entityId, data) {
    btn.disabled = true;
    try {
      await this._hass.callService("automation", service, Object.assign({ entity_id: entityId }, data || {}));
      btn.textContent = "✔ " + btn.textContent.replace(/^\S+\s*/, "");
      // Ein-/Ausschalten ändert Befunde und Pflegebedarf → neu scannen und anzeigen.
      if (service !== "trigger") this._refreshSoon(true);
    } catch (e) {
      btn.textContent = "⚠️";
      btn.disabled = false;
    }
  }

  async _backupDialog() {
    const body = this._el("div", { class: "dlg" }, [this._el("p", { class: "dlg-intro", text: this._t("bk_intro") })]);
    const listBox = this._el("div", {});
    const status = this._el("div", { class: "dlg-status" });
    const copyBtn = this._el("button", { class: "vb-btn", text: this._t("bk_make_copy") });
    const replBtn = this._el("button", { class: "vb-btn", text: this._t("bk_replace_btn"), attrs: { title: this._t("dlg_bk_replace") } });
    replBtn.hidden = true;
    const haBtn = this._el("button", { class: "vb-btn", text: this._t("bk_make_ha") });
    const spaceBox = this._el("div", {});
    const nsSlot = this._el("div", {});
    body.append(this._el("div", { class: "f-row" }, [copyBtn, replBtn, haBtn]), spaceBox, status, nsSlot, listBox);
    const close = this._el("button", { class: "vb-btn", text: this._t("dlg_close") });
    close.addEventListener("click", () => this._closeModal());
    this._openModal(this._t("bk_title"), body, [close]);
    const load = async () => {
      const info = await this._ws({ type: "ha_percyta/db_info", ids: [] });
      listBox.replaceChildren();
      if (info.error) { listBox.appendChild(this._el("div", { class: "dlg-warn", text: this._errText(info) })); return; }
      copyBtn.disabled = !info.sqlite;
      haBtn.disabled = !(info.backup_services || []).length;
      const copies = info.copies || [];
      replBtn.hidden = !info.sqlite || !copies.length;
      replBtn.disabled = false;
      spaceBox.replaceChildren();
      const sp = info.sqlite ? this._spaceState(info) : null;
      if (sp) {
        spaceBox.appendChild(this._el("div", { class: "muted small bk-space", text: sp.text }));
        if (!sp.fitsNew) spaceBox.appendChild(this._el("div", { class: "dlg-warn", text: this._t(sp.fitsReplace && copies.length ? "ns_hint" : "bk_space_none") }));
      }
      if (!info.sqlite) listBox.appendChild(this._el("div", { class: "dlg-warn", text: this._ti("bk_not_sqlite", { e: info.engine || "?" }) }));
      if (!copies.length) { listBox.appendChild(this._el("div", { class: "empty", text: this._t("bk_none") })); return; }
      const rows = copies.map((c) => {
        const del = this._el("button", { class: "vb-btn small", text: this._t("bk_delete") });
        del.addEventListener("click", async () => {
          del.disabled = true;
          const r = await this._ws({ type: "ha_percyta/db_backup_delete", name: c.name });
          if (r && r.error) status.textContent = this._t("dlg_error") + this._errText(r);
          load();
          this._loadCopies();
        });
        return [{ node: this._el("span", { class: "mono", text: c.name }) }, { text: this._fmtDateTime(c.created), sort: Date.parse(c.created) || 0 }, { text: this._fmtBytes(c.size), sort: c.size }, { node: del, nosrch: true }];
      });
      const saved = this._search;
      this._search = "";
      listBox.appendChild(this._table([this._t("th_name"), this._t("th_created"), this._t("th_size"), ""], rows, { memKey: "bk-list", cols: [{}, {}, {}, { nosort: true }] }));
      this._search = saved;
    };
    const make = (kind) => {
      nsSlot.replaceChildren();
      replBtn.disabled = true;
      return this._startJob({ type: "ha_percyta/db_backup", kind },
        { run: copyBtn, alt: haBtn, cancel: close, status }, async () => { copyBtn.disabled = false; haBtn.disabled = false; load(); },
        (err) => {
          copyBtn.disabled = false; haBtn.disabled = false; replBtn.disabled = false;
          if (err && err.error === "no_space") this._noSpaceHelp(nsSlot, err, { get: () => null, refresh: load });
        });
    };
    copyBtn.addEventListener("click", () => make("db_copy"));
    replBtn.addEventListener("click", () => make("db_copy_replace"));
    haBtn.addEventListener("click", () => make("ha_backup"));
    load();
  }

  _logDialog() {
    const box = this._el("div", { class: "audit-body" }, [this._el("div", { class: "muted small", text: "…" })]);
    const close = this._el("button", { class: "vb-btn", text: this._t("dlg_close") });
    close.addEventListener("click", () => this._closeModal());
    this._openModal(this._t("log_title"), box, [close]);
    this._loadAudit(box, null);
  }

  // ---------- Pflege-Center: Daten für Vorschau (Kopf) und eigene Seite ----------
  _careItems(d) {
    const c = d.counts || {};
    const db = d.database || {};
    const states = (this._hass && this._hass.states) || {};
    const restored = Object.keys(states).filter((k) => states[k].attributes && states[k].attributes.restored);
    const unavailable = Object.keys(states).filter((k) => states[k].state === "unavailable" && !(states[k].attributes || {}).restored && !/^(automation|script)\./.test(k));
    const fnd = (type) => (d.findings || []).find((f) => f.type === type && f.status !== "hidden");
    const fall = (type) => (d.findings || []).filter((f) => f.type === type && f.status !== "hidden");
    const autoProblems = this._autoProblems(d);
    const devices = fnd("orphaned_devices");
    const failing = fall("integration_not_loaded");
    const off = fnd("automations_off");
    const dbFile = (((d.system || {}).storage || {}).breakdown || []).find((x) => x.type === "db");
    const backupAge = d.backup && d.backup.date ? Math.floor((Date.now() - Date.parse(d.backup.date)) / 86400000) : null;
    const backupSize = d.backup && d.backup.size != null ? this._fmtBytes(d.backup.size) : null;
    const pCopies = (this._pcopies && this._pcopies.copies) || [];
    const pLast = pCopies.slice().sort((a, b) => String(b.created).localeCompare(String(a.created)))[0] || null;
    const updates = ((d.inventory || {}).updates || []).length;
    const inv = d.inventory || {};
    const items = [
      { key: "dbo", icon: "🧟", n: db.orphans_total || 0, title: "cc_dbo", desc: this._ti("cc_dbo_d", { r: this._fmtCompact(db.orphans_rows || 0) }), btn: "cc_btn_clean",
        fn: () => this._dbDialog("purge", { ids: (db.orphans || []).map((o) => o.id) }), hide: !Array.isArray(db.orphans) },
      { key: "rest", icon: "👻", n: restored.length, title: "cc_rest", desc: this._t("cc_rest_d"), btn: "cc_btn_remove", fn: () => this._dbDialog("registry", { ids: restored }) },
      { key: "dev", icon: "📵", n: devices ? devices.items_total : 0, title: "cc_dev", desc: this._t("cc_dev_d"), btn: "cc_btn_remove", fn: () => this._deviceDialog(devices) },
      { key: "unav", icon: "📡", n: unavailable.length, title: "cc_unav", desc: this._t("cc_unav_d"), btn: "cc_btn_review", fn: () => this._disableDialog([]), soft: true },
      { key: "int", icon: "🔌", n: failing.length, title: "cc_int", desc: this._t("cc_int_d"), btn: "cc_btn_reload", fn: () => this._reloadDialog(failing) },
      { key: "auto", icon: "🤖", n: autoProblems.length, title: "cc_auto", desc: this._t("cc_auto_d"), btn: "cc_btn_show",
        fn: () => this._showFindings("automations") },
      { key: "off", icon: "⏸️", n: off ? off.items_total : 0, title: "cc_off", desc: this._t("cc_off_d"), btn: "cc_btn_show", fn: () => this._openLink("#finding:automations_off"), soft: true, noTodo: true },
      { key: "fnd", icon: "🧭", n: c.findings_open || 0, title: "cc_fnd", desc: this._t("cc_fnd_d"), btn: "cc_btn_show", fn: () => this._showFindings("all"), soft: true,
        hide: !Array.isArray(d.findings) },
      { key: "tok", icon: "🗝️", n: c.stale_tokens || 0, title: "cc_tok", desc: this._t("cc_tok_d"), btn: "cc_btn_review", fn: () => this._goReport("tokens") },
      { key: "rep", icon: "🛠️", n: inv.repairs_total || 0, title: "cc_rep", desc: this._t("cc_rep_d"), btn: "cc_btn_open", href: "/config/repairs",
        fn: () => this._navigate("/config/repairs"), hide: inv.repairs_total == null },
      { key: "err", icon: "❗", n: c.errors || 0, title: "cc_err", desc: this._t("cc_err_d"), btn: "cc_btn_show",
        fn: () => ((d.errors || []).length ? this._goReport("errors") : this._navigate("/config/logs")), soft: true },
      { key: "upd", icon: "⬆️", n: updates, title: "cc_upd", desc: this._t("cc_upd_d"), btn: "cc_btn_open", href: "/config/updates", fn: () => this._navigate("/config/updates"), soft: true },
      { key: "bk", icon: "💾", n: backupAge == null ? "—" : (backupSize || this._ti("cc_days", { n: backupAge })), title: "cc_bk",
        desc: backupAge == null ? this._t("cc_bk_none") : this._ti("cc_bk_ago", { a: this._ago(new Date(d.backup.date)) }), btn: "cc_btn_backup", fn: () => this._backupDialog(),
        info: true, warn: backupAge == null || backupAge >= 7 },
      { key: "pbk", icon: "🗂️", n: pLast ? this._fmtBytes(pLast.size) : "—", title: "cc_pbk",
        desc: pLast ? this._ti("cc_pbk_d", { a: this._ago(new Date(pLast.created)), n: pCopies.length, s: this._fmtBytes(pCopies.reduce((a, x) => a + (x.size || 0), 0)) }) : this._t("cc_pbk_none"),
        btn: "cc_btn_backup", fn: () => this._backupDialog(), info: true, hide: !this._pcopies || !this._pcopies.sqlite },
      { key: "db", icon: "🗄️", n: dbFile ? this._fmtBytes(dbFile.bytes) : "—", title: "cc_db", desc: this._t("cc_db_d"), btn: "cc_btn_clean", fn: () => this._cleanupDialog(), info: true },
      { key: "cfg", icon: "🧪", n: "YAML", title: "cc_cfg", desc: this._t("cc_cfg_d"), btn: "cc_btn_check", fn: () => this._checkConfigDialog(), info: true },
    ].filter((t) => !t.hide);
    items.forEach((t) => {
      t.clean = !t.info && t.n === 0;
      t.warnState = t.warn || (!t.info && !t.clean && !t.soft);
      t.todo = !t.info && !t.clean && !t.noTodo; // ausgeschaltete Automationen entscheidet der Nutzer selbst
    });
    return items;
  }

  // Automationen/Skripte mit Problemen: je Objekt einmal gezählt; nur offene Befunde mit
  // Schweregrad hoch/mittel; ausgeschaltete Automationen zählen nicht (sie laufen ja nicht).
  _autoProblems(d) {
    const states = (this._hass && this._hass.states) || {};
    const types = ["automation_invalid", "automation_errors", "automation_skipped", "automation_refs"];
    const refs = new Set();
    (d.findings || []).forEach((f) => {
      if (f.status !== "open" || !types.includes(f.type) || !["high", "medium"].includes(f.severity)) return;
      const ref = f.subject_ref || f.id;
      if (states[ref] && states[ref].state === "off") return;
      refs.add(ref);
    });
    return Array.from(refs);
  }

  _showFindings(cat) {
    const key = this._page === "care" ? "_fsCare" : "_fs";
    this[key] = Object.assign(this[key] || { tab: "open", sev: "all", sel: new Set() }, { tab: "open", cat: cat || "all" });
    if (this._page === "care") {
      // Im Pflege-Center: die eingebettete Reports-Box öffnen statt die Seite zu verlassen.
      this._render();
      const box = this.shadowRoot.getElementById("care-findings");
      if (box) {
        box.open = true;
        this._careReportsOpen = true;
        requestAnimationFrame(() => box.scrollIntoView({ behavior: "smooth", block: "start" }));
        return;
      }
    }
    this._goReport("findings");
  }

  // Zurück zum Bericht und zu einer Box springen.
  _goReport(key) {
    const wasPage = !!(this._page || this._detailId || this._resolvedKey);
    if (wasPage) this._unwindNav();
    this._returnPage = null;
    this._page = null;
    this._detailId = null;
    this._resolvedKey = null;
    this._render();
    requestAnimationFrame(() => this._jumpTo(key));
    if (wasPage) this.scrollTop = 0;
  }

  _openCarePage() {
    const content = this.shadowRoot.getElementById("content");
    const view = content && this._captureView(content);
    if (view) this._storedView = { open: view.open, why: view.why, sort: this._sortMem || {}, scroll: [] };
    this._backScroll = this.scrollTop;
    this._pageBackScroll = this.scrollTop;
    if (!this._page) this._pushNav();
    this._page = "care";
    this._detailId = null;
    this._resolvedKey = null;
    this._render();
    this.scrollTop = 0;
  }

  // ---------- Pflegebedarf: 0 % = alles in Ordnung, steigt mit offenen Pflegepunkten ----------
  // Jeder Bereich wird im Verhältnis zur Größe der Installation bewertet (z. B. nicht
  // verfügbare Entitäten im Verhältnis zu allen Entitäten) und mit einem festen Gewicht
  // gezählt. "r" = 1 bedeutet: der Bereich erreicht sein volles Gewicht.
  _careScore(d) {
    const c = d.counts || {};
    const inv = d.inventory || {};
    const db = d.database || {};
    const states = (this._hass && this._hass.states) || {};
    const ents = c.total_entities || Object.keys(states).length || 1;
    const devs = c.total_devices || 1;
    const open = (d.findings || []).filter((f) => f.status === "open");
    const restored = Object.keys(states).filter((k) => states[k].attributes && states[k].attributes.restored).length;
    const unavailable = inv.unavailable != null ? inv.unavailable : Object.keys(states).filter((k) => states[k].state === "unavailable").length;
    const failing = open.filter((f) => f.type === "integration_not_loaded").length;
    const integ = c.integrations || 1;
    const autos = (inv.automations || 0) + (inv.scripts || 0) || 1;
    const autoProblems = this._autoProblems(d).length;
    const orphanDevs = ((d.findings || []).find((f) => f.type === "orphaned_devices" && f.status !== "hidden") || {}).items_total || 0;
    const dbRows = (db.states_total || 0) + (db.statistics_long_total || 0) + (db.statistics_short_total || 0) || 1;
    const disk = ((d.system || {}).disk || {}).percent;
    const bAge = d.backup && d.backup.date ? (Date.now() - Date.parse(d.backup.date)) / 86400000 : null;
    const tokens = c.tokens || 1;
    const updates = c.updates_available != null ? c.updates_available : (inv.updates || []).length;
    const num = (n, digits) => Number(n).toLocaleString(this._lang(), { maximumFractionDigits: digits == null ? 1 : digits });
    const pct = (a, b) => `${this._fmtInt(a)} / ${this._fmtInt(b)} (${num((a * 100) / (b || 1))} %)`;
    const parts = [
      { icon: "📡", key: "sc_unav", w: 20, r: unavailable / ents / 0.20, v: pct(unavailable, ents), full: "20 %" },
      { icon: "🔌", key: "sc_int", w: 15, r: failing / integ / 0.10, v: pct(failing, integ), full: "10 %" },
      { icon: "🤖", key: "sc_auto", w: 15, r: autoProblems / autos / 0.20, v: pct(autoProblems, autos), full: "20 %" },
      { icon: "👻", key: "sc_orph", w: 10, r: (restored / ents + orphanDevs / devs) / 0.05, v: `${this._fmtInt(restored)} + ${this._fmtInt(orphanDevs)}`, full: "5 %" },
      { icon: "🖴", key: "sc_disk", w: 10, r: disk == null ? 0 : (disk - 80) / 15, v: disk == null ? "—" : `${num(disk)} %`, full: "95 %" },
      { icon: "🧟", key: "sc_dbo", w: 5, r: (db.orphans_rows || 0) / dbRows / 0.20, v: pct(db.orphans_rows || 0, dbRows), full: "20 %" },
      { icon: "💾", key: "sc_bk", w: 5, r: bAge == null ? 1 : (bAge - 7) / 23, v: bAge == null ? this._t("sc_none") : this._ago(new Date(d.backup.date)), full: "30 d" },
      { icon: "🗝️", key: "sc_tok", w: 5, r: (c.stale_tokens || 0) / tokens / 0.25, v: pct(c.stale_tokens || 0, tokens), full: "25 %" },
      { icon: "🛠️", key: "sc_rep", w: 5, r: (inv.repairs_total || 0) / 10, v: this._fmtInt(inv.repairs_total || 0), full: "10" },
      { icon: "❗", key: "sc_err", w: 5, r: (c.errors || 0) / 20, v: this._fmtInt(c.errors || 0), full: "20" },
      { icon: "⬆️", key: "sc_upd", w: 5, r: updates / 10, v: this._fmtInt(updates), full: "10" },
    ];
    parts.forEach((p) => { p.r = Math.max(0, Math.min(1, isFinite(p.r) ? p.r : 0)); p.pts = p.w * p.r; });
    const score = Math.min(100, Math.round(parts.reduce((s, p) => s + p.pts, 0)));
    return { score, parts, level: this._scoreLevel(score) };
  }

  _scoreLevel(score) {
    return score <= 10 ? "ok" : score <= 35 ? "low" : score <= 60 ? "mid" : "high";
  }

  _careRing(sc) {
    return this._el("div", { class: "cc-ring lvl-" + sc.level, style: `--p:${sc.score}`, attrs: { title: this._ti("cc_ring_n", { n: sc.score }) } }, [
      this._el("div", { class: "cc-ring-in" }, [this._el("b", { text: sc.score + "%" }), this._el("span", { text: this._t("cc_ring_lbl") })]),
    ]);
  }

  // „Warum?“-Knopf samt ausklappbarer Erklärung, wie sich der Pflegebedarf zusammensetzt.
  _scoreWhy(sc) {
    const btn = this._el("button", { class: "why-btn sc-btn", text: this._t("why"), attrs: { type: "button" } });
    const rows = sc.parts.map((p) => this._el("div", { class: "sc-row" + (p.pts < 0.05 ? " ok" : "") }, [
      this._el("span", { class: "cc-p-ico", text: p.icon }),
      this._el("span", { class: "sc-lbl", text: this._t(p.key) }),
      this._el("span", { class: "sc-val muted", text: p.v }),
      this._el("div", { class: "sc-bar lvl-" + (p.r < 0.34 ? "low" : p.r < 0.67 ? "mid" : "high"), attrs: { title: this._ti("sc_full", { f: p.full }) } }, [this._el("span", { style: `width:${p.r * 100}%` })]),
      this._el("span", { class: "sc-pts", text: `${p.pts.toLocaleString(this._lang(), { maximumFractionDigits: 1 })} / ${p.w}` }),
    ]));
    const panel = this._el("div", { class: "sc-why" }, [
      this._el("div", { class: "muted", style: "margin-bottom:8px;line-height:1.5", text: this._t("sc_intro") }),
      this._el("div", { class: "sc-row sc-head muted" }, [
        this._el("span", { class: "cc-p-ico" }), this._el("span", { class: "sc-lbl", text: this._t("sc_h_area") }),
        this._el("span", { class: "sc-val", text: this._t("sc_h_val") }), this._el("span", { class: "sc-bar-h" }),
        this._el("span", { class: "sc-pts", text: this._t("sc_h_pts") }),
      ]),
      ...rows,
      this._el("div", { class: "sc-total", text: this._ti("sc_total", { n: sc.score }) }),
      this._el("div", { class: "note", text: this._t("sc_scale") }),
    ]);
    panel.hidden = !this._scoreWhyOpen;
    if (!panel.hidden) { btn.classList.add("active"); btn.textContent = this._t("why_hide"); }
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      this._scoreWhyOpen = !panel.hidden;
      btn.classList.toggle("active", !panel.hidden);
      btn.textContent = panel.hidden ? this._t("why") : this._t("why_hide");
    });
    return { btn, panel };
  }

  _careLinks(d) {
    const c = d.counts || {};
    const link = (label, fn) => {
      const b = this._el("button", { class: "cc-link", text: label, attrs: { type: "button" } });
      b.addEventListener("click", (e) => { e.stopPropagation(); fn(); });
      return b;
    };
    return this._el("div", { class: "cc-links" }, [
      link(`🧭 ${this._t("cc_l_findings")} (${c.findings_open || 0})`, () => this._showFindings("all")),
      link("🗄️ " + this._t("cc_l_db"), () => this._goReport("database")),
      link("🔁 " + this._t("db_t_replace").replace(/^\S+\s/, ""), () => this._dbDialog("replace", {})),
      link("🗑️ " + this._t("db_t_purge").replace(/^\S+\s/, ""), () => this._dbDialog("purge", {})),
      link("📜 " + this._t("db_t_log").replace(/^\S+\s/, ""), () => this._logDialog()),
    ]);
  }

  // Kompakte Vorschau im Kopfbereich (neben der Risiko-Verteilung).
  _carePreview(d) {
    const items = this._careItems(d);
    const todo = items.filter((t) => t.todo).length;
    const sc = this._careScore(d);
    const why = this._scoreWhy(sc);
    const open = this._el("button", { class: "cc-open", text: this._t("cc_open") + " ›", attrs: { type: "button" } });
    open.addEventListener("click", () => this._openCarePage());
    const head = this._el("div", { class: "cc-p-head" }, [
      this._careRing(sc),
      this._el("div", { class: "cc-p-title" }, [
        this._el("div", { class: "cc-p-name", text: this._t("sec_care") }),
        this._el("div", { class: "cc-p-sum lvl-" + sc.level, text: this._t("sc_lvl_" + sc.level) }),
        this._el("div", { class: "muted small", text: todo ? this._ti("cc_todo", { n: todo }) : this._t("cc_all_ok") }),
      ]),
      this._el("div", { class: "cc-p-btns" }, [why.btn, open]),
    ]);
    const list = this._el("div", { class: "cc-p-list" });
    // Das letzte HA-Backup steht schon unter der Überschrift – hier die letzte Percyta-Sicherung.
    items.filter((t) => t.key !== "bk").forEach((t) => {
      const val = t.clean ? this._el("span", { class: "cc-p-ok", text: "✓" })
        : this._el("span", { class: "cc-p-n" + (t.warnState ? " warn" : t.info ? " info" : ""), text: String(t.n) });
      const row = this._el("button", { class: "cc-p-row" + (t.clean ? " ok" : ""), attrs: { type: "button", title: t.desc } }, [
        this._el("span", { class: "cc-p-ico", text: t.icon }),
        this._el("span", { class: "cc-p-lbl", text: this._t(t.title) }),
        val,
      ]);
      row.addEventListener("click", t.fn);
      list.appendChild(row);
    });
    return this._el("div", { class: "riskbar-card cc-preview" }, [head, why.panel, list, this._careLinks(d)]);
  }

  _careTileGrid(items) {
    const grid = this._el("div", { class: "cc-grid" });
    items.forEach((t) => {
      let btn;
      if (t.href && !t.clean) btn = this._linkBtn(this._t(t.btn), t.href, "vb-btn small");
      else {
        btn = this._el("button", { class: "vb-btn small", text: t.clean ? this._t("cc_clean") : this._t(t.btn) });
        btn.disabled = t.clean;
        btn.addEventListener("click", t.fn);
      }
      grid.appendChild(this._el("div", { class: "cc-tile" + (t.clean ? " ok" : t.warnState ? " warn" : "") }, [
        this._el("div", { class: "cc-top" }, [this._el("span", { class: "cc-ico", text: t.icon }), this._el("span", { class: "cc-n", text: t.clean ? "✓" : String(t.n) })]),
        this._el("div", { class: "cc-title", text: this._t(t.title) }),
        this._el("div", { class: "cc-desc", text: t.desc }),
        btn,
      ]));
    });
    return grid;
  }

  // Eigene Seite: Pflege-Center mit allen Kacheln, Werkzeugen und letzten Aktionen.
  _carePage(d) {
    const items = this._careItems(d);
    const todo = items.filter((t) => t.todo).length;
    const sc = this._careScore(d);
    const why = this._scoreWhy(sc);
    const back = this._el("button", { class: "vb-btn", text: this._t("f_back") });
    back.addEventListener("click", () => this._closeDetail());
    const wrap = this._el("div", { class: "fd care-page" });
    wrap.appendChild(this._el("div", { class: "fd-top" }, [back, this._el("span", { class: "muted fd-crumb", text: this._t("sec_care") })]));
    const hero = this._el("div", { class: "fd-hero cc-hero lvl-" + sc.level }, [
      this._careRing(sc),
      this._el("div", { class: "fd-hero-main" }, [
        this._el("h2", { class: "fd-title", text: this._t("sec_care") }),
        this._el("div", { class: "cc-p-sum lvl-" + sc.level, text: `${this._t("sc_lvl_" + sc.level)} · ${todo ? this._ti("cc_todo", { n: todo }) : this._t("cc_all_ok")}` }),
        this._el("div", { class: "muted small", style: "margin-top:6px;line-height:1.5", text: this._t("cc_intro") }),
      ]),
      why.btn,
    ]);
    wrap.appendChild(hero);
    wrap.appendChild(why.panel);
    why.panel.classList.add("fd-card");
    if (this._job && this._job.status === "running") {
      const view = this._jobView();
      view.update(this._job);
      this._jobViews = (this._jobViews || []).concat([view]);
      wrap.appendChild(this._el("div", { class: "fd-card cc-block" }, [this._el("h3", { text: "⏳ " + this._t("jv_title") }), view]));
    }
    const sec = (title, node) => this._el("div", { class: "fd-card cc-block" }, [this._el("h3", { text: title }), node]);
    wrap.appendChild(sec(this._t("cc_h_todo"), this._careTileGrid(items.filter((t) => !t.info))));
    wrap.appendChild(sec(this._t("cc_h_system"), this._careTileGrid(items.filter((t) => t.info))));
    // Reports (Befunde) auch hier – dieselbe Box wie auf der Hauptseite.
    const reports = this._sectionFindings(d, true);
    if (reports) {
      reports.id = "care-findings";
      reports.classList.add("cc-reports");
      this._decorateSection(reports, "findings", d);
      reports.open = !!this._careReportsOpen;
      reports.addEventListener("toggle", () => { this._careReportsOpen = reports.open; });
      wrap.appendChild(reports);
    }

    const tool = (icon, title, desc, fn) => {
      const card = this._el("button", { class: "cc-tool", attrs: { type: "button" } }, [
        this._el("span", { class: "cc-tool-ico", text: icon }),
        this._el("span", { class: "cc-tool-txt" }, [this._el("b", { text: title }), this._el("span", { class: "muted", text: desc })]),
      ]);
      card.addEventListener("click", fn);
      return card;
    };
    const tools = this._el("div", { class: "cc-tools" }, [
      tool("🔁", this._t("db_t_replace").replace(/^\S+\s/, ""), this._t("ct_replace"), () => this._dbDialog("replace", {})),
      tool("✏️", this._t("db_t_rename").replace(/^\S+\s/, ""), this._t("ct_rename"), () => this._dbDialog("rename", {})),
      tool("🗑️", this._t("db_t_purge").replace(/^\S+\s/, ""), this._t("ct_purge"), () => this._dbDialog("purge", {})),
      tool("🧹", this._t("db_t_cleanup").replace(/^\S+\s/, ""), this._t("ct_cleanup"), () => this._cleanupDialog()),
      tool("👻", this._t("db_t_registry").replace(/^\S+\s/, ""), this._t("ct_registry"), () => this._dbDialog("registry", {})),
      tool("💾", this._t("db_t_backup").replace(/^\S+\s/, ""), this._t("ct_backup"), () => this._backupDialog()),
      tool("🗄️", this._t("cc_l_db"), this._t("ct_db"), () => this._goReport("database")),
      tool("🧭", this._t("cc_l_findings"), this._t("ct_findings"), () => this._showFindings("all")),
    ]);
    wrap.appendChild(sec(this._t("cc_h_tools"), this._el("div", {}, [
      this._el("div", { class: "db-calm", text: this._t("db_calm") }), tools,
    ])));
    const audit = this._el("div", { class: "audit-body" }, [this._el("div", { class: "muted small", text: "…" })]);
    wrap.appendChild(sec(this._t("cc_h_log"), audit));
    this._loadAudit(audit, null);
    return wrap;
  }

  // ---------- Hintergrund-Aufträge: Fortschritt, Protokoll („Terminal“), Anzeige im Kopf ----------
  _fmtDur(sec) {
    if (sec == null || isNaN(sec)) return "—";
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} h` : `${m}:${String(s).padStart(2, "0")} min`;
  }

  _jobLineText(l) {
    const p = Object.assign({}, l.p || {});
    if (p.size != null) p.size = this._fmtBytes(p.size);
    ["rows", "left", "done", "n"].forEach((k) => { if (p[k] != null) p[k] = this._fmtInt(p[k]); });
    if (p.action) p.action = this._t("ja_" + p.action);
    if (p.code) p.code = this._errText({ error: p.code });
    if (p.scopes) p.scopes = String(p.scopes).split(",").map((x) => this._t("js_" + x)).join(", ");
    return this._ti("jl_" + l.k, p);
  }

  // Fortschritts-Ansicht; update(job) aktualisiert sie (wird von _trackJob aufgerufen).
  _jobView() {
    const phase = this._el("div", { class: "jv-phase" });
    const bar = this._el("div", { class: "jv-bar" }, [this._el("span")]);
    const meta = this._el("div", { class: "jv-meta muted" });
    const toggle = this._el("button", { class: "jv-toggle", text: "▸ " + this._t("jv_details"), attrs: { type: "button" } });
    const term = this._el("pre", { class: "jv-term" });
    term.hidden = !this._jobDetailsOpen;
    if (this._jobDetailsOpen) toggle.textContent = "▾ " + this._t("jv_details");
    toggle.addEventListener("click", () => {
      term.hidden = !term.hidden;
      this._jobDetailsOpen = !term.hidden;
      toggle.textContent = (term.hidden ? "▸ " : "▾ ") + this._t("jv_details");
      if (!term.hidden) term.scrollTop = term.scrollHeight;
    });
    const hint = this._el("div", { class: "jv-hint muted" });
    const node = this._el("div", { class: "jv" }, [
      this._el("div", { class: "jv-head" }, [phase, toggle]), bar, meta, term, hint,
    ]);
    node.update = (job) => {
      if (!job) return;
      const running = job.status === "running";
      node.className = "jv " + job.status;
      phase.textContent = running
        ? `⏳ ${this._t("jp_" + (job.phase || "start"))}`
        : job.status === "done" ? "✅ " + this._t("jv_done") : "❌ " + this._t("jv_failed");
      const p = job.progress;
      const span = bar.firstChild;
      bar.classList.toggle("indet", running && p == null);
      span.style.width = (p == null ? (running ? 30 : 100) : p) + "%";
      const parts = [];
      if (p != null && running) parts.push(`${Math.floor(p)} %`);
      parts.push(this._ti("jv_elapsed", { t: this._fmtDur(job.elapsed) }));
      if (running && p != null && p > 2 && job.phase_elapsed > 3) {
        parts.push(this._ti("jv_eta", { t: this._fmtDur(job.phase_elapsed * (100 - p) / p) }));
      }
      meta.textContent = parts.join("  ·  ");
      const atBottom = term.scrollTop + term.clientHeight >= term.scrollHeight - 8;
      term.textContent = (job.lines || []).map((l) => `[${this._fmtDur(l.t).replace(/ (min|h)$/, "")}] ${this._jobLineText(l)}`).join("\n");
      if (atBottom) term.scrollTop = term.scrollHeight;
      hint.textContent = running ? this._t("jv_hint") : "";
    };
    return node;
  }

  // Auftrag verfolgen: fragt alle 1,5 s den Stand ab, aktualisiert Fenster und Kopfzeile.
  _trackJob(job) {
    this._job = job;
    this._jobViews = (this._jobViews || []).filter((v) => v.isConnected);
    this._updateJobPill();
    if (!job || job.status !== "running" || this._jobTimer) return;
    const tick = async () => {
      this._jobTimer = null;
      const res = await this._ws({ type: "ha_percyta/job_status" });
      const j = res && res.job;
      if (!j) return;
      const wasRunning = this._job && this._job.status === "running";
      this._job = j;
      (this._jobViews || []).forEach((v) => v.update(j));
      this._updateJobPill();
      (this._jobWaiters || []).forEach((fn) => fn(j));
      if (j.status === "running") this._jobTimer = setTimeout(tick, 1500);
      else if (wasRunning) {
        this._jobWaiters = [];
        this._dbList = null;
        this._refreshSoon();
        clearTimeout(this._pillTimer);
        this._pillTimer = setTimeout(() => { this._jobPillHidden = j.id; this._updateJobPill(); }, 20000);
      }
    };
    this._jobTimer = setTimeout(tick, 800);
  }

  _updateJobPill() {
    const pill = this.shadowRoot.getElementById("job-pill");
    if (!pill) return;
    const j = this._job;
    if (!j || this._jobPillHidden === j.id) { pill.hidden = true; return; }
    pill.hidden = false;
    pill.className = "job-pill " + j.status;
    const p = j.progress != null && j.status === "running" ? ` ${Math.floor(j.progress)} %` : "";
    pill.textContent = (j.status === "running" ? "⏳ " : j.status === "done" ? "✅ " : "❌ ") + this._t("ja_" + j.action) + p;
  }

  _jobDialog() {
    const view = this._jobView();
    this._jobViews = (this._jobViews || []).concat([view]);
    view.update(this._job);
    const close = this._el("button", { class: "vb-btn", text: this._t("dlg_close") });
    close.addEventListener("click", () => this._closeModal());
    this._openModal(this._t("jv_title") + " – " + this._t("ja_" + ((this._job || {}).action || "")), this._el("div", { class: "dlg" }, [view]), [close]);
  }

  // Startet eine Aktion als Hintergrund-Auftrag und zeigt den Fortschritt im Dialog.
  async _startJob(msg, ui, onOk, onErr) {
    [ui.run, ui.alt].forEach((b) => { if (b) b.disabled = true; });
    if (ui.cancel) ui.cancel.textContent = this._t("jv_close_bg");
    ui.status.className = "dlg-status";
    ui.status.replaceChildren();
    const res = await this._ws(Object.assign({}, msg, { background: true }));
    if (!res || res.error || !res.job) {
      ui.status.className = "dlg-status err";
      ui.status.textContent = this._t("dlg_error") + this._errText(res || {});
      if (ui.alt) ui.alt.disabled = false;
      if (ui.cancel) ui.cancel.textContent = this._t("dlg_close");
      if (onErr) onErr(res || {});
      return;
    }
    const view = this._jobView();
    ui.status.appendChild(view);
    view.update(res.job);
    requestAnimationFrame(() => view.scrollIntoView({ behavior: "smooth", block: "end" }));
    this._jobViews = (this._jobViews || []).concat([view]);
    this._jobPillHidden = null;
    this._jobWaiters = (this._jobWaiters || []).concat([async (j) => {
      if (j.id !== res.job.id || j.status === "running") return;
      if (ui.cancel) ui.cancel.textContent = this._t("dlg_close");
      if (ui.alt) ui.alt.disabled = false;
      if (j.status === "done") { if (onOk) await onOk(j.result || {}); }
      else if (onErr) onErr(j.error || {});
    }]);
    this._trackJob(res.job);
  }

  // Entitäten deaktivieren (z. B. dauerhaft nicht verfügbare).
  // Nicht verfügbare Entitäten: deaktivieren (umkehrbar) oder – wie „Löschen“ in HA – entfernen.
  async _disableDialog(preset, mode) {
    const states = (this._hass && this._hass.states) || {};
    const items = Object.keys(states)
      .filter((k) => states[k].state === "unavailable" && !/^(automation|script)\./.test(k))
      .map((k) => ({ id: k, name: (states[k].attributes || {}).friendly_name, exists: true, restored: !!(states[k].attributes || {}).restored, note: this._t("iss_unavailable") }))
      .sort((a, b) => a.id.localeCompare(b.id));
    const name = "ed-mode-" + Math.random().toString(36).slice(2);
    const radio = (val, label, hint) => {
      const r = this._el("input", { attrs: { type: "radio", name, value: val } });
      r.checked = (mode || "disable") === val;
      return { r, node: this._el("label", { class: "dlg-check" }, [r, this._el("span", {}, [this._el("span", { text: label }), this._el("span", { class: "dlg-check-h", text: hint })])]) };
    };
    const rDisable = radio("disable", this._t("ed_mode_disable"), this._t("ed_mode_disable_h"));
    const rRemove = radio("remove", this._t("ed_mode_remove"), this._t("ed_mode_remove_h"));
    const explainDisable = this._explain(this._t("ed_what"), [this._t("ed_w1"), this._t("ed_w2"), this._t("ed_w3")]);
    const explainRemove = this._explain(this._t("rm_what"), [this._t("rm_w1"), this._t("rm_w2"), this._t("rm_w3")]);
    const pk = this._picker({ multi: true, items, preset: preset || [], placeholder: this._t("pk_search") });
    const purgeData = this._check(this._t("dlg_reg_purge"), false);
    const backupSlot = this._el("div", {});
    const nsSlot = this._el("div", {});
    let backup = this._backupChooser(null, true);
    backupSlot.appendChild(backup);
    const backupApi = {
      get: () => backup,
      refresh: async () => {
        const info = await this._ws({ type: "ha_percyta/db_info", ids: [] });
        if (!info || info.error) return;
        const choice = backup.value();
        const sp = this._spaceState(info);
        backup.remove();
        backup = this._backupChooser(info, true);
        if (!(choice === "db_copy" && sp && !sp.fitsNew)) backup.setValue(choice);
        backupSlot.appendChild(backup);
      },
    };
    const removeOpts = this._el("div", {}, [purgeData.node, backupSlot, nsSlot]);
    const confirm = this._check(this._t("ed_confirm"), false);
    const status = this._el("div", { class: "dlg-status" });
    const body = this._el("div", { class: "dlg" }, [
      explainDisable, explainRemove,
      this._el("div", { class: "dlg-sub", text: this._t("ed_mode") }), rDisable.node, rRemove.node,
      this._el("div", { class: "dlg-field" }, [this._el("span", { text: this._t("ed_pick") }), pk.node]),
      removeOpts, confirm.node, status,
    ]);
    const cancel = this._el("button", { class: "vb-btn", text: this._t("dlg_cancel") });
    const run = this._el("button", { class: "fd-open", text: this._t("ed_run") });
    run.disabled = true;
    const isRemove = () => rRemove.r.checked;
    const applyMode = () => {
      const rm = isRemove();
      explainDisable.hidden = rm;
      explainRemove.hidden = !rm;
      removeOpts.hidden = !rm;
      run.textContent = this._t(rm ? "rm_run" : "ed_run");
      run.classList.toggle("danger", rm);
      confirm.node.querySelector("span").textContent = this._t(rm ? "rm_confirm" : "ed_confirm");
      confirm.cb.checked = false;
      upd();
    };
    const upd = () => { run.disabled = !confirm.cb.checked || !pk.values().length || this._modalBusy; };
    [rDisable.r, rRemove.r].forEach((r) => r.addEventListener("change", applyMode));
    confirm.cb.addEventListener("change", upd);
    pk.onChange(upd);
    cancel.addEventListener("click", () => this._closeModal());
    this._openModal(this._t("ed_title"), body, [cancel, run]);
    applyMode();
    backupApi.refresh();
    run.addEventListener("click", () => {
      if (pk.commitPending) pk.commitPending();
      const ids = pk.values();
      if (!ids.length) return;
      nsSlot.replaceChildren();
      const msg = isRemove()
        ? { type: "ha_percyta/registry_remove", ids: ids.slice(0, 200), purge_data: purgeData.cb.checked, backup: backup.value(), confirm: true }
        : { type: "ha_percyta/entity_disable", ids, confirm: true };
      const rm = isRemove();
      this._runModalAction(msg, { run, cancel, status }, async (res) => {
        confirm.cb.checked = false;
        upd();
        const nf = (rm && res && res.not_found) || [];
        if (nf.length) status.appendChild(this._el("div", { class: "dlg-warn", text: this._ti("rm_notfound", { n: nf.length, ids: nf.slice(0, 5).join(", ") + (nf.length > 5 ? " …" : "") }) }));
        if (rm) { this._dbList = null; backupApi.refresh(); }
        this._refreshSoon();
      }, (err) => {
        upd();
        if (rm && err && err.error === "no_space") this._noSpaceHelp(nsSlot, err, backupApi);
      });
    });
  }

  // Verwaiste Geräte entfernen (Integration existiert nicht mehr).
  _deviceDialog(finding) {
    const items = ((finding && finding.items) || []).map((i) => ({ id: i.ref, name: i.name, exists: true, note: this._ti("dv_ents", { n: i.count || 0 }) }));
    const body = this._el("div", { class: "dlg" }, [
      this._explain(this._t("dv_what"), [this._t("dv_w1"), this._t("dv_w2"), this._t("dv_w3")]),
    ]);
    const pk = this._picker({ multi: true, items, preset: items.map((i) => i.id), placeholder: this._t("pk_search"), chipName: true });
    body.appendChild(this._el("div", { class: "dlg-field" }, [this._el("span", { text: this._t("dv_pick") }), pk.node]));
    const backup = this._backupChooser({ sqlite: false, backup_services: ["x"] }, true);
    backup.querySelectorAll(".dlg-warn").forEach((n) => n.remove());
    const copy = backup.querySelector('input[value="db_copy"]');
    if (copy) copy.closest("label").remove();
    const confirm = this._check(this._t("dlg_confirm"), false);
    const status = this._el("div", { class: "dlg-status" });
    body.append(backup, confirm.node, status);
    const cancel = this._el("button", { class: "vb-btn", text: this._t("dlg_cancel") });
    const run = this._el("button", { class: "fd-open danger", text: this._t("dv_run") });
    run.disabled = true;
    const upd = () => { run.disabled = !confirm.cb.checked || !pk.values().length || this._modalBusy; };
    confirm.cb.addEventListener("change", upd);
    pk.onChange(upd);
    cancel.addEventListener("click", () => this._closeModal());
    this._openModal(this._t("dv_title"), body, [cancel, run]);
    run.addEventListener("click", () => this._runModalAction({ type: "ha_percyta/device_remove", ids: pk.values(), backup: backup.value(), confirm: true },
      { run, cancel, status }, async () => this._refreshSoon(), upd));
  }

  // Integrationen, die nicht laufen, neu laden.
  _reloadDialog(failing) {
    const body = this._el("div", { class: "dlg" }, [
      this._explain(this._t("rl_what"), [this._t("rl_w1"), this._t("rl_w2"), this._t("rl_w3")]),
    ]);
    const list = this._el("div", { class: "rl-list" });
    (failing || []).forEach((f) => {
      const st = this._el("span", { class: "muted small", text: (f.params || {}).state || "" });
      const b = this._el("button", { class: "vb-btn small", text: this._t("rl_btn") });
      b.addEventListener("click", async () => {
        b.disabled = true;
        st.textContent = "…";
        const res = await this._ws({ type: "ha_percyta/entry_reload", entry_id: f.subject_ref });
        if (res && res.success) { st.textContent = "✔ " + (res.state || "ok"); st.className = "small ok-text"; }
        else { st.textContent = "⚠️ " + (res && res.state ? res.state : this._errText(res)); b.disabled = false; }
      });
      const domain = (f.params || {}).domain || "";
      const go = () => { this._closeModal(); this._navigate("/config/integrations/integration/" + domain); };
      const open = domain ? this._linkBtn(this._t("rl_open"), "/config/integrations/integration/" + domain, "vb-btn small", () => this._closeModal())
        : this._el("button", { class: "vb-btn small", text: this._t("rl_open"), attrs: { type: "button" } });
      open.setAttribute("title", this._t("rl_open_t"));
      const titleLink = this._el("button", { class: "rl-title", attrs: { type: "button", title: this._t("rl_open_t") } }, [
        this._el("span", { class: "f-res-title", text: String(f.subject) }),
        this._el("span", { class: "mono small muted", text: domain }),
      ]);
      titleLink.addEventListener("click", go);
      if (!domain) { open.disabled = true; titleLink.disabled = true; }
      list.appendChild(this._el("div", { class: "rl-row" }, [titleLink, st, b, open]));
    });
    if (!(failing || []).length) list.appendChild(this._el("div", { class: "empty", text: this._t("cc_clean") }));
    body.appendChild(list);
    const close = this._el("button", { class: "vb-btn", text: this._t("dlg_close") });
    close.addEventListener("click", () => { this._closeModal(); this._refreshSoon(); });
    this._openModal(this._t("rl_title"), body, [close]);
  }

  // Konfiguration prüfen (dieselbe Prüfung wie „Konfiguration prüfen“ in Home Assistant).
  async _checkConfigDialog() {
    const status = this._el("div", { class: "dlg-status busy", text: this._t("cfg_running") });
    const out = this._el("pre", { class: "cfg-out" });
    out.hidden = true;
    const body = this._el("div", { class: "dlg" }, [
      this._explain(this._t("cfg_what"), [this._t("cfg_w1"), this._t("cfg_w2")]),
      status, out,
    ]);
    const close = this._el("button", { class: "vb-btn", text: this._t("dlg_close") });
    close.addEventListener("click", () => this._closeModal());
    this._openModal(this._t("cfg_title"), body, [close]);
    let res;
    try {
      res = await this._hass.callApi("POST", "config/core/check_config");
    } catch (e) {
      status.className = "dlg-status err";
      status.textContent = this._t("dlg_error") + ((e && e.message) || String(e));
      return;
    }
    const valid = res && res.result === "valid";
    status.className = "dlg-status " + (valid ? "ok" : "err");
    status.textContent = valid ? this._t("cfg_ok") : this._t("cfg_bad");
    const text = [res && res.errors, res && res.warnings].filter(Boolean).join("\n\n");
    if (text) { out.textContent = text; out.hidden = false; }
  }

  // Kurzer, gut sichtbarer Erklärkasten „Was passiert?“ oben in Dialogen.
  _explain(title, lines) {
    return this._el("div", { class: "dlg-explain" }, [
      this._el("div", { class: "dlg-explain-t", text: "ℹ️ " + title }),
      this._el("ul", {}, lines.map((l) => this._el("li", { text: l }))),
    ]);
  }

  _sectionErrors(d) {
    const list = d.errors || [];
    const rows = list.map((e, i) => {
      const dg = this._errDiag(e, d);
      return [
        { text: e.timestamp ? new Date(e.timestamp).toLocaleString() : "", sort: e.timestamp || "" },
        this._el("span", { class: "mono", text: e.source || "" }),
        { text: (e.count || 1) + "×", sort: e.count || 1 },
        { node: this._el("span", { class: "er-msg", text: e.message || "", attrs: { "data-ei": String(i) } }), sort: e.message || "" },
        { node: this._el("span", { class: "er-kind", text: (dg.domain ? dg.domain + " · " : "") + this._t("dg_" + dg.key + "_k") }), sort: dg.key },
        { node: this._el("button", { class: "vb-btn small er-go", text: "›", attrs: { type: "button", title: this._t("er_click"), "data-ei": String(i) } }), nosrch: true },
      ];
    });
    const table = this._table([this._t("th_time"), this._t("th_source"), this._t("th_count"), this._t("th_message"), this._t("er_kind"), ""], rows,
      { memKey: "errors", cols: [{}, {}, {}, {}, { cls: "er-kind-col" }, { nosort: true }] });
    table.classList.add("err-table");
    table.addEventListener("click", (ev) => {
      const tr = ev.target.closest("tr");
      const n = tr && tr.querySelector("[data-ei]");
      if (n && tr.parentNode.tagName === "TBODY") this._errorDialog(list[parseInt(n.dataset.ei, 10)], d);
    });
    const body = this._el("div", {}, [this._el("div", { class: "hint-line", text: this._t("er_click") }), table]);
    return this._section(this._t("sec_errors"), list.length, body, true);
  }

  // Einordnung eines Log-Fehlers: betroffene Integration + wahrscheinliche Ursache (Faustregeln).
  _errDiag(e, d) {
    const msg = String(e.message || "");
    const exc = String(e.exception || "");
    const text = `${msg}\n${exc}`;
    const generic = new Set(["sensor", "binary_sensor", "switch", "light", "climate", "cover", "number", "select", "button", "fan", "lock",
      "media_player", "camera", "text", "event", "update", "weather", "vacuum", "water_heater", "device_tracker", "notify", "scene",
      "siren", "valve", "lawn_mower", "image", "date", "time", "datetime", "todo", "calendar", "alarm_control_panel", "humidifier",
      "conversation", "intent", "homeassistant", "http", "websocket_api", "frontend", "logger", "system_log", "recorder"]);
    let domain = null;
    let custom = false;
    const pats = [/with platform ([a-z0-9_]+)/, /setting up ([a-z0-9_]+) platform/, /integration '([a-z0-9_]+)'/, /Requirements for ([a-z0-9_]+) not found/];
    for (const re of pats) { const m = msg.match(re); if (m && !generic.has(m[1])) { domain = m[1]; break; } }
    const cm = `${msg}\n${e.source || ""}\n${e.name || ""}\n${exc}`.match(/custom_components[./]([a-z0-9_]+)/);
    if (!domain && cm) domain = cm[1];
    if (!domain) {
      const nm = String(e.name || "").match(/^homeassistant\.components\.([a-z0-9_]+)/) || String(e.source || "").match(/(?:^|\/)components\/([a-z0-9_]+)\//);
      if (nm && !generic.has(nm[1])) domain = nm[1];
    }
    if (domain && cm && cm[1] === domain) custom = true;
    if (domain && /custom integration/.test(msg)) custom = true;
    const rules = [
      ["dep", /Requirements for|Unable to install package|No module named|ModuleNotFoundError|ImportError|unsatisfiable/i],
      ["auth", /\b401\b|\b403\b|Unauthori[sz]ed|Access Denied|Forbidden|invalid[_ ](?:auth|credentials|token|api[_ ]?key)|authenticat\w* fail|login fail/i],
      ["net", /timed? ?out|Timeout|Max retries|HTTPS?ConnectionPool|Connection ?(?:Error|refused|reset|aborted)|Cannot connect|ClientConnectorError|Name or service not known|No route to host|unreachable|NewConnectionError|getaddrinfo|ServerDisconnected/i],
      ["tmpl", /TemplateError|UndefinedError|Template variable (?:error|warning)|rendering template/i],
      ["entity", /Error adding entit|does not generate unique IDs|already exists|unique[_ ]?id/i],
      ["code", /AttributeError|TypeError|KeyError|IndexError|NameError|ZeroDivisionError|has no attribute|unsupported operand|not subscriptable|NoneType/],
      ["setup", /Error while setting up|Setup failed|Error setting up entry|Unable to set up|failed to set up/i],
      ["fetch", /Error fetching|Error requesting|Error updating|update_coordinator/i],
    ];
    let key = "generic";
    for (const [k, re] of rules) { if (re.test(k === "fetch" ? `${text}\n${e.source || ""}` : text)) { key = k; break; } }
    if (key === "generic" && custom) key = "custom";
    const entries = (d && d.integrations ? d.integrations : []).filter((i) => domain && i.domain === domain);
    if (entries.some((i) => i.is_custom)) custom = true;
    if (key === "generic" && custom) key = "custom";
    return { key, domain, custom, entries };
  }

  _errorDialog(e, d) {
    if (!e) return;
    const dg = this._errDiag(e, d);
    const kv = (label, value, mono) => value ? this._el("div", { class: "er-kv" }, [
      this._el("span", { class: "muted", text: label }), this._el("span", { class: mono ? "mono" : "", text: String(value) }),
    ]) : null;
    const steps = this._t("dg_" + dg.key + "_s");
    const intLabel = dg.domain ? `${dg.domain} · ${dg.custom ? this._t("er_custom") : this._t("er_core")}` : this._t("er_unknown");
    const body = this._el("div", { class: "dlg er-dlg" }, [
      this._el("div", { class: "er-message" }, [this._el("div", { class: "muted small", text: this._t("er_msg") }), this._el("div", { class: "mono", text: e.message || "" })]),
      this._el("div", { class: "er-grid" }, [
        kv(this._t("er_int"), intLabel),
        kv(this._t("er_src"), e.source, true),
        kv(this._t("er_logger"), e.name, true),
        kv(this._t("er_count"), (e.count || 1) + "×"),
        kv(this._t("er_last"), e.timestamp ? this._fmtDateTime(e.timestamp) : ""),
        kv(this._t("er_first"), e.first && e.first !== e.timestamp ? this._fmtDateTime(e.first) : ""),
      ]),
      this._el("div", { class: "dlg-explain er-diag" }, [
        this._el("div", { class: "dlg-explain-t", text: this._t("er_cause") }),
        this._el("div", { style: "margin:4px 0 8px;line-height:1.5;font-size:13.5px", text: this._t("dg_" + dg.key + "_c") }),
        this._el("div", { class: "dlg-explain-t", text: this._t("er_steps") }),
        this._el("ol", {}, (Array.isArray(steps) ? steps : [steps]).map((x) => this._el("li", { text: x }))),
      ]),
    ]);
    if (e.exception) {
      const det = this._el("details", { class: "er-trace" }, [
        this._el("summary", { text: this._t("er_trace") }),
        this._el("pre", { class: "cfg-out", text: e.exception }),
      ]);
      body.appendChild(det);
    }
    body.appendChild(this._el("div", { class: "note muted small", style: "margin-top:10px;line-height:1.5", text: this._t("er_note") }));
    const btns = [];
    const mk = (label, fn, cls) => { const b = this._el("button", { class: cls || "vb-btn", text: label, attrs: { type: "button" } }); b.addEventListener("click", fn); btns.push(b); return b; };
    const copy = mk(this._t("er_copy"), async () => {
      try { await navigator.clipboard.writeText(`${e.source || ""}: ${e.message || ""}${e.exception ? "\n" + e.exception : ""}`); copy.textContent = this._t("er_copied"); } catch (err) { copy.textContent = "⚠️"; }
    });
    if (dg.domain) btns.push(this._linkBtn(this._t("er_open_int"), "/config/integrations/integration/" + dg.domain, "vb-btn", () => this._closeModal()));
    if (dg.entries.length) {
      mk(this._t("er_reload"), () => this._reloadDialog(dg.entries.map((i) => ({
        subject_ref: i.entry_id, subject: i.title || i.domain, params: { domain: i.domain, state: i.state },
      }))));
    }
    btns.push(this._linkBtn(this._t("er_logs"), "/config/logs", "vb-btn", () => this._closeModal()));
    const close = mk(this._t("dlg_close"), () => this._closeModal());
    close.className = "vb-btn";
    this._openModal(this._t("er_title"), body, btns);
  }
}

customElements.define("ha-percyta-panel", HaPercytaPanel);
