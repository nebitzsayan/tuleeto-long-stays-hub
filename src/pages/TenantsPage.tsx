import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenants } from "@/hooks/useTenants";
import { TenantDialog } from "@/components/tenant/TenantDialog";
import { TenantCard } from "@/components/tenant/TenantCard";
import { Plus, ArrowLeft, Download } from "lucide-react";
import { exportTenantsToExcel } from "@/lib/excelExport";

export default function TenantsPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { tenants, loading, addTenant, updateTenant, deleteTenant } = useTenants(propertyId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);

  const handleExport = () => {
    exportTenantsToExcel(tenants, `tenants_${propertyId}.xlsx`);
  };

  const activeTenants = tenants.filter(t => t.is_active);
  const inactiveTenants = tenants.filter(t => !t.is_active);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/my-properties")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Manage Tenants</h1>
              <p className="text-muted-foreground">Add and manage your property tenants</p>
            </div>
          </div>
          <div className="flex gap-2">
            {tenants.length > 0 && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            )}
            <Button onClick={() => {
              setEditingTenant(null);
              setDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading tenants...</div>
        ) : tenants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No tenants added yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Tenant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeTenants.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Active Tenants ({activeTenants.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeTenants.map((tenant) => (
                    <TenantCard
                      key={tenant.id}
                      tenant={tenant}
                      onEdit={(t) => {
                        setEditingTenant(t);
                        setDialogOpen(true);
                      }}
                      onDelete={deleteTenant}
                      onViewPayments={() => navigate(`/properties/${propertyId}/payments/${tenant.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {inactiveTenants.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Inactive Tenants ({inactiveTenants.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactiveTenants.map((tenant) => (
                    <TenantCard
                      key={tenant.id}
                      tenant={tenant}
                      onEdit={(t) => {
                        setEditingTenant(t);
                        setDialogOpen(true);
                      }}
                      onDelete={deleteTenant}
                      onViewPayments={() => navigate(`/properties/${propertyId}/payments/${tenant.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <TenantDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          tenant={editingTenant}
          propertyId={propertyId!}
          onSave={async (data) => {
            if (editingTenant) {
              await updateTenant(editingTenant.id, data);
            } else {
              await addTenant({ ...data, property_id: propertyId! });
            }
            setDialogOpen(false);
            setEditingTenant(null);
          }}
        />
      </div>
    </MainLayout>
  );
}
