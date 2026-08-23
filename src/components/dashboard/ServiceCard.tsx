import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, CATEGORY_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

type Props = {
  service: Service;
  shopId: string;
  onEdit: (service: Service) => void;
};

export function ServiceCard({ service, shopId, onEdit }: Props) {
  const queryClient = useQueryClient();

  const toggleActive = useMutation({
    mutationFn: async (is_active: boolean) => {
      const { error } = await supabase
        .from("services")
        .update({ is_active })
        .eq("id", service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services", shopId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteService = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service deleted");
      void queryClient.invalidateQueries({ queryKey: ["services", shopId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{service.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {CATEGORY_LABELS[service.category] ?? service.category} ·{" "}
          {service.duration_min} min · {formatPrice(service.price_cents)}
        </p>
        {service.description && (
          <p className="mt-1 text-xs text-muted-foreground">{service.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={service.is_active}
          onCheckedChange={(v) => toggleActive.mutate(v)}
          aria-label={service.is_active ? "Active" : "Inactive"}
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onEdit(service)}
          aria-label="Edit service"
        >
          <Pencil className="size-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              aria-label="Delete service"
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{service.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the service from your menu. Existing
                bookings that reference it will show it as removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteService.mutate()}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
