/**
 * OAuth callback at /auth/callback
 *
 * Role resolution priority (for new users with no DB row):
 *   1. localStorage "bladeroom_oauth_intended_role" — set before OAuth redirect
 *   2. user.user_metadata.intended_role — set during email sign-up
 *   3. Role selection prompt — absolute fallback
 *
 * For returning users: DB row always wins.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Store, User } from "lucide-react";

const ROLE_STORAGE_KEY = "bladeroom_oauth_intended_role";

const searchSchema = z.object({
  code: z.string().optional(),
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
  const { code, error, error_description } = Route.useSearch();
  const ran = useRef(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

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
        void navigate({ to: "/auth", replace: true });
        return;
      }

      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError || !data.session) {
        console.error("[auth/callback] exchange failed", exchangeError);
        void navigate({ to: "/auth", replace: true });
        return;
      }

      const userId = data.session.user.id;

      // ── 1. Check existing DB role (returning user) ────────────────────────
      const { data: existing } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Returning user — always use their stored role
        void navigate({
          to: existing.role === "owner" ? "/dashboard" : "/my-bookings",
          replace: true,
        });
        return;
      }

      // ── 2. New user — resolve intended role ───────────────────────────────
      // Priority: localStorage (set before OAuth) → user_metadata (set on sign-up)
      const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as "owner" | "customer" | null;
      localStorage.removeItem(ROLE_STORAGE_KEY); // consume — one-time use

      const metaRole = data.session.user.user_metadata?.["intended_role"] as string | undefined;

      const resolvedRole: "owner" | "customer" | null =
        storedRole === "owner" || storedRole === "customer"
          ? storedRole
          : metaRole === "owner" || metaRole === "customer"
          ? metaRole
          : null;

      if (resolvedRole) {
        await supabase.from("user_roles").insert({ user_id: userId, role: resolvedRole });
        void navigate({
          to: resolvedRole === "owner" ? "/dashboard" : "/my-bookings",
          replace: true,
        });
        return;
      }

      // ── 3. Absolute fallback — show role selection UI ─────────────────────
      setPendingUserId(userId);
    }

    void finish();
  }, [code, error, error_description, navigate]);

  async function assignRole(selectedRole: "owner" | "customer") {
    if (!pendingUserId || assigning) return;
    setAssigning(true);
    try {
      await supabase.from("user_roles").insert({ user_id: pendingUserId, role: selectedRole });
      void navigate({
        to: selectedRole === "owner" ? "/dashboard" : "/my-bookings",
        replace: true,
      });
    } catch {
      setAssigning(false);
    }
  }

  // Role selection prompt — only shown when all three resolution mechanisms fail
  if (pendingUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl text-foreground">One more step</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            How will you use Bladeroom?
          </p>
          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={() => void assignRole("customer")}
              disabled={assigning}
              className="panel flex items-center gap-4 rounded-lg p-5 text-left transition-colors hover:border-primary/60 disabled:opacity-50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <User className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">I'm booking</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Browse shops and book appointments
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => void assignRole("owner")}
              disabled={assigning}
              className="panel flex items-center gap-4 rounded-lg p-5 text-left transition-colors hover:border-primary/60 disabled:opacity-50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Store className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">I own a shop</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Manage bookings and your service menu
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading spinner
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
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
