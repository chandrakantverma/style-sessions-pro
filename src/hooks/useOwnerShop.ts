import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type OwnerShop = Tables<"shops">;

export function useOwnerShop(enabled = true) {
  const { user } = useAuth();

  const query = useQuery({
    enabled: enabled && !!user,
    queryKey: ["owner-shop", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as OwnerShop | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    shop: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
