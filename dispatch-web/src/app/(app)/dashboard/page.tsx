"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/app/error-panel";
import { PageHeader } from "@/components/app/page-header";
import { Panel } from "@/components/app/panel";
import { Scan } from "@/components/app/scan";
import { useAuth } from "@/context/auth-context";
import * as api from "@/lib/api";
import { pluralize } from "@/lib/format";
import type { Project } from "@/lib/types";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const FIRST_STEPS = [
  { step: "01", label: "create a project" },
  { step: "02", label: "mint an API key" },
  { step: "03", label: "POST /api/v1/jobs with a time" },
];

function Readout({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-zinc-950/80 p-5">
      <p className="font-mono text-3xl text-zinc-100 tabular-nums">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1.5 font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
        {label}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Project[]>("/api/v1/projects");
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function retry() {
    setProjects(null);
    setError(null);
    load();
  }

  const firstName = user?.name.split(" ")[0] ?? "there";
  const loading = projects === null && error === null;
  const jobTotal =
    projects?.reduce((sum, p) => sum + (p._count?.jobs ?? 0), 0) ?? 0;

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
      <PageHeader
        path={["app", "dashboard"]}
        title={`${greeting()}, ${firstName}.`}
      />

      <motion.div {...enter(0.18)} className="mt-10">
        {loading ? (
          <Scan className="h-56 border border-zinc-800/70" />
        ) : error ? (
          <ErrorPanel message={error} onRetry={retry} />
        ) : projects && projects.length === 0 ? (
          <Panel brackets className="p-6 sm:p-8">
            <h2 className="text-lg font-medium text-zinc-100">
              Your first webhook is three steps away
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
              A project keeps your keys and jobs together — one for staging,
              one for prod, however you like to split things.
            </p>
            <div className="mt-6 border border-zinc-800/70 bg-zinc-950/80 px-4 py-3 font-mono text-xs leading-7">
              {FIRST_STEPS.map(({ step, label }) => (
                <div key={step} className="text-zinc-400">
                  <span className="text-amber-400">{step}</span>
                  <span className="mx-2 text-zinc-700">/</span>
                  {label}
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="mt-6"
              nativeButton={false}
              render={<Link href="/projects/new" />}
            >
              <Plus data-icon="inline-start" />
              Create your first project
            </Button>
          </Panel>
        ) : projects ? (
          <Panel className="p-6 sm:p-8">
            <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
              system overview
            </p>
            <div className="mt-4 grid gap-px border border-zinc-800/60 bg-zinc-800/60 sm:grid-cols-2">
              <Readout
                value={projects.length}
                label={projects.length === 1 ? "project" : "projects"}
              />
              <Readout
                value={jobTotal}
                label={jobTotal === 1 ? "job scheduled" : "jobs scheduled"}
              />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button nativeButton={false} render={<Link href="/projects" />}>
                Go to projects
                <ArrowRight
                  data-icon="inline-end"
                  className="transition-transform group-hover/button:translate-x-0.5"
                />
              </Button>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/projects/new" />}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <Plus data-icon="inline-start" />
                New project
              </Button>
            </div>
            <p className="mt-6 border-t border-zinc-800/70 pt-4 font-mono text-xs text-zinc-600">
              {pluralize(projects.length, "project")} ·{" "}
              {pluralize(jobTotal, "job")} all-time
            </p>
          </Panel>
        ) : null}
      </motion.div>
    </div>
  );
}
