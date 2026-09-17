/**
 * Zentrale Steam-Integration für Avis (GOG-Galaxy-artiges Verhalten):
 * - installSteamGame(appId, onProgress): Download/Installation auslösen und beobachten
 * - launchSteamGame(appId): bereits installiertes Spiel starten
 * - getInstallState(appId): einmaliger Status-Check ohne laufende Beobachtung
 *
 * WICHTIG - ehrliche Einordnung, was hier technisch geht und was nicht:
 *
 * 1) INSTALLATION AUSLÖSEN
 *    Es gibt keinen Kommandozeilen-Parameter wie "steam.exe -install <appid>"
 *    in Steams offiziell dokumentierten Startparametern (nur z.B.
 *    "-applaunch", "-silent", "-no-cef-sandbox" etc. sind belegt). Der
 *    tatsächlich funktionierende, offiziell unterstützte Weg, eine
 *    Installation gezielt für eine bestimmte AppID auszulösen, ist das
 *    "steam://install/<appid>"-Protokoll - das nutzen wir hier. Das öffnet
 *    (bei einer neuen Installation) Steams eigenen Installationsdialog
 *    (Sprache/Zielordner/Installieren) - es gibt keine Möglichkeit, diesen
 *    Dialog von außen zu unterdrücken, ohne Steams UI-Automatisierung zu
 *    reverse-engineeren (das haben wir bereits versucht und wieder
 *    verworfen, siehe Git-Historie "steamAutoConfirm.js" - hat in der
 *    Praxis nicht zuverlässig funktioniert).
 *
 * 2) STATUS-SCANNING
 *    Funktioniert wie beschrieben über die appmanifest_<appid>.acf-Datei
 *    und deren "StateFlags"-Feld. Bit 4 = "Fully Installed". Bewusst OHNE
 *    byte-genaue Prozentanzeige (siehe getInstallState-Kommentar unten).
 *
 * 3) SPIEL STARTEN
 *    "steam.exe -applaunch <appid>" ist ein echter, offiziell
 *    dokumentierter Steam-Parameter (derselbe, den Steams eigene
 *    Desktop-Verknüpfungen nutzen) - reduziert das Popup-Verhalten
 *    spürbar, kann es aber nicht auf 0 garantieren, weil Steam
 *    weiterhin ganz normal den Besitz prüft und dabei kurz sein
 *    Hauptfenster involvieren kann.
 */

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { shell: electronShell, clipboard } = require("electron");
const { getSteamExePath, findSteamLibraryFolders } = require("./steamService");
const { attemptMinimizeSteamWindow } = require("./steamWindow");

const POLL_INTERVAL_MS = 3000;
const OVERALL_TIMEOUT_MS = 20 * 60 * 1000; // 20 Minuten - danach lieber melden statt ewig weiterzulaufen

/* ---------------------------------------------------------------------- */
/* ACF-Manifest lesen                                                      */
/* ---------------------------------------------------------------------- */
function findManifestPath(appId) {
  const folders = findSteamLibraryFolders();
  for (const folder of folders) {
    const manifestPath = path.join(folder, `appmanifest_${appId}.acf`);
    if (fs.existsSync(manifestPath)) return manifestPath;
  }
  return null;
}

function readStateFlags(manifestPath) {
  const content = fs.readFileSync(manifestPath, "utf-8");
  const match = content.match(/"StateFlags"\s*"(\d+)"/);
  return match ? Number(match[1]) : null;
}

/** StateFlags-Bits, die auf eine laufende Übertragung hindeuten (Steams
 * eigene Bit-Bedeutungen: 128 = Update Running, 1024 = Update Started,
 * 131072 = Downloading). */
const DOWNLOAD_BITS = 128 | 1024 | 131072;

/**
 * Einmaliger Status-Check, ohne eine laufende Beobachtung zu starten.
 * Rückgabe: "not-installed" | "downloading" | "installed"
 */
function getInstallState(appId) {
  const manifestPath = findManifestPath(appId);
  if (!manifestPath) return "not-installed";

  let stateFlags;
  try {
    stateFlags = readStateFlags(manifestPath);
  } catch {
    return "not-installed"; // Datei existiert, ist aber gerade nicht lesbar (Steam schreibt sie)
  }

  if (stateFlags === null) return "not-installed";
  const isFullyInstalled = (stateFlags & 4) === 4 && (stateFlags & DOWNLOAD_BITS) === 0;
  if (isFullyInstalled) return "installed";
  return "downloading";
}

/* ---------------------------------------------------------------------- */
/* Installation auslösen + beobachten                                      */
/* ---------------------------------------------------------------------- */

/**
 * Löst die Installation aus und ruft onProgress bei jeder erkannten
 * Zustandsänderung auf: { phase: "downloading" }, { phase: "done" } oder
 * { phase: "error", message }.
 *
 * Gibt eine Funktion zum Beenden der Beobachtung zurück (beendet NICHT den
 * eigentlichen Steam-Download - der läuft in Steam selbst weiter).
 */
function installSteamGame(appId, onProgress) {
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

    const state = getInstallState(appId);
    if (state === "installed") {
      clearInterval(interval);
      onProgress({ phase: "done" });
    }
    // "downloading" und "not-installed" (noch nicht bestätigt) -> einfach weiter warten
  }, POLL_INTERVAL_MS);

  return () => clearInterval(interval);
}

/* ---------------------------------------------------------------------- */
/* Spiel starten                                                           */
/* ---------------------------------------------------------------------- */

/**
 * Startet ein bereits installiertes Steam-Spiel über "steam.exe -applaunch
 * <appid>". Fällt automatisch auf "steam://rungameid/<appid>" zurück, falls
 * der Steam-Pfad nicht per Registry gefunden wird oder der direkte Aufruf
 * fehlschlägt.
 */
async function launchSteamGame(appId) {
  const steamExePath = await getSteamExePath();

  if (steamExePath) {
    execFile(steamExePath, ["-applaunch", String(appId)], (error) => {
      if (error) {
        electronShell.openExternal(`steam://rungameid/${appId}`).catch(() => {});
      }
    });
    attemptMinimizeSteamWindow();
    return { started: true, viaSteam: true };
  }

  await electronShell.openExternal(`steam://rungameid/${appId}`);
  attemptMinimizeSteamWindow();
  return { started: true, viaSteam: true };
}

/* ---------------------------------------------------------------------- */
/* Steam-Key einlösen                                                       */
/* ---------------------------------------------------------------------- */

/**
 * Öffnet Steams eigenen "Produkt aktivieren"-Dialog und kopiert den Key
 * vorher in die Zwischenablage.
 *
 * WICHTIG - ehrliche Einordnung: Ein URL-Parameter wie
 * "steam://open/registerkey?key=..." zum automatischen Vorausfüllen ist in
 * Steams offiziell dokumentierten Protokoll-Befehlen NICHT auffindbar
 * (nachvollziehbar aus Sicherheitsgründen - sonst könnte jede Webseite
 * Keys automatisch aktivieren, ohne dass der Nutzer sie je zu Gesicht
 * bekommt). Der bestätigte, funktionierende Befehl ist
 * "steam://open/activateproduct" - der öffnet nur den leeren Dialog, in
 * den der Key manuell eingegeben werden muss. Um das trotzdem so bequem
 * wie möglich zu machen, kopiert Avis den Key vorher automatisch in die
 * Zwischenablage - im Dialog reicht dann ein einfaches Einfügen (Strg+V).
 */
async function activateSteamKey(keyString) {
  const trimmed = (keyString || "").trim();
  if (!trimmed) throw new Error("Kein Key eingegeben.");

  clipboard.writeText(trimmed);
  await electronShell.openExternal("steam://open/activateproduct");
  return { opened: true, copiedToClipboard: true };
}

module.exports = { installSteamGame, launchSteamGame, getInstallState, activateSteamKey };
