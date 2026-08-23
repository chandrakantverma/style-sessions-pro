import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOwnerShop } from "@/hooks/useOwnerShop";
import { CATEGORY_LABELS } from "@/lib/format";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { ServiceFormDialog } from "@/components/dashboard/ServiceFormDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

export const Route = createFileRoute("/dashboard/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const { shop } = useOwnerShop();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);

  const { data: services, isLoading } = useQuery({
    enabled: !!shop,
    queryKey: ["services", shop?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("shop_id", shop!.id)
        .order("category")
        .order("name");
      if (error) throw error;
      return data as Service[];
    },
  });

  // Group by category
  const grouped = (services ?? []).reduce<Record<string, Service[]>>((acc, svc) => {
    acc[svc.category] = [...(acc[svc.category] ?? []), svc];
    return acc;
  }, {});

  function handleEdit(service: Service) {
    setEditService(service);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditService(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="overline">Dashboard</p>
          <h1 className="mt-1 text-4xl">Services</h1>
        </div>
        <Button onClick={handleAdd} className="gap-2 mt-1">
          <Plus className="size-4" />
          Add service
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="panel rounded-lg p-10 text-center">
          <p className="text-sm text-muted-foreground">No services yet.</p>
          <Button onClick={handleAdd} variant="outline" className="mt-4 gap-2">
            <Plus className="size-4" />
            Add your first service
          </Button>
        </div>
      ) : (
        Object.entries(grouped).map(([category, list]) => (
          <section key={category}>
            <p className="overline mb-3">
              {CATEGORY_LABELS[category] ?? category}
            </p>
            <div className="space-y-2">
              {list.map((svc) => (
                <ServiceCard
                  key={svc.id}
                  service={svc}
                  shopId={shop!.id}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditService(null);
        }}
        shopId={shop?.id ?? ""}
        editService={editService}
      />
    </div>
  );
}
