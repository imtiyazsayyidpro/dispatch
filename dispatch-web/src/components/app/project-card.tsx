"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Brackets } from "@/components/app/panel";
import { formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";

function Readout({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-zinc-950/70 px-4 py-3">
      <p className="font-mono text-xl text-zinc-100 tabular-nums">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-0.5 font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
        {label}
      </p>
    </div>
  );
}

/**
 * A project as an instrument tile: HUD brackets that arm amber on hover,
 * and the key/job counts as two-digit panel readouts.
 */
export function ProjectCard({ project }: { project: Project }) {
  const apiKeys = project._count?.apiKeys ?? 0;
  const jobs = project._count?.jobs ?? 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative flex flex-col border border-zinc-800/70 bg-zinc-900/30 p-5 transition-colors hover:bg-zinc-900/60 focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:outline-none"
    >
      <Brackets className="transition-colors group-hover:text-amber-400/70" />

      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate text-base font-medium text-zinc-100">
          {project.name}
        </h3>
        <ArrowUpRight className="size-4 shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-400" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-px border border-zinc-800/60 bg-zinc-800/60">
        <Readout value={apiKeys} label={apiKeys === 1 ? "api key" : "api keys"} />
        <Readout value={jobs} label={jobs === 1 ? "job" : "jobs"} />
      </div>

      <p className="mt-4 font-mono text-xs text-zinc-600">
        created {formatDate(project.createdAt)}
      </p>
    </Link>
  );
}
