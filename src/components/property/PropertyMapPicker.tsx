
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_CONFIG, getPrecisionCoordinates, reverseGeocode } from '@/lib/mapboxConfig';

interface PropertyMapPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
}

export const PropertyMapPicker = ({ onLocationSelect, initialLocation }: PropertyMapPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapboxToken, setMapboxToken] = useState(MAPBOX_CONFIG.accessToken);
  const [tokenInput, setTokenInput] = useState('');

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.styles.streets,
      center: [
        initialLocation?.lng || MAPBOX_CONFIG.defaultCenter.lng,
        initialLocation?.lat || MAPBOX_CONFIG.defaultCenter.lat
      ],
      zoom: MAPBOX_CONFIG.defaultZoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler
    map.current.on('click', (e) => {
      const coords = {
        lat: e.lngLat.lat,
        lng: e.lngLat.lng
      };
      updateLocation(coords);
    });

    // Add initial marker if location is provided
    if (initialLocation) {
      addMarker(initialLocation.lng, initialLocation.lat);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, initialLocation]);

  const addMarker = (lng: number, lat: number) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker
    marker.current = new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([lng, lat])
      .addTo(map.current);
  };

  const updateLocation = async (coords: { lat: number; lng: number }) => {
    const preciseCoords = getPrecisionCoordinates(coords.lat, coords.lng, 8);
    setSelectedCoords(preciseCoords);
    
    // Add marker to map
    addMarker(preciseCoords.lng, preciseCoords.lat);
    
    try {
      const data = await reverseGeocode(preciseCoords.lat, preciseCoords.lng);
      
      let address = `${preciseCoords.lat.toFixed(6)}°N, ${preciseCoords.lng.toFixed(6)}°E`;
      
      if (data.features && data.features.length > 0) {
        address = data.features[0].place_name || address;
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
            8
          );
          
          setSelectedCoords(coords);
          
          // Center map on user location
          if (map.current) {
            map.current.flyTo({
              center: [coords.lng, coords.lat],
              zoom: 16
            });
          }
          
          // Add marker
          addMarker(coords.lng, coords.lat);
          
          // Get address
          try {
            const data = await reverseGeocode(coords.lat, coords.lng);
            let address = `${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`;
            
            if (data.features && data.features.length > 0) {
              address = data.features[0].place_name || address;
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

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput.trim());
      toast.success('Mapbox token set! Map will reload.');
    } else {
      toast.error('Please enter a valid Mapbox token');
    }
  };

  // Show token input if no token is available
  if (!mapboxToken) {
    return (
      <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tuleeto-orange/10 rounded-lg">
            <MapPin className="h-5 w-5 text-tuleeto-orange" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-900">Mapbox Setup Required</Label>
            <p className="text-xs text-gray-600">Enter your Mapbox access token to use the map</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="mapbox-token" className="text-sm">Mapbox Access Token</Label>
            <Input
              id="mapbox-token"
              type="password"
              placeholder="pk.eyJ1..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={handleTokenSubmit} className="w-full">
            Set Token & Load Map
          </Button>
          <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            💡 Get your free Mapbox token at{' '}
            <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">
              mapbox.com
            </a>
            {' '}→ Account → Access Tokens
          </div>
        </div>
      </div>
    );
  }

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
      
      <div 
        ref={mapContainer} 
        className="w-full h-80 rounded-xl border border-gray-300 shadow-inner overflow-hidden cursor-crosshair"
      />
      
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
            High precision coordinates with Mapbox
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="font-medium text-blue-800 mb-2">💡 How to use:</div>
        <div className="space-y-1 text-blue-700">
          <div>• Use GPS button for automatic location detection</div>
          <div>• Click anywhere on map to set marker</div>
          <div>• Use map controls to zoom and navigate</div>
          <div>• Powered by Mapbox for global coverage</div>
        </div>
      </div>
    </div>
  );
};
