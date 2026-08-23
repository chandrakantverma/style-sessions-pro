import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatPrice, CATEGORY_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RescheduleModal } from "./RescheduleModal";

type Booking = {
  id: string;
  customer_name: string | null;
  starts_at: string;
  status: string;
  notes: string | null;
  services: {
    name: string;
    price_cents: number;
    duration_min: number;
    category: string;
  } | null;
};

type Props = {
  booking: Booking;
  shopId: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function BookingCard({ booking, shopId }: Props) {
  const queryClient = useQueryClient();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", booking.id);
      if (error) throw error;
    },
    onSuccess: (_data, status) => {
      toast.success(status === "confirmed" ? "Booking confirmed" : "Booking cancelled");
      void queryClient.invalidateQueries({ queryKey: ["bookings", shopId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const service = booking.services;

  return (
    <>
      <div className="panel flex flex-wrap items-start justify-between gap-4 rounded-lg p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-foreground">
              {booking.customer_name ?? "Customer"}
            </p>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.15em] ${
                STATUS_COLORS[booking.status] ?? STATUS_COLORS["cancelled"]
              }`}
            >
              {booking.status}
            </span>
          </div>
          {service && (
            <p className="mt-1 text-sm text-muted-foreground">
              {service.name} ·{" "}
              {CATEGORY_LABELS[service.category] ?? service.category} ·{" "}
              {service.duration_min} min · {formatPrice(service.price_cents)}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(booking.starts_at)}
          </p>
          {booking.notes && (
            <p className="mt-1.5 text-xs italic text-muted-foreground">
              "{booking.notes}"
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {booking.status === "pending" && (
            <Button
              size="sm"
              onClick={() => updateStatus.mutate("confirmed")}
              disabled={updateStatus.isPending}
              className="gap-1.5"
            >
              <Check className="size-3.5" />
              Approve
            </Button>
          )}
          {booking.status !== "cancelled" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRescheduleOpen(true)}
                className="gap-1.5"
              >
                <CalendarClock className="size-3.5" />
                Reschedule
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus.mutate("cancelled")}
                disabled={updateStatus.isPending}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <X className="size-3.5" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <RescheduleModal
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        bookingId={booking.id}
        shopId={shopId}
      />
    </>
  );
}
