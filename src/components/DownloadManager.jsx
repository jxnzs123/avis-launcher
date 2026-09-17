import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  Chrome,
  X,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Plus,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Loader2,
  Gamepad2,
} from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import ProgressBar from "./ProgressBar.jsx";
import { useT } from "../hooks/useT";

function getPhaseLabel(t) {
  return {
    compressing: t("transfer.compressing"),
    uploading: t("transfer.uploading"),
    downloading: t("transfer.downloading"),
    extracting: t("transfer.extracting"),
    transferring: t("transfer.transferring"),
    done: t("transfer.done"),
    error: t("transfer.error"),
  };
}

/** Leitet aus einem vollen Dateipfad einen sinnvollen Spielnamen-Vorschlag ab */
function guessNameFromPath(filePath) {
  if (!filePath) return "";
  const base = filePath.split(/[\\/]/).pop() || "";
  return base.replace(/\.(exe|zip|rar|7z|tar|gz|msi)$/i, "").replace(/[._-]+/g, " ").trim();
}

/** Ordner, der eine Datei enthält (Windows- und Unix-Pfade) */
function parentFolder(filePath) {
  if (!filePath) return "";
  const parts = filePath.split(/[\\/]/);
  parts.pop();
  return parts.join(filePath.includes("\\") ? "\\" : "/");
}

export default function DownloadManager() {
  const transfers = useLibraryStore((s) => s.transfers);
  const removeTransfer = useLibraryStore((s) => s.removeTransfer);
  const games = useLibraryStore((s) => s.games);
  const openAddModal = useLibraryStore((s) => s.openAddModal);
  const updateGame = useLibraryStore((s) => s.updateGame);
  const [scanResults, setScanResults] = useState({}); // transferId -> { status, ... }
  const t = useT();
  const PHASE_LABEL = getPhaseLabel(t);

  const entries = Object.entries(transfers);

  function handleDismissOrCancel(transferId, phase, direction, gameId) {
    if (phase === "done" || phase === "error") {
      removeTransfer(transferId);
    } else if (direction === "browser") {
      const rawId = transferId.replace(/^browser-/, "");
      window.api.cancelBrowserDownload(rawId);
    } else if (direction === "steam") {
      window.api.stopWatchingSteamInstall(gameId);
      updateGame(gameId, { status: "steam-owned" });
      removeTransfer(transferId);
    } else {
      window.api.cloudCancel(transferId);
    }
  }

  async function handleScanFile(transferId, filePath) {
    setScanResults((prev) => ({ ...prev, [transferId]: { status: "scanning" } }));
    const result = await window.api.scanFileForViruses(filePath);
    setScanResults((prev) => ({ ...prev, [transferId]: result }));
  }

  return (
    <div className="relative z-10 flex flex-col gap-4 px-8 pb-10">
      <h1 className="text-2xl font-bold text-white">{t("downloads.title")}</h1>

      {entries.length === 0 && (
        <p className="text-sm text-white/40">{t("downloads.empty")}</p>
      )}

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
        {entries.map(([transferId, transfer]) => {
          const game = games.find((g) => g.id === transfer.gameId);
          const isUpload = transfer.direction === "upload";
          const isBrowser = transfer.direction === "browser";
          const isSteam = transfer.direction === "steam";
          const Icon = isBrowser ? Chrome : isSteam ? Gamepad2 : isUpload ? Upload : Download;

          return (
            <motion.div
              key={transferId}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-2 rounded-xl bg-base-800/80 p-4 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Icon size={16} className="text-accent-soft" />
                  {game?.name ?? transfer.filename ?? t("downloads.unknownGame")}
                </div>
                <button
                  onClick={() => handleDismissOrCancel(transferId, transfer.phase, transfer.direction, transfer.gameId)}
                  className="text-white/40 hover:text-white"
                  title={transfer.phase === "done" || transfer.phase === "error" ? t("downloads.remove") : t("downloads.cancel")}
                >
                  <X size={16} />
                </button>
              </div>

              <ProgressBar percent={transfer.percent ?? 0} indeterminate={isSteam && transfer.phase === "downloading"} />

              <div className="flex items-center justify-between text-xs text-white/50">
                <span className="flex items-center gap-1">
                  {transfer.phase === "done" && (
                    <CheckCircle2 size={12} className="text-success" />
                  )}
                  {transfer.phase === "error" && (
                    <AlertCircle size={12} className="text-red-400" />
                  )}
                  {isSteam && transfer.phase === "downloading"
                    ? t("downloads.runningViaSteam")
                    : PHASE_LABEL[transfer.phase] ?? transfer.phase}
                </span>
                <span>
                  {isSteam && transfer.phase === "downloading" ? (
                    t("downloads.progressInSteam")
                  ) : (
                    <>
                      {transfer.speed ? `${transfer.speed} · ` : ""}
                      {transfer.eta ? `ETA ${transfer.eta}` : ""}
                      {!transfer.speed && !transfer.eta ? `${transfer.percent ?? 0}%` : ""}
                    </>
                  )}
                </span>
              </div>
              {transfer.phase === "error" && transfer.error && (
                <p className="text-xs text-red-400/80">{transfer.error}</p>
              )}

              {isBrowser && transfer.phase === "done" && transfer.filePath && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => window.api.showItemInFolder(transfer.filePath)}
                    className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20"
                  >
                    <FolderOpen size={12} />
                    {t("downloads.openFolder")}
                  </button>
                  <button
                    onClick={() =>
                      openAddModal(
                        { name: guessNameFromPath(transfer.filePath), installPath: parentFolder(transfer.filePath) },
                        parentFolder(transfer.filePath)
                      )
                    }
                    className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-base-950 hover:bg-accent-soft"
                  >
                    <Plus size={12} />
                    {t("downloads.addGame")}
                  </button>

                  {!scanResults[transferId] && (
                    <button
                      onClick={() => handleScanFile(transferId, transfer.filePath)}
                      className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20"
                    >
                      <ShieldCheck size={12} />
                      {t("downloads.checkSafety")}
                    </button>
                  )}
                  <ScanResultBadge result={scanResults[transferId]} t={t} />
                </div>
              )}
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Zeigt das Ergebnis der VirusTotal-Prüfung als kleines Badge an */
function ScanResultBadge({ result, t }) {
  if (!result) return null;

  if (result.status === "scanning") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/60">
        <Loader2 size={12} className="animate-spin" />
        {t("scan.scanning")}
      </span>
    );
  }

  if (result.status === "no-key") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/50">
        <ShieldQuestion size={12} />
        {t("scan.noKey")}
      </span>
    );
  }

  if (result.status === "clean") {
    return (
      <button
        onClick={() => useLibraryStore.getState().openInBrowserTab(result.reportUrl)}
        className="flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/25"
        title={t("scan.cleanTooltip")}
      >
        <ShieldCheck size={12} />
        {t("scan.clean", { n: result.harmless ?? 0 })}
      </button>
    );
  }

  if (result.status === "malicious" || result.status === "suspicious") {
    return (
      <button
        onClick={() => useLibraryStore.getState().openInBrowserTab(result.reportUrl)}
        className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/25"
        title={t("scan.reportTooltip")}
      >
        <ShieldAlert size={12} />
        {result.status === "malicious" ? t("scan.malicious", { n: result.malicious }) : t("scan.suspicious", { n: result.malicious })}
      </button>
    );
  }

  if (result.status === "unknown") {
    return (
      <button
        onClick={() => useLibraryStore.getState().openInBrowserTab(result.reportUrl)}
        className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/20"
        title={t("scan.unknownTooltip")}
      >
        <ShieldQuestion size={12} />
        {t("scan.unknown")}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-red-400/80">
      <AlertCircle size={12} />
      {t("scan.failed")}{result.message ? `: ${result.message}` : ""}
    </span>
  );
}
