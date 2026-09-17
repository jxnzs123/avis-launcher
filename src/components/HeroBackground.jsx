import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function HeroBackground({ game, backgroundConfig }) {
  const mode = backgroundConfig?.mode ?? "ambient";

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-base-950">
      <AnimatePresence mode="wait">
        {game?.bannerImage ? (
          <motion.div
            key={`game-${game.id}`}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img
              src={`file://${game.bannerImage}`}
              alt=""
              className="h-full w-full object-cover"
            />
          </motion.div>
        ) : mode === "custom" && backgroundConfig?.imagePath ? (
          <motion.div
            key="custom-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <img
              src={`file://${backgroundConfig.imagePath}`}
              alt=""
              className="h-full w-full object-cover opacity-60 blur-[2px]"
            />
          </motion.div>
        ) : mode === "ambient" ? (
          <motion.div key="ambient-bg" className="absolute inset-0">
            <AmbientBackground />
          </motion.div>
        ) : (
          <motion.div key="classic-bg" className="absolute inset-0 bg-base-950" />
        )}
      </AnimatePresence>

      {/* Verlauf oben (für Top-Bar-Lesbarkeit) und unten (für Grid-Lesbarkeit) */}
      <div className="absolute inset-0 bg-fade-top" />
      <div className="absolute inset-0 bg-fade-bottom" />
      <div className="absolute inset-0 bg-base-950/30" />
    </div>
  );
}

/** Sanft wandernde, leuchtende Farbflächen in der aktuellen Akzentfarbe */
function AmbientBackground() {
  return (
    <div className="absolute inset-0 bg-base-950">
      <motion.div
        className="absolute h-[60vw] w-[60vw] rounded-full bg-accent/25 blur-[120px]"
        style={{ top: "-15%", left: "-10%" }}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, 80, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-[45vw] w-[45vw] rounded-full bg-accent-muted/30 blur-[110px]"
        style={{ bottom: "-10%", right: "-5%" }}
        animate={{ x: [0, -50, 30, 0], y: [0, -30, -60, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-[30vw] w-[30vw] rounded-full bg-accent-soft/20 blur-[100px]"
        style={{ top: "35%", left: "40%" }}
        animate={{ x: [0, 30, -30, 0], y: [0, -20, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Feines Scanlinien-Raster für den "Archiv/Tech"-Look */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
        }}
      />
    </div>
  );
}
