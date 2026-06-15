"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

import { ProjectCard } from "@/components/app/project-card";
import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/app/error-panel";
import { PageHeader } from "@/components/app/page-header";
import { Panel } from "@/components/app/panel";
import { Scan } from "@/components/app/scan";
import * as api from "@/lib/api";
import { pluralize } from "@/lib/format";
import type { Project } from "@/lib/types";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

export default function ProjectsPage() {
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

  const loading = projects === null && error === null;

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
      <PageHeader
        path={["app", "projects"]}
        title="Projects"
        action={
          <Button nativeButton={false} render={<Link href="/projects/new" />}>
            <Plus data-icon="inline-start" />
            New project
          </Button>
        }
      />

      <motion.div {...enter(0.2)} className="mt-10">
        {loading ? (
          <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            aria-hidden="true"
          >
            {[0, 1, 2].map((i) => (
              <Scan key={i} className="h-37 border border-zinc-800/70" />
            ))}
          </div>
        ) : error ? (
          <ErrorPanel message={error} onRetry={retry} />
        ) : projects && projects.length === 0 ? (
          <Panel brackets className="flex flex-col items-start p-6 sm:p-8">
            <p className="font-mono text-xs text-zinc-500">
              <span className="text-zinc-600">$</span> dispatch projects ls
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-600">
              0 projects found
            </p>
            <h2 className="mt-6 text-lg font-medium text-zinc-100">
              Projects keep environments apart
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
              Each project gets its own API keys and its own jobs, so staging
              can never fire production&apos;s webhooks. Most people start with
              one per environment.
            </p>
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
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            <p className="mt-6 font-mono text-xs text-zinc-600">
              {pluralize(projects.length, "project")}
            </p>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}
