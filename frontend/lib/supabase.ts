import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. Please define it in your .env.local file."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Please define it in your .env.local file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
