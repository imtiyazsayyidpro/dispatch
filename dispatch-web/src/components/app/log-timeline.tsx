"use client";

import { useState } from "react";
import { Ban, Check, ChevronDown, Clock3, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/app/panel";
import { formatDateTime } from "@/lib/format";
import type { JobLog, JobStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Bodies longer than this start collapsed behind a "show full response" toggle. */
const BODY_COLLAPSE_THRESHOLD = 280;

function Node({
  tone,
  pulse,
  children,
}: {
  tone: "success" | "failure" | "pending" | "muted";
  pulse?: boolean;
  children: React.ReactNode;
}) {
  const ring = {
    success:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]",
    failure:
      "border-red-500/40 bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(248,113,113,0.3)]",
    pending:
      "border-amber-400/40 bg-amber-400/10 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]",
    muted: "border-zinc-700 bg-zinc-900 text-zinc-500",
  }[tone];

  return (
    <span
      className={cn(
        "absolute top-0 left-0 flex size-6 items-center justify-center rounded-full border",
        ring,
        pulse && "animate-pulse"
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function ResponseBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = body.length > BODY_COLLAPSE_THRESHOLD;

  return (
    <div className="mt-3">
      <pre
        className={cn(
          "overflow-x-auto rounded-sm border border-zinc-800/70 bg-zinc-950/80 px-3 py-2.5 font-mono text-xs leading-5 whitespace-pre-wrap text-zinc-400",
          long && !expanded && "max-h-24 overflow-y-hidden"
        )}
      >
        {long && !expanded
          ? `${body.slice(0, BODY_COLLAPSE_THRESHOLD)}…`
          : body}
      </pre>
      {long ? (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-zinc-500 hover:text-zinc-200"
        >
          <ChevronDown
            data-icon="inline-start"
            className={cn("transition-transform", expanded && "rotate-180")}
          />
          {expanded ? "Collapse response" : "Show full response"}
        </Button>
      ) : null}
    </div>
  );
}

function AttemptEntry({ log }: { log: JobLog }) {
  const ok = log.status === "SUCCESS";

  return (
    <li className="relative pb-8 pl-10 last:pb-0">
      <Node tone={ok ? "success" : "failure"}>
        {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      </Node>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-xs tracking-[0.15em] text-zinc-300 uppercase">
          attempt {String(log.attempt).padStart(2, "0")}
        </p>
        <p
          className={cn(
            "font-mono text-xs",
            ok ? "text-emerald-400" : "text-red-400"
          )}
        >
          {log.status}
          {log.responseCode !== null ? ` · HTTP ${log.responseCode}` : ""}
        </p>
        <p className="ml-auto font-mono text-xs text-zinc-600 tabular-nums">
          {formatDateTime(log.firedAt)}
        </p>
      </div>

      {log.responseCode === null ? (
        <p className="mt-1 text-xs text-zinc-500">
          The request never completed — no response was received.
        </p>
      ) : null}

      {log.responseBody ? <ResponseBody body={log.responseBody} /> : null}
    </li>
  );
}

function TerminalEntry({
  tone,
  pulse,
  icon,
  title,
  detail,
}: {
  tone: "success" | "failure" | "pending" | "muted";
  pulse?: boolean;
  icon: React.ReactNode;
  title: string;
  detail?: string;
}) {
  return (
    <li className="relative pb-8 pl-10 last:pb-0">
      <Node tone={tone} pulse={pulse}>
        {icon}
      </Node>
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      {detail ? <p className="mt-1 text-xs text-zinc-500">{detail}</p> : null}
    </li>
  );
}

/**
 * Vertical audit trail of a job's delivery attempts. Logs arrive newest-first
 * from the API; we render oldest-first so the rail reads top-to-bottom in
 * the order things actually happened.
 */
export function LogTimeline({
  logs,
  jobStatus,
  fireAt,
}: {
  logs: JobLog[];
  jobStatus: JobStatus;
  fireAt: string;
}) {
  const attempts = [...logs].sort((a, b) => a.attempt - b.attempt);

  if (attempts.length === 0 && jobStatus === "SCHEDULED") {
    return (
      <Panel brackets className="flex items-start gap-4 p-5">
        <span className="relative mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]">
          <Clock3 className="size-3.5" />
        </span>
        <div>
          <p className="text-sm font-medium text-zinc-200">Waiting to fire</p>
          <p className="mt-1 text-sm text-zinc-400">
            First attempt scheduled for{" "}
            <span className="font-mono text-xs text-sky-400 tabular-nums">
              {formatDateTime(fireAt)}
            </span>
            . Attempts will appear here as they happen.
          </p>
        </div>
      </Panel>
    );
  }

  if (attempts.length === 0 && jobStatus === "CANCELLED") {
    return (
      <Panel className="flex items-start gap-4 p-5">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-500">
          <Ban className="size-3.5" />
        </span>
        <div>
          <p className="text-sm font-medium text-zinc-200">
            Cancelled before firing
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            This job was cancelled ahead of its scheduled time — the webhook
            was never called.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <ol className="relative before:absolute before:top-1 before:bottom-1 before:left-[11px] before:w-px before:bg-linear-to-b before:from-zinc-800 before:via-zinc-800 before:to-transparent">
      {attempts.map((log) => (
        <AttemptEntry key={log.id} log={log} />
      ))}

      {jobStatus === "FIRING" ? (
        <TerminalEntry
          tone="pending"
          pulse
          icon={<span className="size-2 rounded-full bg-amber-400" />}
          title={`Attempt ${attempts.length + 1} in flight`}
          detail="Calling the webhook now…"
        />
      ) : null}

      {jobStatus === "SCHEDULED" && attempts.length > 0 ? (
        <TerminalEntry
          tone="pending"
          icon={<RotateCcw className="size-3.5" />}
          title="Retry queued"
          detail="The last attempt failed — Dispatch will fire this webhook again shortly."
        />
      ) : null}

      {jobStatus === "DEAD" ? (
        <TerminalEntry
          tone="failure"
          icon={<X className="size-3.5" />}
          title="All retries exhausted"
          detail="Every attempt failed and the retry budget is spent. This job will not fire again."
        />
      ) : null}

      {jobStatus === "CANCELLED" && attempts.length > 0 ? (
        <TerminalEntry
          tone="muted"
          icon={<Ban className="size-3.5" />}
          title="Cancelled"
          detail="This job was cancelled — no further attempts will be made."
        />
      ) : null}
    </ol>
  );
}
