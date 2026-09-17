import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Chrome, X } from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";

const STORAGE_KEY = "avis-browser-extension-prompted";

export default function BrowserExtensionPrompt() {
  const [visible, setVisible] = useState(false);
  const setView = useLibraryStore((s) => s.setView);

  useEffect(() => {
    const alreadyPrompted = localStorage.getItem(STORAGE_KEY);
    if (!alreadyPrompted) {
      const timer = setTimeout(() => setVisible(true), 4200); // erst nach dem Splash-Screen
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss(remember = true) {
    if (remember) localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function goToSettings() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    setView("settings");
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="fixed bottom-6 right-6 z-[70] w-full max-w-sm rounded-2xl bg-base-850 p-5 shadow-card ring-1 ring-accent/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-soft">
                <Chrome size={18} />
              </div>
              <h2 className="text-sm font-semibold text-white">Browser-Downloads in Avis anzeigen?</h2>
            </div>
            <button onClick={() => dismiss(false)} className="text-white/30 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-white/50">
            Der eingebaute Browser-Tab in Avis meldet Downloads bereits
            automatisch, ganz ohne Einrichtung. Nutzt du zusätzlich deinen
            normalen Browser (Chrome, Edge oder Firefox) auf diesem PC, kannst
            du mit einer kleinen, kostenlosen Erweiterung auch dessen
            Downloads live im Downloads-Tab von Avis sehen. Kann jederzeit
            später in den Einstellungen eingerichtet oder deaktiviert werden.
          </p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => dismiss(true)}
              className="rounded-full px-3.5 py-1.5 text-xs text-white/50 hover:text-white"
            >
              Nein danke
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goToSettings}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-base-950 hover:bg-accent-soft"
            >
              Ja, einrichten
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
