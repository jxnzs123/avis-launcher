import React, { useEffect, useMemo, useState } from "react";
import TopBar from "./components/TopBar.jsx";
import UpdateBanner from "./components/UpdateBanner.jsx";
import HeroBackground from "./components/HeroBackground.jsx";
import GameGrid from "./components/GameGrid.jsx";
import StorePage from "./components/StorePage.jsx";
import DownloadManager from "./components/DownloadManager.jsx";
import CloudBrowser from "./components/CloudBrowser.jsx";
import BrowserPage from "./components/BrowserPage.jsx";
import DiscordPanel from "./components/DiscordPanel.jsx";
import AddGameModal from "./components/AddGameModal.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import SteamActionOverlay from "./components/SteamActionOverlay.jsx";
import { useLibraryStore } from "./store/useLibraryStore";
import { initTheme } from "./utils/theme";
import { useT } from "./hooks/useT";

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(2)} GB`;
}

const SPLASH_DURATION_MS = 3000;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const t = useT();

  useEffect(() => {
    initTheme();
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  const loadLibrary = useLibraryStore((s) => s.loadLibrary);
  const games = useLibraryStore((s) => s.games);
  const selectedGameId = useLibraryStore((s) => s.selectedGameId);
  const view = useLibraryStore((s) => s.view);
  const endSession = useLibraryStore((s) => s.endSession);
  const upsertTransfer = useLibraryStore((s) => s.upsertTransfer);
  const updateGame = useLibraryStore((s) => s.updateGame);
  const hideSteamOverlay = useLibraryStore((s) => s.hideSteamOverlay);
  const backgroundConfig = useLibraryStore((s) => s.backgroundConfig);

  const selectedGame = useMemo(
    () => games.find((g) => g.id === selectedGameId) ?? null,
    [games, selectedGameId]
  );

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Spiel beendet -> Spielzeit dieser Session der Bibliothek gutschreiben
  useEffect(() => {
    const unsubscribe = window.api.onGameExit(({ gameId, success, error }) => {
      endSession(gameId);
      if (!success) console.warn(`Spiel ${gameId} wurde mit Fehler beendet:`, error);
    });
    return unsubscribe;
  }, [endSession]);

  // Cloud-Fortschritt global abonnieren, damit GameCards auf jeder Ansicht
  // live reagieren (nicht nur im Downloads-Tab)
  useEffect(() => {
    const unsubscribe = window.api.onCloudProgress((payload) => {
      upsertTransfer(payload.transferId, payload);
    });
    return unsubscribe;
  }, [upsertTransfer]);

  // Steam-Installationen (ausgelöst über "Herunterladen" bei importierten,
  // aber nicht installierten Steam-Spielen) in dieselben Transfer-Einträge
  // übersetzen wie Cloud-/Browser-Downloads, siehe steamDownloadWatcher.js
  // für die technische Erklärung, wie der Fortschritt ermittelt wird.
  useEffect(() => {
    const unsubscribe = window.api.onSteamInstallProgress((payload) => {
      const transferId = `steam-${payload.gameId}`;
      if (payload.phase === "downloading") {
        hideSteamOverlay();
        upsertTransfer(transferId, {
          gameId: payload.gameId,
          direction: "steam",
          phase: "downloading",
        });
      } else if (payload.phase === "done") {
        hideSteamOverlay();
        upsertTransfer(transferId, { phase: "done" });
        updateGame(payload.gameId, { status: "installed" });
      } else if (payload.phase === "error") {
        hideSteamOverlay();
        upsertTransfer(transferId, { phase: "error", error: payload.message || t("errors.installationFailed") });
        updateGame(payload.gameId, { status: "steam-owned" });
      }
    });
    return unsubscribe;
  }, [upsertTransfer, updateGame, hideSteamOverlay]);

  // Downloads aus dem eingebauten Browser-Tab (nativ über Electrons
  // Session-API, siehe electron/nativeDownloads.js) in dieselben
  // Transfer-Einträge übersetzen, die auch Cloud-Uploads/-Downloads im
  // Downloads-Tab anzeigen.
  useEffect(() => {
    const unsubscribe = window.api.onBrowserDownloadEvent((payload) => {
      const transferId = `browser-${payload.id}`;
      if (payload.type === "started") {
        upsertTransfer(transferId, {
          gameId: transferId,
          direction: "browser",
          phase: "downloading",
          percent: 0,
          filename: payload.filename,
          filePath: payload.filePath || "",
          total: formatBytes(payload.totalBytes),
        });
      } else if (payload.type === "progress") {
        const percent = payload.totalBytes
          ? Math.round((payload.receivedBytes / payload.totalBytes) * 100)
          : 0;
        upsertTransfer(transferId, {
          phase: "downloading",
          percent,
          transferred: formatBytes(payload.receivedBytes),
          total: formatBytes(payload.totalBytes),
        });
      } else if (payload.type === "done") {
        upsertTransfer(transferId, {
          phase: "done",
          percent: 100,
          filePath: payload.filePath || undefined,
        });
      } else if (payload.type === "error") {
        upsertTransfer(transferId, {
          phase: "error",
          error: payload.cancelled ? t("errors.downloadCancelled") : t("errors.downloadFailed"),
        });
      }
    });
    return unsubscribe;
  }, [upsertTransfer]);

  return (
    <div className="relative h-screen w-screen overflow-y-auto">
      <HeroBackground game={selectedGame} backgroundConfig={backgroundConfig} />
      <div className="relative z-10 flex min-h-full flex-col">
        <UpdateBanner />
        <TopBar />
        <div className="relative flex-1">
          {(view === "home" || view === "library") && <GameGrid />}
          {view === "store" && <StorePage />}
          {view === "downloads" && <DownloadManager />}
          {view === "cloud" && <CloudBrowser />}
          {view === "settings" && <SettingsPanel />}
          {/* Bleibt immer gemountet (nur unsichtbar statt entfernt), damit der
              eingebaute Browser (Verlauf, offene Seite, Tab-Zustand) beim
              Wechsel zu anderen Ansichten NICHT zurückgesetzt wird.
              WICHTIG: bewusst kein "display:none" (Tailwind "hidden") für den
              Webview-Container - Chromium pausiert dessen Rendering dann
              komplett, was beim Zurückwechseln kurzzeitig zu einem
              schwarzen/eingefrorenen Bild führt. Mit opacity+pointer-events
              bleibt der Compositor aktiv, es gibt keinen Schwarzbild-Effekt. */}
          <div
            className={`absolute inset-0 transition-opacity duration-100 ${
              view === "browser" ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={view !== "browser"}
          >
            <BrowserPage />
          </div>
          <div
            className={`absolute inset-0 transition-opacity duration-100 ${
              view === "discord" ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={view !== "discord"}
          >
            <DiscordPanel />
          </div>
        </div>
      </div>
      <AddGameModal />
      <SteamActionOverlay />
      <SplashScreen visible={showSplash} />
    </div>
  );
}
