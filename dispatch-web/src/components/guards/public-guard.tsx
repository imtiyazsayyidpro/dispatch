"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

import { GuardFallback } from "./guard-fallback";

/**
 * Wraps public-only routes (login, register). Signed-in visitors are
 * forwarded to where they belong instead of seeing the form again.
 */
export function PublicGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, isOnboarded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    router.replace(isOnboarded ? "/dashboard" : "/onboarding");
  }, [isLoading, isAuthenticated, isOnboarded, router]);

  if (isLoading || isAuthenticated) return <GuardFallback />;

  return <>{children}</>;
}
