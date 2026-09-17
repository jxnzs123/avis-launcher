import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, UploadCloud, DownloadCloud, Loader2, Pencil, Trash2, Clock, Search, X, AlertCircle, ArrowUpDown, ChevronDown, Trophy } from "lucide-react";
import GameCard from "./GameCard.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import GameInfoPopup from "./GameInfoPopup.jsx";
import AchievementsPanel from "./AchievementsPanel.jsx";
import NewsFeed from "./NewsFeed.jsx";
import UpcomingGames from "./UpcomingGames.jsx";
import { useLibraryStore, formatPlaytime } from "../store/useLibraryStore";
import { useKeyboardNav } from "../hooks/useKeyboardNav";
import { useT } from "../hooks/useT";

const COLUMNS = 6; // grobe Annahme für Pfeiltasten-Auf/Ab, passt sich optisch per CSS-Grid an

function getGreeting(t) {
  const hour = new Date().getHours();
  if (hour < 5) return t("home.stillAwake");
  if (hour < 11) return t("home.goodMorning");
  if (hour < 17) return t("home.goodDay");
  if (hour < 22) return t("home.goodEvening");
  return t("home.stillAwake");
}

export default function GameGrid() {
  const t = useT();
  const [infoGame, setInfoGame] = useState(null);
  const [achievementsGame, setAchievementsGame] = useState(null);
  const [strongCompression, setStrongCompression] = useState(false);
  const [launchError, setLaunchError] = useState(null);
  const view = useLibraryStore((s) => s.view);
  const isHome = view === "home";
  const games = useLibraryStore((s) => s.games);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);
  const libraryCategory = useLibraryStore((s) => s.libraryCategory);
  const setLibraryCategory = useLibraryStore((s) => s.setLibraryCategory);
  const selectedGameId = useLibraryStore((s) => s.selectedGameId);
  const selectGame = useLibraryStore((s) => s.selectGame);
  const gameModal = useLibraryStore((s) => s.gameModal);
  const updateGame = useLibraryStore((s) => s.updateGame);
  const launchGame = useLibraryStore((s) => s.launchGame);
  const transfers = useLibraryStore((s) => s.transfers);
  const upsertTransfer = useLibraryStore((s) => s.upsertTransfer);
  const showSteamOverlay = useLibraryStore((s) => s.showSteamOverlay);
  const hideSteamOverlay = useLibraryStore((s) => s.hideSteamOverlay);

  const openEditModal = useLibraryStore((s) => s.openEditModal);
  const deleteConfirmGame = useLibraryStore((s) => s.deleteConfirmGame);
  const requestDeleteGame = useLibraryStore((s) => s.requestDeleteGame);
  const cancelDeleteGame = useLibraryStore((s) => s.cancelDeleteGame);
  const confirmDeleteGame = useLibraryStore((s) => s.confirmDeleteGame);

  const uploadConfirmGame = useLibraryStore((s) => s.uploadConfirmGame);
  const requestUploadGame = useLibraryStore((s) => s.requestUploadGame);
  const cancelUploadGame = useLibraryStore((s) => s.cancelUploadGame);

  const selectedGame = useMemo(
    () => games.find((g) => g.id === selectedGameId) ?? null,
    [games, selectedGameId]
  );

  /** Alle in der Bibliothek tatsächlich vergebenen Kategorien, für die Filter-Buttons */
  const categories = useMemo(() => {
    const set = new Set(games.map((g) => g.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [games]);

  const [sortBy, setSortBy] = useState("name"); // name | status | category | playtime | recent

  const STATUS_SORT_ORDER = {
    installed: 0,
    "steam-downloading": 1,
    downloading: 1,
    uploading: 1,
    "steam-owned": 2,
    cloud: 3,
  };

  const filteredGames = useMemo(() => {
    // Auf der Home-Ansicht gibt es keine Suche/Filter - immer alle Spiele
    if (isHome) return games;
    const query = searchQuery.trim().toLowerCase();
    const filtered = games.filter((g) => {
      const matchesQuery = !query || g.name?.toLowerCase().includes(query);
      const matchesCategory = libraryCategory === "all" || g.category === libraryCategory;
      return matchesQuery && matchesCategory;
    });

    const sorted = [...filtered];
    if (sortBy === "name") {
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "status") {
      sorted.sort((a, b) => {
        const diff = (STATUS_SORT_ORDER[a.status] ?? 9) - (STATUS_SORT_ORDER[b.status] ?? 9);
        return diff !== 0 ? diff : (a.name || "").localeCompare(b.name || "");
      });
    } else if (sortBy === "category") {
      sorted.sort((a, b) => {
        const diff = (a.category || "zzz").localeCompare(b.category || "zzz");
        return diff !== 0 ? diff : (a.name || "").localeCompare(b.name || "");
      });
    } else if (sortBy === "playtime") {
      sorted.sort((a, b) => (b.playtimeMinutes || 0) - (a.playtimeMinutes || 0));
    } else if (sortBy === "recent") {
      sorted.sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
    }
    return sorted;
  }, [games, searchQuery, libraryCategory, isHome, sortBy]);

  const recentGames = useMemo(() => {
    return games
      .filter((g) => g.lastPlayedAt)
      .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
      .slice(0, 6);
  }, [games]);

  /** Für jedes Spiel den passenden aktiven Transfer (falls vorhanden) finden */
  const transferByGameId = useMemo(() => {
    const map = {};
    Object.values(transfers).forEach((t) => {
      if (t.phase !== "done") map[t.gameId] = t;
    });
    return map;
  }, [transfers]);

  useKeyboardNav({
    items: filteredGames,
    columns: COLUMNS,
    selectedId: selectedGameId,
    onSelect: selectGame,
    onActivate: (game) => handlePrimaryAction(game),
    onBack: () => {},
    enabled: !gameModal.isOpen && !deleteConfirmGame && !uploadConfirmGame,
  });

  async function handlePrimaryAction(game) {
    if (!game) return;
    if (game.status === "installed") {
      await handleLaunch(game);
    } else if (game.status === "cloud") {
      await handleDownload(game);
    }
  }

  async function handleLaunch(game) {
    setLaunchError(null);
    if (game.source === "steam") {
      showSteamOverlay({ type: "launch", gameName: game.name });
    }
    try {
      await launchGame(game);
    } catch (error) {
      console.error("Spielstart fehlgeschlagen:", error);
      setLaunchError(error?.message || t("errors.gameStartFailed"));
      hideSteamOverlay();
    }
  }

  async function handleDownload(game) {
    updateGame(game.id, { status: "downloading" });
    try {
      await window.api.cloudDownload(game);
      updateGame(game.id, { status: "installed" });
    } catch (err) {
      console.error(err);
      updateGame(game.id, { status: "cloud" });
    }
  }

  /** "Herunterladen" bei einem importierten, aber noch nicht lokal
   * installierten Steam-Spiel - siehe steamDownloadWatcher.js für die
   * ehrliche Erklärung, wie das technisch funktioniert (Steam lädt
   * eigentlich selbst herunter, Avis beobachtet nur den Fortschritt). */
  async function handleSteamInstall(game) {
    showSteamOverlay({ type: "download", gameName: game.name });
    updateGame(game.id, { status: "steam-downloading" });
    upsertTransfer(`steam-${game.id}`, {
      gameId: game.id,
      direction: "steam",
      phase: "downloading",
    });
    const result = await window.api.startSteamInstall({ gameId: game.id, appId: game.steamAppId });
    if (!result.success) {
      updateGame(game.id, { status: "steam-owned" });
      setLaunchError(result.error || t("errors.installStartFailed"));
      hideSteamOverlay();
    }
  }

  async function handleUpload(game, uploadOptions) {
    updateGame(game.id, { status: "uploading" });
    try {
      await window.api.cloudUpload(game, uploadOptions);
      updateGame(game.id, { status: "installed" });
    } catch (err) {
      console.error(err);
      updateGame(game.id, { status: "installed" });
    }
  }

  if (games.length === 0) {
    return (
      <div className="relative z-10 flex h-[70vh] flex-col items-center justify-center gap-2 text-white/40">
        <p className="text-lg">Deine Bibliothek ist noch leer.</p>
        <p className="text-sm">
          Klicke oben rechts auf „Spiel hinzufügen", um zu starten.
        </p>
      </div>
    );
  }

  const detailPanel = selectedGame && (
    <motion.div
      key={selectedGame.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex max-w-xl flex-col gap-3"
    >
      <div>
        <p className="text-xs uppercase tracking-widest text-white/40">Ausgewählt</p>
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">{selectedGame.name}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/50">
          <Clock size={13} />
          {formatPlaytime(selectedGame.playtimeMinutes)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {selectedGame.status === "installed" && (
          <ActionButton icon={Play} label={t("action.start")} primary onClick={() => handleLaunch(selectedGame)} />
        )}
        {selectedGame.status === "steam-owned" && (
          <ActionButton
            icon={DownloadCloud}
            label={t("action.download")}
            primary
            onClick={() => handleSteamInstall(selectedGame)}
          />
        )}
        {selectedGame.status === "steam-downloading" && (
          <ActionButton icon={Loader2} label={t("status.steamDownloadingEllipsis")} spin disabled />
        )}
        {selectedGame.status === "cloud" && (
          <ActionButton
            icon={DownloadCloud}
            label={t("action.downloadFromCloud")}
            primary
            onClick={() => handleDownload(selectedGame)}
          />
        )}
        {selectedGame.status === "downloading" && (
          <ActionButton icon={Loader2} label={t("status.downloadingEllipsis")} spin disabled />
        )}
        {selectedGame.status === "uploading" && (
          <ActionButton icon={Loader2} label={t("status.uploadingEllipsis")} spin disabled />
        )}
        {selectedGame.status === "installed" && (
          <ActionButton
            icon={UploadCloud}
            label={t("action.saveToCloud")}
            onClick={() => requestUploadGame(selectedGame)}
          />
        )}
        {selectedGame.source === "steam" && (
          <ActionButton
            icon={Trophy}
            label={t("achievements.title")}
            onClick={() => setAchievementsGame(selectedGame)}
          />
        )}
        <ActionButton icon={Pencil} label={t("common.edit")} iconOnly onClick={() => openEditModal(selectedGame)} />
        <ActionButton icon={Trash2} label={t("common.delete")} iconOnly onClick={() => requestDeleteGame(selectedGame)} />
      </div>
      {launchError && (
        <p className="flex items-center gap-1.5 text-sm text-red-400">
          <AlertCircle size={14} /> {launchError}
        </p>
      )}
    </motion.div>
  );

  return (
    <div className="relative z-10 flex flex-col gap-10 px-8 pb-12">
      {isHome ? (
        <>
          {/* Begrüßung */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-white">{getGreeting(t)}</h1>
            <p className="mt-1 text-sm text-white/40">
              {t(games.length === 1 ? "home.gamesCountOne" : "home.gamesCount", { n: games.length })}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
            <NewsFeed />
          </motion.div>

          {detailPanel}

          {/* Zuletzt gespielt */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            {recentGames.length > 0 ? (
              <div>
                <div className="mb-3 flex items-center gap-2 text-white/70">
                  <Clock size={15} className="text-accent-soft" />
                  <h2 className="text-sm font-semibold">{t("home.recentlyPlayed")}</h2>
                </div>
                <div className="flex gap-6 overflow-x-auto px-1 pb-3 pt-2">
                  {recentGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isFocused={game.id === selectedGameId}
                      transfer={transferByGameId[game.id]}
                      onSelect={() => selectGame(game.id)}
                      onShowInfo={setInfoGame}
                      onEdit={openEditModal}
                      onDelete={requestDeleteGame}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white/70">
                <Clock size={15} className="text-accent-soft" />
                <p className="text-sm text-white/40">
                  {t("home.nothingPlayedYetPre")}{" "}
                  <button
                    onClick={() => useLibraryStore.getState().setView("library")}
                    className="text-accent-soft underline-offset-2 hover:underline"
                  >
                    {t("nav.library")}
                  </button>
                  {t("home.nothingPlayedYetPost")}
                </p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="border-t border-white/5 pt-8"
          >
            <UpcomingGames />
          </motion.div>
        </>
      ) : (
        <>
          {/* Suchleiste */}
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("library.searchPlaceholder")}
              className="w-full rounded-full bg-white/5 py-2 pl-9 pr-9 text-sm text-white placeholder-white/30 ring-1 ring-white/10 transition-shadow focus:ring-2 focus:ring-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Kategorie-Filter - Buttons entstehen automatisch aus den beim Hinzufügen/Bearbeiten vergebenen Kategorien */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLibraryCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    libraryCategory === cat
                      ? "bg-accent text-base-950"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {cat === "all" ? t("library.allCategories") : cat}
                </button>
              ))}
            </div>
          )}

          {/* Sortierung */}
          <SortDropdown value={sortBy} onChange={setSortBy} t={t} />
        </>
      )}

      {/* In der Bibliotheks-Ansicht steht das Detail-Panel wie gehabt zwischen
          Filtern und Grid; auf Home steht es schon weiter oben (s.o.) */}
      {!isHome && detailPanel}

      {/* Grid der Spielekarten - nur in der Bibliotheks-Ansicht, Home zeigt nur "Zuletzt gespielt" */}
      {!isHome && (
        filteredGames.length === 0 ? (
          <p className="text-sm text-white/40">{t("library.noResults")}</p>
        ) : (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 192px))" }}
          >
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isFocused={game.id === selectedGameId}
                transfer={transferByGameId[game.id]}
                onSelect={() => selectGame(game.id)}
                onShowInfo={setInfoGame}
                onEdit={openEditModal}
                onDelete={requestDeleteGame}
              />
            ))}
          </div>
        )
      )}

      {/* Bestätigung: Spiel löschen */}
      <ConfirmDialog
        open={Boolean(deleteConfirmGame)}
        danger
        icon={Trash2}
        title={t("library.deleteTitle", { name: deleteConfirmGame?.name })}
        message={t("library.deleteMessage")}
        confirmLabel={t("common.delete")}
        onCancel={cancelDeleteGame}
        onConfirm={confirmDeleteGame}
      />

      {/* Bestätigung: In Cloud sichern */}
      <ConfirmDialog
        open={Boolean(uploadConfirmGame)}
        icon={UploadCloud}
        title={t("library.uploadTitle", { name: uploadConfirmGame?.name })}
        message={t("library.uploadMessage")}
        confirmLabel={t("library.uploadConfirm")}
        onCancel={cancelUploadGame}
        onConfirm={() => {
          const game = uploadConfirmGame;
          cancelUploadGame();
          if (game) handleUpload(game, { strongCompression });
        }}
      >
        <label className="flex items-start gap-2.5 text-sm text-white/70">
          <input
            type="checkbox"
            checked={strongCompression}
            onChange={(e) => setStrongCompression(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <span>
            {t("library.strongCompression")}
            <span className="mt-0.5 block text-xs text-white/40">
              {t("library.strongCompressionHint")}
            </span>
          </span>
        </label>
      </ConfirmDialog>
      <GameInfoPopup
        game={infoGame}
        onClose={() => setInfoGame(null)}
        onPrimaryAction={handlePrimaryAction}
      />
      <AchievementsPanel game={achievementsGame} onClose={() => setAchievementsGame(null)} />
    </div>
  );
}

function getSortOptions(t) {
  return [
    { value: "name", label: t("library.sortName") },
    { value: "status", label: t("library.sortStatus") },
    { value: "category", label: t("library.sortCategory") },
    { value: "playtime", label: t("library.sortPlaytime") },
    { value: "recent", label: t("library.sortRecent") },
  ];
}

function SortDropdown({ value, onChange, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const SORT_OPTIONS = getSortOptions(t);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/70 outline-none hover:bg-white/10"
      >
        <ArrowUpDown size={13} className="text-white/30" />
        {current.label}
        <ChevronDown size={13} className={`text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl bg-base-800 py-1 shadow-xl ring-1 ring-white/10"
          >
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center px-3.5 py-2 text-left text-xs transition-colors ${
                  option.value === value
                    ? "bg-accent/15 text-accent-soft"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, primary, spin, disabled, iconOnly }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      title={iconOnly ? label : undefined}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      className={`flex items-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        iconOnly ? "h-10 w-10 justify-center" : "px-5 py-2.5 text-sm"
      } ${primary ? "bg-accent text-base-950 hover:bg-accent-soft" : "bg-white/10 text-white hover:bg-white/20"}`}
    >
      <Icon size={16} className={spin ? "animate-spin" : ""} />
      {!iconOnly && label}
    </motion.button>
  );
}
