/**
 * Optionale Sicherheitsprüfung von Downloads über die offizielle
 * VirusTotal-API (v3). Der Nutzer braucht dafür einen eigenen, kostenlosen
 * API-Key: https://www.virustotal.com/gui/my-apikey
 *
 * Bewusste Design-Entscheidung: Es wird NUR ein Hash-Abgleich gemacht
 * (Datei wird lokal gehasht, dann wird nachgefragt, ob dieser Hash bei
 * VirusTotal bereits bekannt ist) - die Datei selbst wird NICHT
 * hochgeladen. Gründe:
 * 1. Der kostenlose VirusTotal-Plan begrenzt Datei-Uploads auf 32 MB -
 *    für Spiele-Installer völlig unrealistisch.
 * 2. Ein Hash-Abgleich reicht für bereits bekannte Schadsoftware oder
 *    bereits verifiziert saubere, verbreitete Dateien.
 * 3. Ist der Hash unbekannt, heißt das NICHT zwangsläufig "gefährlich" -
 *    es kann schlicht eine neue/seltene Datei sein. Für diesen Fall wird
 *    ein Link zur manuellen Prüfung auf virustotal.com angeboten.
 */

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CONFIG_PATH = path.join(os.homedir(), ".avis-launcher", "virustotal-config.json");
const VT_API_BASE = "https://www.virustotal.com/api/v3";

function ensureDir() {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

function getConfig() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    const initial = { apiKey: "" };
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

/** SHA-256-Hash einer Datei berechnen, streamend (auch bei großen Installern kein Speicherproblem) */
function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

async function scanFile(filePath) {
  const { apiKey } = getConfig();
  if (!apiKey) {
    return { status: "no-key" };
  }
  if (!fs.existsSync(filePath)) {
    return { status: "error", message: "Datei nicht gefunden." };
  }

  const sha256 = await hashFile(filePath);

  const response = await fetch(`${VT_API_BASE}/files/${sha256}`, {
    headers: { "x-apikey": apiKey },
  });

  if (response.status === 404) {
    return { status: "unknown", sha256, reportUrl: `https://www.virustotal.com/gui/file/${sha256}` };
  }
  if (!response.ok) {
    return { status: "error", message: `VirusTotal-Fehler (${response.status}).`, sha256 };
  }

  const data = await response.json();
  const stats = data?.data?.attributes?.last_analysis_stats ?? {};
  const malicious = stats.malicious ?? 0;
  const suspicious = stats.suspicious ?? 0;

  return {
    status: malicious > 0 ? "malicious" : suspicious > 0 ? "suspicious" : "clean",
    sha256,
    malicious,
    suspicious,
    harmless: stats.harmless ?? 0,
    reportUrl: `https://www.virustotal.com/gui/file/${sha256}`,
  };
}

module.exports = { getConfig, saveConfig, scanFile };
