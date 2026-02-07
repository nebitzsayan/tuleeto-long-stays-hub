import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PROFILES_QUERY_KEY = ['profiles'];

export function useProfiles(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PROFILES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useInvalidateProfiles() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
  };
}
