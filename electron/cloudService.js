const fs = require("fs");
const os = require("os");
const path = require("path");
const archiver = require("archiver");
const extractZip = require("extract-zip");
const { randomUUID } = require("crypto");
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

/**
 * ---------------------------------------------------------------------------
 * CLOUD-SERVICE (direkte S3-Anbindung)
 * ---------------------------------------------------------------------------
 * Funktioniert mit jedem S3-kompatiblen Anbieter (Hetzner Object Storage,
 * IONOS Object Storage, AWS S3, Backblaze B2, Wasabi, ...). Der Nutzer muss
 * dafür ausschließlich Endpoint, Region, Bucket, Access Key und Secret Key
 * in den App-Einstellungen eintragen - keine externe rclone-Installation
 * oder CLI-Konfiguration mehr nötig.
 * ---------------------------------------------------------------------------
 */

const CONFIG_PATH = path.join(os.homedir(), ".avis-launcher", "cloud-config.json");
const STAGING_DIR = path.join(os.homedir(), ".avis-launcher", "staging");

/** Aktive Transfers (Upload-Instanzen oder AbortController), um sie abbrechen zu können */
const activeTransfers = new Map();

function ensureDirs() {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.mkdirSync(STAGING_DIR, { recursive: true });
}

const DEFAULT_CONFIG = {
  endpoint: "",
  region: "eu-central-1",
  bucket: "",
  accessKeyId: "",
  secretAccessKey: "",
  forcePathStyle: true,
  remotePath: "games",
};

function getCloudConfig() {
  ensureDirs();
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return { ...DEFAULT_CONFIG };
  }
  const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  return { ...DEFAULT_CONFIG, ...saved };
}

function saveCloudConfig(partialConfig) {
  ensureDirs();
  const merged = { ...getCloudConfig(), ...partialConfig };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
  return merged;
}

function isConfigComplete(config) {
  return Boolean(config.endpoint && config.bucket && config.accessKeyId && config.secretAccessKey);
}

function buildClient(config) {
  return new S3Client({
    region: config.region || "eu-central-1",
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle !== false,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Hetzner, IONOS & Co. unterstützen die neuen, seit SDK-Version 3.729
    // standardmäßig aktivierten x-amz-checksum-Header nicht - das führt
    // sonst zu nichtssagenden "UnknownError"-Antworten. WHEN_REQUIRED
    // stellt das alte, kompatible Verhalten wieder her.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

/** Testet die Zugangsdaten, indem der Bucket-Inhalt (max. 1 Objekt) gelistet wird */
async function testConnection() {
  const config = getCloudConfig();
  if (!isConfigComplete(config)) {
    throw new Error("Bitte zuerst Endpoint, Bucket, Access Key und Secret Key ausfüllen.");
  }
  const client = buildClient(config);
  await client.send(new ListObjectsV2Command({ Bucket: config.bucket, MaxKeys: 1 }));
  return { success: true };
}

/** Formatiert Bytes/Sekunde bzw. Bytes menschenlesbar */
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond || bytesPerSecond <= 0) return "";
  return `${formatBytes(bytesPerSecond)}/s`;
}

function formatEta(seconds) {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return "";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.ceil(seconds % 60);
  return `${minutes}m ${rest}s`;
}

/** Kleiner Tracker, um aus Byte-Deltas eine Geschwindigkeit/ETA abzuleiten */
/**
 * Erzeugt einen Geschwindigkeits-/ETA-Tracker mit Glättung (exponentieller
 * gleitender Durchschnitt). Ohne Glättung sprang die Anzeige stark, weil der
 * S3-Upload in mehreren parallelen Teilstücken läuft: werden kurz hinter-
 * einander mehrere Teile fertig, wirkt es kurz extrem schnell, in der Pause
 * danach dann extrem langsam - beides sind nur Momentaufnahmen, keine
 * echten Geschwindigkeitsänderungen.
 */
function createSpeedTracker(totalBytes) {
  let lastTime = Date.now();
  let lastBytes = 0;
  let smoothedSpeed = 0;
  const SMOOTHING = 0.25; // niedriger = ruhiger, höher = reagiert schneller auf echte Änderungen

  return (loadedBytes) => {
    const now = Date.now();
    const deltaTime = (now - lastTime) / 1000;
    const deltaBytes = loadedBytes - lastBytes;
    lastTime = now;
    lastBytes = loadedBytes;

    // Sehr knapp aufeinanderfolgende Events (Rauschen) ignorieren
    if (deltaTime > 0.05) {
      const instantSpeed = deltaBytes / deltaTime;
      smoothedSpeed =
        smoothedSpeed === 0 ? instantSpeed : smoothedSpeed * (1 - SMOOTHING) + instantSpeed * SMOOTHING;
    }

    const remaining = totalBytes - loadedBytes;
    const eta = smoothedSpeed > 0 ? remaining / smoothedSpeed : 0;
    return {
      percent: totalBytes ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : 0,
      transferred: formatBytes(loadedBytes),
      total: formatBytes(totalBytes),
      speed: formatSpeed(smoothedSpeed),
      eta: formatEta(eta),
    };
  };
}

/**
 * Packt einen Spielordner als .zip in das Staging-Verzeichnis.
 * - Wird ab dem allerersten Moment in activeTransfers registriert, damit ein
 *   Abbruch auch WÄHREND des Zippens funktioniert (vorher war das nur ab dem
 *   eigentlichen Upload möglich - Ursache für "hängt fest, nicht abbrechbar").
 * - Nutzt Store-Modus (keine Kompression): Spieldateien (.pak, Videos, Audio,
 *   bereits gepackte Assets) sind fast immer schon komprimiert, echtes
 *   Zip-Deflate bringt kaum Platzersparnis, kostet aber sehr viel Zeit/CPU.
 *   Store-Modus ist um ein Vielfaches schneller.
 * - Fortschritt wird anhand verarbeiteter Bytes berechnet, nicht anhand der
 *   Dateianzahl - bei wenigen großen Dateien blieb der alte Wert sonst lange
 *   bei 0% hängen und sah "eingefroren" aus.
 */
/** Ermittelt die tatsächliche Gesamtgröße eines Ordners rekursiv (nur Metadaten, liest keine Dateiinhalte) */
async function getFolderSizeBytes(dirPath) {
  let total = 0;
  let entries;
  try {
    entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += await getFolderSizeBytes(fullPath);
    } else if (entry.isFile()) {
      try {
        const stat = await fs.promises.stat(fullPath);
        total += stat.size;
      } catch {
        // einzelne nicht lesbare Datei überspringen, Rest trotzdem zählen
      }
    }
  }
  return total;
}


async function compressFolder(sourceFolder, gameId, transferId, onProgress, strongCompression) {
  if (!sourceFolder || !fs.existsSync(sourceFolder)) {
    throw new Error(`Spielordner nicht gefunden: "${sourceFolder || "(leer)"}". Bitte in "Bearbeiten" einen gültigen Ordner hinterlegen.`);
  }

  // Gesamtgröße VOR dem eigentlichen Zippen ermitteln. Archiver kennt beim
  // Start nur die Dateien, die es bereits per Verzeichnis-Scan entdeckt hat -
  // dadurch schoss die Prozentanzeige früher fälschlich sofort auf ~99% und
  // blieb dort lange stehen, obwohl im Hintergrund noch gearbeitet wurde.
  if (onProgress) onProgress({ phase: "compressing", percent: 0 });
  const knownTotalBytes = await getFolderSizeBytes(sourceFolder);

  return new Promise((resolve, reject) => {
    ensureDirs();
    const archivePath = path.join(STAGING_DIR, `${gameId}.zip`);
    const output = fs.createWriteStream(archivePath);
    const archive = strongCompression
      ? archiver("zip", { zlib: { level: 6 }, zip64: true })
      : archiver("zip", { store: true, zip64: true });

    let settled = false;
    const cleanupAndSettle = (fn, arg) => {
      if (settled) return;
      settled = true;
      activeTransfers.delete(transferId);
      fn(arg);
    };

    // Ab sofort abbrechbar registrieren - noch bevor überhaupt eine Datei
    // gelesen wurde.
    activeTransfers.set(transferId, {
      abort: () => {
        clearInterval(progressInterval);
        archive.abort();
        output.destroy();
        cleanupAndSettle(reject, new Error("Vorgang abgebrochen."));
        fs.rm(archivePath, { force: true }, () => {});
      },
    });

    // Fortschritt wird per Intervall direkt an den TATSÄCHLICH auf die
    // Zieldatei geschriebenen Bytes gemessen (output.bytesWritten). Das
    // 'progress'-Event von archiver selbst zählt Daten schon als
    // "verarbeitet", sobald sie in die interne Warteschlange gelangt sind -
    // das kann dem echten Schreibvorgang auf der Festplatte weit voraus-
    // eilen und sorgte für den Sprung auf ~99%, der dann lange stehen blieb.
    const progressInterval = setInterval(() => {
      if (!onProgress) return;
      const writtenBytes = output.bytesWritten || 0;
      const totalBytes = knownTotalBytes || 0;
      onProgress({
        phase: "compressing",
        percent: totalBytes ? Math.min(99, Math.round((writtenBytes / totalBytes) * 100)) : 0,
        transferred: formatBytes(writtenBytes),
        total: formatBytes(totalBytes),
      });
    }, 500);

    const stopProgressInterval = () => clearInterval(progressInterval);

    output.on("close", () => {
      stopProgressInterval();
      cleanupAndSettle(resolve, archivePath);
    });
    archive.on("error", (err) => {
      stopProgressInterval();
      cleanupAndSettle(reject, err);
    });
    output.on("error", (err) => {
      stopProgressInterval();
      cleanupAndSettle(reject, err);
    });

    archive.pipe(output);
    archive.directory(sourceFolder, false);
    archive.finalize();
  });
}

async function extractArchive(archivePath, targetFolder) {
  fs.mkdirSync(targetFolder, { recursive: true });
  await extractZip(archivePath, { dir: targetFolder });
}

/**
 * Lädt ein Spiel (Ordner) in die Cloud hoch: komprimieren -> S3 Multipart-Upload.
 * game = { id, name, installPath }
 */
async function uploadGame(game, browserWindow, options = {}) {
  const strongCompression = Boolean(options.strongCompression);
  const transferId = randomUUID();
  const send = (payload) =>
    browserWindow &&
    !browserWindow.isDestroyed() &&
    browserWindow.webContents.send("cloud:progress", {
      transferId,
      gameId: game.id,
      direction: "upload",
      ...payload,
    });

  const config = getCloudConfig();
  if (!isConfigComplete(config)) {
    const error = new Error("Cloud ist noch nicht konfiguriert. Bitte in den Einstellungen Zugangsdaten eintragen.");
    send({ phase: "error", error: error.message });
    throw error;
  }

  try {
    send({ phase: "compressing", percent: 0 });
    const archivePath = await compressFolder(game.installPath, game.id, transferId, send, strongCompression);
    const fileSize = fs.statSync(archivePath).size;
    const tracker = createSpeedTracker(fileSize);

    const client = buildClient(config);
    const key = `${config.remotePath || "games"}/${game.id}.zip`;

    const upload = new Upload({
      client,
      params: {
        Bucket: config.bucket,
        Key: key,
        Body: fs.createReadStream(archivePath),
      },
      queueSize: 4,
      partSize: 8 * 1024 * 1024,
    });
    activeTransfers.set(transferId, upload);

    upload.on("httpUploadProgress", (progress) => {
      const loaded = progress.loaded || 0;
      send({ phase: "uploading", ...tracker(loaded) });
    });

    send({ phase: "uploading", percent: 0 });
    await upload.done();
    activeTransfers.delete(transferId);

    fs.unlinkSync(archivePath);

    // Metadaten separat speichern, damit der Launcher das Spiel auch nach
    // lokalem Löschen noch identifizieren und anzeigen kann (Cloud-Browser).
    const metadataKey = `${config.remotePath || "games"}/${game.id}.json`;
    const metadata = {
      id: game.id,
      name: game.name,
      coverImage: game.coverImage || "",
      logoImage: game.logoImage || "",
      bannerImage: game.bannerImage || "",
      launchArgs: game.launchArgs || "",
      uploadedAt: new Date().toISOString(),
      sizeBytes: fileSize,
    };
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: metadataKey,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: "application/json",
      })
    );

    send({ phase: "done", percent: 100 });
    return { success: true, transferId };
  } catch (error) {
    activeTransfers.delete(transferId);
    const staleArchive = path.join(STAGING_DIR, `${game.id}.zip`);
    fs.rm(staleArchive, { force: true }, () => {});
    send({ phase: "error", error: error.message });
    throw error;
  }
}

/**
 * Lädt ein Spiel aus der Cloud herunter und entpackt es lokal.
 * game = { id, name, installPath }  (installPath = Zielordner)
 */
async function downloadGame(game, browserWindow) {
  const transferId = randomUUID();
  const send = (payload) =>
    browserWindow &&
    !browserWindow.isDestroyed() &&
    browserWindow.webContents.send("cloud:progress", {
      transferId,
      gameId: game.id,
      direction: "download",
      ...payload,
    });

  const config = getCloudConfig();
  if (!isConfigComplete(config)) {
    const error = new Error("Cloud ist noch nicht konfiguriert. Bitte in den Einstellungen Zugangsdaten eintragen.");
    send({ phase: "error", error: error.message });
    throw error;
  }

  try {
    ensureDirs();
    const client = buildClient(config);
    const key = `${config.remotePath || "games"}/${game.id}.zip`;
    const archivePath = path.join(STAGING_DIR, `${game.id}.zip`);

    const abortController = new AbortController();
    activeTransfers.set(transferId, abortController);

    send({ phase: "downloading", percent: 0 });
    const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }), {
      abortSignal: abortController.signal,
    });

    const totalBytes = response.ContentLength || 0;
    const tracker = createSpeedTracker(totalBytes);
    let loadedBytes = 0;

    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(archivePath);
      response.Body.on("data", (chunk) => {
        loadedBytes += chunk.length;
        send({ phase: "downloading", ...tracker(loadedBytes) });
      });
      response.Body.on("error", reject);
      writeStream.on("error", reject);
      writeStream.on("close", resolve);
      response.Body.pipe(writeStream);
    });

    activeTransfers.delete(transferId);

    send({ phase: "extracting", percent: 0 });
    await extractArchive(archivePath, game.installPath);
    fs.unlinkSync(archivePath);

    send({ phase: "done", percent: 100 });
    return { success: true, transferId };
  } catch (error) {
    activeTransfers.delete(transferId);
    send({ phase: "error", error: error.message });
    throw error;
  }
}

function cancelTransfer(transferId) {
  const handle = activeTransfers.get(transferId);
  if (!handle) return false;
  if (typeof handle.abort === "function") handle.abort();
  activeTransfers.delete(transferId);
  return true;
}

/**
 * Listet alle Spiele im Bucket auf (anhand der .json-Metadatendateien),
 * unabhängig davon, ob sie noch in der lokalen Bibliothek stehen. So lassen
 * sich auch lokal gelöschte, aber noch in der Cloud liegende Spiele anzeigen.
 */
async function listRemoteGames() {
  const config = getCloudConfig();
  if (!isConfigComplete(config)) return [];

  const client = buildClient(config);
  const prefix = `${config.remotePath || "games"}/`;
  const listResult = await client.send(
    new ListObjectsV2Command({ Bucket: config.bucket, Prefix: prefix })
  );

  const metadataKeys = (listResult.Contents || [])
    .map((obj) => obj.Key)
    .filter((key) => key.endsWith(".json"));

  const games = await Promise.all(
    metadataKeys.map(async (key) => {
      try {
        const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
        const bodyText = await streamToString(response.Body);
        return JSON.parse(bodyText);
      } catch (err) {
        return null;
      }
    })
  );

  return games.filter(Boolean);
}

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

/** Löscht ein Spiel endgültig aus der Cloud (Zip + Metadaten) */
async function deleteRemoteGame(gameId) {
  const config = getCloudConfig();
  if (!isConfigComplete(config)) {
    throw new Error("Cloud ist noch nicht konfiguriert.");
  }
  const client = buildClient(config);
  const prefix = config.remotePath || "games";
  await client.send(
    new DeleteObjectsCommand({
      Bucket: config.bucket,
      Delete: {
        Objects: [{ Key: `${prefix}/${gameId}.zip` }, { Key: `${prefix}/${gameId}.json` }],
      },
    })
  );
  return { success: true };
}

module.exports = {
  getCloudConfig,
  saveCloudConfig,
  isConfigComplete,
  testConnection,
  uploadGame,
  downloadGame,
  cancelTransfer,
  listRemoteGames,
  deleteRemoteGame,
};
