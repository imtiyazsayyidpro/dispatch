"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, KeyRound, Plus } from "lucide-react";

import { JobStatusBadge } from "@/components/app/job-status-badge";
import { NewApiKeyModal } from "@/components/app/new-api-key-modal";
import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/app/error-panel";
import { LocalTime } from "@/components/app/local-time";
import { Panel } from "@/components/app/panel";
import { Scan, ScanList } from "@/components/app/scan";
import { TickRule } from "@/components/app/tick-rule";
import * as api from "@/lib/api";
import { formatDate, formatRelative } from "@/lib/format";
import type { ApiKey, Job, JobsPage, Project } from "@/lib/types";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

const RECENT_JOBS_SHOWN = 10;

/** Section legend in panel style: amber-less mono overline with a count readout. */
function SectionLegend({
  id,
  label,
  count,
}: {
  id: string;
  label: string;
  count?: number;
}) {
  return (
    <h2
      id={id}
      className="font-mono text-xs tracking-[0.2em] text-zinc-300 uppercase"
    >
      {label}
      {count !== undefined && count > 0 ? (
        <span className="ml-2 text-zinc-600 tabular-nums">
          {String(count).padStart(2, "0")}
        </span>
      ) : null}
    </h2>
  );
}

function ApiKeysSection({
  projectId,
  keys,
  error,
  onRetry,
  onRevoked,
  onNewKey,
}: {
  projectId: string;
  keys: ApiKey[] | null;
  error: string | null;
  onRetry: () => void;
  onRevoked: (keyId: string) => void;
  onNewKey: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  async function revoke(keyId: string) {
    setRevokeError(null);
    setRevokingId(keyId);
    try {
      await api.del(`/api/v1/projects/${projectId}/api-keys/${keyId}`);
      onRevoked(keyId);
    } catch (err) {
      setRevokeError(
        err instanceof Error ? err.message : "Could not revoke the key"
      );
    } finally {
      setRevokingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <section aria-labelledby="api-keys-heading">
      <div className="flex items-center justify-between gap-4">
        <SectionLegend
          id="api-keys-heading"
          label="api keys"
          count={keys?.length}
        />
        <Button size="sm" onClick={onNewKey}>
          <Plus data-icon="inline-start" />
          New API key
        </Button>
      </div>

      <div className="mt-4">
        {error ? (
          <ErrorPanel message={error} onRetry={onRetry} />
        ) : keys === null ? (
          <ScanList rows={2} />
        ) : keys.length === 0 ? (
          <Panel brackets className="flex flex-col items-start p-6">
            <KeyRound className="size-5 text-zinc-600" />
            <h3 className="mt-4 text-sm font-medium text-zinc-200">
              No keys yet
            </h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-400">
              Generate a key to schedule jobs from your code. Keys are shown
              once, then stored as a hash — revoke and re-mint any time.
            </p>
            <Button size="sm" onClick={onNewKey} className="mt-5">
              <Plus data-icon="inline-start" />
              Generate a key
            </Button>
          </Panel>
        ) : (
          <>
            {revokeError ? (
              <p
                role="alert"
                className="mb-3 rounded-sm border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
              >
                {revokeError}
              </p>
            ) : null}
            <ul className="divide-y divide-zinc-800/60 border border-zinc-800/70 bg-zinc-900/20">
              {keys.map((key) => {
                const confirming = confirmingId === key.id;
                const revoking = revokingId === key.id;
                return (
                  <li
                    key={key.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-200">
                        {key.label}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-zinc-500">
                        sk_…{key.keyPreview}
                        <span className="mx-1.5 text-zinc-700">·</span>
                        created {formatDate(key.createdAt)}
                        <span className="mx-1.5 text-zinc-700">·</span>
                        {key.lastUsedAt
                          ? `last used ${formatRelative(key.lastUsedAt)}`
                          : "never used"}
                      </p>
                    </div>
                    {confirming ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-300">
                          Revoke this key?
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          disabled={revoking}
                          onClick={() => setConfirmingId(null)}
                          className="text-zinc-400 hover:text-zinc-100"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="xs"
                          disabled={revoking}
                          onClick={() => revoke(key.id)}
                        >
                          {revoking ? "Revoking…" : "Confirm"}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setRevokeError(null);
                          setConfirmingId(key.id);
                        }}
                        className="text-zinc-500 hover:bg-red-950/40 hover:text-red-300"
                      >
                        Revoke
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function RecentJobsSection({
  jobs,
  error,
  onRetry,
}: {
  jobs: Job[] | null;
  error: string | null;
  onRetry: () => void;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://your-dispatch-host";

  return (
    <section aria-labelledby="recent-jobs-heading" className="mt-12">
      <div className="flex items-center justify-between gap-4">
        <SectionLegend id="recent-jobs-heading" label="recent jobs" />
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-200"
        >
          view all jobs
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4">
        {error ? (
          <ErrorPanel message={error} onRetry={onRetry} />
        ) : jobs === null ? (
          <ScanList rows={3} />
        ) : jobs.length === 0 ? (
          <Panel brackets className="p-6">
            <h3 className="text-sm font-medium text-zinc-200">No jobs yet</h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-zinc-400">
              Schedule one straight from your terminal — an API key and a
              future timestamp is all it takes.
            </p>
            <pre className="mt-4 overflow-x-auto border border-zinc-800/70 bg-zinc-950/80 px-4 py-3 font-mono text-xs leading-6 text-zinc-400">
              {`curl -X POST ${apiUrl}/api/v1/jobs \\
  -H "x-api-key: sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"title": "first job", "webhookUrl": "https://example.com/hook", "fireAt": "2026-06-13T09:30:00Z"}'`}
            </pre>
          </Panel>
        ) : (
          <ul className="divide-y divide-zinc-800/60 border border-zinc-800/70 bg-zinc-900/20">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center gap-3 px-4 py-3.5">
                <JobStatusBadge status={job.status} />
                <span className="min-w-0 flex-initial truncate text-sm text-zinc-200">
                  {job.title}
                </span>
                <span className="hidden min-w-0 flex-1 truncate font-mono text-xs text-zinc-600 md:block">
                  {job.webhookUrl}
                </span>
                <span className="ml-auto shrink-0 font-mono text-xs text-zinc-400 tabular-nums">
                  <LocalTime iso={job.fireAt} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const reduceMotion = useReducedMotion();

  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const data = await api.get<Project>(`/api/v1/projects/${id}`);
      setProject(data);
      setProjectError(null);
    } catch (err) {
      setProjectError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  }, [id]);

  const loadKeys = useCallback(async () => {
    try {
      const data = await api.get<ApiKey[]>(`/api/v1/projects/${id}/api-keys`);
      setKeys(data);
      setKeysError(null);
    } catch (err) {
      setKeysError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [id]);

  // The jobs endpoint has no project filter yet, so we over-fetch and
  // filter to this project client-side before trimming to the latest 10.
  const loadJobs = useCallback(async () => {
    try {
      const page = await api.get<JobsPage>(
        `/api/v1/jobs?projectId=${id}&limit=100`
      );
      setJobs(
        page.jobs
          .filter((job) => job.projectId === id)
          .slice(0, RECENT_JOBS_SHOWN)
      );
      setJobsError(null);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [id]);

  useEffect(() => {
    loadProject();
    loadKeys();
    loadJobs();
  }, [loadProject, loadKeys, loadJobs]);

  function retryProject() {
    setProject(null);
    setProjectError(null);
    loadProject();
  }

  function retryKeys() {
    setKeys(null);
    setKeysError(null);
    loadKeys();
  }

  function retryJobs() {
    setJobs(null);
    setJobsError(null);
    loadJobs();
  }

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  if (projectError) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="size-3.5" />
          projects
        </Link>
        <div className="mt-8">
          <ErrorPanel message={projectError} onRetry={retryProject} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
      <motion.div {...enter(0)}>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="size-3.5" />
          projects
        </Link>
      </motion.div>

      <motion.div {...enter(0.06)} className="mt-8">
        {project === null ? (
          <div aria-hidden="true">
            <Scan className="h-4 w-40" />
            <Scan className="mt-4 h-9 w-72" />
          </div>
        ) : (
          <>
            <p className="font-mono text-xs tracking-widest text-zinc-500">
              <span className="text-amber-400">projects</span>
              <span className="mx-2 text-zinc-700">/</span>
              {project.name}
            </p>
            <h1 className="mt-4 truncate text-3xl font-semibold tracking-tight text-zinc-100">
              {project.name}
            </h1>
            <p className="mt-2 font-mono text-xs text-zinc-600">
              created {formatDate(project.createdAt)}
            </p>
          </>
        )}
        <TickRule className="mt-6" />
      </motion.div>

      <motion.div {...enter(0.14)} className="mt-12">
        <ApiKeysSection
          projectId={id}
          keys={keys}
          error={keysError}
          onRetry={retryKeys}
          onRevoked={(keyId) =>
            setKeys((prev) => prev?.filter((k) => k.id !== keyId) ?? prev)
          }
          onNewKey={() => setKeyModalOpen(true)}
        />

        <RecentJobsSection jobs={jobs} error={jobsError} onRetry={retryJobs} />
      </motion.div>

      <NewApiKeyModal
        projectId={id}
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        onCreated={loadKeys}
      />
    </div>
  );
}
