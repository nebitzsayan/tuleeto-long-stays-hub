import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Download, Phone, Mail, Home, Calendar } from "lucide-react";
import { exportTenantsToExcel } from "@/lib/excelExport";

export default function TenantsManagement() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          properties (
            id,
            title,
            location,
            owner_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Tenant Management</h2>
          <p className="text-sm md:text-base text-muted-foreground">View all tenants across properties</p>
        </div>
        <Button onClick={() => exportTenantsToExcel(tenants)} variant="outline" size="sm" className="w-full md:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : filteredTenants.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No tenants found
            </CardContent>
          </Card>
        ) : (
          filteredTenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tenant.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>{tenant.phone}</span>
                    </div>
                    {tenant.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{tenant.email}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant={tenant.is_active ? "default" : "secondary"} className="text-xs flex-shrink-0">
                    {tenant.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-1.5">
                    <Home className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{tenant.properties?.title || "N/A"}</p>
                      <p className="text-muted-foreground truncate">{tenant.properties?.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">₹{tenant.monthly_rent?.toLocaleString()}/mo</p>
                    <p className="text-muted-foreground">Room: {tenant.room_number || "N/A"}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Move-in: {new Date(tenant.move_in_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead>Move-in Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No tenants found</TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {tenant.phone}
                      </div>
                      {tenant.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {tenant.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{tenant.properties?.title}</span>
                      <span className="text-sm text-muted-foreground">{tenant.properties?.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>{tenant.room_number || "N/A"}</TableCell>
                  <TableCell>₹{tenant.monthly_rent?.toLocaleString()}</TableCell>
                  <TableCell>{new Date(tenant.move_in_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {tenant.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}