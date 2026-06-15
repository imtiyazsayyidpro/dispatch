"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, KeyRound, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brackets } from "@/components/app/panel";
import * as api from "@/lib/api";
import type { CreatedApiKey } from "@/lib/types";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

interface NewApiKeyModalProps {
  projectId: string;
  open: boolean;
  /** Closes the modal. Phase 2 only reaches this through the Done button. */
  onClose: () => void;
  /** Fired when Done is pressed after a key was created — refresh the list here. */
  onCreated: () => void;
}

/**
 * Two-phase key creation. Phase 1 takes a label; phase 2 reveals the raw
 * key — the only time the server ever returns it — so phase 2 cannot be
 * dismissed by backdrop click or Escape, only by the Done button.
 *
 * All per-open state lives in ModalContent, which mounts fresh each time
 * the modal opens.
 */
export function NewApiKeyModal({
  projectId,
  open,
  onClose,
  onCreated,
}: NewApiKeyModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <ModalContent
          projectId={projectId}
          onClose={onClose}
          onCreated={onCreated}
        />
      ) : null}
    </AnimatePresence>
  );
}

function ModalContent({
  projectId,
  onClose,
  onCreated,
}: Omit<NewApiKeyModalProps, "open">) {
  const reduceMotion = useReducedMotion();

  const [label, setLabel] = useState("");
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealing = created !== null;

  // Escape closes phase 1 only — in phase 2 the key is still unsaved.
  useEffect(() => {
    if (revealing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [revealing, onClose]);

  // Lock the page scroll behind the modal.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    if (!label.trim()) {
      setError("Give the key a label — “production server”, “CI”, anything.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const key = await api.post<CreatedApiKey>(
        `/api/v1/projects/${projectId}/api-keys`,
        { label: label.trim() }
      );
      setCreated(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.key);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the key is selectable in the code block
    }
  }

  function handleDone() {
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={revealing ? undefined : onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      <motion.div
        key="panel"
        role="dialog"
        aria-modal="true"
        aria-label={revealing ? "Copy your API key" : "New API key"}
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={
          reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }
        }
        transition={{ duration: 0.25, ease: EASE }}
        className="relative w-full max-w-md border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/50"
      >
        <Brackets
          className={revealing ? "text-amber-400/60" : "text-zinc-600"}
        />

        {revealing ? (
          <>
            <p className="font-mono text-xs tracking-widest text-zinc-500">
              <span className="text-emerald-400">✓</span>
              <span className="mx-2 text-zinc-700">/</span>
              key created
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-100">
              Copy your key
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
              {created.label} is ready to schedule jobs.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-sm border border-amber-400/30 bg-zinc-900/70 p-3 shadow-[0_0_30px_-12px_rgba(251,191,36,0.5)]">
              <code className="flex-1 font-mono text-xs break-all text-zinc-100 select-all">
                {created.key}
              </code>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={copied ? "Copied" : "Copy key"}
                onClick={handleCopy}
                className="shrink-0 text-zinc-400 hover:text-zinc-100"
              >
                {copied ? <Check className="text-emerald-400" /> : <Copy />}
              </Button>
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-sm border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-xs leading-relaxed text-amber-300">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              This key will not be shown again. Copy it now — we only store a
              hash.
            </p>

            <Button size="lg" onClick={handleDone} className="mt-6 w-full">
              Done
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500"
            >
              <X />
            </Button>

            <p className="font-mono text-xs tracking-widest text-zinc-500">
              <span className="text-amber-400">api keys</span>
              <span className="mx-2 text-zinc-700">/</span>
              new
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-100">
              New API key
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
              A label helps you remember where this key lives — server, CI,
              laptop.
            </p>

            <form
              onSubmit={handleGenerate}
              className="mt-5 space-y-5"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="key-label">Label</Label>
                <Input
                  id="key-label"
                  autoFocus
                  placeholder="production server"
                  value={label}
                  aria-invalid={error ? true : undefined}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-sm border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
                >
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-zinc-100"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  <KeyRound data-icon="inline-start" />
                  {submitting ? "Generating…" : "Generate key"}
                </Button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
