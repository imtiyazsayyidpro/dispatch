"use client";

import { motion, useReducedMotion } from "framer-motion";

import { TickRule } from "@/components/app/tick-rule";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

/**
 * Standard page masthead: mono breadcrumb, title (with optional action on
 * the same baseline), optional meta line, and the chronograph tick rule
 * anchoring the whole header to the page.
 */
export function PageHeader({
  path,
  title,
  meta,
  action,
}: {
  /** Breadcrumb segments, e.g. ["app", "jobs"] — the first renders amber. */
  path: [string, string];
  title: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  return (
    <header>
      <motion.p
        {...enter(0)}
        className="font-mono text-xs tracking-widest text-zinc-500"
      >
        <span className="text-amber-400">{path[0]}</span>
        <span className="mx-2 text-zinc-700">/</span>
        {path[1]}
      </motion.p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <motion.h1
          {...enter(0.06)}
          className="min-w-0 truncate text-3xl font-semibold tracking-tight text-zinc-100"
        >
          {title}
        </motion.h1>
        {action ? <motion.div {...enter(0.1)}>{action}</motion.div> : null}
      </div>

      {meta ? (
        <motion.div {...enter(0.1)} className="mt-2">
          {meta}
        </motion.div>
      ) : null}

      <motion.div {...enter(0.14)}>
        <TickRule className="mt-6" />
      </motion.div>
    </header>
  );
}
