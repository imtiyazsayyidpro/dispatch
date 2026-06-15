import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Reveal } from "./reveal";

/**
 * Sections are numbered like log lines — the numeric motif runs through
 * the whole page (steps, features, timestamps).
 */
export function Section({
  id,
  index,
  eyebrow,
  title,
  intro,
  children,
  className,
}: {
  id: string;
  index: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 border-t border-zinc-800/70 py-20 sm:py-28",
        className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <p className="font-mono text-xs tracking-widest text-zinc-500">
            <span className="text-amber-400">{index}</span>
            <span className="mx-2 text-zinc-700">/</span>
            {eyebrow}
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            {title}
          </h2>
          {intro ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
              {intro}
            </p>
          ) : null}
        </Reveal>
        <div className="mt-12 sm:mt-16">{children}</div>
      </div>
    </section>
  );
}
