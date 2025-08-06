
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Set the Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2F5YW5nYXllbiIsImEiOiJjbWR1Y2V5dHowaGs0Mmxxd2t0OGw2cDVxIn0.MTK_Fk7k7ApP20VUhBm9_g';

interface PropertyMapDisplayProps {
  coordinates: { lat: number; lng: number };
  title: string;
  location: string;
  showMarker?: boolean;
}

export const PropertyMapDisplay = ({ coordinates, title, location, showMarker = true }: PropertyMapDisplayProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with street view for better property visibility
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Clean street map style
      center: [coordinates.lng, coordinates.lat],
      zoom: showMarker ? 16 : 8, // Higher zoom for properties with coordinates
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: false,
      showCompass: true,
      showZoom: true
    }), 'top-right');

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // Add custom marker with property-specific styling
    if (showMarker) {
      // Create custom marker HTML
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
            animation: bounce 2s infinite;
          ">
            <div style="
              width: 16px;
              height: 16px;
              background: #ffffff;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 102, 0, 0.9);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          ">
            Property Location
          </div>
        </div>
      `;

      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0) rotate(-45deg); }
          40% { transform: translateY(-8px) rotate(-45deg); }
          60% { transform: translateY(-4px) rotate(-45deg); }
        }
      `;
      document.head.appendChild(style);

      // Add marker with popup
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        className: 'property-popup'
      }).setHTML(`
        <div style="padding: 8px; text-align: center;">
          <div style="font-weight: bold; color: #333; margin-bottom: 4px;">${title}</div>
          <div style="font-size: 12px; color: #666;">${location}</div>
        </div>
      `);

      new mapboxgl.Marker({ 
        element: markerElement,
        anchor: 'bottom'
      })
        .setLngLat([coordinates.lng, coordinates.lat])
        .setPopup(popup)
        .addTo(map.current);

      // Show popup after a delay
      setTimeout(() => {
        popup.addTo(map.current!);
      }, 1000);
    }

    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
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
              Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
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
            This property has been mapped with high-precision coordinates for accurate navigation.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
