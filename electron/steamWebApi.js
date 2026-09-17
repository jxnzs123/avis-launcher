const fs = require("fs");
const os = require("os");
const path = require("path");

const CONFIG_PATH = path.join(os.homedir(), ".avis-launcher", "steam-api-config.json");

function ensureDir() {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

const DEFAULT_CONFIG = { apiKey: "", steamId64: "" };

function getSteamApiConfig() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return { ...DEFAULT_CONFIG };
  }
  return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) };
}

function saveSteamApiConfig(partial) {
  ensureDir();
  const merged = { ...getSteamApiConfig(), ...partial };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
  return merged;
}

/**
 * Holt ALLE Spiele, die der Steam-Account besitzt (installiert oder nicht),
 * inkl. Steams eigener Gesamt-Spielzeit. Braucht einen kostenlosen API-Key
 * (steamcommunity.com/dev/apikey) und die eigene SteamID64. Das Profil muss
 * auf "Spieldetails öffentlich" stehen, sonst liefert Steam eine leere Liste.
 */
async function fetchOwnedGames() {
  const { apiKey, steamId64 } = getSteamApiConfig();
  if (!apiKey || !steamId64) {
    throw new Error("Kein Steam API-Key bzw. keine SteamID64 hinterlegt.");
  }
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(
    apiKey
  )}&steamid=${encodeURIComponent(steamId64)}&include_appinfo=true&include_played_free_games=true&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "API-Key ungültig."
        : `Steam-API antwortete mit HTTP ${response.status}.`
    );
  }
  const data = await response.json();
  const games = data.response?.games;
  if (!games) {
    throw new Error(
      "Keine Spiele erhalten - ist dein Steam-Profil auf 'Spieldetails öffentlich' gestellt?"
    );
  }
  return games.map((g) => ({
    appid: String(g.appid),
    name: g.name,
    playtimeMinutes: g.playtime_forever || 0,
  }));
}

/** Entfernt HTML-Tags aus Steams Store-Texten für eine saubere Klartext-Beschreibung */
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Öffentliche Steam-Storefront-API (appdetails) - braucht KEINEN API-Key.
 * Liefert Beschreibung, Systemanforderungen und Release-Datum automatisch.
 * Achtung: von Steam rate-limitiert, daher beim Aufrufer immer mit Pause
 * zwischen mehreren Anfragen verwenden (siehe steam:getAppDetails-Nutzung).
 */
async function fetchAppDetails(appid, language = "german") {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=${language}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const entry = data[String(appid)];
  if (!entry?.success || !entry.data) return null;

  const d = entry.data;
  const requirements = d.pc_requirements?.minimum ? stripHtml(d.pc_requirements.minimum) : "";
  const shortDesc = d.short_description ? stripHtml(d.short_description) : "";

  return {
    description: [shortDesc, requirements].filter(Boolean).join("\n\n"),
    releaseDate: d.release_date?.date || "",
    headerImage: d.header_image || "",
  };
}

module.exports = {
  getSteamApiConfig,
  saveSteamApiConfig,
  fetchOwnedGames,
  fetchAppDetails,
};
