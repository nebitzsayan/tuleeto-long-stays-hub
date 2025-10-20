import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAdminData() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalTenants: 0,
    totalPayments: 0,
    totalReviews: 0,
    activeProperties: 0,
    activeTenants: 0,
    totalRevenue: 0,
  });

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [usersRes, propertiesRes, tenantsRes, paymentsRes, reviewsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id, is_public", { count: "exact" }),
        supabase.from("tenants").select("id, is_active", { count: "exact" }),
        supabase.from("payment_records").select("rent_amount, electricity_amount, water_amount, other_charges"),
        supabase.from("property_reviews").select("id", { count: "exact", head: true }),
      ]);

      const activeProperties = propertiesRes.data?.filter(p => p.is_public).length || 0;
      const activeTenants = tenantsRes.data?.filter(t => t.is_active).length || 0;
      const totalRevenue = paymentsRes.data?.reduce((sum, p) => {
        return sum + (Number(p.rent_amount) || 0) + (Number(p.electricity_amount) || 0) + 
               (Number(p.water_amount) || 0) + (Number(p.other_charges) || 0);
      }, 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalProperties: propertiesRes.count || 0,
        totalTenants: tenantsRes.count || 0,
        totalPayments: paymentsRes.data?.length || 0,
        totalReviews: reviewsRes.count || 0,
        activeProperties,
        activeTenants,
        totalRevenue: Math.round(totalRevenue),
      });
    } catch (error: any) {
      toast.error("Failed to fetch admin statistics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, refetch: fetchStats };
}
