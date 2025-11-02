import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaymentRecords } from "@/hooks/usePaymentRecords";
import { useTenants } from "@/hooks/useTenants";
import { PaymentRecordTable } from "@/components/payment/PaymentRecordTable";
import { PaymentEntryDialog } from "@/components/payment/PaymentEntryDialog";
import { BillGeneratorDialog } from "@/components/payment/BillGeneratorDialog";
import { ArrowLeft, Plus, Download, FileText } from "lucide-react";
import { exportPaymentRecordsToExcel } from "@/lib/excelExport";
import { supabase } from "@/integrations/supabase/client";
import { Tenant } from "@/types";

export default function PaymentDashboardPage() {
  const { propertyId, tenantId } = useParams<{ propertyId: string; tenantId?: string }>();
  const navigate = useNavigate();
  const { records, loading, addOrUpdateRecord, deleteRecord } = usePaymentRecords(tenantId);
  const { tenants } = useTenants(propertyId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
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
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-[1600px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(tenantId ? `/properties/${propertyId}/tenants` : "/my-properties")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {selectedTenant ? `${selectedTenant.name}'s Payments` : "Payment Dashboard"}
              </h1>
              <p className="text-muted-foreground mt-1">Track monthly rent and utility payments</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {records.length > 0 && (
              <>
                <Button variant="outline" onClick={handleExport} size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
                <Button variant="secondary" onClick={() => setBillDialogOpen(true)} size="lg">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Bill for This Month
                </Button>
              </>
            )}
            <Button onClick={() => {
              setEditingRecord(null);
              setDialogOpen(true);
            }} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Record
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-semibold text-green-700">Total Collected</CardDescription>
              <CardTitle className="text-4xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-semibold text-blue-700">Total Records</CardDescription>
              <CardTitle className="text-4xl font-bold text-blue-600">{records.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-semibold text-orange-700">Pending Payments</CardDescription>
              <CardTitle className="text-4xl font-bold text-orange-600">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-full"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
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

        <BillGeneratorDialog
          open={billDialogOpen}
          onOpenChange={setBillDialogOpen}
          records={records}
          tenants={tenants}
        />
      </div>
    </MainLayout>
  );
}
