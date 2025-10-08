import { Tenant } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Receipt, Phone, Mail, Home } from "lucide-react";
import { format } from "date-fns";

interface TenantCardProps {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
  onDelete: (id: string) => void;
  onViewPayments: () => void;
}

export function TenantCard({ tenant, onEdit, onDelete, onViewPayments }: TenantCardProps) {
  return (
    <Card className={!tenant.is_active ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{tenant.name}</CardTitle>
          <Badge variant={tenant.is_active ? "default" : "secondary"}>
            {tenant.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          {tenant.room_number && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Home className="h-4 w-4" />
              <span>Room: {tenant.room_number}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{tenant.phone}</span>
          </div>
          {tenant.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{tenant.email}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rent:</span>
              <span className="font-semibold">₹{tenant.monthly_rent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Move In:</span>
              <span>{format(new Date(tenant.move_in_date), "MMM dd, yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={onViewPayments}>
            <Receipt className="h-4 w-4 mr-1" />
            Payments
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(tenant)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(tenant.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
