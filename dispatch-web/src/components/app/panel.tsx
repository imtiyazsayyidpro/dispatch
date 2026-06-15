import { cn } from "@/lib/utils";

/**
 * HUD corner brackets: four small L-marks pinned to the corners of a
 * relatively-positioned parent. They inherit `currentColor`, so callers
 * control the tone (and hover transitions) with text-* classes.
 */
export function Brackets({ className }: { className?: string }) {
  const corner = "absolute size-2 border-current";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 text-zinc-700",
        className
      )}
    >
      <span className={cn(corner, "top-0 left-0 border-t border-l")} />
      <span className={cn(corner, "top-0 right-0 border-t border-r")} />
      <span className={cn(corner, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(corner, "right-0 bottom-0 border-b border-r")} />
    </span>
  );
}

/**
 * The app's standard surface: sharp corners, hairline border, faint well.
 * `brackets` adds the HUD corner marks for panels that deserve emphasis
 * (empty states, finale moments, feature surfaces).
 */
export function Panel({
  className,
  brackets = false,
  bracketsClassName,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  brackets?: boolean;
  bracketsClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative border border-zinc-800/70 bg-zinc-900/30",
        className
      )}
      {...props}
    >
      {brackets ? <Brackets className={bracketsClassName} /> : null}
      {children}
    </div>
  );
}
