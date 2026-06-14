import { createClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase client configured from environment variables.
 * Server-side only — never import in Client Components.
 */
export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set."
    );
  }

  return createClient(url, key);
}
