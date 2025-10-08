import { PaymentRecord, Tenant } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";

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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Rent</TableHead>
            <TableHead>Electricity</TableHead>
            <TableHead>Water</TableHead>
            <TableHead>Other</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const tenant = tenantMap.get(record.tenant_id);
            const total = record.rent_amount + record.electricity_amount + record.water_amount + record.other_charges;
            const allPaid = record.rent_paid && record.electricity_paid && record.water_paid;

            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium">
                  {tenant?.name || "Unknown"}
                  {tenant?.room_number && <span className="text-muted-foreground text-sm"> ({tenant.room_number})</span>}
                </TableCell>
                <TableCell>{monthNames[record.month - 1]} {record.year}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">₹{record.rent_amount.toLocaleString()}</div>
                    <Badge variant={record.rent_paid ? "default" : "destructive"} className="text-xs">
                      {record.rent_paid ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">₹{record.electricity_amount.toLocaleString()}</div>
                    <Badge variant={record.electricity_paid ? "default" : "destructive"} className="text-xs">
                      {record.electricity_paid ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">₹{record.water_amount.toLocaleString()}</div>
                    <Badge variant={record.water_paid ? "default" : "destructive"} className="text-xs">
                      {record.water_paid ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>₹{record.other_charges.toLocaleString()}</TableCell>
                <TableCell className="font-bold">₹{total.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={allPaid ? "default" : "secondary"}>
                    {allPaid ? "Complete" : "Partial"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(record)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(record.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
