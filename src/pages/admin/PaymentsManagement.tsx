import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download } from "lucide-react";
import { exportPaymentRecordsToExcel } from "@/lib/excelExport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentsManagement() {
  const [payments, setPayments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, paid: 0, unpaid: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, tenantsRes] = await Promise.all([
        supabase
          .from("payment_records")
          .select(`
            *,
            tenants (
              name,
              property_id,
              properties (
                title,
                location
              )
            )
          `)
          .order("year", { ascending: false })
          .order("month", { ascending: false }),
        supabase.from("tenants").select("*"),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (tenantsRes.error) throw tenantsRes.error;

      setPayments(paymentsRes.data || []);
      setTenants(tenantsRes.data || []);

      const total = paymentsRes.data?.reduce((sum, p) => {
        return sum + (Number(p.rent_amount) || 0) + (Number(p.electricity_amount) || 0) +
               (Number(p.water_amount) || 0) + (Number(p.other_charges) || 0);
      }, 0) || 0;

      const paidCount = paymentsRes.data?.filter(p => p.rent_paid).length || 0;
      const unpaidCount = paymentsRes.data?.filter(p => !p.rent_paid).length || 0;

      setStats({ total: Math.round(total), paid: paidCount, unpaid: unpaidCount });
    } catch (error: any) {
      toast.error("Failed to fetch payment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPayments = payments.filter((payment) =>
    payment.tenants?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMonthName = (month: number) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[month - 1];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Management</h2>
          <p className="text-muted-foreground">View all payment records across the platform</p>
        </div>
        <Button onClick={() => exportPaymentRecordsToExcel(payments, tenants)} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Paid Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Unpaid Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.unpaid}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tenant name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Electricity</TableHead>
              <TableHead>Water</TableHead>
              <TableHead>Other</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">No payment records found</TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.tenants?.name || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.tenants?.properties?.title}</span>
                      <span className="text-sm text-muted-foreground">{payment.tenants?.properties?.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>{`${getMonthName(payment.month)} ${payment.year}`}</TableCell>
                  <TableCell>₹{payment.rent_amount?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{payment.electricity_amount?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{payment.water_amount?.toLocaleString() || 0}</TableCell>
                  <TableCell>₹{payment.other_charges?.toLocaleString() || 0}</TableCell>
                  <TableCell className="font-medium">
                    ₹{((Number(payment.rent_amount) || 0) + (Number(payment.electricity_amount) || 0) + 
                        (Number(payment.water_amount) || 0) + (Number(payment.other_charges) || 0)).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {payment.rent_paid ? (
                      <Badge variant="default">Paid</Badge>
                    ) : (
                      <Badge variant="destructive">Unpaid</Badge>
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
