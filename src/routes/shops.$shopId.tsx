import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, CATEGORY_LABELS } from "@/lib/format";

export const Route = createFileRoute("/shops/$shopId")({
  head: () => ({
    meta: [
      { title: "Book a Chair — Bladeroom" },
      {
        name: "description",
        content:
          "See this barbershop's hairstyle, beard and men's grooming menu with prices and durations, then book your slot.",
      },
      { property: "og:title", content: "Book a Chair — Bladeroom" },
      {
        property: "og:description",
        content: "Barbershop menu, prices and instant booking on Bladeroom.",
      },
    ],
  }),
  component: ShopDetail,
});

const SLOTS = ["10:00", "11:00", "12:00", "14:00", "15:30", "17:00", "18:30", "20:00"];

function ShopDetail() {
  const { shopId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState(SLOTS[0]!);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, tagline, city, address, phone")
        .eq("id", shopId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["services", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, category, duration_min, price_cents")
        .eq("shop_id", shopId)
        .eq("is_active", true)
        .order("category", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const booking = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not-signed-in");
      if (!serviceId) throw new Error("Pick a service first.");
      const startsAt = new Date(`${date}T${slot}:00`).toISOString();
      const { error } = await supabase.from("bookings").insert({
        shop_id: shopId,
        service_id: serviceId,
        customer_id: user.id,
        customer_name: name || null,
        customer_phone: phone || null,
        starts_at: startsAt,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chair booked", { description: "Track it under My bookings." });
      void navigate({ to: "/my-bookings" });
    },
    onError: (error: Error) => {
      if (error.message === "not-signed-in") {
        toast.error("Sign in to book", { description: "Takes 20 seconds." });
        void navigate({ to: "/auth" });
        return;
      }
      toast.error(error.message);
    },
  });

  const selected = services?.find((s) => s.id === serviceId);
  const grouped = (services ?? []).reduce<Record<string, typeof services>>((acc, service) => {
    const key = service.category;
    acc[key] = [...(acc[key] ?? []), service] as typeof services;
    return acc;
  }, {});

  if (shopLoading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16">
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h1 className="text-4xl">Shop not found</h1>
        <Button asChild className="mt-6">
          <Link to="/shops">Back to shops</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Link
        to="/shops"
        className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
      >
        ← All shops
      </Link>
      <h1 className="mt-6 text-5xl sm:text-6xl">{shop.name}</h1>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">{shop.tagline}</p>
      <div className="mt-5 flex flex-wrap gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <MapPin className="size-3.5 text-primary" />
          {shop.address}, {shop.city}
        </span>
        {shop.phone && (
          <span className="flex items-center gap-2">
            <Phone className="size-3.5 text-primary" />
            {shop.phone}
          </span>
        )}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          {Object.entries(grouped).map(([category, list]) => (
            <section key={category}>
              <p className="overline">{CATEGORY_LABELS[category] ?? category}</p>
              <div className="mt-4 divide-y divide-border border-y border-border">
                {list?.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setServiceId(service.id)}
                    className={`flex w-full items-start justify-between gap-4 px-1 py-4 text-left transition-colors hover:bg-card ${
                      serviceId === service.id ? "bg-card" : ""
                    }`}
                  >
                    <span>
                      <span className="block text-base font-bold">{service.name}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {service.description}
                      </span>
                      <span className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {service.duration_min} min
                      </span>
                    </span>
                    <span className="display shrink-0 text-2xl text-primary">
                      {formatPrice(service.price_cents)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="panel h-fit rounded-lg p-6 lg:sticky lg:top-24">
          <p className="overline">Book</p>
          <h2 className="mt-2 text-3xl">Your slot</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {selected ? `${selected.name} · ${formatPrice(selected.price_cents)}` : "Pick a service from the menu."}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Time</Label>
              <div className="mt-1.5 grid grid-cols-4 gap-2">
                {SLOTS.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSlot(time)}
                    className={`rounded border px-2 py-2 text-xs font-bold transition-colors ${
                      slot === time
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/60"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="For reminders"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes for the barber</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Number 1 on the sides, keep the length on top."
                className="mt-1.5"
              />
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!serviceId || booking.isPending}
              onClick={() => booking.mutate()}
            >
              {booking.isPending ? "Booking…" : "Confirm booking"}
            </Button>
            {!user && (
              <p className="text-center text-xs text-muted-foreground">
                You&apos;ll be asked to sign in first.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
