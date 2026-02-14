import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PROPERTIES_QUERY_KEY = ['properties'];
export const FEATURED_PROPERTIES_QUERY_KEY = ['properties', 'featured'];

export interface PropertyData {
  id: string;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  type: string;
  contact_phone: string | null;
  is_public: boolean | null;
  is_featured: boolean | null;
  is_flagged: boolean | null;
  report_count: number | null;
  coordinates: any;
  owner_id: string;
  created_at: string;
}

export function useProperties(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PROPERTIES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, reviews:property_reviews(rating)')
        .eq('is_public', true);
      
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useInvalidateProperties() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: FEATURED_PROPERTIES_QUERY_KEY });
  };
}

export const PROPERTY_REVIEWS_QUERY_KEY = ['property-reviews'];

export function useInvalidateAllData() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: FEATURED_PROPERTIES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: PROPERTY_REVIEWS_QUERY_KEY });
  };
}
