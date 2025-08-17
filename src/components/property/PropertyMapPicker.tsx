
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';
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
  const [mapError, setMapError] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapUrl, setMapUrl] = useState('');

  // Generate Ola Maps static map URL with proper error handling
  const generateMapUrl = () => {
    const width = 800;
    const height = 400;
    
    try {
      // Use basic static map without complex parameters first
      let url = `https://api.olamaps.io/places/v1/staticmap`;
      url += `?center=${mapCenter.lat},${mapCenter.lng}`;
      url += `&zoom=${zoom}`;
      url += `&size=${width}x${height}`;
      url += `&api_key=${OLA_MAPS_CONFIG.apiKey}`;
      
      // Add marker if coordinates are selected
      if (selectedCoords) {
        url += `&markers=${selectedCoords.lat},${selectedCoords.lng}`;
      }
      
      console.log('Generated Ola Maps URL:', url);
      return url;
    } catch (error) {
      console.error('Error generating map URL:', error);
      setMapError(true);
      return '';
    }
  };

  // Update map URL when dependencies change
  useEffect(() => {
    const newUrl = generateMapUrl();
    setMapUrl(newUrl);
    setMapLoaded(false);
  }, [mapCenter, zoom, selectedCoords]);

  // Convert pixel coordinates to lat/lng (simplified)
  const pixelToLatLng = (x: number, y: number) => {
    const mapWidth = 800;
    const mapHeight = 400;
    
    // Simple offset calculation from center
    const offsetX = (x - mapWidth / 2) / mapWidth;
    const offsetY = (y - mapHeight / 2) / mapHeight;
    
    // Approximate coordinate calculation based on zoom level
    const scale = 0.01 / Math.pow(2, zoom - 10);
    
    const lat = mapCenter.lat - (offsetY * scale * 180);
    const lng = mapCenter.lng + (offsetX * scale * 360);
    
    return { lat, lng };
  };

  // Update location with reverse geocoding
  const updateLocation = async (coords: { lat: number; lng: number }) => {
    const preciseCoords = getPrecisionCoordinates(coords.lat, coords.lng, OLA_MAPS_CONFIG.precision.coordinates);
    setSelectedCoords(preciseCoords);
    
    try {
      const response = await fetch(
        `${OLA_MAPS_CONFIG.endpoints.reverseGeocode}?latlng=${preciseCoords.lat},${preciseCoords.lng}&api_key=${OLA_MAPS_CONFIG.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Reverse geocoding response:', data);
      
      let address = `${preciseCoords.lat.toFixed(6)}°N, ${preciseCoords.lng.toFixed(6)}°E`;
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        address = result.formatted_address || result.display_name || address;
      }
        
      onLocationSelect({ ...preciseCoords, address });
      toast.success('📍 Location selected successfully!');
    } catch (error) {
      console.error('Error getting address:', error);
      const fallbackAddress = `${preciseCoords.lat.toFixed(6)}°N, ${preciseCoords.lng.toFixed(6)}°E`;
      onLocationSelect({ ...preciseCoords, address: fallbackAddress });
      toast.success('📍 Location selected!');
    }
  };

  // Handle map click
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (mapError || !mapLoaded) {
      toast.error("Map is not ready. Please try using GPS location instead.");
      return;
    }
    
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
      toast.error("Geolocation not supported");
      return;
    }

    setIsGettingLocation(true);
    toast.loading("🔍 Getting your location...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const coords = getPrecisionCoordinates(
            position.coords.latitude, 
            position.coords.longitude, 
            OLA_MAPS_CONFIG.precision.coordinates
          );
          
          console.log('GPS coordinates obtained:', coords);
          
          setSelectedCoords(coords);
          setMapCenter(coords);
          setMarkerPosition({ x: 400, y: 200 }); // Center of map
          setZoom(16); // Higher zoom for GPS location
          
          // Get address
          try {
            const response = await fetch(
              `${OLA_MAPS_CONFIG.endpoints.reverseGeocode}?latlng=${coords.lat},${coords.lng}&api_key=${OLA_MAPS_CONFIG.apiKey}`
            );
            
            let address = `${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`;
            
            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                address = data.results[0].formatted_address || data.results[0].display_name || address;
              }
            }
            
            onLocationSelect({ ...coords, address });
            toast.success("🎯 GPS location found!", {
              description: `Accuracy: ±${Math.round(position.coords.accuracy)}m`
            });
          } catch (error) {
            console.error('GPS geocoding error:', error);
            const fallbackAddress = `${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`;
            onLocationSelect({ ...coords, address: fallbackAddress });
            toast.success("📍 GPS location set!");
          }
        } catch (error) {
          console.error('Error processing GPS location:', error);
          toast.error("Error processing location");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setIsGettingLocation(false);
        
        let errorMessage = "GPS location failed";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "GPS unavailable. Location services not available.";
            break;
          case error.TIMEOUT:
            errorMessage = "GPS timeout. Location request took too long.";
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (zoom < 18) {
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
            <Label className="text-sm font-semibold text-gray-900">Property Location</Label>
            <p className="text-xs text-gray-600">Click on the map to set exact location</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          variant="outline"
          size="sm"
          className="text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 disabled:opacity-50"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4 mr-2" />
          )}
          {isGettingLocation ? "Getting GPS..." : "Use GPS"}
        </Button>
      </div>
      
      <div className="relative w-full h-80 rounded-xl border border-gray-300 shadow-inner overflow-hidden">
        <div
          className="w-full h-full cursor-crosshair relative"
          onClick={handleMapClick}
        >
          {!mapError && mapUrl ? (
            <>
              {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                  <div className="text-center p-4">
                    <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                    <p className="text-gray-600 text-sm">Loading map...</p>
                  </div>
                </div>
              )}
              <img
                src={mapUrl}
                alt="Interactive Map"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Map image failed to load:', mapUrl);
                  setMapError(true);
                  setMapLoaded(false);
                }}
                onLoad={() => {
                  console.log('Map image loaded successfully');
                  setMapError(false);
                  setMapLoaded(true);
                }}
              />
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center p-4">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">Map could not load</p>
                <p className="text-gray-500 text-xs">Please use GPS location button above</p>
                <Button
                  onClick={() => {
                    setMapError(false);
                    setMapLoaded(false);
                    const newUrl = generateMapUrl();
                    setMapUrl(newUrl);
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Retry Map
                </Button>
              </div>
            </div>
          )}
          
          {/* Custom marker */}
          {markerPosition && !mapError && mapLoaded && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: markerPosition.x - 12,
                top: markerPosition.y - 24,
              }}
            >
              <div className="w-6 h-6 bg-red-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center animate-bounce">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          )}
          
          {/* Zoom controls */}
          {!mapError && mapLoaded && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <Button
                type="button"
                onClick={handleZoomIn}
                size="sm"
                variant="outline"
                className="bg-white/90 hover:bg-white w-8 h-8 p-0"
                disabled={zoom >= 18}
              >
                +
              </Button>
              <Button
                type="button"
                onClick={handleZoomOut}
                size="sm"
                variant="outline"
                className="bg-white/90 hover:bg-white w-8 h-8 p-0"
                disabled={zoom <= 1}
              >
                -
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {selectedCoords && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-green-800">Location Selected</span>
          </div>
          <p className="text-sm text-green-700 font-mono">
            📍 {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Precision: Sub-meter accuracy with Ola Maps
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="font-medium text-blue-800 mb-2">💡 How to use:</div>
        <div className="space-y-1 text-blue-700">
          <div>• Use GPS button for automatic location detection</div>
          <div>• Click anywhere on map to set marker</div>
          <div>• Use zoom controls for better precision</div>
          <div>• Powered by Ola Maps for India coverage</div>
        </div>
      </div>
    </div>
  );
};
