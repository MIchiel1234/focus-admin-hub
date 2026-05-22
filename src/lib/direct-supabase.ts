import { createClient } from "@supabase/supabase-js";

const DIRECT_SUPABASE_URL = "https://fmtnjjpsipmtheyztlxx.supabase.co";
const DIRECT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_zZ0SctqiIdA1fnRc8yKEDA_NjPz2sr2";

export const directSupabase = createClient(DIRECT_SUPABASE_URL, DIRECT_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
