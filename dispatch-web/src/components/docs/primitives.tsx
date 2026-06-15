import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Server-rendered docs primitives. Everything here follows the app's
 * instrument language: mono legends, square corners, LED-style chips, and
 * amber only where something is armed or required.
 */

export function DocSection({
  index,
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  index: string;
  id: string;
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-32 border-t border-zinc-800/70 pt-12 first:border-t-0 first:pt-0 lg:scroll-mt-24"
    >
      <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
        <span className="text-amber-400">{index}</span>
        <span className="mx-2 text-zinc-700">/</span>
        {eyebrow}
      </p>
      <h2
        id={`${id}-heading`}
        className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100"
      >
        {title}
      </h2>
      {lead ? (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
          {lead}
        </p>
      ) : null}
      {children ? <div className="mt-8 space-y-8">{children}</div> : null}
    </section>
  );
}

/** Inline code — a small keycap. */
export function K({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5 font-mono text-[0.82em] text-zinc-200">
      {children}
    </code>
  );
}

export function P({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn("max-w-2xl text-sm leading-relaxed text-zinc-400", className)}>
      {children}
    </p>
  );
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/** Same chip treatment as the job status lamps: GET reads scheduled-sky,
 *  POST is armed amber, DELETE is the red you should respect. */
const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  POST: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  PUT: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  DELETE: "border-red-500/30 bg-red-500/10 text-red-400",
};

export function MethodBadge({
  method,
  className,
}: {
  method: HttpMethod;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-14 shrink-0 items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em]",
        METHOD_STYLES[method],
        className
      )}
    >
      {method}
    </span>
  );
}

export type AuthKind = "api-key" | "bearer" | "none";

export function AuthTag({ auth }: { auth: AuthKind }) {
  if (auth === "none") return null;
  return (
    <span className="font-mono text-[10px] tracking-[0.15em] uppercase">
      <span className="text-zinc-600">auth · </span>
      <span className={auth === "api-key" ? "text-amber-400/90" : "text-sky-400/90"}>
        {auth === "api-key" ? "x-api-key" : "bearer token"}
      </span>
    </span>
  );
}

export function FieldList({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
        {title}
      </p>
      <div className="mt-1 divide-y divide-zinc-800/50">{children}</div>
    </div>
  );
}

export function Field({
  name,
  type,
  required = false,
  children,
}: {
  name: string;
  type: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <div className="min-w-0">
        <code className="font-mono text-[12.5px] break-all text-zinc-100">
          {name}
        </code>
        <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
          {type}
          {required ? (
            <span className="ml-2 text-amber-400/80">required</span>
          ) : (
            <span className="ml-2 text-zinc-700">optional</span>
          )}
        </p>
      </div>
      <p className="text-[13px] leading-relaxed text-zinc-400">{children}</p>
    </div>
  );
}

const CALLOUT_TONES = {
  info: {
    frame: "border-zinc-800 bg-zinc-900/30",
    legend: "text-zinc-500",
    tick: "bg-zinc-600",
  },
  warn: {
    frame: "border-amber-400/30 bg-amber-400/5",
    legend: "text-amber-400",
    tick: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]",
  },
  planned: {
    frame: "border-zinc-800 bg-zinc-900/30 border-dashed",
    legend: "text-zinc-500",
    tick: "bg-zinc-600",
  },
} as const;

export function Callout({
  tone = "info",
  legend,
  children,
  className,
}: {
  tone?: keyof typeof CALLOUT_TONES;
  legend: string;
  children: ReactNode;
  className?: string;
}) {
  const styles = CALLOUT_TONES[tone];
  return (
    <div className={cn("relative max-w-2xl border p-4", styles.frame, className)}>
      <span
        aria-hidden="true"
        className={cn("absolute top-4 left-0 h-4 w-px", styles.tick)}
      />
      <p
        className={cn(
          "font-mono text-[10px] tracking-[0.2em] uppercase",
          styles.legend
        )}
      >
        {legend}
      </p>
      <div className="mt-2 text-sm leading-relaxed text-zinc-400">{children}</div>
    </div>
  );
}
