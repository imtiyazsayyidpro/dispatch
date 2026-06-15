"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

/**
 * Live T-minus readout to a future moment — the visual heart of a
 * scheduled job. Ticks every second; clamps at zero (the scheduler takes
 * it from there). The server snapshot is null so SSR renders nothing and
 * the readout appears once the client clock is live.
 */
export function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime();
  const remaining = useSyncExternalStore(
    subscribe,
    () => Math.max(0, Math.floor((target - Date.now()) / 1000)),
    () => null
  );

  if (remaining === null) return null;

  const days = Math.floor(remaining / 86400);
  const hh = String(Math.floor((remaining % 86400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <span className="font-mono text-xs text-amber-400 tabular-nums">
      T−{days > 0 ? `${days}d ` : ""}
      {hh}:{mm}:{ss}
    </span>
  );
}
