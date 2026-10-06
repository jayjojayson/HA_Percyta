<p align="center">
  <img src="logo.png" alt="HA Percyta Logo" width="200">
</p>

<h1 align="center">HA Percyta</h1>

<p align="center">Home Assistant Permissions, Privacy &amp; Data Scanner</p>

<p align="center">
  <a href="https://hacs.xyz"><img src="https://img.shields.io/badge/HACS-custom-orange.svg" alt="HACS"></a>
  <a href="https://github.com/jayjojayson/HA_Percyta/releases"><img src="https://img.shields.io/badge/version-1.2.0-blue.svg" alt="Version"></a>
  <a href="https://github.com/jayjojayson/HA_Percyta/actions/workflows/validate.yml"><img src="https://github.com/jayjojayson/HA_Percyta/actions/workflows/validate.yml/badge.svg" alt="Validate"></a>
  <a href="https://github.com/jayjojayson/HA_Percyta/releases"><img src="https://img.shields.io/github/downloads/jayjojayson/HA_Percyta/total.svg" alt="Downloads"></a>
  <a href="https://github.com/jayjojayson/HA_Percyta/blob/main/LICENSE"><img src="https://img.shields.io/github/license/jayjojayson/HA_Percyta.svg" alt="License"></a>
  <a href="README_de.md"><img src="https://img.shields.io/badge/Sprache-Deutsch-red.svg" alt="Deutsch"></a>
  <a href="../README.md"><img src="https://img.shields.io/badge/language-English-blue.svg" alt="English"></a>
</p>

**Integration für Home Assistant** – scannt **lokal** alle Integrationen, Apps,
Custom-Cards, Blueprints, Benutzer, Tokens sowie gespeicherte API-Keys/Secrets und
bewertet die System-Zugriffe (GPS, Kamera, Root/Supervisor …). Seit **v1.1.x** werden
zusätzlich **Speicherplatz, CPU- und RAM-Auslastung** erfasst.

> Läuft vollständig **innerhalb** von Home Assistant und liest alle Daten direkt über
> das interne `hass`-Objekt. **Es wird kein Token und keine URL benötigt.**
> Es werden ausschließlich Daten **gelesen** – nichts wird verändert.

## Features

- **Integrationen** – alle Config-Entries mit Zustand, Quelle, Custom-Flag, IoT-Klasse,
  Abhängigkeiten, Entitäten- und Geräte-Anzahl. Ein Klick auf die Entitäten-/Geräte-Zahl
  führt direkt zur passenden gefilterten Ansicht in Home Assistant.
- **API-Keys & Secrets** – erkennt in den Integrationsdaten hinterlegte Keys/Tokens/
  Passwörter (maskiert oder – auf Wunsch – im Klartext).
- **Apps** – über die Supervisor-API: welche Apps haben `full_access`,
  `privileged`, Host-Netzwerk, Docker-API, GPIO/USB, Supervisor-Rolle usw. – inkl.
  Laufzeit-Ressourcen (CPU/RAM je App).
- **System-Zugriff-Analyse** – braucht eine Integration/App GPS, Kamera, Netzwerk,
  Datenbank oder gar Root-/Systemrechte?
- **💾 Speicher & System** – Gesamtspeicher (belegt/frei), RAM- und Swap-Nutzung,
  CPU-Auslastung + Load Average, **Systemspeicher nach Kategorie** (System, Apps,
  Medien, Backups … via Supervisor, inkl. Summe aller Custom Cards) sowie eine Aufschlüsselung der größten
  Speicher-Verbraucher unter `/config` (Recorder-Datenbank, Backups, Custom Components,
  Medien, www …) inkl. Speicherbedarf je Custom-Integration.
- **Custom Cards** – alle Lovelace-Ressourcen (Custom-Card-URLs) inkl. Speichergröße
  (über den Dateipfad ermittelt; bei HACS-Karten die Ordnergröße).
- **Blueprints** – alle registrierten Automation-/Script-Blueprints inkl. Dateigröße.
- **Benutzer & Tokens** – Owner/Admin, Gruppen, Long-Lived-Tokens inkl. letzter Nutzung.
- **Risikobewertung** – automatische Einstufung 🟢 Low / 🟡 Medium / 🔴 High, inkl.
  ausklappbarer Erklär-Card („Warum?“), die die aktuelle Verteilung datenbasiert begründet.
  Die Einstufung lässt sich pro Integration **manuell überschreiben** (Auswahl „Anpassen“
  in der Integrationen-Tabelle, z. B. wenn ein Wetterdienst nur wegen einer Kamera-Entität
  fälschlich als High gilt).
- **Sensoren & Button** – Kennzahlen als Sensoren (inkl. CPU-, RAM- und
  Speicher-Auslastung), manueller Scan per Button.
- **Report-Panel** – umschaltbar zwischen voller Bildschirmbreite (mehrspaltiges
  Kachel-Layout) und schmaler Ansicht, sortierbare Tabellen, globale Suche über alle
  Tabellen sowie Umschalter für Einzel-/Akkordeon-Modus und „Alle ein-/ausklappen“.
  Oberfläche **mehrsprachig (DE/EN)** – folgt automatisch der HA-Sprache.
- **Neu seit letztem Scan** – neue Integrationen/Apps/Custom-Cards/Blueprints/Benutzer
  werden markiert (Badge/„NEU“). Sensor **„Neue Funde“** und Event
  `ha_percyta_new_findings` ermöglichen Automationen.
- **Auto-Scan** – optional in konfigurierbarem Intervall.
- **Markdown-Report** – optionaler Datei-Export je Scan.

## Installation

### HACS (empfohlen)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jayjojayson&repository=HA_Percyta&category=integration)

Oder `https://github.com/jayjojayson/HA_Percyta` in HACS manuell als benutzerdefiniertes Repository (Kategorie *Integration*) hinzufügen, **HA Percyta** installieren und Home Assistant neu starten.

### Manuell

1. Ordner `custom_components/ha_percyta` nach `/config/custom_components/` kopieren:
   ```bash
   cp -r custom_components/ha_percyta /config/custom_components/
   ```
2. Home Assistant **neu starten**.
3. **Einstellungen → Geräte & Dienste → + Integration hinzufügen → HA Percyta**.
4. Optionen wählen (alle mit sinnvollen Vorgaben) und speichern.

> **Hinweis:** HA Percyta benötigt keine zusätzlichen Python-Pakete. Für exakte CPU-/RAM-
> Werte wird `psutil` genutzt, falls es bereits im HA-System vorhanden ist – andernfalls
> greift ein integrierter Fallback (`/proc`, `shutil`).

## Optionen

| Option | Bedeutung | Standard |
|---|---|---|
| Apps einbeziehen | Apps via Supervisor scannen (nur bei HA OS/Supervised) | ✅ |
| API-Keys erkennen | Secrets in Integrationsdaten aufspüren | ✅ |
| Fehler aus System-Log | Wichtige Fehler (keine Warnungen) aufnehmen | ✅ |
| Speicher, CPU & RAM analysieren | System-/Speicher-Auslastung erfassen | ✅ |
| Secrets maskieren | Nur erste/letzte 4 Zeichen zeigen | ✅ |
| Report schreiben | Markdown-Report je Scan speichern | ✅ |
| Ausgabeverzeichnis | Ziel der Report-Dateien | `custom_components/ha_percyta/output` |
| Auto-Scan | Regelmäßig automatisch scannen | ❌ |
| Intervall | Sekunden zwischen Auto-Scans (min. 300) | 3600 |

Die Optionen lassen sich jederzeit über **Konfigurieren** an der Integration ändern.

## Verwendung

- **Report direkt in HA:** In der Seitenleiste erscheint der Eintrag **„HA Percyta“** –
  dort wird der Bericht in einer modernen Ansicht über die **volle Bildschirmbreite** mit
  Stat-Karten, Risiko-Verteilung und einklappbaren Abschnitten angezeigt (keine MD-Datei
  nötig). Auf großen Bildschirmen werden die Boxen **mehrspaltig** gekachelt; eine geöffnete
  Box nimmt automatisch die volle Breite ein.
  - **Ansicht-Umschalter:** *Einzeln* (mehrere Boxen offen), *Akkordeon* (Öffnen schließt
    die vorherige Box), *Breit/Schmal* (volle Breite ↔ zentrierte schmale Ansicht) und
    *Alle ein-/ausklappen*. Die Auswahl wird gemerkt.
  - **Globale Suche:** Das Suchfeld filtert über alle Tabellen; Boxen mit Treffern öffnen
    sich automatisch, leere werden ausgeblendet.
  - **Sortierbare Tabellen:** Klick auf einen Spaltenkopf sortiert auf-/absteigend.
  - Buttons für *Neu scannen* und **Download als MD/HTML** sowie ein Button rechts im
    Header zum Ein-/Ausblenden der HA-Seitenleiste sind eingebaut.
  - **Automatischer Scan beim Öffnen:** Beim Aufruf des Panels über die Seitenleiste wird
    automatisch ein frischer Scan ausgeführt; danach greift man bei Bedarf manuell über
    *Neu scannen* ein.
- **💾 Speicher & System:** eigener Abschnitt mit Karten für Speicher-Belegung, freien
  Speicher, RAM und CPU, dem Systemspeicher nach Kategorie sowie der Aufschlüsselung der
  größten Verbraucher.
- **Cloud-Datenfluss:** eigener Abschnitt, welche Integrationen Daten an externe/Cloud-Dienste
  senden.
- **Token-Hygiene:** Long-Lived-Tokens, die nie oder lange (> 90 Tage) nicht genutzt wurden,
  werden markiert (Kandidaten zum Widerrufen) – inkl. Sensor *„Ungenutzte Tokens“*.
- **Scan-Intervall am Gerät:** Auf der Geräteseite gibt es das Auswahlfeld
  **„HA Percyta Scan-Intervall“** mit *Manuell / Stündlich / Täglich / Wöchentlich / Monatlich*.
  Die Sensoren **„Letzter Scan“** und **„Nächster Scan“** zeigen transparent, wann der
  nächste automatische Lauf ansteht.
- **Button „HA Percyta Scan starten“** löst einen Scan sofort aus.
- **Sensoren:** Sicherheitsfunde, Integrationen, Apps, API-Keys & Secrets,
  CPU-Auslastung, RAM-Auslastung, Speicher-Belegung und freier Speicher
  (mit Detail-Attributen wie High-Risk-Domains, Root-Apps oder Gesamt-/Frei-GiB).
- **Services:**
  | Service | Beschreibung |
  |---|---|
  | `ha_percyta.scan` | Scan ausführen, liefert Kennzahlen + Report-Pfad als Response |
  | `ha_percyta.export` | Aktuellen Report als Markdown-Text (Response) zurückgeben |

### Secrets im Klartext auslesen

Deaktiviere **„Secrets maskieren“** in den Optionen und rufe anschließend `ha_percyta.scan`
bzw. `ha_percyta.export` in den **Entwicklerwerkzeugen → Aktionen** auf – die Response
enthält den vollständigen Report. Aus Datenschutzgründen werden Klartext-Secrets **nicht**
in Entity-Attributen abgelegt (die würde der Recorder speichern), sondern nur im Report.

## Risikoklassifizierung

| Stufe | Bedeutung |
|---|---|
| 🟢 Low | Keine externen Zugriffe, keine sensiblen Daten |
| 🟡 Medium | Externer/Cloud-Zugriff, gespeicherte Secrets oder Systembezug |
| 🔴 High | GPS, Kamera oder Root-/System-/Supervisor-Zugriff |

## Hinweis

HA Percyta **liest** ausschließlich – es verändert nichts an deiner Installation.
Reports werden lokal im gewählten Ausgabeverzeichnis gespeichert.

