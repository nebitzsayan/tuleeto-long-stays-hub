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
    <Card className={`transition-all hover:shadow-lg hover:border-primary/50 ${!tenant.is_active ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3 bg-gradient-to-br from-muted/30 to-transparent">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl font-bold">{tenant.name}</CardTitle>
          <Badge 
            variant={tenant.is_active ? "default" : "secondary"}
            className="px-3 py-1"
          >
            {tenant.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="pt-3 border-t-2 border-dashed">
          <div className="text-sm space-y-2">
            <div className="flex justify-between items-center p-2 rounded bg-green-50">
              <span className="text-muted-foreground font-medium">Monthly Rent:</span>
              <span className="font-bold text-green-700 text-lg">₹{tenant.monthly_rent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-muted/30">
              <span className="text-muted-foreground font-medium">Move In:</span>
              <span className="font-semibold">{format(new Date(tenant.move_in_date), "MMM dd, yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3">
          <Button 
            size="sm" 
            variant="default" 
            className="flex-1 min-w-[140px] font-semibold" 
            onClick={onViewPayments}
          >
            <Receipt className="h-4 w-4 mr-1" />
            View Payments
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onEdit(tenant)}
            className="hover:bg-primary/10 h-9 w-9 sm:w-auto sm:px-3"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              if (confirm(`Delete tenant ${tenant.name}?`)) {
                onDelete(tenant.id);
              }
            }}
            className="hover:bg-destructive/10 hover:text-destructive h-9 w-9"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
