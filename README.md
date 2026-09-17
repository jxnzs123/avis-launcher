# Avis Launcher

Ein maßgeschneiderter PC-Game-Launcher für Windows im Steam-x-PS5-Hybrid-Design,
mit lokalem Spielstart und Cloud-Sync (Upload/Download) für Spielstände/Installationen.

## Tech Stack

- **Electron** – natives Fenster, Dateisystemzugriff, `.exe`-Start
- **React 18 + Vite** – Renderer-UI
- **Tailwind CSS** – Dark-Theme, Steam/PS5-Hybrid-Styling
- **Zustand** – State Management für die Bibliothek
- **Framer Motion** – Übergänge, Fokus-Zoom, Hero-Crossfade
- **lucide-react** – Icons
- **rclone (CLI, extern)** – Cloud-Transport-Layer (S3, WebDAV/Nextcloud, Google Drive, …)
- **archiver / extract-zip** – Kompression für Upload/Download

## Projektstruktur

```
avis-launcher/
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ build/
│  ├─ icon.png            # Quellbild fürs App-Icon
│  └─ icon.ico            # generiert, mehrere Auflösungen
├─ electron/
│  ├─ main.js              # App-Lifecycle, Fenster
│  ├─ preload.js           # contextBridge API (sicher, kein nodeIntegration)
│  ├─ ipcHandlers.js       # verdrahtet Renderer <-> Node-Logik
│  ├─ gameLauncher.js      # child_process.execFile zum Starten von .exe
│  └─ cloudService.js      # S3-Upload/Download + Fortschritt (Hetzner, IONOS, AWS S3, ...)
└─ src/
   ├─ index.html
   ├─ index.jsx
   ├─ App.jsx
   ├─ store/useLibraryStore.js
   ├─ hooks/useKeyboardNav.js       # Pfeiltasten/Enter/Esc + Gamepad-Vorbereitung
   ├─ utils/
   │  ├─ theme.js                   # Akzentfarbe (CSS-Variablen, Presets)
   │  ├─ background.js              # Hintergrund-Konfiguration (ambient/eigenes Bild/klassisch)
   │  ├─ i18n.js                    # Übersetzungen DE/EN
   │  └─ image.js                   # Bildpfad-Auflösung (lokal vs. http-URL)
   ├─ assets/bird.png                # Logo für den Splash-Screen
   ├─ components/
   │  ├─ TopBar.jsx
   │  ├─ HeroBackground.jsx
   │  ├─ SplashScreen.jsx
   │  ├─ GameGrid.jsx
   │  ├─ GameCard.jsx
   │  ├─ GameInfoPopup.jsx
   │  ├─ AddGameModal.jsx
   │  ├─ ConfirmDialog.jsx
   │  ├─ CloudBrowser.jsx
   │  ├─ DownloadManager.jsx
   │  ├─ SettingsPanel.jsx
   │  └─ ProgressBar.jsx
   └─ styles/index.css
```

## Setup

```bash
npm install
npm run dev        # startet Vite (Renderer) + Electron parallel
```

Für einen Windows-Build:

```bash
npm run build       # vite build + electron-builder (NSIS-Installer)
```

## Cloud-Anbindung konfigurieren

> **Hinweis (Bugfix):** Uploads ließen sich früher während der Zip-Phase
> nicht abbrechen und wirkten bei großen Ordnern wie "eingefroren", weil
> (a) der Abbruch-Mechanismus erst ab dem eigentlichen S3-Upload griff und
> (b) echte Zip-Kompression (Level 6) bei bereits komprimierten Spiel-Assets
> unnötig lange dauerte. Behoben: Der Zip-Schritt läuft jetzt im
> unkomprimierten Store-Modus (deutlich schneller) und ist von der ersten
> Sekunde an über den Abbrechen-Button im Downloads-Tab kündbar. Der
> Fortschritt wird zudem anhand verarbeiteter Bytes statt Dateianzahl
> berechnet, damit er bei wenigen großen Dateien nicht bei 0% hängen bleibt.
> Zusätzlich: Der Upload-Bestätigungsdialog hat jetzt eine Checkbox „Stark
> komprimieren" (Standard: aus) für den Sonderfall langsamer Verbindungen
> oder alter, unkomprimierter Spieledaten. Abgeschlossene/fehlgeschlagene
> Einträge im Downloads-Tab lassen sich per X-Button jetzt auch einfach
> ausblenden (statt sinnlos zu versuchen, sie erneut abzubrechen), und
> Fehlermeldungen werden direkt im Downloads-Tab angezeigt statt nur in der
> Konsole.

Der Launcher spricht **direkt per S3-API** (über `@aws-sdk/client-s3` +
`@aws-sdk/lib-storage`) mit deinem Cloud-Speicher – es ist **keine externe
Installation** (kein rclone, keine CLI) nötig. Funktioniert mit jedem
S3-kompatiblen Anbieter: Hetzner Object Storage, IONOS Object Storage,
AWS S3, Backblaze B2, Wasabi, ...

**So richtest du es ein:**

1. App starten, im Menü auf **„Einstellungen"** gehen.
2. Fünf Felder ausfüllen:
   - **Endpoint-URL** (z.B. `https://fsn1.your-objectstorage.com` bei Hetzner)
   - **Region** (z.B. `fsn1`)
   - **Bucket-Name**
   - **Access Key** und **Secret Key** (aus dem Provider-Dashboard)
3. Auf **„Verbindung testen"** klicken – bei Erfolg siehst du eine grüne
   Bestätigung.
4. Auf **„Speichern"** klicken. Fertig – Upload/Download funktionieren
   direkt aus der App heraus.

Die Zugangsdaten werden lokal unter `~/.avis-launcher/cloud-config.json`
gespeichert (Klartext – bei sensiblen Keys ggf. zusätzlich das Betriebssystem-
Schlüsselbund einbinden, siehe „Nächste Ausbaustufen").

## Weitere Funktionen

- **Kategorisierung**: Beim Hinzufügen/Bearbeiten eines Spiels lässt sich
  eine frei wählbare Kategorie vergeben (Feld mit Autovervollständigung
  bereits genutzter Kategorien, `AddGameModal.jsx`). Die Bibliotheksansicht
  zeigt daraus automatisch Filter-Buttons oberhalb des Grids
  (`GameGrid.jsx`, `libraryCategory` im Store) - keine feste Kategorienliste
  im Code, alles ergibt sich aus dem, was Nutzer selbst eintragen. Die
  gewählte Kategorie erscheint zusätzlich als kleines Badge oben rechts auf
  der Spielkarte sowie im Info-Popup.
- **Spiele bearbeiten**: Stift-Icon auf der Karte (bei Hover) oder Button
  im Detail-Panel öffnet dasselbe Formular wie beim Hinzufügen, vorbefüllt.
- **Spiele löschen**: Papierkorb-Icon auf der Karte oder im Detail-Panel,
  mit Sicherheitsabfrage. Entfernt das Spiel nur aus der Launcher-Bibliothek,
  nicht die Dateien auf der Festplatte.
- **Spielzeit-Tracking**: Wird automatisch erfasst, sobald ein Spiel über
  den Launcher gestartet und wieder beendet wird (`store.launchGame` /
  `store.endSession` in `useLibraryStore.js`). Anzeige unter dem Titelbild
  und im Detail-Panel.
- **Hover-/Klick-Animationen**: Spielkarten leuchten beim Überfahren an
  (animierter Glow-Rand via Framer Motion) und federn beim Klick leicht
  zurück (`whileTap`). Gilt auch für alle Buttons in Modal, Settings und
  Detail-Panel.
- **Upload-Bestätigung**: Vor jedem Cloud-Upload erscheint ein Bestätigungs-
  dialog (`ConfirmDialog.jsx`), der kurz erklärt, was passiert.
- **Live-Fortschritt überall**: Der Cloud-Fortschritt wird global im Store
  gehalten (`App.jsx` abonniert `onCloudProgress` einmal zentral), daher
  zeigt sowohl die Spielkarte selbst (Prozent + Balken) als auch der
  Downloads-Tab in Echtzeit denselben Stand.
- **Cloud-Übersicht** (neuer „Cloud"-Tab): Listet per `ListObjectsV2` alles
  im Bucket auf – auch Spiele, die lokal schon aus der Bibliothek gelöscht
  wurden. Beim Upload wird zusätzlich eine kleine `<id>.json`-Metadatendatei
  mit Name/Bildpfaden hochgeladen, damit „verwaiste" Cloud-Spiele weiterhin
  einen Namen und ihre Bilder haben. Von dort aus: „Wiederherstellen" fügt
  das Spiel wieder zur lokalen Bibliothek hinzu (Status „In Cloud"),
  „Endgültig löschen" entfernt Zip + Metadaten unwiderruflich aus dem Bucket.
- **Suchleiste** in der Bibliotheksansicht filtert die Spielkarten live nach
  Namen; die Pfeiltasten-Navigation berücksichtigt automatisch nur die
  gerade sichtbaren (gefilterten) Karten.
- **Akzentfarbe anpassbar**: In den Einstellungen unter „Akzentfarbe" stehen
  sechs Presets sowie ein freier Farbwähler zur Verfügung. Technisch werden
  dafür `--color-accent(-soft|-muted)` CSS-Variablen als RGB-Tripel
  (`"79 178 255"`) zur Laufzeit gesetzt (`src/utils/theme.js`); Tailwinds
  `accent`-Farben nutzen in `tailwind.config.js` die Funktion
  `rgb(var(--color-accent) / <alpha-value>)`, damit auch Opacity-Modifier
  wie `bg-accent/15` oder `ring-accent/70` korrekt eingefärbt werden statt
  nur eine feste Farbe zu ignorieren. Die Wahl wird im `localStorage`
  gespeichert und beim Start automatisch wieder angewendet (`initTheme()`
  in `App.jsx`) – **wirkt auch auf den Hover-Umriss der Spielkarten**.
- **Hover-Effekt auf Spielkarten**: Beim Überfahren mit der Maus hellt sich
  das Cover kurz auf (`filter: brightness(1.18)`) und ein dezenter heller
  Schimmer legt sich von oben über das Bild – zusätzlich zum bereits
  vorhandenen, akzentfarbenen Glow-Rand.
- **Info-Popup statt Spielzeit auf der Karte**: Die Spielzeit steht nicht
  mehr direkt auf der Kachel. Ein einfacher Klick (kurze Verzögerung von
  ~220ms, um ihn von einem Doppelklick zu unterscheiden) öffnet ein kleines
  Popup mit Name, Status, Spielzeit, Ordner und Start-Argumenten
  (`GameInfoPopup.jsx`). Ein Doppelklick startet weiterhin sofort das Spiel
  bzw. löst den Download aus, ohne dass das Popup dazwischenfunkt.

- **Info-Popup statt Spielzeit auf der Karte**: Die Spielzeit steht nicht
  mehr direkt auf der Kachel. Ein Doppelklick öffnet ein kleines Popup mit
  Name, Status, Spielzeit, Ordner, Start-Argumenten und einem eigenen
  Start-/Download-Button (`GameInfoPopup.jsx`). Ein einfacher Klick wählt
  die Karte nur aus (Hero-Hintergrund, Detail-Panel).
- **Start-Animation** (`SplashScreen.jsx`): Beim Öffnen der App erscheint für
  ca. 3 Sekunden eine kleine Sequenz passend zum Namen „Avis" (lat. Vogel) -
  das Vogel-Logo fliegt elegant aus dem Off ein, landet mit sanftem
  Ausschwingen und schwebt danach leicht auf und ab, während sich der
  Schriftzug „AVIS" Buchstabe für Buchstabe aufbaut, dazu ein feines
  Scanlinien-Raster im Hintergrund.
- **Konfigurierbarer Hintergrund**: In den Einstellungen unter „Hintergrund"
  wählbar zwischen „Ambient" (sanft wandernde, leuchtende Farbflächen in der
  aktuellen Akzentfarbe, siehe `AmbientBackground` in `HeroBackground.jsx`),
  einem **eigenen Bild** (Dateiauswahl wie beim Spiele-Cover) oder dem
  „Klassischen" schlichten Look von vorher. Gilt nur, solange kein Spiel
  ausgewählt ist - danach übernimmt automatisch dessen Banner. Auswahl wird
  im `localStorage` gespeichert (`src/utils/background.js`).
- **Eigenes exe-Icon**: `build/icon.ico` (generiert aus `build/icon.png`,
  6 Auflösungen von 16px bis 256px) wird sowohl für die gebaute `.exe`, den
  NSIS-Installer als auch für das laufende App-Fenster verwendet (siehe
  `"win".icon` und `"nsis"` in `package.json` sowie `icon:` in
  `electron/main.js`). Eigenes Icon-Design gewünscht? Einfach `build/icon.png`
  (mind. 256×256px, am besten 1024×1024px) ersetzen und daraus per
  `magick icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`
  (ImageMagick) eine neue `icon.ico` erzeugen.

## Eingebauter Browser-Tab

Nav-Punkt "Browser" - ein vollwertiger, in Avis eingebetteter Browser
(`BrowserPage.jsx`), technisch über Electrons `<webview>`-Element
(`webviewTag: true` in `main.js`).

- **Adressleiste mit Suche**: Erkennt automatisch, ob die Eingabe eine URL
  ist (z.B. `store.steampowered.com`) oder ein Suchbegriff - Suchbegriffe
  werden automatisch als Google-Suche geöffnet (`resolveInput()` in
  `BrowserPage.jsx`).
- **Vor/Zurück/Neu laden/Startseite**-Buttons, reagieren auf den
  tatsächlichen Navigationsverlauf der eingebetteten Seite.
- **Dark Mode für Webseiten**: Chromium erhält beim App-Start die Flags
  `enable-features=WebContentsForceDark,WebContentsForceDarkModeControl`
  und `force-dark-mode` (`app.commandLine.appendSwitch(...)` in `main.js`,
  vor `app.whenReady()`) - dieselbe inhaltsbewusste Dark-Mode-Technik, die
  auch Chrome auf Android für Webinhalte nutzt. Wirkt automatisch auf
  jede Seite im Browser-Tab, ganz ohne eigene CSS-Bastelei.
- **Bleibt beim Ansicht-Wechsel erhalten**: Der Browser-Tab wird in
  `App.jsx` dauerhaft gemountet und nur per CSS (`hidden` vs.
  `absolute inset-0`) ein-/ausgeblendet, statt bei jedem Wechsel zu
  Home/Bibliothek neu erstellt zu werden - offene Seite, Verlauf und
  Navigationszustand bleiben so erhalten, wenn du zwischendurch in einen
  anderen Tab wechselst und zurückkommst.
- Läuft in einem **eigenen Prozess** (Electrons Webview-Isolation) -
  komplett getrennt vom Rest der App, kein Sicherheitsrisiko für Avis
  selbst.

### Downloads: nativ erkannt, ganz ohne Erweiterung

Der Webview läuft in einer benannten Session-Partition
(`partition="persist:avisbrowser"`). Electrons Session-API erlaubt es,
Downloads GENAU dieser Session direkt im Hauptprozess abzufangen
(`electron/nativeDownloads.js`,
`session.fromPartition(...).on("will-download", ...)`). Landet automatisch
im Standard-Downloads-Ordner (`app.getPath("downloads")`) und erscheint
sofort im Downloads-Tab - kein Setup, keine Erweiterung, kein externer
Browser nötig.

- **Echtes Abbrechen**: Da der Download nativ in Electron läuft (nicht nur
  beobachtet wie bei einer Browser-Erweiterung), lässt er sich über den
  X-Button im Downloads-Tab **wirklich stoppen**
  (`item.cancel()` in `nativeDownloads.js`, per IPC
  `browser:cancelDownload` aus dem Renderer angestoßen) - nicht nur die
  Anzeige ausblenden.
- **Nach Abschluss** erscheinen zwei Quick-Actions direkt am Eintrag:
  - **"Ordner öffnen"**: öffnet den Explorer an der heruntergeladenen Datei.
  - **"Spiel hinzufügen"**: öffnet das Formular vorausgefüllt mit einem aus
    dem Dateinamen abgeleiteten Namensvorschlag und dem Download-Ordner als
    Spielordner-Vorschlag; alle Datei-Dialoge starten dann direkt dort
    (`dialogDefaultPath` in `AddGameModal.jsx`).

**Wichtig, ehrlich gesagt:** Avis entpackt keine Archive und installiert
keine Setup.exe-Installer automatisch - bei einem Installer musst du diesen
weiterhin selbst ausführen, bevor du im Formular auf die fertig installierte
Spiel-.exe verweist. Die Vorbefüllung spart nur die Navigation zum
richtigen Ordner, nicht den Installationsschritt selbst.

**Aktuelle Grenzen (bewusst einfach gehalten):** Nur ein Tab (kein
Mehr-Tab-Browsing), kein Lesezeichen-System, kein Verlauf über die
Session hinaus. Bei Bedarf leicht erweiterbar.

## Werbeblocker (Browser-Tab)

In den Einstellungen unter "Browser" - blockiert Anfragen an bekannte
Werbe-/Tracking-Domains (Google Ads, Doubleclick, Taboola, Outbrain,
Criteo, Amazon-Adsystem u.a., siehe Liste in `electron/adBlocker.js`) über
Electrons `webRequest.onBeforeRequest`. Standardmäßig aktiv, an-/abschaltbar
per Schalter. Wirkt NUR auf den Browser-Tab, nicht auf Discord oder den
Rest der App. Kein vollständiger Filterlisten-Abgleich wie uBlock Origin,
sondern eine kuratierte, kleinere Domain-Liste - deckt die häufigsten
Werbenetzwerke ab, garantiert aber keine 100%ige Werbefreiheit auf jeder
Seite.

## Aufgeräumte Home-Ansicht

Home und Bibliothek sehen jetzt unterschiedlich aus (`GameGrid.jsx`,
Verzweigung über `view === "home"`):

- **Home**: Zeit-abhängige Begrüßung + Spieleanzahl, darunter die
  Gaming-News, darunter eine horizontale "Zuletzt gespielt"-Reihe (aus dem
  neuen `lastPlayedAt`-Zeitstempel, wird bei jedem Spielstart gesetzt),
  darunter die komplette Bibliothek als Grid. Keine Suchleiste, kein
  Kategorie-Filter - bewusst aufgeräumt und kuratiert.
- **Bibliothek**: wie bisher - Suchleiste, Kategorie-Filter, volles Grid,
  ohne Begrüßung/News/Zuletzt-gespielt-Zeile. Der reine Verwaltungs-Blick.

## Übersichtlichere Einstellungen

Statt einer langen Scroll-Liste gibt es jetzt eine **Kategorien-Sidebar**
links (`SettingsPanel.jsx`): Allgemein, Cloud-Speicher, Discord, Browser -
jede Kategorie zeigt nur ihre eigenen Karten, kürzere Beschreibungstexte.

## Gaming-News auf der Home-Seite

Zeigt aktuelle Schlagzeilen von mehreren öffentlichen RSS-Feeds (PC Gamer,
Eurogamer, GameSpot) - kein API-Key, keine Anmeldung (`electron/gameNews.js`,
einfacher regex-basierter RSS-Parser, läuft im Hauptprozess wegen CORS).

- Nur auf der **Home**-Ansicht sichtbar, nicht in der Bibliothek
  (`NewsFeed.jsx`, eingebunden in `GameGrid.jsx` via `view === "home"`).
- **Relevanz-Erkennung**: Artikel, deren Titel den Namen eines Spiels aus
  deiner Bibliothek enthalten, werden mit "Aus deiner Bibliothek"
  hervorgehoben und nach vorne sortiert (simpler Textvergleich, keine KI).
- Klick auf einen Artikel öffnet ihn direkt im **eingebauten Browser-Tab**
  (nicht im externen Browser) - dafür kann der Browser-Tab jetzt auch von
  außen zu einer URL navigiert werden (`openInBrowserTab` im Store,
  `pendingBrowserUrl` wird von `BrowserPage.jsx` beobachtet).
- Falls alle Feeds gerade nicht erreichbar sind, wird der Bereich einfach
  ausgeblendet, statt eine Fehlermeldung auf der Home-Seite zu zeigen.

## Eingebautes Discord (voller Client)

Neuer Nav-Punkt "Discord" - lädt Discords eigenen Web-Client
(`discord.com/app`) in einem dauerhaft gemounteten `<webview>`
(`DiscordPanel.jsx`), technisch identisch zur offiziellen Desktop-App
(die selbst nur ein Electron-Wrapper um genau diese Web-Version ist).
Volle Funktionalität: Server, DMs, Chats, Sprach-/Videochat.

- **Eigene Session-Partition** (`persist:avisdiscord`), getrennt vom
  allgemeinen Browser-Tab - Login bleibt dauerhaft bestehen, auch nach
  App-Neustart.
- **Mikrofon/Kamera freigegeben** für Sprach-/Videochat
  (`setPermissionRequestHandler` in `main.js`, nur für diese Partition).
- Bleibt wie der Browser-Tab beim Wechsel zu anderen Ansichten erhalten
  (nur versteckt, nicht neu geladen).

**Wichtig, wie beide Discord-Features zusammenspielen:** Rich Presence
(oben) verbindet sich über die lokale IPC-Pipe, die NUR die offizielle
Discord-**Desktop**-App erzeugt - der eingebaute Web-Client hier erzeugt
diese Pipe nicht. Für "Spielt XY" in deinem Profil brauchst du weiterhin
die separate Discord-Desktop-App im Hintergrund (kann dabei minimiert
laufen, siehe Silent-Start-Tipps weiter oben); der eingebaute Tab hier ist
nur für den bequemen Chat-Zugriff direkt in Avis, unabhängig davon.

## Discord Rich Presence

Zeigt in Discord an, welches Spiel du gerade über Avis spielst - "Spielt
Cyberpunk 2077" statt nur "Spielt etwas". Verbindet sich direkt über
Discords eigenes lokales IPC-Protokoll (`electron/discordRpc.js`, reines
Node.js über `net`, **kein zusätzliches npm-Paket** nötig).

**Einrichtung:**
1. Kostenlose "Application" anlegen: discord.com/developers/applications
2. Die dort angezeigte "Application ID" kopieren
3. In Avis: Einstellungen → Discord → Schalter aktivieren → ID einfügen → Speichern
4. Discord-Desktop-App muss laufen, dann verbindet sich Avis automatisch

Beim Start eines Spiels wird automatisch `Spielt <Spielname>` mit
Zeitstempel gesetzt, beim Beenden zurück auf `Im Avis Launcher`.

**Plattform-Hinweis:** Aktuell auf Windows getestet (Named Pipe
`\\.\pipe\discord-ipc-0`). macOS/Linux nutzen stattdessen einen
Unix-Socket im Temp-Verzeichnis - der Code versucht das automatisch,
wurde aber nicht auf diesen Plattformen getestet.

## Browser-Datenschutz

In den Einstellungen unter "Browser":

- **Cloudflare DNS (1.1.1.1)**: immer aktiv, keine Einstellung nötig.
  Verschlüsselt DNS-Anfragen des eingebauten Browsers, damit der
  Internetanbieter nicht sieht, welche Domains aufgerufen werden
  (`dns-over-https-mode`/`-templates` Command-Line-Flags in `main.js`).
- **Eigener Proxy (optional)**: NUR für den Browser-Tab
  (`electron/browserProxy.js`, `session.setProxy(...)` auf die
  `persist:avisbrowser`-Partition beschränkt). Kein mitgeliefertes VPN -
  falls du bereits einen SOCKS5/HTTP-Proxy hast (z.B. von einem
  VPN-Anbieter mit manueller Proxy-Option), kannst du ihn hier eintragen.

**Wichtig, ehrlich gesagt:** Ein echtes VPN (verschlüsselter System-Tunnel
wie Cloudflare WARP oder Proton VPN) lässt sich nicht sinnvoll in einen
Browser-Tab einbauen - das bräuchte einen echten VPN-Client mit
Admin-Rechten und eigenem Netzwerktreiber (TUN/TAP-Adapter), was den
Rahmen dieses Projekts sprengen würde und eigene Client-Software der
jeweiligen Anbieter voraussetzt.

## Sprache (Deutsch/Englisch)

Unter Einstellungen → Sprache lässt sich zwischen Deutsch und Englisch
umschalten (`src/utils/i18n.js`). **Wichtig:** Diese erste Version deckt
die Hauptnavigation, den Store und die zentralen Settings-Überschriften ab -
nicht jeder einzelne Text in der gesamten App ist bereits übersetzt (z.B.
Formularfelder in "Spiel hinzufügen" oder Fehlermeldungen aus der Cloud-
Anbindung sind aktuell noch fest auf Deutsch). Um weitere Texte zu
übersetzen: neuen Schlüssel in beiden Sprachen in `DICTIONARY` in
`src/utils/i18n.js` ergänzen, dann im jeweiligen Component
`translate(language, "dein.schluessel")` verwenden.

## Hinweis zum Rebranding (Nebula → Archive → Avis)

Die App hieß zuerst „Nebula Launcher", dann kurzzeitig „Archive Launcher"
und heißt nun „Avis Launcher" (lat. „Vogel" - passend zum neuen Logo).
Falls du eine ältere Version genutzt hast, liegen deine gespeicherten Daten
(Bibliothek, Cloud-Zugangsdaten) noch unter `~/.nebula-launcher/` bzw.
`~/.archive-launcher/`. Die aktuelle Version legt automatisch einen
frischen Ordner `~/.avis-launcher/` an - **deine bisherigen Daten werden
nicht automatisch übernommen**. Um sie zu behalten, kopiere die Dateien
`library.json` und `cloud-config.json` manuell in den neuen Ordner
`~/.avis-launcher/`, bevor du die App das erste Mal startest.

## Tastatur-Navigation

Implementiert in `src/hooks/useKeyboardNav.js`:

- **Pfeiltasten**: Bewegung durchs Grid (Spaltenzahl aktuell fest auf 6
  gesetzt in `GameGrid.jsx` – bei Bedarf dynamisch aus der tatsächlichen
  Grid-Breite berechnen)
- **Enter**: Spiel starten (falls installiert) oder Download anstoßen
  (falls nur in der Cloud)
- **Escape**: reserviert für "Zurück"-Verhalten (z.B. Modal schließen,
  Detailansicht verlassen) – Callback ist vorbereitet
- **Maus**: Klick wählt aus, Doppelklick aktiviert (Start/Download)

`useGamepadNav` (gleiche Datei) ist ein einsatzbereiter, aber noch nicht
in `App.jsx` eingehängter Hook für die Gamepad API (D-Pad → Richtung,
Button A/Cross → Enter, Button B/Circle → Escape). Einfach mit denselben
Callbacks wie `useKeyboardNav` aufrufen, um Controller-Support
nachzurüsten.

## Persistenz

Die Bibliothek wird als einfaches JSON unter
`~/.avis-launcher/library.json` gespeichert (siehe `ipcHandlers.js`).
Für größere Bibliotheken oder Multi-Device-Sync bietet sich später
SQLite (`better-sqlite3`) an – die IPC-Schnittstelle (`library:load` /
`library:save`) bleibt dabei unverändert.

## Nächste sinnvolle Ausbaustufen

- Fortschritts-Persistenz bei Spielabbruch/Reconnect (rclone `--resync`)
- Automatische Cloud-Konflikterkennung (lokale vs. Remote-Version)
- Spiel-Metadaten-Scraper (IGDB/SteamGridDB) für Cover/Logo/Banner
- Settings-UI statt manueller JSON-Bearbeitung der Cloud-Config
- Auto-Update via `electron-updater`
