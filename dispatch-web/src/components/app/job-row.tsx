"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { JobStatusBadge } from "@/components/app/job-status-badge";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { Job } from "@/lib/types";

/**
 * One job in the manifest. The fire time is the right-hand readout — on a
 * scheduler it's the most important number on the row — and hovering arms
 * an amber tick on the left edge.
 */
export function JobRow({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group/row relative flex items-center gap-x-4 px-4 py-3.5 transition-colors hover:bg-zinc-900/50 focus-visible:bg-zinc-900/50 focus-visible:outline-none"
    >
      <span
        className="absolute inset-y-0 left-0 w-px bg-amber-400 opacity-0 shadow-[0_0_8px_rgba(251,191,36,0.9)] transition-opacity group-hover/row:opacity-100 group-focus-visible/row:opacity-100"
        aria-hidden="true"
      />

      <JobStatusBadge status={job.status} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm text-zinc-200 transition-colors group-hover/row:text-zinc-50">
            {job.title}
          </p>
          {job.project ? (
            <span className="shrink-0 font-mono text-xs text-zinc-600">
              {job.project.name}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate font-mono text-xs text-zinc-600">
          POST {job.webhookUrl}
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-mono text-xs text-zinc-200 tabular-nums">
          {formatDateTime(job.fireAt)}
        </p>
        <p className="mt-0.5 font-mono text-xs text-zinc-600">
          created {formatRelative(job.createdAt)}
        </p>
      </div>

      <ArrowUpRight className="size-4 shrink-0 text-zinc-700 transition-all group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5 group-hover/row:text-amber-400" />
    </Link>
  );
}
