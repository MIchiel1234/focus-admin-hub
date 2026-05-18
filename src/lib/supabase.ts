import { createClient } from "@supabase/supabase-js";

// Hardcoded fallback so preview (where Vite env vars aren't set) still talks
// to the real Supabase project. The anon key is a public/publishable key —
// safe to ship in client code; RLS protects the data.
const FALLBACK_URL = "https://fmtnjjpsipmtheyztlxx.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdG5qanBzaXBtdGhleXp0bHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTU0NDcsImV4cCI6MjA3NjUzMTQ0N30.kJEnnxJBNoBpemEa8I5SUTeYqgmS2VNcebPbHTtcZBE";

const url = (import.meta.env.VITE_SUPABASE_URL as string) || FALLBACK_URL;
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || FALLBACK_ANON_KEY;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: typeof window !== "undefined",
  },
});
