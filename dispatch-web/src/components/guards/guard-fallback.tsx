import { LogoMark } from "@/components/landing/logo";

/**
 * Full-screen holding state shown while a session is resolving or a
 * redirect is in flight. Styled like the rest of the dark app shell so
 * guard transitions don't flash a different background.
 */
export function GuardFallback() {
  return (
    <div className="dark fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-zinc-950 antialiased">
      <LogoMark className="size-7" />
      <p className="font-mono text-xs tracking-widest text-zinc-600">
        checking session
        <span
          className="ml-1.5 inline-block h-3 w-[6px] translate-y-px animate-blink bg-amber-400/80"
          aria-hidden="true"
        />
      </p>
    </div>
  );
}
