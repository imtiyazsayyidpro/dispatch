import Link from "next/link";

import { GitHubIcon } from "./github-icon";
import { Logo } from "./logo";

const GITHUB_URL = "https://github.com/imtiyazsayyid/dispatch";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="font-mono text-xs text-zinc-600">
            © 2026 · MIT
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/docs"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Docs
          </Link>
          <Link
            href="/login"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Sign in
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <GitHubIcon />
            GitHub
          </a>
          <span className="text-sm text-zinc-500">
            Built by{" "}
            <a
              href="https://github.com/imtiyazsayyid"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-300 transition-colors hover:text-zinc-100"
            >
              Imtiyaz
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
