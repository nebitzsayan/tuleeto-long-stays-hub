import { PaymentRecord, Tenant } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Phone, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PaymentRecordTableProps {
  records: PaymentRecord[];
  tenants: Tenant[];
  onEdit: (record: PaymentRecord) => void;
  onDelete: (id: string) => void;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function PaymentRecordTable({ records, tenants, onEdit, onDelete }: PaymentRecordTableProps) {
  const tenantMap = new Map(tenants.map(t => [t.id, t]));

  return (
    <div className="rounded-lg border-2 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-bold">S.No</TableHead>
              <TableHead className="font-bold">Tenant</TableHead>
              <TableHead className="font-bold">Phone</TableHead>
              <TableHead className="font-bold">Month</TableHead>
              <TableHead className="font-bold text-right">Rent (₹)</TableHead>
              <TableHead className="font-bold text-center">Units</TableHead>
              <TableHead className="font-bold text-right">Rate/Unit</TableHead>
              <TableHead className="font-bold text-right">Elec. Bill (₹)</TableHead>
              <TableHead className="font-bold text-right">Water (₹)</TableHead>
              <TableHead className="font-bold text-right">Total (₹)</TableHead>
              <TableHead className="font-bold text-center">Payment Status</TableHead>
              <TableHead className="font-bold text-center">Date</TableHead>
              <TableHead className="font-bold">Remarks</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                  No payment records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record, index) => {
                const tenant = tenantMap.get(record.tenant_id);
                const total = record.rent_amount + record.electricity_amount + record.water_amount + record.other_charges;
                const allPaid = record.rent_paid && record.electricity_paid && record.water_paid;
                const electricityUnits = (record as any).electricity_units || 0;
                const costPerUnit = (record as any).cost_per_unit || 0;
                const remarks = (record as any).remarks || "";

                return (
                  <TableRow key={record.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{tenant?.name || "Unknown"}</span>
                        {tenant?.room_number && (
                          <span className="text-xs text-muted-foreground">Room: {tenant.room_number}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {tenant?.phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium whitespace-nowrap">
                        {monthNames[record.month - 1]} {record.year}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">₹{record.rent_amount.toLocaleString()}</span>
                        {record.rent_paid ? (
                          <Badge variant="default" className="text-xs mt-1">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs mt-1">
                            <XCircle className="h-3 w-3 mr-1" /> Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {electricityUnits > 0 ? electricityUnits : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {costPerUnit > 0 ? `₹${costPerUnit}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">₹{record.electricity_amount.toLocaleString()}</span>
                        {record.electricity_paid ? (
                          <Badge variant="default" className="text-xs mt-1">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs mt-1">
                            <XCircle className="h-3 w-3 mr-1" /> Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">₹{record.water_amount.toLocaleString()}</span>
                        {record.water_paid ? (
                          <Badge variant="default" className="text-xs mt-1">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs mt-1">
                            <XCircle className="h-3 w-3 mr-1" /> Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-lg">₹{total.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {allPaid ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Complete
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-4 w-4" /> Partial
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1 text-xs">
                        {record.rent_paid && record.rent_paid_date && (
                          <div className="flex items-center gap-1 justify-center">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(record.rent_paid_date), "dd/MM/yy")}
                          </div>
                        )}
                        {!record.rent_paid && <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      <div className="text-xs text-muted-foreground truncate" title={remarks}>
                        {remarks || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => onEdit(record)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this payment record?")) {
                              onDelete(record.id);
                            }
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
