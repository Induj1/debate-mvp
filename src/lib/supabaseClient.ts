import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** True if real Supabase URL/key are set (e.g. in Vercel env or .env). */
export function isSupabaseConfigured(): boolean {
  return (
    !supabaseUrl.includes("your-project") &&
    supabaseAnonKey !== "your-anon-key" &&
    supabaseAnonKey.length > 20
  );
}
