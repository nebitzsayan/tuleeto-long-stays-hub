import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PaymentRecord } from "@/types";
import { toast } from "sonner";

export function usePaymentRecords(tenantId?: string) {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("payment_records")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch payment records: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [tenantId]);

  const addOrUpdateRecord = async (record: Omit<PaymentRecord, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("payment_records")
        .upsert([record], {
          onConflict: "tenant_id,month,year",
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Payment record saved successfully");
      fetchRecords();
      return data;
    } catch (error: any) {
      toast.error("Failed to save payment record: " + error.message);
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payment_records")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Payment record deleted successfully");
      fetchRecords();
    } catch (error: any) {
      toast.error("Failed to delete payment record: " + error.message);
      throw error;
    }
  };

  return {
    records,
    loading,
    addOrUpdateRecord,
    deleteRecord,
    refetch: fetchRecords,
  };
}
