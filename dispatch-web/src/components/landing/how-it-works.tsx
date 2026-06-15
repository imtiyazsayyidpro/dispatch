import type { ReactNode } from "react";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Reveal } from "./reveal";
import { Section } from "./section";

type Step = {
  number: string;
  title: string;
  description: string;
  artifact: ReactNode;
};

const STEPS: Step[] = [
  {
    number: "01",
    title: "Create a project, copy the key",
    description:
      "Every project gets its own API key. One for staging, one for production — revoke either without touching the other.",
    artifact: (
      <>
        <span className="text-zinc-500">key: </span>
        <span className="text-zinc-200">dsp_live_4f8a2c9b51de</span>
      </>
    ),
  },
  {
    number: "02",
    title: "POST the job",
    description:
      "A URL, a timestamp, and an optional payload. That is the entire schema — if you can send an HTTP request, you have finished integrating.",
    artifact: (
      <>
        <span className="text-zinc-500">{"{ "}</span>
        <span className="text-zinc-400">&quot;url&quot;</span>
        <span className="text-zinc-500">: </span>
        <span className="text-zinc-200">&quot;…&quot;</span>
        <span className="text-zinc-500">, </span>
        <span className="text-zinc-400">&quot;run_at&quot;</span>
        <span className="text-zinc-500">: </span>
        <span className="text-amber-300">&quot;2026-06-12T09:30:00Z&quot;</span>
        <span className="text-zinc-500">{" }"}</span>
      </>
    ),
  },
  {
    number: "03",
    title: "Dispatch fires the webhook",
    description:
      "At the scheduled second, your endpoint gets the request. If it fails, Dispatch retries with backoff and logs every attempt along the way.",
    artifact: (
      <>
        <span className="text-zinc-500">09:30:00.000 </span>
        <span className="text-amber-400">→ </span>
        <span className="text-zinc-300">POST your-endpoint </span>
        <span className="text-emerald-400">200 OK</span>
        <span className="text-zinc-500"> · 142ms</span>
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      index="01"
      eyebrow="how it works"
      title="The whole integration."
      intro="Three steps, two of which you only do once. There is no step four."
    >
      <ol className="max-w-3xl">
        {STEPS.map((step, i) => (
          <li key={step.number} className="relative flex gap-5 sm:gap-7">
            {/* rail */}
            <div className="flex flex-col items-center">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-900/60 font-mono text-xs text-amber-400">
                {step.number}
              </div>
              <div className="w-px flex-1 bg-zinc-800" aria-hidden="true" />
            </div>

            <Reveal delay={0.05 * i} className="pb-12">
              <h3 className="pt-2 text-lg font-medium text-zinc-100">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                {step.description}
              </p>
              <div className="mt-4 inline-block max-w-full overflow-x-auto rounded-md border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 font-mono text-xs whitespace-pre">
                {step.artifact}
              </div>
            </Reveal>
          </li>
        ))}

        {/* still no step four — just the door in */}
        <li className="relative flex gap-5 sm:gap-7">
          <div className="flex flex-col items-center">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-amber-400/40 bg-amber-400/10 font-mono text-xs text-amber-400">
              →
            </div>
          </div>

          <Reveal delay={0.15}>
            <h3 className="pt-2 text-lg font-medium text-zinc-100">
              That&apos;s the whole loop.
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
              Create an account, grab a key, and your first webhook can be on
              the schedule in the next five minutes.
            </p>
            <div className="mt-5">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/register" />}
                className="px-4"
              >
                Create your account
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </Reveal>
        </li>
      </ol>
    </Section>
  );
}
