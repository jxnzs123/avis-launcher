import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Clock, HardDrive, Cloud, FolderOpen, Terminal, Play, DownloadCloud, Loader2, Tag } from "lucide-react";
import { formatPlaytime } from "../store/useLibraryStore";
import { resolveImageSrc } from "../utils/image";
import { useT } from "../hooks/useT";

export default function GameInfoPopup({ game, onClose, onPrimaryAction }) {
  const t = useT();
  const STATUS_LABEL = {
    cloud: t("status.cloud"),
    installed: t("status.installed"),
    downloading: t("status.downloading"),
    uploading: t("status.uploading"),
    "steam-owned": t("status.steamOwned"),
    "steam-downloading": t("status.steamDownloading"),
  };

  return (
    <AnimatePresence>
      {game && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-xs flex-col gap-4 overflow-hidden rounded-2xl bg-base-850 shadow-card ring-1 ring-accent/30"
          >
            {/* Mini-Banner mit Cover als Hintergrund */}
            <div className="relative h-24 w-full overflow-hidden">
              {game.coverImage ? (
                <img
                  src={resolveImageSrc(game.coverImage)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-base-700 to-base-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-base-850 via-base-850/40 to-transparent" />
              <button
                onClick={onClose}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur hover:bg-black/70 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-3 px-5 pb-5">
              <h2 className="text-lg font-semibold text-white">{game.name}</h2>

              <InfoRow
                icon={game.status === "installed" ? HardDrive : Cloud}
                label={t("info.status")}
                value={STATUS_LABEL[game.status] ?? game.status}
              />
              <InfoRow icon={Clock} label={t("info.playtime")} value={formatPlaytime(game.playtimeMinutes)} />
              {game.category && <InfoRow icon={Tag} label={t("info.category")} value={game.category} />}
              {game.installPath && (
                <InfoRow icon={FolderOpen} label={t("info.folder")} value={game.installPath} truncate />
              )}
              {game.launchArgs && (
                <InfoRow icon={Terminal} label={t("info.launchArgs")} value={game.launchArgs} truncate />
              )}

              {(game.status === "installed" || game.status === "cloud") && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onPrimaryAction?.(game);
                    onClose?.();
                  }}
                  className="mt-1 flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-base-950 hover:bg-accent-soft"
                >
                  {game.status === "installed" ? (
                    <>
                      <Play size={15} /> {t("action.start")}
                    </>
                  ) : (
                    <>
                      <DownloadCloud size={15} /> {t("action.downloadFromCloud")}
                    </>
                  )}
                </motion.button>
              )}
              {(game.status === "downloading" || game.status === "uploading") && (
                <div className="mt-1 flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/60">
                  <Loader2 size={15} className="animate-spin" />
                  {game.status === "downloading" ? t("status.downloadingEllipsis") : t("status.uploadingEllipsis")}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoRow({ icon: Icon, label, value, truncate }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon size={15} className="mt-0.5 flex-shrink-0 text-accent-soft" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-white/35">{label}</p>
        <p className={`text-white/80 ${truncate ? "truncate" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
