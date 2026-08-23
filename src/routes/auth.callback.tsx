import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  code: z.string().optional(),
  role: z.enum(["customer", "owner"]).optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Signing you in… — Bladeroom" }],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const { code, role, error, error_description } = Route.useSearch();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function finish() {
      if (error) {
        console.error("[auth/callback]", error, error_description);
        void navigate({ to: "/auth", replace: true });
        return;
      }

      if (!code) {
        // No PKCE code — implicit flow; onAuthStateChange handles session.
        // Redirect to auth so the user lands somewhere sensible.
        void navigate({ to: "/auth", replace: true });
        return;
      }

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError || !data.session) {
        console.error("[auth/callback] exchangeCodeForSession failed", exchangeError);
        void navigate({ to: "/auth", replace: true });
        return;
      }

      const userId = data.session.user.id;
      const intendedRole = role ?? "customer";

      // Check if this user already has a role row (returning user)
      const { data: existing } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        // New Google user — assign their intended role
        await supabase.from("user_roles").insert({ user_id: userId, role: intendedRole });
      }

      // Determine final role: DB row beats URL param for returning users
      const finalRole = existing?.role ?? intendedRole;

      void navigate({
        to: finalRole === "owner" ? "/dashboard" : "/my-bookings",
        replace: true,
      });
    }

    void finish();
  }, [code, role, error, error_description, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <svg
          className="size-8 animate-spin text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
