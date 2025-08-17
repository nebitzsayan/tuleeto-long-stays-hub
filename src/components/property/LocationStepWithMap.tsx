
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PropertyMapPicker } from "./PropertyMapPicker";
import { MapPin, Navigation } from "lucide-react";
import { getPrecisionCoordinates } from "@/lib/mapboxConfig";

interface LocationStepWithMapProps {
  form: UseFormReturn<any>;
}

const LocationStepWithMap = ({ form }: LocationStepWithMapProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    const preciseCoords = getPrecisionCoordinates(location.lat, location.lng, 8);
    
    setSelectedLocation({ ...preciseCoords, address: location.address });
    form.setValue("coordinates", preciseCoords);
    
    // Auto-populate address fields if empty
    const currentStreet = form.getValues("street");
    if (!currentStreet && location.address) {
      const addressParts = location.address.split(',');
      if (addressParts.length >= 3) {
        form.setValue("street", addressParts[0].trim());
        form.setValue("city", addressParts[1].trim());
        if (addressParts.length >= 4) {
          form.setValue("state", addressParts[2].trim());
        }
      }
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = getPrecisionCoordinates(
          position.coords.latitude, 
          position.coords.longitude, 
          8
        );
        
        setSelectedLocation({ ...coords, address: "Current Location" });
        form.setValue("coordinates", coords);
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  };

  const initialLocation = selectedLocation || form.getValues("coordinates");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Property Location</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your property address and mark the exact location on the map
        </p>
      </div>

      {/* Mapbox Component - Prominent Display */}
      <div className="bg-white rounded-lg border-2 border-tuleeto-orange/20">
        <PropertyMapPicker 
          onLocationSelect={handleLocationSelect}
          initialLocation={initialLocation}
        />
      </div>

      {/* Address Fields */}
      <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-200">
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Street Address *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter street address" 
                  className="h-10"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">City *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter city" 
                    className="h-10"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">State *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter state" 
                    className="h-10"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="zipCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">ZIP Code *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter ZIP code" 
                  className="h-10"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Location Confirmation */}
      {selectedLocation && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Precise Location Set</span>
          </div>
          <p className="text-xs text-green-700 font-mono mb-1">
            Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
          {selectedLocation.address !== "Current Location" && (
            <p className="text-xs text-green-700">
              Address: {selectedLocation.address}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationStepWithMap;
