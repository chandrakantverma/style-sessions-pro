import { z } from "zod";

export const CATEGORY_VALUES = ["hair", "beard", "grooming", "combo"] as const;

// ── Shop profile / onboarding ─────────────────────────────────────────────────
export const shopProfileSchema = z.object({
  name: z.string().trim().min(1, "Shop name is required"),
  tagline: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});
export type ShopProfileValues = z.infer<typeof shopProfileSchema>;

// ── Service form ──────────────────────────────────────────────────────────────
export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  category: z.enum(CATEGORY_VALUES, { required_error: "Category is required" }),
  duration_min: z
    .number({ invalid_type_error: "Duration must be a number" })
    .int()
    .min(5, "Minimum 5 minutes")
    .max(480, "Maximum 480 minutes"),
  price_units: z
    .number({ invalid_type_error: "Price must be a number" })
    .nonnegative("Price cannot be negative"),
  is_active: z.boolean(),
});
export type ServiceFormValues = z.infer<typeof serviceSchema>;

export function toServiceInsert(values: ServiceFormValues, shopId: string) {
  return {
    shop_id: shopId,
    name: values.name,
    description: values.description ?? null,
    category: values.category,
    duration_min: values.duration_min,
    price_cents: Math.round(values.price_units * 100),
    is_active: values.is_active,
  };
}

// ── Availability form ─────────────────────────────────────────────────────────
const daySchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    is_open: z.boolean(),
    opens_at: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm format"),
    closes_at: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm format"),
  })
  .refine((d) => !d.is_open || d.closes_at > d.opens_at, {
    message: "Closing time must be after opening time",
    path: ["closes_at"],
  });

export const availabilitySchema = z.object({
  days: z.array(daySchema).length(7),
});
export type AvailabilityValues = z.infer<typeof availabilitySchema>;

// ── Blocked period form ───────────────────────────────────────────────────────
export const blockedPeriodSchema = z
  .object({
    starts_at: z.string().min(1, "Start date/time is required"),
    ends_at: z.string().min(1, "End date/time is required"),
    label: z.string().optional(),
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    message: "End must be after start",
    path: ["ends_at"],
  });
export type BlockedPeriodValues = z.infer<typeof blockedPeriodSchema>;

// ── Reschedule form ───────────────────────────────────────────────────────────
export const rescheduleSchema = z.object({
  starts_at: z.string().min(1, "Date/time is required").refine(
    (v) => !isNaN(new Date(v).getTime()) && new Date(v) > new Date(),
    { message: "Appointment must be in the future" }
  ),
});
export type RescheduleValues = z.infer<typeof rescheduleSchema>;
