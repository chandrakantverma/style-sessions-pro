import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Supabase browser client.
 *
 * Import like this:
 *   import { supabase } from "@/integrations/supabase/client";
 */

function createSupabaseClient() {
  const SUPABASE_URL =
    import.meta.env["VITE_SUPABASE_URL"] ?? (process.env["SUPABASE_URL"] as string | undefined);
  const SUPABASE_KEY =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    import.meta.env["VITE_SUPABASE_ANON_KEY"] ??
    (process.env["SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
    (process.env["SUPABASE_ANON_KEY"] as string | undefined);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["VITE_SUPABASE_URL"] : []),
      ...(!SUPABASE_KEY ? ["VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)"] : []),
    ];
    throw new Error(
      `Missing Supabase environment variable(s): ${missing.join(", ")}. ` +
        `Copy .env.example to .env and fill in your project credentials.`,
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
