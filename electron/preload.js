const { contextBridge, ipcRenderer } = require("electron");

/**
 * Alles, was der React-Renderer vom nativen System braucht, läuft
 * ausschließlich über diese kontrollierte Bridge (kein nodeIntegration!).
 */
contextBridge.exposeInMainWorld("api", {
  // --- Dateisystem-Dialoge ---
  selectExecutable: (defaultPath) => ipcRenderer.invoke("dialog:selectExecutable", defaultPath),
  selectImage: () => ipcRenderer.invoke("dialog:selectImage"),
  selectFolderOrArchive: (defaultPath) => ipcRenderer.invoke("dialog:selectFolderOrArchive", defaultPath),

  // --- Bibliothek (Persistenz) ---
  loadLibrary: () => ipcRenderer.invoke("library:load"),
  saveLibrary: (games) => ipcRenderer.invoke("library:save", games),

  // --- Spiel starten ---
  launchGame: (game) => ipcRenderer.invoke("game:launch", game),
  onGameExit: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("game:exit", handler);
    return () => ipcRenderer.removeListener("game:exit", handler);
  },

  // --- Cloud Upload / Download ---
  cloudUpload: (game, options) => ipcRenderer.invoke("cloud:upload", game, options),
  cloudDownload: (game) => ipcRenderer.invoke("cloud:download", game),
  cloudCancel: (transferId) => ipcRenderer.invoke("cloud:cancel", transferId),
  onCloudProgress: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("cloud:progress", handler);
    return () => ipcRenderer.removeListener("cloud:progress", handler);
  },

  // --- Cloud-Konfiguration (Settings) ---
  getCloudConfig: () => ipcRenderer.invoke("cloud:getConfig"),
  saveCloudConfig: (config) => ipcRenderer.invoke("cloud:saveConfig", config),
  testCloudConnection: () => ipcRenderer.invoke("cloud:testConnection"),
  listRemoteCloudGames: () => ipcRenderer.invoke("cloud:listRemote"),
  deleteRemoteCloudGame: (gameId) => ipcRenderer.invoke("cloud:deleteRemote", gameId),

  // --- Downloads aus dem eingebauten Browser-Tab ---
  showItemInFolder: (filePath) => ipcRenderer.invoke("app:showItemInFolder", filePath),
  cancelBrowserDownload: (id) => ipcRenderer.invoke("browser:cancelDownload", id),
  onBrowserDownloadEvent: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("browser:downloadEvent", handler);
    return () => ipcRenderer.removeListener("browser:downloadEvent", handler);
  },

  // --- Discord Rich Presence ---
  getDiscordConfig: () => ipcRenderer.invoke("discord:getConfig"),
  saveDiscordConfig: (config) => ipcRenderer.invoke("discord:saveConfig", config),
  getDiscordStatus: () => ipcRenderer.invoke("discord:getStatus"),
  onDiscordStatus: (callback) => {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on("discord:status", handler);
    return () => ipcRenderer.removeListener("discord:status", handler);
  },

  // --- Proxy für den eingebauten Browser-Tab ---
  getBrowserProxyConfig: () => ipcRenderer.invoke("browserProxy:getConfig"),
  saveBrowserProxyConfig: (config) => ipcRenderer.invoke("browserProxy:saveConfig", config),

  // --- Werbeblocker ---
  getAdBlockerConfig: () => ipcRenderer.invoke("adBlocker:getConfig"),
  saveAdBlockerConfig: (config) => ipcRenderer.invoke("adBlocker:saveConfig", config),

  // --- Gaming-News ---
  getLatestGameNews: (libraryGameNames) => ipcRenderer.invoke("news:getLatest", libraryGameNames),

  // --- Steam-Bibliotheks-Import ---
  steamImportLibrary: (credentials) => ipcRenderer.invoke("steam:importLibrary", credentials),
  getSteamAchievements: (payload) => ipcRenderer.invoke("steam:getAchievements", payload),
  getSteamConfig: () => ipcRenderer.invoke("steam:getConfig"),
  saveSteamConfig: (config) => ipcRenderer.invoke("steam:saveConfig", config),
  // --- "Mit Steam anmelden" ---
  loginWithSteam: () => ipcRenderer.invoke("steam:login"),
  logoutSteam: () => ipcRenderer.invoke("steam:logout"),
  getLoggedInSteamProfile: () => ipcRenderer.invoke("steam:getLoggedInProfile"),

  // --- Steam-Spiel über Avis "herunterladen" ---
  startSteamInstall: (payload) => ipcRenderer.invoke("steam:startInstall", payload),
  stopWatchingSteamInstall: (gameId) => ipcRenderer.invoke("steam:stopWatchingInstall", gameId),
  getSteamInstallState: (appId) => ipcRenderer.invoke("steam:getInstallState", appId),
  activateSteamKey: (keyString) => ipcRenderer.invoke("steam:activateKey", keyString),
  getStoreDeals: () => ipcRenderer.invoke("store:getDeals"),
  searchStoreGames: (title) => ipcRenderer.invoke("store:searchGames", title),
  onSteamInstallProgress: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("steam:installProgress", handler);
    return () => ipcRenderer.removeListener("steam:installProgress", handler);
  },

  // --- VirusTotal-Prüfung für Downloads ---
  getVirusScanConfig: () => ipcRenderer.invoke("virusScan:getConfig"),
  saveVirusScanConfig: (config) => ipcRenderer.invoke("virusScan:saveConfig", config),
  scanFileForViruses: (filePath) => ipcRenderer.invoke("virusScan:scanFile", filePath),

  // --- Neuerscheinungen (vom Entwickler gepflegter Feed, für alle gleich) ---
  getUpcomingGamesList: () => ipcRenderer.invoke("upcomingGames:getList"),

  // --- Auto-Updater ---
  installUpdate: () => ipcRenderer.invoke("app:installUpdate"),
  onUpdateStatus: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("app:updateStatus", handler);
    return () => ipcRenderer.removeListener("app:updateStatus", handler);
  },
});
