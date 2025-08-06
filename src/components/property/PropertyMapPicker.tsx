
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Crosshair } from 'lucide-react';
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

    // Default to Siliguri, India with high precision coordinates
    const defaultCenter: [number, number] = initialLocation 
      ? [initialLocation.lng, initialLocation.lat] 
      : [88.428421, 26.727066];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Clean street map style
      center: defaultCenter,
      zoom: 16, // High zoom for accuracy
      pitch: 0,
      bearing: 0,
      maxZoom: 20
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: false
    }), 'top-right');
    
    // Add geolocate control for accurate positioning
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      },
      trackUserLocation: false,
      showAccuracyCircle: true,
      showUserHeading: false
    });
    
    map.current.addControl(geolocateControl, 'top-right');
    
    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // Create high-precision custom marker
    const markerElement = document.createElement('div');
    markerElement.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: #ff6600;
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 16px;
          height: 16px;
          background: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `;

    marker.current = new mapboxgl.Marker({ 
      element: markerElement,
      draggable: true 
    })
      .setLngLat(defaultCenter)
      .addTo(map.current);

    const updateLocation = async (lngLat: mapboxgl.LngLat) => {
      // Ultra-high precision coordinates (8 decimal places for ~1mm accuracy)
      const coords = { 
        lat: Math.round(lngLat.lat * 100000000) / 100000000,
        lng: Math.round(lngLat.lng * 100000000) / 100000000
      };
      
      setSelectedCoords(coords);
      
      // Enhanced reverse geocoding
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${mapboxgl.accessToken}&limit=1&types=address,poi,place&proximity=${coords.lng},${coords.lat}&language=en`
        );
        
        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        let address;
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          address = feature.place_name || feature.text;
          
          // Clean up the address for better readability
          if (address) {
            address = address.replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '');
          }
        } else {
          address = `${coords.lat.toFixed(7)}°N, ${coords.lng.toFixed(7)}°E`;
        }
          
        onLocationSelect({ ...coords, address });
        toast.success('📍 High-precision location selected!', {
          description: 'Location marked with maximum accuracy'
        });
      } catch (error) {
        console.error('Error getting address:', error);
        const fallbackAddress = `${coords.lat.toFixed(7)}°N, ${coords.lng.toFixed(7)}°E`;
        onLocationSelect({ ...coords, address: fallbackAddress });
        toast.success('📍 Location selected!', {
          description: 'Using coordinate-based addressing'
        });
      }
    };

    // Handle marker drag
    marker.current.on('dragstart', () => {
      markerElement.style.cursor = 'grabbing';
    });

    marker.current.on('drag', () => {
      // Visual feedback during drag
      markerElement.style.transform = 'scale(1.1) rotate(-45deg)';
    });

    marker.current.on('dragend', () => {
      markerElement.style.cursor = 'grab';
      markerElement.style.transform = 'scale(1) rotate(-45deg)';
      const lngLat = marker.current!.getLngLat();
      updateLocation(lngLat);
    });

    // Handle map clicks
    map.current.on('click', (e) => {
      marker.current!.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      updateLocation(e.lngLat);
    });

    // Add crosshair cursor
    map.current.on('mouseenter', () => {
      map.current!.getCanvas().style.cursor = 'crosshair';
    });

    // Handle geolocate events
    geolocateControl.on('geolocate', (e) => {
      const coords = {
        lat: Math.round(e.coords.latitude * 100000000) / 100000000,
        lng: Math.round(e.coords.longitude * 100000000) / 100000000
      };
      
      setSelectedCoords(coords);
      marker.current?.setLngLat([coords.lng, coords.lat]);
      
      // Get address for GPS location
      updateLocation(new mapboxgl.LngLat(coords.lng, coords.lat));
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [initialLocation, onLocationSelect]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support GPS location"
      });
      return;
    }

    toast.loading("📡 Getting precise GPS location...", {
      description: "This may take a few seconds for maximum accuracy"
    });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: Math.round(position.coords.latitude * 100000000) / 100000000,
          lng: Math.round(position.coords.longitude * 100000000) / 100000000
        };
        
        setSelectedCoords(coords);
        marker.current?.setLngLat([coords.lng, coords.lat]);
        map.current?.flyTo({ 
          center: [coords.lng, coords.lat], 
          zoom: 18,
          duration: 2000,
          essential: true
        });
        
        // Get high-accuracy address
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${mapboxgl.accessToken}&limit=1&types=address,poi&language=en`)
          .then(response => response.json())
          .then(data => {
            let address = `${coords.lat.toFixed(7)}°N, ${coords.lng.toFixed(7)}°E`;
            if (data.features && data.features.length > 0) {
              address = data.features[0].place_name || data.features[0].text;
            }
            onLocationSelect({ ...coords, address });
            toast.success("🎯 GPS location acquired!", {
              description: `Accuracy: ±${Math.round(position.coords.accuracy)}m`
            });
          })
          .catch(() => {
            const fallbackAddress = `${coords.lat.toFixed(7)}°N, ${coords.lng.toFixed(7)}°E`;
            onLocationSelect({ ...coords, address: fallbackAddress });
            toast.success("📍 GPS location set!", {
              description: "Using high-precision coordinates"
            });
          });
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
        timeout: 20000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tuleeto-orange/10 rounded-lg">
            <MapPin className="h-5 w-5 text-tuleeto-orange" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-900">Property Location Marker</Label>
            <p className="text-xs text-gray-600">Click or drag to set exact location</p>
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
      
      <div 
        ref={mapContainer} 
        className="w-full h-80 rounded-xl border border-gray-300 shadow-inner"
        style={{ minHeight: '320px' }}
      />
      
      {selectedCoords && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-green-800">High-Precision Location Set</span>
          </div>
          <p className="text-sm text-green-700 font-mono">
            📍 {selectedCoords.lat.toFixed(7)}, {selectedCoords.lng.toFixed(7)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Precision: ~1 meter accuracy
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="font-medium text-blue-800 mb-2">💡 Accuracy Tips:</div>
        <div className="space-y-1 text-blue-700">
          <div>• Use GPS button for automatic high-precision location</div>
          <div>• Zoom to maximum level before placing marker</div>
          <div>• Drag marker for fine position adjustment</div>
          <div>• Click map to quickly relocate marker</div>
        </div>
      </div>
    </div>
  );
};
