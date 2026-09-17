import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, UploadCloud } from "lucide-react";
import { useT } from "../hooks/useT";

/**
 * Generischer Bestätigungsdialog, z.B. für "Spiel löschen" oder
 * "In Cloud sichern". `danger` färbt den Bestätigen-Button rot statt Accent.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  icon,
  onConfirm,
  onCancel,
  children,
}) {
  const t = useT();
  const Icon = icon ?? (danger ? AlertTriangle : UploadCloud);
  const confirmText = confirmLabel ?? t("common.confirm");
  const cancelText = cancelLabel ?? t("common.cancel");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-base-850 p-6 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                  danger ? "bg-red-500/15 text-red-400" : "bg-accent/15 text-accent-soft"
                }`}
              >
                <Icon size={20} />
              </div>
              <h2 className="text-base font-semibold text-white">{title}</h2>
            </div>

            <p className="text-sm leading-relaxed text-white/60">{message}</p>

            {children}

            <div className="mt-1 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-full px-4 py-2 text-sm text-white/60 hover:text-white"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  danger
                    ? "bg-red-500 text-white hover:bg-red-400"
                    : "bg-accent text-base-950 hover:bg-accent-soft"
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
