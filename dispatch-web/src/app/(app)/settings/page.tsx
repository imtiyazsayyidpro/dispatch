"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { useAuth, type User } from "@/context/auth-context";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "password", label: "Password" },
  { id: "danger", label: "Danger zone" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** How long a success message stays up before fading out. */
const SUCCESS_DISMISS_MS = 3000;

type Feedback = { kind: "success" | "error"; message: string } | null;

function InlineFeedback({ feedback }: { feedback: Feedback }) {
  return (
    <AnimatePresence>
      {feedback ? (
        <motion.p
          key={`${feedback.kind}:${feedback.message}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          role={feedback.kind === "error" ? "alert" : "status"}
          className={cn(
            "text-sm",
            feedback.kind === "error" ? "text-red-300" : "text-emerald-400"
          )}
        >
          {feedback.message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Feedback state plus the auto-dismiss timer for successes. Errors stay
 * until the next attempt replaces or clears them.
 */
function useFeedback() {
  const [feedback, setFeedbackState] = useState<Feedback>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFeedback = useCallback((next: Feedback) => {
    if (timer.current) clearTimeout(timer.current);
    setFeedbackState(next);
    if (next?.kind === "success") {
      timer.current = setTimeout(
        () => setFeedbackState(null),
        SUCCESS_DISMISS_MS
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return [feedback, setFeedback] as const;
}

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        required
        className="pr-9"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-zinc-600 transition-colors hover:text-zinc-300 focus-visible:text-zinc-300 focus-visible:outline-none"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function SectionHeader({
  id,
  title,
  description,
}: {
  id: SectionId;
  title: string;
  description: string;
}) {
  const index = SECTIONS.findIndex((s) => s.id === id) + 1;

  return (
    <>
      <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
        <span className="text-amber-400">{String(index).padStart(2, "0")}</span>
        <span className="mx-2 text-zinc-700">/</span>
        {id}
      </p>
      <h2
        id={`${id}-heading`}
        className="mt-2 text-lg font-medium text-zinc-100"
      >
        {title}
      </h2>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
    </>
  );
}

function ProfileSection() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useFeedback();

  // Pre-fill once the session user is available; re-sync after a save
  // refreshes the context so the form always mirrors what's stored.
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const dirty =
    user !== null &&
    (name.trim() !== user.name || email.trim() !== user.email);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      await api.put("/api/v1/me/profile", {
        name: name.trim(),
        email: email.trim(),
      });
      const me = await api.get<User>("/api/v1/me");
      setUser(me);
      setFeedback({ kind: "success", message: "Profile updated." });
    } catch (err) {
      setFeedback({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Could not update your profile",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="profile" aria-labelledby="profile-heading" className="scroll-mt-24">
      <SectionHeader
        id="profile"
        title="Profile"
        description="Your name and the email you sign in with."
      />

      <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-5">
        <div className="space-y-2">
          <Label htmlFor="profile-name">
            Name
          </Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={saving || user === null}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email">
            Email
          </Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={saving || user === null}
            required
          />
        </div>
        <div className="flex items-center gap-4">
          <Button type="submit" size="sm" disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <InlineFeedback feedback={feedback} />
        </div>
      </form>
    </section>
  );
}

function PasswordSection() {
  const { logout } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (next !== confirm) {
      setFeedback({ kind: "error", message: "New passwords don't match." });
      return;
    }
    if (next.length < 8) {
      setFeedback({
        kind: "error",
        message: "New password must be at least 8 characters.",
      });
      return;
    }

    setFeedback(null);
    setSaving(true);
    try {
      await api.put("/api/v1/me/password", {
        currentPassword: current,
        newPassword: next,
      });
      setDone(true);
      logoutTimer.current = setTimeout(() => logout(), 2000);
    } catch (err) {
      setFeedback({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Could not change your password",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="password"
      aria-labelledby="password-heading"
      className="scroll-mt-24"
    >
      <SectionHeader
        id="password"
        title="Password"
        description="Changing your password signs you out everywhere, including this session."
      />

      {done ? (
        <div
          role="status"
          className="mt-6 max-w-md border border-emerald-500/30 bg-emerald-500/10 p-4"
        >
          <p className="text-sm font-medium text-emerald-400">
            Password changed
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            All sessions have been signed out. Taking you to the login page…
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password-current">
              Current password
            </Label>
            <PasswordInput
              id="password-current"
              value={current}
              onChange={setCurrent}
              autoComplete="current-password"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-new">
              New password
            </Label>
            <PasswordInput
              id="password-new"
              value={next}
              onChange={setNext}
              autoComplete="new-password"
              disabled={saving}
            />
            <p className="text-xs text-zinc-600">At least 8 characters.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-confirm">
              Confirm new password
            </Label>
            <PasswordInput
              id="password-confirm"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              disabled={saving}
            />
          </div>
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              size="sm"
              disabled={saving || !current || !next || !confirm}
            >
              {saving ? "Saving…" : "Change password"}
            </Button>
            <InlineFeedback feedback={feedback} />
          </div>
        </form>
      )}
    </section>
  );
}

function DangerSection() {
  const { user, logout } = useAuth();

  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useFeedback();

  const armed =
    user !== null && confirmText.trim().toLowerCase() === user.email.toLowerCase();

  async function onDelete() {
    setFeedback(null);
    setDeleting(true);
    try {
      await api.del("/api/v1/me/account", { password });
      await logout();
    } catch (err) {
      setDeleting(false);
      setFeedback({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Could not delete your account",
      });
    }
  }

  return (
    <section
      id="danger"
      aria-labelledby="danger-heading"
      className="scroll-mt-24"
    >
      <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
        <span className="text-red-400">03</span>
        <span className="mx-2 text-zinc-700">/</span>
        danger
      </p>
      <h2
        id="danger-heading"
        className="mt-2 text-lg font-medium text-red-400"
      >
        Danger zone
      </h2>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-zinc-400">
        Deleting your account is immediate and permanent.
      </p>

      <div className="mt-6 max-w-md border border-red-900/50 bg-red-950/20 p-5">
        <p className="text-sm font-medium text-zinc-200">Delete account</p>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          Every project, scheduled job, delivery log, and API key on this
          account is destroyed with it. Scheduled jobs will never fire. There
          is no undo and no grace period.
        </p>

        <div className="mt-5 space-y-2">
          <Label htmlFor="danger-password">
            Your password
          </Label>
          <PasswordInput
            id="danger-password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            disabled={deleting}
          />
        </div>

        {!confirming ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={!password}
            onClick={() => setConfirming(true)}
            className="mt-5"
          >
            Delete my account…
          </Button>
        ) : (
          <div className="mt-5 rounded-sm border border-red-900/60 bg-red-950/40 p-4">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-400" />
              <p className="text-sm leading-relaxed text-red-200">
                Last step. Type{" "}
                <span className="font-mono text-xs text-red-100">
                  {user?.email}
                </span>{" "}
                to confirm you want this account gone for good.
              </p>
            </div>
            <Input
              aria-label="Type your email to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user?.email}
              disabled={deleting}
              autoComplete="off"
              className="mt-3"
            />
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={!armed || deleting}
                onClick={onDelete}
              >
                {deleting ? "Deleting…" : "Permanently delete account"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => {
                  setConfirming(false);
                  setConfirmText("");
                }}
                className="text-zinc-400 hover:text-zinc-100"
              >
                Keep my account
              </Button>
            </div>
          </div>
        )}

        <div className="mt-3">
          <InlineFeedback feedback={feedback} />
        </div>
      </div>
    </section>
  );
}

function SectionNav({ active }: { active: SectionId }) {
  return (
    <>
      {/* desktop: sticky rail with scroll-spy highlight */}
      <nav
        aria-label="Settings sections"
        className="sticky top-10 hidden self-start lg:block"
      >
        <ul className="border-l border-zinc-800">
          {SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? "true" : undefined}
                className={cn(
                  "-ml-px block border-l py-1.5 pl-4 text-sm transition-colors",
                  active === id
                    ? id === "danger"
                      ? "border-red-400 text-red-400"
                      : "border-amber-400 text-zinc-100"
                    : "border-transparent text-zinc-500 hover:text-zinc-300",
                  id === "danger" && active !== id && "hover:text-red-400/80"
                )}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* mobile: anchor row */}
      <nav
        aria-label="Settings sections"
        className="-mx-6 flex gap-5 overflow-x-auto border-b border-zinc-800/70 px-6 pb-3 lg:hidden"
      >
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={cn(
              "shrink-0 font-mono text-xs tracking-wider whitespace-nowrap transition-colors",
              id === "danger"
                ? "text-red-400/80 hover:text-red-400"
                : "text-zinc-500 hover:text-zinc-200"
            )}
          >
            {label.toLowerCase()}
          </a>
        ))}
      </nav>
    </>
  );
}

export default function SettingsPage() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<SectionId>("profile");

  // Scroll-spy: the section crossing the upper band of the viewport wins.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin: "-10% 0px -65% 0px" }
    );

    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const enter = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
      <PageHeader path={["app", "settings"]} title="Settings" />

      <motion.div
        {...enter(0.18)}
        className="mt-10 gap-12 lg:grid lg:grid-cols-[10rem_minmax(0,1fr)]"
      >
        <SectionNav active={active} />

        <div className="mt-8 space-y-16 pb-24 lg:mt-0">
          <ProfileSection />
          <PasswordSection />
          <DangerSection />
        </div>
      </motion.div>
    </div>
  );
}
