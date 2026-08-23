import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerShop } from "@/hooks/useOwnerShop";
import { shopProfileSchema, type ShopProfileValues } from "@/components/dashboard/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { shop, isLoading } = useOwnerShop();
  const queryClient = useQueryClient();

  const form = useForm<ShopProfileValues>({
    resolver: zodResolver(shopProfileSchema),
    defaultValues: { name: "", tagline: "", city: "", address: "", phone: "" },
  });

  useEffect(() => {
    if (shop) {
      form.reset({
        name: shop.name,
        tagline: shop.tagline ?? "",
        city: shop.city ?? "",
        address: shop.address ?? "",
        phone: shop.phone ?? "",
      });
    }
  }, [shop, form]);

  const save = useMutation({
    mutationFn: async (values: ShopProfileValues) => {
      const { error } = await supabase
        .from("shops")
        .update({
          name: values.name,
          tagline: values.tagline || null,
          city: values.city || null,
          address: values.address || null,
          phone: values.phone || null,
        })
        .eq("id", shop!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shop profile updated");
      void queryClient.invalidateQueries({ queryKey: ["owner-shop", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["shop", shop?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="max-w-md space-y-6">
      <div>
        <p className="overline">Dashboard</p>
        <h1 className="mt-1 text-4xl">Shop Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update your public-facing shop information.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 rounded-md" />)}
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className="panel space-y-4 rounded-lg p-6"
        >
          <div>
            <Label htmlFor="p-name">Shop name *</Label>
            <Input id="p-name" className="mt-1.5" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="p-tagline">Tagline</Label>
            <Input id="p-tagline" className="mt-1.5" {...form.register("tagline")} />
          </div>
          <div>
            <Label htmlFor="p-city">City</Label>
            <Input id="p-city" className="mt-1.5" {...form.register("city")} />
          </div>
          <div>
            <Label htmlFor="p-address">Address</Label>
            <Input id="p-address" className="mt-1.5" {...form.register("address")} />
          </div>
          <div>
            <Label htmlFor="p-phone">Phone</Label>
            <Input id="p-phone" className="mt-1.5" {...form.register("phone")} />
          </div>
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      )}
    </div>
  );
}
