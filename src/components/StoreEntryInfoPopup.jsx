import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, HardDrive, Calendar, ExternalLink } from "lucide-react";
import { translate } from "../utils/i18n";

export default function StoreEntryInfoPopup({ entry, language, onClose, onOpenSite }) {
  const t = (key, vars) => translate(language, key, vars);

  return (
    <AnimatePresence>
      {entry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-base-850 shadow-card ring-1 ring-accent/30"
          >
            {/* Cover */}
            <div className="relative h-28 w-full flex-shrink-0 overflow-hidden">
              {entry.coverImage ? (
                <img src={entry.coverImage} alt="" className="h-full w-full object-cover object-top" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-base-700 to-base-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-base-850 via-base-850/40 to-transparent" />
              <button
                onClick={onClose}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur hover:bg-black/70 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* Titel */}
            <div className="flex items-start justify-between gap-2 px-5 pt-4">
              <h2 className="text-lg font-semibold text-white">{entry.name}</h2>
              {entry.category && (
                <span className="flex-shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60">
                  {entry.category}
                </span>
              )}
            </div>

            {/* Meta-Zeilen: Größe + Releasedatum, klar getrennt vom Fließtext */}
            {(entry.sizeLabel || entry.releaseDate) && (
              <div className="mt-3 flex gap-5 px-5 text-xs text-white/50">
                {entry.sizeLabel && (
                  <span className="flex items-center gap-1.5">
                    <HardDrive size={13} className="text-accent-soft" />
                    {entry.sizeLabel}
                  </span>
                )}
                {entry.releaseDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-accent-soft" />
                    {entry.releaseDate}
                  </span>
                )}
              </div>
            )}

            {/* Trennlinie zwischen Meta-Infos und Beschreibung/Anforderungen */}
            {entry.description && <div className="mx-5 mt-4 border-t border-white/10" />}

            {/* Beschreibung / Anforderungen - fließt klar darunter, eigener Scroll-Bereich */}
            {entry.description && (
              <div className="max-h-56 overflow-y-auto px-5 pt-3">
                <p className="whitespace-pre-line text-sm leading-relaxed text-white/60">
                  {entry.description}
                </p>
              </div>
            )}

            <div className="px-5 pb-5 pt-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenSite(entry.url)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-base-950 hover:bg-accent-soft"
              >
                <ExternalLink size={15} />
                {t("store.openSite")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
