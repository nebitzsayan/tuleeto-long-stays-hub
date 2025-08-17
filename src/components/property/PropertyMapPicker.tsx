

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
      style: MAPBOX_CONFIG.styles.streets, // Simple street map
      center: [
        initialLocation?.lng || MAPBOX_CONFIG.defaultCenter.lng,
        initialLocation?.lat || MAPBOX_CONFIG.defaultCenter.lat
      ],
      zoom: MAPBOX_CONFIG.defaultZoom,
      pitch: 0, // Flat map, no 3D
      bearing: 0, // North up
      antialias: false // Better performance
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
  }, [mapboxToken, initialLocation]);

  const addMarker = (lng: number, lat: number) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker with simple red color
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

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput.trim());
    }
  };

  // Show token input if no token is available
  if (!mapboxToken) {
    return (
      <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-tuleeto-orange" />
          <Label className="text-sm font-medium text-gray-900">Mapbox Setup Required</Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mapbox-token" className="text-xs">Mapbox Access Token</Label>
          <Input
            id="mapbox-token"
            type="password"
            placeholder="pk.eyJ1..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="text-sm"
          />
          <Button onClick={handleTokenSubmit} size="sm" className="w-full">
            Set Token & Load Map
          </Button>
        </div>
        
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
          Get your free token at{' '}
          <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">
            mapbox.com
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-tuleeto-orange" />
          <Label className="text-sm font-medium text-gray-900">Property Location</Label>
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
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Crosshair className="h-3 w-3 mr-1" />
          )}
          {isGettingLocation ? "Getting..." : "GPS"}
        </Button>
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full h-64 rounded-lg border border-gray-300 overflow-hidden cursor-crosshair"
      />
      
      {selectedCoords && (
        <div className="bg-green-50 p-2 rounded border border-green-200">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium text-green-800">Location Selected</span>
          </div>
          <p className="text-xs text-green-700 font-mono">
            {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

