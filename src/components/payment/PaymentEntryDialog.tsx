import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentRecord, Tenant } from "@/types";

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: PaymentRecord | null;
  tenants: Tenant[];
  defaultTenantId?: string;
  onSave: (data: any) => Promise<void>;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export function PaymentEntryDialog({ open, onOpenChange, record, tenants, defaultTenantId, onSave }: PaymentEntryDialogProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    defaultValues: {
      tenant_id: defaultTenantId || "",
      month: new Date().getMonth() + 1,
      year: currentYear,
      rent_paid: false,
      rent_amount: "",
      rent_paid_date: "",
      electricity_paid: false,
      electricity_amount: "",
      electricity_paid_date: "",
      water_paid: false,
      water_amount: "",
      water_paid_date: "",
      other_charges: "0",
      other_charges_description: "",
      remarks: "",
    }
  });

  const rentPaid = watch("rent_paid");
  const electricityPaid = watch("electricity_paid");
  const waterPaid = watch("water_paid");

  useEffect(() => {
    if (record) {
      reset({
        tenant_id: record.tenant_id,
        month: record.month,
        year: record.year,
        rent_paid: record.rent_paid,
        rent_amount: record.rent_amount.toString(),
        rent_paid_date: record.rent_paid_date || "",
        electricity_paid: record.electricity_paid,
        electricity_amount: record.electricity_amount.toString(),
        electricity_paid_date: record.electricity_paid_date || "",
        water_paid: record.water_paid,
        water_amount: record.water_amount.toString(),
        water_paid_date: record.water_paid_date || "",
        other_charges: record.other_charges.toString(),
        other_charges_description: record.other_charges_description || "",
        remarks: record.remarks || "",
      });
    } else {
      const tenant = tenants.find(t => t.id === defaultTenantId);
      reset({
        tenant_id: defaultTenantId || "",
        month: new Date().getMonth() + 1,
        year: currentYear,
        rent_paid: false,
        rent_amount: tenant?.monthly_rent.toString() || "",
        rent_paid_date: "",
        electricity_paid: false,
        electricity_amount: "",
        electricity_paid_date: "",
        water_paid: false,
        water_amount: "",
        water_paid_date: "",
        other_charges: "0",
        other_charges_description: "",
        remarks: "",
      });
    }
  }, [record, reset, defaultTenantId, tenants]);

  const onSubmit = async (data: any) => {
    await onSave({
      ...data,
      month: parseInt(data.month),
      year: parseInt(data.year),
      rent_amount: parseFloat(data.rent_amount) || 0,
      electricity_amount: parseFloat(data.electricity_amount) || 0,
      water_amount: parseFloat(data.water_amount) || 0,
      other_charges: parseFloat(data.other_charges) || 0,
      rent_paid_date: data.rent_paid_date || null,
      electricity_paid_date: data.electricity_paid_date || null,
      water_paid_date: data.water_paid_date || null,
      other_charges_description: data.other_charges_description || null,
      remarks: data.remarks || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record ? "Edit Payment Record" : "Add Payment Record"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-3">
              <Label htmlFor="tenant_id">Tenant *</Label>
              <Select
                value={watch("tenant_id")}
                onValueChange={(value) => {
                  setValue("tenant_id", value);
                  const tenant = tenants.find(t => t.id === value);
                  if (tenant) {
                    setValue("rent_amount", tenant.monthly_rent.toString());
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.filter(t => t.is_active).map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} {tenant.room_number && `(${tenant.room_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month *</Label>
              <Select value={watch("month").toString()} onValueChange={(value) => setValue("month", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Select value={watch("year").toString()} onValueChange={(value) => setValue("year", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">Rent</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent_amount">Amount</Label>
                <Input id="rent_amount" type="number" step="0.01" {...register("rent_amount")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent_paid_date">Paid Date</Label>
                <Input id="rent_paid_date" type="date" {...register("rent_paid_date")} />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="rent_paid"
                  checked={rentPaid}
                  onCheckedChange={(checked) => setValue("rent_paid", checked as boolean)}
                />
                <Label htmlFor="rent_paid">Paid</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">Electricity</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="electricity_amount">Amount</Label>
                <Input id="electricity_amount" type="number" step="0.01" {...register("electricity_amount")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="electricity_paid_date">Paid Date</Label>
                <Input id="electricity_paid_date" type="date" {...register("electricity_paid_date")} />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="electricity_paid"
                  checked={electricityPaid}
                  onCheckedChange={(checked) => setValue("electricity_paid", checked as boolean)}
                />
                <Label htmlFor="electricity_paid">Paid</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">Water</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="water_amount">Amount</Label>
                <Input id="water_amount" type="number" step="0.01" {...register("water_amount")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="water_paid_date">Paid Date</Label>
                <Input id="water_paid_date" type="date" {...register("water_paid_date")} />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="water_paid"
                  checked={waterPaid}
                  onCheckedChange={(checked) => setValue("water_paid", checked as boolean)}
                />
                <Label htmlFor="water_paid">Paid</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">Other Charges</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="other_charges">Amount</Label>
                <Input id="other_charges" type="number" step="0.01" {...register("other_charges")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_charges_description">Description</Label>
                <Input id="other_charges_description" {...register("other_charges_description")} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" {...register("remarks")} rows={2} />
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
