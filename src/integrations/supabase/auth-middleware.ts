import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-side middleware that validates the Bearer token on incoming server
 * function requests and attaches an authenticated Supabase client + user context.
 *
 * Usage in a server function:
 *   export const myFn = createServerFn().middleware([requireSupabaseAuth]).handler(...)
 */
export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env["SUPABASE_URL"];
    const SUPABASE_KEY =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      const missing = [
        ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
        ...(!SUPABASE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
      ];
      throw new Error(
        `Missing Supabase environment variable(s): ${missing.join(", ")}. ` +
          `Ensure your .env file is configured correctly.`,
      );
    }

    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Unauthorized: A Bearer token is required");
    }

    const token = authHeader.slice(7);
    if (!token || token.split(".").length !== 3) {
      throw new Error("Unauthorized: Invalid token");
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      throw new Error("Unauthorized: Invalid or expired token");
    }

    return next({
      context: {
        supabase,
        userId: data.claims.sub,
        claims: data.claims,
      },
    });
  },
);
