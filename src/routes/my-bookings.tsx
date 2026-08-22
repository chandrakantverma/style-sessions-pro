import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/my-bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — Bladeroom" },
      {
        name: "description",
        content: "Review, track and cancel your barbershop appointments booked through Bladeroom.",
      },
      { property: "og:title", content: "My Bookings — Bladeroom" },
      { property: "og:description", content: "Your upcoming barbershop appointments." },
    ],
  }),
  component: MyBookings,
});

function MyBookings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: bookings, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, starts_at, status, notes, shops(name, city), services(name, price_cents, duration_min)",
        )
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking cancelled");
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <p className="overline">Your chair</p>
      <h1 className="mt-3 text-5xl">My bookings</h1>

      <div className="mt-10 space-y-4">
        {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}

        {bookings?.map((booking) => (
          <div
            key={booking.id}
            className="panel flex flex-wrap items-start justify-between gap-4 rounded-lg p-6"
          >
            <div>
              <p className="overline">{booking.shops?.name}</p>
              <h2 className="mt-1 text-2xl">{booking.services?.name ?? "Service removed"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDateTime(booking.starts_at)} · {booking.services?.duration_min ?? 30} min
                {booking.services ? ` · ${formatPrice(booking.services.price_cents)}` : ""}
              </p>
              {booking.notes && (
                <p className="mt-2 text-xs text-muted-foreground">“{booking.notes}”</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className="rounded-full border border-border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
                {booking.status}
              </span>
              {booking.status !== "cancelled" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancel.mutate(booking.id)}
                  disabled={cancel.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ))}

        {!isLoading && bookings?.length === 0 && (
          <div className="panel rounded-lg p-10 text-center">
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
            <Button asChild className="mt-6">
              <Link to="/shops">Find a shop</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
