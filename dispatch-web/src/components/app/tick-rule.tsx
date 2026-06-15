import { cn } from "@/lib/utils";

/**
 * The chronograph ruler — Dispatch's signature divider. Minor ticks every
 * 8px, major ticks every 48px, and a single glowing amber tick at the
 * origin: the armed moment on a timeline. Fades out to the right like a
 * watch bezel disappearing around the case.
 */
export function TickRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-2 mask-[linear-gradient(to_right,black_45%,transparent)]",
        className
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-[5px] bg-[repeating-linear-gradient(to_right,var(--color-zinc-800)_0,var(--color-zinc-800)_1px,transparent_1px,transparent_8px)]" />
      <div className="absolute inset-x-0 bottom-0 h-full bg-[repeating-linear-gradient(to_right,var(--color-zinc-700)_0,var(--color-zinc-700)_1px,transparent_1px,transparent_48px)]" />
      <div className="absolute bottom-0 left-0 h-full w-px bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
    </div>
  );
}
