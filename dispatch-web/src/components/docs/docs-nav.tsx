"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type DocSectionLink = {
  id: string;
  label: string;
  /** Compact label for the mobile pill row. */
  short: string;
};

/**
 * The docs manifest: the same numbered mono index as the app sidebar, with
 * an amber tick on whichever section is crossing the reading band. On
 * mobile it folds into a sticky horizontal pill row under the navbar.
 */
export function DocsNav({
  sections,
  back,
}: {
  sections: DocSectionLink[];
  /** Optional "← back" link rendered at the top of the rail. */
  back?: { href: string; label: string };
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const pillRefs = useRef(new Map<string, HTMLAnchorElement>());

  // Scroll-spy: the section crossing the upper band of the viewport wins —
  // same pattern as the settings page.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-10% 0px -70% 0px" }
    );

    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  // Keep the active pill visible as the reader scrolls past sections.
  useEffect(() => {
    pillRefs.current
      .get(active)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <>
      {/* desktop: sticky numbered rail */}
      <nav
        aria-label="Documentation sections"
        className="sticky top-24 hidden self-start lg:block"
      >
        {back ? (
          <Link
            href={back.href}
            className="mb-4 inline-flex items-baseline gap-1.5 font-mono text-[11px] text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <span aria-hidden="true">←</span>
            {back.label}
          </Link>
        ) : null}
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          contents
        </p>
        <ul className="mt-3 border-l border-zinc-800">
          {sections.map(({ id, label }, i) => {
            const current = active === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={current ? "true" : undefined}
                  className={cn(
                    "group/doc relative -ml-px flex items-baseline gap-2.5 border-l py-1.5 pl-4 font-mono text-[12px] transition-colors",
                    current
                      ? "border-amber-400 text-zinc-100"
                      : "border-transparent text-zinc-500 hover:text-zinc-200"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] tracking-wider transition-colors",
                      current
                        ? "text-amber-400"
                        : "text-zinc-700 group-hover/doc:text-zinc-500"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {label.toLowerCase()}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* mobile: sticky pill row under the public nav (h-14) */}
      <nav
        aria-label="Documentation sections"
        className="sticky top-14 z-30 -mx-6 border-b border-zinc-800/70 bg-zinc-950/90 backdrop-blur-md lg:hidden"
      >
        <div className="flex gap-2 overflow-x-auto px-6 py-3">
          {back ? (
            <Link
              href={back.href}
              className="shrink-0 rounded-sm border border-zinc-800 px-2.5 py-1 font-mono text-[11px] whitespace-nowrap text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            >
              <span aria-hidden="true" className="mr-1.5">
                ←
              </span>
              docs
            </Link>
          ) : null}
          {sections.map(({ id, short }, i) => {
            const current = active === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                ref={(el) => {
                  if (el) pillRefs.current.set(id, el);
                  else pillRefs.current.delete(id);
                }}
                aria-current={current ? "true" : undefined}
                className={cn(
                  "shrink-0 rounded-sm border px-2.5 py-1 font-mono text-[11px] whitespace-nowrap transition-colors",
                  current
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200"
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 text-[9px] tracking-wider",
                    current ? "text-amber-400/80" : "text-zinc-700"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {short}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
