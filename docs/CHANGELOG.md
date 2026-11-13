# Changelog

All notable changes to **HA Percyta**. German version: [CHANGELOG_de.md](CHANGELOG_de.md).
Older versions: see the [GitHub releases](https://github.com/jayjojayson/HA_Percyta/releases).

## v1.2.6

### ✨ New
- **Acknowledge log errors like findings:** errors in **❗ Important errors** can now be acknowledged – with **✓** in the row, in the detail window or with *Acknowledge all*. An acknowledged error is hidden and no longer counts (care center tile, care score, report) **until it occurs again**: as soon as Home Assistant logs it again, it is open again. *Show acknowledged* lists them, **↺** reopens one. Only HA Percyta's own list – the Home Assistant log is not changed. (Idea from the community forum – thanks!)
- **Freed space at a glance:** in the windows that delete data (*Delete data from the database*, *Remove orphaned entities* with data, *Clean up*), the estimated space that is freed is now shown in **green** in the summary below the list.
- **Right-click menu for integrations and apps:** on the overview, a right-click on any row in **Installed integrations** or **Apps** opens the small link menu – open the integration or app, open it in a new tab or copy the link, plus its devices and entities or the app log (like the other link targets in the panel). Shift + right-click still shows the browser menu.

### 🐞 Fixes
- **Care center: orphaned entities respect labels too:** in v1.2.5 only the window *Unavailable entities* was fixed – the tile *Orphaned entities* still counted and pre-selected every orphaned entity, also those with an excluded label (e.g. media players or appliance entities that are only provided while the device is running). The tile, its window and the care score now leave out entities with an excluded label (on the entity, its device or its area) and integrations whose finding *Orphaned entities* is *Allowed*, *Snoozed* or *Hidden*. The *Orphaned entities* finding in the reports already respected labels.

### ⚠️ Notes
- **Restart Home Assistant after updating** and reload the browser window.
- The tool *Remove orphaned entities* in the database tools still offers all orphaned entities when you search for them – it is a tool for deliberate clean-ups; only the pre-selection from the care center respects your labels.

## v1.2.5

Fixes from user feedback (GitHub issues #3 and #4, community forum): fewer false and contradictory findings.

### 🐞 Fixes
- **Care center respects labels everywhere:** the window behind the tile *Unavailable entities* (*Review …*) used to list every unavailable entity – also those with an excluded label (e.g. a printer that switches itself off). It now lists the same entities the tile counts; entities with an excluded label or whose finding is *Allowed*, *Snoozed* or *Hidden* are left out (a line shows how many). Entities pre-selected from a finding are always included. (#3)
- **`this.entity_id` in dashboards is no longer reported:** placeholders such as `this.entity_id` (used by the auto-entities card) were reported as missing entities. Placeholders (`this.…`, `trigger.…`, `repeat.…` …) are now skipped in dashboards and automations. (#4)
- **`enabled: false` is respected:** triggers, conditions and actions switched off with `enabled: false` are no longer checked for references (missing entities, devices, areas, actions, trigger IDs) and no longer count for the safety check.
- **No more contradictory automation findings:** an automation could show *Error while running* and *Not triggered for 90+ days* at the same time – e.g. when the error happens before Home Assistant sets *last triggered* (in `variables` or a template). If the traces show failed runs within the 90 days, *Not triggered* is no longer shown.
- **Old errors after a change:** Home Assistant keeps the last runs (traces) until new runs replace them. If the automation was changed since the failed run (e.g. a part switched off with `enabled: false`), *Error while running* is now only **low** and says so – the next run shows whether the error is gone.
- **Unavailable entities shown right away:** the window *Unavailable entities* (care center tile and overview box) now opens with the list already visible – no need to click into the search field first. Nothing is pre-selected; you tick what you want to disable or remove.

### 🔐 Secrets are no longer a finding
- The finding *Stored credentials* (notice) has been removed. Integrations need their credentials and Home Assistant stores them itself in its configuration – there is nothing to fix, so dozens of entries only caused noise. The **API keys, tokens & secrets** box of the overview still shows which integrations store which fields.
- After the update the old finding disappears silently; it does not show up under *Recently resolved*.

### ⚠️ Notes
- **Restart Home Assistant after updating** and reload the browser window.
- The change detection compares the configuration stored with the run with the current one. For automations from blueprints, a change in the blueprint itself is not detected.

## v1.2.4

Follow-up to 1.2.3 with wishes from daily use: clearer timing on finding pages, a real result for *Test now*, a visible scan progress, a search in the findings and a livelier panel.

### 🕒 Last observed
- The *At a glance* box of a finding now shows **“Last observed”** instead of “First observed”: for automation runs (e.g. *Error while running*) the time of the last failed run, otherwise the last scan that still found it.
- The **History** tab starts with two boxes **“First observed”** (highlighted) and **“Last observed”**. The findings list keeps the *Since* column.

### ▶ Test now with a result
- *Test now* used to only trigger the automation and then showed a greyed-out “✔” – whether the run worked was not visible. Now HA Percyta waits for the new run (max. 30 s, recognised by its context, so other runs at the same time do not count) and shows a result card below the header: **passed** (with duration), **failed** (error message and step), **skipped** (already running), **ended early**, **still running** or **no run detected** (with a hint if the automation is turned off) – plus *Open trace*.
- After a passed test the finding is checked again by a new scan.
- The button shows *⏳ Testing …* while waiting and *▶ Test again* afterwards.

### 📊 Scan progress in the header
- While a scan runs, a pill next to *Rescan* shows a **progress ring with percentage**, the **current step** (e.g. *Database*) and the **approximate time left**; the *Rescan* button fills up as well.
- The estimate uses the duration of each step in the previous scan; for the first scan after a restart the pill shows *step x of y*. The percentage never goes backwards; a slow step shows *almost done* instead of a wrong time.
- At the end it shows *Scan finished in …*. A scan started elsewhere (automatic scan, button entity) ends with **“Show new results”** – one click loads the new results.
- Small screens: the header hides the timestamp, version and downloads so *Rescan* stays visible.

### 🔎 Search in the findings
- New search field in the **Reports** box, next to the bulk actions (*Select all* / *Clear selection* now sit below it; *Select page* is called **Select all** – it selects every finding currently in the list). It searches the finding title, the affected object (name and ID), the **affected objects** of every finding (entity IDs, names, location in the configuration) and the technical data. Several words must all match.
- Example: search for an entity ID and see every automation, script, dashboard or integration finding that refers to it.
- If the match is only in the affected objects, the row shows **“🔎 Match in affected objects: …”**; a click opens the finding directly on the *Affected objects* tab with the matching rows highlighted.
- Shows *x of y findings match*; *×* or *Esc* clears the search. Works together with the category, status, severity, area and label filters.

### 👉 Straight to the fix
- The diagnosis of every finding now ends with **“Straight to the fix”**: buttons to the matching place in Home Assistant – e.g. *Open trace* for automation errors, *Open entity* / *Open device* / *Open integration* for the affected objects, *Edit automation*. Duplicate targets are merged; with more than four there is *All n affected objects ›*.

### 🔗 Link menu – stay in the panel or leave
- Every click on a target in Home Assistant (buttons, IDs, entity/device counts, tiles, backup line) opens a small menu first: **open here** (leaves the panel), **open in new tab**, copy link. For entities additionally **Open entity** (dialog, you stay in the panel), history and logbook.
- The menu offers **more targets** that fit the click, each with its own *new tab* button: e.g. entity count of an integration → device list, the integration itself and – if the integration has only one device or entity – exactly that one; automation → trace and vice versa; app → app log.
- **Right-click** on such a target opens the same menu (Shift + right-click shows the browser menu).

### 🧭 Header & navigation
- The **header stays visible** while scrolling (the panel is now its own scroll area), so scan and database progress are always in view.
- Two new icon buttons next to the menu switch quickly between **Overview** and **Care center**; the current page is highlighted.

### ✔ Recently resolved
- The count is shown in **green**, the list is split into **pages of 10** and can be cleared with **“Clear history”** (only HA Percyta's list; open findings stay unchanged).

### ✨ A livelier panel
- On opening, the key figures, the overview boxes and the care center tiles fade in one after the other, the bars (risk distribution, storage, certainty) grow and the numbers count up; the maintenance ring fills up.
- After a scan, numbers that **changed** count from the old to the new value and pulse briefly – you see at a glance what changed. The same applies to the category tiles when you switch between *Open / Allowed / …*.
- Database jobs in the header now show the same progress ring as the scan.
- Pages and boxes fade in quickly: the large main boxes come first, closely staggered and are all there after about 0.5 s; the small tiles follow right behind. Bars and counting run calmly (1–2 s) so the effect is visible.
- Animations only run when a page is opened or a value changes, not on every refresh. With *reduce motion* enabled in the operating system they are switched off.

### 📖 Documentation
- New README section **“How backups are managed”**: where Percyta database copies are stored, that only the last 2 are kept (older ones are removed automatically, never by age), how to replace or delete copies by hand and that Home Assistant backups created via HA Percyta are never deleted by HA Percyta.
- The subtitle is now **“Permissions, Privacy & Data Center”** (was *… Data Scanner*): HA Percyta no longer only scans, it also lets you edit and clean up. The device model shown in Home Assistant changes accordingly.

### 🐞 Fixes
- **Storage tables aligned:** *System storage by category* and *Largest storage consumers* now use the same column split, so *Used* and *Size* sit exactly below each other.
- **Reports:** the info box *What do Open, Allowed …* and the box *Intended exceptions with labels* are indented a bit (the triangles stand out); the label box is highlighted because you control it actively.
- **IDs in one line:** long entity IDs in *Affected objects* were broken into single characters in narrow tables; they now stay on one line (the table scrolls sideways if needed).
- **Turn on / turn off follows the state:** for a turned-off automation the finding page showed *Turn off*. The button now follows the current state from Home Assistant (*▶ Turn on* / *⏸ Turn off*), switches after a click and the header shows a *⏸ Turned off* chip.

### ⚠️ Notes
- **Restart Home Assistant after updating** – progress display, test and *Clear history* need the new code. With the old code still running, the panel simply shows no progress.
- The time left is an estimate by HA Percyta, not a value from Home Assistant.

## v1.2.3

Follow-up to 1.2.2, mostly from community feedback: intended states via Home Assistant labels, a new
category of configuration checks, a safer way to clean up leftovers, more detailed job logs and a clearer
care center.

### 🏷️ Intended states & large installations
- **Only Home Assistant's own mechanisms:** new option **“Labels whose objects are not rated”** – choose HA labels
  (e.g. *Seasonal*); entities, devices, areas, automations and scripts with such a label create no findings. The
  Reports box shows how many objects were not rated. Disabled entries were already excluded.
- **Safety automations** (water, smoke, gas, CO, safety, problem, tamper, heat/cold sensors, alarm panels as trigger)
  are no longer reported as *not triggered for 90+ days*.
- **Calmer rating:** unavailable entities are always *low*; `setup_retry` (HA keeps retrying, device usually offline)
  is *medium* instead of *high*.
- **Area and label filters** in the Reports box (with the number of findings; the label filter lists all HA labels);
  *Area* column for affected objects.
- New box **“🏷️ Intended exceptions with labels – how it works”** in Reports: explanation in 4 steps and the label
  choice right there (**Save & rescan**, same as the option).
- **Shorter detail:** observation and *What to do* first, cause and impact under *Why & impact*; new note
  **“Intended?”** with the HA way to mark intended states.
- **Buttons say what they open** (*Open entity*, *Edit automation*, *Open trace*, *Open integration*, *Open device
  list* …, hover shows the target). Groups with one object open that object; links to the whole entity list
  were removed. The care center counts unavailable entities from the findings (labels and *Allowed* respected).

### 🧩 Configuration checks (new category)
- **Dashboards:** cards pointing to entities or areas that no longer exist (per dashboard, with view › card).
- **Dashboard resources:** listed more than once (e.g. old `?v=` version) or local file missing.
- **Energy dashboard:** sensors that no longer exist.
- **Areas:** missing temperature/humidity sensor, **empty areas** and **empty floors**; **unused labels** and
  **unused blueprints** – with **🗑️ Delete …** right at the finding (like “Delete” in HA, checked again before, HA
  backup pre-selected).
- **Automations:** condition *Triggered by* with a trigger ID none of the triggers has.
- Care center tile **Configuration & dashboards** – not part of the maintenance need.
- **Topic at a glance:** every row in the findings table shows a coloured topic chip (e.g. *🖼️ Dashboard*,
  *📘 Blueprints*, *🤖 Automation*, *🏠 Areas*) in the colour of its category.
- Idea credit: inspired by the community project [Spook](https://github.com/frenck/spook); implemented independently.

### 🧹 Clean up leftovers & shrink
- **Clean up & shrink the database: new choice “Clean up leftovers & shrink”** (default) – offers **only entities
  removed in HA Percyta** (single or with their device; earlier removals are taken from the log). You choose the
  entities and the data types; **long-term statistics are unticked by default**. The server refuses any other ID.
  Then the file is shrunk; nothing is deleted by age. After deleting data, the job window offers **“🧹 Clean up &
  shrink now …”** and the *Why?* hint opens this mode.
- **Shrinking shows its status:** file size and unused space before, every chosen entity with its rows, then every
  30 s the elapsed time and the step (copy / transfer via WAL) – no invented percentage – and at the end the size
  before/after and the space freed.

### 🖥️ Job log, database size & history
- **More detailed log when deleting:** each entity with its rows per data type and approx. space, an estimate before
  and the **result** after (rows deleted, approx. space freed). Clean-up shows the rows per type and – with shrink – the
  file size before/after. Removing entities/devices lists every removed object.
- **Errors in the log:** a failed action opens the log by itself and shows the error in red with the **original
  message**, affected objects and what to do.
- **“Why?”** in the care center explains that deleted data only shrinks the file after **“🧹 Clean up & shrink the
  database”** or HA's automatic repack on the second Sunday of the month (button to clean up right there).
- **Recent actions:** 10 per page, **“Clear history”** and **“Delete automatically”** after 7–180 days (the security
  log for secrets is kept).

### 🐞 Fixes
- **Confirmation in dialogs moved to the bottom left**, next to *Close* / *Run* – tick it and run without scrolling. Now in
  every dialog, also those that add the confirmation after loading (delete data, remove orphaned entities, rename,
  replace entity).
- Single selection fields (rename, replace) showed “nullnull” above the field.
- **Care center: “7 items to clean up” is now “7 open tasks”**, also shown in small grey text next to the heading
  *Clean up & check*. In that box the tasks come first; *Configuration & dashboards* and *Turned-off automations* (your
  own decision, not part of the rating) are listed last, after *Available updates*.
- **“Why?” list is clickable:** a click on an area jumps to its tile (and highlights it), the button on the right opens
  the matching window directly (e.g. *Remove …*, *Check …*). *Why?* also explains the difference between open tasks and
  maintenance-need points.
- Code review: removed unused texts (*Open in Home Assistant* label, status labels in the Markdown report); the
  Markdown report now names the new configuration findings.
- **Panel could vanish from the sidebar after saving options:** saving reloaded the integration, which removed the
  panel first. Now changing only the labels just starts a new scan (no reload). A reload for other options keeps the
  panel; it is only removed when the integration is disabled or deleted. The panel is set up first, every step is
  protected and an error is written to the Home Assistant log (*“HA Percyta: Panel konnte nicht eingerichtet
  werden”*).

### ⚠️ Notes
- **Restart Home Assistant after updating.** Otherwise the browser already uses the new panel while HA still runs
  the old code (e.g. error *not a valid option*).
- *Clean up leftovers* only offers entities removed with HA Percyta. Entities removed with 1.2.2 are taken over once
  from *Recent actions* (last 100 entries); entities removed together with a device in 1.2.2 are not included.
- Long-term statistics are unticked by default. Data that has been deleted can only be restored from a backup.

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
  outdated answers are ignored and after a job the preview is reloaded (confirmation is reset).
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
  only open findings with severity high/medium and **turned-off automations don't count** (an old error of a
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
