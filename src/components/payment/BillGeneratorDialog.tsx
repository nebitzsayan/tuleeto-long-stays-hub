import { useState, useRef } from "react";
import { PaymentRecord, Tenant } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BillCanvas } from "./BillCanvas";
import { generateBillNumber, getMonthName } from "@/lib/billGenerator";
import { toJpeg } from "html-to-image";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface BillGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: PaymentRecord[];
  tenants: Tenant[];
}

export const BillGeneratorDialog = ({
  open,
  onOpenChange,
  records,
  tenants,
}: BillGeneratorDialogProps) => {
  const isMobile = useIsMobile();
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const billRef = useRef<HTMLDivElement>(null);

  const selectedRecord = records.find(r => r.id === selectedRecordId);
  const selectedTenant = selectedRecord 
    ? tenants.find(t => t.id === selectedRecord.tenant_id)
    : null;

  // Use existing bill number or generate new one
  const billNumber = selectedRecord?.bill_number || generateBillNumber();

  const handleGenerate = async () => {
    if (!billRef.current || !selectedRecord || !selectedTenant) {
      toast.error("Please select a payment record");
      return;
    }

    setIsGenerating(true);

    try {
      // Generate the image
      const dataUrl = await toJpeg(billRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      // Save the bill number to the payment record if not already saved
      if (!selectedRecord.bill_number) {
        const { error } = await supabase
          .from('payment_records')
          .update({ bill_number: billNumber })
          .eq('id', selectedRecord.id);

        if (error) {
          console.error('Error saving bill number:', error);
        }
      }

      // Trigger download
      const link = document.createElement('a');
      link.download = `Bill_${selectedTenant.name.replace(/\s+/g, '_')}_${getMonthName(selectedRecord.month)}_${selectedRecord.year}.jpg`;
      link.href = dataUrl;
      link.click();

      toast.success("Bill generated successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating bill:', error);
      toast.error('Failed to generate bill image');
    } finally {
      setIsGenerating(false);
    }
  };

  // Group records by tenant for better UX
  const recordOptions = records.map(record => {
    const tenant = tenants.find(t => t.id === record.tenant_id);
    return {
      record,
      tenant,
      label: `${tenant?.name || 'Unknown'} - ${getMonthName(record.month)} ${record.year}`,
    };
  });

  const billDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const dialogContent = (
    <div className="space-y-6">
      {/* Month/Record Selector */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Select Payment Record
        </label>
        <Select value={selectedRecordId} onValueChange={setSelectedRecordId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a month and tenant" />
          </SelectTrigger>
          <SelectContent>
            {recordOptions.map(({ record, label }) => (
              <SelectItem key={record.id} value={record.id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview Section */}
      {selectedRecord && selectedTenant && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
            Preview
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="font-medium">Tenant:</span> {selectedTenant.name}
            </div>
            <div>
              <span className="font-medium">Period:</span> {getMonthName(selectedRecord.month)} {selectedRecord.year}
            </div>
            <div>
              <span className="font-medium">Room:</span> {selectedTenant.room_number || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Total Amount:</span> ₹
              {(selectedRecord.rent_amount + selectedRecord.electricity_amount + selectedRecord.water_amount + selectedRecord.other_charges).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Bill Canvas for Image Generation */}
      {selectedRecord && selectedTenant && (
        <div className="fixed left-[-9999px] top-0">
          <div ref={billRef}>
            <BillCanvas
              record={selectedRecord}
              tenant={selectedTenant}
              billNumber={billNumber}
              billDate={billDate}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isGenerating}
        >
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!selectedRecordId || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Bill
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto p-4">
          <SheetHeader className="mb-4">
            <SheetTitle>Generate Monthly Bill</SheetTitle>
            <SheetDescription>
              Select a payment record to generate a professional bill in JPG format
            </SheetDescription>
          </SheetHeader>
          {dialogContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Monthly Bill</DialogTitle>
          <DialogDescription>
            Select a payment record to generate a professional bill in JPG format
          </DialogDescription>
        </DialogHeader>
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
};
