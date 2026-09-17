const { app } = require("electron");
const path = require("path");
const crypto = require("crypto");

/**
 * ---------------------------------------------------------------------------
 * NATIVE DOWNLOADS (eingebauter Browser-Tab)
 * ---------------------------------------------------------------------------
 * Der eingebaute Browser-Tab (BrowserPage.jsx) läuft in einer eigenen,
 * benannten Session-Partition ("persist:avisbrowser"). Electron erlaubt es,
 * Downloads GENAU dieser Session direkt im Hauptprozess abzufangen -
 * dafür braucht es weder eine Browser-Erweiterung noch einen externen
 * Browser wie Chrome/Firefox. Sendet dieselben Event-Typen
 * (started/progress/done/error) wie die Browser-Erweiterung, damit der
 * Renderer (App.jsx/DownloadManager.jsx) ohne Änderung beides versteht.
 * ---------------------------------------------------------------------------
 */

/** Aktive Downloads, damit sie sich von der UI aus gezielt abbrechen lassen */
const activeDownloads = new Map();

function setupNativeDownloads(browserSession, onEvent) {
  browserSession.on("will-download", (_event, item) => {
    const id = crypto.randomUUID();
    const suggestedName = item.getFilename();
    const savePath = path.join(app.getPath("downloads"), suggestedName);
    item.setSavePath(savePath);
    activeDownloads.set(id, item);

    onEvent({
      type: "started",
      id,
      filename: suggestedName,
      filePath: savePath,
      url: item.getURL(),
      totalBytes: item.getTotalBytes(),
    });

    item.on("updated", (_e, state) => {
      if (state === "progressing" && !item.isPaused()) {
        onEvent({
          type: "progress",
          id,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes(),
        });
      }
    });

    item.once("done", (_e, state) => {
      activeDownloads.delete(id);
      if (state === "completed") {
        onEvent({ type: "done", id, filePath: savePath });
      } else {
        // "cancelled" (vom Nutzer abgebrochen) oder "interrupted" (Fehler)
        onEvent({ type: "error", id, cancelled: state === "cancelled" });
      }
    });
  });
}

/** Bricht einen laufenden Download gezielt ab (z.B. per Klick im Downloads-Tab) */
function cancelNativeDownload(id) {
  const item = activeDownloads.get(id);
  if (!item) return { success: false };
  item.cancel();
  activeDownloads.delete(id);
  return { success: true };
}

module.exports = { setupNativeDownloads, cancelNativeDownload };
