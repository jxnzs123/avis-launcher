import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, ExternalLink, KeyRound, ImageOff, RefreshCw } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { useT } from "../hooks/useT";

function formatCountdown(isoDate, t) {
  if (!isoDate) return null;
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return null;
  const diffDays = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return t("upcoming.alreadyReleased");
  if (diffDays === 0) return t("upcoming.releasesToday");
  if (diffDays === 1) return t("upcoming.releasesTomorrow");
  return t("upcoming.releasesInDays", { n: diffDays });
}

/**
 * Einzelne Kachel - bewusst dieselbe Bildsprache UND dieselbe
 * Hover-Animation wie GameCard.jsx in der Bibliothek: Glow-Umriss,
 * abgerundeter Rahmen mit Ring, und ein Zoom+Helligkeits-Effekt NUR auf dem
 * Bild selbst (nicht auf dem Rahmen) - das ist bewusst so, weil eine
 * Skalierung des Rahmens (der Ring + abgerundete Ecken + overflow-hidden
 * hat) in Chromium/Electron einen sichtbaren Rand-Glitch erzeugt. Siehe
 * GameCard.jsx für die ausführlichere Erklärung.
 */
function UpcomingCard({ entry, index, onOpen, t }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const showImage = entry.coverUrl && !imageFailed;
  const countdown = entry.releaseDate ? formatCountdown(entry.releaseDate, t) : entry.releaseLabel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      {/* Glow-Umriss bei Hover - identisch zu GameCard */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-0.5 rounded-xl bg-gradient-to-br from-accent via-accent-soft to-accent opacity-0 blur-sm"
        animate={{ opacity: isHovered ? 0.5 : 0, scale: isHovered ? 1 : 0.96 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-base-800 text-left shadow-card ring-1 ring-white/5 transition-shadow duration-200">
        {showImage ? (
          <motion.img
            src={entry.coverUrl}
            alt={entry.name}
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full rounded-xl object-cover"
            draggable={false}
            animate={{
              scale: isHovered ? 1.08 : 1,
              filter: isHovered ? "brightness(1.18)" : "brightness(1)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-base-700 to-base-900 px-3 text-center">
            <ImageOff size={20} className="text-white/15" />
            <span className="text-[10px] leading-tight text-white/25">{t("upcoming.noCover")}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        {entry.tag && (
          <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
            {entry.tag}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-white drop-shadow">
            {entry.name}
          </p>
          {countdown && <span className="text-[10.5px] text-accent-soft">{countdown}</span>}
        </div>
      </div>

      {entry.sellerUrl && (
        <button
          onClick={onOpen}
          className="group mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/20"
        >
          <KeyRound size={11} />
          {entry.sellerLabel || t("upcoming.viewKey")}
          <ExternalLink size={9} className="opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      )}
    </motion.div>
  );
}

export default function UpcomingGames() {
  const openInBrowserTab = useLibraryStore((s) => s.openInBrowserTab);
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | idle
  const [source, setSource] = useState(null); // remote | cache | fallback
  const t = useT();

  async function load() {
    setStatus("loading");
    const result = await window.api.getUpcomingGamesList();
    setGames(result.games ?? []);
    setSource(result.source);
    setStatus("idle");
  }

  useEffect(() => {
    load();
  }, []);

  if (status === "idle" && games.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/70">
          <CalendarClock size={15} className="text-accent-soft" />
          <h2 className="text-sm font-semibold">{t("upcoming.title")}</h2>
        </div>
        <button
          onClick={load}
          disabled={status === "loading"}
          className="text-white/30 hover:text-white/60 disabled:opacity-50"
        >
          <RefreshCw size={13} className={status === "loading" ? "animate-spin" : ""} />
        </button>
      </div>

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 192px))" }}
      >
        {games.map((entry, i) => (
          <UpcomingCard
            key={entry.id}
            entry={entry}
            index={i}
            onOpen={() => openInBrowserTab(entry.sellerUrl)}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
