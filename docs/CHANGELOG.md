# Changelog

All notable changes to **HA Percyta**. German version: [docs/CHANGELOG_de.md](docs/CHANGELOG_de.md).
Older versions: see the [GitHub releases](https://github.com/jayjojayson/HA_Percyta/releases).

## v1.2.2

HA Percyta becomes a **maintenance tool**: besides the scan you can now inspect, clean up and maintain your
whole Home Assistant system from one panel. Scans stay read-only – changes only happen through action buttons
you start yourself, with an explanation, a preview, confirmation and (where it matters) a backup first.

### 🧽 Care center
- Calmer look: the coloured stripe of the tiles now sits at the bottom edge; the header card with the ring has no
  stripe (ring and text show the state).
- **Mouse/browser back button** works inside HA Percyta: from a finding back to the care center, from there back to
  the overview (same as the *Back* button and Esc).
- New **care center** preview at the top of the report (next to *Risk & privacy*) and its own **care center page**.
- **Maintenance need 0–100 %** instead of “% clean”: 0 % = everything fine (green ring), the colour changes with the
  value (up to 10 % green, 35 % yellow, 60 % orange, above red). Each area is rated relative to the size of the
  installation (entities, integrations, automations/scripts, devices, database rows, tokens) with a fixed maximum
  weight. **“Why?”** shows every area with its current value, a bar and the points (preview and care center page).
- Tiles with count, explanation and button: orphaned database data, orphaned entities, orphaned devices, unavailable
  entities, integrations with errors, automations with problems, automations turned off, **findings (reports)**,
  unused tokens, open repairs, important log errors, available updates, **last HA backup (size, age in the
  description)**, **last Percyta backup** (size and age of the newest database copy, number of copies and space
  used), database, configuration check.
- The care center preview on the overview shows the **last Percyta backup** (the last HA backup is already shown
  below the title).
- The **Reports** box (findings) is also shown on the care center page; opening a finding from there returns to the
  care center.
- Quick links: findings, database, replace entity, delete data, log; list of the most recent actions.
- **Reports:** a collapsible note explains what *Open*, *Allowed*, *Snoozed* and *Hidden* mean and what happens in
  the background (status only stored in HA Percyta, nothing changed in Home Assistant).

### 🤖 Automation & script findings
- New category **Automations & scripts**: invalid configuration (with the error from Home Assistant), errors while
  running (from traces), skipped runs, problematic references (missing/disabled/orphaned/unavailable entities,
  deleted devices/areas, unknown actions, entities in templates), automations turned off, not triggered for 90+ days
  (with the reason when conditions blocked).
- Actions: turn on, test now (skip conditions), turn off.

### ✔ Recently resolved
- Every entry is clickable: what the problem was, affected objects as they were with a **“Now”** column, technical
  data and a **history timeline**. Open findings get a **History** tab too.

### 🗄️ Database tools (Recorder)
- **Replace entity** (device swap – the new entity takes over the old ID, history and long-term statistics continue),
  **rename**, **delete data** with three checkboxes (history, short-term, long-term statistics) and *only older than
  7/30/90/365 days*, **clean up** the whole database (+ shrink), **orphaned entities**, **orphaned data**,
  **backups** (SQLite copy verified with `quick_check` or HA backup) and a **log** of all actions.
- Searchable selection dropdown with quick filters, domain filter and “Select all matches”.
- **“Deselect all”** button in every window with a pre-selection.
- **List view for selections:** the button **☰ List / ▦ Tiles** (top right above the selection) shows the chosen
  entities/devices as a list with name, ID and state, with × per row and – from 8 entries – a search in the
  selection. The choice is remembered.
- Preview shows rows and the **time range per data type**, unit, current state and warnings.
- **Preview fixed**: no more flickering/empty preview – the previous table stays visible while loading, the window
  stays anchored at the top, a hint is shown when nothing is selected, a typed but not confirmed ID is taken over,
  outdated answers are ignored, and after a job the preview is reloaded (confirmation is reset).
- The **“Load preview” button was removed** – the preview loads automatically when the selection changes, so the
  button only closed the selection list and confused. New column **Space (approx.)** when deleting data, plus the
  total and a note that the file only shrinks after a repack.
- **Not enough space**: the backup choice shows database size, needed and free space; new option **“Replace the
  existing Percyta copy”** (old copy is deleted only if the space is then sufficient). If a backup fails because of
  space, the window lists the existing Percyta copies with a delete button and offers *Replace existing copy* or
  *Use HA backup* – including the hint that deleting Percyta copies frees up space. Leftovers of aborted copies are
  removed; a “disk full” during copying is reported as *not enough space*.
- All database actions run as **background jobs** with phase, progress bar, elapsed/remaining time and a
  terminal-like log; the window may be closed, a badge in the top bar shows the progress.

### 🛠️ More actions
- **Unavailable entities: disable or remove from Home Assistant** – removing works like *“Delete”* in the entity
  settings of HA (entity registry, so it also disappears from its device), optionally incl. history/statistics, HA
  backup pre-selected. Also available as *“🗑️ Remove from HA …”* on the finding.
- Disable entities, reload integrations, remove orphaned devices, revoke access tokens (own session protected),
  check configuration (same check as before a restart).

### ❗ Important errors with diagnosis
- Every log error is **clickable**: full message, source, logger, count, first/last occurrence, end of the traceback,
  affected integration (core or custom), category (dependency, login, reachability, entity, code error, setup, data
  fetch, template, custom integration, unclear), **possible cause**, **steps** and buttons (open integration, reload
  integration, open logs, copy message). The table has a new *Category* column.
- `api_key=…`, `token=…`, `password=…` and similar values are masked in log texts.

### 🛡️ Risk & privacy / header
- Compact header: key figures in one row, below *Risk & privacy* and the care center preview side by side.
- **New box layout on the overview:** the boxes are a compact list in two groups – *Security & privacy* (integrations,
  apps, system access, cloud data flow, API keys & secrets, users, access tokens) and *System & details* (storage &
  system, inventory & health, reports, database, important errors). Each row shows a Home Assistant icon, the title, a
  key fact and a coloured status; a click expands the content as before. Search, single/accordion and wide/narrow
  view work as before; on first opening all boxes are collapsed.
- *Risk & privacy* now only counts **security & privacy findings** (click opens exactly those); open findings in
  general and log errors are part of the care center.

### 🔐 Secrets hardened
- Values are always masked on the server; plain text never ends up in scan data, report, sensors or HTML export.
- Option **“Allow showing secrets in plain text in the panel”** replaces “Mask secrets”; show/copy only for admins, rate limit, audit log,
  auto-hide after 20 s. No HTML insertion in the panel (XSS hardening), links only to internal paths or http(s).

### 🐞 Fixes
- Deleting statistics with *keep days* failed (Home Assistant requires start and end time) – now done with a
  recorder task.
- Job log missed the final “done” line.
- Care center links on sub-pages did nothing.
- **Deleting data of an active entity never finished:** the progress also counted the new values the entity keeps
  recording (and statistics HA computes afterwards), so “rows left” went up again. Now only rows that existed before
  the deletion are watched – the job finishes as expected.
- Accordion mode: links in the care center preview (e.g. *Findings*, then *Database*) now close the previously opened
  box and open the target box – before, the first box stayed open and the target closed again.
- Preview / no-space problems (see above).
- **Counts update after an action:** after deleting, removing, disabling, reloading or switching automations on/off,
  the panel waits for the new scan and then shows the new numbers on its own (top bar: *“Updating data …”*). Before,
  the care center kept the old numbers until *Rescan*. Database counts are corrected immediately with the known
  changes (deleted rows, renamed IDs), so orphaned data no longer shows up while the database is counted again.
  *Rescan* also waits now when Home Assistant starts the scan with a short delay.
- **Integrations with errors:** discoveries you ignored in Home Assistant (e.g. a TV or PlayStation found on the
  network) are no longer counted as integrations or as “not running” – they were never set up. Disabled entries were
  already excluded. In the reload window, the name and **Open ↗** lead straight to the integration in Home Assistant.
- **Automations with problems:** tile and maintenance need now count the same thing – each automation/script once,
  only open findings with severity high/medium, and **turned-off automations don't count** (an old error of a
  turned-off automation is now only a low-severity note). Before, the score also counted low-severity findings and
  turned-off automations, so allowing or switching off did not lower it. Note: one automation can have several
  findings (e.g. *errors while running* and *problematic references*) – it only stops counting once all of them are
  allowed, snoozed or hidden.
- **Risk override** (“Adjust” in the integrations table) is shown immediately incl. the risk counters – before,
  the window waited for a complete scan. Dependent findings follow with a scan in the background.
- **Reports in the care center** are independent of the search on the overview (before, an active search left the
  box empty) and have their own filter (category, status). On the overview the search still includes the Reports box.
- **Important errors:** the message column has a fixed width (two lines, the rest in the detail window) – no more
  scrolling sideways.
- Report files in the output folder are now limited to the last 20 (they used to pile up with every scan).
- Code clean-up: removed unused functions, texts and the leftover option *mask secrets*.
- **Key figures at the top** on tablets: 2 rows of 4 instead of 7 + 1 (phone 2 columns, desktop one row).
- **Affected objects:** IDs are clickable (entity → HA detail dialog, device/area → HA page) and have a copy button;
  links from findings to entities no longer use an entities-page search parameter that Home Assistant ignores.
- **“Open in Home Assistant”** and similar buttons are real links – right-click/Ctrl-click opens a new tab.
- **Selection “Select all matches”** shows the real number of matches for the active filter (before, the button was
  capped at 200 and showed the same number for *All* and *Orphaned*); above 200 it says “Select first 200 of N”.
- **Clean up database:** new preview of what will be deleted (rows per data type, most affected entities, approx. space).
- **Care center:** turned-off automations no longer count as “items to clean up” – that is the user's decision.
- Buttons in the primary colour use the darker shade of Home Assistant's colour scale (`--ha-color-primary-40`,
  fallback: primary colour).

### Notes
- Restart Home Assistant after updating.
- Expected log entry when replacing an entity: *“Cannot migrate history for entity_id … because the new entity_id
  is already in use”*.
- The maintenance need weighting and the error diagnosis are rules of thumb from HA Percyta, not official Home
  Assistant values.
