"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TickRule } from "@/components/app/tick-rule";
import * as api from "@/lib/api";
import type { Project } from "@/lib/types";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

const MAX_NAME_LENGTH = 100;

export default function NewProjectPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(value: string): string | null {
    if (!value.trim()) return "Give it a name — even “staging” works.";
    if (value.trim().length > MAX_NAME_LENGTH)
      return `Keep it under ${MAX_NAME_LENGTH} characters.`;
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = validate(name);
    setFieldError(invalid);
    if (invalid) return;

    setServerError(null);
    setSubmitting(true);
    try {
      const project = await api.post<Project>("/api/v1/projects", {
        name: name.trim(),
      });
      // stay in the submitting state while the redirect lands
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setSubmitting(false);
    }
  }

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
      <div className="mx-auto max-w-md">
        <motion.div {...enter(0)}>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft className="size-3.5" />
            projects
          </Link>
        </motion.div>

        <motion.p
          {...enter(0.05)}
          className="mt-8 font-mono text-xs tracking-widest text-zinc-500"
        >
          <span className="text-amber-400">projects</span>
          <span className="mx-2 text-zinc-700">/</span>
          new
        </motion.p>
        <motion.h1
          {...enter(0.1)}
          className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100"
        >
          Name your project
        </motion.h1>
        <motion.p
          {...enter(0.15)}
          className="mt-2 text-sm leading-relaxed text-zinc-400"
        >
          API keys and jobs live inside it. You can rename it later — keys and
          jobs stay put.
        </motion.p>

        <motion.div {...enter(0.18)}>
          <TickRule className="mt-6" />
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <motion.div {...enter(0.22)} className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              autoFocus
              placeholder="my-app-production"
              value={name}
              aria-invalid={fieldError ? true : undefined}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldError) setFieldError(validate(e.target.value));
              }}
            />
            {fieldError ? (
              <p role="alert" className="text-sm text-red-300">
                {fieldError}
              </p>
            ) : null}
          </motion.div>

          {serverError ? (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="rounded-sm border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
            >
              {serverError}
            </motion.p>
          ) : null}

          <motion.div {...enter(0.27)}>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Creating…" : "Create project"}
              <ArrowRight
                data-icon="inline-end"
                className="transition-transform group-hover/button:translate-x-0.5"
              />
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
