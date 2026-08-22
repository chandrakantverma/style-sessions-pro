import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/shops/")({
  head: () => ({
    meta: [
      { title: "Barbershops Taking Bookings — Bladeroom" },
      {
        name: "description",
        content:
          "Browse men's barbershops on Bladeroom, see their hairstyle and grooming menus with real prices, and book a chair in seconds.",
      },
      { property: "og:title", content: "Barbershops Taking Bookings — Bladeroom" },
      {
        property: "og:description",
        content: "Find a men's barbershop and book your chair on Bladeroom.",
      },
    ],
  }),
  component: ShopsPage,
});

function ShopsPage() {
  const { data: shops, isLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, tagline, city, address, phone")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="overline">Shops</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">Chairs taking bookings</h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        Men-only barbershops with published menus. Pick one to see services, prices and open
        slots.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-lg" />)}

        {shops?.map((shop) => (
          <Link
            key={shop.id}
            to="/shops/$shopId"
            params={{ shopId: shop.id }}
            className="panel group flex flex-col justify-between rounded-lg p-6 transition-colors hover:border-primary/60"
          >
            <div>
              <h2 className="text-3xl">{shop.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{shop.tagline}</p>
            </div>
            <div className="mt-6 space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="size-3.5 text-primary" />
                {shop.address}, {shop.city}
              </p>
              {shop.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 text-primary" />
                  {shop.phone}
                </p>
              )}
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              View menu <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        ))}

        {!isLoading && shops?.length === 0 && (
          <p className="text-sm text-muted-foreground">No shops published yet.</p>
        )}
      </div>
    </div>
  );
}
