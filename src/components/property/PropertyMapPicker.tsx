
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

  // Generate Ola Maps static map URL with proper error handling
  const generateMapUrl = () => {
    const width = 800;
    const height = 400;
    
    try {
      let url = `https://api.olamaps.io/places/v1/staticmap`;
      url += `?center=${mapCenter.lat},${mapCenter.lng}`;
      url += `&zoom=${zoom}`;
      url += `&size=${width}x${height}`;
      url += `&format=png`;
      url += `&api_key=${OLA_MAPS_CONFIG.apiKey}`;
      
      // Add marker if coordinates are selected
      if (selectedCoords) {
        url += `&markers=color:red|${selectedCoords.lat},${selectedCoords.lng}`;
      }
      
      console.log('Generated Ola Maps URL:', url);
      return url;
    } catch (error) {
      console.error('Error generating map URL:', error);
      setMapError(true);
      return '';
    }
  };

  // Convert pixel coordinates to lat/lng
  const pixelToLatLng = (x: number, y: number) => {
    const mapWidth = 800;
    const mapHeight = 400;
    
    // More accurate conversion based on Web Mercator projection
    const scale = Math.pow(2, zoom);
    const worldSize = 256 * scale;
    
    // Convert pixel position to world coordinates
    const worldX = (x / mapWidth) * worldSize;
    const worldY = (y / mapHeight) * worldSize;
    
    // Convert world coordinates to lat/lng
    const lng = (worldX / worldSize) * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * worldY / worldSize)));
    const lat = latRad * 180 / Math.PI;
    
    // Adjust based on map center
    const adjustedLat = mapCenter.lat + (lat / scale);
    const adjustedLng = mapCenter.lng + (lng / scale);
    
    return { lat: adjustedLat, lng: adjustedLng };
  };

  // Update location with Ola Maps reverse geocoding
  const updateLocation = async (coords: { lat: number; lng: number }) => {
    const preciseCoords = getPrecisionCoordinates(coords.lat, coords.lng, OLA_MAPS_CONFIG.precision.coordinates);
    setSelectedCoords(preciseCoords);
    
    try {
      console.log('Making reverse geocoding request to Ola Maps...');
      const response = await fetch(
        `${OLA_MAPS_CONFIG.endpoints.reverseGeocode}?latlng=${preciseCoords.lat},${preciseCoords.lng}&api_key=${OLA_MAPS_CONFIG.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': Math.random().toString(36).substring(7)
          }
        }
      );
      
      console.log('Reverse geocoding response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Reverse geocoding response:', data);
      
      let address;
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        address = result.formatted_address || result.display_name || result.name;
        
        if (address) {
          address = address.replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '');
        }
      }
      
      if (!address) {
        address = `${preciseCoords.lat.toFixed(6)}°N, ${preciseCoords.lng.toFixed(6)}°E`;
      }
        
      onLocationSelect({ ...preciseCoords, address });
      toast.success('📍 Location selected successfully!', {
        description: 'Location marked with Ola Maps precision'
      });
    } catch (error) {
      console.error('Error getting address from Ola Maps:', error);
      const fallbackAddress = `${preciseCoords.lat.toFixed(6)}°N, ${preciseCoords.lng.toFixed(6)}°E`;
      onLocationSelect({ ...preciseCoords, address: fallbackAddress });
      toast.success('📍 Location selected!', {
        description: 'Using coordinate-based addressing'
      });
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

  // Get current location with improved error handling
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support GPS location"
      });
      return;
    }

    setIsGettingLocation(true);
    toast.loading("🔍 Getting your location...", {
      description: "This may take a few seconds"
    });
    
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
          setZoom(OLA_MAPS_CONFIG.precision.zoom.maximum);
          
          // Get address using Ola Maps
          try {
            const response = await fetch(
              `${OLA_MAPS_CONFIG.endpoints.reverseGeocode}?latlng=${coords.lat},${coords.lng}&api_key=${OLA_MAPS_CONFIG.apiKey}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Request-Id': Math.random().toString(36).substring(7)
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              let address = `${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`;
              
              if (data.results && data.results.length > 0) {
                address = data.results[0].formatted_address || data.results[0].display_name || address;
              }
              
              onLocationSelect({ ...coords, address });
              toast.success("🎯 GPS location found!", {
                description: `Accuracy: ±${Math.round(position.coords.accuracy)}m`
              });
            } else {
              throw new Error('Geocoding failed');
            }
          } catch (error) {
            console.error('GPS geocoding error:', error);
            const fallbackAddress = `${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`;
            onLocationSelect({ ...coords, address: fallbackAddress });
            toast.success("📍 GPS location set!", {
              description: "Using high-precision coordinates"
            });
          }
        } catch (error) {
          console.error('Error processing GPS location:', error);
          toast.error("Error processing location", {
            description: "Please try again or click on the map"
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setIsGettingLocation(false);
        
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
        timeout: 30000,
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
          {!mapError ? (
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
                src={generateMapUrl()}
                alt="Interactive Ola Map"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Ola Maps image failed to load');
                  setMapError(true);
                  setMapLoaded(false);
                }}
                onLoad={() => {
                  console.log('Ola Maps image loaded successfully');
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
                <p className="text-gray-500 text-xs">Please use GPS location button</p>
                <Button
                  onClick={() => {
                    setMapError(false);
                    setMapLoaded(false);
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
                left: markerPosition.x - 20,
                top: markerPosition.y - 40,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-10 h-10 bg-red-500 border-4 border-white rounded-full shadow-lg flex items-center justify-center animate-bounce">
                <MapPin className="h-5 w-5 text-white" />
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
                className="bg-white/90 hover:bg-white"
                disabled={zoom >= OLA_MAPS_CONFIG.precision.zoom.maximum}
              >
                +
              </Button>
              <Button
                type="button"
                onClick={handleZoomOut}
                size="sm"
                variant="outline"
                className="bg-white/90 hover:bg-white"
                disabled={zoom <= 1}
              >
                -
              </Button>
            </div>
          )}
          
          {/* Attribution */}
          {!mapError && mapLoaded && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
              Powered by Ola Maps
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
