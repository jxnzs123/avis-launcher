const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * Optionaler Proxy NUR für den eingebauten Browser-Tab (Session-Partition
 * "persist:avisbrowser"). Wirkt nicht auf den Rest von Avis. Kein
 * mitgeliefertes VPN - falls der Nutzer bereits einen eigenen Proxy/VPN mit
 * lokalem SOCKS/HTTP-Endpunkt hat (z.B. von Proton, Mullvad o.ä.), kann er
 * ihn hier eintragen.
 */

const CONFIG_PATH = path.join(os.homedir(), ".avis-launcher", "browser-proxy.json");

function ensureDir() {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

function getConfig() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    const initial = { enabled: false, protocol: "socks5", host: "", port: "" };
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

/** Wendet die gespeicherte Proxy-Konfiguration auf die Browser-Session an (oder setzt sie zurück) */
async function applyToSession(browserSession) {
  const config = getConfig();
  if (config.enabled && config.host && config.port) {
    await browserSession.setProxy({
      proxyRules: `${config.protocol}://${config.host}:${config.port}`,
    });
  } else {
    await browserSession.setProxy({ proxyRules: "" }); // direkte Verbindung
  }
  return config;
}

module.exports = { getConfig, saveConfig, applyToSession };
