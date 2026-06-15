"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/logo";
import { useAuth } from "@/context/auth-context";

/**
 * Floating header for the auth screens. No bottom border — a full-width
 * rule with a lone logo reads as a broken navbar. Instead the right side
 * carries the one contextual action each screen needs.
 */
export function AuthHeader() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="relative z-20">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="Dispatch — home">
          <Logo />
        </Link>

        {pathname === "/login" ? (
          <p className="text-sm text-zinc-500">
            New to Dispatch?{" "}
            <Link
              href="/register"
              className="text-zinc-200 underline-offset-4 transition-colors hover:text-amber-400 hover:underline"
            >
              Create account
            </Link>
          </p>
        ) : pathname === "/register" ? (
          <p className="text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-zinc-200 underline-offset-4 transition-colors hover:text-amber-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        ) : isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-zinc-600 sm:inline">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="text-zinc-500 hover:text-zinc-200"
            >
              Sign out
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
