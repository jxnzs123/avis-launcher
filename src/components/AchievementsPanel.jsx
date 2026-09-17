import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trophy, Lock, Loader2, AlertCircle, Check } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { useT } from "../hooks/useT";

/**
 * Zeigt die Achievements eines Steam-Spiels für das eigene Profil.
 * Braucht zwei Dinge aus den Einstellungen (Spiele-Quellen):
 * - eine SteamID (bevorzugt die über "Mit Steam anmelden" eingeloggte,
 *   sonst die manuell eingetragene)
 * - einen persönlichen API-Key
 * Fehlt eins von beiden, wird das klar erklärt statt einfach nichts zu zeigen.
 */
export default function AchievementsPanel({ game, onClose }) {
  const [state, setState] = useState({ status: "loading" }); // loading | missing-config | error | loaded
  const updateGame = useLibraryStore((s) => s.updateGame);
  const language = useLibraryStore((s) => s.language);
  const t = useT();

  useEffect(() => {
    if (!game) return;

    let cancelled = false;

    async function load() {
      setState({ status: "loading" });

      const [config, loggedIn] = await Promise.all([
        window.api.getSteamConfig(),
        window.api.getLoggedInSteamProfile(),
      ]);

      const steamId = loggedIn?.profile?.steamId || config.steamId;
      const apiKey = config.apiKey;

      if (!steamId || !apiKey) {
        if (!cancelled) setState({ status: "missing-config" });
        return;
      }

      const result = await window.api.getSteamAchievements({
        steamId,
        appId: game.steamAppId,
        apiKey,
      });

      if (cancelled) return;
      if (!result.success) {
        setState({ status: "error", message: result.error });
        return;
      }
      // Freigeschaltete zuerst - fühlt sich mehr wie eine Erfolgs-Übersicht an
      const sorted = [...result.achievements].sort((a, b) => {
        if (a.achieved === b.achieved) return 0;
        return a.achieved ? -1 : 1;
      });
      setState({ ...result, achievements: sorted, status: "loaded" });

      const isComplete = result.totalCount > 0 && result.unlockedCount === result.totalCount;
      if (isComplete && !game.achievementsComplete) {
        updateGame(game.id, { achievementsComplete: true });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [game]);

  const percent =
    state.status === "loaded" && state.totalCount > 0
      ? Math.round((state.unlockedCount / state.totalCount) * 100)
      : 0;

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
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-base-850 shadow-card ring-1 ring-accent/30"
          >
            <div className="flex flex-col gap-3 border-b border-white/5 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15">
                    <Trophy size={17} className="text-accent-soft" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">{game.name}</h2>
                    <p className="text-xs text-white/40">{t("achievements.title")}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {state.status === "loaded" && (
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-accent"
                    />
                  </div>
                  <span className="flex-shrink-0 text-xs font-medium text-white/60">
                    {state.unlockedCount}/{state.totalCount} · {percent}%
                  </span>
                </div>
              )}
            </div>

            <div className="overflow-y-auto p-4">
              {state.status === "loading" && (
                <div className="flex justify-center py-14">
                  <Loader2 size={20} className="animate-spin text-white/40" />
                </div>
              )}

              {state.status === "missing-config" && (
                <p className="p-2 text-sm leading-relaxed text-white/50">
                  {t("achievements.missingConfigPre")}{" "}
                  <span className="text-white/70">{t("achievements.missingConfigPath")}</span>{" "}
                  {t("achievements.missingConfigPost")}
                </p>
              )}

              {state.status === "error" && (
                <p className="flex items-center gap-1.5 p-2 text-sm text-red-400">
                  <AlertCircle size={14} /> {state.message}
                </p>
              )}

              {state.status === "loaded" && (
                <div className="flex flex-col gap-1.5">
                  {state.achievements.map((a, i) => (
                    <motion.div
                      key={a.apiName}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.4) }}
                      className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors ${
                        a.achieved ? "bg-white/[0.04]" : "opacity-50"
                      }`}
                    >
                      <div
                        className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg"
                        style={
                          a.achieved
                            ? { boxShadow: "0 0 14px rgb(var(--color-accent) / 0.45)" }
                            : undefined
                        }
                      >
                        {a.icon ? (
                          <img
                            src={a.icon}
                            alt=""
                            className={`h-full w-full object-cover ${a.achieved ? "" : "grayscale"}`}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5">
                            <Lock size={16} className="text-white/20" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white/90">{a.name}</p>
                        {a.description && (
                          <p className="truncate text-xs text-white/40">{a.description}</p>
                        )}
                      </div>
                      {a.achieved ? (
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success/20">
                          <Check size={13} className="text-success" />
                        </div>
                      ) : (
                        <Lock size={14} className="flex-shrink-0 text-white/20" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
