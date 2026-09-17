import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Cloud, Download, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { useT } from "../hooks/useT";

export default function CloudBrowser() {
  const games = useLibraryStore((s) => s.games);
  const addExistingGame = useLibraryStore((s) => s.addExistingGame);
  const [remoteGames, setRemoteGames] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const t = useT();

  async function refresh() {
    setStatus("loading");
    setError("");
    const result = await window.api.listRemoteCloudGames();
    if (result.success) {
      setRemoteGames(result.games);
      setStatus("idle");
    } else {
      setError(result.error || t("cloud.loadError"));
      setStatus("error");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const localIds = new Set(games.map((g) => g.id));
  const onlyInCloud = remoteGames.filter((g) => !localIds.has(g.id));

  function handleRestore(remoteGame) {
    addExistingGame({
      id: remoteGame.id,
      name: remoteGame.name,
      coverImage: remoteGame.coverImage,
      logoImage: remoteGame.logoImage,
      bannerImage: remoteGame.bannerImage,
      launchArgs: remoteGame.launchArgs,
      executablePath: "",
      installPath: "",
      status: "cloud",
      playtimeMinutes: 0,
    });
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await window.api.deleteRemoteCloudGame(deleteTarget.id);
      setRemoteGames((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="relative z-10 flex flex-col gap-5 px-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("cloud.title")}</h1>
          <p className="mt-1 max-w-lg text-sm text-white/50">{t("cloud.subtitle")}</p>
        </div>
        <motion.button
          onClick={refresh}
          whileTap={{ scale: 0.92 }}
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
        >
          <RefreshCw size={14} className={status === "loading" ? "animate-spin" : ""} />
          {t("common.refresh")}
        </motion.button>
      </div>

      {status === "error" && (
        <p className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {status === "idle" && remoteGames.length === 0 && (
        <p className="text-sm text-white/40">{t("cloud.empty")}</p>
      )}

      {onlyInCloud.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-white/40">{t("cloud.onlyInCloud")}</p>
          <AnimatePresence initial={false}>
            {onlyInCloud.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-between gap-4 rounded-xl bg-base-800/80 p-4 backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent-soft">
                    <Cloud size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{game.name}</p>
                    <p className="text-xs text-white/40">
                      {game.sizeBytes ? `${(game.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleRestore(game)}
                    className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-base-950 hover:bg-accent-soft"
                  >
                    <Download size={13} />
                    {t("cloud.restore")}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setDeleteTarget(game)}
                    disabled={deletingId === game.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-red-500/80 hover:text-white disabled:opacity-50"
                  >
                    {deletingId === game.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {onlyInCloud.length === 0 && remoteGames.length > 0 && (
        <p className="text-sm text-white/40">{t("cloud.allSynced")}</p>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        danger
        icon={Trash2}
        title={t("cloud.deleteTitle", { name: deleteTarget?.name })}
        message={t("cloud.deleteMessage")}
        confirmLabel={t("cloud.deleteConfirm")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
