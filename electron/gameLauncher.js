const { execFile } = require("child_process");
const path = require("path");
const discordRpc = require("./discordRpc");
const { launchSteamGame } = require("./steamManager");

/** Map<gameId, ChildProcess> laufender Spiele, um Doppelstarts zu verhindern */
const runningProcesses = new Map();

/**
 * Startet eine lokale .exe. Gibt sofort zurück, ob der Start ausgelöst wurde;
 * das eigentliche Prozessende wird per Event ("game:exit") an das Fenster gemeldet.
 *
 * Steam-Spiele (game.source === "steam") werden an steamManager.js delegiert
 * - siehe dort für die ausführliche, ehrliche Erklärung der Grenzen.
 */
function launchGame(game, browserWindow) {
  return new Promise(async (resolve, reject) => {
    if (game?.source === "steam") {
      if (!game.steamAppId) {
        return reject(new Error("Keine Steam-App-ID hinterlegt."));
      }
      try {
        const result = await launchSteamGame(game.steamAppId);
        resolve(result);
      } catch (err) {
        reject(err);
      }
      return;
    }

    if (!game?.executablePath) {
      return reject(new Error("Kein Executable-Pfad hinterlegt."));
    }
    if (runningProcesses.has(game.id)) {
      return reject(new Error("Spiel läuft bereits."));
    }

    const workingDir = path.dirname(game.executablePath);
    const args = game.launchArgs ? game.launchArgs.split(" ").filter(Boolean) : [];
    const startedAt = Date.now();

    const child = execFile(
      game.executablePath,
      args,
      { cwd: workingDir, windowsHide: false },
      (error) => {
        runningProcesses.delete(game.id);
        discordRpc.setActivity({ details: "Im Avis Launcher" }); // zurück auf Leerlauf
        const exitPayload = {
          gameId: game.id,
          success: !error,
          error: error ? error.message : null,
        };
        if (browserWindow && !browserWindow.isDestroyed()) {
          browserWindow.webContents.send("game:exit", exitPayload);
        }
      }
    );

    discordRpc.setActivity({
      details: `Spielt ${game.name}`,
      startTimestamp: startedAt,
    });

    runningProcesses.set(game.id, child);
    resolve({ started: true, pid: child.pid });
  });
}

function isRunning(gameId) {
  return runningProcesses.has(gameId);
}

module.exports = { launchGame, isRunning };
