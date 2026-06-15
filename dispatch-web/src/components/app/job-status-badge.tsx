import type { JobStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Status as a panel lamp: a glowing LED dot beside a mono legend in a
 * square-cornered housing. FIRING pulses; DEAD and CANCELLED run dim.
 */
const STYLES: Record<JobStatus, { chip: string; dot: string }> = {
  SCHEDULED: {
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    dot: "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]",
  },
  FIRING: {
    chip: "border-amber-400/30 bg-amber-400/10 text-amber-400",
    dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse",
  },
  SUCCESS: {
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]",
  },
  FAILED: {
    chip: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]",
  },
  DEAD: {
    chip: "border-red-900/50 bg-red-950/40 text-red-400/70",
    dot: "bg-red-400/50",
  },
  CANCELLED: {
    chip: "border-zinc-700/60 bg-zinc-800/40 text-zinc-500",
    dot: "bg-zinc-500",
  },
};

export function JobStatusBadge({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  const style = STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em]",
        style.chip,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {status}
    </span>
  );
}
