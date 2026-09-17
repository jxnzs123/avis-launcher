import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import birdImg from "../assets/bird.png";

const APP_NAME = "AVIS";

export default function SplashScreen({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-base-950"
        >
          {/* Feines Scanlinien-Raster im Hintergrund */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
            }}
          />

          {/* Pulsierender Glow hinter dem Vogel */}
          <motion.div
            className="absolute h-80 w-80 rounded-full bg-accent/25 blur-[100px]"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.9, 0.55], scale: [0.6, 1.2, 1] }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />

          {/* Vogel: fliegt aus dem Off elegant ein, landet, schwebt sanft */}
          <motion.div
            className="relative h-32 w-32"
            initial={{ opacity: 0, x: -220, y: -90, rotate: -30, scale: 0.5 }}
            animate={{
              opacity: 1,
              x: [-220, -40, 0],
              y: [-90, -10, 0],
              rotate: [-30, -4, -6, -8, -6],
              scale: [0.5, 1.05, 1, 1, 1],
            }}
            transition={{
              duration: 2,
              times: [0, 0.55, 0.65, 0.85, 1],
              ease: "easeOut",
            }}
          >
            {/* Sanftes Schweben, sobald der Vogel "gelandet" ist */}
            <motion.img
              src={birdImg}
              alt="Avis"
              className="h-full w-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]"
              animate={{ y: [0, -6, 0], rotate: [-6, -8, -6] }}
              transition={{ duration: 2.4, delay: 1.3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Name Buchstabe für Buchstabe einblenden */}
          <div className="relative flex gap-[0.35em] text-2xl font-semibold tracking-[0.5em] text-white/90">
            {APP_NAME.split("").map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.15 + i * 0.08, ease: "easeOut" }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Dezenter Lade-Fortschrittsstrich */}
          <motion.div
            className="relative h-[2px] w-40 overflow-hidden rounded-full bg-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.3 }}
          >
            <motion.div
              className="h-full w-1/3 rounded-full bg-accent"
              animate={{ x: ["-100%", "220%"] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
