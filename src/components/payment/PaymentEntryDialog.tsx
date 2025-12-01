import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentRecord, Tenant } from "@/types";
import { Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface PaymentFormContentProps {
  register: any;
  handleSubmit: any;
  errors: any;
  isSubmitting: boolean;
  setValue: any;
  watch: any;
  tenants: Tenant[];
  record?: PaymentRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
}

function PaymentFormContent({ 
  register, 
  handleSubmit, 
  errors, 
  isSubmitting, 
  setValue, 
  watch, 
  tenants, 
  record, 
  onOpenChange,
  onSubmit 
}: PaymentFormContentProps) {
  const rentPaid = watch("rent_paid");
  const electricityPaid = watch("electricity_paid");
  const waterPaid = watch("water_paid");
  const rentAmount = watch("rent_amount");
  const electricityAmount = watch("electricity_amount");
  const waterAmount = watch("water_amount");
  const otherCharges = watch("other_charges");

  const getTenantInfo = () => {
    return tenants.find(t => t.id === watch("tenant_id"));
  };

  const total = (parseFloat(rentAmount) || 0) + (parseFloat(electricityAmount) || 0) + (parseFloat(waterAmount) || 0) + (parseFloat(otherCharges) || 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Tenant Info Section */}
      <div className="bg-muted/50 p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label className="text-sm text-muted-foreground">Tenant</Label>
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
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.filter(t => t.is_active).map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name} {tenant.room_number && `(Room: ${tenant.room_number})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {getTenantInfo() && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Phone</Label>
              <div className="font-medium mt-2">{getTenantInfo()?.phone}</div>
            </div>
          )}
        </div>
      </div>

      {/* Period Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Month</Label>
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
          <Label>Year</Label>
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

      {/* Payment Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rent */}
        <div className="border-2 p-4 rounded-lg space-y-3 hover:border-primary/50 transition-colors">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            💰 Rent
          </h3>
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input 
              type="number" 
              step="0.01"
              {...register("rent_amount")}
              className="text-lg font-medium"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="rent_paid"
                checked={rentPaid}
                onCheckedChange={(checked) => setValue("rent_paid", checked as boolean)}
              />
              <Label htmlFor="rent_paid" className="cursor-pointer font-medium">Mark as Paid</Label>
            </div>
          </div>
          {rentPaid && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Payment Date
              </Label>
              <Input 
                type="date" 
                {...register("rent_paid_date")}
              />
            </div>
          )}
        </div>

        {/* Electricity */}
        <div className="border-2 p-4 rounded-lg space-y-3 hover:border-primary/50 transition-colors">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            ⚡ Electricity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Units</Label>
              <Input 
                type="number" 
                step="0.01"
                {...register("electricity_units")}
                placeholder="Enter units"
              />
            </div>
            <div className="space-y-2">
              <Label>Cost/Unit (₹)</Label>
              <Input 
                type="number" 
                step="0.01"
                {...register("cost_per_unit")}
                placeholder="Per unit cost"
              />
            </div>
          </div>
          <div className="bg-primary/10 p-2 rounded text-center">
            <span className="text-sm text-muted-foreground">Bill Amount: </span>
            <span className="text-lg font-bold">₹{(parseFloat(electricityAmount) || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="electricity_paid"
                checked={electricityPaid}
                onCheckedChange={(checked) => setValue("electricity_paid", checked as boolean)}
              />
              <Label htmlFor="electricity_paid" className="cursor-pointer font-medium">Mark as Paid</Label>
            </div>
          </div>
          {electricityPaid && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Payment Date
              </Label>
              <Input 
                type="date" 
                {...register("electricity_paid_date")}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water */}
        <div className="border-2 p-4 rounded-lg space-y-3 hover:border-primary/50 transition-colors">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            💧 Water
          </h3>
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input 
              type="number" 
              step="0.01"
              {...register("water_amount")}
              className="text-lg font-medium"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="water_paid"
                checked={waterPaid}
                onCheckedChange={(checked) => setValue("water_paid", checked as boolean)}
              />
              <Label htmlFor="water_paid" className="cursor-pointer font-medium">Mark as Paid</Label>
            </div>
          </div>
          {waterPaid && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Payment Date
              </Label>
              <Input 
                type="date" 
                {...register("water_paid_date")}
              />
            </div>
          )}
        </div>

        {/* Other Charges */}
        <div className="border-2 p-4 rounded-lg space-y-3 hover:border-primary/50 transition-colors">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            📝 Other Charges
          </h3>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              {...register("other_charges_description")}
              placeholder="e.g., Maintenance, Parking"
            />
          </div>
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input 
              type="number" 
              step="0.01"
              {...register("other_charges")}
              className="text-lg font-medium"
            />
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <Label>Remarks / Notes</Label>
        <Textarea 
          {...register("remarks")}
          placeholder="Add any additional notes here..."
          rows={3}
        />
      </div>

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 sm:p-6 rounded-lg border-2 border-primary/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-lg sm:text-xl font-semibold">Total Amount:</span>
          <span className="text-2xl sm:text-3xl font-bold text-primary">₹{total.toLocaleString()}</span>
        </div>
        <div className="mt-3 text-sm text-muted-foreground flex flex-wrap gap-2 sm:gap-4 justify-between">
          <span>Rent: ₹{(parseFloat(rentAmount) || 0).toLocaleString()}</span>
          <span>Electricity: ₹{(parseFloat(electricityAmount) || 0).toLocaleString()}</span>
          <span>Water: ₹{(parseFloat(waterAmount) || 0).toLocaleString()}</span>
          {(parseFloat(otherCharges) || 0) > 0 && <span>Other: ₹{(parseFloat(otherCharges) || 0).toLocaleString()}</span>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="lg" className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-[150px]" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : (record ? "Update Record" : "Save Record")}
        </Button>
      </div>
    </form>
  );
}

export function PaymentEntryDialog({ open, onOpenChange, record, tenants, defaultTenantId, onSave }: PaymentEntryDialogProps) {
  const isMobile = useIsMobile();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    defaultValues: {
      tenant_id: defaultTenantId || "",
      month: new Date().getMonth() + 1,
      year: currentYear,
      rent_paid: false,
      rent_amount: "",
      rent_paid_date: "",
      electricity_units: "0",
      cost_per_unit: "11",
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

  const electricityUnits = watch("electricity_units");
  const costPerUnit = watch("cost_per_unit");

  // Auto-calculate electricity amount
  useEffect(() => {
    const units = parseFloat(electricityUnits) || 0;
    const rate = parseFloat(costPerUnit) || 0;
    const calculatedAmount = units * rate;
    setValue("electricity_amount", calculatedAmount.toString());
  }, [electricityUnits, costPerUnit, setValue]);

  useEffect(() => {
    if (record) {
      reset({
        tenant_id: record.tenant_id,
        month: record.month,
        year: record.year,
        rent_paid: record.rent_paid,
        rent_amount: record.rent_amount.toString(),
        rent_paid_date: record.rent_paid_date || "",
        electricity_units: ((record as any).electricity_units || 0).toString(),
        cost_per_unit: ((record as any).cost_per_unit || 11).toString(),
        electricity_paid: record.electricity_paid,
        electricity_amount: record.electricity_amount.toString(),
        electricity_paid_date: record.electricity_paid_date || "",
        water_paid: record.water_paid,
        water_amount: record.water_amount.toString(),
        water_paid_date: record.water_paid_date || "",
        other_charges: record.other_charges.toString(),
        other_charges_description: record.other_charges_description || "",
        remarks: (record as any).remarks || "",
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
        electricity_units: "0",
        cost_per_unit: "11",
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
      electricity_units: parseFloat(data.electricity_units) || 0,
      cost_per_unit: parseFloat(data.cost_per_unit) || 0,
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

  const formProps = {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    setValue,
    watch,
    tenants,
    record,
    onOpenChange,
    onSubmit,
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[95vh] overflow-y-auto p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="text-xl font-bold">
              {record ? "Edit Payment Record" : "Add Payment Record"}
            </SheetTitle>
          </SheetHeader>
          <PaymentFormContent {...formProps} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            {record ? "Edit Payment Record" : "Add Payment Record"}
          </DialogTitle>
        </DialogHeader>
        <PaymentFormContent {...formProps} />
      </DialogContent>
    </Dialog>
  );
}
