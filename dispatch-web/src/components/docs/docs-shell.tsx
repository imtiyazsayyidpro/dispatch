import type { ReactNode } from "react";

import { TickRule } from "@/components/app/tick-rule";
import { DocsNav, type DocSectionLink } from "@/components/docs/docs-nav";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";

/**
 * Shared chrome for the docs sub-pages: public nav, breadcrumb masthead
 * with the chronograph tick rule, the sticky scroll-spy rail (with its
 * way back to the gate), and the footer.
 */
export function DocsShell({
  crumb,
  title,
  lead,
  sections,
  children,
}: {
  /** Second breadcrumb segment — "docs / {crumb}". */
  crumb: string;
  title: string;
  lead: string;
  sections: DocSectionLink[];
  children: ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-300 antialiased">
      <Nav />

      <main className="mx-auto w-full max-w-6xl px-6 pb-32">
        <header className="pt-12 lg:pt-16">
          <p className="font-mono text-xs tracking-widest text-zinc-500">
            <span className="text-amber-400">docs</span>
            <span className="mx-2 text-zinc-700">/</span>
            {crumb}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-400">
            {lead}
          </p>
          <TickRule className="mt-8" />
        </header>

        <div className="mt-6 gap-12 lg:mt-10 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
          <DocsNav
            sections={sections}
            back={{ href: "/docs", label: "back to docs" }}
          />

          <div className="mt-10 min-w-0 space-y-16 lg:mt-0">{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
