import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";

const emptyForm = { name: "", url: "", description: "" };

export default function StoreLinkModal() {
  const storeLinkModal = useLibraryStore((s) => s.storeLinkModal);
  const closeModal = useLibraryStore((s) => s.closeStoreLinkModal);
  const addStoreLink = useLibraryStore((s) => s.addStoreLink);
  const updateStoreLink = useLibraryStore((s) => s.updateStoreLink);
  const [form, setForm] = useState(emptyForm);

  const isEditing = Boolean(storeLinkModal.editingLink);

  useEffect(() => {
    if (storeLinkModal.isOpen) {
      setForm(storeLinkModal.editingLink ? { ...emptyForm, ...storeLinkModal.editingLink } : emptyForm);
    }
  }, [storeLinkModal.isOpen, storeLinkModal.editingLink]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name || !/^https?:\/\//i.test(form.url)) return;
    if (isEditing) {
      updateStoreLink(storeLinkModal.editingLink.id, form);
    } else {
      addStoreLink(form);
    }
    closeModal();
  }

  return (
    <AnimatePresence>
      {storeLinkModal.isOpen && (
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
            className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-base-850 p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? "Link bearbeiten" : "Store-Link hinzufügen"}
              </h2>
              <button type="button" onClick={closeModal} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <Field label="Name">
              <input
                autoFocus
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="z.B. GOG.com"
                className="input"
              />
            </Field>

            <Field label="URL">
              <input
                value={form.url}
                onChange={(e) => update("url", e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </Field>

            <Field label="Beschreibung (optional)">
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Kurze Notiz, was dort zu finden ist…"
                rows={2}
                className="input resize-none"
              />
            </Field>

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-4 py-2 text-sm text-white/60 hover:text-white"
              >
                Abbrechen
              </button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-base-950 hover:bg-accent-soft"
              >
                {isEditing ? "Speichern" : "Hinzufügen"}
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
