import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tenant } from "@/types";
import { toast } from "sonner";

export function useTenants(propertyId?: string) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch tenants: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [propertyId]);

  const addTenant = async (tenant: Omit<Tenant, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .insert([tenant])
        .select()
        .single();

      if (error) throw error;
      toast.success("Tenant added successfully");
      fetchTenants();
      return data;
    } catch (error: any) {
      toast.error("Failed to add tenant: " + error.message);
      throw error;
    }
  };

  const updateTenant = async (id: string, updates: Partial<Tenant>) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      toast.success("Tenant updated successfully");
      fetchTenants();
    } catch (error: any) {
      toast.error("Failed to update tenant: " + error.message);
      throw error;
    }
  };

  const deleteTenant = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Tenant deleted successfully");
      fetchTenants();
    } catch (error: any) {
      toast.error("Failed to delete tenant: " + error.message);
      throw error;
    }
  };

  return {
    tenants,
    loading,
    addTenant,
    updateTenant,
    deleteTenant,
    refetch: fetchTenants,
  };
}
