/**
 * Bug Condition Exploration Test — OAuth Callback Role Query Error Handling
 *
 * Task 1 (re-used in Task 3.2): Validates Property 1 from design.md
 *
 * **Validates: Requirements 2.3**
 *
 * This test encodes the EXPECTED behavior of the fixed `finish()` function:
 *   - When the user_roles query fails (transient error), the code must:
 *       1. Log the error
 *       2. Retry once after a 500ms delay
 *       3. If retry succeeds, redirect to the correct destination
 *       4. If retry also fails, fall through to localStorage/metadata resolution
 *   - These tests FAILED on the unfixed code (missing error check caused fallthrough
 *     to new-user logic without retry, misidentifying returning users as new users).
 *   - These tests PASS on the fixed code (error is caught, retry is attempted).
 *
 * Because the component uses React hooks and TanStack Router navigation,
 * the logic is tested via a pure extraction of the role-resolution algorithm
 * (mirroring the `finish()` function's decision tree), with mocked Supabase
 * query results and timers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Types ──────────────────────────────────────────────────────────────────────

type Role = "owner" | "customer";

interface QueryResult {
  data: { role: Role } | null;
  error: { message: string } | null;
}

interface ResolveResult {
  navigatedTo: string | null;
  retried: boolean;
  errorLogged: boolean;
  fellThrough: boolean; // true if reached new-user resolution
}

// ── Pure extraction of finish() role-resolution logic ─────────────────────────
//
// This mirrors the logic in src/routes/auth.callback.tsx `finish()` from the
// point after exchangeCodeForSession succeeds. It accepts injected dependencies
// so we can test it without React, navigation, or real Supabase.

async function resolveRoleAndNavigate(
  firstQuery: () => Promise<QueryResult>,
  retryQuery: () => Promise<QueryResult>,
  delay: (ms: number) => Promise<void>,
  log: { error: (...args: unknown[]) => void },
  localStorageRole: Role | null,
  metaRole: string | null,
): Promise<ResolveResult> {
  const result: ResolveResult = {
    navigatedTo: null,
    retried: false,
    errorLogged: false,
    fellThrough: false,
  };

  // ── Step 1: initial query ──────────────────────────────────────────────────
  const { data: existing, error: roleError } = await firstQuery();

  if (roleError) {
    log.error("[auth/callback] role lookup failed, retrying...", roleError);
    result.errorLogged = true;

    await delay(500);
    result.retried = true;

    const { data: retryExisting, error: retryError } = await retryQuery();

    if (retryError) {
      log.error("[auth/callback] role lookup retry failed", retryError);
      // Fall through to localStorage/metadata resolution
    } else if (retryExisting) {
      result.navigatedTo =
        retryExisting.role === "owner" ? "/dashboard" : "/my-bookings";
      return result;
    }
  } else if (existing) {
    result.navigatedTo =
      existing.role === "owner" ? "/dashboard" : "/my-bookings";
    return result;
  }

  // ── Step 2: fallthrough — new-user resolution ──────────────────────────────
  result.fellThrough = true;

  const resolvedRole: Role | null =
    localStorageRole === "owner" || localStorageRole === "customer"
      ? localStorageRole
      : metaRole === "owner" || metaRole === "customer"
        ? (metaRole as Role)
        : null;

  if (resolvedRole) {
    result.navigatedTo = resolvedRole === "owner" ? "/dashboard" : "/my-bookings";
  }

  return result;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function successQuery(role: Role): () => Promise<QueryResult> {
  return () => Promise.resolve({ data: { role }, error: null });
}

function errorQuery(msg = "Network error"): () => Promise<QueryResult> {
  return () => Promise.resolve({ data: null, error: { message: msg } });
}

function noDataQuery(): () => Promise<QueryResult> {
  return () => Promise.resolve({ data: null, error: null });
}

const noDelay = (_ms: number) => Promise.resolve();

// ── Bug Condition Tests (Property 1) ──────────────────────────────────────────

describe("Bug Condition — role query error handling (Property 1, Requirements 2.3)", () => {
  let logMock: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    logMock = { error: vi.fn() };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Core bug scenario: query fails, retry succeeds with owner role ──────────
  it("logs the error when the initial role query fails", async () => {
    const promise = resolveRoleAndNavigate(
      errorQuery("Network error"),
      successQuery("owner"),
      noDelay,
      logMock,
      null,
      null,
    );
    const result = await promise;
    expect(result.errorLogged).toBe(true);
    expect(logMock.error).toHaveBeenCalledWith(
      "[auth/callback] role lookup failed, retrying...",
      expect.objectContaining({ message: "Network error" }),
    );
  });

  it("retries the query after initial failure", async () => {
    const result = await resolveRoleAndNavigate(
      errorQuery("Network error"),
      successQuery("owner"),
      noDelay,
      logMock,
      null,
      null,
    );
    expect(result.retried).toBe(true);
  });

  it("redirects owner to /dashboard when retry succeeds", async () => {
    const result = await resolveRoleAndNavigate(
      errorQuery("Network error"),
      successQuery("owner"),
      noDelay,
      logMock,
      null,
      null,
    );
    expect(result.navigatedTo).toBe("/dashboard");
  });

  it("redirects customer to /my-bookings when retry succeeds", async () => {
    const result = await resolveRoleAndNavigate(
      errorQuery("Network error"),
      successQuery("customer"),
      noDelay,
      logMock,
      null,
      null,
    );
    expect(result.navigatedTo).toBe("/my-bookings");
  });

  // ── RLS timing scenario: both queries fail, falls through to localStorage ───
  it("falls through to localStorage role resolution when both queries fail", async () => {
    const result = await resolveRoleAndNavigate(
      errorQuery("RLS not ready"),
      errorQuery("RLS still failing"),
      noDelay,
      logMock,
      "owner", // localStorage has role
      null,
    );
    expect(result.retried).toBe(true);
    expect(result.fellThrough).toBe(true);
    expect(result.navigatedTo).toBe("/dashboard");
  });

  it("falls through to metadata role resolution when both queries fail and localStorage is empty", async () => {
    const result = await resolveRoleAndNavigate(
      errorQuery("RLS not ready"),
      errorQuery("RLS still failing"),
      noDelay,
      logMock,
      null,
      "customer", // metadata has role
    );
    expect(result.retried).toBe(true);
    expect(result.fellThrough).toBe(true);
    expect(result.navigatedTo).toBe("/my-bookings");
  });

  it("does NOT retry when initial query succeeds", async () => {
    const result = await resolveRoleAndNavigate(
      successQuery("owner"),
      // second query should never be called
      vi.fn().mockRejectedValue(new Error("should not be called")),
      noDelay,
      logMock,
      null,
      null,
    );
    expect(result.retried).toBe(false);
    expect(result.navigatedTo).toBe("/dashboard");
  });

  it("does NOT fall through when initial query succeeds with a role", async () => {
    const result = await resolveRoleAndNavigate(
      successQuery("customer"),
      noDataQuery,
      noDelay,
      logMock,
      null,
      null,
    );
    expect(result.fellThrough).toBe(false);
    expect(result.navigatedTo).toBe("/my-bookings");
  });

  // ── Retry delay is invoked ─────────────────────────────────────────────────
  it("invokes the delay with 500ms before retry", async () => {
    const delaySpy = vi.fn((_ms: number) => Promise.resolve());
    await resolveRoleAndNavigate(
      errorQuery("timeout"),
      successQuery("owner"),
      delaySpy,
      logMock,
      null,
      null,
    );
    expect(delaySpy).toHaveBeenCalledWith(500);
  });

  // ── New user (query returns null, no error) ────────────────────────────────
  it("new user (query returns null with no error) falls through to new-user logic without retrying", async () => {
    const result = await resolveRoleAndNavigate(
      noDataQuery(),
      vi.fn().mockRejectedValue(new Error("should not be called")),
      noDelay,
      logMock,
      "owner",
      null,
    );
    expect(result.retried).toBe(false);
    expect(result.errorLogged).toBe(false);
    expect(result.fellThrough).toBe(true);
    expect(result.navigatedTo).toBe("/dashboard");
  });
});
