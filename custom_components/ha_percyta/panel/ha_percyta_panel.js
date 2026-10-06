// HA Percyta Report-Panel – moderne, gerenderte Ansicht des Scan-Reports in Home Assistant.

const RISK_LABEL = { high: "HIGH", medium: "MEDIUM", low: "LOW" };
const RISK_SEV = { high: 3, medium: 2, low: 1 };
const LS_MODE = "hapercyta_view_mode"; // "single" | "accordion"
const LS_WIDTH = "hapercyta_view_width"; // "full" | "narrow"
const LS_VIEW = "hapercyta_view_state"; // offene Boxen, Sortierung, Erklär-Card
const LOGO_URL = "/ha_percyta_static/logo.png";

// Übersetzungen (Oberfläche folgt der HA-Sprache; de sonst en).
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
    k_cloud: "Cloud-Integrationen", k_stale: "Ungenutzte Tokens", k_errors: "Wichtige Fehler",
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
    k_cloud: "Cloud integrations", k_stale: "Unused tokens", k_errors: "Important errors",
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
    this._autoScanPending = true;
    this._maybeAutoScan();
  }

  disconnectedCallback() {
    // Beim Verlassen des Panels die aktuelle Ansicht sofort sichern.
    clearTimeout(this._saveViewTimer);
    if (this._built) this._saveView();
    window.removeEventListener("scroll", this._scrollHandler, true);
    window.removeEventListener("resize", this._scrollHandler);
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
    if (opts.html != null) node.innerHTML = opts.html;
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
    const memKey = base + "#" + this._tableSeq[base];
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
      tbody.innerHTML = "";
      for (const cells of data) {
        const tr = document.createElement("tr");
        for (const cell of cells) tr.appendChild(this._cellNode(cell));
        tr.hidden = !this._rowMatches(tr);
        tbody.appendChild(tr);
      }
    };

    const ths = headers.map((h, i) =>
      this._el("th", { class: "sortable", attrs: { "data-idx": String(i) } }, [
        this._el("span", { text: h }),
        this._el("span", { class: "sort-ind", text: "" }),
      ])
    );
    const updateIndicators = () => {
      ths.forEach((th, i) => {
        const ind = th.querySelector(".sort-ind");
        ind.textContent = state.idx === i ? (state.dir === "asc" ? " ▲" : " ▼") : "";
        th.classList.toggle("active", state.idx === i);
      });
    };
    ths.forEach((th, i) =>
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
      })
    );

    const thead = this._el("thead", {}, [this._el("tr", {}, ths)]);
    updateIndicators();
    renderBody();
    return this._el("div", { class: "table-wrap" }, [this._el("table", {}, [thead, tbody])]);
  }

  _build() {
    const style = document.createElement("style");
    style.textContent = `
      :host { display:block; height:100%; overflow:auto;
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

      .content { padding:18px 22px 48px; box-sizing:border-box; position:relative; }
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
      .grid-sec { grid-template-columns:repeat(6, 1fr); }
      @media (min-width:1500px) { .grid-inv { grid-template-columns:repeat(8, 1fr); } }
      @media (max-width:1100px) { .grid-inv { grid-template-columns:repeat(2, 1fr); } .grid-sec { grid-template-columns:repeat(3, 1fr); } }
      @media (max-width:560px) { .grid-inv, .grid-sec { grid-template-columns:repeat(2, 1fr); } }
      .stat { display:flex; align-items:center; gap:13px; padding:15px 18px; border-radius:16px;
        background:var(--card-background-color,#1c1c1c); box-shadow:var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,.20));
        border:1px solid var(--divider-color); transition:transform .12s ease, box-shadow .12s ease; }
      .stat:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.24); }
      .stat.accent-red { background:rgba(219,68,55,.16); border-color:rgba(219,68,55,.34); }
      .stat.accent-amber { background:rgba(255,166,0,.16); border-color:rgba(255,166,0,.34); }
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
      .why-btn.active { background:var(--primary-color,#3f9dff); color:#fff; border-color:transparent; }
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
      .segmented button.active { background:var(--primary-color,#3f9dff); color:#fff; font-weight:600; }
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

      .to-top { position:fixed; right:26px; bottom:26px; z-index:9999; width:46px; height:46px; border-radius:50%;
        border:none; cursor:pointer; background:var(--primary-color,#3f9dff); color:#fff; font-size:22px; line-height:1;
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
      this._el("button", { text: this._t("rescan"), attrs: { id: "scan" } }),
      this._el("button", { class: "menu-btn", text: "☰", attrs: { id: "toggle-menu", title: this._t("sidebar_toggle"), "aria-label": this._t("sidebar_toggle") } }),
    ]);
    const content = this._el("div", { class: "content", attrs: { id: "content" } }, [
      this._el("div", { class: "status", text: this._t("loading") }),
    ]);
    const toTop = this._el("button", { class: "to-top", text: "↑", attrs: { id: "to-top", title: this._t("to_top"), "aria-label": this._t("to_top") } });

    this.shadowRoot.append(style, bar, content, toTop);
    this.shadowRoot.getElementById("scan").addEventListener("click", () => this._runScan());
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

  _navigate(path) {
    try {
      history.pushState(null, "", path);
      window.dispatchEvent(new Event("location-changed"));
    } catch (e) {
      window.location.assign(path);
    }
  }

  _linkNum(n, path) {
    const el = this._el("span", { class: "link-num", text: String(n), attrs: { title: this._t("open_in_ha") } });
    el.addEventListener("click", () => this._navigate(path));
    return el;
  }

  _jumpTo(key) {
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
      clone.querySelectorAll(".filter, .viewbar, .reveal-btn").forEach((n) => n.remove());
      clone.querySelectorAll(".secret-val[data-masked]").forEach((n) => (n.textContent = n.getAttribute("data-masked")));
      clone.querySelectorAll("[hidden]").forEach((el) => el.removeAttribute("hidden"));
      clone.querySelectorAll("details").forEach((d) => d.setAttribute("open", ""));
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

  async _loadReport() {
    if (!this._hass) return;
    try {
      const res = await this._hass.connection.sendMessagePromise({ type: "ha_percyta/report" });
      this._data = res;
      this._error = null;
    } catch (err) {
      this._error = (err && err.message) || String(err);
    }
    this._render();
  }

  async _runScan() {
    const btn = this.shadowRoot.getElementById("scan");
    if (btn) { btn.setAttribute("disabled", ""); btn.textContent = this._t("scanning"); }
    try {
      await this._hass.callService("ha_percyta", "scan");
    } catch (e) {}
    await this._loadReport();
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

  _onSectionToggle(details) {
    if (this._suppressAccordion) return;
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
    content.innerHTML = "";

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

    content.appendChild(this._el("div", { attrs: { id: "top-anchor" }, style: "position:absolute;top:0;height:1px;width:1px" }));

    if (!d) {
      content.appendChild(
        this._el("div", { class: "empty" }, [
          this._el("div", { style: "font-size:40px;margin-bottom:10px", text: "🛡️" }),
          this._el("div", { text: this._t("no_result") }),
          this._el("div", { class: "muted", style: "margin-top:6px", text: this._t("press_rescan") }),
        ])
      );
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

    const grid = this._el("div", { class: "stat-grid grid-inv" });
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

    const riskGrid = this._el("div", { class: "stat-grid grid-sec" });
    riskGrid.append(
      this._statCard("🔴", c.high_risk || 0, this._t("k_high"), "accent-red", "integrations+addons"),
      this._statCard("🟡", c.medium_risk || 0, this._t("k_medium"), "accent-amber", "integrations+addons"),
      this._statCard("🔐", c.secrets_found || 0, this._t("k_secrets"), c.secrets_found ? "accent-amber" : "accent-green", "secrets"),
      this._statCard("☁️", c.cloud || 0, this._t("k_cloud"), c.cloud ? "accent-amber" : "accent-green", "cloud"),
      this._statCard("🗝️", c.stale_tokens || 0, this._t("k_stale"), c.stale_tokens ? "accent-red" : "accent-green", "tokens"),
      this._statCard("❗", c.errors || 0, this._t("k_errors"), c.errors ? "accent-red" : "accent-green", "errors")
    );
    content.appendChild(riskGrid);

    content.appendChild(this._riskDistribution(d));
    content.appendChild(this._viewbar());

    const sections = this._el("div", { class: "sections" });
    const systemSection = this._sectionSystem(d);
    const defs = [
      ["system", systemSection],
      ["inventory", this._sectionInventory(d)],
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
    for (const [key, node] of defs) {
      if (!node) continue;
      node.id = "sec-" + key;
      sections.appendChild(node);
    }
    content.appendChild(sections);

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

    return this._el("div", { class: "riskbar-card" }, [
      this._el("div", { class: "riskbar-head" }, [
        this._el("span", { text: this._t("riskdist") }),
        this._el("div", { class: "rb-head-right" }, [
          this._el("span", { text: `${items.length} ${this._t("total")}` }),
          whyBtn,
        ]),
      ]),
      bar,
      legend,
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
    const parts = [cards, this._el("div", { class: "hint-line", text: this._t("db_hint") })];

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
        ];
      });
      parts.push(this._el("div", { class: "sub-head", text: this._t("db_states") }));
      parts.push(this._table([this._t("th_entity"), this._t("th_rows"), "%", this._t("th_share")], rows, { sortIdx: 1, sortDir: "desc" }));
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
      ]);
      parts.push(this._section(this._t("db_stats"), stats.length,
        this._table([this._t("th_statistic"), this._t("th_lts"), this._t("th_sts"), this._t("th_share")], rows, { sortIdx: 1, sortDir: "desc" })));
    }

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
    await this._loadReport();
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

  // Zelle mit maskiertem Wert + Button, der den Klartext auf Klick vom Server holt.
  _secretCells(entryId, secret) {
    const valueEl = this._el("span", { class: "mono secret-val", text: secret.value, attrs: { "data-masked": secret.value } });
    if (!entryId || secret.masked === false) return [valueEl, { text: "", nosrch: true }];
    const btn = this._el("button", { class: "reveal-btn", text: this._t("sec_reveal"), attrs: { title: this._t("sec_reveal_t") } });
    let shown = false;
    btn.addEventListener("click", async () => {
      if (shown) {
        shown = false;
        valueEl.textContent = secret.value;
        btn.textContent = this._t("sec_reveal");
        return;
      }
      btn.setAttribute("disabled", "");
      try {
        const res = await this._hass.connection.sendMessagePromise({
          type: "ha_percyta/reveal_secret", entry_id: entryId, source: secret.source, key: secret.key,
        });
        valueEl.textContent = res && res.value != null ? String(res.value) : secret.value;
        shown = true;
        btn.textContent = this._t("sec_hide");
      } catch (err) {
        btn.textContent = "⚠️";
        btn.setAttribute("title", this._t("sec_reveal_err"));
        setTimeout(() => { btn.textContent = this._t("sec_reveal"); btn.setAttribute("title", this._t("sec_reveal_t")); }, 2500);
      }
      btn.removeAttribute("disabled");
    });
    return [valueEl, { node: btn, sort: "", nosrch: true }];
  }

  _sectionSecrets(d) {
    const rows = [];
    for (const i of d.integrations || []) {
      for (const s of i.analysis.secrets || []) {
        rows.push([
          this._el("span", { class: "mono", text: i.domain }),
          s.source,
          this._el("span", { class: "mono", text: s.key }),
          ...this._secretCells(i.entry_id, s),
        ]);
      }
    }
    const body = rows.length
      ? this._table([this._t("th_integration"), this._t("th_source"), this._t("th_field"), this._t("th_value"), ""], rows)
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
          hint,
          this._table([this._t("th_user"), this._t("th_client"), this._t("th_type") || "Typ", this._t("th_last_used"), this._t("th_status")], list.map((t) => [
            t.user,
            t.client_name || "—",
            this._chip(t.is_long_lived ? this._t("tok_longlived") : t.type, t.is_long_lived ? "warn" : ""),
            fmt(t.last_used_at),
            { node: statusCell(t) },
          ])),
        ])
      : this._el("div", { class: "empty", text: this._t("empty_tokens") });
    return this._section(this._t("sec_tokens"), list.length, body);
  }

  _sectionErrors(d) {
    const list = d.errors || [];
    const body = this._table([this._t("th_time"), this._t("th_source"), this._t("th_count"), this._t("th_message")], list.map((e) => [
      e.timestamp ? new Date(e.timestamp).toLocaleString() : "",
      this._el("span", { class: "mono", text: e.source || "" }),
      { text: (e.count || 1) + "×", sort: e.count || 1 },
      e.message || "",
    ]));
    return this._section(this._t("sec_errors"), list.length, body, true);
  }
}

customElements.define("ha-percyta-panel", HaPercytaPanel);
