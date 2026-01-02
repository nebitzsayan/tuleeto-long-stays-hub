import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTenants } from "@/hooks/useTenants";
import { TenantDialog } from "@/components/tenant/TenantDialog";
import { TenantCard } from "@/components/tenant/TenantCard";
import { Plus, ArrowLeft, Download, Search, FileText, X, Loader2 } from "lucide-react";
import { exportTenantsToExcel } from "@/lib/excelExport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getMonthName } from "@/lib/billGenerator";
import { PaymentRecord, Tenant } from "@/types";

interface InvoiceSearchResult {
  record: PaymentRecord;
  tenant: Tenant;
}

export default function TenantsPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { tenants, loading, addTenant, updateTenant, deleteTenant } = useTenants(propertyId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  
  // Invoice search states
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [searchResult, setSearchResult] = useState<InvoiceSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleExport = () => {
    exportTenantsToExcel(tenants, `tenants_${propertyId}.xlsx`);
  };

  const handleInvoiceSearch = async () => {
    if (!invoiceSearch.trim()) {
      toast.error("Please enter an invoice number");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('bill_number', invoiceSearch.trim().toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('Search error:', error);
        toast.error("Error searching for invoice");
        setSearchResult(null);
        return;
      }

      if (!data) {
        setSearchResult(null);
        toast.info("No invoice found with that number");
        return;
      }

      // Find the tenant for this record
      const tenant = tenants.find(t => t.id === data.tenant_id);
      
      if (!tenant) {
        // Fetch tenant if not in current list
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', data.tenant_id)
          .maybeSingle();
        
        if (tenantData) {
          setSearchResult({ 
            record: data as PaymentRecord, 
            tenant: tenantData as Tenant 
          });
          toast.success("Invoice found!");
        } else {
          setSearchResult(null);
          toast.info("Invoice found but tenant not accessible");
        }
      } else {
        setSearchResult({ record: data as PaymentRecord, tenant });
        toast.success("Invoice found!");
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Error searching for invoice");
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setInvoiceSearch("");
    setSearchResult(null);
    setHasSearched(false);
  };

  const activeTenants = tenants.filter(t => t.is_active);
  const inactiveTenants = tenants.filter(t => !t.is_active);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/my-properties")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Manage Tenants
              </h1>
              <p className="text-muted-foreground mt-1">Add and manage your property tenants</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {tenants.length > 0 && (
              <Button variant="outline" onClick={handleExport} size="lg">
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            )}
            <Button 
              onClick={() => {
                setEditingTenant(null);
                setDialogOpen(true);
              }}
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          </div>
        </div>

        {/* Invoice Search Section */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Invoice Search
            </CardTitle>
            <CardDescription>
              Search for generated bills by invoice number (e.g., TB2026001)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter invoice number..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvoiceSearch()}
                  className="pl-10 pr-10"
                />
                {invoiceSearch && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button onClick={handleInvoiceSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {/* Search Result */}
            {hasSearched && (
              <div className="mt-4">
                {searchResult ? (
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="pt-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                              #{searchResult.record.bill_number}
                            </span>
                          </div>
                          <p className="font-medium text-lg">{searchResult.tenant.name}</p>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <p>Room: {searchResult.tenant.room_number || 'N/A'}</p>
                            <p>Period: {getMonthName(searchResult.record.month)} {searchResult.record.year}</p>
                            <p className="font-medium text-foreground">
                              Total: ₹{(
                                searchResult.record.rent_amount + 
                                searchResult.record.electricity_amount + 
                                searchResult.record.water_amount + 
                                searchResult.record.other_charges
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/properties/${propertyId}/payments/${searchResult.tenant.id}`)}
                        >
                          View Payment Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No invoice found with that number</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
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
