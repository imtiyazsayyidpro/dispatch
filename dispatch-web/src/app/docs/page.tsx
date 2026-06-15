import type { Metadata } from "next";
import Link from "next/link";

import { Panel } from "@/components/app/panel";
import { TickRule } from "@/components/app/tick-rule";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";

export const metadata: Metadata = {
  title: "Docs — Dispatch",
  description:
    "Dispatch documentation: integrate scheduled webhooks into your app, or run the whole thing on your own server.",
};

const PATHS = [
  {
    href: "/docs/using",
    index: "01",
    eyebrow: "using dispatch",
    title: "Integrate Dispatch into your app",
    body: "Schedule webhooks from your code — API keys, the jobs endpoints, the delivery contract, and copy-pasteable examples.",
    cta: "open guide",
  },
  {
    href: "/docs/self-hosting",
    index: "02",
    eyebrow: "self-hosting",
    title: "Run Dispatch on your own server",
    body: "Install, configure, proxy, and keep it alive — MySQL, nginx, PM2, upgrades, and the limitations you should know about.",
    cta: "open guide",
  },
];

/**
 * The docs gate: two doors, no scrolling. You either schedule webhooks
 * against Dispatch or you operate Dispatch — pick before you read.
 */
export default function DocsPage() {
  return (
    <div className="dark flex min-h-screen flex-col bg-zinc-950 text-zinc-300 antialiased">
      <Nav />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-32">
        <header className="pt-12 lg:pt-16">
          <p className="font-mono text-xs tracking-widest text-zinc-500">
            <span className="text-amber-400">dispatch</span>
            <span className="mx-2 text-zinc-700">/</span>
            docs
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Documentation
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-400">
            Two guides for two jobs. Pick the door that matches yours.
          </p>
          <TickRule className="mt-8" />
        </header>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16">
          {PATHS.map((path) => (
            <Link key={path.href} href={path.href} className="group/door block">
              <Panel
                brackets
                bracketsClassName="text-zinc-700 transition-colors group-hover/door:text-amber-400/60"
                className="flex h-full flex-col p-6 transition-colors group-hover/door:bg-zinc-900/50 sm:p-8"
              >
                <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
                  <span className="text-amber-400">{path.index}</span>
                  <span className="mx-2 text-zinc-700">/</span>
                  {path.eyebrow}
                </p>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-100">
                  {path.title}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
                  {path.body}
                </p>
                <p className="mt-8 font-mono text-xs text-amber-400">
                  {path.cta}{" "}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform group-hover/door:translate-x-0.5"
                  >
                    →
                  </span>
                </p>
              </Panel>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
