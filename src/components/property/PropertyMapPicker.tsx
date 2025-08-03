
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Set the Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2F5YW5nYXllbiIsImEiOiJjbWR1Y2V5dHowaGs0Mmxxd2t0OGw2cDVxIn0.MTK_Fk7k7ApP20VUhBm9_g';

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

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map centered on Siliguri with better precision
    const defaultCenter: [number, number] = initialLocation 
      ? [initialLocation.lng, initialLocation.lat] 
      : [88.4285, 26.7271]; // More precise Siliguri coordinates

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: defaultCenter,
      zoom: 15, // Higher zoom for better accuracy
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create a more precise draggable marker
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDguMDEgMTkuOTkgNi4xNiAxOC4zNiA0LjY0QzE2LjczIDMuMTIgMTQuNDcgMiAxMiAyQzkuNTMgMiA3LjI3IDMuMTIgNS42NCA0LjY0QzQuMDEgNi4xNiAzIDguMDEgMyAxMEMzIDEyIDMgMTQgMyAxNkMzIDEzLjggMiAxMS42IDIgMTBDMiA1LjUgNi41IDIgMTIgMkMxNy41IDIgMjIgNS41IDIyIDEwQzIyIDExLjYgMjEgMTMuOCAyMSAxNkMyMSAxNCAyMSAxMiAyMSAxMFoiIGZpbGw9IiNGRjY2MDAiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4K)';
    markerElement.style.width = '24px';
    markerElement.style.height = '24px';
    markerElement.style.backgroundSize = 'contain';
    markerElement.style.cursor = 'pointer';

    marker.current = new mapboxgl.Marker({ 
      element: markerElement,
      draggable: true 
    })
      .setLngLat(defaultCenter)
      .addTo(map.current);

    const updateLocation = async (lngLat: mapboxgl.LngLat) => {
      // Round coordinates to higher precision for better accuracy
      const coords = { 
        lat: Math.round(lngLat.lat * 1000000) / 1000000, 
        lng: Math.round(lngLat.lng * 1000000) / 1000000 
      };
      
      setSelectedCoords(coords);
      
      // Try to get address from coordinates with better error handling
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${mapboxgl.accessToken}&limit=1`
        );
        
        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        const address = data.features && data.features.length > 0 
          ? data.features[0].place_name 
          : `${coords.lat}, ${coords.lng}`;
          
        onLocationSelect({ ...coords, address });
        toast.success('Location selected successfully!');
      } catch (error) {
        console.error('Error getting address:', error);
        const fallbackAddress = `${coords.lat}, ${coords.lng}`;
        onLocationSelect({ ...coords, address: fallbackAddress });
        toast.success('Location selected (using coordinates)!');
      }
    };

    // Handle marker drag end
    marker.current.on('dragend', () => {
      const lngLat = marker.current!.getLngLat();
      updateLocation(lngLat);
    });

    // Handle map clicks with improved precision
    map.current.on('click', (e) => {
      marker.current!.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      updateLocation(e.lngLat);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [initialLocation, onLocationSelect]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: Math.round(position.coords.latitude * 1000000) / 1000000,
          lng: Math.round(position.coords.longitude * 1000000) / 1000000
        };
        
        setSelectedCoords(coords);
        marker.current?.setLngLat([coords.lng, coords.lat]);
        map.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 16 });
        
        // Get address and notify parent
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${mapboxgl.accessToken}&limit=1`)
          .then(response => response.json())
          .then(data => {
            const address = data.features && data.features.length > 0 
              ? data.features[0].place_name 
              : `${coords.lat}, ${coords.lng}`;
            onLocationSelect({ ...coords, address });
          })
          .catch(() => {
            const fallbackAddress = `${coords.lat}, ${coords.lng}`;
            onLocationSelect({ ...coords, address: fallbackAddress });
          });
          
        toast.success("Location updated to your current position!");
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get current location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-tuleeto-orange" />
          <Label className="text-sm font-medium">Mark Property Location on Map</Label>
        </div>
        <Button
          type="button"
          onClick={getCurrentLocation}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Use Current Location
        </Button>
      </div>
      
      <p className="text-sm text-gray-600">
        Click on the map or drag the marker to mark your property's exact location.
      </p>
      
      <div 
        ref={mapContainer} 
        className="w-full h-64 rounded-lg border border-gray-300"
        style={{ minHeight: '256px' }}
      />
      
      {selectedCoords && (
        <div className="bg-green-50 p-3 rounded-md">
          <p className="text-sm text-green-800">
            📍 Selected location: {selectedCoords.lat}, {selectedCoords.lng}
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        💡 Tip: Drag the orange marker or click anywhere on the map to set your property location with high precision.
      </div>
    </div>
  );
};
