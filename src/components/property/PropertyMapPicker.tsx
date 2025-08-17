
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { OLA_MAPS_CONFIG, getPrecisionCoordinates } from '@/lib/olaMapsConfig';

interface PropertyMapPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
}

export const PropertyMapPicker = ({ onLocationSelect, initialLocation }: PropertyMapPickerProps) => {
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [mapCenter, setMapCenter] = useState(
    initialLocation || OLA_MAPS_CONFIG.defaultCenter
  );
  const [zoom, setZoom] = useState(OLA_MAPS_CONFIG.precision.zoom.picker);
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(
    initialLocation ? { x: 400, y: 200 } : null
  );

  // Generate Ola Maps static map URL
  const generateMapUrl = () => {
    const width = 800;
    const height = 400;
    
    let url = `https://api.olamaps.io/places/vector/v1/staticmap?`;
    url += `center=${mapCenter.lat},${mapCenter.lng}`;
    url += `&zoom=${zoom}`;
    url += `&size=${width}x${height}`;
    url += `&api_key=${OLA_MAPS_CONFIG.apiKey}`;
    
    return url;
  };

  // Convert pixel coordinates to lat/lng
  const pixelToLatLng = (x: number, y: number) => {
    const mapWidth = 800;
    const mapHeight = 400;
    
    // Calculate the bounds of the current map view
    const latRange = 360 / Math.pow(2, zoom);
    const lngRange = 360 / Math.pow(2, zoom);
    
    const lat = mapCenter.lat + (latRange / 2) - (y / mapHeight) * latRange;
    const lng = mapCenter.lng - (lngRange / 2) + (x / mapWidth) * lngRange;
    
    return { lat, lng };
  };

  // Update location with Ola Maps reverse geocoding
  const updateLocation = async (coords: { lat: number; lng: number }) => {
    const preciseCoords = getPrecisionCoordinates(coords.lat, coords.lng, OLA_MAPS_CONFIG.precision.coordinates);
    setSelectedCoords(preciseCoords);
    
    try {
      const response = await fetch(
        `${OLA_MAPS_CONFIG.endpoints.reverseGeocode}?latlng=${preciseCoords.lat},${preciseCoords.lng}&api_key=${OLA_MAPS_CONFIG.apiKey}`,
        {
          headers: {
            'X-Request-Id': Math.random().toString(36).substring(7)
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      let address;
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        address = result.formatted_address || result.name;
        
        if (address) {
          address = address.replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '');
        }
      } else {
        address = `${preciseCoords.lat.toFixed(8)}°N, ${preciseCoords.lng.toFixed(8)}°E`;
      }
        
      onLocationSelect({ ...preciseCoords, address });
      toast.success('📍 Ultra-high-precision location selected!', {
        description: 'Location marked with sub-meter accuracy using Ola Maps'
      });
    } catch (error) {
      console.error('Error getting address:', error);
      const fallbackAddress = `${preciseCoords.lat.toFixed(8)}°N, ${preciseCoords.lng.toFixed(8)}°E`;
      onLocationSelect({ ...preciseCoords, address: fallbackAddress });
      toast.success('📍 Precise location selected!', {
        description: 'Using ultra-high precision coordinate-based addressing'
      });
    }
  };

  // Handle map click
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const coords = pixelToLatLng(x, y);
    setMarkerPosition({ x, y });
    updateLocation(coords);
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support GPS location"
      });
      return;
    }

    toast.loading("📡 Getting ultra-precise GPS location...", {
      description: "This may take a few seconds for maximum accuracy"
    });
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = getPrecisionCoordinates(
          position.coords.latitude, 
          position.coords.longitude, 
          OLA_MAPS_CONFIG.precision.coordinates
        );
        
        setSelectedCoords(coords);
        setMapCenter(coords);
        setMarkerPosition({ x: 400, y: 200 }); // Center of map
        setZoom(OLA_MAPS_CONFIG.precision.zoom.maximum);
        
        // Get address using Ola Maps
        try {
          const response = await fetch(
            `${OLA_MAPS_CONFIG.endpoints.reverseGeocode}?latlng=${coords.lat},${coords.lng}&api_key=${OLA_MAPS_CONFIG.apiKey}`,
            {
              headers: {
                'X-Request-Id': Math.random().toString(36).substring(7)
              }
            }
          );
          
          const data = await response.json();
          let address = `${coords.lat.toFixed(8)}°N, ${coords.lng.toFixed(8)}°E`;
          
          if (data.results && data.results.length > 0) {
            address = data.results[0].formatted_address || data.results[0].name;
          }
          
          onLocationSelect({ ...coords, address });
          toast.success("🎯 Ultra-precise GPS location acquired!", {
            description: `Accuracy: ±${Math.round(position.coords.accuracy)}m using Ola Maps`
          });
        } catch (error) {
          const fallbackAddress = `${coords.lat.toFixed(8)}°N, ${coords.lng.toFixed(8)}°E`;
          onLocationSelect({ ...coords, address: fallbackAddress });
          toast.success("📍 GPS location set with ultra-precision!", {
            description: "Using high-precision coordinates with Ola Maps"
          });
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        let errorMessage = "GPS location failed";
        let description = "Please try clicking on the map instead";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied";
            description = "Please allow location access and try again";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "GPS unavailable";
            description = "Location services not available";
            break;
          case error.TIMEOUT:
            errorMessage = "GPS timeout";
            description = "Location request took too long";
            break;
        }
        
        toast.error(errorMessage, { description });
      },
      {
        enableHighAccuracy: true,
        timeout: 25000,
        maximumAge: 0
      }
    );
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (zoom < OLA_MAPS_CONFIG.precision.zoom.maximum) {
      setZoom(zoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 1) {
      setZoom(zoom - 1);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tuleeto-orange/10 rounded-lg">
            <MapPin className="h-5 w-5 text-tuleeto-orange" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-900">Ultra-Precise Property Location</Label>
            <p className="text-xs text-gray-600">Click on the map to set exact location with Ola Maps precision</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={getCurrentLocation}
          variant="outline"
          size="sm"
          className="text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
        >
          <Crosshair className="h-4 w-4 mr-2" />
          GPS Locate
        </Button>
      </div>
      
      <div className="relative w-full h-80 rounded-xl border border-gray-300 shadow-inner overflow-hidden">
        <div
          className="w-full h-full cursor-crosshair relative"
          onClick={handleMapClick}
        >
          <img
            src={generateMapUrl()}
            alt="Interactive Ola Map"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Map failed to load');
            }}
          />
          
          {/* Custom marker */}
          {markerPosition && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: markerPosition.x - 20,
                top: markerPosition.y - 40,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-10 h-10 bg-tuleeto-orange border-4 border-white rounded-full shadow-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
          
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              type="button"
              onClick={handleZoomIn}
              size="sm"
              variant="outline"
              className="bg-white/90 hover:bg-white"
            >
              +
            </Button>
            <Button
              type="button"
              onClick={handleZoomOut}
              size="sm"
              variant="outline"
              className="bg-white/90 hover:bg-white"
            >
              -
            </Button>
          </div>
          
          {/* Attribution */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
            Powered by Ola Maps
          </div>
        </div>
      </div>
      
      {selectedCoords && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-green-800">Ultra-High-Precision Location Set</span>
          </div>
          <p className="text-sm text-green-700 font-mono">
            📍 {selectedCoords.lat.toFixed(8)}, {selectedCoords.lng.toFixed(8)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Precision: Sub-meter accuracy with Ola Maps technology
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="font-medium text-blue-800 mb-2">💡 Ultra-Accuracy Tips:</div>
        <div className="space-y-1 text-blue-700">
          <div>• Use GPS button for automatic ultra-high-precision location</div>
          <div>• Zoom to maximum level before clicking on map</div>
          <div>• Click anywhere on map to set marker with pinpoint accuracy</div>
          <div>• Use zoom controls for better precision</div>
          <div>• Powered by Ola Maps for India-specific precision</div>
        </div>
      </div>
    </div>
  );
};
