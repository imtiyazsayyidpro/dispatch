"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

import { GuardFallback } from "./guard-fallback";

/**
 * Protects private routes.
 *
 * - unauthenticated            → /login
 * - authenticated, no onboarding → /onboarding
 * - authenticated + onboarded  → children
 *
 * Pass `requireOnboarded={false}` for the onboarding route itself: there the
 * rule inverts, and an already-onboarded user is sent on to /dashboard.
 */
export function AuthGuard({
  children,
  requireOnboarded = true,
}: {
  children: ReactNode;
  requireOnboarded?: boolean;
}) {
  const { isLoading, isAuthenticated, isOnboarded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (requireOnboarded && !isOnboarded) {
      router.replace("/onboarding");
    } else if (!requireOnboarded && isOnboarded) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, isOnboarded, requireOnboarded, router]);

  const allowed =
    isAuthenticated && (requireOnboarded ? isOnboarded : !isOnboarded);

  if (isLoading || !allowed) return <GuardFallback />;

  return <>{children}</>;
}
