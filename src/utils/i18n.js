const STORAGE_KEY = "avis-language";

export const LANGUAGES = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
];

/**
 * Übersetzungswörterbuch. Deckt die Hauptnavigation, den Store und die
 * wichtigsten wiederkehrenden Buttons/Labels ab. Wird die App weiter
 * ausgebaut, einfach neue Schlüssel in beiden Sprachen ergänzen - Code an
 * anderer Stelle nutzt weiterhin t("irgendein.schluessel") und fällt auf
 * den Schlüssel selbst zurück, falls eine Übersetzung fehlt.
 */
const DICTIONARY = {
  de: {
    "nav.home": "Home",
    "nav.library": "Bibliothek",
    "nav.downloads": "Downloads",
    "nav.cloud": "Cloud",
    "nav.store": "Store",
    "nav.browser": "Browser",
    "nav.discord": "Discord",
    "nav.settings": "Einstellungen",
    "nav.addGame": "Spiel hinzufügen",

    "common.cancel": "Abbrechen",
    "common.save": "Speichern",
    "common.saved": "Gespeichert ✓",
    "common.saving": "Speichere…",
    "common.edit": "Bearbeiten",
    "common.delete": "Löschen",
    "common.add": "Hinzufügen",
    "common.close": "Schließen",
    "common.refresh": "Aktualisieren",
    "common.loading": "Lädt…",

    "store.title": "Store",
    "store.subtitle":
      "Von uns kuratierte Download-Seiten. Links führen weg aus Avis - vor jedem Öffnen kommt eine kurze Sicherheitswarnung.",
    "store.categoryAll": "Alle",
    "store.empty": "Aktuell sind keine Einträge im Store verfügbar.",
    "store.loadError": "Store-Katalog konnte nicht geladen werden.",
    "store.openSite": "Seite öffnen",
    "store.size": "Größe",
    "store.warningTitle": "Externe Seite öffnen?",
    "store.warningMessage":
      "Du verlässt Avis und öffnest eine Seite außerhalb unserer Kontrolle: {url}. Solche Seiten können unsichere Downloads, aggressive Werbung oder Phishing-Versuche enthalten. Öffne sie nur, wenn du der Quelle vertraust.",
    "store.warningConfirm": "Trotzdem öffnen",
    "store.buyOnInstantGaming": "Auf Instant Gaming kaufen",
    "store.redeemTitle": "Steam-Key einlösen",
    "store.redeemPlaceholder": "XXXXX-XXXXX-XXXXX",
    "store.redeemButton": "Key einlösen",
    "store.redeemCopied": "Key kopiert - Steam öffnet sich, dort einfach einfügen (Strg+V).",
    "store.redeemHint":
      "Öffnet Steams eigenen Aktivierungsdialog und kopiert den Key automatisch in die Zwischenablage.",
    "store.dealsTitle": "Aktuelle Steam-Angebote",
    "store.dealsSubtitle": "Über CheapShark - Kaufen geht über Instant Gaming.",
    "store.searchPlaceholder": "Spiele durchsuchen…",
    "store.searchResultsTitle": "Suchergebnisse für „{query}\"",
    "store.backToDeals": "Zurück zu den Angeboten",
    "store.searchError": "Suche konnte nicht durchgeführt werden.",
    "store.searchNoResults": "Keine Spiele gefunden.",
    "store.fromPrice": "ab {price} €",

    "update.readyMessage": "Avis {version} ist bereit - neu starten, um zu aktualisieren.",
    "update.restartNow": "Jetzt neu starten",

    "settings.title": "Einstellungen",
    "settings.language": "Sprache",
    "settings.accent": "Akzentfarbe",
    "settings.background": "Hintergrund",
    "settings.cloud": "Cloud-Anbindung",
    "settings.testConnection": "Verbindung testen",

    "common.confirm": "Bestätigen",

    "action.start": "Starten",
    "action.downloadFromCloud": "Aus Cloud herunterladen",

    "status.cloud": "In Cloud",
    "status.installed": "Installiert",
    "status.downloading": "Download läuft",
    "status.uploading": "Upload läuft",
    "status.downloadingEllipsis": "Download läuft…",
    "status.uploadingEllipsis": "Upload läuft…",
    "status.steamOwned": "Auf Steam (nicht installiert)",
    "status.steamDownloading": "Wird heruntergeladen",

    "info.status": "Status",
    "info.playtime": "Spielzeit",
    "info.category": "Kategorie",
    "info.folder": "Ordner",
    "info.launchArgs": "Start-Argumente",

    "news.title": "Gaming-News",
    "news.fromYourLibrary": "Aus deiner Bibliothek",
    "news.justNow": "gerade eben",
    "news.hoursAgo": "vor {n} Std.",
    "news.dayAgo": "vor {n} Tag",
    "news.daysAgo": "vor {n} Tagen",

    "upcoming.title": "Demnächst & aktuell",
    "upcoming.noCover": "Kein Cover hinterlegt",
    "upcoming.viewKey": "Key ansehen",
    "upcoming.alreadyReleased": "Bereits erschienen",
    "upcoming.releasesToday": "Erscheint heute",
    "upcoming.releasesTomorrow": "Erscheint morgen",
    "upcoming.releasesInDays": "in {n} Tagen",

    "cloud.title": "Cloud-Übersicht",
    "cloud.subtitle":
      "Alle Spiele, die aktuell in deinem Cloud-Bucket liegen – auch solche, die du lokal schon aus der Bibliothek entfernt hast.",
    "cloud.empty": "Noch keine Spiele in der Cloud gefunden. Sichere zuerst eines über „In Cloud sichern\".",
    "cloud.loadError": "Cloud-Inhalte konnten nicht geladen werden.",
    "cloud.onlyInCloud": "Nur in der Cloud (nicht mehr in deiner Bibliothek)",
    "cloud.restore": "Wiederherstellen",
    "cloud.allSynced": "Alle Spiele aus der Cloud sind bereits in deiner Bibliothek vorhanden.",
    "cloud.deleteTitle": "„{name}\" endgültig aus der Cloud löschen?",
    "cloud.deleteMessage":
      "Die Datei wird unwiderruflich aus deinem Cloud-Speicher entfernt. Das kann nicht rückgängig gemacht werden.",
    "cloud.deleteConfirm": "Endgültig löschen",

    "browser.back": "Zurück",
    "browser.forward": "Vor",
    "browser.reload": "Neu laden",
    "browser.home": "Avis-Startseite",
    "browser.addressPlaceholder": "Adresse eingeben oder im Web suchen…",
    "browser.searchPlaceholder": "Im Web suchen…",

    "steamOverlay.launching": "{name} wird gestartet…",
    "steamOverlay.preparing": "{name} wird vorbereitet…",
    "steamOverlay.confirmHint":
      "Falls sich ein Steam-Fenster meldet (z.B. um den Installationsort zu bestätigen), kurz dorthin wechseln und bestätigen.",

    "achievements.title": "Achievements",
    "achievements.missingConfigPre":
      "Dafür werden eine SteamID und ein persönlicher API-Key benötigt - entweder einmal über „Mit Steam anmelden\" oben rechts einloggen, oder in",
    "achievements.missingConfigPath": "Einstellungen → Spiele-Quellen",
    "achievements.missingConfigPost": "beides manuell eintragen.",
    "achievements.allComplete": "Alle Achievements freigeschaltet",

    "transfer.compressing": "Komprimiere…",
    "transfer.uploading": "Lade hoch…",
    "transfer.downloading": "Lade herunter…",
    "transfer.extracting": "Entpacke…",
    "transfer.transferring": "Übertrage…",
    "transfer.done": "Abgeschlossen",
    "transfer.error": "Fehler",

    "downloads.title": "Downloads & Uploads",
    "downloads.empty": "Aktuell laufen keine Cloud-Übertragungen.",
    "downloads.unknownGame": "Unbekanntes Spiel",
    "downloads.remove": "Entfernen",
    "downloads.cancel": "Abbrechen",
    "downloads.runningViaSteam": "Läuft über Steam",
    "downloads.progressInSteam": "Fortschritt siehe Steam",
    "downloads.openFolder": "Ordner öffnen",
    "downloads.addGame": "Spiel hinzufügen",
    "downloads.checkSafety": "Sicherheit prüfen",

    "scan.scanning": "Prüfe…",
    "scan.noKey": "Kein VirusTotal-Key hinterlegt (Einstellungen → Browser)",
    "scan.cleanTooltip":
      "Vollständigen Bericht auf virustotal.com öffnen - kein Antiviren-Hersteller hat diese Datei als schädlich eingestuft",
    "scan.clean": "Sauber ({n} Scanner)",
    "scan.reportTooltip": "Vollständigen Bericht auf virustotal.com öffnen",
    "scan.malicious": "Als schädlich erkannt ({n} Treffer)",
    "scan.suspicious": "Verdächtig ({n} Treffer)",
    "scan.unknownTooltip": "Diese Datei ist VirusTotal noch nicht bekannt - das heißt nicht automatisch, dass sie gefährlich ist",
    "scan.unknown": "Unbekannt bei VirusTotal",
    "scan.failed": "Prüfung fehlgeschlagen",

    "steam.login": "Mit Steam anmelden",
    "steam.openProfile": "Steam-Profil öffnen",
    "steam.logout": "Abmelden",

    "errors.installationFailed": "Installation fehlgeschlagen.",
    "errors.downloadCancelled": "Download abgebrochen.",
    "errors.downloadFailed": "Download fehlgeschlagen.",

    "common.choose": "Wählen",

    "addGame.addTitle": "Neues Spiel hinzufügen",
    "addGame.editTitle": "Spiel bearbeiten",
    "addGame.name": "Name",
    "addGame.namePlaceholder": "z.B. Cyberpunk 2077",
    "addGame.executable": "Executable (.exe)",
    "addGame.executablePlaceholder": "Pfad zur .exe wählen…",
    "addGame.installFolder": "Spielordner (für Cloud-Sicherung)",
    "addGame.installFolderPlaceholder": "Ordner oder Archiv wählen…",
    "addGame.cover": "Cover",
    "addGame.logo": "Logo (PNG)",
    "addGame.banner": "Banner",
    "addGame.category": "Kategorie (frei wählbar, für die Filter-Buttons)",
    "addGame.categoryPlaceholder": "z.B. Shooter, Indie, Sammlung mit Freunden…",
    "addGame.launchArgs": "Start-Argumente (optional)",
    "addGame.launchArgsPlaceholder": "z.B. -windowed",

    "home.stillAwake": "Noch wach?",
    "home.goodMorning": "Guten Morgen",
    "home.goodDay": "Guten Tag",
    "home.goodEvening": "Guten Abend",
    "home.gamesCount": "{n} Spiele in deiner Bibliothek",
    "home.gamesCountOne": "{n} Spiel in deiner Bibliothek",
    "home.recentlyPlayed": "Zuletzt gespielt",
    "home.nothingPlayedYetPre": "Noch nichts gespielt. Starte ein Spiel aus deiner",
    "home.nothingPlayedYetPost": ", dann taucht es hier auf.",

    "errors.gameStartFailed": "Spiel konnte nicht gestartet werden.",
    "errors.installStartFailed": "Installation konnte nicht gestartet werden.",

    "action.download": "Herunterladen",
    "action.saveToCloud": "In Cloud sichern",
    "status.steamDownloadingEllipsis": "Wird heruntergeladen…",

    "library.searchPlaceholder": "Spiele durchsuchen…",
    "library.allCategories": "Alle",
    "library.noResults": "Keine Spiele gefunden.",
    "library.deleteTitle": "„{name}\" löschen?",
    "library.deleteMessage":
      "Das Spiel wird nur aus deiner Launcher-Bibliothek entfernt. Die eigentlichen Spieldateien auf der Festplatte bleiben unangetastet.",
    "library.uploadTitle": "„{name}\" in die Cloud sichern?",
    "library.uploadMessage":
      "Der Spielordner wird zuerst lokal gebündelt und danach hochgeladen. Je nach Größe kann das einige Minuten dauern.",
    "library.uploadConfirm": "Hochladen",
    "library.strongCompression": "Stark komprimieren",
    "library.strongCompressionHint":
      "Spart bei den meisten modernen Spielen kaum Platz (Videos/Audio/Paks sind meist schon komprimiert), dauert dafür deutlich länger. Nur sinnvoll bei sehr langsamer Internetverbindung oder älteren, unkomprimierten Spieledaten.",
    "library.sortName": "Name (A-Z)",
    "library.sortStatus": "Installiert zuerst",
    "library.sortCategory": "Genre/Kategorie",
    "library.sortPlaytime": "Meiste Spielzeit",
    "library.sortRecent": "Zuletzt gespielt",

    "settings.sectionGeneral": "Allgemein",
    "settings.sectionSources": "Spiele-Quellen",
    "settings.sectionCloud": "Cloud-Speicher",
    "settings.sectionDiscord": "Discord",
    "settings.sectionBrowser": "Browser",

    "background.ambient": "Ambient (animiert)",
    "background.ambientDesc": "Sanft wandernde, leuchtende Farbflächen passend zur Akzentfarbe.",
    "background.custom": "Eigenes Bild",
    "background.customDesc": "Ein selbst gewähltes Bild als dezenter, abgedunkelter Hintergrund.",
    "background.classic": "Klassisch (schlicht)",
    "background.classicDesc": "Der ursprüngliche, komplett schlichte dunkle Hintergrund ohne Effekte.",

    "sources.title": "Steam-Bibliothek importieren",
    "sources.hint": "Holt deine gekauften Spiele über die offizielle Steam Web API in deine Avis-Bibliothek.",
    "sources.steamId": "SteamID (64-Bit)",
    "sources.steamIdPlaceholder": "z.B. über steamid.io ermittelbar",
    "sources.apiKey": "Eigener Web-API-Key",
    "sources.apiKeyPlaceholder": "Von steamcommunity.com/dev/apikey",
    "sources.importLibrary": "Bibliothek importieren",
    "sources.importedNew": "{added} neue Spiele importiert ({total} insgesamt in deiner Steam-Bibliothek).",
    "sources.importedNoneNew": "Import abgeschlossen - alle Spiele waren bereits in deiner Bibliothek.",

    "cloudSettings.title": "S3-Zugangsdaten",
    "cloudSettings.hint": "Für Hetzner, IONOS, AWS S3, Backblaze & Co. Kein separates Tool nötig.",
    "cloudSettings.endpoint": "Endpoint-URL",
    "cloudSettings.region": "Region",
    "cloudSettings.bucket": "Bucket-Name",
    "cloudSettings.bucketPlaceholder": "meine-spiele",
    "cloudSettings.accessKey": "Access Key",
    "cloudSettings.secretKey": "Secret Key",
    "cloudSettings.remotePath": "Ordner im Bucket",
    "cloudSettings.pathStyle": "Path-Style-URLs (bei Hetzner deaktivieren)",
    "cloudSettings.testSuccess": "Verbindung erfolgreich.",
    "cloudSettings.testFailed": "Verbindung fehlgeschlagen.",

    "discordSettings.title": "Rich Presence",
    "discordSettings.hint": "Zeigt in Discord an, welches Spiel du gerade über Avis spielst.",
    "discordSettings.appId": "Discord Application-ID",
    "discordSettings.appIdPlaceholder": "Von discord.com/developers/applications",
    "discordSettings.connected": "Mit Discord verbunden",
    "discordSettings.disconnected": "Nicht verbunden - Discord geöffnet?",

    "browserSettings.adBlockerTitle": "Werbeblocker",
    "browserSettings.adBlockerHint":
      "Blockiert bekannte Werbe-/Tracking-Domains sowie einen Teil der YouTube-Werbe-Anfragen im Browser-Tab. YouTube erschwert das Blockieren bewusst und ändert es laufend - vollständig werbefrei ist damit nicht garantiert.",
    "browserSettings.dnsTitle": "Cloudflare DNS",
    "browserSettings.dnsActive": "Aktiv - DNS-Anfragen laufen verschlüsselt über 1.1.1.1, nicht über deinen Internetanbieter.",
    "browserSettings.virusScanTitle": "Downloads auf Viren prüfen",
    "browserSettings.virusScanHint":
      "Gleicht den Hash heruntergeladener Dateien mit VirusTotal ab (eigener, kostenloser API-Key nötig). Die Datei selbst wird dabei nicht hochgeladen, nur ihr Fingerabdruck.",
    "browserSettings.virusTotalKey": "VirusTotal API-Key",
    "browserSettings.virusTotalKeyPlaceholder": "Von virustotal.com/gui/my-apikey",
    "browserSettings.virusScanNote": "Sobald ein Key hinterlegt ist, erscheint bei fertigen Browser-Downloads ein „Sicherheit prüfen\"-Button.",
    "browserSettings.proxyTitle": "Eigener Proxy (optional)",
    "browserSettings.proxyHint": "Nur für den Browser-Tab. Kein VPN - falls du bereits einen SOCKS/HTTP-Proxy hast.",
    "browserSettings.proxyType": "Typ",
    "browserSettings.proxyHost": "Host",
    "browserSettings.proxyPort": "Port",
    "browserSettings.vpnRecommendation": "Noch keinen Proxy? Ein VPN-Anbieter mit SOCKS5/HTTP-Zugang funktioniert genauso gut hier oben.",
    "browserSettings.vpnLearnMore": "Empfehlung ansehen",
  },
  en: {
    "nav.home": "Home",
    "nav.library": "Library",
    "nav.downloads": "Downloads",
    "nav.cloud": "Cloud",
    "nav.store": "Store",
    "nav.browser": "Browser",
    "nav.discord": "Discord",
    "nav.settings": "Settings",
    "nav.addGame": "Add game",

    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.saved": "Saved ✓",
    "common.saving": "Saving…",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.add": "Add",
    "common.close": "Close",
    "common.refresh": "Refresh",
    "common.loading": "Loading…",

    "store.title": "Store",
    "store.subtitle":
      "Download sites curated by us. Links lead away from Avis - a short safety warning appears before every link opens.",
    "store.categoryAll": "All",
    "store.empty": "No store entries available right now.",
    "store.loadError": "Could not load the store catalog.",
    "store.openSite": "Open site",
    "store.size": "Size",
    "store.warningTitle": "Open external site?",
    "store.warningMessage":
      "You're leaving Avis and opening a site outside our control: {url}. Such sites may contain unsafe downloads, aggressive ads, or phishing attempts. Only open it if you trust the source.",
    "store.warningConfirm": "Open anyway",
    "store.buyOnInstantGaming": "Buy on Instant Gaming",
    "store.redeemTitle": "Redeem Steam key",
    "store.redeemPlaceholder": "XXXXX-XXXXX-XXXXX",
    "store.redeemButton": "Redeem key",
    "store.redeemCopied": "Key copied - Steam will open, just paste it there (Ctrl+V).",
    "store.redeemHint":
      "Opens Steam's own activation dialog and automatically copies the key to your clipboard.",
    "store.dealsTitle": "Current Steam deals",
    "store.dealsSubtitle": "Via CheapShark - purchases go through Instant Gaming.",
    "store.searchPlaceholder": "Search for games…",
    "store.searchResultsTitle": "Search results for \"{query}\"",
    "store.backToDeals": "Back to deals",
    "store.searchError": "Search could not be completed.",
    "store.searchNoResults": "No games found.",
    "store.fromPrice": "from {price} €",

    "update.readyMessage": "Avis {version} is ready - restart to update.",
    "update.restartNow": "Restart now",

    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.accent": "Accent color",
    "settings.background": "Background",
    "settings.cloud": "Cloud connection",
    "settings.testConnection": "Test connection",

    "common.confirm": "Confirm",

    "action.start": "Start",
    "action.downloadFromCloud": "Download from cloud",

    "status.cloud": "In cloud",
    "status.installed": "Installed",
    "status.downloading": "Downloading",
    "status.uploading": "Uploading",
    "status.downloadingEllipsis": "Downloading…",
    "status.uploadingEllipsis": "Uploading…",
    "status.steamOwned": "On Steam (not installed)",
    "status.steamDownloading": "Downloading",

    "info.status": "Status",
    "info.playtime": "Playtime",
    "info.category": "Category",
    "info.folder": "Folder",
    "info.launchArgs": "Launch arguments",

    "news.title": "Gaming news",
    "news.fromYourLibrary": "From your library",
    "news.justNow": "just now",
    "news.hoursAgo": "{n}h ago",
    "news.dayAgo": "{n} day ago",
    "news.daysAgo": "{n} days ago",

    "upcoming.title": "Coming up & now",
    "upcoming.noCover": "No cover available",
    "upcoming.viewKey": "View key",
    "upcoming.alreadyReleased": "Already released",
    "upcoming.releasesToday": "Releases today",
    "upcoming.releasesTomorrow": "Releases tomorrow",
    "upcoming.releasesInDays": "in {n} days",

    "cloud.title": "Cloud overview",
    "cloud.subtitle":
      "Every game currently sitting in your cloud bucket - including ones you've already removed from your local library.",
    "cloud.empty": "No games in the cloud yet. Back one up first via \"Save to cloud\".",
    "cloud.loadError": "Could not load cloud contents.",
    "cloud.onlyInCloud": "Cloud only (no longer in your library)",
    "cloud.restore": "Restore",
    "cloud.allSynced": "Every game from the cloud is already in your library.",
    "cloud.deleteTitle": "Permanently delete \"{name}\" from the cloud?",
    "cloud.deleteMessage":
      "The file will be permanently removed from your cloud storage. This cannot be undone.",
    "cloud.deleteConfirm": "Delete permanently",

    "browser.back": "Back",
    "browser.forward": "Forward",
    "browser.reload": "Reload",
    "browser.home": "Avis home page",
    "browser.addressPlaceholder": "Enter an address or search the web…",
    "browser.searchPlaceholder": "Search the web…",

    "steamOverlay.launching": "Launching {name}…",
    "steamOverlay.preparing": "Preparing {name}…",
    "steamOverlay.confirmHint":
      "If a Steam window pops up (e.g. to confirm the install location), switch to it briefly and confirm.",

    "achievements.title": "Achievements",
    "achievements.missingConfigPre":
      "This needs a SteamID and a personal API key - either log in once via \"Sign in with Steam\" up top, or enter both manually in",
    "achievements.missingConfigPath": "Settings → Game sources",
    "achievements.missingConfigPost": "and enter both there.",
    "achievements.allComplete": "All achievements unlocked",

    "transfer.compressing": "Compressing…",
    "transfer.uploading": "Uploading…",
    "transfer.downloading": "Downloading…",
    "transfer.extracting": "Extracting…",
    "transfer.transferring": "Transferring…",
    "transfer.done": "Done",
    "transfer.error": "Error",

    "downloads.title": "Downloads & Uploads",
    "downloads.empty": "No cloud transfers running right now.",
    "downloads.unknownGame": "Unknown game",
    "downloads.remove": "Remove",
    "downloads.cancel": "Cancel",
    "downloads.runningViaSteam": "Running via Steam",
    "downloads.progressInSteam": "See progress in Steam",
    "downloads.openFolder": "Open folder",
    "downloads.addGame": "Add game",
    "downloads.checkSafety": "Check safety",

    "scan.scanning": "Scanning…",
    "scan.noKey": "No VirusTotal key set (Settings → Browser)",
    "scan.cleanTooltip":
      "Open the full report on virustotal.com - no antivirus vendor flagged this file as malicious",
    "scan.clean": "Clean ({n} scanners)",
    "scan.reportTooltip": "Open the full report on virustotal.com",
    "scan.malicious": "Flagged as malicious ({n} hits)",
    "scan.suspicious": "Suspicious ({n} hits)",
    "scan.unknownTooltip": "This file isn't known to VirusTotal yet - that doesn't automatically mean it's dangerous",
    "scan.unknown": "Unknown to VirusTotal",
    "scan.failed": "Scan failed",

    "steam.login": "Sign in with Steam",
    "steam.openProfile": "Open Steam profile",
    "steam.logout": "Sign out",

    "errors.installationFailed": "Installation failed.",
    "errors.downloadCancelled": "Download cancelled.",
    "errors.downloadFailed": "Download failed.",

    "common.choose": "Choose",

    "addGame.addTitle": "Add new game",
    "addGame.editTitle": "Edit game",
    "addGame.name": "Name",
    "addGame.namePlaceholder": "e.g. Cyberpunk 2077",
    "addGame.executable": "Executable (.exe)",
    "addGame.executablePlaceholder": "Choose the path to the .exe…",
    "addGame.installFolder": "Game folder (for cloud backup)",
    "addGame.installFolderPlaceholder": "Choose a folder or archive…",
    "addGame.cover": "Cover",
    "addGame.logo": "Logo (PNG)",
    "addGame.banner": "Banner",
    "addGame.category": "Category (freely chosen, powers the filter buttons)",
    "addGame.categoryPlaceholder": "e.g. Shooter, Indie, playing with friends…",
    "addGame.launchArgs": "Launch arguments (optional)",
    "addGame.launchArgsPlaceholder": "e.g. -windowed",

    "home.stillAwake": "Still up?",
    "home.goodMorning": "Good morning",
    "home.goodDay": "Good afternoon",
    "home.goodEvening": "Good evening",
    "home.gamesCount": "{n} games in your library",
    "home.gamesCountOne": "{n} game in your library",
    "home.recentlyPlayed": "Recently played",
    "home.nothingPlayedYetPre": "Nothing played yet. Start a game from your",
    "home.nothingPlayedYetPost": " and it'll show up here.",

    "errors.gameStartFailed": "Game could not be started.",
    "errors.installStartFailed": "Installation could not be started.",

    "action.download": "Download",
    "action.saveToCloud": "Save to cloud",
    "status.steamDownloadingEllipsis": "Downloading…",

    "library.searchPlaceholder": "Search your library…",
    "library.allCategories": "All",
    "library.noResults": "No games found.",
    "library.deleteTitle": "Delete \"{name}\"?",
    "library.deleteMessage":
      "The game is only removed from your launcher library. The actual game files on disk stay untouched.",
    "library.uploadTitle": "Save \"{name}\" to the cloud?",
    "library.uploadMessage":
      "The game folder is bundled locally first, then uploaded. Depending on size this can take a few minutes.",
    "library.uploadConfirm": "Upload",
    "library.strongCompression": "Strong compression",
    "library.strongCompressionHint":
      "Barely saves space for most modern games (video/audio/paks are usually already compressed) but takes noticeably longer. Only useful with a very slow connection or older, uncompressed game data.",
    "library.sortName": "Name (A-Z)",
    "library.sortStatus": "Installed first",
    "library.sortCategory": "Genre/category",
    "library.sortPlaytime": "Most played",
    "library.sortRecent": "Recently played",

    "settings.sectionGeneral": "General",
    "settings.sectionSources": "Game sources",
    "settings.sectionCloud": "Cloud storage",
    "settings.sectionDiscord": "Discord",
    "settings.sectionBrowser": "Browser",

    "background.ambient": "Ambient (animated)",
    "background.ambientDesc": "Gently drifting, glowing color fields matching your accent color.",
    "background.custom": "Custom image",
    "background.customDesc": "A chosen image as a subtle, darkened background.",
    "background.classic": "Classic (plain)",
    "background.classicDesc": "The original, completely plain dark background with no effects.",

    "sources.title": "Import Steam library",
    "sources.hint": "Pulls your purchased games into your Avis library via the official Steam Web API.",
    "sources.steamId": "SteamID (64-bit)",
    "sources.steamIdPlaceholder": "Findable via steamid.io, for example",
    "sources.apiKey": "Your own Web API key",
    "sources.apiKeyPlaceholder": "From steamcommunity.com/dev/apikey",
    "sources.importLibrary": "Import library",
    "sources.importedNew": "{added} new games imported ({total} total in your Steam library).",
    "sources.importedNoneNew": "Import complete - all games were already in your library.",

    "cloudSettings.title": "S3 credentials",
    "cloudSettings.hint": "For Hetzner, IONOS, AWS S3, Backblaze & co. No separate tool needed.",
    "cloudSettings.endpoint": "Endpoint URL",
    "cloudSettings.region": "Region",
    "cloudSettings.bucket": "Bucket name",
    "cloudSettings.bucketPlaceholder": "my-games",
    "cloudSettings.accessKey": "Access key",
    "cloudSettings.secretKey": "Secret key",
    "cloudSettings.remotePath": "Folder in the bucket",
    "cloudSettings.pathStyle": "Path-style URLs (disable for Hetzner)",
    "cloudSettings.testSuccess": "Connection successful.",
    "cloudSettings.testFailed": "Connection failed.",

    "discordSettings.title": "Rich Presence",
    "discordSettings.hint": "Shows in Discord which game you're currently playing via Avis.",
    "discordSettings.appId": "Discord application ID",
    "discordSettings.appIdPlaceholder": "From discord.com/developers/applications",
    "discordSettings.connected": "Connected to Discord",
    "discordSettings.disconnected": "Not connected - is Discord open?",

    "browserSettings.adBlockerTitle": "Ad blocker",
    "browserSettings.adBlockerHint":
      "Blocks known ad/tracking domains as well as some YouTube ad requests in the browser tab. YouTube actively fights blocking and keeps changing it - fully ad-free isn't guaranteed.",
    "browserSettings.dnsTitle": "Cloudflare DNS",
    "browserSettings.dnsActive": "Active - DNS queries run encrypted via 1.1.1.1 instead of your ISP.",
    "browserSettings.virusScanTitle": "Scan downloads for viruses",
    "browserSettings.virusScanHint":
      "Checks the hash of downloaded files against VirusTotal (needs your own free API key). The file itself is never uploaded, only its fingerprint.",
    "browserSettings.virusTotalKey": "VirusTotal API key",
    "browserSettings.virusTotalKeyPlaceholder": "From virustotal.com/gui/my-apikey",
    "browserSettings.virusScanNote": "Once a key is set, a \"Check safety\" button appears on finished browser downloads.",
    "browserSettings.proxyTitle": "Custom proxy (optional)",
    "browserSettings.proxyHint": "Browser tab only. Not a VPN - for if you already have a SOCKS/HTTP proxy.",
    "browserSettings.proxyType": "Type",
    "browserSettings.proxyHost": "Host",
    "browserSettings.proxyPort": "Port",
    "browserSettings.vpnRecommendation": "No proxy yet? A VPN provider with SOCKS5/HTTP access works just as well up here.",
    "browserSettings.vpnLearnMore": "See recommendation",
  },
};

export function translate(language, key, vars) {
  const dict = DICTIONARY[language] || DICTIONARY.en;
  let text = dict[key] ?? DICTIONARY.en[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}

export function loadSavedLanguage() {
  return localStorage.getItem(STORAGE_KEY) || "en";
}

export function saveLanguage(code) {
  localStorage.setItem(STORAGE_KEY, code);
}
