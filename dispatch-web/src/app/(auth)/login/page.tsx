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
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const justReset = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    setSubmitting(true);
    try {
      const user = await login(email, password);
      router.replace(user.isOnboarded ? "/dashboard" : "/onboarding");
    } catch (err) {
      // Unverified accounts: the server has re-sent a code — send them to verify.
      const data = err instanceof ApiError ? err.data : null;
      if (data && typeof data === "object" && "needsVerification" in data) {
        router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <motion.p
        {...enter(0)}
        className="font-mono text-xs tracking-widest text-zinc-500"
      >
        <span className="text-amber-400">auth</span>
        <span className="mx-2 text-zinc-700">/</span>
        sign in
      </motion.p>
      <motion.h1
        {...enter(0.06)}
        className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100"
      >
        Welcome back
      </motion.h1>
      <motion.p
        {...enter(0.12)}
        className="mt-2 text-sm leading-relaxed text-zinc-400"
      >
        Your schedule kept running while you were gone.
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

        <motion.div {...enter(0.24)} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 underline-offset-4 transition-colors hover:text-amber-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </motion.div>

        {justReset && !error ? (
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-sm border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-sm text-amber-300/90"
          >
            Password updated. Sign in with your new password.
          </motion.p>
        ) : null}

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
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Signing in…" : "Sign in"}
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

export default function LoginPage() {
  return (
    <PublicGuard>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </PublicGuard>
  );
}
