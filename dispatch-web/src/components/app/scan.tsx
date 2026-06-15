import { cn } from "@/lib/utils";

/**
 * Loading surface: a dark well swept by a scanline, instead of the stock
 * gray pulse. Size it with width/height classes like any skeleton block.
 */
export function Scan({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden bg-zinc-900/50", className)}
    >
      <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-zinc-800/70 to-transparent" />
    </div>
  );
}

/**
 * List-shaped loading state: a framed telemetry panel with a breathing
 * LED, a FETCHING legend, and scanline rows where the data will land.
 */
export function ScanList({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("border border-zinc-800/70 bg-zinc-900/20", className)}
    >
      <div className="flex items-center gap-2 border-b border-zinc-800/60 px-4 py-2">
        <span className="size-1.5 animate-breathe rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
        <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          fetching
        </span>
      </div>
      <div className="divide-y divide-zinc-800/60">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="px-4 py-4">
            <Scan className="h-4 w-1/3" />
            <Scan className="mt-2 h-3 w-1/2 opacity-60" />
          </div>
        ))}
      </div>
    </div>
  );
}
