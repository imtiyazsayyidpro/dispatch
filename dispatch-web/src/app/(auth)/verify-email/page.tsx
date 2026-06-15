"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicGuard } from "@/components/guards/public-guard";
import { useAuth, type User } from "@/context/auth-context";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];
const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

function VerifyEmailForm() {
  const { setSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(() =>
    Array<string>(CODE_LENGTH).fill("")
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);

  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const code = useMemo(() => digits.join(""), [digits]);

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  // No email in the URL means the user landed here directly — bounce to register.
  useEffect(() => {
    if (!email) router.replace("/register");
  }, [email, router]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function submitCode(value: string) {
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } = await api.post<{ token: string; user: User }>(
        "/api/v1/auth/verify-email",
        { email, code: value }
      );
      setSession(token, user);
      router.replace(user.isOnboarded ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDigits(Array<string>(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
      setSubmitting(false);
    }
  }

  function setDigitAt(index: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setDigitAt(index, "");
      return;
    }
    // Keep only the last typed character per box.
    const char = value[value.length - 1];
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    if (index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();

    // Submit the moment the final box is filled.
    if (next.every((d) => d !== "")) void submitCode(next.join(""));
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      setDigitAt(index - 1, "");
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array<string>(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputs.current[focusIndex]?.focus();
    if (pasted.length === CODE_LENGTH) void submitCode(pasted);
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    setResent(false);
    try {
      await api.post("/api/v1/auth/resend-verification", { email });
      setResent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the code");
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
        verify email
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
        We sent a 6-digit code to{" "}
        <span className="font-mono text-zinc-200">{email}</span>. Enter it below
        to continue.
      </motion.p>

      <div className="mt-8 space-y-5">
        <motion.div {...enter(0.18)} className="flex justify-between gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              disabled={submitting}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={cn(
                "h-14 w-full rounded-sm border border-zinc-800 bg-zinc-900/50 text-center font-mono text-xl text-zinc-100 transition-colors outline-none",
                "focus-visible:border-amber-400/60 focus-visible:bg-zinc-900/80 focus-visible:ring-2 focus-visible:ring-amber-400/15",
                "disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-red-900/70"
              )}
            />
          ))}
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
        ) : resent ? (
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-sm border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-sm text-amber-300/90"
          >
            A fresh code is on its way.
          </motion.p>
        ) : null}

        <motion.div {...enter(0.3)}>
          <Button
            type="button"
            size="lg"
            disabled={submitting || code.length !== CODE_LENGTH}
            onClick={() => submitCode(code)}
            className="w-full"
          >
            {submitting ? "Verifying…" : "Verify email"}
            <ArrowRight
              data-icon="inline-end"
              className="transition-transform group-hover/button:translate-x-0.5"
            />
          </Button>
        </motion.div>

        <motion.p {...enter(0.36)} className="text-sm text-zinc-500">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="text-zinc-200 underline-offset-4 transition-colors hover:text-amber-400 hover:underline disabled:cursor-not-allowed disabled:text-zinc-600 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </motion.p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <PublicGuard>
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </PublicGuard>
  );
}
