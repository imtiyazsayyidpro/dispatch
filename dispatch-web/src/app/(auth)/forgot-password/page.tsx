"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicGuard } from "@/components/guards/public-guard";
import * as api from "@/lib/api";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

function ForgotPasswordForm() {
  const reduceMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/v1/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (sent) {
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
          Check your inbox
        </motion.h1>
        <motion.p
          {...enter(0.12)}
          className="mt-2 text-sm leading-relaxed text-zinc-400"
        >
          If an account exists for{" "}
          <span className="font-mono text-zinc-200">{email}</span>, we&apos;ve
          sent a link to reset your password. It expires in an hour.
        </motion.p>
        <motion.p {...enter(0.18)} className="mt-8 text-sm text-zinc-500">
          <Link
            href="/login"
            className="text-zinc-200 underline-offset-4 transition-colors hover:text-amber-400 hover:underline"
          >
            Back to sign in
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
        Forgot your password?
      </motion.h1>
      <motion.p
        {...enter(0.12)}
        className="mt-2 text-sm leading-relaxed text-zinc-400"
      >
        Enter your email and we&apos;ll send you a link to set a new one.
      </motion.p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <motion.div {...enter(0.18)} className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

        <motion.div {...enter(0.24)}>
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "Sending…" : "Send reset link"}
            <ArrowRight
              data-icon="inline-end"
              className="transition-transform group-hover/button:translate-x-0.5"
            />
          </Button>
        </motion.div>

        <motion.p {...enter(0.3)} className="text-sm text-zinc-500">
          Remembered it?{" "}
          <Link
            href="/login"
            className="text-zinc-200 underline-offset-4 transition-colors hover:text-amber-400 hover:underline"
          >
            Sign in
          </Link>
        </motion.p>
      </form>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <PublicGuard>
      <ForgotPasswordForm />
    </PublicGuard>
  );
}
