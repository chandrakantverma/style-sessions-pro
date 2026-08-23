import { describe, it, expect } from "vitest";

// ── Availability time ordering (mirrors AvailabilitySection logic) ─────────────

type DayRule = {
  day_of_week: number;
  is_open: boolean;
  opens_at: string;
  closes_at: string;
};

function isValidDayRule(day: DayRule): boolean {
  if (!day.is_open) return true; // closed days skip time validation
  return day.closes_at > day.opens_at;
}

function isValidSchedule(days: DayRule[]): boolean {
  return days.every(isValidDayRule);
}

// ── Build default 7-day schedule ──────────────────────────────────────────────
function makeSchedule(overrides: Partial<DayRule>[] = []): DayRule[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    is_open: i !== 0, // closed Sunday
    opens_at: "09:00",
    closes_at: "18:00",
    ...(overrides[i] ?? {}),
  }));
}

describe("isValidDayRule", () => {
  it("accepts an open day with closes_at > opens_at", () => {
    expect(isValidDayRule({ day_of_week: 1, is_open: true, opens_at: "09:00", closes_at: "18:00" })).toBe(true);
  });

  it("rejects an open day with closes_at === opens_at", () => {
    expect(isValidDayRule({ day_of_week: 1, is_open: true, opens_at: "09:00", closes_at: "09:00" })).toBe(false);
  });

  it("rejects an open day with closes_at < opens_at", () => {
    expect(isValidDayRule({ day_of_week: 1, is_open: true, opens_at: "18:00", closes_at: "09:00" })).toBe(false);
  });

  it("accepts a closed day regardless of times", () => {
    expect(isValidDayRule({ day_of_week: 0, is_open: false, opens_at: "18:00", closes_at: "09:00" })).toBe(true);
  });

  it("accepts midnight boundary (00:00 to 23:59)", () => {
    expect(isValidDayRule({ day_of_week: 2, is_open: true, opens_at: "00:00", closes_at: "23:59" })).toBe(true);
  });
});

describe("isValidSchedule", () => {
  it("accepts a valid 7-day schedule", () => {
    expect(isValidSchedule(makeSchedule())).toBe(true);
  });

  it("rejects a schedule where one day has invalid times", () => {
    const schedule = makeSchedule([
      {}, {}, {}, {},
      { day_of_week: 4, is_open: true, opens_at: "20:00", closes_at: "08:00" },
      {}, {},
    ]);
    expect(isValidSchedule(schedule)).toBe(false);
  });

  it("accepts a schedule where all days are closed", () => {
    const allClosed = makeSchedule(Array(7).fill({ is_open: false, opens_at: "20:00", closes_at: "08:00" }));
    expect(isValidSchedule(allClosed)).toBe(true);
  });

  it("a closed day with bad times does not fail the whole schedule", () => {
    const schedule = makeSchedule([{ is_open: false, opens_at: "23:00", closes_at: "01:00" }]);
    expect(isValidSchedule(schedule)).toBe(true);
  });
});

// ── Blocked period validation ──────────────────────────────────────────────────

function isValidBlockedPeriod(starts: string, ends: string): boolean {
  return new Date(ends) > new Date(starts);
}

describe("isValidBlockedPeriod", () => {
  it("accepts end after start", () => {
    expect(isValidBlockedPeriod("2025-12-24T09:00", "2025-12-26T18:00")).toBe(true);
  });

  it("rejects end equal to start", () => {
    expect(isValidBlockedPeriod("2025-12-24T09:00", "2025-12-24T09:00")).toBe(false);
  });

  it("rejects end before start", () => {
    expect(isValidBlockedPeriod("2025-12-26T18:00", "2025-12-24T09:00")).toBe(false);
  });

  it("accepts a 1-minute range", () => {
    expect(isValidBlockedPeriod("2025-12-24T09:00", "2025-12-24T09:01")).toBe(true);
  });
});
