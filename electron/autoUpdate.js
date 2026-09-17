/**
 * Automatische Updates über electron-updater + GitHub Releases.
 *
 * Ablauf:
 * 1. Kurz nach dem Start wird im Hintergrund geprüft, ob es ein neueres
 *    Release im GitHub-Repo gibt (siehe "publish" in package.json).
 * 2. Gibt es eins, wird es automatisch im Hintergrund heruntergeladen -
 *    die aktuelle Sitzung wird dadurch nicht unterbrochen.
 * 3. Erst wenn der Download fertig ist, wird im Frontend ein Hinweis
 *    gezeigt ("Update bereit") mit einem Button zum Neustarten. Die
 *    Installation passiert erst, wenn der Nutzer das aktiv anstößt - nie
 *    ungefragt mitten in einer Session.
 *
 * WICHTIG, damit das bei dir funktioniert:
 * - "publish.owner" und "publish.repo" in package.json müssen auf dein
 *   echtes GitHub-Repo zeigen (aktuell Platzhalter).
 * - Updates werden nur gefunden, wenn du sie als "Release" auf GitHub
 *   veröffentlichst (nicht nur als Commit) - am einfachsten über
 *   `npm run release` (nutzt electron-builder mit --publish always,
 *   braucht dafür einen GitHub-Token in der Umgebungsvariable GH_TOKEN).
 * - Nur in der gebauten .exe aktiv, nie im Entwicklungsmodus (npm run dev).
 */

const { autoUpdater } = require("electron-updater");

function setupAutoUpdater(browserWindow) {
  // Im Entwicklungsmodus gibt es keine sinnvolle "aktuelle Version" zum
  // Vergleichen (kein Installer, keine Update-Metadaten) - würde nur
  // Fehler produzieren.
  if (process.env.NODE_ENV === "development") return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  function send(payload) {
    if (browserWindow && !browserWindow.isDestroyed()) {
      browserWindow.webContents.send("app:updateStatus", payload);
    }
  }

  autoUpdater.on("update-available", (info) => {
    send({ status: "downloading", version: info.version });
  });

  autoUpdater.on("download-progress", (progress) => {
    send({ status: "downloading", percent: Math.round(progress.percent) });
  });

  autoUpdater.on("update-downloaded", (info) => {
    send({ status: "ready", version: info.version });
  });

  autoUpdater.on("error", (error) => {
    // Kein Internet, kein Release vorhanden, Repo falsch konfiguriert o.ä. -
    // bewusst nur in der Konsole, kein störender Fehlerdialog für den
    // Nutzer. Update-Prüfung ist ein "nice to have", kein kritischer Pfad.
    console.warn("Auto-Update-Prüfung fehlgeschlagen (kein Problem, App läuft normal weiter):", error.message);
  });

  // Erst kurz nach dem Start prüfen, damit das nicht mit dem eigentlichen
  // App-Start um Ressourcen konkurriert.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 5000);
}

function quitAndInstallUpdate() {
  autoUpdater.quitAndInstall();
}

module.exports = { setupAutoUpdater, quitAndInstallUpdate };
