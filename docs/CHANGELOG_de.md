# Changelog

Alle wichtigen Änderungen an **HA Percyta**. English version: [CHANGELOG.md](CHANGELOG.md).
Ältere Versionen: siehe [GitHub-Releases](https://github.com/jayjojayson/HA_Percyta/releases).

## v1.2.6

### ✨ Neu
- **Log-Fehler quittieren wie Befunde:** Fehler unter **❗ Wichtige Fehler** lassen sich jetzt quittieren – mit **✓** in der Zeile, im Detail-Fenster oder mit *Alle quittieren*. Ein quittierter Fehler wird ausgeblendet und zählt nicht mehr mit (Pflege-Center-Kachel, Pflegebedarf, Report), **bis er erneut auftritt**: Sobald Home Assistant ihn wieder protokolliert, ist er wieder offen. *Quittierte anzeigen* listet sie auf, **↺** öffnet einen wieder. Nur Percytas eigene Liste – das Log von Home Assistant bleibt unverändert. (Idee aus dem Community-Forum – danke!)
- **Frei werdender Speicher auf einen Blick:** In den Fenstern, die Daten löschen (*Daten aus der Datenbank löschen*, *Verwaiste Entitäten entfernen* mit Daten, *Aufräumen*), steht der geschätzte frei werdende Platz in der Zusammenfassung unter der Liste jetzt **grün**.
- **Rechtsklick-Menü für Integrationen und Apps:** In der Übersicht öffnet ein Rechtsklick auf eine Zeile unter **Installierte Integrationen** oder **Apps** das kleine Link-Menü – Integration bzw. App öffnen, in neuem Tab öffnen oder Link kopieren, dazu ihre Geräte und Entitäten bzw. das Protokoll der App (wie bei den anderen Link-Zielen im Panel). Umschalt + Rechtsklick zeigt weiterhin das Menü des Browsers.

### 🐞 Fehlerbehebungen
- **Pflege-Center: Auch verwaiste Entitäten beachten Labels:** In v1.2.5 war nur das Fenster *Nicht verfügbare Entitäten* korrigiert – die Kachel *Verwaiste Entitäten* hat weiterhin alle verwaisten Entitäten gezählt und vorausgewählt, auch die mit ausgenommenem Label (z. B. Mediaplayer oder Entitäten eines Geräts, die es nur gibt, während es läuft). Kachel, Fenster und Pflegebedarf lassen jetzt Entitäten mit ausgenommenem Label (an Entität, Gerät oder Bereich) weg und ebenso Integrationen, deren Befund *Verwaiste Entitäten* auf *Erlaubt*, *Zurückgestellt* oder *Ausgeblendet* steht. Der Befund *Verwaiste Entitäten* in den Reports hat Labels schon beachtet.

### ⚠️ Hinweise
- **Nach dem Update Home Assistant neu starten** und das Browser-Fenster neu laden.
- Das Werkzeug *Verwaiste Entitäten entfernen* in den Datenbank-Werkzeugen bietet bei der Suche weiterhin alle verwaisten Entitäten an – es ist für gezieltes Aufräumen gedacht; nur die Vorauswahl aus dem Pflege-Center beachtet eure Labels.

## v1.2.5

Korrekturen aus euren Rückmeldungen (GitHub-Issues #3 und #4, Community-Forum): weniger falsche und widersprüchliche Befunde.

### 🐞 Fehlerbehebungen
- **Pflege-Center beachtet Labels überall:** Das Fenster hinter der Kachel *Nicht verfügbare Entitäten* (*Prüfen …*) listete bisher alle nicht verfügbaren Entitäten – auch die mit einem ausgenommenen Label (z. B. ein Drucker, der sich selbst ausschaltet). Jetzt stehen dort dieselben Entitäten, die die Kachel zählt; Entitäten mit ausgenommenem Label oder deren Befund auf *Erlaubt*, *Zurückgestellt* oder *Ausgeblendet* steht, bleiben draußen (eine Zeile nennt die Anzahl). Aus einem Befund vorgewählte Entitäten sind immer dabei. (#3)
- **`this.entity_id` in Dashboards wird nicht mehr gemeldet:** Platzhalter wie `this.entity_id` (genutzt von der Karte auto-entities) wurden als fehlende Entität gemeldet. Platzhalter (`this.…`, `trigger.…`, `repeat.…` …) werden jetzt in Dashboards und Automationen übersprungen. (#4)
- **`enabled: false` wird beachtet:** Auslöser, Bedingungen und Aktionen, die mit `enabled: false` abgeschaltet sind, werden nicht mehr auf Verweise geprüft (fehlende Entitäten, Geräte, Bereiche, Aktionen, Trigger-IDs) und zählen auch nicht mehr für die Schutz-Erkennung.
- **Keine widersprüchlichen Automations-Befunde mehr:** Eine Automation konnte gleichzeitig *Fehler beim Ausführen* und *Seit über 90 Tagen nicht ausgelöst* zeigen – z. B. wenn der Fehler auftritt, bevor Home Assistant *zuletzt ausgelöst* setzt (in `variables` oder einem Template). Zeigen die Traces fehlerhafte Läufe innerhalb der 90 Tage, entfällt *nicht ausgelöst*.
- **Alte Fehler nach einer Änderung:** Home Assistant behält die letzten Läufe (Traces), bis neue sie ersetzen. Wurde die Automation seit dem fehlerhaften Lauf geändert (z. B. ein Teil mit `enabled: false` abgeschaltet), ist *Fehler beim Ausführen* jetzt nur noch **niedrig** und sagt das auch – ob der Fehler weg ist, zeigt der nächste Lauf.
- **Nicht verfügbare Entitäten sofort sichtbar:** Das Fenster *Nicht verfügbare Entitäten* (Pflege-Center-Kachel und Übersichtsbox) öffnet jetzt direkt mit der Liste – man muss nicht erst ins Suchfeld klicken. Vorausgewählt ist nichts; du hakst an, was deaktiviert oder entfernt werden soll.

### 🔐 Secrets sind kein Befund mehr
- Der Befund *Gespeicherte Zugangsdaten* (Hinweis) ist entfallen. Integrationen brauchen ihre Zugangsdaten und Home Assistant speichert sie selbst in seiner Konfiguration – zu beheben gibt es da nichts, dutzende Einträge haben nur gestört. Die Box **API-Keys, Tokens & Secrets** der Übersicht zeigt weiterhin, welche Integrationen welche Felder speichern.
- Nach dem Update verschwindet der alte Befund still; er taucht nicht unter *Zuletzt behoben* auf.

### ⚠️ Hinweise
- **Nach dem Update Home Assistant neu starten** und das Browser-Fenster neu laden.
- Die Erkennung von Änderungen vergleicht die beim Lauf gespeicherte Konfiguration mit der aktuellen. Bei Automationen aus Blueprints wird eine Änderung am Blueprint selbst nicht erkannt.

## v1.2.4

Folgeversion zu 1.2.3 mit Wünschen aus dem Alltag: klarere Zeitangaben auf der Befundseite, ein echtes Ergebnis für *Jetzt testen*, ein sichtbarer Scan-Fortschritt, eine Suche in den Befunden und ein lebendigeres Panel.

### 🕒 Zuletzt beobachtet
- Die Box *Auf einen Blick* eines Befunds zeigt jetzt **„Zuletzt beobachtet“** statt „Erstmals beobachtet“: bei Automations-Läufen (z. B. *Fehler beim Ausführen*) den Zeitpunkt des letzten fehlerhaften Laufs, sonst den letzten Scan, der den Befund noch gefunden hat.
- Der Reiter **Verlauf** beginnt mit zwei Kästen **„Erstmals beobachtet“** (hervorgehoben) und **„Zuletzt beobachtet“**. Die Befundliste behält die Spalte *Seit*.

### ▶ Jetzt testen mit Ergebnis
- *Jetzt testen* hat die Automation bisher nur ausgelöst und danach ein ausgegrautes „✔“ gezeigt – ob der Lauf geklappt hat, war nicht zu sehen. Jetzt wartet HA Percyta auf den neuen Lauf (max. 30 s, erkannt am Kontext, andere gleichzeitige Läufe zählen nicht) und zeigt unter der Kopfkarte eine Ergebnis-Karte: **erfolgreich** (mit Dauer), **fehlgeschlagen** (Meldung und Schritt), **übersprungen** (lief schon), **vorzeitig beendet**, **läuft noch** oder **kein Lauf erkannt** (mit Hinweis, wenn die Automation ausgeschaltet ist) – dazu *Ablauf öffnen*.
- Nach einem erfolgreichen Test wird der Befund mit einem neuen Scan erneut geprüft.
- Der Button zeigt beim Warten *⏳ Test läuft …* und danach *▶ Erneut testen*.

### 📊 Scan-Fortschritt in der Kopfzeile
- Während ein Scan läuft, zeigt eine Anzeige neben *Neu scannen* einen **Fortschrittsring mit Prozentwert**, den **aktuellen Schritt** (z. B. *Datenbank*) und die **ungefähre Restzeit**; der Button *Neu scannen* füllt sich mit.
- Die Schätzung beruht auf der Dauer der einzelnen Schritte beim vorigen Scan; beim ersten Scan nach einem Neustart steht dort *Schritt x von y*. Der Prozentwert läuft nie rückwärts; dauert ein Schritt länger, steht dort *gleich fertig* statt einer falschen Zeit.
- Zum Schluss steht *Scan fertig in …*. Ein Scan, der anderswo gestartet wurde (automatischer Scan, Button-Entität), endet mit **„Neuen Stand anzeigen“** – ein Klick lädt das neue Ergebnis.
- Kleine Bildschirme: Die Kopfzeile blendet Zeitstempel, Version und Downloads aus, damit *Neu scannen* sichtbar bleibt.

### 🔎 Suche in den Befunden
- Neues Suchfeld in der Box **Reports** neben den Sammel-Aktionen (*Alles auswählen* / *Auswahl leeren* stehen jetzt darunter; *Seite auswählen* heißt jetzt **Alles auswählen** – es wählt alle Befunde, die gerade in der Liste stehen). Gesucht wird im Titel, im betroffenen Objekt (Name und ID), in den **betroffenen Objekten** jedes Befunds (Entitäts-IDs, Namen, Fundstelle in der Konfiguration) und in den technischen Daten. Mehrere Wörter müssen alle vorkommen.
- Beispiel: Nach einer Entitäts-ID suchen und alle Befunde zu Automationen, Skripten, Dashboards oder Integrationen sehen, die auf sie verweisen.
- Liegt der Treffer nur in den betroffenen Objekten, zeigt die Zeile **„🔎 Treffer in betroffenen Objekten: …“**; ein Klick öffnet den Befund direkt im Reiter *Betroffene Objekte*, die passenden Zeilen sind hervorgehoben.
- Anzeige *x von y Befunden passen*; *×* oder *Esc* leert die Suche. Funktioniert zusammen mit den Filtern Kategorie, Status, Schweregrad, Bereich und Label.

### 👉 Direkt zur Lösung
- Die Diagnose jedes Befunds endet jetzt mit **„Direkt zur Lösung“**: Buttons zur passenden Stelle in Home Assistant –
  z. B. *Ablaufverfolgung öffnen* bei Automations-Fehlern, *Entität öffnen* / *Gerät öffnen* / *Integration öffnen* für
  die betroffenen Objekte, *Automation bearbeiten*. Doppelte Ziele werden zusammengefasst; bei mehr als vier gibt es
  *Alle n betroffenen Objekte ›*.

### 🔗 Link-Menü – im Panel bleiben oder wechseln
- Jeder Klick auf ein Ziel in Home Assistant (Buttons, IDs, Entitäts-/Geräte-Zahlen, Kacheln, Backup-Zeile) öffnet zuerst ein kleines Menü: **hier öffnen** (verlässt das Panel), **in neuem Tab öffnen**, Link kopieren. Bei Entitäten zusätzlich **Entität öffnen** (Dialog, du bleibst im Panel), Verlauf und Logbuch.
- Das Menü bietet passende **weitere Ziele**, jeweils mit eigenem *neuer Tab*-Button: z. B. Entitäten-Zahl einer Integration → Geräteliste, die Integration selbst und – wenn die Integration nur ein Gerät bzw. eine Entität hat –  genau dieses; Automation → Ablaufverfolgung und umgekehrt; App → Protokoll der App.
- **Rechtsklick** auf so ein Ziel öffnet dasselbe Menü (Shift + Rechtsklick zeigt das Menü des Browsers).

### 🧭 Kopfzeile & Navigation
- Die **Kopfzeile bleibt beim Scrollen stehen** (das Panel ist jetzt selbst der Scroll-Bereich) – Scan- und Datenbank-Fortschritt sind immer im Blick.
- Zwei neue Icon-Buttons neben dem Menü wechseln schnell zwischen **Übersicht** und **Pflege-Center**; die aktuelle Seite ist hervorgehoben.

### ✔ Zuletzt behoben
- Die Anzahl ist **grün**, die Liste ist in **Seiten zu 10** aufgeteilt und lässt sich mit **„Verlauf leeren“** leeren (nur die Liste in HA Percyta; offene Befunde bleiben unverändert).

### ✨ Lebendigeres Panel
- Beim Öffnen blenden Kennzahlen, Übersichts-Boxen und Pflege-Center-Kacheln nacheinander ein, die Balken (Risiko-Verteilung, Speicher, Gewissheit) wachsen, die Zahlen zählen hoch und der Pflegebedarf-Ring füllt sich.
- Nach einem Scan zählen **geänderte** Zahlen vom alten zum neuen Wert und pulsieren kurz – du siehst auf einen Blick, was sich geändert hat. Ebenso die Kategorie-Kacheln beim Wechsel zwischen *Offen / Erlaubt / …*.
- Datenbank-Aufträge in der Kopfzeile zeigen jetzt denselben Fortschrittsring wie der Scan.
- Seiten und Boxen blenden zügig ein: Die großen Hauptboxen kommen zuerst, dicht gestaffelt und sind nach etwa 0,5 s alle da; die kleinen Kacheln folgen direkt dahinter. Balken und Hochzählen laufen ruhig (1–2 s), damit man den Effekt auch sieht.
- Animationen laufen nur beim Öffnen einer Seite oder wenn sich ein Wert ändert, nicht bei jeder Aktualisierung. Ist im Betriebssystem *Bewegung reduzieren* eingeschaltet, sind sie aus.

### 📖 Dokumentation
- Neuer README-Abschnitt **„So werden Sicherungen verwaltet“**: wo die Percyta-Datenbankkopien liegen, dass nur die letzten 2 bleiben (ältere werden automatisch entfernt, nie nach Alter), wie man Kopien ersetzt oder von Hand löscht und dass über HA Percyta erstellte Home-Assistant-Backups von HA Percyta nie gelöscht werden.
- Der Untertitel lautet jetzt **„Permissions, Privacy & Data Center“** (vorher *… Data Scanner*): HA Percyta scannt nicht mehr nur, sondern lässt dich auch bearbeiten und aufräumen. Das in Home Assistant angezeigte Geräte-Modell ändert sich entsprechend.

### 🐞 Fehlerbehebungen
- **Speicher-Tabellen bündig:** *Systemspeicher nach Kategorie* und *Größte Speicher-Verbraucher* haben dieselbe Spaltenaufteilung – *Belegt* und *Größe* stehen genau untereinander.
- **Reports:** Die Infobox *Was bedeuten Offen, Erlaubt …* und die Box *Gewollte Ausnahmen mit Labels* sind etwas eingerückt (die Dreiecke kommen besser zur Geltung); die Label-Box ist hervorgehoben, weil du dort aktiv steuerst.
- **IDs in einer Zeile:** Lange Entitäts-IDs wurden unter *Betroffene Objekte* in schmalen Tabellen in einzelne Zeichen umbrochen; sie bleiben jetzt in einer Zeile (die Tabelle lässt sich bei Bedarf seitlich scrollen).
- **Ein-/Ausschalten nach Zustand:** Bei einer ausgeschalteten Automation zeigte die Befundseite *Ausschalten*. Der Button richtet sich jetzt nach dem aktuellen Zustand in Home Assistant (*▶ Einschalten* / *⏸ Ausschalten*), wechselt nach dem Klick und die Kopfkarte zeigt den Hinweis *⏸ Ausgeschaltet*.

### ⚠️ Hinweise
- **Nach dem Update Home Assistant neu starten** – Fortschrittsanzeige, Test und *Verlauf leeren* brauchen den neuen Code. Läuft noch der alte, zeigt das Panel einfach keinen Fortschritt.
- Die Restzeit ist eine Schätzung von HA Percyta, kein Wert von Home Assistant.

## v1.2.3

Gewollte Zustände über Home-Assistant-Labels, in Percyta ausblenden/nicht berücksichtigen
Neue Kategorie Konfigurations-Prüfungen, sicheres Bereinigen von Aufgeräumtem, ausführlichere Auftrags-Protokolle und ein übersichtlicheres Pflege-Center.

### 🏷️ Gewollte Zustände & große Installationen
- **Nur Home-Assistant-eigene Mechanismen:** neue Option **„Labels, deren Objekte nicht bewertet werden“** –
  HA-Labels wählen (z. B. *Saisonal*); Entitäten, Geräte, Bereiche, Automationen und Skripte mit so einem Label
  erzeugen keine Befunde. Die Reports-Box zeigt, wie viele Objekte nicht bewertet wurden. Deaktivierte Einträge
  waren schon ausgenommen.
- **Schutz-Automationen** (Wasser-, Rauch-, Gas-, CO-, Sicherheits-, Problem-, Sabotage-, Hitze-/Kälte-Sensoren,
  Alarmanlagen als Auslöser) erscheinen nicht mehr als *seit 90+ Tagen nicht ausgelöst*.
- **Ruhigere Einstufung:** nicht verfügbare Entitäten sind immer *niedrig*; `setup_retry` (HA versucht es weiter,
  Gerät meist offline) ist *mittel* statt *hoch*.
- **Filter Bereich und Label** in der Reports-Box (mit Anzahl der Befunde; der Label-Filter listet alle HA-Labels);
  Spalte *Bereich* bei den betroffenen Objekten.
- Neue Box **„🏷️ Gewollte Ausnahmen mit Labels – so geht's“** in Reports: Erklärung in 4 Schritten und die
  Label-Auswahl direkt dort (**Speichern & neu scannen**, wie die Option).
- **Kürzeres Detail:** Beobachtung und *So gehst du vor* zuerst, Ursache und Auswirkung unter *Warum & Auswirkung*;
  neuer Hinweis **„Gewollt so?“** mit dem HA-Weg, gewollte Zustände zu kennzeichnen.
- **Buttons sagen, was sie öffnen** (*Entität öffnen*, *Automation bearbeiten*, *Ablaufverfolgung öffnen*,
  *Integration öffnen*, *Geräteliste öffnen* …, beim Darüberfahren steht das Ziel). Gruppen mit einem Objekt
  öffnen dieses Objekt; Links auf die gesamte Entitätenliste entfallen. Das Pflege-Center zählt nicht verfügbare
  Entitäten aus den Befunden (Labels und *Erlaubt* werden beachtet).

### 🧩 Konfigurations-Prüfungen (neue Kategorie)
- **Dashboards:** Karten, die auf Entitäten oder Bereiche zeigen, die es nicht mehr gibt (je Dashboard, mit Ansicht › Karte).
- **Dashboard-Ressourcen:** doppelt eingetragen (z. B. alte `?v=`-Version) oder lokale Datei fehlt.
- **Energie-Dashboard:** Sensoren, die es nicht mehr gibt.
- **Bereiche:** fehlender Temperatur-/Feuchte-Sensor, **leere Bereiche** und **leere Etagen**; **ungenutzte Labels**
  und **ungenutzte Blueprints** – mit **🗑️ Löschen …** direkt am Befund (wie „Löschen“ in HA, vorher erneut geprüft,
  HA-Backup vorausgewählt).
- **Automationen:** Bedingung *Ausgelöst durch* mit einer Trigger-ID, die kein Auslöser hat.
- Pflege-Center-Kachel **Konfiguration & Dashboards** – zählt nicht zum Pflegebedarf.
- **Thema auf einen Blick:** Jede Zeile der Befund-Tabelle zeigt einen farbigen Themen-Chip (z. B. *🖼️ Dashboard*,
  *📘 Blueprints*, *🤖 Automation*, *🏠 Bereiche*) in der Farbe ihrer Kategorie.
- Idee: angeregt durch das Community-Projekt [Spook](https://github.com/frenck/spook); eigenständig umgesetzt.

### 🧹 Aufgeräumtes bereinigen & verkleinern
- **Datenbank aufräumen & verkleinern: neue Auswahl „Aufgeräumtes bereinigen & verkleinern“** (Standard) – bietet
  **nur Entitäten an, die in HA Percyta entfernt wurden** (einzeln oder mit ihrem Gerät; frühere Entfernungen werden
  aus dem Protokoll übernommen). Du wählst die Entitäten und die Datenarten; **Langzeitstatistik ist standardmäßig
  aus**. Andere IDs lehnt der Server ab. Danach wird die Datei verkleinert; nach Alter wird nichts gelöscht. Nach dem
  Löschen von Daten bietet das Auftragsfenster **„🧹 Jetzt bereinigen & verkleinern …“** an, der Hinweis unter
  *Warum?* öffnet diesen Modus.
- **Verkleinern zeigt den Stand:** vorher Dateigröße und ungenutzter Platz, jede gewählte Entität mit ihren Zeilen,
  dann alle 30 s die Dauer und den Schritt (Kopie / Übertrag über WAL) – ohne erfundenen Prozentwert – und zum Schluss
  Größe vorher/nachher und der freie Platz.

### 🖥️ Auftrags-Protokoll, Datenbankgröße & Verlauf
- **Ausführlicheres Protokoll beim Löschen:** jede Entität mit ihren Zeilen je Datenart und ca. Platz, vorher eine
  Schätzung und danach das **Ergebnis** (gelöschte Zeilen, ca. freier Platz). Aufräumen zeigt die Zeilen je Art und –
  mit Verkleinern – die Dateigröße vorher/nachher. Beim Entfernen von Entitäten/Geräten steht jedes entfernte Objekt da.
- **Fehler im Protokoll:** Eine fehlgeschlagene Aktion klappt das Protokoll von selbst auf und zeigt den Fehler rot mit
  der **Original-Meldung**, den betroffenen Objekten und was zu tun ist.
- **„Warum?“** im Pflege-Center erklärt, dass gelöschte Daten die Datei erst nach **„🧹 Datenbank aufräumen &
  verkleinern“** oder der automatischen Verkleinerung durch HA am zweiten Sonntag im Monat kleiner machen (Button zum
  Aufräumen direkt dort).
- **Letzte Aktionen:** 10 je Seite, **„Verlauf leeren“** und **„Automatisch löschen“** nach 7–180 Tagen (das
  Sicherheitsprotokoll zu Secrets bleibt).

### 🐞 Fehlerbehebungen
- **Bestätigung in den Dialogen unten links**, neben *Schließen* / *Ausführen* – ankreuzen und ausführen ohne Scrollen.
  Jetzt in allen Dialogen, auch in denen, die die Bestätigung erst nach dem Laden einfügen (Daten löschen, verwaiste
  Entitäten entfernen, Umbenennen, Entität ersetzen).
- Einzel-Auswahlfelder (Umbenennen, Ersetzen) zeigten „nullnull“ über dem Feld.
- **Pflege-Center: „7 Punkte zum Aufräumen“ heißt jetzt „7 Aufgaben offen“** – zusätzlich in kleiner grauer Schrift
  neben der Überschrift *Aufräumen & Prüfen*. In dieser Box stehen die Aufgaben zuerst; *Konfiguration & Dashboards* und
  *Ausgeschaltete Automationen* (deine Entscheidung, fließen nicht in die Bewertung ein) stehen am Ende, hinter
  *Verfügbare Updates*.
- **Liste unter „Warum?“ anklickbar:** Ein Klick auf einen Bereich springt zur passenden Kachel (und hebt sie hervor), der
  Button rechts öffnet direkt das passende Fenster (z. B. *Entfernen …*, *Prüfen …*). *Warum?* erklärt außerdem den
  Unterschied zwischen offenen Aufgaben und Punkten des Pflegebedarfs.
- Code-Durchsicht: ungenutzte Texte entfernt (Beschriftung *In Home Assistant öffnen*, Status-Texte im Markdown-Report);
  der Markdown-Report nennt jetzt auch die neuen Konfigurations-Befunde.
- **Panel konnte nach dem Speichern der Optionen aus der Seitenleiste verschwinden:** Das Speichern lud die Integration neu und
  entfernte dabei zuerst das Panel. Jetzt startet eine reine Label-Änderung nur einen neuen Scan (kein Neuladen). Beim
  Neuladen wegen anderer Optionen bleibt das Panel stehen; entfernt wird es nur, wenn die Integration deaktiviert oder
  gelöscht wird. Das Panel wird als Erstes eingerichtet, jeder Schritt ist abgesichert und ein Fehler steht im
  Home-Assistant-Protokoll („HA Percyta: Panel konnte nicht eingerichtet werden“).

### ⚠️ Hinweise
- **Nach dem Update Home Assistant neu starten.** Sonst nutzt der Browser schon das neue Panel, HA aber noch den
  alten Code (z. B. Fehler *not a valid option*).
- *Aufgeräumtes bereinigen* bietet nur Entitäten an, die mit HA Percyta entfernt wurden. Mit 1.2.2 entfernte
  Entitäten werden einmalig aus *Letzte Aktionen* übernommen (letzte 100 Einträge); Entitäten, die in 1.2.2 zusammen
  mit einem Gerät entfernt wurden, sind nicht dabei.
- Langzeitstatistik ist standardmäßig nicht angehakt. Gelöschte Daten lassen sich nur aus einer Sicherung zurückholen.

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
  übernommen, veraltete Antworten werden verworfen und nach einem Auftrag wird die Vorschau neu geladen
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
  nur offene Befunde mit Schweregrad hoch/mittel und **ausgeschaltete Automationen zählen nicht** (ein alter Fehler
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
