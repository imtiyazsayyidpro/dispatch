import { cn } from "@/lib/utils";

/**
 * The mark is a dial: a face, a hand pointing at the scheduled moment,
 * and a single highlighted tick at the rim where the job fires.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        className="stroke-zinc-600"
        strokeWidth="1.5"
      />
      <path
        d="M12 12 L16.5 5.5"
        className="stroke-amber-400"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1.4" className="fill-amber-400" />
      <path
        d="M17.4 4.2 L18.6 2.6"
        className="stroke-amber-400"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-mono text-sm font-semibold tracking-tight text-zinc-100">
        dispatch
      </span>
    </span>
  );
}
