import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Info } from "lucide-react";
import birdImg from "../assets/bird.png";
import { useLibraryStore } from "../store/useLibraryStore";
import { useT } from "../hooks/useT";

/**
 * Overlay, das kurz erscheint, während Steam im Hintergrund etwas tut
 * (Spiel starten oder Download auslösen). Deckt NICHT Steams echtes Fenster
 * ab (das wäre riskant, siehe steamWindow.js) - lenkt nur innerhalb von
 * Avis selbst mit einer eigenen, schönen Animation ab, während irgendwo im
 * Hintergrund vielleicht kurz Steam aufblitzt.
 *
 * Verschwindet automatisch nach ein paar Sekunden - bei "download" mit
 * einem Hinweis, falls Steam tatsächlich eine Bestätigung braucht (z.B.
 * Installationsort bei einer neuen Installation), damit das nicht wie ein
 * Hängenbleiben wirkt.
 */
const AUTO_DISMISS_MS = { launch: 3500, download: 6000 };

export default function SteamActionOverlay() {
  const steamOverlay = useLibraryStore((s) => s.steamOverlay);
  const hideSteamOverlay = useLibraryStore((s) => s.hideSteamOverlay);
  const t = useT();

  useEffect(() => {
    if (!steamOverlay) return;
    const timer = setTimeout(() => hideSteamOverlay(), AUTO_DISMISS_MS[steamOverlay.type] ?? 4000);
    return () => clearTimeout(timer);
  }, [steamOverlay, hideSteamOverlay]);

  return (
    <AnimatePresence>
      {steamOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-base-950/90 backdrop-blur-sm"
        >
          <motion.img
            src={birdImg}
            alt=""
            className="h-16 w-16"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="flex items-center gap-2 text-white/80">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-medium">
              {t(
                steamOverlay.type === "download" ? "steamOverlay.preparing" : "steamOverlay.launching",
                { name: steamOverlay.gameName }
              )}
            </span>
          </div>

          {steamOverlay.type === "download" && (
            <p className="flex max-w-sm items-start gap-1.5 text-center text-xs text-white/40">
              <Info size={13} className="mt-0.5 flex-shrink-0" />
              {t("steamOverlay.confirmHint")}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
