import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { blockedPeriodSchema, type BlockedPeriodValues } from "./schemas";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

type Props = { shopId: string };

export function BlockedPeriodList({ shopId }: Props) {
  const queryClient = useQueryClient();

  const { data: periods, isLoading } = useQuery({
    queryKey: ["blocked-periods", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_periods")
        .select("*")
        .eq("shop_id", shopId)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<BlockedPeriodValues>({
    resolver: zodResolver(blockedPeriodSchema),
    defaultValues: { starts_at: "", ends_at: "", label: "" },
  });

  const add = useMutation({
    mutationFn: async (values: BlockedPeriodValues) => {
      const { error } = await supabase.from("blocked_periods").insert({
        shop_id: shopId,
        starts_at: new Date(values.starts_at).toISOString(),
        ends_at: new Date(values.ends_at).toISOString(),
        label: values.label || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Blocked period added");
      void queryClient.invalidateQueries({ queryKey: ["blocked-periods", shopId] });
      form.reset({ starts_at: "", ends_at: "", label: "" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Blocked period removed");
      void queryClient.invalidateQueries({ queryKey: ["blocked-periods", shopId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-foreground">Blocked periods</h3>

      {/* Existing periods */}
      {isLoading ? (
        <Skeleton className="h-16 rounded-md" />
      ) : periods?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No blocked periods set.</p>
      ) : (
        <ul className="space-y-2">
          {periods?.map((period) => (
            <li
              key={period.id}
              className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {period.label ?? "Blocked"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(period.starts_at)} → {formatDateTime(period.ends_at)}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    aria-label="Delete blocked period"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove blocked period?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will allow customers to book slots in this time range again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => remove.mutate(period.id)}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      <form
        onSubmit={form.handleSubmit((v) => add.mutate(v))}
        className="panel rounded-lg p-4 space-y-3"
      >
        <p className="text-sm font-medium text-foreground">Add blocked period</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="bp-start">Start</Label>
            <Input
              id="bp-start"
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
          <div>
            <Label htmlFor="bp-end">End</Label>
            <Input
              id="bp-end"
              type="datetime-local"
              className="mt-1.5"
              {...form.register("ends_at")}
            />
            {form.formState.errors.ends_at && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.ends_at.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="bp-label">Label (optional)</Label>
          <Input
            id="bp-label"
            placeholder="e.g. Holiday, Personal leave"
            className="mt-1.5"
            {...form.register("label")}
          />
        </div>
        <Button type="submit" size="sm" disabled={add.isPending} className="gap-2">
          <PlusCircle className="size-4" />
          {add.isPending ? "Adding…" : "Add blocked period"}
        </Button>
      </form>
    </div>
  );
}
