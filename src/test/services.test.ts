import { describe, it, expect } from "vitest";
import { CATEGORY_LABELS } from "@/lib/format";
import { toServiceInsert, CATEGORY_VALUES } from "@/components/dashboard/schemas";

type Service = {
  id: string;
  name: string;
  category: string;
  price_cents: number;
  duration_min: number;
  is_active: boolean;
  description: string | null;
  shop_id: string;
  created_at: string;
};

function groupByCategory(services: Service[]): Record<string, Service[]> {
  return services.reduce<Record<string, Service[]>>((acc, svc) => {
    acc[svc.category] = [...(acc[svc.category] ?? []), svc];
    return acc;
  }, {});
}

const SERVICES: Service[] = [
  { id: "1", name: "Skin Fade",      category: "hair",     price_cents: 29900, duration_min: 30, is_active: true,  description: null, shop_id: "s1", created_at: "" },
  { id: "2", name: "Textured Crop",  category: "hair",     price_cents: 24900, duration_min: 25, is_active: true,  description: null, shop_id: "s1", created_at: "" },
  { id: "3", name: "Beard Sculpt",   category: "beard",    price_cents: 19900, duration_min: 20, is_active: true,  description: null, shop_id: "s1", created_at: "" },
  { id: "4", name: "Charcoal Facial",category: "grooming", price_cents: 49900, duration_min: 45, is_active: false, description: null, shop_id: "s1", created_at: "" },
  { id: "5", name: "Fade + Beard",   category: "combo",    price_cents: 44900, duration_min: 50, is_active: true,  description: null, shop_id: "s1", created_at: "" },
];

describe("groupByCategory", () => {
  it("groups services correctly by category", () => {
    const grouped = groupByCategory(SERVICES);
    expect(grouped["hair"]).toHaveLength(2);
    expect(grouped["beard"]).toHaveLength(1);
    expect(grouped["grooming"]).toHaveLength(1);
    expect(grouped["combo"]).toHaveLength(1);
  });

  it("every service appears under its own category only", () => {
    const grouped = groupByCategory(SERVICES);
    Object.entries(grouped).forEach(([cat, list]) => {
      list.forEach((svc) => expect(svc.category).toBe(cat));
    });
  });

  it("no service appears in a different category group", () => {
    const grouped = groupByCategory(SERVICES);
    SERVICES.forEach((svc) => {
      expect(grouped[svc.category]?.some((g) => g.id === svc.id)).toBe(true);
    });
  });

  it("returns empty object for empty input", () => {
    expect(groupByCategory([])).toEqual({});
  });

  it("handles all services in same category", () => {
    const allHair = SERVICES.filter((s) => s.category === "hair");
    const grouped = groupByCategory(allHair);
    expect(Object.keys(grouped)).toHaveLength(1);
    expect(grouped["hair"]).toHaveLength(2);
  });
});

describe("CATEGORY_VALUES", () => {
  it("includes all four valid categories", () => {
    expect(CATEGORY_VALUES).toContain("hair");
    expect(CATEGORY_VALUES).toContain("beard");
    expect(CATEGORY_VALUES).toContain("grooming");
    expect(CATEGORY_VALUES).toContain("combo");
    expect(CATEGORY_VALUES).toHaveLength(4);
  });

  it("every CATEGORY_VALUE has a corresponding CATEGORY_LABEL", () => {
    CATEGORY_VALUES.forEach((cat) => {
      const label = CATEGORY_LABELS[cat];
      expect(label).toBeDefined();
      expect(label!.length).toBeGreaterThan(0);
    });
  });
});

describe("toServiceInsert price conversion", () => {
  it.each([
    [0, 0],
    [1, 100],
    [99, 9900],
    [499, 49900],
    [999, 99900],
    [1500, 150000],
  ])("converts ₹%i to %i paise", (units, expectedCents) => {
    const values = {
      name: "Test",
      category: "hair" as const,
      duration_min: 30,
      price_units: units,
      is_active: true,
    };
    expect(toServiceInsert(values, "shop-1").price_cents).toBe(expectedCents);
  });
});
