import { describe, it, expect } from "vitest";

// ── Role-based redirect logic (mirrors DashboardGuard + auth callback) ─────────

type UserRole = "owner" | "customer";

interface AuthState {
  user: { id: string; email: string } | null;
  loading: boolean;
}

interface RoleState {
  isOwner: boolean;
  isLoading: boolean;
  error: Error | null;
}

function getDashboardRedirect(auth: AuthState, role: RoleState): string | null {
  if (auth.loading || role.isLoading) return null; // still loading
  if (!auth.user) return "/auth";
  if (role.error) return "/auth";
  if (!role.isOwner) return "/my-bookings";
  return null; // proceed to render dashboard
}

function getCallbackRedirect(
  existingRole: UserRole | null,
  intendedRole: UserRole,
): string {
  const finalRole = existingRole ?? intendedRole;
  return finalRole === "owner" ? "/dashboard" : "/my-bookings";
}

function getAuthPageRedirect(
  user: { id: string } | null,
  isOwner: boolean,
  roleLoading: boolean,
): string | null {
  if (!user) return null; // stay on auth page
  if (roleLoading) return null; // wait for role
  return isOwner ? "/dashboard" : "/my-bookings";
}

// ── DashboardGuard redirect logic ──────────────────────────────────────────────
describe("getDashboardRedirect", () => {
  it("returns null while auth is loading", () => {
    expect(getDashboardRedirect({ user: null, loading: true }, { isOwner: false, isLoading: false, error: null })).toBeNull();
  });

  it("returns null while role is loading", () => {
    expect(getDashboardRedirect({ user: { id: "1", email: "a@b.com" }, loading: false }, { isOwner: false, isLoading: true, error: null })).toBeNull();
  });

  it("redirects unauthenticated user to /auth", () => {
    expect(getDashboardRedirect({ user: null, loading: false }, { isOwner: false, isLoading: false, error: null })).toBe("/auth");
  });

  it("redirects on role error to /auth", () => {
    const state = { user: { id: "1", email: "a@b.com" }, loading: false };
    const role = { isOwner: false, isLoading: false, error: new Error("RPC failed") };
    expect(getDashboardRedirect(state, role)).toBe("/auth");
  });

  it("redirects non-owner to /my-bookings", () => {
    const state = { user: { id: "1", email: "a@b.com" }, loading: false };
    const role = { isOwner: false, isLoading: false, error: null };
    expect(getDashboardRedirect(state, role)).toBe("/my-bookings");
  });

  it("returns null (render dashboard) for verified owner", () => {
    const state = { user: { id: "1", email: "owner@shop.com" }, loading: false };
    const role = { isOwner: true, isLoading: false, error: null };
    expect(getDashboardRedirect(state, role)).toBeNull();
  });
});

// ── OAuth callback redirect ────────────────────────────────────────────────────
describe("getCallbackRedirect", () => {
  it("new owner user → /dashboard", () => {
    expect(getCallbackRedirect(null, "owner")).toBe("/dashboard");
  });

  it("new customer user → /my-bookings", () => {
    expect(getCallbackRedirect(null, "customer")).toBe("/my-bookings");
  });

  it("returning owner uses DB role, not URL param", () => {
    expect(getCallbackRedirect("owner", "customer")).toBe("/dashboard");
  });

  it("returning customer uses DB role, not URL param", () => {
    expect(getCallbackRedirect("customer", "owner")).toBe("/my-bookings");
  });

  it("new user with no intended role defaults to customer", () => {
    // intendedRole defaults to customer when URL param is absent
    expect(getCallbackRedirect(null, "customer")).toBe("/my-bookings");
  });
});

// ── Auth page redirect logic ───────────────────────────────────────────────────
describe("getAuthPageRedirect", () => {
  it("returns null for unauthenticated user (stay on page)", () => {
    expect(getAuthPageRedirect(null, false, false)).toBeNull();
  });

  it("returns null while role is still loading", () => {
    expect(getAuthPageRedirect({ id: "1" }, false, true)).toBeNull();
  });

  it("redirects owner to /dashboard after sign-in", () => {
    expect(getAuthPageRedirect({ id: "1" }, true, false)).toBe("/dashboard");
  });

  it("redirects customer to /my-bookings after sign-in", () => {
    expect(getAuthPageRedirect({ id: "1" }, false, false)).toBe("/my-bookings");
  });
});
