import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { shopProfileSchema, type ShopProfileValues } from "./schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingCreateShop() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<ShopProfileValues>({
    resolver: zodResolver(shopProfileSchema),
    defaultValues: { name: "", tagline: "", city: "", address: "", phone: "" },
  });

  const create = useMutation({
    mutationFn: async (values: ShopProfileValues) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("shops").insert({
        owner_id: user.id,
        name: values.name,
        tagline: values.tagline || null,
        city: values.city || null,
        address: values.address || null,
        phone: values.phone || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shop created! Welcome to your dashboard.");
      void queryClient.invalidateQueries({ queryKey: ["owner-shop", user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create shop. Please try again.");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-20">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
            <Store className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl">Set up your shop</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell customers about your barbershop.
            </p>
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit((v) => create.mutate(v))}
          className="panel space-y-4 rounded-lg p-6"
        >
          <div>
            <Label htmlFor="onb-name">Shop name *</Label>
            <Input id="onb-name" className="mt-1.5" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="onb-tagline">Tagline</Label>
            <Input
              id="onb-tagline"
              className="mt-1.5"
              placeholder="Sharp cuts. Zero waiting room."
              {...form.register("tagline")}
            />
          </div>
          <div>
            <Label htmlFor="onb-city">City</Label>
            <Input id="onb-city" className="mt-1.5" {...form.register("city")} />
          </div>
          <div>
            <Label htmlFor="onb-address">Address</Label>
            <Input id="onb-address" className="mt-1.5" {...form.register("address")} />
          </div>
          <div>
            <Label htmlFor="onb-phone">Phone</Label>
            <Input id="onb-phone" className="mt-1.5" {...form.register("phone")} />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create shop"}
          </Button>
        </form>
      </div>
    </div>
  );
}
