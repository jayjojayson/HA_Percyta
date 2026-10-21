# Changelog

Alle wichtigen Änderungen an **HA Percyta**. English version: [CHANGELOG.md](CHANGELOG.md).
Ältere Versionen: siehe [GitHub-Releases](https://github.com/jayjojayson/HA_Percyta/releases).

## v1.2.2

HA Percyta wird zum **Wartungs-Werkzeug**: Neben dem Scan kannst du dein komplettes Home-Assistant-System jetzt aus
einem Panel heraus prüfen, aufräumen und pflegen. Scans bleiben rein lesend – geändert wird nur über Aktions-Buttons,
die du selbst startest, mit Erklärung, Vorschau, Bestätigung und (wo nötig) vorheriger Sicherung.

### 🧽 Pflege-Center
- Ruhigeres Aussehen: Der farbige Strich der Kacheln sitzt jetzt am unteren Rand; die Kopfkarte mit dem Ring hat keinen
  Strich mehr (Ring und Schrift zeigen den Zustand).
- **Zurück-Taste der Maus/des Browsers** funktioniert in HA Percyta: vom Befund zurück ins Pflege-Center, von dort zur
  Übersicht (wie der Button *Zurück* und Esc).
- Neue **Pflege-Center-Vorschau** oben im Bericht (neben *Risiko & Datenschutz*) und eine eigene **Pflege-Center-Seite**.
- **Pflegebedarf 0–100 %** statt „% sauber“: 0 % = alles in Ordnung (grüner Ring), die Farbe passt sich dem Wert an
  (bis 10 % grün, bis 35 % gelb, bis 60 % orange, darüber rot). Jeder Bereich wird im Verhältnis zur Größe der
  Installation bewertet (Entitäten, Integrationen, Automationen/Skripte, Geräte, Datenbankzeilen, Tokens) und hat ein
  festes Höchstgewicht. **„Warum?“** zeigt jeden Bereich mit aktuellem Wert, Balken und Punkten (Vorschau und Seite).
- Kacheln mit Anzahl, Erklärung und Button: Datenleichen, verwaiste Entitäten, verwaiste Geräte, nicht verfügbare
  Entitäten, Integrationen mit Fehler, Automationen mit Problemen, ausgeschaltete Automationen, **Befunde (Reports)**,
  ungenutzte Tokens, offene Reparaturen, wichtige Fehler im Log, verfügbare Updates, **letztes HA-Backup (Größe, Alter in
  der Beschreibung)**, **letzte Percyta-Sicherung** (Größe und Alter der neuesten Datenbank-Kopie, Anzahl der Kopien
  und belegter Speicher), Datenbank, Konfiguration prüfen.
- Die Pflege-Center-Vorschau auf der Übersicht zeigt die **letzte Percyta-Sicherung** (das letzte HA-Backup steht
  bereits unter der Überschrift).
- Die Box **Reports** (Befunde) steht zusätzlich auf der Pflege-Center-Seite; ein dort geöffneter Befund führt mit
  „Zurück“ wieder ins Pflege-Center.
- Schnell-Links: Befunde, Datenbank, Entität ersetzen, Daten löschen, Protokoll; Liste der letzten Aktionen.
- **Reports:** Ein aufklappbarer Hinweis erklärt, was *Offen*, *Erlaubt*, *Zurückgestellt* und *Ausgeblendet* bedeuten und
  was im Hintergrund passiert (Status nur in HA Percyta gespeichert, in Home Assistant wird nichts verändert).

### 🤖 Befunde zu Automationen & Skripten
- Neue Kategorie **Automationen & Skripte**: ungültige Konfiguration (mit Fehlermeldung aus Home Assistant), Fehler
  beim Ausführen (aus den Traces), übersprungene Läufe, problematische Verweise (fehlende/deaktivierte/verwaiste/nicht
  verfügbare Entitäten, gelöschte Geräte/Bereiche, unbekannte Aktionen, Entitäten in Templates), ausgeschaltete
  Automationen, seit 90+ Tagen nicht ausgelöst (mit Grund, wenn Bedingungen blockiert haben).
- Aktionen: Einschalten, Jetzt testen (ohne Bedingungen), Ausschalten.

### ✔ Zuletzt behoben
- Jeder Eintrag ist anklickbar: Was war das Problem, betroffene Objekte wie damals mit Spalte **„Jetzt“**, technische
  Daten und eine **Verlaufs-Zeitleiste**. Offene Befunde haben ebenfalls einen Reiter **Verlauf**.

### 🗄️ Datenbank-Werkzeuge (Recorder)
- **Entität ersetzen** (Gerätetausch – die neue Entität übernimmt die alte ID, Verlauf und Langzeitstatistik laufen
  weiter), **Umbenennen**, **Daten löschen** mit drei Häkchen (Verlauf, Kurzzeit-, Langzeitstatistik) und *nur älter
  als 7/30/90/365 Tage*, **Aufräumen** der ganzen Datenbank (+ Verkleinern), **verwaiste Entitäten**, **Datenleichen**,
  **Sicherungen** (SQLite-Kopie, geprüft mit `quick_check`, oder HA-Backup) und ein **Protokoll** aller Aktionen.
- Durchsuchbare Auswahl mit Schnellfiltern, Domain-Filter und „Alle Treffer auswählen“.
- Button **„Alle abwählen“** in jedem Fenster mit Vorauswahl.
- **Listenansicht für Auswahlen:** Der Button **☰ Liste / ▦ Kacheln** (oben rechts über der Auswahl) zeigt die
  gewählten Entitäten/Geräte als Liste mit Name, ID und Zustand, mit × je Zeile und – ab 8 Einträgen – einer Suche
  in der Auswahl. Die Wahl wird gemerkt.
- Vorschau zeigt Zeilen und den **Zeitraum je Datenart**, Einheit, aktuellen Zustand und Warnungen.
- **Vorschau repariert**: kein Flackern/keine leere Vorschau mehr – die bisherige Tabelle bleibt beim Laden stehen,
  das Fenster bleibt oben verankert, ohne Auswahl erscheint ein Hinweis, eine eingetippte, nicht bestätigte ID wird
  übernommen, veraltete Antworten werden verworfen, und nach einem Auftrag wird die Vorschau neu geladen
  (Bestätigung wird zurückgesetzt).
- **Button „Vorschau laden“ entfernt** – die Vorschau lädt bei jeder Änderung der Auswahl automatisch; der Button hat
  nur die Auswahlliste geschlossen und verwirrt. Neue Spalte **Platz (ca.)** beim Löschen von Daten, dazu die Summe
  und der Hinweis, dass die Datei erst nach dem Verkleinern kleiner wird.
- **Zu wenig Speicher**: Die Sicherungs-Auswahl zeigt Datenbankgröße, benötigten und freien Speicher; neue Option
  **„Vorhandene Percyta-Kopie ersetzen“** (die alte Kopie wird nur gelöscht, wenn der Platz danach reicht). Scheitert
  eine Sicherung am Speicher, listet das Fenster die vorhandenen Percyta-Kopien mit Löschen-Button und bietet
  *Vorhandene Kopie ersetzen* oder *HA-Backup verwenden* an – samt Hinweis, dass das Löschen von Percyta-Kopien
  Speicher freigibt. Reste abgebrochener Kopien werden entfernt; „Speicher voll“ während des Kopierens wird als
  *zu wenig Speicher* gemeldet.
- Alle Datenbank-Aktionen laufen als **Hintergrund-Auftrag** mit Phase, Fortschrittsbalken, Dauer/Restzeit und einem
  Protokoll im Terminal-Stil; das Fenster darf geschlossen werden, eine Anzeige oben zeigt den Fortschritt.

### 🛠️ Weitere Aktionen
- **Nicht verfügbare Entitäten deaktivieren oder aus Home Assistant entfernen** – Entfernen wirkt wie *„Löschen“*
  in den Entitäts-Einstellungen von HA (Entitäten-Registry, verschwindet damit auch unter dem Gerät), optional mit
  Verlauf/Statistik, HA-Backup vorausgewählt. Auch direkt am Befund über *„🗑️ Aus HA entfernen …“*.
- Entitäten deaktivieren, Integrationen neu laden, verwaiste Geräte entfernen, Zugriffstokens widerrufen (eigene
  Sitzung geschützt), Konfiguration prüfen (dieselbe Prüfung wie vor einem Neustart).

### ❗ Wichtige Fehler mit Diagnose
- Jeder Log-Fehler ist **anklickbar**: vollständige Meldung, Quelle, Logger, Anzahl, erstes/letztes Auftreten, Ende
  des Tracebacks, betroffene Integration (Home Assistant oder eigene), Einordnung (Abhängigkeit, Anmeldung,
  Erreichbarkeit, Entität, Programmfehler, Einrichtung, Datenabruf, Template, eigene Integration, unklar),
  **mögliche Ursache**, **Schritte** und Buttons (Integration öffnen, Integration neu laden, Protokolle öffnen,
  Meldung kopieren). Die Tabelle hat eine neue Spalte *Einordnung*.
- Werte wie `api_key=…`, `token=…`, `password=…` werden in Log-Texten unkenntlich gemacht.

### 🛡️ Risiko & Datenschutz / Kopfbereich
- Kompakter Kopf: Kennzahlen in einer Zeile, darunter *Risiko & Datenschutz* und die Pflege-Center-Vorschau nebeneinander.
- **Neues Box-Layout auf der Übersicht:** Die Boxen stehen als kompakte Liste in zwei Gruppen – *Sicherheit &
  Datenschutz* (Integrationen, Apps, System-Zugriffe, Cloud-Datenfluss, API-Keys & Secrets, Benutzer, Access Tokens)
  und *System & Details* (Speicher & System, Bestand & Zustand, Reports, Datenbank, Wichtige Fehler). Jede Zeile zeigt
  ein Home-Assistant-Icon, den Titel, eine Kernaussage und einen farbigen Status; ein Klick klappt den Inhalt wie
  bisher auf. Suche, Einzeln/Akkordeon und breite/schmale Ansicht funktionieren wie gewohnt; beim ersten Öffnen sind
  alle Boxen zugeklappt.
- *Risiko & Datenschutz* zählt nur noch **Sicherheits- & Datenschutz-Befunde** (Klick öffnet genau diese); offene
  Befunde allgemein und Log-Fehler gehören ins Pflege-Center.

### 🔐 Secrets gehärtet
- Werte werden auf dem Server immer maskiert; Klartext landet nie in Scan-Daten, Bericht, Sensoren oder HTML-Export.
- Option **„Klartext-Anzeige von Secrets im Panel erlauben“** ersetzt „Secrets maskieren“; Anzeigen/Kopieren nur für Admins,
  Rate-Limit, Protokoll, automatisches Verbergen nach 20 s. Keine HTML-Einfügungen im Panel (XSS-Härtung), Links nur
  auf interne Pfade oder http(s).

### 🐞 Fehlerbehebungen
- Statistik löschen mit *nur älter als …* schlug fehl (Home Assistant verlangt Start- und Endzeit) – jetzt über einen
  Recorder-Task.
- Im Auftrags-Protokoll fehlte die Abschlusszeile „Fertig“.
- Links aus dem Pflege-Center auf Unterseiten taten nichts.
- **Daten löschen bei einer laufenden Entität wurde nicht fertig:** Der Fortschritt zählte auch die neuen Werte mit,
  die die Entität weiter aufzeichnet (und die Statistik, die HA nachberechnet) – „noch übrig“ stieg wieder. Jetzt werden
  nur die Zeilen beobachtet, die es vor dem Löschen gab; der Auftrag wird wie erwartet fertig.
- Akkordeon-Modus: Links in der Pflege-Center-Vorschau (z. B. erst *Befunde*, dann *Datenbank*) schließen jetzt die zuvor
  geöffnete Box und öffnen die Ziel-Box – vorher blieb die erste Box offen und das Ziel klappte wieder zu.
- Vorschau- und Speicherplatz-Probleme (siehe oben).
- **Zahlen aktualisieren sich nach einer Aktion:** Nach Löschen, Entfernen, Deaktivieren, Neuladen oder Ein-/Ausschalten
  von Automationen wartet das Panel auf den neuen Scan und zeigt die neuen Zahlen von selbst an (oben: *„Daten werden
  aktualisiert …“*). Vorher blieben im Pflege-Center die alten Zahlen stehen, bis man *Neu scannen* geklickt hat.
  Die Datenbank-Zahlen werden sofort um die bekannten Änderungen korrigiert (gelöschte Zeilen, umbenannte IDs), damit
  gelöschte Datenleichen nicht wieder auftauchen, während die Datenbank neu gezählt wird. Auch *Neu scannen* wartet
  jetzt, wenn Home Assistant den Scan kurz verzögert startet.
- **Integrationen mit Fehler:** In Home Assistant ignorierte Entdeckungen (z. B. ein im Netzwerk gefundener Fernseher
  oder eine PlayStation) zählen nicht mehr als Integration und nicht mehr als „läuft nicht“ – sie waren nie
  eingerichtet. Deaktivierte Einträge waren schon ausgenommen. Im Fenster „Neu laden“ führen der Name und
  **Öffnen ↗** direkt zur Integration in Home Assistant.
- **Automationen mit Problemen:** Kachel und Pflegebedarf zählen jetzt dasselbe – jede Automation/jedes Skript einmal,
  nur offene Befunde mit Schweregrad hoch/mittel, und **ausgeschaltete Automationen zählen nicht** (ein alter Fehler
  einer ausgeschalteten Automation ist nur noch ein Hinweis mit Schweregrad niedrig). Vorher zählte der Pflegebedarf
  auch niedrige Befunde und ausgeschaltete Automationen mit, deshalb sank er durch Erlauben/Ausschalten nicht.
  Hinweis: Eine Automation kann mehrere Befunde haben (z. B. *Fehler beim Ausführen* und *Problematische
  Verweise*) – sie zählt erst nicht mehr, wenn alle erlaubt, zurückgestellt oder ausgeblendet sind.
- **Risiko anpassen** („Anpassen“ in der Integrationen-Tabelle) ist sofort sichtbar, inkl. der Risiko-Zähler – vorher
  wartete das Fenster auf einen kompletten Scan. Davon abhängige Befunde folgen mit einem Scan im Hintergrund.
- **Reports im Pflege-Center** sind unabhängig von der Suche auf der Übersicht (vorher blieb die Box bei aktiver Suche
  leer) und haben einen eigenen Filter (Kategorie, Status). Auf der Übersicht schließt die Suche die Reports-Box
  weiterhin ein.
- **Wichtige Fehler:** Die Spalte „Meldung“ hat eine feste Breite (zwei Zeilen, der Rest im Detailfenster) – kein
  seitliches Scrollen mehr.
- Berichtsdateien im Ausgabeordner sind jetzt auf die letzten 20 begrenzt (vorher kam bei jedem Scan eine dazu).
- Code aufgeräumt: ungenutzte Funktionen, Texte und die Altlast-Option *Secrets maskieren* entfernt.
- **Kennzahlen oben** auf dem Tablet: 2 Reihen à 4 statt 7 + 1 (Handy 2 Spalten, PC eine Reihe).
- **Betroffene Objekte:** IDs sind anklickbar (Entität → Detail-Dialog in HA, Gerät/Bereich → HA-Seite) und haben einen
  Kopier-Button; Links aus Befunden zu Entitäten nutzen nicht mehr einen Such-Parameter der Entitäten-Seite, den Home
  Assistant gar nicht auswertet.
- **„In Home Assistant öffnen“** und ähnliche Buttons sind echte Links – Rechtsklick/Strg-Klick öffnet einen neuen Tab.
- **Auswahl „Alle Treffer auswählen“** zeigt die echte Trefferzahl des gewählten Filters (vorher war der Button bei 200
  gedeckelt und zeigte bei *Alle* und *Verwaist* dieselbe Zahl); über 200 heißt er „Erste 200 von N auswählen“.
- **Datenbank aufräumen:** neue Vorschau, was gelöscht wird (Zeilen je Datenart, am meisten betroffene Entitäten, Platz ca.).
- **Pflege-Center:** Ausgeschaltete Automationen zählen nicht mehr als „Punkt zum Aufräumen“ – das entscheidet der Nutzer.
- Buttons in der Primärfarbe nutzen die dunklere Stufe der Home-Assistant-Farbskala (`--ha-color-primary-40`,
  Fallback: Primärfarbe).

### Hinweise
- Nach dem Update Home Assistant neu starten.
- Erwarteter Log-Eintrag beim Ersetzen einer Entität: *„Cannot migrate history for entity_id … because the new
  entity_id is already in use“*.
- Die Gewichtung des Pflegebedarfs und die Fehlerdiagnose sind Faustregeln von HA Percyta, keine offiziellen
  Home-Assistant-Werte.
