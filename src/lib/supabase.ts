import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string) || "https://placeholder.supabase.co";
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "placeholder-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing — auth/data calls will fail until env vars are set at build time."
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: typeof window !== "undefined",
  },
});
