import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, ExternalLink, Loader2, RefreshCw, ImageOff } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { useT } from "../hooks/useT";

function formatRelativeDate(pubDate, t) {
  if (!pubDate) return "";
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return "";
  const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return t("news.justNow");
  if (diffHours < 24) return t("news.hoursAgo", { n: diffHours });
  const diffDays = Math.round(diffHours / 24);
  return t(diffDays === 1 ? "news.dayAgo" : "news.daysAgo", { n: diffDays });
}

/** Einzelne News-Kachel - eigene Komponente, damit jede Karte ihren eigenen
 * Bild-Fehlerstatus verfolgen kann (ein kaputtes Vorschaubild soll nicht
 * alle anderen Karten beeinflussen). */
function NewsCard({ item, index, onOpen, t }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = item.image && !imageFailed;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      onClick={onOpen}
      className={`group relative flex h-40 flex-col overflow-hidden rounded-2xl text-left ring-1 transition-all ${
        item.relevant ? "ring-accent/60" : "ring-white/5 hover:ring-white/20"
      }`}
    >
      {/* Hintergrundbild oder Fallback-Verlauf, füllt die ganze Kachel */}
      {showImage ? (
        <img
          src={item.image}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-base-700 via-base-800 to-base-900">
          <ImageOff size={20} className="text-white/10" />
        </div>
      )}

      {/* Verlauf von unten, damit der Text auf jedem Bild lesbar bleibt */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/5" />

      {item.relevant && (
        <span className="absolute left-3 top-3 w-fit rounded-full bg-accent px-2 py-0.5 text-[9px] font-semibold text-base-950">
          {t("news.fromYourLibrary")}
        </span>
      )}

      <div className="relative mt-auto flex flex-col gap-1 p-3.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow">
          {item.title}
        </p>
        <div className="flex items-center justify-between pt-0.5 text-[10.5px] text-white/60">
          <span className="font-medium">{item.source}</span>
          <span className="flex items-center gap-1">
            {formatRelativeDate(item.pubDate, t)}
            <ExternalLink size={10} className="opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function NewsFeed() {
  const games = useLibraryStore((s) => s.games);
  const openInBrowserTab = useLibraryStore((s) => s.openInBrowserTab);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | idle | error
  const t = useT();

  async function loadNews() {
    setStatus("loading");
    const gameNames = games.map((g) => g.name).filter(Boolean);
    const result = await window.api.getLatestGameNews(gameNames);
    if (result.success && result.items.length > 0) {
      setItems(result.items);
      setStatus("idle");
    } else {
      setStatus("error");
    }
  }

  useEffect(() => {
    loadNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "error") return null; // Home bleibt sauber, falls News mal nicht erreichbar sind

  return (
    <div className="mb-2">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/70">
          <Newspaper size={15} className="text-accent-soft" />
          <h2 className="text-sm font-semibold">{t("news.title")}</h2>
        </div>
        <button
          onClick={loadNews}
          disabled={status === "loading"}
          className="text-white/30 hover:text-white/60 disabled:opacity-50"
        >
          <RefreshCw size={13} className={status === "loading" ? "animate-spin" : ""} />
        </button>
      </div>

      {status === "loading" ? (
        <div className="flex h-40 items-center justify-center text-white/30">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((item, i) => (
            <NewsCard
              key={item.link || i}
              item={item}
              index={i}
              onOpen={() => openInBrowserTab(item.link)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
