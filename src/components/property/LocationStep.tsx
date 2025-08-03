
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PropertyMapPicker } from "./PropertyMapPicker";

interface LocationStepProps {
  form: UseFormReturn<any>;
}

const LocationStep = ({ form }: LocationStepProps) => {
  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    form.setValue("coordinates", { lat: location.lat, lng: location.lng });
    // Don't auto-fill the location field to allow custom descriptions
  };

  const initialLocation = form.getValues("coordinates");

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Property Location</h2>
        <p className="text-gray-600">Tell us where your property is located</p>
      </div>

      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Property Address/Location *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter your property address (e.g., 123 Main Street, Near City Center, Siliguri, West Bengal)"
                {...field}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nearbyLandmarks"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nearby Landmarks (Optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Near Metro Station, Shopping Mall, etc."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <PropertyMapPicker 
        onLocationSelect={handleLocationSelect}
        initialLocation={initialLocation}
      />
    </div>
  );
};

export default LocationStep;
