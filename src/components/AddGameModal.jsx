import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FolderOpen, Image as ImageIcon } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { resolveImageSrc } from "../utils/image";
import { useT } from "../hooks/useT";

const emptyForm = {
  name: "",
  executablePath: "",
  installPath: "",
  coverImage: "",
  logoImage: "",
  bannerImage: "",
  launchArgs: "",
  category: "",
};

export default function AddGameModal() {
  const gameModal = useLibraryStore((s) => s.gameModal);
  const closeModal = useLibraryStore((s) => s.closeGameModal);
  const addGame = useLibraryStore((s) => s.addGame);
  const updateGame = useLibraryStore((s) => s.updateGame);
  const existingCategories = useLibraryStore((s) => [
    ...new Set(s.games.map((g) => g.category).filter(Boolean)),
  ]);
  const [form, setForm] = useState(emptyForm);
  const t = useT();

  const isEditing = Boolean(gameModal.editingGame);

  // Formular mit den Werten des zu bearbeitenden Spiels vorbefüllen, oder
  // mit einer Vorbefüllung (z.B. von einem abgeschlossenen Browser-Download)
  useEffect(() => {
    if (gameModal.isOpen) {
      if (gameModal.editingGame) {
        setForm({ ...emptyForm, ...gameModal.editingGame });
      } else if (gameModal.prefill) {
        setForm({ ...emptyForm, ...gameModal.prefill });
      } else {
        setForm(emptyForm);
      }
    }
  }, [gameModal.isOpen, gameModal.editingGame, gameModal.prefill]);

  // Dateidialoge starten direkt im Ordner des Downloads, falls vorhanden
  const dialogDefaultPath = gameModal.dialogDefaultPath || undefined;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function pickExecutable() {
    const filePath = await window.api.selectExecutable(dialogDefaultPath);
    if (filePath) update("executablePath", filePath);
  }

  async function pickInstallFolder() {
    const folderPath = await window.api.selectFolderOrArchive(dialogDefaultPath);
    if (folderPath) update("installPath", folderPath);
  }

  async function pickImage(field) {
    const filePath = await window.api.selectImage();
    if (filePath) update(field, filePath);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name) return;
    // Nur bei lokal hinzugefügten Spielen einen Executable-Pfad verlangen -
    // Steam-Spiele starten über Steam selbst und haben nie einen lokalen
    // Pfad in Avis hinterlegt. Ohne diese Ausnahme ließ sich z.B. das Cover
    // eines Steam-Spiels nie speichern, weil "Speichern" hier lautlos
    // abgebrochen wurde.
    if (form.source !== "steam" && !form.executablePath) return;
    if (isEditing) {
      updateGame(gameModal.editingGame.id, form);
    } else {
      addGame(form);
    }
    closeModal();
  }

  return (
    <AnimatePresence>
      {gameModal.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closeModal}
        >
          <motion.form
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="flex w-full max-w-lg flex-col gap-4 rounded-2xl bg-base-850 p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? t("addGame.editTitle") : t("addGame.addTitle")}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <Field label={t("addGame.name")}>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder={t("addGame.namePlaceholder")}
                className="input"
              />
            </Field>

            {form.source !== "steam" && (
              <>
                <Field label={t("addGame.executable")}>
                  <PathPicker
                    value={form.executablePath}
                    onPick={pickExecutable}
                    placeholder={t("addGame.executablePlaceholder")}
                  />
                </Field>

                <Field label={t("addGame.installFolder")}>
                  <PathPicker
                    value={form.installPath}
                    onPick={pickInstallFolder}
                    placeholder={t("addGame.installFolderPlaceholder")}
                    icon={FolderOpen}
                  />
                </Field>
              </>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Field label={t("addGame.cover")}>
                <ImagePicker value={form.coverImage} onPick={() => pickImage("coverImage")} />
              </Field>
              <Field label={t("addGame.logo")}>
                <ImagePicker value={form.logoImage} onPick={() => pickImage("logoImage")} />
              </Field>
              <Field label={t("addGame.banner")}>
                <ImagePicker value={form.bannerImage} onPick={() => pickImage("bannerImage")} />
              </Field>
            </div>

            <Field label={t("addGame.category")}>
              <input
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                placeholder={t("addGame.categoryPlaceholder")}
                className="input"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </Field>

            <Field label={t("addGame.launchArgs")}>
              <input
                value={form.launchArgs}
                onChange={(e) => update("launchArgs", e.target.value)}
                placeholder={t("addGame.launchArgsPlaceholder")}
                className="input"
              />
            </Field>

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-4 py-2 text-sm text-white/60 hover:text-white"
              >
                {t("common.cancel")}
              </button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-base-950 hover:bg-accent-soft"
              >
                {isEditing ? t("common.save") : t("common.add")}
              </motion.button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-white/40">{label}</span>
      {children}
    </label>
  );
}

function PathPicker({ value, onPick, placeholder, icon: Icon = FolderOpen }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="input flex items-center justify-between gap-2 text-left"
    >
      <span className={`truncate ${value ? "text-white" : "text-white/30"}`}>
        {value || placeholder}
      </span>
      <Icon size={16} className="flex-shrink-0 text-white/40" />
    </button>
  );
}

function ImagePicker({ value, onPick }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 bg-base-800 text-white/30 hover:border-accent/60 hover:text-accent-soft"
    >
      {value ? (
        <img src={resolveImageSrc(value)} alt="" className="h-full w-full rounded-lg object-cover" />
      ) : (
        <>
          <ImageIcon size={18} />
          <span className="text-[10px]">{t("common.choose")}</span>
        </>
      )}
    </button>
  );
}
