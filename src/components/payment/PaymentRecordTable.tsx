import { PaymentRecord, Tenant } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Mobile Card Component
  const MobilePaymentCard = ({ record, tenant, index }: { record: PaymentRecord; tenant?: Tenant; index: number }) => {
    const total = record.rent_amount + record.electricity_amount + record.water_amount + record.other_charges;
    const allPaid = record.rent_paid && record.electricity_paid && record.water_paid;
    const electricityUnits = (record as any).electricity_units || 0;
    const costPerUnit = (record as any).cost_per_unit || 0;
    const remarks = (record as any).remarks || "";

    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-muted/80 to-muted/50 pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{tenant?.name || "Unknown"}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {tenant?.room_number && <span>Room: {tenant.room_number}</span>}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {tenant?.phone || "-"}
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">#{index + 1}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Period */}
          <div className="flex items-center gap-2 text-sm font-medium pb-2 border-b">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{monthNames[record.month - 1]} {record.year}</span>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            {/* Rent */}
            <div className="flex justify-between items-center p-2 rounded bg-muted/30">
              <span className="text-sm font-medium">Rent</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">₹{record.rent_amount.toLocaleString()}</span>
                {record.rent_paid ? (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" /> Pending
                  </Badge>
                )}
              </div>
            </div>

            {/* Electricity */}
            <div className="flex justify-between items-center p-2 rounded bg-muted/30">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Electricity</span>
                {electricityUnits > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {electricityUnits} units × ₹{costPerUnit}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">₹{record.electricity_amount.toLocaleString()}</span>
                {record.electricity_paid ? (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" /> Pending
                  </Badge>
                )}
              </div>
            </div>

            {/* Water */}
            <div className="flex justify-between items-center p-2 rounded bg-muted/30">
              <span className="text-sm font-medium">Water</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">₹{record.water_amount.toLocaleString()}</span>
                {record.water_paid ? (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" /> Pending
                  </Badge>
                )}
              </div>
            </div>

            {/* Other Charges */}
            {record.other_charges > 0 && (
              <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                <span className="text-sm font-medium">Other</span>
                <span className="font-semibold">₹{record.other_charges.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center p-3 rounded bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
            <span className="font-semibold">Total Amount</span>
            <span className="text-xl font-bold text-primary">₹{total.toLocaleString()}</span>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            {allPaid ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-4 w-4" /> All Paid
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-4 w-4" /> Partial Payment
              </Badge>
            )}
          </div>


          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="default" 
              onClick={() => onEdit(record)} 
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => {
                if (confirm("Are you sure you want to delete this payment record?")) {
                  onDelete(record.id);
                }
              }}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      {/* Desktop Table - hidden on mobile */}
      <div className="hidden md:block rounded-lg border-2 overflow-hidden shadow-lg">
        <ScrollArea className="w-full">
          <div className="min-w-[1200px]">
            <Table>
            <TableHeader className="sticky top-0 bg-background z-30">
              <TableRow className="bg-gradient-to-r from-muted/80 to-muted/50 hover:bg-muted/50 border-b-2">
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
              <TableHead className="font-bold text-right sticky right-0 bg-background z-20 min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
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
                  <TableRow 
                    key={record.id} 
                    className={`hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                  >
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
                    <TableCell className="text-right sticky right-0 bg-background z-10 min-w-[120px]">
                      <TooltipProvider>
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="default" 
                                onClick={() => onEdit(record)} 
                                className="h-9 w-9 sm:w-auto sm:px-3"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="hidden sm:inline sm:ml-2">Edit</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit payment details</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="destructive" 
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this payment record?")) {
                                    onDelete(record.id);
                                  }
                                }}
                                className="h-9 w-9"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete record</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
      </div>

      {/* Mobile Cards - hidden on desktop */}
      <div className="block md:hidden space-y-4">
        {records.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No payment records found
            </CardContent>
          </Card>
        ) : (
          records.map((record, index) => {
            const tenant = tenantMap.get(record.tenant_id);
            return (
              <MobilePaymentCard 
                key={record.id}
                record={record}
                tenant={tenant}
                index={index}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
