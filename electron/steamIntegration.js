const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * ---------------------------------------------------------------------------
 * STEAM-INTEGRATION
 * ---------------------------------------------------------------------------
 * Liest AUSSCHLIESSLICH lokale, von Steam selbst geschriebene Dateien
 * (libraryfolders.vdf, appmanifest_*.acf) - keine Anmeldung, kein API-Key,
 * kein Eingriff in Steams DRM. Starten/Installieren läuft über Steams
 * offiziell dokumentiertes "steam://"-URI-Protokoll (dasselbe, das auch
 * Desktop-Verknüpfungen und "Install on Steam"-Buttons auf Webseiten
 * nutzen) - Avis lädt zu keinem Zeitpunkt selbst Spieldaten herunter,
 * das übernimmt weiterhin Steam im Hintergrund.
 * ---------------------------------------------------------------------------
 */

/** Ermittelt den Steam-Installationspfad über die Windows-Registry */
function getSteamPath() {
  if (process.platform !== "win32") return null;
  try {
    const out = execSync('reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath', {
      encoding: "utf-8",
    });
    const match = out.match(/SteamPath\s+REG_SZ\s+(.+)/i);
    if (match) return match[1].trim().replace(/\//g, path.sep);
  } catch {
    // Registry-Eintrag nicht gefunden - evtl. Steam nicht installiert
  }
  const fallback = "C:\\Program Files (x86)\\Steam";
  return fs.existsSync(fallback) ? fallback : null;
}

/** Extrahiert einen einzelnen "key" "value"-Eintrag aus einer VDF/ACF-Datei */
function extractVdfField(content, key) {
  const match = content.match(new RegExp(`"${key}"\\s+"([^"]*)"`, "i"));
  return match ? match[1] : null;
}

/** Liest steamapps/libraryfolders.vdf, um ALLE Bibliotheks-Ordner zu finden (Steam erlaubt mehrere Laufwerke) */
function getLibraryFolders(steamPath) {
  const vdfPath = path.join(steamPath, "steamapps", "libraryfolders.vdf");
  if (!fs.existsSync(vdfPath)) return [steamPath];
  const content = fs.readFileSync(vdfPath, "utf-8");
  const paths = [...content.matchAll(/"path"\s+"([^"]*)"/gi)].map((m) =>
    m[1].replace(/\\\\/g, "\\")
  );
  return paths.length ? paths : [steamPath];
}

/** Liest eine einzelne appmanifest_<appid>.acf-Datei aus */
function parseAppManifest(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const appid = extractVdfField(content, "appid");
  const name = extractVdfField(content, "name");
  const installdir = extractVdfField(content, "installdir");
  if (!appid || !name) return null;
  return {
    appid,
    name,
    installdir,
    sizeOnDisk: Number(extractVdfField(content, "SizeOnDisk") || 0),
    bytesToDownload: Number(extractVdfField(content, "BytesToDownload") || 0),
    bytesDownloaded: Number(extractVdfField(content, "BytesDownloaded") || 0),
  };
}

/** Scannt alle Steam-Bibliotheken nach installierten Spielen */
function scanInstalledGames() {
  const steamPath = getSteamPath();
  if (!steamPath) return { installed: false, games: [] };

  const libraryFolders = getLibraryFolders(steamPath);
  const games = [];

  for (const folder of libraryFolders) {
    const steamappsDir = path.join(folder, "steamapps");
    if (!fs.existsSync(steamappsDir)) continue;
    const files = fs.readdirSync(steamappsDir).filter((f) => /^appmanifest_\d+\.acf$/i.test(f));
    for (const file of files) {
      try {
        const manifest = parseAppManifest(path.join(steamappsDir, file));
        if (!manifest) continue;
        const installPath = manifest.installdir
          ? path.join(steamappsDir, "common", manifest.installdir)
          : null;
        games.push({ ...manifest, installPath, libraryFolder: folder });
      } catch {
        // einzelne beschädigte/unlesbare Manifest-Datei überspringen
      }
    }
  }

  return { installed: true, games };
}

/** Liest den aktuellen Download-/Update-Fortschritt eines einzelnen Spiels erneut aus (zum Pollen) */
function getGameProgress(appid) {
  const steamPath = getSteamPath();
  if (!steamPath) return null;
  const libraryFolders = getLibraryFolders(steamPath);

  for (const folder of libraryFolders) {
    const manifestPath = path.join(folder, "steamapps", `appmanifest_${appid}.acf`);
    if (fs.existsSync(manifestPath)) {
      const manifest = parseAppManifest(manifestPath);
      if (manifest) return manifest;
    }
  }
  return null;
}

module.exports = {
  getSteamPath,
  scanInstalledGames,
  getGameProgress,
};
