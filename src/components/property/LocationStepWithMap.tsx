

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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Property Location</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your property address and mark the exact location on the map
        </p>
      </div>

      {/* GPS Location Button - Compact */}
      <div className="flex justify-center mb-4">
        <Button
          type="button"
          onClick={getCurrentLocation}
          variant="outline"
          size="sm"
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          <Navigation className="h-3 w-3 mr-1" />
          Use GPS Location
        </Button>
      </div>

      {/* Mapbox Component */}
      <PropertyMapPicker 
        onLocationSelect={handleLocationSelect}
        initialLocation={initialLocation}
      />

      {/* Address Fields - Compact Grid */}
      <div className="grid grid-cols-1 gap-3 pt-3 border-t border-gray-100">
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Street Address *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter street address" 
                  className="h-9"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">City *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter city" 
                    className="h-9"
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
                    className="h-9"
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
                  className="h-9"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Location Confirmation - Compact */}
      {selectedLocation && (
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3 w-3 text-green-600" />
            <span className="text-sm font-medium text-green-800">Location Set</span>
          </div>
          <p className="text-xs text-green-700 font-mono">
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
          {selectedLocation.address !== "Current Location" && (
            <p className="text-xs text-green-700 mt-1 truncate">
              {selectedLocation.address}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationStepWithMap;

