const net = require("net");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

/**
 * ---------------------------------------------------------------------------
 * DISCORD RICH PRESENCE
 * ---------------------------------------------------------------------------
 * Verbindet sich direkt über Discords eigenes, lokales IPC-Protokoll (eine
 * Named Pipe unter Windows) - ganz ohne zusätzliches npm-Paket. Braucht eine
 * kostenlose "Application" im Discord Developer Portal
 * (discord.com/developers/applications) für die Client-ID.
 *
 * Protokoll: 8-Byte-Header (Opcode + Länge, beides Int32 Little-Endian)
 * gefolgt von JSON. Opcode 0 = Handshake, 1 = Frame (Befehle), 2 = Close.
 * ---------------------------------------------------------------------------
 */

const CONFIG_PATH = path.join(os.homedir(), ".avis-launcher", "discord-config.json");
const PIPE_PATH = "\\\\.\\pipe\\discord-ipc-0"; // Windows; macOS/Linux nutzen einen Unix-Socket im Temp-Ordner

let socket = null;
let currentConfig = null;

function ensureDir() {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

function getConfig() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    const initial = { enabled: false, clientId: "" };
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

function buildFrame(opcode, payload) {
  const json = Buffer.from(JSON.stringify(payload), "utf-8");
  const header = Buffer.alloc(8);
  header.writeInt32LE(opcode, 0);
  header.writeInt32LE(json.length, 4);
  return Buffer.concat([header, json]);
}

function getStatus() {
  return socket && !socket.destroyed ? "connected" : "disconnected";
}

/** Baut die Verbindung zu Discord auf und schickt den Handshake */
function connect(onStatusChange) {
  const config = getConfig();
  currentConfig = config;
  if (!config.enabled || !config.clientId) return;
  if (socket && !socket.destroyed) return; // schon verbunden

  const targetPath = process.platform === "win32" ? PIPE_PATH : path.join(os.tmpdir(), "discord-ipc-0");

  const newSocket = net.connect(targetPath);
  socket = newSocket;

  newSocket.on("connect", () => {
    newSocket.write(buildFrame(0, { v: 1, client_id: config.clientId }));
    onStatusChange?.("connected");
  });

  newSocket.on("error", () => {
    // Discord läuft vermutlich nicht - kein Absturz, einfach getrennt bleiben
    socket = null;
    onStatusChange?.("disconnected");
  });

  newSocket.on("close", () => {
    socket = null;
    onStatusChange?.("disconnected");
  });
}

function disconnect() {
  if (socket) {
    socket.end();
    socket = null;
  }
}

/**
 * Setzt den aktuell angezeigten Status. `details`/`state` sind die beiden
 * Textzeilen, die bei Discord unter dem Nutzernamen erscheinen.
 */
function setActivity({ details, state, startTimestamp } = {}) {
  if (!socket || socket.destroyed) return;
  const activity = {
    details: details || "Im Avis Launcher",
    ...(state ? { state } : {}),
    ...(startTimestamp ? { timestamps: { start: startTimestamp } } : {}),
  };

  socket.write(
    buildFrame(1, {
      cmd: "SET_ACTIVITY",
      args: { pid: process.pid, activity },
      nonce: crypto.randomUUID(),
    })
  );
}

module.exports = {
  getConfig,
  saveConfig,
  connect,
  disconnect,
  setActivity,
  getStatus,
};
