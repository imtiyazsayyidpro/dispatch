"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { JobRow } from "@/components/app/job-row";
import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/app/error-panel";
import { PageHeader } from "@/components/app/page-header";
import { Panel } from "@/components/app/panel";
import { ScanList } from "@/components/app/scan";
import * as api from "@/lib/api";
import { pluralize } from "@/lib/format";
import type { JobStatus, JobsPage } from "@/lib/types";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

const PAGE_SIZE = 20;

/** FIRING is transient (a job holds it for seconds), so it isn't worth a filter pill. */
const FILTERS: Array<{ label: string; value: JobStatus | null }> = [
  { label: "all", value: null },
  { label: "scheduled", value: "SCHEDULED" },
  { label: "success", value: "SUCCESS" },
  { label: "failed", value: "FAILED" },
  { label: "dead", value: "DEAD" },
  { label: "cancelled", value: "CANCELLED" },
];

function EmptyState() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://your-dispatch-host";

  return (
    <Panel brackets className="p-6 sm:p-8">
      <p className="font-mono text-xs text-zinc-500">
        <span className="text-zinc-600">$</span> dispatch jobs ls
      </p>
      <p className="mt-1 font-mono text-xs text-zinc-600">0 jobs found</p>

      <h2 className="mt-6 text-lg font-medium text-zinc-100">
        Schedule your first webhook
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
        Jobs are created from your code, not the dashboard. POST to the API
        with a project key, a target URL, and a future timestamp — Dispatch
        fires the webhook at that moment and records every attempt here.
      </p>

      <pre className="mt-5 overflow-x-auto border border-zinc-800/70 bg-zinc-950/80 px-4 py-3 font-mono text-xs leading-6 text-zinc-400">
        {`curl -X POST ${apiUrl}/api/v1/jobs \\
  -H "x-api-key: sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "send-trial-ending-email",
    "webhookUrl": "https://api.your-app.com/hooks/trial-ending",
    "fireAt": "2026-06-13T09:30:00Z",
    "payload": { "userId": "usr_123" }
  }'`}
      </pre>

      <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
        The <span className="font-mono text-xs text-zinc-300">payload</span> is
        optional — whatever you put there is delivered back to your webhook
        when the job fires. Failed deliveries are retried up to 3 times.
        Generate a key from a project page if you don&apos;t have one yet.
      </p>
    </Panel>
  );
}

function FilteredEmptyState({
  status,
  onClear,
}: {
  status: JobStatus;
  onClear: () => void;
}) {
  return (
    <Panel className="flex flex-col items-start p-6">
      <p className="font-mono text-xs text-zinc-600">
        0 {status.toLowerCase()} jobs
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        No jobs match this filter right now.
      </p>
      <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
        Show all jobs
      </Button>
    </Panel>
  );
}

export default function JobsPage() {
  const reduceMotion = useReducedMotion();

  const [status, setStatus] = useState<JobStatus | null>(null);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<JobsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped to refetch the same query after an error.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stale = false;

    setData(null);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (status) params.set("status", status);

    api
      .get<JobsPage>(`/api/v1/jobs?${params.toString()}`)
      .then((result) => {
        if (!stale) setData(result);
      })
      .catch((err) => {
        if (!stale) {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
        }
      });

    return () => {
      stale = true;
    };
  }, [status, page, attempt]);

  function applyFilter(next: JobStatus | null) {
    setStatus(next);
    setPage(1);
  }

  const loading = data === null && error === null;
  const totalPages = data?.pagination.totalPages ?? 1;
  const isUnfiltered = status === null;

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
      <PageHeader path={["app", "jobs"]} title="Jobs" />

      <motion.div
        {...enter(0.18)}
        role="group"
        aria-label="Filter jobs by status"
        className="mt-8 flex flex-wrap gap-2"
      >
        {FILTERS.map(({ label, value }) => {
          const active = status === value;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => applyFilter(value)}
              className={cn(
                "rounded-sm border px-2.5 py-1 font-mono text-[11px] tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:outline-none",
                active
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-400 shadow-[0_0_14px_-6px_rgba(251,191,36,0.7)]"
                  : "border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              {label}
            </button>
          );
        })}
      </motion.div>

      <motion.div {...enter(0.24)} className="mt-6">
        {loading ? (
          <ScanList rows={6} />
        ) : error ? (
          <ErrorPanel
            message={error}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : data && data.jobs.length === 0 ? (
          isUnfiltered && page === 1 ? (
            <EmptyState />
          ) : !isUnfiltered ? (
            <FilteredEmptyState
              status={status}
              onClear={() => applyFilter(null)}
            />
          ) : (
            // Unfiltered but past the last page (e.g. jobs were deleted).
            <Panel className="flex flex-col items-start p-6">
              <p className="text-sm text-zinc-400">
                Nothing on this page anymore.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                className="mt-4"
              >
                Back to page 1
              </Button>
            </Panel>
          )
        ) : data ? (
          <>
            <div className="divide-y divide-zinc-800/60 overflow-hidden border border-zinc-800/70 bg-zinc-900/20">
              {data.jobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="font-mono text-xs text-zinc-600">
                {pluralize(data.pagination.total, "job")}
                {status ? ` · ${status.toLowerCase()}` : ""}
              </p>
              {totalPages > 1 ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="font-mono text-xs text-zinc-500 tabular-nums">
                    page {data.pagination.page}{" "}
                    <span className="text-zinc-700">/</span> {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Next page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}
