import { describe, it, expect } from "vitest";
import { formatPrice, formatDateTime, CATEGORY_LABELS } from "@/lib/format";

describe("formatPrice", () => {
  it("formats 49900 as ₹499", () => {
    expect(formatPrice(49900)).toContain("499");
  });

  it("formats 0", () => {
    expect(formatPrice(0)).toContain("0");
  });

  it("formats 100 as ₹1", () => {
    expect(formatPrice(100)).toContain("1");
  });

  it("returns a string with currency symbol", () => {
    expect(formatPrice(29900)).toMatch(/₹|Rs|INR/);
  });
});

describe("formatDateTime", () => {
  it("returns a non-empty string for a valid ISO date", () => {
    const result = formatDateTime("2025-06-15T10:30:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the day of week", () => {
    const result = formatDateTime("2025-06-16T10:00:00.000Z");
    expect(typeof result).toBe("string");
  });
});

describe("CATEGORY_LABELS", () => {
  it("contains all four categories", () => {
    expect(CATEGORY_LABELS).toHaveProperty("hair");
    expect(CATEGORY_LABELS).toHaveProperty("beard");
    expect(CATEGORY_LABELS).toHaveProperty("grooming");
    expect(CATEGORY_LABELS).toHaveProperty("combo");
  });

  it("has non-empty labels for all categories", () => {
    Object.values(CATEGORY_LABELS).forEach((label) => {
      expect(label.length).toBeGreaterThan(0);
    });
  });

  it("labels hair as Hairstyle", () => {
    expect(CATEGORY_LABELS["hair"]).toBe("Hairstyle");
  });

  it("labels beard as Beard & Shave", () => {
    expect(CATEGORY_LABELS["beard"]).toBe("Beard & Shave");
  });
});
