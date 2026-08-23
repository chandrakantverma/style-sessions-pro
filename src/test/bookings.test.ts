import { describe, it, expect } from "vitest";

type Booking = {
  id: string;
  status: string;
  starts_at: string;
  customer_name: string | null;
};

function filterByStatus(bookings: Booking[], tab: string): Booking[] {
  if (tab === "all") return bookings;
  return bookings.filter((b) => b.status === tab);
}

function filterByDateRange(bookings: Booking[], from: string, to: string): Booking[] {
  return bookings.filter((b) => {
    const t = new Date(b.starts_at).getTime();
    const fromT = from ? new Date(from).getTime() : -Infinity;
    const toEnd = to
      ? (() => {
          const d = new Date(to);
          d.setHours(23, 59, 59, 999);
          return d.getTime();
        })()
      : Infinity;
    return t >= fromT && t <= toEnd;
  });
}

function sortByStartsAt(bookings: Booking[]): Booking[] {
  return [...bookings].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
}

const BOOKINGS: Booking[] = [
  { id: "1", status: "pending",   starts_at: "2025-08-01T10:00:00Z", customer_name: "Alice" },
  { id: "2", status: "confirmed", starts_at: "2025-08-02T11:00:00Z", customer_name: "Bob" },
  { id: "3", status: "cancelled", starts_at: "2025-08-03T09:00:00Z", customer_name: "Carol" },
  { id: "4", status: "pending",   starts_at: "2025-08-04T14:00:00Z", customer_name: "Dave" },
];

describe("filterByStatus", () => {
  it("returns all bookings for tab=all", () => {
    expect(filterByStatus(BOOKINGS, "all")).toHaveLength(4);
  });

  it("returns only pending bookings", () => {
    const result = filterByStatus(BOOKINGS, "pending");
    expect(result).toHaveLength(2);
    result.forEach((b) => expect(b.status).toBe("pending"));
  });

  it("returns only confirmed bookings", () => {
    const result = filterByStatus(BOOKINGS, "confirmed");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("2");
  });

  it("returns only cancelled bookings", () => {
    const result = filterByStatus(BOOKINGS, "cancelled");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("3");
  });

  it("returns empty array for unknown status", () => {
    expect(filterByStatus(BOOKINGS, "unknown")).toHaveLength(0);
  });

  it("no booking appears under a different status tab", () => {
    ["pending", "confirmed", "cancelled"].forEach((tab) => {
      filterByStatus(BOOKINGS, tab).forEach((b) => {
        expect(b.status).toBe(tab);
      });
    });
  });
});

describe("filterByDateRange", () => {
  it("returns all bookings when no range is set", () => {
    expect(filterByDateRange(BOOKINGS, "", "")).toHaveLength(4);
  });

  it("filters by from date only", () => {
    const result = filterByDateRange(BOOKINGS, "2025-08-03", "");
    expect(result.map((b) => b.id)).toEqual(expect.arrayContaining(["3", "4"]));
    expect(result).toHaveLength(2);
  });

  it("filters by to date only", () => {
    const result = filterByDateRange(BOOKINGS, "", "2025-08-02");
    expect(result).toHaveLength(2);
    expect(result.map((b) => b.id)).toEqual(expect.arrayContaining(["1", "2"]));
  });

  it("filters by both from and to date", () => {
    const result = filterByDateRange(BOOKINGS, "2025-08-02", "2025-08-03");
    expect(result).toHaveLength(2);
    expect(result.map((b) => b.id)).toEqual(expect.arrayContaining(["2", "3"]));
  });

  it("returns empty when range excludes all bookings", () => {
    expect(filterByDateRange(BOOKINGS, "2025-09-01", "2025-09-30")).toHaveLength(0);
  });

  it("no booking outside range appears in results", () => {
    const result = filterByDateRange(BOOKINGS, "2025-08-02", "2025-08-02");
    result.forEach((b) => {
      const t = new Date(b.starts_at).getTime();
      const from = new Date("2025-08-02").getTime();
      const to = new Date("2025-08-02T23:59:59.999Z").getTime();
      expect(t).toBeGreaterThanOrEqual(from);
      expect(t).toBeLessThanOrEqual(to);
    });
  });
});

describe("sortByStartsAt", () => {
  it("returns bookings in ascending order", () => {
    const shuffled = [BOOKINGS[2], BOOKINGS[0], BOOKINGS[3], BOOKINGS[1]].filter(Boolean) as Booking[];
    const sorted = sortByStartsAt(shuffled);
    for (let i = 1; i < sorted.length; i++) {
      expect(new Date(sorted[i]!.starts_at).getTime()).toBeGreaterThanOrEqual(
        new Date(sorted[i - 1]!.starts_at).getTime(),
      );
    }
  });

  it("does not mutate the original array", () => {
    const original = [...BOOKINGS];
    sortByStartsAt(BOOKINGS);
    expect(BOOKINGS).toEqual(original);
  });

  it("handles single booking", () => {
    const single = BOOKINGS[0];
    expect(sortByStartsAt(single ? [single] : [])).toHaveLength(1);
  });

  it("handles empty array", () => {
    expect(sortByStartsAt([])).toHaveLength(0);
  });
});
