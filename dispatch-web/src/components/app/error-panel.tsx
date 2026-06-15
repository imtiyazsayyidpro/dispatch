"use client";

import { Button } from "@/components/ui/button";

/**
 * Shared failure surface: a red LED, a mono legend, the message, and a
 * retry. Used by every page that loads data.
 */
export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="border border-red-900/50 bg-red-950/20 p-5">
      <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-red-400/80 uppercase">
        <span className="size-1.5 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]" />
        request failed
      </p>
      <p role="alert" className="mt-2.5 text-sm text-red-300">
        {message}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
