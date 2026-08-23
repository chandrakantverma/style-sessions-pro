import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useOwnerRole() {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    enabled: !authLoading && !!user,
    queryKey: ["owner-role", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "owner",
      });
      if (error) throw error;
      return data as boolean;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    isOwner: query.data === true,
    isLoading: authLoading || query.isLoading,
    error: query.error,
  };
}
