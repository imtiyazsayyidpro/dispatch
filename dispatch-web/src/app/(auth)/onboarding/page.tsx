"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brackets } from "@/components/app/panel";
import { AuthGuard } from "@/components/guards/auth-guard";
import { useAuth, type User } from "@/context/auth-context";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

interface Answers {
  heardFrom: string;
  role: string;
  building: string;
  teamSize: string;
  primaryUseCase: string;
}

type StepKey = keyof Answers;

interface Step {
  key: StepKey;
  title: string;
  hint: string;
  options?: string[];
}

const STEPS: Step[] = [
  {
    key: "heardFrom",
    title: "How did you hear about us?",
    hint: "Helps us figure out where to show up more.",
    options: ["Word of mouth", "Twitter/X", "GitHub", "Google", "Other"],
  },
  {
    key: "role",
    title: "What is your role?",
    hint: "So we know who we're building for.",
    options: ["Developer", "DevOps Engineer", "Indie Hacker", "Founder", "Other"],
  },
  {
    key: "building",
    title: "What are you building?",
    hint: "A sentence is plenty.",
  },
  {
    key: "teamSize",
    title: "What is your team size?",
    hint: "Counting everyone who'll touch Dispatch.",
    options: ["Just me", "2-5", "6-20", "20+"],
  },
  {
    key: "primaryUseCase",
    title: "What will you primarily use Dispatch for?",
    hint: "Last one, promise.",
    options: [
      "Sending reminders",
      "Triggering background jobs",
      "Webhook scheduling",
      "Other",
    ],
  },
];

const EMPTY_ANSWERS: Answers = {
  heardFrom: "",
  role: "",
  building: "",
  teamSize: "",
  primaryUseCase: "",
};

const PROVISION_LINES = [
  "▸ saving profile",
  "▸ provisioning workspace",
  "▸ warming the scheduler",
];

/** The provisioning theater runs at least this long before the redirect. */
const MIN_PROVISION_MS = 2200;

function OnboardingFlow() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "provisioning">("form");
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const provisioning = phase === "provisioning";
  const firstName = user?.name.split(" ")[0] ?? "there";

  function goTo(index: number) {
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(index);
  }

  async function submit(finalAnswers: Answers) {
    setError(null);
    setPhase("provisioning");
    try {
      // let the provisioning sequence play out before landing
      const minDelay = new Promise<void>((resolve) =>
        setTimeout(resolve, reduceMotion ? 0 : MIN_PROVISION_MS)
      );
      const [{ user: updated }] = await Promise.all([
        api.post<{ user: User }>("/api/v1/auth/onboarding", finalAnswers),
        minDelay,
      ]);
      setUser(updated);
      router.replace("/dashboard");
    } catch (err) {
      setPhase("form");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function selectOption(value: string) {
    if (provisioning) return;
    const next = { ...answers, [step.key]: value };
    setAnswers(next);

    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (isLastStep) {
      // brief pause so the selection visibly lands before the finale
      advanceTimer.current = setTimeout(() => submit(next), 320);
    } else {
      advanceTimer.current = setTimeout(() => goTo(stepIndex + 1), 320);
    }
  }

  function handleTextContinue(event: FormEvent) {
    event.preventDefault();
    if (!answers[step.key].trim()) return;
    goTo(stepIndex + 1);
  }

  const variants = {
    enter: (dir: number) =>
      reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 28 },
    center: { opacity: 1, x: 0 },
    exit: (dir: number) =>
      reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -28 },
  };

  const stagger = (i: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: 0.12 + i * 0.05, ease: EASE },
  });

  return (
    <div className="w-full max-w-md">
      {/* progress */}
      <div className="flex items-center justify-between font-mono text-xs tracking-widest text-zinc-500">
        <span>
          <span className="text-amber-400">
            {String(stepIndex + 1).padStart(2, "0")}
          </span>
          <span className="mx-2 text-zinc-700">/</span>
          {String(STEPS.length).padStart(2, "0")}
        </span>
        <span className="text-zinc-600">setup · {firstName}</span>
      </div>
      <div className="relative mt-3 h-px w-full bg-zinc-800">
        <motion.div
          className="relative h-px bg-amber-400"
          initial={false}
          animate={{
            width: provisioning
              ? "100%"
              : `${((stepIndex + 1) / STEPS.length) * 100}%`,
          }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <span className="absolute top-[-3px] -right-1 size-[7px] rounded-full bg-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.45)]" />
        </motion.div>
      </div>

      <div className="relative mt-10 min-h-88">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {provisioning ? (
            <motion.div
              key="provisioning"
              custom={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: EASE }}
            >
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                Setting things up
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Your workspace will be ready in a moment.
              </p>

              <div className="relative mt-8 border border-zinc-800 bg-zinc-950/90 px-5 py-4 font-mono text-xs leading-7">
                <Brackets className="text-amber-400/50" />
                {PROVISION_LINES.map((line, i) => (
                  <motion.div
                    key={line}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.25,
                      delay: reduceMotion ? 0 : 0.2 + i * 0.45,
                    }}
                    className="text-zinc-400"
                  >
                    {line}
                  </motion.div>
                ))}
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.25,
                    delay: reduceMotion ? 0 : 0.2 + PROVISION_LINES.length * 0.45,
                  }}
                  className="text-emerald-400"
                >
                  ✓ ready — welcome to dispatch, {firstName.toLowerCase()}
                  <span className="ml-1 animate-pulse text-zinc-500">▍</span>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={step.key}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: EASE }}
            >
              <h1 className="text-2xl font-semibold tracking-tight text-balance text-zinc-100 sm:text-3xl">
                {step.title}
              </h1>
              <p className="mt-2 text-sm text-zinc-500">{step.hint}</p>

              {step.options ? (
                <div className="mt-8 space-y-2.5" role="radiogroup">
                  {step.options.map((option, i) => {
                    const selected = answers[step.key] === option;
                    return (
                      <motion.button
                        key={option}
                        {...stagger(i)}
                        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => selectOption(option)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-sm border px-4 py-3 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40",
                          selected
                            ? "border-amber-400/50 bg-amber-400/10 text-zinc-100"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-200"
                        )}
                      >
                        <span
                          className={cn(
                            "font-mono text-xs",
                            selected ? "text-amber-400" : "text-zinc-600"
                          )}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {option}
                        {selected ? (
                          <motion.span
                            initial={
                              reduceMotion ? false : { scale: 0.4, opacity: 0 }
                            }
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 28,
                            }}
                            className="ml-auto text-amber-400"
                          >
                            <Check className="size-4" />
                          </motion.span>
                        ) : null}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <form onSubmit={handleTextContinue} className="mt-8">
                  <motion.div {...stagger(0)}>
                    <Input
                      autoFocus
                      required
                      placeholder="A reminder service, a billing system, a side project…"
                      value={answers[step.key]}
                      onChange={(e) =>
                        setAnswers({ ...answers, [step.key]: e.target.value })
                      }
                      className="h-11"
                    />
                  </motion.div>
                  <motion.div {...stagger(1)}>
                    <Button
                      type="submit"
                      size="lg"
                      className="mt-5 w-full"
                      disabled={!answers[step.key].trim()}
                    >
                      Continue
                      <ArrowRight
                        data-icon="inline-end"
                        className="transition-transform group-hover/button:translate-x-0.5"
                      />
                    </Button>
                  </motion.div>
                </form>
              )}

              {error && isLastStep ? (
                <p
                  role="alert"
                  className="mt-5 rounded-sm border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
                >
                  {error}
                </p>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex h-8 items-center justify-between">
        {stepIndex > 0 && !provisioning ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goTo(stepIndex - 1)}
            className="text-zinc-500 hover:text-zinc-200"
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard requireOnboarded={false}>
      <OnboardingFlow />
    </AuthGuard>
  );
}
