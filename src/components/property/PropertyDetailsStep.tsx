
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormValues } from "./PropertyListingForm";

interface PropertyDetailsStepProps {
  form: UseFormReturn<FormValues>;
}

export const PropertyDetailsStep = ({ form }: PropertyDetailsStepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Property Details</h2>
      
      <FormField
        control={form.control}
        name="propertyType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Property Type</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Studio">Studio</SelectItem>
                <SelectItem value="Townhouse">Townhouse</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Flat">Flat</SelectItem>
                <SelectItem value="Shop">Shop</SelectItem>
                <SelectItem value="Showroom">Showroom</SelectItem>
                <SelectItem value="Godown">Godown</SelectItem>
                <SelectItem value="Office">Office</SelectItem>
                <SelectItem value="Warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Property Title</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Modern Downtown Apartment" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe your property in detail..." 
                className="min-h-[120px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
