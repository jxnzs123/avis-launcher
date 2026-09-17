const { app, BrowserWindow, shell, session } = require("electron");
const path = require("path");
const { registerIpcHandlers } = require("./ipcHandlers");
const { setupNativeDownloads } = require("./nativeDownloads");
const browserProxy = require("./browserProxy");
const adBlocker = require("./adBlocker");
const { setupAutoUpdater } = require("./autoUpdate");

const isDev = process.env.NODE_ENV === "development";

// Zwingt Chromium, Webseiten im eingebauten Browser-Tab automatisch in
// einem inhaltsbewussten Dark Mode darzustellen (dieselbe Technik, die
// Chrome auf Android für "Dark Mode für Webinhalte" nutzt) - muss VOR
// app.whenReady() gesetzt werden.
app.commandLine.appendSwitch("enable-features", "WebContentsForceDark,WebContentsForceDarkModeControl");
app.commandLine.appendSwitch("force-dark-mode");

// Cloudflare DNS-over-HTTPS (1.1.1.1): verschlüsselt DNS-Anfragen, damit der
// Internetanbieter nicht mitlesen kann, welche Seiten aufgerufen werden.
// Kein vollständiges VPN, aber kostenlos, schnell und sofort wirksam.
app.commandLine.appendSwitch("dns-over-https-mode", "secure");
app.commandLine.appendSwitch("dns-over-https-templates", "https://cloudflare-dns.com/dns-query");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#07080b",
    show: false, // erst sichtbar machen, wenn der erste Frame fertig ist (s.u.) - verhindert weißen Blitz
    frame: true,
    autoHideMenuBar: true,
    titleBarStyle: "hiddenInset",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true, // ermöglicht den eingebetteten Browser-Tab in der App
    },
  });

  // Fenster erst zeigen, sobald wirklich etwas zu sehen ist - sonst blitzt
  // kurz ein weißes/leeres Fenster auf, bevor die App-Oberfläche geladen ist.
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Externe Links im Standardbrowser öffnen statt im App-Fenster
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Downloads aus dem eingebauten Browser-Tab (BrowserPage.jsx) direkt
  // über Electrons Session-API erkennen - kein externer Browser, keine
  // Erweiterung nötig.
  const browserTabSession = session.fromPartition("persist:avisbrowser");
  setupNativeDownloads(browserTabSession, (payload) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send("browser:downloadEvent", payload);
    }
  });
  browserProxy.applyToSession(browserTabSession);
  adBlocker.applyToSession(browserTabSession);

  // Discord läuft in einer EIGENEN, dauerhaften Session-Partition (eigener
  // Login, getrennt vom allgemeinen Browser-Tab). Mikrofon/Kamera müssen
  // explizit erlaubt werden, sonst funktioniert Sprach-/Videochat nicht.
  const discordSession = session.fromPartition("persist:avisdiscord");
  discordSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ["media", "microphone", "camera", "notifications", "clipboard-sanitized-write"];
    callback(allowed.includes(permission));
  });

  registerIpcHandlers(mainWindow);
  setupAutoUpdater(mainWindow);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
