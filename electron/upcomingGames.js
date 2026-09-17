/**
 * Neuerscheinungen-Liste ("Demnächst & aktuell" auf Home).
 *
 * WICHTIG - hier die eigene Feed-URL eintragen:
 * Diese URL ist bewusst fest im Code hinterlegt (nicht pro Nutzer
 * einstellbar), damit ALLE Personen, die den Launcher herunterladen,
 * automatisch dieselbe, von dir gepflegte Liste sehen - ohne dass irgendwer
 * manuell etwas einstellen muss. Du aktualisierst einfach die JSON-Datei in
 * deinem eigenen GitHub-Repo, und jede installierte Kopie von Avis zieht
 * sich bei jedem Öffnen von Home automatisch die neueste Version.
 *
 * So kommst du an die richtige URL:
 * 1. Datei (z.B. "upcoming-games.json") in ein eigenes GitHub-Repo hochladen.
 * 2. Datei im Repo öffnen -> Button "Raw" -> die URL aus der Adresszeile
 *    kopieren (sieht aus wie unten im Beispiel).
 * 3. Diese URL unten bei FEED_URL eintragen.
 */
const FEED_URL =
  "https://raw.githubusercontent.com/DEIN-GITHUB-NUTZERNAME/DEIN-REPO/main/upcoming-games.json";

/**
 * Erwartetes Format der JSON-Datei (ein Array von Objekten):
 * [
 *   {
 *     "id": "gta6",
 *     "name": "Grand Theft Auto VI",
 *     "releaseDate": "2026-11-19",           // ISO-Datum ODER null
 *     "releaseLabel": null,                   // Text-Alternative, z.B. "Noch kein Datum"
 *     "tag": "Open World",
 *     "coverUrl": "https://.../cover.jpg",
 *     "sellerLabel": "Key bei Instant Gaming",
 *     "sellerUrl": "https://www.instant-gaming.com/..."
 *   }
 * ]
 *
 * Läuft ein Abruf schief (kein Internet, Datei kaputt), wird automatisch
 * die zuletzt erfolgreich geladene Version aus dem lokalen Cache verwendet,
 * damit der Bereich nie einfach leer/kaputt aussieht.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const CACHE_PATH = path.join(os.homedir(), ".avis-launcher", "upcoming-games-cache.json");

const FALLBACK_GAMES = [
  {
    id: "witcher3-remastered",
    name: "The Witcher 3: Wild Hunt - Remastered",
    releaseDate: null,
    releaseLabel: "Bereits erschienen",
    tag: "Remaster",
    coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg",
    sellerLabel: "Key bei Instant Gaming",
    sellerUrl: "https://www.instant-gaming.com/en/search/?query=the+witcher+3+wild+hunt",
  },
  {
    id: "hollow-knight-silksong",
    name: "Hollow Knight: Silksong",
    releaseDate: null,
    releaseLabel: "Bereits erschienen",
    tag: "Metroidvania",
    coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1030300/library_600x900.jpg",
    sellerLabel: "Key bei Instant Gaming",
    sellerUrl: "https://www.instant-gaming.com/en/search/?query=hollow+knight+silksong",
  },
];

function ensureDir() {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
}

function readCache() {
  if (!fs.existsSync(CACHE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function writeCache(games) {
  ensureDir();
  fs.writeFileSync(CACHE_PATH, JSON.stringify(games, null, 2));
}

/** Grobe Validierung/Bereinigung - eine kaputte Zeile in der gepflegten JSON
 * soll nicht die ganze Liste zum Absturz bringen. */
function sanitize(rawList) {
  if (!Array.isArray(rawList)) throw new Error("Erwartet wird ein JSON-Array.");
  return rawList
    .filter((entry) => entry && typeof entry.name === "string" && entry.name.trim())
    .map((entry, i) => ({
      id: typeof entry.id === "string" && entry.id ? entry.id : `entry-${i}`,
      name: entry.name,
      releaseDate: typeof entry.releaseDate === "string" ? entry.releaseDate : null,
      releaseLabel: typeof entry.releaseLabel === "string" ? entry.releaseLabel : null,
      tag: typeof entry.tag === "string" ? entry.tag : "",
      coverUrl: typeof entry.coverUrl === "string" ? entry.coverUrl : null,
      sellerLabel: typeof entry.sellerLabel === "string" ? entry.sellerLabel : "Key ansehen",
      sellerUrl: typeof entry.sellerUrl === "string" ? entry.sellerUrl : null,
    }));
}

async function getUpcomingGames() {
  if (FEED_URL.includes("DEIN-GITHUB-NUTZERNAME")) {
    // Noch nicht konfiguriert - Beispieldaten zeigen statt einen Fehler zu werfen
    return { games: FALLBACK_GAMES, source: "fallback" };
  }

  try {
    const response = await fetch(FEED_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const games = sanitize(data);
    writeCache(games);
    return { games, source: "remote" };
  } catch (error) {
    const cached = readCache();
    return {
      games: cached ?? FALLBACK_GAMES,
      source: cached ? "cache" : "fallback",
      error: error.message,
    };
  }
}

module.exports = { getUpcomingGames };
