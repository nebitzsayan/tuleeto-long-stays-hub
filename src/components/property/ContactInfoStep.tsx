
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FormValues } from "./PropertyListingForm";

interface ContactInfoStepProps {
  form: UseFormReturn<FormValues>;
}

export const ContactInfoStep = ({ form }: ContactInfoStepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Contact Information</h2>
      
      <FormField
        control={form.control}
        name="contactName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. John Smith" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="contactEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="e.g. john@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="contactPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number (India)</FormLabel>
            <FormControl>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                  +91
                </span>
                <Input 
                  className="rounded-l-none" 
                  placeholder="e.g. 9876543210" 
                  {...field}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^\d]/g, '');
                    field.onChange(value);
                  }}
                  maxLength={10}
                />
              </div>
            </FormControl>
            <FormMessage />
            <FormDescription>
              Enter a 10-digit Indian mobile number without the country code
            </FormDescription>
          </FormItem>
        )}
      />
      
      <Separator className="my-6" />
      
      <FormField
        control={form.control}
        name="agreeToTerms"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <input
                type="checkbox"
                className="h-4 w-4 border-gray-300 rounded text-tuleeto-orange focus:ring-tuleeto-orange"
                checked={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                I agree to the <a href="#" className="text-tuleeto-orange hover:underline">terms and conditions</a>
              </FormLabel>
              <FormDescription>
                By listing your property, you confirm that you have the right to rent this property
              </FormDescription>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};
