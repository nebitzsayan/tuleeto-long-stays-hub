
import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OLA_MAPS_CONFIG } from '@/lib/olaMapsConfig';

interface PropertyMapDisplayProps {
  coordinates: { lat: number; lng: number };
  title: string;
  location: string;
  showMarker?: boolean;
}

export const PropertyMapDisplay = ({ coordinates, title, location, showMarker = true }: PropertyMapDisplayProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Create map using Ola Maps tile service
    const initializeMap = () => {
      // Load Mapbox GL JS for tile rendering (free for tile display)
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // @ts-ignore
        const mapboxgl = window.mapboxgl;
        
        // Initialize with Ola Maps tiles
        const map = new mapboxgl.Map({
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
          center: [coordinates.lng, coordinates.lat],
          zoom: showMarker ? 16 : 10,
          attributionControl: false
        });

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add custom marker if coordinates are available
        if (showMarker) {
          // Create custom marker element
          const markerElement = document.createElement('div');
          markerElement.innerHTML = `
            <div style="
              position: relative;
              width: 50px;
              height: 50px;
            ">
              <div style="
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #ff6600 0%, #ff8533 100%);
                border: 4px solid #ffffff;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 4px 15px rgba(255, 102, 0, 0.4);
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
            </div>
          `;

          // Add marker to map
          new mapboxgl.Marker({ element: markerElement })
            .setLngLat([coordinates.lng, coordinates.lat])
            .addTo(map);

          // Create popup
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px; text-align: center;">
                <div style="font-weight: bold; color: #333; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 12px; color: #666;">${location}</div>
              </div>
            `);

          // Show popup on marker click
          markerElement.addEventListener('click', () => {
            popup.setLngLat([coordinates.lng, coordinates.lat]).addTo(map);
          });
        }

        // Cleanup function
        return () => {
          map.remove();
        };
      };

      document.head.appendChild(script);
    };

    initializeMap();
  }, [coordinates, title, location, showMarker]);

  const handleDirections = () => {
    if (showMarker) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

  const handleViewLarger = () => {
    if (showMarker) {
      const url = `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},17z`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 bg-tuleeto-orange/10 rounded-lg">
            <MapPin className="h-5 w-5 text-tuleeto-orange" />
          </div>
          <div>
            <div className="text-gray-900">Property Location</div>
            {showMarker && (
              <div className="text-sm text-green-600 font-normal flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Exact coordinates available
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">
          <div className="font-medium text-gray-900 mb-1">📍 Address</div>
          {location}
          {showMarker && (
            <div className="text-xs text-gray-500 mt-2">
              Coordinates: {coordinates.lat.toFixed(8)}, {coordinates.lng.toFixed(8)}
            </div>
          )}
        </div>
        
        <div 
          ref={mapContainer} 
          className="w-full h-64 rounded-xl border border-gray-200 shadow-inner overflow-hidden"
          style={{ minHeight: '256px' }}
        />
        
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={handleViewLarger}
            variant="outline"
            size="sm"
            className="border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white transition-all duration-200"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            View Full Map
          </Button>
          
          <Button
            onClick={handleDirections}
            variant="outline"
            size="sm"
            className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-all duration-200"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
        </div>
        
        {!showMarker && (
          <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="font-medium mb-1">ℹ️ General Area View</div>
            This property doesn't have exact coordinates. The map shows the general area based on the address.
          </div>
        )}
        
        {showMarker && (
          <div className="text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="font-medium mb-1">✅ Precise Location</div>
            This property has been mapped with ultra-high precision coordinates using Ola Maps.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
