import { create } from "zustand";
import { loadBackgroundConfig, saveBackgroundConfig } from "../utils/background";
import { loadSavedLanguage, saveLanguage } from "../utils/i18n";

/**
 * Merkt sich, wann ein Spiel gestartet wurde (nicht persistiert, nur für die
 * laufende Session), um beim Beenden die Spielzeit hochzurechnen.
 */
const sessionStarts = new Map();

/**
 * Lässt nur bekannte, garantiert reine Datenfelder eines Spiels durch.
 * WICHTIG: Wird auf JEDES Spiel angewendet, bevor es über die IPC-Brücke
 * ans Backend geschickt wird (Speichern UND Starten) - unabhängig davon,
 * was sich sonst noch (z.B. durch einen Bug anderswo) an das Objekt
 * gehängt haben könnte. Das ist die zuverlässige Lösung gegen
 * "An object could not be cloned" bzw. stillschweigend fehlschlagendes
 * Speichern durch genau denselben Grund.
 */
function sanitizeGame(game) {
  return {
    id: game.id,
    name: game.name,
    status: game.status,
    executablePath: game.executablePath,
    installPath: game.installPath,
    coverImage: game.coverImage,
    logoImage: game.logoImage,
    bannerImage: game.bannerImage,
    launchArgs: game.launchArgs,
    category: game.category,
    playtimeMinutes: game.playtimeMinutes,
    lastPlayedAt: game.lastPlayedAt ?? null,
    source: game.source,
    steamAppId: game.steamAppId,
    achievementsComplete: game.achievementsComplete ?? false,
  };
}

/**
 * Zentrale State-Verwaltung der Bibliothek.
 * status pro Spiel: "cloud" | "installed" | "downloading" | "uploading"
 */
export const useLibraryStore = create((set, get) => ({
  games: [],
  selectedGameId: null,
  view: "home", // "home" | "library" | "downloads" | "cloud" | "settings"
  transfers: {}, // transferId -> { gameId, direction, phase, percent, speed, eta }
  searchQuery: "",
  libraryCategory: "all", // aktuell ausgewählter Kategorie-Filter in der Bibliothek
  backgroundConfig: loadBackgroundConfig(),

  // Add/Edit-Modal für Spiele
  gameModal: { isOpen: false, editingGame: null, prefill: null, dialogDefaultPath: null },

  // Bestätigungsdialoge
  deleteConfirmGame: null, // Spiel-Objekt oder null
  uploadConfirmGame: null, // Spiel-Objekt oder null

  // Overlay während Steam im Hintergrund etwas tut (Start/Download) -
  // lenkt vom eventuellen kurzen Steam-Aufblitzen ab, ohne dessen Fenster
  // real zu verdecken (das würde nötige Klicks in Steam blockieren).
  steamOverlay: null, // { type: "launch" | "download", gameName } oder null
  showSteamOverlay: (payload) => set({ steamOverlay: payload }),
  hideSteamOverlay: () => set({ steamOverlay: null }),

  // --- Initialisierung ---
  loadLibrary: async () => {
    const games = await window.api.loadLibrary();
    set({ games, selectedGameId: games[0]?.id ?? null });
  },

  persist: async () => {
    try {
      await window.api.saveLibrary(get().games.map(sanitizeGame));
    } catch (error) {
      // Vorher schlug das hier bei verunreinigten Objekten lautlos fehl,
      // wodurch neu hinzugefügte Spiele beim nächsten Start wieder weg
      // waren (weil nie wirklich gespeichert wurde). Jetzt zumindest in der
      // Konsole sichtbar, damit es auffällt.
      console.error("Bibliothek konnte nicht gespeichert werden:", error);
    }
  },

  // --- Navigation ---
  setView: (view) => set({ view }),
  selectGame: (id) => set({ selectedGameId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLibraryCategory: (category) => set({ libraryCategory: category }),
  setBackgroundConfig: (patch) =>
    set((state) => {
      const next = { ...state.backgroundConfig, ...patch };
      saveBackgroundConfig(next);
      return { backgroundConfig: next };
    }),

  // --- CRUD ---
  addGame: (game) => {
    const newGame = {
      id: crypto.randomUUID(),
      status: "installed",
      playtimeMinutes: 0,
      category: "",
      ...game,
    };
    set((state) => ({ games: [...state.games, newGame] }));
    get().persist();
  },

  /** Fügt ein Spiel mit fester ID hinzu (z.B. beim Wiederherstellen aus der Cloud) */
  addExistingGame: (game) => {
    set((state) => {
      if (state.games.some((g) => g.id === game.id)) return state;
      return { games: [...state.games, { playtimeMinutes: 0, category: "", ...game }] };
    });
    get().persist();
  },

  updateGame: (id, patch) => {
    set((state) => ({
      games: state.games.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
    get().persist();
  },

  removeGame: (id) => {
    set((state) => {
      const remaining = state.games.filter((g) => g.id !== id);
      return {
        games: remaining,
        selectedGameId: state.selectedGameId === id ? remaining[0]?.id ?? null : state.selectedGameId,
      };
    });
    get().persist();
  },

  // --- Add/Edit-Modal ---
  openAddModal: (prefill = null, dialogDefaultPath = null) =>
    set({ gameModal: { isOpen: true, editingGame: null, prefill, dialogDefaultPath } }),
  openEditModal: (game) =>
    set({ gameModal: { isOpen: true, editingGame: game, prefill: null, dialogDefaultPath: null } }),
  closeGameModal: () =>
    set({ gameModal: { isOpen: false, editingGame: null, prefill: null, dialogDefaultPath: null } }),

  // --- Löschen mit Bestätigung ---
  requestDeleteGame: (game) => set({ deleteConfirmGame: game }),
  cancelDeleteGame: () => set({ deleteConfirmGame: null }),
  confirmDeleteGame: () => {
    const game = get().deleteConfirmGame;
    if (game) get().removeGame(game.id);
    set({ deleteConfirmGame: null });
  },

  // --- Upload mit Bestätigung ---
  requestUploadGame: (game) => set({ uploadConfirmGame: game }),
  cancelUploadGame: () => set({ uploadConfirmGame: null }),

  // --- Transfers (Cloud) ---
  upsertTransfer: (transferId, payload) =>
    set((state) => ({
      transfers: {
        ...state.transfers,
        [transferId]: { ...state.transfers[transferId], ...payload },
      },
    })),

  removeTransfer: (transferId) =>
    set((state) => {
      const next = { ...state.transfers };
      delete next[transferId];
      return { transfers: next };
    }),

  // --- Spiel starten + Spielzeit tracken ---
  launchGame: async (game) => {
    const plainGame = sanitizeGame(game);
    const result = await window.api.launchGame(plainGame);
    if (result?.started) {
      sessionStarts.set(game.id, Date.now());
      get().updateGame(game.id, { lastPlayedAt: Date.now() });
    }
    return result;
  },

  endSession: (gameId) => {
    const startedAt = sessionStarts.get(gameId);
    if (!startedAt) return;
    sessionStarts.delete(gameId);
    const elapsedMinutes = Math.round((Date.now() - startedAt) / 60000);
    if (elapsedMinutes <= 0) return;
    set((state) => ({
      games: state.games.map((g) =>
        g.id === gameId ? { ...g, playtimeMinutes: (g.playtimeMinutes || 0) + elapsedMinutes } : g
      ),
    }));
    get().persist();
  },

  // --- Sprache ---
  language: loadSavedLanguage(),
  setLanguage: (code) => {
    saveLanguage(code);
    set({ language: code });
  },

  // --- Eingebauten Browser-Tab von außen steuern (z.B. Klick auf News-Artikel) ---
  pendingBrowserUrl: null,
  openInBrowserTab: (url) => set({ pendingBrowserUrl: url, view: "browser" }),
  clearPendingBrowserUrl: () => set({ pendingBrowserUrl: null }),
}));

/** Formatiert Minuten als lesbare Spielzeit, z.B. "2h 15min" oder "42min" */
export function formatPlaytime(minutes) {
  if (!minutes || minutes <= 0) return "Noch nicht gespielt";
  if (minutes < 60) return `${minutes} min gespielt`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}min gespielt` : `${hours}h gespielt`;
}
