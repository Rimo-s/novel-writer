# Novel Writer

**Ein ruhiger Schreibarbeitsplatz für Romane und Geschichten — mit Kapiteln, Autosave und optionaler KI-Hilfe.**

Novel Writer richtet sich an Menschen, die längere Geschichten im Browser schreiben und organisieren möchten. Eigene Schreibprojekte, ein Rich-Text-Editor und eine bewusst auslösbare KI-Fortsetzung bilden den Kern. Ein Manuskript lässt sich als UTF-8-Textdatei mitnehmen.

Das Projekt ist eine **Beta in Entwicklung**. Die unten beschriebenen Funktionen sind im Quellcode umgesetzt. Ein erfolgreicher lokaler Build und automatisierte Tests ersetzen keinen geprüften Betrieb mit echten Clerk-, PostgreSQL- und OpenAI-Zugängen. Eine öffentliche Live-Demo ist hier noch nicht verifiziert.

## Funktionen

| Bereich                | Aktueller Umfang                                                                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anmeldung              | Clerk-Anmeldung und Registrierung über `/sign-in` und `/sign-up`; private Seiten prüfen die Sitzung auf dem Server.                                                                                                         |
| Schreibprojekte        | Eigene Romane mit Titel und optionaler Kurzbeschreibung anlegen und im Dashboard wiederfinden.                                                                                                                              |
| Kapitel                | Ein erstes Kapitel wird mit dem Roman erstellt; weitere Kapitel lassen sich hinzufügen und öffnen.                                                                                                                          |
| Rich-Text-Editor       | TipTap mit Fett, Kursiv, Überschriften, Listen, Undo/Redo und Wortzählung.                                                                                                                                                  |
| Speicherung            | Autosave nach rund 900 ms; manuelles Speichern; Speichern vor Kapitelwechsel, Export und Rückkehr über die Projektseitenleiste.                                                                                             |
| Konfliktschutz         | Versionsprüfung beim Schreiben: Ein veralteter Tab erhält HTTP 409 und überschreibt nicht automatisch den neueren Inhalt.                                                                                                   |
| Entwurfssicherung      | Ungespeicherte Änderungen werden nach Möglichkeit kontobezogen in `localStorage` gesichert. Beim erneuten Öffnen wird eine Wiederherstellung angeboten; ältere Versionen lassen sich zur manuellen Übernahme herunterladen. |
| KI-Fortsetzung         | Optionaler OpenAI-Aufruf für das aktive, zuvor gespeicherte Kapitel. Vorschläge werden erst durch eine bewusste Aktion am Kapitelende eingefügt.                                                                            |
| Export                 | Gesamtes Manuskript als `.txt` in UTF-8; Rich-Text-Formatierung wird dabei nicht übernommen.                                                                                                                                |
| Einrichtung und Fehler | Öffentliche Startseite, Einrichtungsseite bei fehlender Konfiguration, Lade-, Fehler- und Nicht-gefunden-Ansichten.                                                                                                         |

Fremde Projekt-IDs werden serverseitig mit HTTP 404 beantwortet. Eine vom Browser übermittelte Benutzer-ID wird nicht als Eigentümeridentität verwendet. Löschen, nachträgliches Bearbeiten von Romanmetadaten, Kapitelumsortierung, gemeinsame Bearbeitung, PDF- und DOCX-Export sind noch nicht umgesetzt.

### Handy und Desktop

Die Oberfläche passt sich an schmale und große Bildschirme an. Auf dem Handy ist die Kapitelübersicht einklappbar; die Editor-Schaltflächen bieten mindestens 44 Pixel große Klickflächen. Aktive Textformatierungen und der Speicherzustand sind direkt an den Schaltflächen erkennbar.

## Tech-Stack

Die genauen aufgelösten Versionen stehen in `package-lock.json`.

| Technologie                     | Im Projekt                       | Verwendung                                                                         |
| ------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| Next.js                         | 16.4.3, App Router               | Server Components, Route Handler, Proxy und Weboberfläche                          |
| React                           | 19.2.4                           | Interaktive Komponenten                                                            |
| TypeScript                      | 5, `strict: true`                | Typisierung                                                                        |
| Tailwind CSS                    | 4                                | Globale Styles und Styling-Grundlage                                               |
| Clerk                           | 7                                | Authentifizierung                                                                  |
| Prisma / PostgreSQL             | Prisma 5.22; PostgreSQL-Anbieter | Schreibprojekte, Kapitel und KI-Nutzungszähler                                     |
| TipTap                          | 3.32                             | Rich-Text-Editor und Dokumentvalidierung                                           |
| OpenAI SDK                      | 6                                | Serverseitige Chat-Completions-Anfragen                                            |
| Node-Test-Runner / tsx / PGlite | Entwicklungsabhängigkeiten       | Unit- und Integrationstests mit Prisma und einer isolierten PostgreSQL-Testinstanz |
| ESLint / GitHub Actions         | ESLint 9                         | Statische Prüfung und CI-Konfiguration                                             |

Nicht verwendete KI- und UUID-Pakete wurden entfernt. Die direkte OpenAI-Anbindung und die ID-Erzeugung über Prisma decken den aktuellen Ablauf ab.

## Architektur

Die Hauptanwendung liegt im **Repository-Root**. `clerk-nextjs/` enthält ein älteres, separates Grundgerüst. Es wird von der Typ- und Lintprüfung der Hauptanwendung ausgeschlossen und ist nicht das Deployment-Verzeichnis dieser Anwendung.

| Pfad                                                | Verantwortung                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `app/page.tsx`, `app/layout.tsx`, `app/globals.css` | Produktstartseite, gemeinsamer Rahmen und responsive Gestaltung              |
| `app/dashboard/`                                    | Serverseitig geladene Übersicht eigener Romane                               |
| `app/novel/[id]/`                                   | Geschützte Romanansicht und Kapitelsteuerung                                 |
| `components/Editor.tsx`                             | TipTap, Speicherstatus, Entwurfssicherung und KI-Vorschau                    |
| `components/Library.tsx`, `components/Icon.tsx`     | Projektkarten, Bibliotheksansicht und gemeinsame Symbole                     |
| `components/NewNovel.tsx`                           | Formular zum Erstellen eines Romans                                          |
| `proxy.ts`, `lib/auth.ts`                           | Clerk-Sitzung und serverseitige Zugangskontrolle                             |
| `lib/novels.ts`                                     | Datenzugriffe mit Eigentümerfilter, Speicherversionen und KI-Budget          |
| `lib/document.ts`                                   | Prüfung des TipTap-Dokuments und Ableitung von Klartext                      |
| `lib/autosave.ts`                                   | Serialisierte Speicherwarteschlange mit Konfliktbehandlung                   |
| `lib/http.ts`                                       | Same-Origin-Prüfung, begrenzte JSON-Anfragen und öffentliche Fehlermeldungen |
| `lib/prisma.ts`, `prisma/`                          | Wiederverwendeter Prisma-Client, Schema und versionierte Migrationen         |
| `tests/`, `.github/workflows/ci.yml`                | Automatisierte Prüfungen                                                     |

**Datenfluss:** Private Server Components und API-Routen ermitteln die Benutzer-ID aus Clerk. Die Datenschicht beschränkt Abfragen auf deren Romane. Kapitel werden als TipTap-JSON gespeichert; Klartext wird serverseitig daraus berechnet. Updates vergleichen atomar die erwartete Kapitelversion mit der gespeicherten Version. Ändert sich der Text während einer laufenden Speicherung, wird der neueste Entwurf danach mit der zurückgegebenen Version gespeichert.

`Novel` gehört über `ownerId` zu einem Clerk-Konto; `Chapter` gehört zu einem Roman. Eine separate lokale Benutzertabelle oder ein Clerk-Webhook ist dafür nicht erforderlich. `AiUsage` begrenzt KI-Versuche je Konto und UTC-Tag. Das vorhandene Modell `Test` bleibt aus Rücksicht auf bestehende Entwicklungsdaten erhalten.

## Lokales Setup

### Voraussetzungen

- Node.js **22 oder neuer**, npm und Git. `.nvmrc` legt Node 22 fest.
- Eine erreichbare PostgreSQL-Datenbank. Die Anwendung und ihre Migrationen benötigen Zugang zu dieser Datenbank.
- Eine Clerk-Anwendung mit Publishable Key und Secret Key für die Anmeldung.
- Optional ein OpenAI-API-Projekt mit Guthaben und einer geeigneten Chat-Completions-Modell-ID.

### Installation

```bash
git clone https://github.com/Rimo-s/novel-writer.git
cd novel-writer
npm ci
cp .env.example .env
```

Unter Windows PowerShell lautet der Kopierbefehl `Copy-Item .env.example .env`. Bei einem privaten Repository ist zusätzlich GitHub-Zugriff erforderlich.

Die Werte in `.env` eintragen. **Eine neue, leere lokale Datenbank** vorbereiten und die eingecheckten Migrationen anwenden:

```bash
npm run db:deploy
npm run dev
```

[http://localhost:3000](http://localhost:3000) öffnen. `npm ci` erzeugt über `postinstall` den Prisma-Client. Die Migration wird bewusst separat ausgeführt. Für spätere Schemaänderungen in der Entwicklung kann `npm run db:migrate -- --name beschreibung` verwendet werden.

Ohne Clerk- oder Datenbankkonfiguration bleiben Startseite und `/setup` erreichbar. Private Seiten leiten zur Einrichtung weiter, API-Routen antworten mit HTTP 503. Es gibt keinen ungeschützten Ersatznutzer und keinen automatischen Zugriff auf echte Daten.

### Bestehende Datenbank

Die erste Migration bildet das frühere Modell `Test` ab, die zweite ergänzt die Schreibanwendung. Bei einer bestehenden Datenbank mit bereits angelegter Tabelle `Test` darf die erste Migration nicht blind erneut ausgeführt werden. Nach Backup und Schemaabgleich kann **nur diese Baseline** mit `npx prisma migrate resolve --applied 20261028000000_test_baseline` als bereits vorhanden markiert werden; anschließend die zweite Migration mit `npm run db:deploy` anwenden. Dies setzt voraus, dass die vorhandene Tabelle tatsächlich der Baseline entspricht. Keine Datenbank zurücksetzen, um einen Migrationskonflikt zu umgehen.

## Umgebungsvariablen

`.env.example` enthält ausschließlich Platzhalter. Echte `.env`-Dateien sind von Git ausgeschlossen. Die gemeinsame `.env` im Root wird von Next.js und der Prisma-CLI gelesen.

| Variable                            | Benötigt für   | Bedeutung                                                                                                                                              |
| ----------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                      | Schreibbereich | PostgreSQL-Verbindung einschließlich Zugangsdaten; SSL- und Pooling-Parameter nach Vorgabe des Datenbankanbieters setzen.                              |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Schreibbereich | Öffentlicher Clerk-Schlüssel; darf im Browser verfügbar sein.                                                                                          |
| `CLERK_SECRET_KEY`                  | Schreibbereich | Serverseitiger Clerk-Schlüssel.                                                                                                                        |
| `OPENAI_API_KEY`                    | Optional: KI   | Serverseitiger OpenAI-Schlüssel.                                                                                                                       |
| `OPENAI_MODEL`                      | Optional: KI   | Eine im eigenen OpenAI-Projekt verfügbare Chat-Completions-Modell-ID, die `max_completion_tokens` unterstützt. Es gibt keinen stillen Modell-Fallback. |

Beide OpenAI-Werte müssen gesetzt sein, damit die KI-Schaltfläche erscheint. Nach Änderungen an der Konfiguration den Entwicklungsserver neu starten. Clerk-Schlüssel für Entwicklung und Produktion getrennt verwalten und die endgültige Domain in Clerk konfigurieren. Die Anmelderouten und Fallback-Ziele sind in der Anwendung hinterlegt.

## KI-Verhalten und Daten

Eine KI-Anfrage sendet den Kapiteltitel und maximal die letzten **12.000 Zeichen** des gespeicherten Kapiteltexts an OpenAI. Andere Kapitel, Projekte und eine dauerhafte KI-Memory werden nicht mitgesendet. Der Vorschlag verändert das Manuskript erst nach dem Klick auf „Am Kapitelende übernehmen“; anschließend greift die normale Speicherung.

Die Anfrage ist auf 800 Completion-Tokens und einen SDK-Timeout von 25 Sekunden begrenzt; automatische SDK-Retries sind deaktiviert. Das Datenbankbudget erlaubt **10 Versuche pro Konto und UTC-Tag**, einschließlich fehlgeschlagener Anbieteraufrufe nach Reservierung. Das ist eine einfache Kostenbegrenzung, keine vollständige Abrechnungs- oder Missbrauchslösung. Kontenübergreifende Limits und Bereinigung alter Nutzungszähler sind nächste Ausbauschritte.

API-Geheimnisse werden nicht an den Browser gesendet. Nicht gespeicherte Entwürfe können im Browser verbleiben; auf gemeinsam genutzten Geräten sollten sie vor dem Abmelden gespeichert oder verworfen werden. Lokale Sicherung und Browserwarnung sind zusätzliche Hilfen, keine Garantie gegen jeden Datenverlust. Ein Versionskonflikt bleibt absichtlich blockiert: Entwurf herunterladen und die Seite neu laden, statt den Serverinhalt automatisch zu überschreiben.

## Deployment

Die Anwendung benötigt eine Node.js-Laufzeit, PostgreSQL und Clerk. Vercel ist eine mögliche Hostingoption; ein eigener Node-Server ist ebenfalls möglich. Ein statischer HTML-Export eignet sich nicht für den serverseitigen Schreibbereich.

1. **Repository-Root** als Projektverzeichnis wählen, nicht `clerk-nextjs/`.
2. Node 22 oder neuer und die Variablen aus der obigen Tabelle konfigurieren. Öffentliche Clerk-Werte müssen bereits beim Build gesetzt sein.
3. Abhängigkeiten mit `npm ci` installieren; `npm run build` erzeugt den Prisma-Client erneut und baut Next.js.
4. Gegen eine gesicherte, geprüfte Zieldatenbank `npm run db:deploy` als kontrollierten Release-Schritt ausführen. Migrationen laufen nicht automatisch im Build. Bestehende Datenbanken benötigen gegebenenfalls die beschriebene Baseline.
5. Bei eigenem Node-Hosting `npm start` ausführen; auf Vercel das Next.js-Preset verwenden. Bei Proxy-Hosting den öffentlichen Host korrekt weiterreichen, damit Same-Origin-Prüfungen zu den Browseranfragen passen.
6. Für serverlose Datenbankverbindungen Pooling und gegebenenfalls ein separates Migrationsziel gemäß Datenbankanbieter einrichten. In der aktuellen Konfiguration verwendet die Prisma-CLI ebenfalls `DATABASE_URL`.
7. Nach dem Release den Demo-Flow mit echten Dienstzugängen durchführen. Bei KI-Nutzung muss die Hosting-Laufzeit mindestens den konfigurierten API-Timeout erlauben; die KI-Route setzt `maxDuration = 30`.

Private Ansichten und der Export werden dynamisch geladen. Der Export antwortet mit `private, no-store`. „Dynamic“ beschreibt hier die Next.js-Ausführung; der konkrete Dokumentexport ist separat als TXT implementiert.

## Demo-Flow

Für diesen Ablauf werden eine migrierte Datenbank und gültige Clerk-Schlüssel benötigt. Die KI-Schritte sind optional und verursachen API-Nutzung.

1. Startseite öffnen, „Mit dem Schreiben beginnen“ wählen und anmelden bzw. registrieren.
2. Im Dashboard einen Roman mit Titel und optionaler Kurzbeschreibung anlegen.
3. Im ersten Kapitel Text verfassen, formatieren und auf „Alle Änderungen gespeichert“ warten.
4. Ein zweites Kapitel hinzufügen, schreiben und zwischen den Kapiteln wechseln. Anschließend die Seite neu laden und den gespeicherten Inhalt prüfen.
5. Optional „Fortsetzung vorschlagen“ auslösen und den Hinweis zur Textübermittlung beachten. Vorschlag übernehmen oder verwerfen.
6. „Manuskript als TXT exportieren“ wählen und beide Kapitel im heruntergeladenen Dokument prüfen.
7. Das gleiche Kapitel in zwei Tabs öffnen: erst in Tab A speichern, dann mit der alten Version in Tab B. Tab B muss einen Konflikt anzeigen und seinen Entwurf erhalten.
8. Mit einem zweiten Konto eine fremde Roman-URL aufrufen. Der Zugriff muss mit einer Nicht-gefunden-Ansicht enden; das zweite Dashboard darf nur eigene Projekte zeigen.

## Entwicklung und Prüfungen

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

| Skript               | Zweck                                                                            |
| -------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`        | Entwicklungsserver                                                               |
| `npm start`          | Vorhandenen Produktionsbuild starten                                             |
| `npm run lint`       | ESLint                                                                           |
| `npm run typecheck`  | Next.js-Routentypen erzeugen und TypeScript prüfen                               |
| `npm test`           | Unit- und Integrationstests; keine Cloud-Zugänge oder produktive Datenbank nötig |
| `npm run build`      | Prisma-Client erzeugen und Produktionsbuild erstellen                            |
| `npm run db:migrate` | Neue Migration in der Entwicklung erzeugen/anwenden                              |
| `npm run db:deploy`  | Vorhandene Migrationen anwenden                                                  |

Die Datenbanktests starten PGlite mit PostgreSQL-Protokoll auf `127.0.0.1:55432`, wenden die echten SQL-Migrationen an und verwenden den echten Prisma-Client. Sie prüfen Speicherung, Eigentümertrennung, Konflikte und das KI-Budget. Weitere Tests decken laufende Autosaves, Netzwerkfehler, Dokumentvalidierung, Anfragegrößen, Herkunftsprüfung und TXT-Inhalte ab. PGlite ist eine Testumgebung; die Prüfung ersetzt keinen Last- oder Parallelitätstest gegen das spätere PostgreSQL-Hosting.

Die CI-Konfiguration führt Installation, Lint, Typprüfung, Tests und Build ohne Dienstgeheimnisse aus. Ein Live-Clerk-Login, echte OpenAI-Antworten und das endgültige Hosting müssen zusätzlich in einer konfigurierten Umgebung geprüft werden.

## Geplante nächste Schritte

- [ ] Login, Datenbankhosting und KI mit echten Zugängen durchgängig prüfen und eine verifizierte Demo-URL dokumentieren.
- [ ] Browser-End-to-End-Tests für den vollständigen angemeldeten Schreibablauf ergänzen.
- [ ] Projektmetadaten bearbeiten sowie Kapitel umsortieren und mit Bestätigung löschen.
- [ ] Entwurfssicherung und Konfliktauflösung für mehrere Geräte ausbauen.
- [ ] PDF- oder DOCX-Export mit geprüfter Formatierung ergänzen.
- [ ] KI-Budget konfigurierbar machen, globale Kostenbegrenzung und Aufbewahrungsregeln für Nutzungszähler ergänzen.
- [ ] Anforderungen für einen öffentlichen Betrieb, darunter Datenschutz, Konto-/Datenlöschung und Backups, konkret umsetzen.
- [ ] Echte Screenshots und kurze Produktdemo für das Portfolio ergänzen.

Eine Lizenzdatei ist derzeit nicht enthalten; diese README erklärt das Repository nicht pauschal für frei lizenziert.
