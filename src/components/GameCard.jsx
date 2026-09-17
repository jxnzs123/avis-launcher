import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Cloud, HardDrive, Download, Loader2, Upload, Pencil, Trash2, Gamepad2, Trophy } from "lucide-react";
import { resolveImageSrc } from "../utils/image";
import { useT } from "../hooks/useT";

function getStatusConfig(t) {
  return {
    cloud: { label: t("status.cloud"), icon: Cloud, color: "text-accent-soft" },
    installed: { label: t("status.installed"), icon: HardDrive, color: "text-success" },
    downloading: { label: t("status.downloading"), icon: Download, color: "text-warning" },
    uploading: { label: t("status.uploading"), icon: Upload, color: "text-warning" },
    "steam-owned": { label: t("status.steamOwned"), icon: Gamepad2, color: "text-white/50" },
    "steam-downloading": { label: t("status.steamDownloading"), icon: Download, color: "text-warning" },
  };
}

export default function GameCard({
  game,
  isFocused,
  transfer,
  onSelect,
  onShowInfo,
  onEdit,
  onDelete,
}) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const t = useT();
  const status = getStatusConfig(t)[game.status] ?? getStatusConfig(t).installed;
  const StatusIcon = status.icon;
  const isTransferring = transfer && transfer.phase !== "done" && transfer.phase !== "error";

  useEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [isFocused]);

  function handleClick() {
    onSelect?.();
  }

  function handleDoubleClick() {
    onSelect?.();
    onShowInfo?.(game);
  }

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ zIndex: isFocused || isHovered ? 10 : 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="relative w-44 flex-shrink-0 md:w-48"
    >
      {/* Animierter Glow-Umriss bei Hover/Fokus - folgt der gewählten Akzentfarbe.
          WICHTIG: Der Zoom-Effekt sitzt bewusst NUR auf dem Bild selbst (innerhalb
          des unveränderten Rahmens), nicht mehr auf dem Rahmen mit Ring +
          abgerundeten Ecken + overflow-hidden. Genau diese Kombination aus
          Rahmen-Skalierung + Radius + Ring erzeugte in Chromium/Electron einen
          sichtbaren Farb-Riss am Rand (Rendering-Bug). Der Rahmen selbst bleibt
          jetzt immer exakt gleich groß - nur das Bild "atmet" darin. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-0.5 rounded-xl bg-gradient-to-br from-accent via-accent-soft to-accent opacity-0 blur-sm"
        animate={{
          opacity: isHovered || isFocused ? 0.5 : 0,
          scale: isHovered || isFocused ? 1 : 0.96,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      <motion.button
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        whileTap={{ scale: 0.98 }}
        className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-base-800 text-left shadow-card outline-none ring-1 transition-shadow duration-200 ${
          isFocused ? "shadow-focus ring-2 ring-accent" : "ring-white/5"
        }`}
      >
        {game.coverImage ? (
          <motion.img
            src={resolveImageSrc(game.coverImage)}
            alt={game.name}
            className="absolute inset-0 h-full w-full rounded-xl object-cover"
            draggable={false}
            animate={{
              scale: isHovered || isFocused ? 1.08 : 1,
              filter: isHovered || isFocused ? "brightness(1.18)" : "brightness(1)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-base-700 to-base-900 text-3xl font-bold text-white/20">
            {game.name?.[0] ?? "?"}
          </div>
        )}

        {/* Kurzes "Aufleuchten" beim Hover - dezenter heller Schimmer von oben */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/0 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        {/* Kategorie-Badge oben rechts */}
        {game.category && (
          <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
            {game.category}
          </span>
        )}

        {/* 100%-Achievements-Badge oben links */}
        {game.achievementsComplete && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            title={t("achievements.allComplete")}
            className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.7)]"
          >
            <Trophy size={12} className="text-amber-950" />
          </motion.div>
        )}

        {/* Transparentes Spiel-Logo oder Fallback-Titel */}
        <div className="absolute inset-x-0 bottom-8 flex items-end justify-center px-3">
          {game.logoImage ? (
            <img
              src={resolveImageSrc(game.logoImage)}
              alt={game.name}
              className="max-h-14 max-w-[85%] object-contain drop-shadow-lg"
              draggable={false}
            />
          ) : (
            <span className="text-center text-sm font-semibold leading-tight text-white drop-shadow">
              {game.name}
            </span>
          )}
        </div>

        {/* Live-Fortschritt bei aktivem Transfer - bei Steam gibt's keine
            zuverlässige Prozentzahl (siehe steamDownloadWatcher.js), daher
            hier kein Balken für diesen Fall */}
        {isTransferring && transfer.direction !== "steam" && (
          <div className="absolute inset-x-2 bottom-8 h-1 overflow-hidden rounded-full bg-black/40">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${transfer.percent ?? 0}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Cloud-Status Badge */}
        <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm">
          {game.status === "downloading" || game.status === "uploading" || game.status === "steam-downloading" ? (
            <Loader2 size={12} className={`animate-spin ${status.color}`} />
          ) : (
            <StatusIcon size={12} className={status.color} />
          )}
          <span className={`text-[11px] font-medium ${status.color}`}>
            {isTransferring
              ? transfer.direction === "steam"
                ? status.label
                : `${status.label} · ${transfer.percent ?? 0}%`
              : status.label}
          </span>
        </div>
      </motion.button>

      {/* Bearbeiten / Löschen - erscheinen bei Hover oben rechts */}
      <motion.div
        className="absolute right-1.5 top-1.5 flex gap-1.5"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -4 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(game);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur hover:bg-black/80 hover:text-white"
          title={t("common.edit")}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(game);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur hover:bg-red-500/80 hover:text-white"
          title={t("common.delete")}
        >
          <Trash2 size={13} />
        </button>
      </motion.div>
    </motion.div>
  );
}
