const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * Einfacher, domainbasierter Werbeblocker - blockiert Anfragen an bekannte
 * Werbe-/Tracking-Domains über Electrons webRequest-API. Kein vollständiger
 * Filterlisten-Abgleich wie uBlock Origin, aber deckt die häufigsten
 * Werbenetzwerke/Tracker ab. Wirkt NUR auf die Browser-Tab-Session, nicht
 * auf Discord oder den Rest der App.
 */

const CONFIG_PATH = path.join(os.homedir(), ".avis-launcher", "adblock-config.json");

const BLOCKED_DOMAINS = [
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "adservice.google.com",
  "google-analytics.com",
  "googletagmanager.com",
  "adnxs.com",
  "taboola.com",
  "outbrain.com",
  "criteo.com",
  "criteo.net",
  "scorecardresearch.com",
  "moatads.com",
  "amazon-adsystem.com",
  "advertising.com",
  "adform.net",
  "pubmatic.com",
  "rubiconproject.com",
  "openx.net",
  "casalemedia.com",
  "quantserve.com",
  "bluekai.com",
  "adsrvr.org",
  "media.net",
  "yieldmo.com",
  "static.doubleclick.net",
  "googleads.g.doubleclick.net",
];

/**
 * Zusätzliche, pfadbasierte Muster - wichtig für YouTube, da dort viele
 * Werbe-Anfragen technisch über youtube.com selbst laufen (nicht über eine
 * separate Werbe-Domain) und daher per reiner Domain-Sperrliste nicht zu
 * erwischen sind. Kein Anspruch auf vollständiges Blocken jeder einzelnen
 * Videowerbung (YouTube erschwert das bewusst und ändert es laufend) -
 * reduziert aber sichtbar Banner-/Pre-/Mid-Roll-Anfragen.
 */
const BLOCKED_PATH_PATTERNS = [
  "youtube.com/api/stats/ads",
  "youtube.com/pagead/",
  "youtube.com/ptracking",
  "youtube.com/get_midroll_info",
  "youtube.com/api/stats/qoe?",
  "youtubei.googleapis.com/youtubei/v1/log_event",
];

function ensureDir() {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

function getConfig() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    const initial = { enabled: true };
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

/** Registriert bzw. entfernt den Anfragen-Filter je nach gespeicherter Einstellung */
function applyToSession(browserSession) {
  const config = getConfig();

  if (config.enabled) {
    browserSession.webRequest.onBeforeRequest({ urls: ["*://*/*"] }, (details, callback) => {
      const blocked =
        BLOCKED_DOMAINS.some((domain) => details.url.includes(domain)) ||
        BLOCKED_PATH_PATTERNS.some((pattern) => details.url.includes(pattern));
      callback({ cancel: blocked });
    });
  } else {
    browserSession.webRequest.onBeforeRequest(null);
  }

  return config;
}

module.exports = { getConfig, saveConfig, applyToSession };
