"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { GitHubIcon } from "./github-icon";
import { HeroTerminal } from "./hero-terminal";

const GITHUB_URL = "https://github.com/imtiyazsayyid/dispatch";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

export function Hero() {
  const reduceMotion = useReducedMotion();

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: EASE },
  });

  return (
    <header className="relative overflow-hidden">
      {/* faint dot grid, fading out toward the fold */}
      <div
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[26px_26px] mask-[linear-gradient(to_bottom,black,transparent_85%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pt-20 pb-24 sm:pt-28 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-32 lg:pb-32">
        <div>
          <motion.div {...enter(0)}>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            >
              <span className="size-1.5 rounded-full bg-amber-400" />
              open source · MIT
            </a>
          </motion.div>

          <motion.h1
            {...enter(0.08)}
            className="mt-6 text-4xl font-semibold tracking-tight text-balance text-zinc-100 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]"
          >
            <span className="font-mono tracking-tighter">setTimeout()</span>{" "}
            won&apos;t survive the deploy.
          </motion.h1>

          <motion.p
            {...enter(0.16)}
            className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg"
          >
            Dispatch is a webhook scheduler with one job: you POST a URL and a
            time, and your endpoint gets called at that time. No cron to
            babysit, no queue to operate, no in-memory timer that dies on
            restart.
          </motion.p>

          <motion.div
            {...enter(0.24)}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/register" />}
              className="px-4"
            >
              Get an API key
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<a href={GITHUB_URL} target="_blank" rel="noreferrer" />}
              className="px-4"
            >
              <GitHubIcon data-icon="inline-start" />
              View on GitHub
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        >
          <HeroTerminal />
        </motion.div>
      </div>
    </header>
  );
}
