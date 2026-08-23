import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { rescheduleSchema, type RescheduleValues } from "./schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  shopId: string;
};

export function RescheduleModal({ open, onOpenChange, bookingId, shopId }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<RescheduleValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: { starts_at: "" },
  });

  const reschedule = useMutation({
    mutationFn: async (values: RescheduleValues) => {
      const { error } = await supabase
        .from("bookings")
        .update({ starts_at: new Date(values.starts_at).toISOString() })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking rescheduled");
      void queryClient.invalidateQueries({ queryKey: ["bookings", shopId] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reschedule booking</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => reschedule.mutate(v))}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="reschedule-dt">New date & time</Label>
            <Input
              id="reschedule-dt"
              type="datetime-local"
              className="mt-1.5"
              {...form.register("starts_at")}
            />
            {form.formState.errors.starts_at && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.starts_at.message}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={reschedule.isPending}>
              {reschedule.isPending ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
