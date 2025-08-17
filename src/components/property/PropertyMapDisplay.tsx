
import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_CONFIG } from '@/lib/mapboxConfig';

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
    console.log('PropertyMapDisplay - Received coordinates:', coordinates);
    console.log('PropertyMapDisplay - Show marker:', showMarker);
    
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.styles.streets,
      center: [coordinates.lng, coordinates.lat],
      zoom: showMarker ? 16 : 12,
      interactive: true,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl({
      showCompass: false,
      showZoom: true,
      visualizePitch: false
    }), 'top-right');

    // Add marker if coordinates are available and showMarker is true
    if (showMarker && coordinates.lat && coordinates.lng) {
      console.log('Adding marker at coordinates:', coordinates);
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map.current);
    }

    return () => {
      map.current?.remove();
    };
  }, [coordinates, showMarker]);

  const handleDirections = () => {
    if (showMarker && coordinates.lat && coordinates.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

  const handleViewLarger = () => {
    if (showMarker && coordinates.lat && coordinates.lng) {
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
          <div className="text-gray-900">Property Location</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={mapContainer} 
          className="w-full h-64 rounded-xl border border-gray-200 shadow-inner overflow-hidden relative"
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
      </CardContent>
    </Card>
  );
};
