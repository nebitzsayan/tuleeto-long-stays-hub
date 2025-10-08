import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tenant } from "@/types";

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null;
  propertyId: string;
  onSave: (data: any) => Promise<void>;
}

export function TenantDialog({ open, onOpenChange, tenant, propertyId, onSave }: TenantDialogProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      room_number: "",
      move_in_date: "",
      move_out_date: "",
      monthly_rent: "",
      security_deposit: "",
      is_active: true,
      notes: "",
    }
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        email: tenant.email || "",
        phone: tenant.phone,
        room_number: tenant.room_number || "",
        move_in_date: tenant.move_in_date,
        move_out_date: tenant.move_out_date || "",
        monthly_rent: tenant.monthly_rent.toString(),
        security_deposit: tenant.security_deposit.toString(),
        is_active: tenant.is_active,
        notes: tenant.notes || "",
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
        room_number: "",
        move_in_date: "",
        move_out_date: "",
        monthly_rent: "",
        security_deposit: "0",
        is_active: true,
        notes: "",
      });
    }
  }, [tenant, reset]);

  const onSubmit = async (data: any) => {
    await onSave({
      ...data,
      monthly_rent: parseFloat(data.monthly_rent),
      security_deposit: parseFloat(data.security_deposit || 0),
      email: data.email || null,
      room_number: data.room_number || null,
      move_out_date: data.move_out_date || null,
      notes: data.notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenant ? "Edit Tenant" : "Add New Tenant"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name", { required: "Name is required" })} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" {...register("phone", { required: "Phone is required" })} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room_number">Room Number</Label>
              <Input id="room_number" {...register("room_number")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="move_in_date">Move In Date *</Label>
              <Input id="move_in_date" type="date" {...register("move_in_date", { required: "Move in date is required" })} />
              {errors.move_in_date && <p className="text-sm text-destructive">{errors.move_in_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="move_out_date">Move Out Date</Label>
              <Input id="move_out_date" type="date" {...register("move_out_date")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_rent">Monthly Rent *</Label>
              <Input id="monthly_rent" type="number" step="0.01" {...register("monthly_rent", { required: "Monthly rent is required" })} />
              {errors.monthly_rent && <p className="text-sm text-destructive">{errors.monthly_rent.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="security_deposit">Security Deposit</Label>
              <Input id="security_deposit" type="number" step="0.01" {...register("security_deposit")} />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">Active Tenant</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
