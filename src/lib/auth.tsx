import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const AUTH_TIMEOUT_MS = 15000;
const MAGIC_LINK_REDIRECT_URL = "http://debit-scanners.with.playit.plus:1149/";

function redirectLovableAuthLinkToServer() {
  if (typeof window === "undefined") return false;

  const { hostname, search, hash } = window.location;
  const isLovableHost = hostname.endsWith("lovable.app");
  const hasAuthPayload =
    search.includes("code=") ||
    search.includes("token_hash=") ||
    hash.includes("access_token=") ||
    hash.includes("refresh_token=");

  if (!isLovableHost || !hasAuthPayload) return false;

  window.location.replace(`${MAGIC_LINK_REDIRECT_URL}${search}${hash}`);
  return true;
}

redirectLovableAuthLinkToServer();

async function withAuthTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (redirectLovableAuthLinkToServer()) return;

    let mounted = true;

    // Set up listener BEFORE getSession (per Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    loading,
    signInWithMagicLink: async (email) => {
      try {
        const { error } = await withAuthTimeout(
          supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: MAGIC_LINK_REDIRECT_URL },
          }),
          "The sign-in request timed out. Please try again.",
        );
        return { error: error?.message ?? null };
      } catch (error) {
        return { error: error instanceof Error ? error.message : "Could not send the magic link." };
      }
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
