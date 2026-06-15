"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/logo";
import { TickRule } from "@/components/app/tick-rule";
import { UtcClock } from "@/components/app/utc-clock";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

const NAV = [
  { href: "/dashboard", label: "dashboard" },
  { href: "/projects", label: "projects" },
  { href: "/jobs", label: "jobs" },
  { href: "/settings", label: "settings" },
  { href: "/docs", label: "docs" },
];

/**
 * The nav reads like a numbered manifest, not an icon menu: a two-digit
 * index, a mono label, and an amber tick on the live route — the same
 * "armed moment" mark the tick rule uses.
 */
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col" aria-label="App">
      {NAV.map(({ href, label }, i) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group/nav relative flex items-center gap-3 px-5 py-2.5 font-mono text-[13px] transition-colors",
              active
                ? "bg-zinc-900/70 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-200"
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 left-0 h-4 w-px -translate-y-1/2 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] transition-opacity",
                active ? "opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-[10px] tracking-wider transition-colors",
                active
                  ? "text-amber-400"
                  : "text-zinc-700 group-hover/nav:text-zinc-500"
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ClockPanel() {
  return (
    <div className="border-t border-zinc-800/70 px-5 py-3">
      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
        <span>sys time</span>
        <span className="inline-flex items-center gap-1.5 normal-case">
          <span className="size-1.5 animate-breathe rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
          live
        </span>
      </div>
      <UtcClock className="mt-1 block font-mono text-base text-zinc-300" />
    </div>
  );
}

function UserFooter() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-3 border-t border-zinc-800/70 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-200">
          {user?.name}
        </p>
        <p className="truncate font-mono text-xs text-zinc-600">
          {user?.email}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Sign out"
        onClick={() => logout()}
        className="text-zinc-500 hover:text-zinc-200"
      >
        <LogOut />
      </Button>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="shrink-0 px-5 pt-4">
        <Link
          href="/dashboard"
          aria-label="Dispatch — dashboard"
          onClick={onNavigate}
          className="inline-block"
        >
          <Logo />
        </Link>
        <TickRule className="mt-3" />
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <ClockPanel />
      <UserFooter />
    </>
  );
}

/**
 * The app shell's anchor: a fixed rail on desktop, a slide-in drawer behind
 * a top bar on mobile. Pages render beside it via `lg:pl-60` on the layout.
 */
export function Sidebar() {
  const reduceMotion = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <>
      {/* desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-zinc-800/70 bg-zinc-950 lg:flex">
        <SidebarContent />
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800/70 bg-zinc-950/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/dashboard" aria-label="Dispatch — dashboard">
          <Logo />
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="text-zinc-400"
        >
          <Menu />
        </Button>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: 0.3, ease: EASE }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-800/70 bg-zinc-950 lg:hidden"
            >
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="absolute top-3 right-3 text-zinc-500"
              >
                <X />
              </Button>
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
