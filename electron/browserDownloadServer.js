const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

/**
 * ---------------------------------------------------------------------------
 * BROWSER-DOWNLOAD-INTEGRATION
 * ---------------------------------------------------------------------------
 * Ein winziger lokaler HTTP-Server (nur an 127.0.0.1 gebunden, nie im
 * Netzwerk erreichbar), an den die Avis-Browser-Erweiterung Download-Events
 * meldet (gestartet/Fortschritt/fertig). Abgesichert per Zufalls-Token, das
 * einmalig in die Erweiterungs-Einstellungen eingetragen wird - ohne
 * korrekten Token werden Anfragen abgelehnt.
 * ---------------------------------------------------------------------------
 */

const CONFIG_PATH = path.join(os.homedir(), ".avis-launcher", "browser-integration.json");
const DEFAULT_PORT = 8721;

let server = null;

function ensureDir() {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

function getConfig() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    const initial = { enabled: false, port: DEFAULT_PORT, token: crypto.randomBytes(16).toString("hex") };
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

function regenerateToken() {
  return saveConfig({ token: crypto.randomBytes(16).toString("hex") });
}

/** Startet den lokalen Server. onEvent(payload) wird bei jedem Download-Event aufgerufen. */
function startServer(onEvent) {
  if (server) return getConfig();
  const config = getConfig();

  server = http.createServer((req, res) => {
    // CORS: nur für die Erweiterung gedacht, aber harmlos offen für localhost-Herkunft
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== "POST" || req.url !== "/download-event") {
      res.writeHead(404);
      res.end();
      return;
    }

    const authHeader = req.headers["authorization"] || "";
    const providedToken = authHeader.replace(/^Bearer\s+/i, "");
    const current = getConfig();
    if (!current.enabled || providedToken !== current.token) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Ungültiges oder fehlendes Token." }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        onEvent(payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Ungültiges JSON." }));
      }
    });
  });

  server.listen(config.port, "127.0.0.1");
  return config;
}

function stopServer() {
  if (server) {
    server.close();
    server = null;
  }
}

function isRunning() {
  return Boolean(server);
}

module.exports = {
  getConfig,
  saveConfig,
  regenerateToken,
  startServer,
  stopServer,
  isRunning,
};
