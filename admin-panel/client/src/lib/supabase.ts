import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    console.warn("Supabase Realtime not initialized: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in admin-panel/.env");
  }
  return supabase;
}
