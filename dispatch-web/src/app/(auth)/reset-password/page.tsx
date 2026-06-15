"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicGuard } from "@/components/guards/public-guard";
import * as api from "@/lib/api";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/v1/auth/reset-password", { token, password });
      router.replace("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <motion.p
          {...enter(0)}
          className="font-mono text-xs tracking-widest text-zinc-500"
        >
          <span className="text-amber-400">auth</span>
          <span className="mx-2 text-zinc-700">/</span>
          reset password
        </motion.p>
        <motion.h1
          {...enter(0.06)}
          className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100"
        >
          Link is missing or invalid
        </motion.h1>
        <motion.p
          {...enter(0.12)}
          className="mt-2 text-sm leading-relaxed text-zinc-400"
        >
          Request a fresh reset link and try again.
        </motion.p>
        <motion.p {...enter(0.18)} className="mt-8 text-sm text-zinc-500">
          <Link
            href="/forgot-password"
            className="text-zinc-200 underline-offset-4 transition-colors hover:text-amber-400 hover:underline"
          >
            Request a new link
          </Link>
        </motion.p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <motion.p
        {...enter(0)}
        className="font-mono text-xs tracking-widest text-zinc-500"
      >
        <span className="text-amber-400">auth</span>
        <span className="mx-2 text-zinc-700">/</span>
        reset password
      </motion.p>
      <motion.h1
        {...enter(0.06)}
        className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100"
      >
        Set a new password
      </motion.h1>
      <motion.p
        {...enter(0.12)}
        className="mt-2 text-sm leading-relaxed text-zinc-400"
      >
        Choose something you haven&apos;t used before. This signs out your other
        sessions.
      </motion.p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <motion.div {...enter(0.18)} className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </motion.div>

        <motion.div {...enter(0.24)} className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </motion.div>

        {error ? (
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="rounded-sm border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </motion.p>
        ) : null}

        <motion.div {...enter(0.3)}>
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "Saving…" : "Reset password"}
            <ArrowRight
              data-icon="inline-end"
              className="transition-transform group-hover/button:translate-x-0.5"
            />
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <PublicGuard>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </PublicGuard>
  );
}
