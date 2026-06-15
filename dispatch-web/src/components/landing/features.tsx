import type { ReactNode } from "react";

import { Reveal } from "./reveal";
import { Section } from "./section";

type Feature = {
  number: string;
  title: string;
  description: string;
  artifact: ReactNode;
};

const FEATURES: Feature[] = [
  {
    number: "01",
    title: "On time, to the second",
    description:
      "Jobs fire at the timestamp you set. No polling loop between you and your deadline, no cron-resolution rounding, no drift.",
    artifact: (
      <>
        <span className="text-zinc-500">scheduled 09:30:00 · fired </span>
        <span className="text-amber-300">09:30:00</span>
      </>
    ),
  },
  {
    number: "02",
    title: "Retries with backoff",
    description:
      "A 500 or a timeout doesn't end the story. Failed deliveries retry on an exponential schedule until they land or run out of attempts.",
    artifact: (
      <span className="text-zinc-400">1s · 2s · 4s · 8s · 16s</span>
    ),
  },
  {
    number: "03",
    title: "Every attempt, logged",
    description:
      "Status code, latency, and response body for every attempt — not just the last one. When an endpoint misbehaves, you can see exactly how.",
    artifact: (
      <>
        <span className="text-zinc-500">attempt 1 → </span>
        <span className="text-red-400">503</span>
        <span className="text-zinc-500"> · attempt 2 → </span>
        <span className="text-emerald-400">200</span>
      </>
    ),
  },
  {
    number: "04",
    title: "Projects, not piles",
    description:
      "Separate projects with separate API keys. Staging can't fire production's webhooks, and rotating one key never breaks the other.",
    artifact: (
      <>
        <span className="text-zinc-400">dsp_live_…9c</span>
        <span className="text-zinc-600"> / </span>
        <span className="text-zinc-400">dsp_test_…a4</span>
      </>
    ),
  },
  {
    number: "05",
    title: "No SDK",
    description:
      "It's an HTTP API. curl works, fetch works, and your language already ships a client for it. Nothing to install, nothing to keep upgraded.",
    artifact: (
      <span className="text-zinc-400">curl · fetch · net/http · httpx</span>
    ),
  },
  {
    number: "06",
    title: "Yours to run",
    description:
      "The whole service is open source under MIT. If scheduling has to live inside your infrastructure, run it there — same code, your box.",
    artifact: <span className="text-zinc-400">$ docker compose up -d</span>,
  },
];

export function Features() {
  return (
    <Section
      id="features"
      index="02"
      eyebrow="features"
      title="Everything it does."
      intro="Six things, on purpose. Scheduling infrastructure should be boring to integrate and boring to operate."
    >
      <Reveal>
        <div className="grid gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800/80 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.number}
              className="group flex flex-col bg-zinc-950 p-6 sm:p-7"
            >
              <span className="font-mono text-xs text-zinc-600 transition-colors group-hover:text-amber-400">
                {feature.number}
              </span>
              <h3 className="mt-3 text-base font-medium text-zinc-100">
                {feature.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                {feature.description}
              </p>
              <div className="mt-5 overflow-x-auto border-t border-zinc-800/70 pt-3.5 font-mono text-xs whitespace-nowrap">
                {feature.artifact}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
