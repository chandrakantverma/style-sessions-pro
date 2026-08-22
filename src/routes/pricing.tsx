import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Barbershop Owner Plans — Bladeroom" },
      {
        name: "description",
        content:
          "One monthly subscription for barbershop owners: unlimited bookings, themed service menus and a live appointment dashboard. Two weeks free.",
      },
      { property: "og:title", content: "Barbershop Owner Plans — Bladeroom" },
      {
        property: "og:description",
        content: "Run your barbershop book on a simple monthly plan.",
      },
    ],
  }),
  component: PricingPage,
});

const PLANS = [
  {
    name: "Chair",
    price: "₹499",
    cadence: "per month",
    blurb: "For a single-chair shop finding its rhythm.",
    features: [
      "One published shop page",
      "Up to 15 services",
      "Unlimited bookings",
      "Appointment dashboard",
    ],
    featured: false,
  },
  {
    name: "Shopfront",
    price: "₹999",
    cadence: "per month",
    blurb: "For busy shops running a full themed menu.",
    features: [
      "Everything in Chair",
      "Unlimited services",
      "Themed hairstyle & beauty menus",
      "Customer notes and history",
      "Priority listing in search",
    ],
    featured: true,
  },
];

function PricingPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="overline">For owners</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">One plan, whole book</h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        Bladeroom charges shop owners a flat monthly subscription. Customers never pay a booking
        fee. Start with a 14-day trial and cancel any time from your dashboard.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className="panel relative rounded-lg p-8"
            style={plan.featured ? { boxShadow: "var(--shadow-ember)" } : undefined}
          >
            {plan.featured && (
              <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground">
                Most shops
              </span>
            )}
            <h2 className="text-3xl">{plan.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{plan.blurb}</p>
            <p className="mt-6 flex items-end gap-2">
              <span className="display text-5xl text-primary">{plan.price}</span>
              <span className="pb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {plan.cadence}
              </span>
            </p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-8 w-full"
              variant={plan.featured ? "default" : "outline"}
            >
              <Link to={user ? "/my-bookings" : "/auth"} search={{ mode: "owner" } as never}>
                Start 14-day trial
              </Link>
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Card billing isn&apos;t connected yet — trials and plan changes are tracked in your
        dashboard so you can wire up a payment provider whenever you&apos;re ready.
      </p>
    </div>
  );
}
