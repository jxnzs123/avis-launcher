const { ipcMain, dialog, shell, session } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");
const gameLauncher = require("./gameLauncher");
const cloudService = require("./cloudService");
const { cancelNativeDownload } = require("./nativeDownloads");
const discordRpc = require("./discordRpc");
const browserProxy = require("./browserProxy");
const adBlocker = require("./adBlocker");
const { fetchLatestNews } = require("./gameNews");
const steamService = require("./steamService");
const steamAuth = require("./steamAuth");
const steamManager = require("./steamManager");
const { quitAndInstallUpdate } = require("./autoUpdate");
const storeService = require("./storeService");
const virusScan = require("./virusScan");
const upcomingGamesService = require("./upcomingGames");

const LIBRARY_PATH = path.join(os.homedir(), ".avis-launcher", "library.json");

function ensureLibraryFile() {
  fs.mkdirSync(path.dirname(LIBRARY_PATH), { recursive: true });
  if (!fs.existsSync(LIBRARY_PATH)) {
    fs.writeFileSync(LIBRARY_PATH, JSON.stringify([], null, 2));
  }
}

function registerIpcHandlers(browserWindow) {
  // --- Datei-Dialoge ---
  ipcMain.handle("dialog:selectExecutable", async (_event, defaultPath) => {
    const result = await dialog.showOpenDialog(browserWindow, {
      title: "Executable auswählen",
      properties: ["openFile"],
      filters: [{ name: "Programme", extensions: ["exe"] }],
      ...(defaultPath ? { defaultPath } : {}),
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("dialog:selectImage", async () => {
    const result = await dialog.showOpenDialog(browserWindow, {
      title: "Bild auswählen",
      properties: ["openFile"],
      filters: [{ name: "Bilder", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("dialog:selectFolderOrArchive", async (_event, defaultPath) => {
    const result = await dialog.showOpenDialog(browserWindow, {
      title: "Spielordner oder Archiv auswählen",
      properties: ["openFile", "openDirectory"],
      filters: [{ name: "Archive", extensions: ["zip", "tar", "tar.gz"] }],
      ...(defaultPath ? { defaultPath } : {}),
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // --- Bibliothek laden/speichern (einfache JSON-Persistenz) ---
  ipcMain.handle("library:load", async () => {
    ensureLibraryFile();
    const games = JSON.parse(fs.readFileSync(LIBRARY_PATH, "utf-8"));

    // Sicherheitsnetz: "uploading"/"downloading" sind reine Session-Zustände.
    // Wurde die App während eines Transfers geschlossen/abgestürzt, bliebe
    // eine Karte sonst für immer in diesem Zustand hängen und wäre nicht
    // mehr anklickbar. Beim Start daher automatisch zurücksetzen.
    let changed = false;
    const sanitized = games.map((game) => {
      if (game.status === "uploading") {
        changed = true;
        return { ...game, status: "installed" };
      }
      if (game.status === "downloading") {
        changed = true;
        return { ...game, status: "cloud" };
      }
      return game;
    });

    if (changed) {
      fs.writeFileSync(LIBRARY_PATH, JSON.stringify(sanitized, null, 2));
    }

    return sanitized;
  });

  ipcMain.handle("library:save", async (_event, games) => {
    ensureLibraryFile();
    fs.writeFileSync(LIBRARY_PATH, JSON.stringify(games, null, 2));
    return { success: true };
  });

  // --- Spiel starten ---
  ipcMain.handle("game:launch", async (_event, game) => {
    return gameLauncher.launchGame(game, browserWindow);
  });

  // --- Cloud Upload / Download ---
  ipcMain.handle("cloud:upload", async (_event, game, options) => {
    try {
      return await cloudService.uploadGame(game, browserWindow, options);
    } catch (error) {
      console.error("[cloud:upload] Fehler:", error);
      throw error;
    }
  });

  ipcMain.handle("cloud:download", async (_event, game) => {
    return cloudService.downloadGame(game, browserWindow);
  });

  ipcMain.handle("cloud:cancel", async (_event, transferId) => {
    return cloudService.cancelTransfer(transferId);
  });

  // --- Cloud-Konfiguration (Settings-UI) ---
  ipcMain.handle("cloud:getConfig", async () => {
    return cloudService.getCloudConfig();
  });

  ipcMain.handle("cloud:saveConfig", async (_event, config) => {
    return cloudService.saveCloudConfig(config);
  });

  ipcMain.handle("cloud:testConnection", async () => {
    try {
      return await cloudService.testConnection();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("cloud:listRemote", async () => {
    try {
      return { success: true, games: await cloudService.listRemoteGames() };
    } catch (error) {
      return { success: false, error: error.message, games: [] };
    }
  });

  ipcMain.handle("cloud:deleteRemote", async (_event, gameId) => {
    try {
      return await cloudService.deleteRemoteGame(gameId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- Downloads aus dem eingebauten Browser-Tab abbrechen ---
  ipcMain.handle("browser:cancelDownload", async (_event, id) => {
    return cancelNativeDownload(id);
  });

  ipcMain.handle("app:showItemInFolder", async (_event, filePath) => {
    if (typeof filePath === "string" && filePath) {
      shell.showItemInFolder(filePath);
    }
    return { success: true };
  });

  // --- Discord Rich Presence ---
  function sendDiscordStatus(status) {
    if (!browserWindow.isDestroyed()) {
      browserWindow.webContents.send("discord:status", status);
    }
  }

  const discordConfig = discordRpc.getConfig();
  if (discordConfig.enabled) {
    discordRpc.connect(sendDiscordStatus);
  }

  ipcMain.handle("discord:getConfig", async () => discordRpc.getConfig());

  ipcMain.handle("discord:saveConfig", async (_event, patch) => {
    const config = discordRpc.saveConfig(patch);
    if (config.enabled) {
      discordRpc.connect(sendDiscordStatus);
    } else {
      discordRpc.disconnect();
      sendDiscordStatus("disconnected");
    }
    return config;
  });

  ipcMain.handle("discord:getStatus", async () => discordRpc.getStatus());

  // --- Proxy für den eingebauten Browser-Tab (kein System-VPN) ---
  ipcMain.handle("browserProxy:getConfig", async () => browserProxy.getConfig());

  ipcMain.handle("browserProxy:saveConfig", async (_event, patch) => {
    const config = browserProxy.saveConfig(patch);
    const browserTabSession = session.fromPartition("persist:avisbrowser");
    await browserProxy.applyToSession(browserTabSession);
    return config;
  });

  // --- Werbeblocker für den eingebauten Browser-Tab ---
  ipcMain.handle("adBlocker:getConfig", async () => adBlocker.getConfig());

  ipcMain.handle("adBlocker:saveConfig", async (_event, patch) => {
    const config = adBlocker.saveConfig(patch);
    const browserTabSession = session.fromPartition("persist:avisbrowser");
    adBlocker.applyToSession(browserTabSession);
    return config;
  });

  // --- Gaming-News (RSS, kein API-Key nötig) ---
  ipcMain.handle("news:getLatest", async (_event, libraryGameNames) => {
    try {
      return { success: true, items: await fetchLatestNews(libraryGameNames) };
    } catch (error) {
      return { success: false, error: error.message, items: [] };
    }
  });

  // --- Steam: persistente Zugangsdaten ---
  ipcMain.handle("steam:getConfig", async () => steamService.getConfig());

  ipcMain.handle("steam:saveConfig", async (_event, patch) => steamService.saveConfig(patch));

  // --- Steam-Bibliotheks-Import (eigener API-Key + SteamID) ---
  ipcMain.handle("steam:importLibrary", async (_event, { steamId, apiKey }) => {
    try {
      const games = await steamService.getOwnedGames(steamId, apiKey);
      return { success: true, games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- Achievements für ein bestimmtes Spiel eines Profils ---
  ipcMain.handle("steam:getAchievements", async (_event, { steamId, appId, apiKey, language }) => {
    try {
      const result = await steamService.getAchievements(steamId, appId, apiKey, language);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- "Mit Steam anmelden" (echter OpenID-Login, kein API-Key nötig) ---
  ipcMain.handle("steam:login", async () => {
    try {
      const steamId = await steamAuth.loginWithSteam();
      const profile = await steamService.getLoggedInProfile(steamId);
      steamService.saveConfig({ loggedInSteamId: steamId });
      return { success: true, profile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("steam:logout", async () => {
    steamService.saveConfig({ loggedInSteamId: "" });
    return { success: true };
  });

  ipcMain.handle("steam:getLoggedInProfile", async () => {
    try {
      const { loggedInSteamId } = steamService.getConfig();
      if (!loggedInSteamId) return { success: true, profile: null };
      const profile = await steamService.getLoggedInProfile(loggedInSteamId);
      return { success: true, profile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- Steam-Spiel über Avis "herunterladen" (siehe steamManager.js für
  // die ehrliche Erklärung, wie das technisch funktioniert) ---
  const activeSteamWatchers = new Map(); // gameId -> Abbruch-Funktion

  ipcMain.handle("steam:startInstall", async (_event, { gameId, appId }) => {
    if (activeSteamWatchers.has(gameId)) {
      return { success: false, error: "Wird bereits beobachtet." };
    }

    const stop = steamManager.installSteamGame(appId, (progress) => {
      if (browserWindow && !browserWindow.isDestroyed()) {
        browserWindow.webContents.send("steam:installProgress", { gameId, appId, ...progress });
      }
      if (progress.phase === "done" || progress.phase === "error") {
        activeSteamWatchers.delete(gameId);
      }
    });

    activeSteamWatchers.set(gameId, stop);
    return { success: true };
  });

  ipcMain.handle("steam:stopWatchingInstall", async (_event, gameId) => {
    const stop = activeSteamWatchers.get(gameId);
    if (stop) {
      stop();
      activeSteamWatchers.delete(gameId);
    }
    return { success: true };
  });

  // --- Einmaliger Status-Check per ACF-Manifest, ohne eine laufende
  // Beobachtung zu starten (z.B. für einen manuellen Refresh-Button) ---
  ipcMain.handle("steam:getInstallState", async (_event, appId) => {
    return { success: true, state: steamManager.getInstallState(appId) };
  });

  // --- Steam-Key einlösen (öffnet Steams Dialog + kopiert den Key) ---
  ipcMain.handle("steam:activateKey", async (_event, keyString) => {
    try {
      const result = await steamManager.activateSteamKey(keyString);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- Store-Deals über die kostenlose CheapShark-API ---
  ipcMain.handle("store:getDeals", async () => {
    try {
      const deals = await storeService.getDeals();
      return { success: true, deals };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("store:searchGames", async (_event, title) => {
    try {
      const games = await storeService.searchGames(title);
      return { success: true, games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- Auto-Updater: Nutzer stößt die eigentliche Installation aktiv an ---
  ipcMain.handle("app:installUpdate", async () => {
    quitAndInstallUpdate();
  });

  // --- VirusTotal-Prüfung für heruntergeladene Dateien (eigener API-Key) ---
  ipcMain.handle("virusScan:getConfig", async () => virusScan.getConfig());

  ipcMain.handle("virusScan:saveConfig", async (_event, patch) => {
    return virusScan.saveConfig(patch);
  });

  ipcMain.handle("virusScan:scanFile", async (_event, filePath) => {
    try {
      return await virusScan.scanFile(filePath);
    } catch (error) {
      return { status: "error", message: error.message };
    }
  });

  // --- Neuerscheinungen-Feed (fest hinterlegte URL, gilt für alle Nutzer gleich) ---
  ipcMain.handle("upcomingGames:getList", async () => {
    return upcomingGamesService.getUpcomingGames();
  });
}

module.exports = { registerIpcHandlers };
