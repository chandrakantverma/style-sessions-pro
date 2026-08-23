import { describe, it, expect } from "vitest";
import {
  shopProfileSchema,
  serviceSchema,
  availabilitySchema,
  blockedPeriodSchema,
  rescheduleSchema,
  toServiceInsert,
  CATEGORY_VALUES,
} from "@/components/dashboard/schemas";

// ── shopProfileSchema ──────────────────────────────────────────────────────────
describe("shopProfileSchema", () => {
  it("accepts a valid shop profile", () => {
    const result = shopProfileSchema.safeParse({
      name: "The Blade Lounge",
      tagline: "Sharp cuts only",
      city: "Mumbai",
      address: "12 MG Road",
      phone: "+91 98765 43210",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty shop name", () => {
    const result = shopProfileSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("name");
    }
  });

  it("accepts a profile with only name (all optional fields omitted)", () => {
    expect(shopProfileSchema.safeParse({ name: "Fade Factory" }).success).toBe(true);
  });

  it("rejects whitespace-only name", () => {
    // .trim().min(1) rejects names composed entirely of whitespace
    expect(shopProfileSchema.safeParse({ name: "   " }).success).toBe(false);
  });
});

// ── serviceSchema ──────────────────────────────────────────────────────────────
describe("serviceSchema", () => {
  const valid = {
    name: "Classic Fade",
    description: "Skin fade with line-up",
    category: "hair" as const,
    duration_min: 30,
    price_units: 299,
    is_active: true,
  };

  it("accepts a valid service", () => {
    expect(serviceSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty service name", () => {
    const r = serviceSchema.safeParse({ ...valid, name: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("name");
  });

  it("rejects invalid category", () => {
    expect(serviceSchema.safeParse({ ...valid, category: "massage" }).success).toBe(false);
  });

  it.each(CATEGORY_VALUES)("accepts category %s", (cat) => {
    expect(serviceSchema.safeParse({ ...valid, category: cat }).success).toBe(true);
  });

  it("rejects duration below 5 minutes", () => {
    const r = serviceSchema.safeParse({ ...valid, duration_min: 4 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("duration_min");
  });

  it("rejects duration above 480 minutes", () => {
    expect(serviceSchema.safeParse({ ...valid, duration_min: 481 }).success).toBe(false);
  });

  it("accepts duration at boundaries (5 and 480)", () => {
    expect(serviceSchema.safeParse({ ...valid, duration_min: 5 }).success).toBe(true);
    expect(serviceSchema.safeParse({ ...valid, duration_min: 480 }).success).toBe(true);
  });

  it("rejects negative price", () => {
    const r = serviceSchema.safeParse({ ...valid, price_units: -1 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("price_units");
  });

  it("accepts price of zero", () => {
    expect(serviceSchema.safeParse({ ...valid, price_units: 0 }).success).toBe(true);
  });
});

// ── toServiceInsert ────────────────────────────────────────────────────────────
describe("toServiceInsert", () => {
  it("converts price_units to price_cents correctly", () => {
    const values = { name: "Hot Towel Shave", category: "beard" as const, duration_min: 45, price_units: 499, is_active: true };
    const result = toServiceInsert(values, "shop-123");
    expect(result.price_cents).toBe(49900);
    expect(result.shop_id).toBe("shop-123");
  });

  it("rounds fractional prices correctly", () => {
    const values = { name: "Trim", category: "hair" as const, duration_min: 20, price_units: 99.9, is_active: true };
    expect(toServiceInsert(values, "shop-1").price_cents).toBe(9990);
  });

  it("converts null description correctly", () => {
    const values = { name: "Trim", category: "hair" as const, duration_min: 20, price_units: 100, is_active: true };
    expect(toServiceInsert(values, "shop-1").description).toBeNull();
  });
});

// ── availabilitySchema ─────────────────────────────────────────────────────────
describe("availabilitySchema", () => {
  function makeDay(overrides = {}) {
    return { day_of_week: 1, is_open: true, opens_at: "09:00", closes_at: "18:00", ...overrides };
  }
  function makeWeek(dayOverride = {}) {
    return { days: Array.from({ length: 7 }, (_, i) => makeDay({ day_of_week: i, ...dayOverride })) };
  }

  it("accepts a valid weekly schedule", () => {
    expect(availabilitySchema.safeParse(makeWeek()).success).toBe(true);
  });

  it("rejects when closes_at <= opens_at for an open day", () => {
    expect(availabilitySchema.safeParse(makeWeek({ opens_at: "18:00", closes_at: "09:00" })).success).toBe(false);
  });

  it("rejects when closes_at === opens_at for an open day", () => {
    expect(availabilitySchema.safeParse(makeWeek({ opens_at: "09:00", closes_at: "09:00" })).success).toBe(false);
  });

  it("accepts time conflict when day is closed", () => {
    expect(availabilitySchema.safeParse(makeWeek({ is_open: false, opens_at: "18:00", closes_at: "09:00" })).success).toBe(true);
  });

  it("rejects schedule with fewer than 7 days", () => {
    expect(availabilitySchema.safeParse({ days: [makeDay()] }).success).toBe(false);
  });
});

// ── blockedPeriodSchema ────────────────────────────────────────────────────────
describe("blockedPeriodSchema", () => {
  const s = "2030-01-01T09:00";
  const e = "2030-01-01T18:00";
  const before = "2030-01-01T08:00";

  it("accepts valid blocked period", () => {
    expect(blockedPeriodSchema.safeParse({ starts_at: s, ends_at: e }).success).toBe(true);
  });

  it("rejects when ends_at <= starts_at", () => {
    const r = blockedPeriodSchema.safeParse({ starts_at: s, ends_at: before });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("ends_at");
  });

  it("rejects equal starts_at and ends_at", () => {
    expect(blockedPeriodSchema.safeParse({ starts_at: s, ends_at: s }).success).toBe(false);
  });

  it("accepts optional label", () => {
    expect(blockedPeriodSchema.safeParse({ starts_at: s, ends_at: e, label: "Diwali Holiday" }).success).toBe(true);
  });
});

// ── rescheduleSchema ───────────────────────────────────────────────────────────
describe("rescheduleSchema", () => {
  it("accepts a future datetime", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(rescheduleSchema.safeParse({ starts_at: future }).success).toBe(true);
  });

  it("rejects a past datetime", () => {
    const r = rescheduleSchema.safeParse({ starts_at: "2020-01-01T10:00" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toMatch(/future/i);
    }
  });

  it("rejects empty string", () => {
    expect(rescheduleSchema.safeParse({ starts_at: "" }).success).toBe(false);
  });
});
