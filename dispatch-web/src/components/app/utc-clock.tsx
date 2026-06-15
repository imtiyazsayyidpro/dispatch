"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

/**
 * Live UTC readout, ticking once a second. The server snapshot is null so
 * SSR and hydration render a placeholder, then the store takes over.
 * Purely presentational — the scheduler itself keeps its own time.
 */
export function UtcClock({ className }: { className?: string }) {
  const time = useSyncExternalStore(
    subscribe,
    () => new Date().toISOString().slice(11, 19),
    () => null
  );

  return (
    <span className={className}>
      <span className="tabular-nums">{time ?? "--:--:--"}</span> UTC
    </span>
  );
}
