
import { useState, useEffect } from "react";
import { MapPin, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getPrecisionCoordinates, reverseGeocode } from "@/lib/mapboxConfig";

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
        const coords = getPrecisionCoordinates(
          position.coords.latitude,
          position.coords.longitude,
          8
        );
        
        setCoordinates(coords);
        
        // Try to get address from coordinates using Mapbox reverse geocoding
        try {
          const data = await reverseGeocode(coords.lat, coords.lng);
          
          if (data.features && data.features.length > 0) {
            const fullAddress = data.features[0].place_name;
            setAddress(fullAddress);
            onLocationChange({ ...coords, address: fullAddress });
          } else {
            const manualAddress = `${coords.lat.toFixed(8)}°N, ${coords.lng.toFixed(8)}°E`;
            setAddress(manualAddress);
            onLocationChange({ ...coords, address: manualAddress });
          }
        } catch (error) {
          console.error("Error getting address from Mapbox:", error);
          const manualAddress = `${coords.lat.toFixed(8)}°N, ${coords.lng.toFixed(8)}°E`;
          setAddress(manualAddress);
          onLocationChange({ ...coords, address: manualAddress });
        }
        
        toast.success("Precise location detected with Mapbox!");
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
    
    const coords = getPrecisionCoordinates(lat, lng, 8);
    setCoordinates(coords);
    const manualAddress = address || `${coords.lat.toFixed(8)}°N, ${coords.lng.toFixed(8)}°E`;
    setAddress(manualAddress);
    onLocationChange({ ...coords, address: manualAddress });
    toast.success("Precise location set with Mapbox!");
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-5 w-5 text-tuleeto-orange" />
        <Label className="text-sm font-medium">Pin Your Exact Location (Optional)</Label>
      </div>
      
      <p className="text-sm text-gray-600">
        Help tenants find your property easily by marking its exact location using Mapbox precision.
      </p>
      
      {coordinates && (
        <div className="bg-green-50 p-3 rounded-md">
          <p className="text-sm text-green-800">
            📍 Precise location set: {coordinates.lat.toFixed(8)}, {coordinates.lng.toFixed(8)}
          </p>
          {address && (
            <p className="text-xs text-green-700 mt-1">{address}</p>
          )}
          <p className="text-xs text-blue-600 mt-1">
            ✨ Powered by Mapbox for global accuracy
          </p>
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
          {isGettingLocation ? "Getting Precise Location..." : "Use Current Location (Mapbox)"}
        </Button>
        
        <div className="text-center text-xs text-gray-500">OR</div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="manual-lat" className="text-xs">Latitude</Label>
            <Input
              id="manual-lat"
              type="number"
              step="any"
              placeholder="e.g. 26.7270661"
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="manual-lng" className="text-xs">Longitude</Label>
            <Input
              id="manual-lng"
              type="number"
              step="any"
              placeholder="e.g. 88.4284210"
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
          Set Precise Coordinates
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
      
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
        💡 <strong>Mapbox Advantage:</strong> Get global high precision location data. Use "Current Location" if you're at the property, or enter coordinates manually for high accuracy.
      </div>
    </div>
  );
};
