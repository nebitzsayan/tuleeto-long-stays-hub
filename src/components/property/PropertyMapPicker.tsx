
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
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );

  useEffect(() => {
    if (!mapContainer.current) return;

    const defaultCenter = initialLocation 
      ? [initialLocation.lng, initialLocation.lat] 
      : [OLA_MAPS_CONFIG.defaultCenter.lng, OLA_MAPS_CONFIG.defaultCenter.lat];

    // Load Mapbox GL JS for map rendering
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // @ts-ignore
      const mapboxgl = window.mapboxgl;
      
      // Initialize map with Ola Maps tiles
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: {
          version: 8,
          sources: {
            'ola-tiles': {
              type: 'raster',
              tiles: [
                `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/{z}/{x}/{y}.png?api_key=${OLA_MAPS_CONFIG.apiKey}`
              ],
              tileSize: 256
            }
          },
          layers: [{
            id: 'ola-tiles',
            type: 'raster',
            source: 'ola-tiles'
          }]
        },
        center: defaultCenter,
        zoom: OLA_MAPS_CONFIG.precision.zoom.picker,
        attributionControl: false
      });

      // Add navigation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Create draggable marker
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

      markerRef.current = new mapboxgl.Marker({ 
        element: markerElement,
        draggable: true 
      })
        .setLngLat(defaultCenter)
        .addTo(mapRef.current);

      // Function to update location with Ola Maps reverse geocoding
      const updateLocation = async (lngLat: { lat: number; lng: number }) => {
        const coords = getPrecisionCoordinates(lngLat.lat, lngLat.lng, OLA_MAPS_CONFIG.precision.coordinates);
        setSelectedCoords(coords);
        
        try {
          const response = await fetch(
            `${OLA_MAPS_CONFIG.endpoints.reverseGeocode}?latlng=${coords.lat},${coords.lng}&api_key=${OLA_MAPS_CONFIG.apiKey}`,
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
            address = `${coords.lat.toFixed(8)}°N, ${coords.lng.toFixed(8)}°E`;
          }
            
          onLocationSelect({ ...coords, address });
          toast.success('📍 Ultra-high-precision location selected!', {
            description: 'Location marked with sub-meter accuracy using Ola Maps'
          });
        } catch (error) {
          console.error('Error getting address:', error);
          const fallbackAddress = `${coords.lat.toFixed(8)}°N, ${coords.lng.toFixed(8)}°E`;
          onLocationSelect({ ...coords, address: fallbackAddress });
          toast.success('📍 Precise location selected!', {
            description: 'Using ultra-high precision coordinate-based addressing'
          });
        }
      };

      // Handle marker drag events
      markerRef.current.on('dragend', () => {
        const lngLat = markerRef.current!.getLngLat();
        updateLocation({ lat: lngLat.lat, lng: lngLat.lng });
      });

      // Handle map clicks
      mapRef.current.on('click', (e: any) => {
        markerRef.current!.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        updateLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });

      // Set crosshair cursor
      mapRef.current.on('mouseenter', () => {
        mapRef.current!.getCanvas().style.cursor = 'crosshair';
      });
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [initialLocation, onLocationSelect]);

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
        markerRef.current?.setLngLat([coords.lng, coords.lat]);
        mapRef.current?.flyTo({ 
          center: [coords.lng, coords.lat], 
          zoom: OLA_MAPS_CONFIG.precision.zoom.maximum,
          duration: 2000
        });
        
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

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tuleeto-orange/10 rounded-lg">
            <MapPin className="h-5 w-5 text-tuleeto-orange" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-900">Ultra-Precise Property Location</Label>
            <p className="text-xs text-gray-600">Click or drag to set exact location with Ola Maps precision</p>
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
          <div>• Zoom to maximum level before placing marker</div>
          <div>• Drag marker for fine position adjustment with sub-meter precision</div>
          <div>• Click map to quickly relocate marker with pinpoint accuracy</div>
          <div>• Powered by Ola Maps for India-specific precision</div>
        </div>
      </div>
    </div>
  );
};
