<p align="center">
  <img src="docs/logo.png" alt="HA Percyta Logo" width="200">
</p>

# 🛡️ HA Percyta – Home Assistant Permissions, Privacy & Data Scanner

🌐 **Sprache / Language:** [Deutsch](README.md) · **English**

**Home Assistant integration** – scans **locally** all integrations, apps,
custom cards, blueprints, users, tokens and stored API keys/secrets, and evaluates
system access (GPS, camera, root/supervisor …). Since **v1.1.x** it also captures
**disk space, CPU and RAM usage**.

> Runs entirely **inside** Home Assistant and reads all data directly via the internal
> `hass` object. **No token and no URL required.**
> Data is **read only** – nothing is changed.

## Features

- **Integrations** – all config entries with state, source, custom flag, IoT class,
  dependencies, entity and device counts. Clicking the entity/device count jumps straight
  to the matching filtered view in Home Assistant.
- **API keys & secrets** – detects keys/tokens/passwords stored in integration data
  (masked or, on request, in plain text). This means the credentials integrations store in
  their configuration during setup (including nested ones such as OAuth tokens) – not the
  `secrets.yaml` file. The **“Show”** button in a table row reveals a single value in full
  when needed (admins only; the plain text is only loaded on click and is never part of the
  HTML download).
- **Apps** – via the Supervisor API: which apps have `full_access`,
  `privileged`, host network, Docker API, GPIO/USB, supervisor role, etc. – including
  runtime resources (CPU/RAM per app) and the **data size per app** (app data + app
  configuration as reported by the Supervisor, without the Docker image).
- **System access analysis** – does an integration/app need GPS, camera, network,
  database or even root/system rights?
- **💾 Storage & System** – total disk (used/free), RAM and swap usage, CPU load +
  load average, **system storage by category** (system, apps, media, backups … via
  Supervisor, incl. the total of all custom cards) plus a breakdown of the largest storage consumers under `/config`
  (recorder database, backups, custom components, media, www …) including the disk
  footprint of each custom integration.
- **📊 Inventory & Health** – number of automations, scripts, scenes, helpers, areas, floors
  and labels, unavailable/disabled/hidden entities (incl. a breakdown of unavailable entities
  by integration), **available updates** with installed and new version, **disabled entities
  by integration** (collapsible), plus entities by domain. The overview cards link straight to
  the matching page in Home Assistant (automations, scripts, scenes, helpers, areas, entities,
  updates).
- **🗄️ Database (Recorder)** – which entities fill the database the most: number of rows per
  entity (states) and per statistic (long-term/short-term statistics) incl. totals. The top 30
  of each are listed; a click opens the history. The
  analysis is recalculated at most once per hour.
- **💾 Last HA backup** – time, age, size and name of the most recent backup right below the
  version line (click opens the backup page; older than 7 days is highlighted).
- **Custom cards** – all Lovelace resources (custom card URLs) incl. storage size
  (resolved via the file path; for HACS cards the folder size); the total is also shown
  under system storage by category.
- **Blueprints** – all registered automation/script blueprints incl. file size.
  Custom cards and blueprints are shown as collapsible tables inside the “Storage & System” box.
- **Users & tokens** – owner/admin, groups, long-lived tokens incl. last usage.
- **Risk rating** – automatic classification 🟢 Low / 🟡 Medium / 🔴 High, incl. a
  collapsible “Why?” explanation card that justifies the current distribution from the data.
  The level can be **overridden manually per integration** (the “Adjust” selector in the
  integrations table, e.g. when a weather service is flagged High only because of a camera
  entity).
- **Sensors & button** – key figures as sensors (incl. CPU, RAM and disk usage),
  manual scan via button.
- **Report panel** – switchable between full screen width (multi-column tile layout) and
  a narrow view, sortable tables, a global search across all tables, plus toggles for
  single/accordion mode and “expand/collapse all”. UI is **bilingual (DE/EN)** – follows
  the HA language automatically.
- **New since last scan** – new integrations/apps/custom cards/blueprints/users are
  flagged (“NEW” badge). The note in the header states **what** is new (e.g. “1 integration,
  1 custom card”) and lists the names; clicking a type jumps to the matching section. A
  **“New findings”** sensor and the `ha_percyta_new_findings` event (incl. type and names)
  enable automations. Updated custom cards are not counted as new.
- **Auto scan** – optional at a configurable interval.
- **Markdown report** – optional file export per scan.

> **Logo/branding:** The integration ships its own brand images (`custom_components/ha_percyta/brand/`). Home Assistant supports local brand images for custom integrations from **2026.3** – on older versions the logo will not show in the UI.

## Installation

1. Copy the folder `custom_components/ha_percyta` to `/config/custom_components/`:
   ```bash
   cp -r custom_components/ha_percyta /config/custom_components/
   ```
2. **Restart** Home Assistant.
3. **Settings → Devices & Services → + Add Integration → HA Percyta**.
4. Choose options (all with sensible defaults) and save.

> **Alternative (ZIP):** Every GitHub release automatically includes the file `ha_percyta.zip`.
> Extract its contents directly into `/config/custom_components/ha_percyta/` (the
> `manifest.json` sits at the top level of the ZIP) and restart Home Assistant.

> **Note:** HA Percyta requires no additional Python packages. For exact CPU/RAM values it
> uses `psutil` if already present in the HA system – otherwise a built-in fallback
> (`/proc`, `shutil`) is used.

## Options

| Option | Meaning | Default |
|---|---|---|
| Include apps | Scan apps via Supervisor (HA OS/Supervised only) | ✅ |
| Detect API keys | Find secrets in integration data | ✅ |
| Errors from system log | Include important errors (no warnings) | ✅ |
| Analyse storage, CPU & RAM | Capture system/storage usage | ✅ |
| Mask secrets | Only show first/last 4 characters | ✅ |
| Write report | Save a Markdown report per scan | ✅ |
| Output directory | Destination of report files | `custom_components/ha_percyta/output` |
| Auto scan | Scan automatically on a schedule | ❌ |
| Interval | Seconds between auto scans (min. 300) | 3600 |

Options can be changed at any time via **Configure** on the integration.

## Usage

- **Report directly in HA:** the sidebar shows an entry **“HA Percyta”** – the report
  is rendered in a modern view across the **full screen width** with stat cards, risk
  distribution and collapsible sections (no MD file needed). On large screens the boxes are
  **tiled in multiple columns**; an opened box automatically takes the full width.
  - **View toggles:** *Single* (multiple boxes open), *Accordion* (opening one closes the
    previous), *Wide/Narrow* (full width ↔ centered narrow view) and *Expand/collapse all*.
    The choice is remembered.
  - **Global search:** the search box filters across all tables; boxes with matches open
    automatically, empty ones are hidden.
  - **Sortable tables:** click a column header to sort ascending/descending.
  - Buttons for *Rescan* and **Download as MD/HTML**, plus a button on the right of the
    header to show/hide the HA sidebar, are built in.
  - **View is preserved:** when a scan runs in the background the panel only refreshes the
    data – open boxes, sorting and scroll position stay as they are. The last view (open boxes,
    sorting) is remembered in the browser and applies again when you leave the panel and come
    back later.
  - **Automatic scan on open:** opening the panel from the sidebar runs a fresh scan
    automatically; after that you can trigger one manually via *Rescan*.
- **💾 Storage & System:** dedicated section with cards for disk usage, free space, RAM and
  CPU, the system storage by category, and the breakdown of the largest consumers.
- **Cloud data flow:** dedicated section showing which integrations send data to
  external/cloud services.
- **Token hygiene:** long-lived tokens never used or unused for a long time (> 90 days) are
  flagged (candidates for revocation) – incl. the *“Unused tokens”* sensor.
- **Scan interval on the device:** the device page offers the select **“HA Percyta scan
  interval”** with *Manual / Hourly / Daily / Weekly / Monthly*. The sensors **“Last scan”**
  and **“Next scan”** transparently show when the next automatic run is due.
- **Button “HA Percyta start scan”** triggers a scan immediately.
- **Sensors:** security findings, integrations, apps, API keys & secrets, CPU usage,
  RAM usage, disk usage and free disk space (with detail attributes such as high-risk
  domains, root apps or total/free GiB).
- **Services:**
  | Service | Description |
  |---|---|
  | `ha_percyta.scan` | Run a scan, returns key figures + report path as response |
  | `ha_percyta.export` | Return the current report as Markdown text (response) |

### Reading secrets in plain text

Disable **“Mask secrets”** in the options, then call `ha_percyta.scan` or `ha_percyta.export`
in **Developer Tools → Actions** – the response contains the full report. For privacy,
plain-text secrets are **not** stored in entity attributes (the recorder would keep them),
only in the report.

## Risk classification

| Level | Meaning |
|---|---|
| 🟢 Low | No external access, no sensitive data |
| 🟡 Medium | External/cloud access, stored secrets or system relation |
| 🔴 High | GPS, camera or root/system/supervisor access |

## Note

HA Percyta only **reads** – it does not change anything in your installation. Reports are
stored locally in the chosen output directory.

---

**Created by Wally 🍷**
