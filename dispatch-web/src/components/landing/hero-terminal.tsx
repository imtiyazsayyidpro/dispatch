"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * The signature element: a full scheduling lifecycle on loop.
 * 1. The request is typed line by line.
 * 2. Dispatch acknowledges with a scheduled job.
 * 3. A timeline sweeps to run_at with *linear* easing — time doesn't ease.
 * 4. The webhook fires, the delivery is logged, the loop holds, then resets.
 */

type Phase = "typing" | "scheduled" | "sweeping" | "fired" | "settled";

const REQUEST_LINES: ReactNode[] = [
  <span key="l0">
    <span className="text-zinc-600">$ </span>
    <span className="text-zinc-300">curl -X POST </span>
    <span className="text-zinc-100">https://api.dispatch.dev/v1/jobs</span>
    <span className="text-zinc-600"> \</span>
  </span>,
  <span key="l1">
    {"    "}
    <span className="text-zinc-300">-H </span>
    <span className="text-zinc-400">
      &quot;Authorization: Bearer dsp_live_4f8a…&quot;
    </span>
    <span className="text-zinc-600"> \</span>
  </span>,
  <span key="l2">
    {"    "}
    <span className="text-zinc-300">-d </span>
    <span className="text-zinc-600">&apos;{"{"}</span>
  </span>,
  <span key="l3">
    {"      "}
    <span className="text-zinc-400">&quot;url&quot;</span>
    <span className="text-zinc-600">: </span>
    <span className="text-zinc-200">
      &quot;https://acme.app/hooks/renew&quot;
    </span>
    <span className="text-zinc-600">,</span>
  </span>,
  <span key="l4">
    {"      "}
    <span className="text-zinc-400">&quot;run_at&quot;</span>
    <span className="text-zinc-600">: </span>
    <span className="text-amber-300">&quot;2026-06-12T09:30:00Z&quot;</span>
  </span>,
  <span key="l5">
    {"    "}
    <span className="text-zinc-600">{"}"}&apos;</span>
  </span>,
];

const SWEEP_SECONDS = 2.4;

function Caret() {
  return (
    <span className="ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] animate-pulse bg-amber-400/80" />
  );
}

function Timeline({
  phase,
  animate,
  onReached,
}: {
  phase: Phase;
  animate: boolean;
  onReached: () => void;
}) {
  const reached = phase === "fired" || phase === "settled";
  const sweeping = phase === "sweeping" || reached;

  return (
    <div className="relative mt-5 pt-4 pb-7">
      <div className="flex items-end justify-between" aria-hidden="true">
        {Array.from({ length: 37 }, (_, i) => (
          <span
            key={i}
            className={
              i % 6 === 0 ? "h-2.5 w-px bg-zinc-700" : "h-1.5 w-px bg-zinc-800"
            }
          />
        ))}
      </div>
      <div className="absolute right-0 bottom-7 left-0 h-px bg-zinc-800" />
      {/* the marker sits at 82% of the rail; the sweep fills exactly up to it */}
      <motion.div
        className="absolute bottom-7 left-0 h-px w-[82%] origin-left bg-amber-400"
        initial={false}
        animate={{ scaleX: sweeping ? 1 : 0 }}
        transition={
          animate && phase === "sweeping"
            ? { duration: SWEEP_SECONDS, ease: "linear" }
            : { duration: 0 }
        }
        onAnimationComplete={() => {
          if (phase === "sweeping") onReached();
        }}
      />
      <div className="absolute top-1 bottom-3.5 left-[82%] w-px bg-amber-400/70">
        {reached && animate && (
          <span className="absolute bottom-[-3px] left-[-3px] size-[7px] animate-ping rounded-full bg-amber-400" />
        )}
        <span
          className={`absolute bottom-[-2.5px] left-[-2.5px] size-1.5 rounded-full ${
            reached ? "bg-amber-400" : "bg-zinc-600"
          }`}
        />
      </div>
      <span className="absolute bottom-0 left-0 font-mono text-[10px] text-zinc-600">
        now
      </span>
      <span className="absolute bottom-0 left-[82%] -translate-x-full pr-2 font-mono text-[10px] text-amber-400/90">
        run_at · 09:30:00Z
      </span>
    </div>
  );
}

export function HeroTerminal() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("typing");
  const [lineCount, setLineCount] = useState(0);
  const [cycle, setCycle] = useState(0);

  const animate = !reduceMotion;
  const effectivePhase: Phase = animate ? phase : "settled";
  const effectiveLines = animate ? lineCount : REQUEST_LINES.length;

  useEffect(() => {
    if (!animate) return;
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      timer =
        lineCount < REQUEST_LINES.length
          ? setTimeout(
              () => setLineCount((c) => c + 1),
              lineCount === 0 ? 500 : 230
            )
          : setTimeout(() => setPhase("scheduled"), 500);
    } else if (phase === "scheduled") {
      timer = setTimeout(() => setPhase("sweeping"), 900);
    } else if (phase === "fired") {
      timer = setTimeout(() => setPhase("settled"), 1400);
    } else if (phase === "settled") {
      timer = setTimeout(() => {
        setLineCount(0);
        setPhase("typing");
        setCycle((c) => c + 1);
      }, 4200);
    }
    return () => clearTimeout(timer);
  }, [animate, phase, lineCount]);

  const scheduled =
    effectivePhase !== "typing" || effectiveLines === REQUEST_LINES.length;
  const acknowledged = effectivePhase !== "typing";
  const fired = effectivePhase === "fired" || effectivePhase === "settled";

  return (
    <div className="relative">
      <div
        className="absolute -inset-8 rounded-[2rem] bg-amber-400/5 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-zinc-700" />
            <span className="size-2.5 rounded-full bg-zinc-700" />
            <span className="size-2.5 rounded-full bg-zinc-700" />
          </div>
          <span className="font-mono text-[11px] text-zinc-500">
            api.dispatch.dev
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={cycle}
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={animate ? { opacity: 0 } : undefined}
            transition={{ duration: 0.25 }}
            className="min-h-84 px-4 py-4 font-mono text-[12px] leading-6 sm:min-h-88 sm:px-5 sm:text-[13px]"
          >
            {/* request */}
            <div className="overflow-x-auto whitespace-pre">
              {REQUEST_LINES.slice(0, effectiveLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={animate ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.12 }}
                >
                  {line}
                  {animate &&
                    effectivePhase === "typing" &&
                    i === effectiveLines - 1 && <Caret />}
                </motion.div>
              ))}
              {effectiveLines === 0 && (
                <div>
                  <span className="text-zinc-600">$ </span>
                  <Caret />
                </div>
              )}
            </div>

            {/* response */}
            {scheduled && acknowledged && (
              <motion.div
                initial={animate ? { opacity: 0, y: 4 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3 overflow-x-auto whitespace-pre"
              >
                <span className="text-zinc-600">201 · </span>
                <span className="text-zinc-600">{"{ "}</span>
                <span className="text-zinc-400">&quot;id&quot;</span>
                <span className="text-zinc-600">: </span>
                <span className="text-zinc-200">&quot;job_8kq2vn&quot;</span>
                <span className="text-zinc-600">, </span>
                <span className="text-zinc-400">&quot;status&quot;</span>
                <span className="text-zinc-600">: </span>
                <span className="text-amber-300">&quot;scheduled&quot;</span>
                <span className="text-zinc-600">{" }"}</span>
              </motion.div>
            )}

            {/* the wait — rendered once the job is accepted */}
            {acknowledged && (
              <motion.div
                initial={animate ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: animate ? 0.4 : 0 }}
              >
                <Timeline
                  phase={effectivePhase}
                  animate={animate}
                  onReached={() => setPhase("fired")}
                />
              </motion.div>
            )}

            {/* delivery */}
            {fired && (
              <div>
                <motion.div
                  initial={animate ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-pre"
                >
                  <span className="text-zinc-600">09:30:00.000 </span>
                  <span className="text-amber-400">→</span>
                  <span className="text-zinc-300">
                    {" "}
                    POST acme.app/hooks/renew
                  </span>
                </motion.div>
                <motion.div
                  initial={animate ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: animate ? 0.35 : 0 }}
                  className="whitespace-pre"
                >
                  <span className="text-zinc-600">09:30:00.142 </span>
                  <span className="text-emerald-400">← 200 OK</span>
                  <span className="text-zinc-600"> · 142ms</span>
                </motion.div>
                <motion.div
                  initial={animate ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: animate ? 0.7 : 0 }}
                  className="mt-2 whitespace-pre text-emerald-400/90"
                >
                  ✓ delivered · attempt 1 · drift 0ms
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
