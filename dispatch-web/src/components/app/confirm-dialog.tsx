"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Brackets } from "@/components/app/panel";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the destructive (red) style. */
  destructive?: boolean;
  /** Disables actions and shows a working state on the confirm button. */
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <AnimatePresence>{props.open ? <Dialog {...props} /> : null}</AnimatePresence>
  );
}

function Dialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  loading,
  error,
  onConfirm,
  onClose,
}: Omit<ConfirmDialogProps, "open">) {
  const reduceMotion = useReducedMotion();

  // Escape closes — unless a request is in flight.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onClose]);

  // Lock page scroll behind the dialog.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={loading ? undefined : onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      <motion.div
        key="panel"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="relative w-full max-w-md border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/50"
      >
        <Brackets className={destructive ? "text-red-500/50" : "text-zinc-600"} />

        <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
          {title}
        </h2>
        {description ? (
          <div className="mt-2 text-sm leading-relaxed text-zinc-400">
            {description}
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-100"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Working…" : confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
