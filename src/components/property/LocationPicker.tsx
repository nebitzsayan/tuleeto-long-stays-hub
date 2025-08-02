
import { useState, useEffect } from "react";
import { MapPin, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LocationPickerProps {
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number; address: string };
}

export const LocationPicker = ({ onLocationChange, initialLocation }: LocationPickerProps) => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setCoordinates({ lat, lng });
        
        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoidHVsZWV0byIsImEiOiJjbTY5djJqZGcwc2U5MmlyeTliNnc5eDd2In0.example`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const fullAddress = data.features[0].place_name;
            setAddress(fullAddress);
            onLocationChange({ lat, lng, address: fullAddress });
          } else {
            const manualAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setAddress(manualAddress);
            onLocationChange({ lat, lng, address: manualAddress });
          }
        } catch (error) {
          console.error("Error getting address:", error);
          const manualAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setAddress(manualAddress);
          onLocationChange({ lat, lng, address: manualAddress });
        }
        
        toast.success("Location detected successfully!");
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get current location");
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleManualCoordinates = () => {
    const lat = parseFloat((document.getElementById('manual-lat') as HTMLInputElement)?.value || '0');
    const lng = parseFloat((document.getElementById('manual-lng') as HTMLInputElement)?.value || '0');
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Please enter valid coordinates");
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Please enter valid latitude (-90 to 90) and longitude (-180 to 180)");
      return;
    }
    
    setCoordinates({ lat, lng });
    const manualAddress = address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setAddress(manualAddress);
    onLocationChange({ lat, lng, address: manualAddress });
    toast.success("Location set successfully!");
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-5 w-5 text-tuleeto-orange" />
        <Label className="text-sm font-medium">Pin Your Exact Location (Optional)</Label>
      </div>
      
      <p className="text-sm text-gray-600">
        Help tenants find your property easily by marking its exact location.
      </p>
      
      {coordinates && (
        <div className="bg-green-50 p-3 rounded-md">
          <p className="text-sm text-green-800">
            📍 Location set: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </p>
          {address && (
            <p className="text-xs text-green-700 mt-1">{address}</p>
          )}
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          variant="outline"
          className="w-full border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white"
        >
          <Locate className="h-4 w-4 mr-2" />
          {isGettingLocation ? "Getting Location..." : "Use Current Location"}
        </Button>
        
        <div className="text-center text-xs text-gray-500">OR</div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="manual-lat" className="text-xs">Latitude</Label>
            <Input
              id="manual-lat"
              type="number"
              step="any"
              placeholder="e.g. 19.0760"
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="manual-lng" className="text-xs">Longitude</Label>
            <Input
              id="manual-lng"
              type="number"
              step="any"
              placeholder="e.g. 72.8777"
              className="text-sm"
            />
          </div>
        </div>
        
        <Button
          type="button"
          onClick={handleManualCoordinates}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Set Manual Coordinates
        </Button>
        
        <div className="space-y-2">
          <Label htmlFor="location-address" className="text-xs">Address Description</Label>
          <Input
            id="location-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Describe the location or landmark"
            className="text-sm"
          />
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        💡 Tip: Use "Current Location" if you're at the property, or enter coordinates manually if you know them.
      </div>
    </div>
  );
};
