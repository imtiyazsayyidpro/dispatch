"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import * as api from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isOnboarded: boolean;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  /** Adopt a session created outside `login()` (e.g. register). */
  setSession: (token: string, user: User) => void;
  /** Replace the user in state (e.g. after onboarding completes). */
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate the session from localStorage on first mount.
  useEffect(() => {
    let cancelled = false;

    async function rehydrate() {
      const storedToken = api.getToken();
      if (storedToken) {
        try {
          const me = await api.get<User>("/api/v1/me");
          if (!cancelled) {
            setTokenState(storedToken);
            setUserState(me);
          }
        } catch {
          // Stale or revoked token — drop it so guards treat us as logged out.
          if (!cancelled) api.clearToken();
        }
      }
      if (!cancelled) setIsLoading(false);
    }

    rehydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const setSession = useCallback((newToken: string, newUser: User) => {
    api.setToken(newToken);
    setTokenState(newToken);
    setUserState(newUser);
  }, []);

  const setUser = useCallback((newUser: User) => {
    setUserState(newUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: newToken, user: newUser } = await api.post<{
        token: string;
        user: User;
      }>("/api/v1/auth/login", { email, password });

      setSession(newToken, newUser);
      return newUser;
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/v1/auth/logout");
    } catch {
      // The local session is cleared regardless of whether the server heard us.
    }
    api.clearToken();
    setTokenState(null);
    setUserState(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: user !== null,
      isOnboarded: user?.isOnboarded ?? false,
      login,
      logout,
      setSession,
      setUser,
    }),
    [user, token, isLoading, login, logout, setSession, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
