import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaymentRecords } from "@/hooks/usePaymentRecords";
import { useTenants } from "@/hooks/useTenants";
import { PaymentRecordTable } from "@/components/payment/PaymentRecordTable";
import { PaymentEntryDialog } from "@/components/payment/PaymentEntryDialog";
import { ArrowLeft, Plus, Download } from "lucide-react";
import { exportPaymentRecordsToExcel } from "@/lib/excelExport";
import { supabase } from "@/integrations/supabase/client";
import { Tenant } from "@/types";

export default function PaymentDashboardPage() {
  const { propertyId, tenantId } = useParams<{ propertyId: string; tenantId?: string }>();
  const navigate = useNavigate();
  const { records, loading, addOrUpdateRecord, deleteRecord } = usePaymentRecords(tenantId);
  const { tenants } = useTenants(propertyId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (tenantId && tenants.length > 0) {
      const tenant = tenants.find(t => t.id === tenantId);
      setSelectedTenant(tenant || null);
    }
  }, [tenantId, tenants]);

  const handleExport = () => {
    const fileName = tenantId 
      ? `payments_${selectedTenant?.name}_${Date.now()}.xlsx`
      : `payments_all_${Date.now()}.xlsx`;
    exportPaymentRecordsToExcel(records, tenants, fileName);
  };

  const totalPaid = records.reduce((sum, r) => 
    sum + r.rent_amount + r.electricity_amount + r.water_amount + r.other_charges, 0
  );
  const pendingCount = records.filter(r => !r.rent_paid || !r.electricity_paid || !r.water_paid).length;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(tenantId ? `/properties/${propertyId}/tenants` : "/my-properties")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {selectedTenant ? `${selectedTenant.name}'s Payments` : "Payment Dashboard"}
              </h1>
              <p className="text-muted-foreground">Track monthly rent and utility payments</p>
            </div>
          </div>
          <div className="flex gap-2">
            {records.length > 0 && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            )}
            <Button onClick={() => {
              setEditingRecord(null);
              setDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Record
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Collected</CardDescription>
              <CardTitle className="text-2xl">₹{totalPaid.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Records</CardDescription>
              <CardTitle className="text-2xl">{records.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Payments</CardDescription>
              <CardTitle className="text-2xl text-orange-500">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading payment records...</div>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No payment records yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Payment Record
              </Button>
            </CardContent>
          </Card>
        ) : (
          <PaymentRecordTable
            records={records}
            tenants={tenants}
            onEdit={(record) => {
              setEditingRecord(record);
              setDialogOpen(true);
            }}
            onDelete={deleteRecord}
          />
        )}

        <PaymentEntryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          record={editingRecord}
          tenants={tenants}
          defaultTenantId={tenantId}
          onSave={async (data) => {
            await addOrUpdateRecord(data);
            setDialogOpen(false);
            setEditingRecord(null);
          }}
        />
      </div>
    </MainLayout>
  );
}
