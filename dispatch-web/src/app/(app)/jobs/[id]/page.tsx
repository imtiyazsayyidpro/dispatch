"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { JobStatusBadge } from "@/components/app/job-status-badge";
import { LogTimeline } from "@/components/app/log-timeline";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Countdown } from "@/components/app/countdown";
import { ErrorPanel } from "@/components/app/error-panel";
import { LocalTime } from "@/components/app/local-time";
import { Scan } from "@/components/app/scan";
import { TickRule } from "@/components/app/tick-rule";
import * as api from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { JobDetail } from "@/lib/types";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

/**
 * Dependency-free JSON highlighter: stringify, then walk the string with a
 * tokenizer regex and wrap each token kind in a colored span.
 */
function JsonBlock({ value }: { value: unknown }) {
  const json = JSON.stringify(value, null, 2) ?? "null";
  const tokens =
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokens.exec(json)) !== null) {
    if (match.index > cursor) {
      parts.push(json.slice(cursor, match.index));
    }

    const token = match[0];
    let className = "text-amber-300"; // numbers
    if (match[1] !== undefined) {
      className = match[2] !== undefined ? "text-sky-300" : "text-emerald-300";
    } else if (token === "true" || token === "false") {
      className = "text-purple-400";
    } else if (token === "null") {
      className = "text-zinc-500";
    }

    parts.push(
      <span key={match.index} className={className}>
        {token}
      </span>
    );
    cursor = match.index + token.length;
  }
  if (cursor < json.length) parts.push(json.slice(cursor));

  return (
    <pre className="overflow-x-auto rounded-sm border border-zinc-800/70 bg-zinc-950/80 px-4 py-3 font-mono text-xs leading-6 text-zinc-400">
      {parts}
    </pre>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-28 shrink-0 font-mono text-[11px] tracking-[0.18em] text-zinc-600 uppercase">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-zinc-300">{children}</dd>
    </div>
  );
}

/**
 * Cancels a scheduled job from the dashboard (session-authenticated). Opens a
 * confirmation dialog first, then refreshes the job so its status flips to
 * CANCELLED and this control disappears.
 */
function CancelJobControl({
  jobId,
  onCancelled,
}: {
  jobId: string;
  onCancelled: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/api/v1/jobs/${jobId}/cancel`);
      await onCancelled();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel the job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Cancel job
      </Button>
      <ConfirmDialog
        open={open}
        title="Cancel this job?"
        description={
          <>
            This stops the scheduled webhook from ever firing. It can&apos;t be
            undone — you&apos;d have to schedule a new job.
          </>
        }
        confirmLabel="Cancel job"
        cancelLabel="Keep it"
        destructive
        loading={loading}
        error={error}
        onConfirm={confirm}
        onClose={() => {
          if (loading) return;
          setOpen(false);
          setError(null);
        }}
      />
    </>
  );
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const reduceMotion = useReducedMotion();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<JobDetail>(`/api/v1/jobs/${id}`);
      setJob(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function retry() {
    setJob(null);
    setError(null);
    load();
  }

  const hasPayload =
    job !== null &&
    job.payload !== null &&
    job.payload !== undefined &&
    !(
      typeof job.payload === "object" &&
      Object.keys(job.payload).length === 0
    );

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="size-3.5" />
          jobs
        </Link>
        <div className="mt-8">
          <ErrorPanel message={error} onRetry={retry} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
      <motion.div {...enter(0)}>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="size-3.5" />
          jobs
        </Link>
      </motion.div>

      <motion.div {...enter(0.06)} className="mt-8">
        {job === null ? (
          <div aria-hidden="true">
            <Scan className="h-4 w-40" />
            <Scan className="mt-4 h-9 w-72" />
            <Scan className="mt-10 h-56 border border-zinc-800/70" />
            <Scan className="mt-8 h-40 border border-zinc-800/70" />
          </div>
        ) : (
          <>
            <p className="font-mono text-xs tracking-widest text-zinc-500">
              <span className="text-amber-400">jobs</span>
              <span className="mx-2 text-zinc-700">/</span>
              {job.id}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="truncate text-3xl font-semibold tracking-tight text-zinc-100">
                {job.title}
              </h1>
              <JobStatusBadge status={job.status} />
            </div>
            {job.project ? (
              <p className="mt-2 font-mono text-xs text-zinc-600">
                in{" "}
                <Link
                  href={`/projects/${job.project.id}`}
                  className="text-zinc-400 underline-offset-4 transition-colors hover:text-amber-400 hover:underline"
                >
                  {job.project.name}
                </Link>
              </p>
            ) : null}
            <TickRule className="mt-6" />

            <section aria-label="Job info" className="mt-10">
              <dl className="divide-y divide-zinc-800/60 border border-zinc-800/70 bg-zinc-900/20">
                <MetaRow label="webhook">
                  <span className="font-mono text-xs break-all text-zinc-300">
                    POST {job.webhookUrl}
                  </span>
                </MetaRow>
                <MetaRow label="fires at">
                  <LocalTime iso={job.fireAt} className="tabular-nums" />
                  {job.status === "SCHEDULED" &&
                  new Date(job.fireAt).getTime() > Date.now() ? (
                    <span className="ml-3">
                      <Countdown to={job.fireAt} />
                    </span>
                  ) : null}
                </MetaRow>
                <MetaRow label="created">
                  <LocalTime iso={job.createdAt} className="tabular-nums" />
                  <span className="ml-2 font-mono text-xs text-zinc-600">
                    {formatRelative(job.createdAt)}
                  </span>
                </MetaRow>
                {job.retryCount > 0 ? (
                  <MetaRow label="retries">
                    <span className="font-mono text-xs text-red-400">
                      {job.retryCount} failed{" "}
                      {job.retryCount === 1 ? "attempt" : "attempts"}
                    </span>
                  </MetaRow>
                ) : null}
                {hasPayload ? (
                  <MetaRow label="payload">
                    <JsonBlock value={job.payload} />
                  </MetaRow>
                ) : null}
              </dl>

              {job.status === "SCHEDULED" ? (
                <div className="mt-5">
                  <CancelJobControl jobId={job.id} onCancelled={load} />
                </div>
              ) : null}
            </section>

            <section aria-labelledby="delivery-log-heading" className="mt-12">
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="delivery-log-heading"
                  className="font-mono text-xs tracking-[0.2em] text-zinc-300 uppercase"
                >
                  delivery log
                  {job.logs.length > 0 ? (
                    <span className="ml-2 text-zinc-600 tabular-nums">
                      {String(job.logs.length).padStart(2, "0")}
                    </span>
                  ) : null}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refresh}
                  disabled={refreshing}
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  <RefreshCw
                    data-icon="inline-start"
                    className={refreshing ? "animate-spin" : undefined}
                  />
                  Refresh
                </Button>
              </div>

              <div className="mt-5">
                <LogTimeline
                  logs={job.logs}
                  jobStatus={job.status}
                  fireAt={job.fireAt}
                />
              </div>
            </section>
          </>
        )}
      </motion.div>
    </div>
  );
}
