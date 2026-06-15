"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

const TARGETS = [
  "api.acme.dev/webhooks/billing",
  "hooks.northwind.io/reminders",
  "app.lumen.sh/api/digest",
  "api.ferrous.dev/jobs/expire",
  "edge.kapow.run/hooks/retry-sync",
  "api.plover.co/notify/trial-end",
  "core.atlasapp.io/webhooks/report",
  "api.quill.dev/send/weekly",
];

interface Row {
  id: number;
  time: string;
  target: string;
  ok: boolean;
  ms: number;
}

function makeRow(id: number): Row {
  return {
    id,
    time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    target: TARGETS[id % TARGETS.length],
    // every 6th delivery hits a flaky endpoint, so the retry story shows up too
    ok: id % 6 !== 4,
    ms: 40 + ((id * 97) % 320),
  };
}

const MAX_ROWS = 7;

/**
 * A fake-but-honest delivery feed: this is exactly what Dispatch does all
 * day, replayed as ambience next to the auth forms. Rows tail in like a
 * log being followed, which sells the product better than a tagline.
 */
export function DeliveryLog() {
  const reduceMotion = useReducedMotion();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;

    // the first few rows cascade in quickly so the panel never sits empty,
    // then the feed settles into a calm tail
    const tick = () => {
      setRows((prev) => [...prev, makeRow(count++)].slice(-MAX_ROWS));
      timer = setTimeout(tick, count < 5 ? 220 : 1700);
    };
    timer = setTimeout(tick, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      {/* same amber haze the hero terminal sits in */}
      <div
        className="absolute -inset-8 rounded-[2rem] bg-amber-400/5 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] text-zinc-500">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-amber-400" />
            </span>
            delivery log
          </span>
          <span className="font-mono text-[11px] text-zinc-600">
            $ dispatch logs --follow
          </span>
        </div>

        <div className="flex h-64 flex-col justify-end overflow-hidden px-5 py-4 font-mono text-xs leading-7">
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <motion.div
                key={row.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.35, ease: EASE }}
                className="flex items-baseline gap-2 whitespace-nowrap"
              >
                <span className="text-zinc-600">{row.time}</span>
                <span className="text-amber-400">→</span>
                <span className="truncate text-zinc-400">
                  POST {row.target}
                </span>
                {row.ok ? (
                  <span className="shrink-0 text-emerald-400">
                    200{" "}
                    <span className="text-zinc-600">· {row.ms}ms</span>
                  </span>
                ) : (
                  <span className="shrink-0 text-amber-400">
                    503 <span className="text-zinc-600">· retry in 30s</span>
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-xs text-zinc-600">
        somewhere, a webhook just fired exactly on time
      </p>
    </div>
  );
}
