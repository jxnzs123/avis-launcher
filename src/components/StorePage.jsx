import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, RefreshCw, Loader2, AlertCircle, ExternalLink, Tag, ClipboardCheck, Search, X } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { getInstantGamingUrl } from "../utils/instantGaming";
import { useT } from "../hooks/useT";

/**
 * Einzelne Deal-Kachel - dieselbe Bildsprache wie GameCard.jsx/UpcomingGames.jsx
 * (2:3-Hochformat, Glow-Umriss bei Hover, Zoom nur auf dem Bild selbst -
 * siehe GameCard.jsx für die ausführliche Erklärung, warum bewusst nicht
 * der ganze Rahmen skaliert wird).
 */
function DealCard({ deal, index, onBuy }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-0.5 rounded-xl bg-gradient-to-br from-accent via-accent-soft to-accent opacity-0 blur-sm"
        animate={{ opacity: isHovered ? 0.5 : 0, scale: isHovered ? 1 : 0.96 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-base-800 ring-1 ring-white/5">
        {!imageFailed ? (
          <motion.img
            src={deal.coverImage}
            alt={deal.title}
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
          <img
            src={deal.thumbnailFallback}
            alt={deal.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        {deal.savingsPercent > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-bold text-base-950">
            -{deal.savingsPercent}%
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-white drop-shadow">
            {deal.title}
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            {deal.normalPrice > deal.salePrice && (
              <span className="text-white/40 line-through">{deal.normalPrice.toFixed(2)} €</span>
            )}
            <span className="font-semibold text-accent-soft">{deal.salePrice.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <button
        onClick={onBuy}
        className="group mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/20"
      >
        <Tag size={11} />
        {t("store.buyOnInstantGaming")}
        <ExternalLink size={9} className="opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </motion.div>
  );
}

/** Kachel für ein Such-Ergebnis - schlichter als DealCard, da die
 * CheapShark-Spielesuche nur einen aktuellen Preis liefert, keinen
 * Vergleich zum Normalpreis. Nutzt immer CheapSharks eigenes
 * Vorschaubild ("thumb"), da nicht jedes Spiel eine bekannte
 * Steam-AppID hat. */
function SearchResultCard({ game, index, onBuy }) {
  const [isHovered, setIsHovered] = useState(false);
  const [highResFailed, setHighResFailed] = useState(false);
  const t = useT();
  const showHighRes = game.coverImage && !highResFailed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-0.5 rounded-xl bg-gradient-to-br from-accent via-accent-soft to-accent opacity-0 blur-sm"
        animate={{ opacity: isHovered ? 0.5 : 0, scale: isHovered ? 1 : 0.96 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-base-800 ring-1 ring-white/5">
        <motion.img
          src={showHighRes ? game.coverImage : game.thumbnail}
          alt={game.title}
          onError={() => setHighResFailed(true)}
          className="absolute inset-0 h-full w-full rounded-xl object-cover"
          draggable={false}
          animate={{
            scale: isHovered ? 1.08 : 1,
            filter: isHovered ? "brightness(1.18)" : "brightness(1)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-white drop-shadow">
            {game.title}
          </p>
          {game.cheapestPrice !== null && (
            <span className="text-[11px] font-semibold text-accent-soft">
              {t("store.fromPrice", { price: game.cheapestPrice.toFixed(2) })}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onBuy}
        className="group mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/20"
      >
        <Tag size={11} />
        {t("store.buyOnInstantGaming")}
        <ExternalLink size={9} className="opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </motion.div>
  );
}

/** Kleine Karte zum Einlösen eines gekauften Steam-Keys - siehe steamManager.js
 * für die ehrliche Erklärung, warum der Key in die Zwischenablage kopiert
 * wird, statt ihn per URL automatisch vorauszufüllen. */
function RedeemKeyCard() {
  const [key, setKey] = useState("");
  const [state, setState] = useState({ status: "idle" }); // idle | done | error
  const t = useT();

  async function handleActivate() {
    const result = await window.api.activateSteamKey(key);
    if (result.success) {
      setState({ status: "done" });
      setKey("");
      setTimeout(() => setState({ status: "idle" }), 4000);
    } else {
      setState({ status: "error", message: result.error });
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-base-850 p-5 shadow-card">
      <div className="flex items-center gap-2 text-white">
        <KeyRound size={15} className="text-accent-soft" />
        <h2 className="text-sm font-semibold">{t("store.redeemTitle")}</h2>
      </div>
      <div className="flex gap-2">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t("store.redeemPlaceholder")}
          className="input flex-1"
        />
        <button
          onClick={handleActivate}
          disabled={!key.trim()}
          className="flex flex-shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-base-950 hover:bg-accent-soft disabled:opacity-50"
        >
          <KeyRound size={15} />
          {t("store.redeemButton")}
        </button>
      </div>
      {state.status === "done" && (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <ClipboardCheck size={14} /> {t("store.redeemCopied")}
        </p>
      )}
      {state.status === "error" && (
        <p className="flex items-center gap-1.5 text-sm text-red-400">
          <AlertCircle size={14} /> {state.message}
        </p>
      )}
      <p className="text-xs text-white/40">{t("store.redeemHint")}</p>
    </div>
  );
}

export default function StorePage() {
  const [deals, setDeals] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | idle | error
  const [errorDetail, setErrorDetail] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = keine aktive Suche
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | loading | error
  const openInBrowserTab = useLibraryStore((s) => s.openInBrowserTab);
  const t = useT();

  async function load() {
    setStatus("loading");
    const result = await window.api.getStoreDeals();
    if (result.success) {
      setDeals(result.deals);
      setStatus("idle");
    } else {
      setErrorDetail(result.error || "");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    setSearchStatus("loading");
    const result = await window.api.searchStoreGames(query);
    if (result.success) {
      setSearchResults(result.games);
      setSearchStatus("idle");
    } else {
      setSearchResults([]);
      setSearchStatus("error");
    }
  }

  function clearSearch() {
    setSearchInput("");
    setSearchResults(null);
    setSearchStatus("idle");
  }

  return (
    <div className="relative z-10 flex flex-col px-8 pb-10">
      <RedeemKeyCard />

      {/* Spielsuche - durchsucht CheapSharks komplette Spieledatenbank,
          nicht nur die aktuellen Angebote unten */}
      <form onSubmit={handleSearch} className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("store.searchPlaceholder")}
          className="w-full rounded-full bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white placeholder-white/30 ring-1 ring-white/10 transition-shadow focus:ring-2 focus:ring-accent"
        />
        {searchInput && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </form>

      {searchResults !== null ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {t("store.searchResultsTitle", { query: searchInput })}
            </h1>
            <button
              onClick={clearSearch}
              className="text-sm text-accent-soft hover:underline"
            >
              {t("store.backToDeals")}
            </button>
          </div>

          {searchStatus === "loading" && (
            <div className="flex h-40 items-center justify-center text-white/30">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}

          {searchStatus === "error" && (
            <p className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={14} /> {t("store.searchError")}
            </p>
          )}

          {searchStatus === "idle" && searchResults.length === 0 && (
            <p className="text-sm text-white/40">{t("store.searchNoResults")}</p>
          )}

          {searchStatus === "idle" && searchResults.length > 0 && (
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 192px))" }}
            >
              {searchResults.map((game, i) => (
                <SearchResultCard
                  key={game.gameId}
                  game={game}
                  index={i}
                  onBuy={() => openInBrowserTab(getInstantGamingUrl(game.title))}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{t("store.dealsTitle")}</h1>
              <p className="mt-1 text-sm text-white/50">{t("store.dealsSubtitle")}</p>
            </div>
            <button
              onClick={load}
              disabled={status === "loading"}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw size={14} className={status === "loading" ? "animate-spin" : ""} />
              {t("common.refresh")}
            </button>
          </div>

          {status === "loading" && (
            <div className="flex h-40 items-center justify-center text-white/30">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}

          {status === "error" && (
            <p className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={14} /> {t("store.loadError")}
              {errorDetail && <span className="text-red-400/60">({errorDetail})</span>}
            </p>
          )}

          {status === "idle" && (
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 192px))" }}
            >
              {deals.map((deal, i) => (
                <DealCard
                  key={deal.dealId}
                  deal={deal}
                  index={i}
                  onBuy={() => openInBrowserTab(getInstantGamingUrl(deal.title))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
