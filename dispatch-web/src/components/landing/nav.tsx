"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

import { GitHubIcon } from "./github-icon";
import { Logo } from "./logo";

const GITHUB_URL = "https://github.com/imtiyazsayyidpro/dispatch";

// Section links are absolute ("/#…") so the nav works from /docs too.
const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#self-host", label: "Self-host" },
  { href: "/docs", label: "Docs" },
];

export function Nav() {
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <a href="#" aria-label="Dispatch — home">
          <Logo />
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dispatch on GitHub"
            nativeButton={false}
            render={<a href={GITHUB_URL} target="_blank" rel="noreferrer" />}
          >
            <GitHubIcon />
          </Button>
          {/* Session CTAs fade in once rehydration settles, so the nav
              never flashes "Get started" at someone who is signed in. */}
          <div
            className={cn(
              "flex items-center gap-2 transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100"
            )}
          >
            {isAuthenticated ? (
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/dashboard" />}
              >
                Dashboard
                <ArrowRight data-icon="inline-end" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/login" />}
                  className="text-zinc-400 hover:text-zinc-100"
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/register" />}
                >
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
