
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PropertyMapPicker } from "./PropertyMapPicker";
import { MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
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
    // Use high precision coordinates
    const preciseCoords = getPrecisionCoordinates(location.lat, location.lng, 8);
    
    setSelectedLocation({ ...preciseCoords, address: location.address });
    form.setValue("coordinates", preciseCoords);
    
    // Auto-populate the address fields if they're empty
    const currentStreet = form.getValues("street");
    if (!currentStreet && location.address) {
      // Try to parse the address into components
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
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    toast.info("Getting your precise location with Mapbox...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = getPrecisionCoordinates(
          position.coords.latitude, 
          position.coords.longitude, 
          8
        );
        
        // This will trigger the map to center on user's location
        setSelectedLocation({ ...coords, address: "Current Location" });
        toast.success("📍 Precise location detected! Please adjust the marker if needed.", {
          description: "Powered by Mapbox for high accuracy"
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Failed to get current location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "Unknown error occurred.";
        }
        toast.error(errorMessage);
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
        <h2 className="text-2xl font-semibold mb-4">Property Location</h2>
        <p className="text-gray-600 mb-6">
          Enter your property address and mark the exact location on the map for precise accuracy using Mapbox
        </p>
      </div>

      {/* GPS Location Button */}
      <div className="flex justify-center mb-6">
        <Button
          type="button"
          onClick={getCurrentLocation}
          variant="outline"
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          <Navigation className="h-4 w-4 mr-2" />
          📍 Use My Current Location (High Precision)
        </Button>
      </div>

      {/* Mapbox Component */}
      <PropertyMapPicker 
        onLocationSelect={handleLocationSelect}
        initialLocation={initialLocation}
      />

      {/* Address Fields */}
      <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-100">
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter street address" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter city" 
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
                <FormLabel>State *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter state" 
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
              <FormLabel>ZIP Code *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter ZIP code" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {selectedLocation && (
        <div className="bg-green-50 p-4 rounded-md border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">Precise Location Confirmed</span>
          </div>
          <p className="text-sm text-green-700">
            Coordinates: {selectedLocation.lat.toFixed(8)}, {selectedLocation.lng.toFixed(8)}
          </p>
          {selectedLocation.address !== "Current Location" && (
            <p className="text-sm text-green-700 mt-1">
              Address: {selectedLocation.address}
            </p>
          )}
          <p className="text-xs text-green-600 mt-2">
            ✨ Powered by Mapbox for global high precision mapping
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationStepWithMap;
