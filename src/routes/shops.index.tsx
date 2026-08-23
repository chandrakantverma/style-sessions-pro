import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, ArrowRight, Search, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

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
  const [search, setSearch] = useState("");

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

  const filtered = search.trim()
    ? shops?.filter((s) =>
        [s.name, s.tagline, s.city, s.address]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : shops;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="overline">Find a shop</p>
          <h1 className="mt-3 text-5xl sm:text-6xl">Chairs taking bookings</h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Men-only barbershops with published service menus. Pick a shop to see prices,
            durations and available slots.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Count */}
      {!isLoading && filtered && (
        <p className="mt-6 text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "shop" : "shops"} found
          {search && ` for "${search}"`}
        </p>
      )}

      {/* Grid */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-56 rounded-lg" />)}

        {filtered?.map((shop) => (
          <Link
            key={shop.id}
            to="/shops/$shopId"
            params={{ shopId: shop.id }}
            className="panel group flex flex-col justify-between rounded-lg p-6 transition-all hover:border-primary/60 hover:shadow-sm"
          >
            {/* Avatar / initials */}
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Scissors className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl leading-tight">{shop.name}</h2>
                {shop.tagline && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">{shop.tagline}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="mt-5 space-y-1.5 text-xs text-muted-foreground">
              {(shop.address || shop.city) && (
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">
                    {[shop.address, shop.city].filter(Boolean).join(", ")}
                  </span>
                </p>
              )}
              {shop.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 text-primary" />
                  {shop.phone}
                </p>
              )}
            </div>

            {/* CTA */}
            <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              View menu & book
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        ))}

        {!isLoading && filtered?.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-border p-12 text-center">
            <Scissors className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-4 text-sm font-medium text-foreground">
              {search ? `No shops match "${search}"` : "No shops published yet."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
