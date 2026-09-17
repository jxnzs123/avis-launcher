import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { useT } from "../hooks/useT";

/**
 * Zeigt sich NUR, wenn ein Update fertig heruntergeladen ist und bereit
 * zur Installation wartet. Während des Downloads passiert bewusst nichts
 * Sichtbares (kein störender Fortschrittsbalken mitten in der Nutzung) -
 * das Update lädt lautlos im Hintergrund.
 */
export default function UpdateBanner() {
  const [status, setStatus] = useState(null); // null | { status: "ready", version }
  const [dismissed, setDismissed] = useState(false);
  const t = useT();

  useEffect(() => {
    const unsubscribe = window.api.onUpdateStatus((payload) => {
      if (payload.status === "ready") setStatus(payload);
    });
    return unsubscribe;
  }, []);

  if (!status || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative z-40 flex items-center justify-center gap-3 bg-accent px-4 py-2 text-sm font-medium text-base-950"
      >
        <RefreshCw size={14} />
        {t("update.readyMessage", { version: status.version })}
        <button
          onClick={() => window.api.installUpdate()}
          className="rounded-full bg-base-950/15 px-3 py-1 text-xs font-semibold hover:bg-base-950/25"
        >
          {t("update.restartNow")}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 text-base-950/60 hover:text-base-950"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
