import { Button } from "@/components/ui/button";

import { GitHubIcon } from "./github-icon";
import { Reveal } from "./reveal";
import { Section } from "./section";

const GITHUB_URL = "https://github.com/imtiyazsayyidpro/dispatch";

export function OpenSource() {
  return (
    <Section
      id="self-host"
      index="03"
      eyebrow="open source"
      title="Read the source before you trust it."
      intro="You should know what's holding your schedule before you hand it your webhooks."
    >
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="max-w-xl space-y-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
            <p>
              Dispatch is MIT-licensed — the same code that runs the hosted
              service, not a gutted community edition. Clone it, audit it, and
              if your scheduling has to stay inside your own infrastructure,
              run it there. Everything on this page works the same way, pointed
              at your own box.
            </p>
            <p>
              And if one more hosted dependency is exactly what your stack
              doesn&apos;t need — fair. That instinct is why the repo is public
              in the first place.
            </p>
          </div>
          <div className="mt-8">
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<a href={GITHUB_URL} target="_blank" rel="noreferrer" />}
              className="px-4"
            >
              <GitHubIcon data-icon="inline-start" />
              Star on GitHub
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/90">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
              <span className="font-mono text-[11px] text-zinc-500">
                self-host
              </span>
              <span className="font-mono text-[11px] text-zinc-600">
                MIT license
              </span>
            </div>
            <div className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-7 whitespace-pre">
              <div>
                <span className="text-zinc-600">$ </span>
                <span className="text-zinc-300">git clone </span>
                <span className="text-zinc-100">
                  https://github.com/imtiyazsayyidpro/dispatch
                </span>
              </div>
              <div>
                <span className="text-zinc-600">$ </span>
                <span className="text-zinc-300">
                  cd dispatch-backend &amp;&amp; npm i &amp;&amp; npm run build
                </span>
              </div>
              <div>
                <span className="text-zinc-600">$ </span>
                <span className="text-zinc-300">pm2 start dist/src/index.js</span>
              </div>
              <div className="mt-2">
                <span className="text-emerald-400">✓ dispatch ready</span>
                <span className="text-zinc-500"> · API :4000 · dashboard :3000</span>
              </div>
              <div>
                <span className="text-zinc-600">
                  point your POSTs at your own box
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
