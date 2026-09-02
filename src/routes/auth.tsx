import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/GoogleIcon";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRole } from "@/hooks/useOwnerRole";

// localStorage key used to persist intended role across OAuth redirect
const ROLE_STORAGE_KEY = "bladeroom_oauth_intended_role";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Bladeroom" },
      {
        name: "description",
        content:
          "Sign in or create a Bladeroom account to book barbershop appointments, or register as a shop owner.",
      },
      { property: "og:title", content: "Sign In — Bladeroom" },
      { property: "og:description", content: "Access your Bladeroom bookings or shop dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOwner, isLoading: roleLoading } = useOwnerRole();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"customer" | "owner">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // Redirect already-signed-in users to their correct area
  useEffect(() => {
    if (user && !roleLoading) {
      void navigate({ to: isOwner ? "/dashboard" : "/my-bookings", replace: true });
    }
  }, [user, isOwner, roleLoading, navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        // Pass intended_role in user metadata so it's stored in the session
        // and available even if email confirmation is required
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: fullName, intended_role: role },
          },
        });
        if (error) throw error;

        if (data.session) {
          // Immediate session (no email confirmation required)
          await supabase.from("user_roles").insert({
            user_id: data.session.user.id,
            role,
          });
          toast.success("Welcome to Bladeroom");
          void navigate({ to: role === "owner" ? "/dashboard" : "/my-bookings", replace: true });
        } else {
          // Email confirmation flow — role stored in user_metadata, callback will pick it up
          setSent(true);
          toast.success("Check your email to confirm your account");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        // Redirect is handled by the useEffect watching user + isOwner
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    // Store the intended role in localStorage before navigating away.
    // localStorage survives full-page OAuth redirects (unlike sessionStorage
    // which may be cleared on cross-origin navigation in some browsers).
    localStorage.setItem(ROLE_STORAGE_KEY, role);

    // Also encode role in the callback path as primary mechanism
    const callbackUrl = `${window.location.origin}/auth/callback?role=${role}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      localStorage.removeItem(ROLE_STORAGE_KEY);
      toast.error("Google sign-in failed. Please try again.");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-20">
      {/* Role indicator */}
      <p className="overline">{role === "owner" ? "Shop owner" : "Customer"}</p>
      <h1 className="mt-3 text-5xl">{mode === "signin" ? "Sign in" : "Create account"}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {role === "owner"
          ? "Publish your shop, build your menu and manage your book."
          : "Book chairs, track appointments and cancel when plans change."}
      </p>

      {/* Role selector */}
      <div className="mt-8 grid grid-cols-2 gap-2">
        {(["customer", "owner"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRole(option)}
            className={`rounded border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
              role === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/60"
            }`}
          >
            {option === "customer" ? "I'm booking" : "I own a shop"}
          </button>
        ))}
      </div>

      {/* Email / password form */}
      <form onSubmit={handleSubmit} className="panel mt-6 space-y-4 rounded-lg p-6">
        {mode === "signup" && (
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5"
              required
            />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Google OAuth button — clearly shows which role will be used */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => void handleGoogle()}
        >
          <GoogleIcon className="size-4 shrink-0" />
          Continue with Google
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {role === "owner" ? "Owner" : "Customer"}
          </span>
        </Button>

        <p className="text-center text-[0.65rem] text-muted-foreground">
          Select your role above before continuing with Google.
        </p>

        {sent && (
          <p className="text-xs text-muted-foreground">
            We sent a confirmation link to <strong>{email}</strong>. Click it to finish signing up.
          </p>
        )}
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary"
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
