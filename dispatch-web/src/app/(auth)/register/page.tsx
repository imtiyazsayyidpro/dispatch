"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicGuard } from "@/components/guards/public-guard";
import * as api from "@/lib/api";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

function RegisterForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [name, setName] = useState("");
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
      await api.post<{ email: string }>("/api/v1/auth/register", {
        name,
        email,
        password,
      });
      router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
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
        create account
      </motion.p>
      <motion.h1
        {...enter(0.06)}
        className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100"
      >
        Start scheduling
      </motion.h1>
      <motion.p
        {...enter(0.12)}
        className="mt-2 text-sm leading-relaxed text-zinc-400"
      >
        One account. POST a URL and a time — we&apos;ll handle the rest.
      </motion.p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <motion.div {...enter(0.18)} className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            autoComplete="name"
            required
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </motion.div>

        <motion.div {...enter(0.24)} className="space-y-2">
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

        <motion.div {...enter(0.3)} className="space-y-2">
          <Label htmlFor="password">Password</Label>
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

        <motion.div {...enter(0.36)}>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Creating account…" : "Create account"}
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

export default function RegisterPage() {
  return (
    <PublicGuard>
      <RegisterForm />
    </PublicGuard>
  );
}
