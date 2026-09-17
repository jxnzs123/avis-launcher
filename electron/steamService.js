/**
 * Steam-Integration über die offizielle Steam Web API.
 *
 * Der Nutzer braucht dafür zwei eigene, kostenlose Dinge:
 * 1. Einen Web-API-Key: https://steamcommunity.com/dev/apikey
 * 2. Seine eigene 64-Bit-SteamID (z.B. über https://steamid.io/ ermittelbar)
 *
 * WICHTIG - Grenzen dieser Integration (bewusst transparent, keine
 * Über-Versprechen):
 * - Profile, Spielelisten und Achievements sind nur einsehbar, wenn das
 *   jeweilige Steam-Profil (bzw. dessen Spieledetails) auf "öffentlich"
 *   steht. Bei privaten Profilen liefert die API keinen Fehler, sondern
 *   einfach leere/fehlende Daten - das ist eine Einschränkung der Steam-API
 *   selbst, nicht von Avis.
 * - Es gibt KEINE Steam-Suche nach Namen über die offizielle API. Andere
 *   Profile lassen sich nur über ihre SteamID64 oder ihren individuellen
 *   Profil-Namen ("Vanity-URL", der Teil nach /id/... in der Profil-URL)
 *   nachschlagen.
 * - Gestartet werden Steam-Spiele über "steam://rungameid/<id>". Das
 *   startet IMMER den Steam-Client mit (siehe gameLauncher.js) - es gibt
 *   keinen legitimen Weg, das bei regulären Steam-Spielen zu umgehen.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");

const STEAM_API_BASE = "https://api.steampowered.com";
const CONFIG_PATH = path.join(os.homedir(), ".avis-launcher", "steam-config.json");

/**
 * Ermittelt, welche Steam-App-IDs auf DIESEM PC tatsächlich installiert
 * sind - die Steam Web API selbst kann das nicht sagen (GetOwnedGames
 * liefert ALLES, was der Account besitzt, egal ob installiert oder nicht).
 * Dafür wird direkt in Steams eigenen lokalen Ordnern nachgesehen: jedes
 * installierte Spiel hinterlässt eine "appmanifest_<id>.acf"-Datei in
 * einem "steamapps"-Ordner.
 *
 * Best-Effort: prüft den Standard-Installationspfad plus alle zusätzlichen
 * Bibliotheksordner (z.B. auf einer zweiten Festplatte), die in Steams
 * eigener "libraryfolders.vdf" eingetragen sind. Findet Avis den
 * Steam-Ordner gar nicht (z.B. weil an einen ungewöhnlichen Ort
 * installiert), werden alle Spiele vorsichtshalber als "nicht bestätigt
 * installiert" behandelt statt fälschlich als installiert.
 */
function findSteamLibraryFolders() {
  const candidates = [
    "C:\\Program Files (x86)\\Steam",
    "C:\\Program Files\\Steam",
  ];
  const steamRoot = candidates.find((p) => fs.existsSync(path.join(p, "steamapps")));
  if (!steamRoot) return [];

  const folders = [path.join(steamRoot, "steamapps")];

  const vdfPath = path.join(steamRoot, "steamapps", "libraryfolders.vdf");
  try {
    const content = fs.readFileSync(vdfPath, "utf-8");
    // Einfaches Herausziehen von "path"-Einträgen aus der VDF-Datei, ohne
    // einen vollen VDF-Parser zu brauchen - das Format ist dafür simpel genug.
    const matches = [...content.matchAll(/"path"\s*"([^"]+)"/g)];
    matches.forEach((m) => {
      const libPath = path.join(m[1].replace(/\\\\/g, "\\"), "steamapps");
      if (fs.existsSync(libPath)) folders.push(libPath);
    });
  } catch {
    // Keine zusätzlichen Bibliotheken gefunden - kein Problem, Standardordner reicht dann eben
  }

  return folders;
}

function getInstalledAppIds() {
  const folders = findSteamLibraryFolders();
  const installed = new Set();
  folders.forEach((folder) => {
    try {
      fs.readdirSync(folder)
        .filter((f) => /^appmanifest_\d+\.acf$/.test(f))
        .forEach((f) => installed.add(f.match(/\d+/)[0]));
    } catch {
      // Ordner nicht lesbar - überspringen
    }
  });
  return installed;
}

/**
 * URL deines Cloudflare-Worker-Proxys (siehe steam-profile-proxy-worker.js).
 * Der eigentliche Steam-API-Key steckt NICHT mehr hier im Code, sondern
 * ausschließlich als Secret im Worker selbst - dadurch kann niemand, der
 * die verteilte Avis-App auseinandernimmt, an deinen persönlichen Key
 * kommen. Der Login (steamAuth.js) selbst braucht sowieso keinen Key.
 */
const STEAM_PROFILE_PROXY_URL = "https://avis-steam-proxy.jonasmeiergmx.workers.dev";

/**
 * Muss EXAKT demselben Wert entsprechen, den du im Worker als
 * "CLIENT_SECRET"-Secret hinterlegt hast. Kein perfekter Schutz (steckt ja
 * auch hier im App-Code und ist technisch extrahierbar), hält aber
 * zufälliges/automatisiertes Fremdnutzen deines Workers ab. Der wichtigere
 * Schutz ist die Cloudflare-Rate-Limiting-Regel im Worker-Dashboard, siehe
 * Anleitung im Worker-Code.
 */
const STEAM_PROXY_CLIENT_SECRET = "0L1fhwWb-l-rVf7wt1bWQuVoWXRwgcU_sLZD2IAPX70";

/* ---------------------------------------------------------------------- */
/* Persistente Zugangsdaten (SteamID + API-Key merken, nicht jedes Mal neu
   eintippen müssen) + Login-Status                                        */
/* ---------------------------------------------------------------------- */
function ensureDir() {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

function getConfig() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    const initial = { steamId: "", apiKey: "", loggedInSteamId: "" };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

function saveConfig(partial) {
  ensureDir();
  const merged = { ...getConfig(), ...partial };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
  return merged;
}

/** Baut die Cover-URL aus Steams eigenem CDN (vertikales "Library Capsule"-Format) */
function coverUrlFor(appId) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
}

async function apiGet(endpoint, params) {
  const url = new URL(`${STEAM_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Steam-API-Fehler (${response.status}).`);
  return response.json();
}

/* ---------------------------------------------------------------------- */
/* Bibliotheks-Import                                                      */
/* ---------------------------------------------------------------------- */
async function getOwnedGames(steamId, apiKey) {
  if (!steamId || !apiKey) throw new Error("SteamID und API-Key werden beide benötigt.");

  const data = await apiGet("/IPlayerService/GetOwnedGames/v0001/", {
    key: apiKey,
    steamid: steamId,
    format: "json",
    include_appinfo: "true",
    include_played_free_games: "true",
  });

  const games = data?.response?.games ?? [];
  if (games.length === 0) {
    throw new Error(
      'Keine Spiele gefunden. Prüfe die SteamID und stelle sicher, dass deine Spieleliste in den Steam-Privatsphäre-Einstellungen auf "öffentlich" steht.'
    );
  }

  const installedAppIds = getInstalledAppIds();

  return games.map((g) => ({
    name: g.name,
    source: "steam",
    steamAppId: g.appid,
    // Nur als "installed" markieren, wenn wirklich eine lokale
    // appmanifest-Datei gefunden wurde - sonst "steam-owned" (im Account
    // vorhanden, aber nicht bestätigt auf diesem PC installiert).
    status: installedAppIds.has(String(g.appid)) ? "installed" : "steam-owned",
    category: "",
    coverImage: coverUrlFor(g.appid),
    playtimeMinutes: g.playtime_forever ?? 0,
  }));
}

/* ---------------------------------------------------------------------- */
/* Eingeloggtes Profil (nach "Mit Steam anmelden") - nutzt den App-Key,      */
/* nicht den optionalen persönlichen Key aus den Einstellungen.             */
/* ---------------------------------------------------------------------- */
async function getLoggedInProfile(steamId) {
  if (!steamId) return null;
  if (STEAM_PROFILE_PROXY_URL.includes("DEIN-WORKER-NAME")) {
    throw new Error(
      "Avis ist noch nicht für den Steam-Login konfiguriert (STEAM_PROFILE_PROXY_URL fehlt in steamService.js)."
    );
  }

  const response = await fetch(`${STEAM_PROFILE_PROXY_URL}?steamid=${steamId}`, {
    headers: { "x-avis-secret": STEAM_PROXY_CLIENT_SECRET },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Proxy-Fehler (${response.status}).`);
  }
  return data;
}

/**
 * Achievements eines Spiels für ein bestimmtes Profil. Braucht den
 * persönlichen API-Key (Einstellungen -> Spiele-Quellen), nicht den
 * App-weiten Proxy-Key oben (der ist nur für die Profil-Anzeige nach dem
 * Login gedacht). Funktioniert nur, wenn das Profil öffentlich ist bzw.
 * die Spieledetails nicht auf privat stehen - das ist eine Einschränkung
 * der Steam-API selbst.
 */
async function getAchievements(steamId, appId, apiKey, language = "en") {
  if (!steamId || !appId || !apiKey) {
    throw new Error("SteamID, App-ID und API-Key werden benötigt.");
  }

  // Steams eigene Sprachcodes weichen leicht von unseren ab (z.B. "german"
  // statt "de") - kleine Umsetzungstabelle statt alles hart zu verdrahten.
  const steamLang = { de: "german", en: "english" }[language] || "english";

  const [achievementsData, schemaData] = await Promise.all([
    apiGet("/ISteamUserStats/GetPlayerAchievements/v0001/", {
      key: apiKey,
      steamid: steamId,
      appid: appId,
      l: steamLang,
    }).catch(() => null),
    apiGet("/ISteamUserStats/GetSchemaForGame/v2/", {
      key: apiKey,
      appid: appId,
      l: steamLang,
    }).catch(() => null),
  ]);

  if (!achievementsData?.playerstats?.success) {
    throw new Error(
      achievementsData?.playerstats?.error ||
        "Achievements nicht abrufbar - entweder hat das Spiel keine, oder das Profil ist privat."
    );
  }

  const schemaByName = {};
  (schemaData?.game?.availableGameStats?.achievements ?? []).forEach((a) => {
    schemaByName[a.name] = a;
  });

  const achievements = (achievementsData.playerstats.achievements ?? []).map((a) => {
    const schema = schemaByName[a.apiname] ?? {};
    return {
      apiName: a.apiname,
      name: schema.displayName || a.apiname,
      description: schema.description || "",
      icon: a.achieved ? schema.icon : schema.icongray,
      achieved: !!a.achieved,
      unlockTime: a.unlocktime || null,
    };
  });

  const unlockedCount = achievements.filter((a) => a.achieved).length;

  return { achievements, unlockedCount, totalCount: achievements.length };
}

/**
 * Ermittelt den Pfad zur lokal installierten steam.exe aus der Windows-
 * Registrierung (HKCU\Software\Valve\Steam) statt eines geratenen festen
 * Pfads - funktioniert damit auch bei einer Installation an einem
 * ungewöhnlichen Ort. Wird für den direkten "-applaunch"-Start genutzt
 * (siehe gameLauncher.js), der ruhiger startet als das steam://-Protokoll.
 */
function getSteamExePath() {
  return new Promise((resolve) => {
    if (process.platform !== "win32") return resolve(null);

    execFile(
      "reg",
      ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamExe"],
      (error, stdout) => {
        if (!error) {
          const match = stdout.match(/SteamExe\s+REG_SZ\s+(.+)/i);
          if (match) return resolve(match[1].trim());
        }
        // Fallback: SteamPath (Ordner) + steam.exe zusammensetzen, falls
        // der SteamExe-Wert selbst nicht vorhanden ist.
        execFile(
          "reg",
          ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"],
          (err2, stdout2) => {
            if (err2) return resolve(null);
            const match2 = stdout2.match(/SteamPath\s+REG_SZ\s+(.+)/i);
            if (!match2) return resolve(null);
            resolve(path.join(match2[1].trim(), "steam.exe"));
          }
        );
      }
    );
  });
}

module.exports = {
  getConfig,
  saveConfig,
  getOwnedGames,
  getLoggedInProfile,
  findSteamLibraryFolders,
  getSteamExePath,
  getAchievements,
};
