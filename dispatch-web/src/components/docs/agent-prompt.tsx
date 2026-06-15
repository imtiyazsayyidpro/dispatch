"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, EyeOff, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brackets } from "@/components/app/panel";

export type AgentPromptField = {
  /** Matches a {{KEY}} placeholder inside the prompt. */
  key: string;
  label: string;
  placeholder: string;
  sensitive?: boolean;
};

type CopyState = "idle" | "copying" | "copied";

/**
 * The one live instrument on an otherwise static page: a pre-written
 * agent prompt behind a slowly rotating amber/sky border with a breathing
 * two-tone glow. Everything else on the docs holds still — this hums.
 *
 * Fill the fields, copy, paste into an agent. Blank fields keep their
 * {{KEY}} tokens so the prompt visibly asks to be completed.
 */
export function AgentPrompt({
  title,
  description,
  prompt,
  fields,
  worksWith = "works with claude code · cursor · windsurf · copilot agent mode",
}: {
  title: string;
  description: string;
  prompt: string;
  fields: AgentPromptField[];
  worksWith?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [previewOpen, setPreviewOpen] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function resolvedPrompt() {
    return fields.reduce((text, field) => {
      const value = (values[field.key] ?? "").trim();
      return value ? text.replaceAll(`{{${field.key}}}`, value) : text;
    }, prompt);
  }

  async function handleCopy() {
    if (copyState !== "idle") return;
    setCopyState("copying");
    try {
      await navigator.clipboard.writeText(resolvedPrompt());
      setCopyState("copied");
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      // Clipboard unavailable — open the preview so it can be copied by hand.
      setCopyState("idle");
      setPreviewOpen(true);
    }
  }

  return (
    <div className="relative">
      {/* ambient two-tone glow — amber up front, sky answering behind */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 -z-10"
      >
        <div className="absolute top-0 left-[8%] h-32 w-64 rounded-full bg-amber-400/10 blur-3xl motion-safe:animate-[breathe_5s_ease-in-out_infinite]" />
        <div className="absolute right-[4%] bottom-0 h-32 w-72 rounded-full bg-sky-400/10 blur-3xl motion-safe:animate-[breathe_5s_ease-in-out_infinite] motion-safe:[animation-delay:-2.5s]" />
      </div>

      {/* live border: hairline base + two slow amber/sky glints orbiting it */}
      <div className="relative overflow-hidden p-px">
        <div aria-hidden="true" className="absolute inset-0 bg-zinc-800" />
        <div
          aria-hidden="true"
          className="absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(251,191,36,0.9)_28deg,transparent_110deg,transparent_180deg,rgba(56,189,248,0.55)_210deg,transparent_290deg)] motion-safe:animate-[spin_10s_linear_infinite]"
        />

        <div className="relative bg-zinc-950 p-5 sm:p-7">
          <Brackets className="text-amber-400/40" />

          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-amber-400 uppercase">
              <span className="mr-2 inline-block size-1.5 rounded-full bg-amber-400 align-middle shadow-[0_0_6px_rgba(251,191,36,0.8)] motion-safe:animate-breathe" />
              ai setup
            </p>
            <span className="hidden font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase sm:block">
              prompt · ready
            </span>
          </div>

          <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-100">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">
            {description}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label
                  htmlFor={`agent-field-${field.key}`}
                  className="block font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase"
                >
                  {field.label}
                </label>
                <Input
                  id={`agent-field-${field.key}`}
                  type={field.sensitive ? "password" : "text"}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="h-9 font-mono text-[13px]"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button onClick={handleCopy} disabled={copyState === "copying"}>
              {copyState === "copied" ? (
                <Check data-icon="inline-start" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {copyState === "copying"
                ? "Copying…"
                : copyState === "copied"
                  ? "Copied"
                  : "Copy agent prompt"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={previewOpen}
              aria-controls="agent-prompt-preview"
              onClick={() => setPreviewOpen((open) => !open)}
              className="text-zinc-400 hover:text-zinc-100"
            >
              {previewOpen ? (
                <EyeOff data-icon="inline-start" />
              ) : (
                <Eye data-icon="inline-start" />
              )}
              {previewOpen ? "Hide prompt" : "Preview prompt"}
            </Button>
          </div>

          <p className="mt-4 font-mono text-[10px] tracking-wider text-zinc-600">
            {worksWith}
          </p>

          {previewOpen ? (
            <pre
              id="agent-prompt-preview"
              className="mt-4 max-h-72 overflow-auto border border-zinc-800 bg-zinc-900/40 p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-zinc-300"
            >
              {resolvedPrompt()}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}
