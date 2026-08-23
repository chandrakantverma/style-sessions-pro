import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOwnerShop } from "@/hooks/useOwnerShop";
import { availabilitySchema, type AvailabilityValues } from "@/components/dashboard/schemas";
import { AvailabilityRow } from "@/components/dashboard/AvailabilityRow";
import { BlockedPeriodList } from "@/components/dashboard/BlockedPeriodList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/dashboard/availability")({
  component: AvailabilityPage,
});

// Default 7-day schedule (0=Sun … 6=Sat)
function defaultDays(): AvailabilityValues["days"] {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    is_open: i !== 0, // closed on Sunday by default
    opens_at: "09:00",
    closes_at: "18:00",
  }));
}

function AvailabilityPage() {
  const { shop } = useOwnerShop();
  const queryClient = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    enabled: !!shop,
    queryKey: ["shop-availability", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_availability")
        .select("*")
        .eq("shop_id", shop!.id)
        .order("day_of_week");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<AvailabilityValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: { days: defaultDays() },
  });

  // Populate form from DB data
  useEffect(() => {
    if (!existing) return;
    const days = defaultDays();
    for (const row of existing) {
      days[row.day_of_week] = {
        day_of_week: row.day_of_week,
        is_open: row.is_open,
        opens_at: row.opens_at.slice(0, 5), // "HH:mm:ss" → "HH:mm"
        closes_at: row.closes_at.slice(0, 5),
      };
    }
    form.reset({ days });
  }, [existing, form]);

  const save = useMutation({
    mutationFn: async (values: AvailabilityValues) => {
      const rows = values.days.map((d) => ({
        shop_id: shop!.id,
        day_of_week: d.day_of_week,
        is_open: d.is_open,
        opens_at: d.opens_at,
        closes_at: d.closes_at,
      }));
      const { error } = await supabase
        .from("shop_availability")
        .upsert(rows, { onConflict: "shop_id,day_of_week" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Availability saved");
      void queryClient.invalidateQueries({ queryKey: ["shop-availability", shop?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="overline">Dashboard</p>
        <h1 className="mt-1 text-4xl">Availability</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set your regular weekly hours and block specific dates.
        </p>
      </div>

      {/* Weekly schedule */}
      <div className="panel rounded-lg p-6 space-y-4">
        <h2 className="text-base font-bold text-foreground">Weekly schedule</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          Opens at · Closes at (per day)
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
            className="space-y-3"
          >
            {form.watch("days").map((_, i) => (
              <AvailabilityRow key={i} index={i} form={form} />
            ))}
            <div className="pt-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save schedule"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <Separator />

      {/* Blocked periods */}
      {shop && <BlockedPeriodList shopId={shop.id} />}
    </div>
  );
}
