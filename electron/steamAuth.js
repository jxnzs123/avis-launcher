/**
 * "Mit Steam anmelden" - echter Login über Steams offizielles OpenID-Verfahren
 * (dasselbe, das auch viele andere Drittanbieter-Websites nutzen, z.B.
 * SteamDB oder Steam-Trade-Seiten). Das Passwort des Nutzers sieht Avis
 * dabei NIE - die Eingabe passiert komplett auf steamcommunity.com in einem
 * separaten Fenster, wir bekommen am Ende nur eine (kryptografisch
 * überprüfbare) Bestätigung "diese SteamID hat sich gerade erfolgreich
 * angemeldet" zurück.
 *
 * WICHTIG: OpenID bestätigt nur die Identität (SteamID), liefert aber keine
 * Profildetails wie Avatar oder Anzeigename. Dafür wird zusätzlich einmalig
 * die normale Steam Web API mit dem in steamService.js hinterlegten
 * APP-WEITEN API-Key abgefragt (siehe dort) - das ist unabhängig vom
 * persönlichen API-Key, den Nutzer optional für den Bibliotheks-Import
 * eintragen können.
 */

const { BrowserWindow } = require("electron");

const RETURN_TO = "https://avis-launcher.local/steam-callback";

function buildLoginUrl() {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": RETURN_TO,
    "openid.realm": RETURN_TO,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `https://steamcommunity.com/openid/login?${params.toString()}`;
}

function extractSteamId(claimedId) {
  const match = claimedId?.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/);
  return match ? match[1] : null;
}

/** Schickt die Antwort zurück an Steam zur Prüfung, ob die Signatur echt ist
 * (verhindert, dass jemand einfach eine gefälschte SteamID in der URL übergibt). */
async function verifyWithSteam(query) {
  const params = new URLSearchParams(query);
  params.set("openid.mode", "check_authentication");
  const response = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const text = await response.text();
  return text.includes("is_valid:true");
}

function loginWithSteam() {
  return new Promise((resolve, reject) => {
    let settled = false;

    const authWindow = new BrowserWindow({
      width: 500,
      height: 650,
      autoHideMenuBar: true,
      title: "Mit Steam anmelden",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // Dieselbe Partition wie der eingebettete Steam-Tab (SteamPanel.jsx)
        // - Login hier gilt dann auch dort, kein zweites Mal anmelden nötig.
        partition: "persist:avissteam",
      },
    });

    authWindow.loadURL(buildLoginUrl());

    async function handleCallback(url) {
      if (settled || !url.startsWith(RETURN_TO)) return;

      const query = Object.fromEntries(new URL(url).searchParams.entries());
      const steamId = extractSteamId(query["openid.claimed_id"]);

      if (!steamId) {
        settled = true;
        authWindow.close();
        return reject(new Error("Steam-Login fehlgeschlagen (keine SteamID erhalten)."));
      }

      const valid = await verifyWithSteam(query).catch(() => false);
      settled = true;
      authWindow.close();

      if (!valid) return reject(new Error("Steam-Antwort konnte nicht verifiziert werden."));
      resolve(steamId);
    }

    authWindow.webContents.on("will-redirect", (event, url) => {
      if (url.startsWith(RETURN_TO)) {
        event.preventDefault();
        handleCallback(url);
      }
    });
    authWindow.webContents.on("will-navigate", (event, url) => {
      if (url.startsWith(RETURN_TO)) {
        event.preventDefault();
        handleCallback(url);
      }
    });

    authWindow.on("closed", () => {
      if (!settled) {
        settled = true;
        reject(new Error("Anmeldung abgebrochen."));
      }
    });
  });
}

module.exports = { loginWithSteam };
