import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  serviceSchema,
  CATEGORY_VALUES,
  toServiceInsert,
  type ServiceFormValues,
} from "./schemas";
import { CATEGORY_LABELS } from "@/lib/format";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  editService?: Service | null;
};

export function ServiceFormDialog({ open, onOpenChange, shopId, editService }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!editService;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "hair",
      duration_min: 30,
      price_units: 0,
      is_active: true,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editService) {
      form.reset({
        name: editService.name,
        description: editService.description ?? "",
        category: editService.category as (typeof CATEGORY_VALUES)[number],
        duration_min: editService.duration_min,
        price_units: editService.price_cents / 100,
        is_active: editService.is_active,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        category: "hair",
        duration_min: 30,
        price_units: 0,
        is_active: true,
      });
    }
  }, [editService, open, form]);

  const save = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      const payload = toServiceInsert(values, shopId);
      if (isEdit) {
        const { error } = await supabase
          .from("services")
          .update(payload)
          .eq("id", editService!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Service updated" : "Service added");
      void queryClient.invalidateQueries({ queryKey: ["services", shopId] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit service" : "Add service"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="svc-name">Name *</Label>
            <Input id="svc-name" className="mt-1.5" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="svc-desc">Description</Label>
            <Textarea
              id="svc-desc"
              className="mt-1.5"
              rows={2}
              {...form.register("description")}
            />
          </div>

          <div>
            <Label>Category *</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(v) =>
                form.setValue("category", v as (typeof CATEGORY_VALUES)[number], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_VALUES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] ?? cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="svc-dur">Duration (min) *</Label>
              <Input
                id="svc-dur"
                type="number"
                min={5}
                max={480}
                className="mt-1.5"
                {...form.register("duration_min", { valueAsNumber: true })}
              />
              {form.formState.errors.duration_min && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.duration_min.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="svc-price">Price (₹) *</Label>
              <Input
                id="svc-price"
                type="number"
                min={0}
                step={1}
                className="mt-1.5"
                {...form.register("price_units", { valueAsNumber: true })}
              />
              {form.formState.errors.price_units && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.price_units.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="svc-active"
              checked={form.watch("is_active")}
              onCheckedChange={(v) => form.setValue("is_active", v)}
            />
            <Label htmlFor="svc-active">Active (visible to customers)</Label>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Add service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
