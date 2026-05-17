import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  // Only warn — don't throw, so SSR/prerender doesn't crash.
  // eslint-disable-next-line no-console
  console.warn("[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing");
}

export const supabase = createClient(url ?? "", key ?? "", {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: typeof window !== "undefined",
  },
});
