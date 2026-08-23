import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOwnerShop } from "@/hooks/useOwnerShop";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard/bookings")({
  component: BookingsPage,
});

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function BookingsPage() {
  const { shop } = useOwnerShop();
  const [tab, setTab] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: bookings, isLoading } = useQuery({
    enabled: !!shop,
    queryKey: ["bookings", shop?.id, fromDate, toDate],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select(
          "id, customer_name, starts_at, status, notes, services(name, price_cents, duration_min, category)",
        )
        .eq("shop_id", shop!.id)
        .order("starts_at", { ascending: true });

      if (fromDate) query = query.gte("starts_at", new Date(fromDate).toISOString());
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("starts_at", end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtered =
    tab === "all" ? bookings : bookings?.filter((b) => b.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <p className="overline">Dashboard</p>
        <h1 className="mt-1 text-4xl">Bookings</h1>
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="from-date" className="text-xs">
            From
          </Label>
          <Input
            id="from-date"
            type="date"
            className="mt-1 w-40"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="to-date" className="text-xs">
            To
          </Label>
          <Input
            id="to-date"
            type="date"
            className="mt-1 w-40"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        {(fromDate || toDate) && (
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Status tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {STATUS_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
              {value !== "all" && bookings && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                  {bookings.filter((b) => b.status === value).length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map(({ value }) => (
          <TabsContent key={value} value={value} className="mt-4 space-y-3">
            {isLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)
            ) : !filtered?.length ? (
              <div className="panel rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground">No bookings found.</p>
              </div>
            ) : (
              filtered.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking as Parameters<typeof BookingCard>[0]["booking"]}
                  shopId={shop!.id}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
