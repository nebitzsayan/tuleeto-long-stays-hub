
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_CONFIG, getPrecisionCoordinates, reverseGeocode, forwardGeocode } from '@/lib/mapboxConfig';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.styles.streets,
      center: [
        initialLocation?.lng || MAPBOX_CONFIG.defaultCenter.lng,
        initialLocation?.lat || MAPBOX_CONFIG.defaultCenter.lat
      ],
      zoom: MAPBOX_CONFIG.defaultZoom,
      pitch: 0,
      bearing: 0,
      antialias: false
    });

    // Add simple navigation controls
    map.current.addControl(new mapboxgl.NavigationControl({
      showCompass: false,
      showZoom: true,
      visualizePitch: false
    }), 'top-right');

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
  }, [initialLocation]);

  const addMarker = (lng: number, lat: number) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker with red color
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
    } catch (error) {
      console.error('Error getting address:', error);
      const fallbackAddress = `${preciseCoords.lat.toFixed(6)}°N, ${preciseCoords.lng.toFixed(6)}°E`;
      onLocationSelect({ ...preciseCoords, address: fallbackAddress });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsGettingLocation(true);
    
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
          } catch (error) {
            console.error('GPS geocoding error:', error);
            const fallbackAddress = `${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`;
            onLocationSelect({ ...coords, address: fallbackAddress });
          }
        } catch (error) {
          console.error('Error processing GPS location:', error);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const data = await forwardGeocode(searchQuery);
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const coords = {
          lat: feature.center[1],
          lng: feature.center[0]
        };
        
        // Fly to the searched location
        if (map.current) {
          map.current.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 16
          });
        }
        
        updateLocation(coords);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-tuleeto-orange" />
          <Label className="text-sm font-medium text-gray-900">Select Property Location</Label>
        </div>
        <Button
          type="button"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          variant="outline"
          size="sm"
          className="text-xs h-8 px-2"
        >
          {isGettingLocation ? (
            <div className="h-3 w-3 mr-1 animate-spin border border-current border-t-transparent rounded-full" />
          ) : (
            <Crosshair className="h-3 w-3 mr-1" />
          )}
          {isGettingLocation ? "Getting..." : "GPS"}
        </Button>
      </div>

      {/* Search Box */}
      <div className="flex gap-2">
        <Input
          placeholder="Search for an address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="text-sm"
        />
        <Button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          size="sm"
          variant="outline"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
        💡 Click anywhere on the map to mark your property's exact location, or search for an address above.
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full h-80 rounded-lg border border-gray-300 overflow-hidden cursor-crosshair"
      />
      
      {selectedCoords && (
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">Location Selected</span>
          </div>
          <p className="text-xs text-green-700 font-mono">
            {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};
