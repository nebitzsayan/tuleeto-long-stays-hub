
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

    // Initialize map with high precision coordinates for better accuracy
    const defaultCenter: [number, number] = initialLocation 
      ? [initialLocation.lng, initialLocation.lat] 
      : [88.428421, 26.727066]; // More precise Siliguri coordinates

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Use satellite view for better accuracy
      center: defaultCenter,
      zoom: 18, // Very high zoom for maximum precision
      pitch: 0,
      bearing: 0,
      maxZoom: 22 // Allow maximum zoom for street-level accuracy
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add scale control for distance reference
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }));

    // Create a high-precision draggable marker
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1IDNDMTAuMDMgMyA2IDcuMDMgNiAxMkM2IDE4IDEwIDI0IDE1IDI3QzIwIDI0IDI0IDE4IDI0IDEyQzI0IDcuMDMgMTkuOTcgMyAxNSAzWk0xNSAxNi41QzEzLjA3IDE2LjUgMTEuNSAxNC45MyAxMS41IDEzQzExLjUgMTEuMDcgMTMuMDcgOS41IDE1IDkuNUMxNi45MyA5LjUgMTguNSAxMS4wNyAxOC41IDEzQzE4LjUgMTQuOTMgMTYuOTMgMTYuNSAxNSAxNi41WiIgZmlsbD0iI0ZGNjYwMCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+)';
    markerElement.style.width = '30px';
    markerElement.style.height = '30px';
    markerElement.style.backgroundSize = 'contain';
    markerElement.style.cursor = 'crosshair';
    markerElement.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

    marker.current = new mapboxgl.Marker({ 
      element: markerElement,
      draggable: true 
    })
      .setLngLat(defaultCenter)
      .addTo(map.current);

    const updateLocation = async (lngLat: mapboxgl.LngLat) => {
      // Use maximum precision for coordinates
      const coords = { 
        lat: Math.round(lngLat.lat * 10000000) / 10000000, // 7 decimal places for ~1cm accuracy
        lng: Math.round(lngLat.lng * 10000000) / 10000000 
      };
      
      setSelectedCoords(coords);
      
      // Enhanced geocoding with multiple fallback attempts
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${mapboxgl.accessToken}&limit=1&types=address,poi&proximity=${coords.lng},${coords.lat}`
        );
        
        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        let address;
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          address = feature.place_name;
          // If we have a more specific address, use it
          if (feature.properties?.address) {
            address = `${feature.properties.address}, ${feature.text}`;
          }
        } else {
          // Fallback to a more readable coordinate format
          address = `${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`;
        }
          
        onLocationSelect({ ...coords, address });
        toast.success('📍 High-precision location selected!');
      } catch (error) {
        console.error('Error getting address:', error);
        const fallbackAddress = `${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`;
        onLocationSelect({ ...coords, address: fallbackAddress });
        toast.success('📍 Location selected (coordinates mode)!');
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

    // Add crosshair cursor when hovering over map
    map.current.on('mouseenter', () => {
      map.current!.getCanvas().style.cursor = 'crosshair';
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
          lat: Math.round(position.coords.latitude * 10000000) / 10000000,
          lng: Math.round(position.coords.longitude * 10000000) / 10000000
        };
        
        setSelectedCoords(coords);
        marker.current?.setLngLat([coords.lng, coords.lat]);
        map.current?.flyTo({ 
          center: [coords.lng, coords.lat], 
          zoom: 18,
          duration: 2000
        });
        
        // Get high-accuracy address
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${mapboxgl.accessToken}&limit=1&types=address,poi`)
          .then(response => response.json())
          .then(data => {
            let address = `${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`;
            if (data.features && data.features.length > 0) {
              address = data.features[0].place_name;
            }
            onLocationSelect({ ...coords, address });
            toast.success("🎯 High-accuracy location detected!");
          })
          .catch(() => {
            const fallbackAddress = `${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`;
            onLocationSelect({ ...coords, address: fallbackAddress });
            toast.success("📍 Current location detected!");
          });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get current location. Please try clicking on the map.");
      },
      {
        enableHighAccuracy: true, // Request GPS accuracy
        timeout: 15000, // Increased timeout for GPS
        maximumAge: 0 // Always get fresh location
      }
    );
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-tuleeto-orange" />
          <Label className="text-sm font-medium">Mark Exact Property Location</Label>
        </div>
        <Button
          type="button"
          onClick={getCurrentLocation}
          variant="outline"
          size="sm"
          className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          🎯 GPS Location
        </Button>
      </div>
      
      <p className="text-sm text-gray-600">
        Use satellite view for maximum accuracy. Click or drag the marker to pinpoint your exact property location.
      </p>
      
      <div 
        ref={mapContainer} 
        className="w-full h-80 rounded-lg border border-gray-300 shadow-sm"
        style={{ minHeight: '320px' }}
      />
      
      {selectedCoords && (
        <div className="bg-green-50 p-3 rounded-md border border-green-200">
          <p className="text-sm text-green-800 font-medium">
            📍 High-Precision Location Set
          </p>
          <p className="text-xs text-green-700 mt-1">
            Coordinates: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
        💡 <strong>Tips for accuracy:</strong>
        <br/>• Use the GPS button for automatic high-precision location
        <br/>• Zoom in as much as possible before placing the marker  
        <br/>• Use satellite view to identify exact building location
        <br/>• Drag the marker for fine-tuning position
      </div>
    </div>
  );
};
