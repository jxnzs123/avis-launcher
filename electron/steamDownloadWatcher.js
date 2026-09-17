/**
 * Steam-Spiele über Avis herunterladen/installieren.
 *
 * WICHTIG - ehrliche Einordnung, wie das technisch funktioniert:
 * Steam-Inhalte sind verschlüsselt und laufen ausschließlich über Steams
 * eigenes Content-Delivery-System - es gibt keine Möglichkeit, eine
 * Steam-Spieldatei direkt herunterzuladen wie eine normale Datei aus dem
 * Browser. Was hier stattdessen passiert:
 *
 * 1. Avis löst über "steam://install/<appid>" aus, dass STEAM SELBST den
 *    Download startet (Steam übernimmt komplett die eigentliche
 *    Übertragung, Entschlüsselung, Installation).
 * 2. Avis prüft periodisch Steams eigene kleine Statusdatei (die
 *    "appmanifest"-Datei), um zu erkennen, ob die Installation
 *    abgeschlossen ist.
 *
 * BEWUSST OHNE genaue Prozentanzeige: Ein früherer Versuch, aus dieser
 * Datei eine byte-genaue Prozentzahl zu berechnen, war in der Praxis nicht
 * zuverlässig (Feldnamen/Format können sich zwischen Steam-Versionen
 * unterscheiden, ließ sich ohne echten Windows-PC zum Testen nicht sauber
 * fixen). Lieber eine ehrliche "läuft/fertig"-Anzeige als eine Zahl, die
 * falsch bei 0% hängen bleibt.
 */

const fs = require("fs");
const path = require("path");
const { shell: electronShell } = require("electron");
const { findSteamLibraryFolders } = require("./steamService");

const POLL_INTERVAL_MS = 3000;
const OVERALL_TIMEOUT_MS = 20 * 60 * 1000; // 20 Minuten - danach lieber abbrechen als ewig weiterlaufen

function findManifestPath(appId) {
  const folders = findSteamLibraryFolders();
  for (const folder of folders) {
    const manifestPath = path.join(folder, `appmanifest_${appId}.acf`);
    if (fs.existsSync(manifestPath)) return manifestPath;
  }
  return null;
}

/** Nur der eine Wert, der zuverlässig genug ist, um "fertig" zu erkennen -
 * keine byte-genauen Felder mehr, siehe Hinweis oben. */
function readStateFlags(manifestPath) {
  const content = fs.readFileSync(manifestPath, "utf-8");
  const match = content.match(/"StateFlags"\s*"(\d+)"/);
  return match ? Number(match[1]) : null;
}

/**
 * Startet die Installation eines Steam-Spiels und beobachtet, ob sie
 * abgeschlossen wurde. Meldet nur "downloading" (läuft, ohne Prozentzahl)
 * und "done"/"error" - siehe Datei-Kommentar oben, warum keine genaue
 * Prozentanzeige versucht wird.
 */
function startInstallWatch(appId, onProgress) {
  electronShell.openExternal(`steam://install/${appId}`);

  onProgress({ phase: "downloading" });

  let elapsed = 0;

  const interval = setInterval(() => {
    elapsed += POLL_INTERVAL_MS;

    if (elapsed >= OVERALL_TIMEOUT_MS) {
      clearInterval(interval);
      onProgress({
        phase: "error",
        message: "Zeitüberschreitung - bitte in Steam selbst prüfen, ob die Installation läuft oder abgebrochen wurde.",
      });
      return;
    }

    const manifestPath = findManifestPath(appId);
    if (!manifestPath) return; // noch nicht bestätigt/gestartet - einfach weiter warten

    let stateFlags;
    try {
      stateFlags = readStateFlags(manifestPath);
    } catch {
      return; // Datei gerade von Steam selbst in Bearbeitung
    }

    // StateFlags-Bit 4 = "Fully Installed". Läuft daneben kein
    // Download/Update-Bit mehr (128/1024/131072), gilt es als fertig.
    const downloadBits = 128 | 1024 | 131072;
    const isFullyInstalled = stateFlags !== null && (stateFlags & 4) === 4 && (stateFlags & downloadBits) === 0;

    if (isFullyInstalled) {
      clearInterval(interval);
      onProgress({ phase: "done" });
    }
  }, POLL_INTERVAL_MS);

  return () => clearInterval(interval); // zum Abbrechen der Beobachtung (nicht des Steam-Downloads selbst!)
}

module.exports = { startInstallWatch };
