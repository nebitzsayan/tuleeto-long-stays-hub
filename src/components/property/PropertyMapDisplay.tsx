
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation } from 'lucide-react';
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

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [coordinates.lng, coordinates.lat],
      zoom: showMarker ? 15 : 6
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker only if showMarker is true (i.e., property has actual coordinates)
    if (showMarker) {
      // Create a custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDguMDEgMTkuOTkgNi4xNiAxOC4zNiA0LjY0QzE2LjczIDMuMTIgMTQuNDcgMiAxMiAyQzkuNTMgMiA3LjI3IDMuMTIgNS42NCA0LjY0QzQuMDEgNi4xNiAzIDguMDEgMyAxMEMzIDEyIDMgMTQgMyAxNkMzIDEzLjggMiAxMS42IDIgMTBDMiA1LjUgNi41IDIgMTIgMkMxNy41IDIgMjIgNS41IDIyIDEwQzIyIDExLjYgMjEgMTMuOCAyMSAxNkMyMSAxNCAyMSAxMiAyMSAxMFoiIGZpbGw9IiNGRjY2MDAiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4K)';
      markerElement.style.width = '32px';
      markerElement.style.height = '32px';
      markerElement.style.backgroundSize = 'contain';

      // Add marker to map
      new mapboxgl.Marker({ element: markerElement })
        .setLngLat([coordinates.lng, coordinates.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(title))
        .addTo(map.current);
    }

    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [coordinates, title, showMarker]);

  const handleDirections = () => {
    if (showMarker) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    } else {
      // Fallback to search by location name for properties without exact coordinates
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

  const handleViewLarger = () => {
    if (showMarker) {
      const url = `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},15z`;
      window.open(url, '_blank');
    } else {
      // Fallback to search by location name for properties without exact coordinates
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-tuleeto-orange" />
          Property Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-3">
          {location}
        </div>
        
        <div 
          ref={mapContainer} 
          className="w-full h-48 rounded-lg border border-gray-200"
          style={{ minHeight: '192px' }}
        />
        
        {showMarker && (
          <div className="text-xs text-gray-500 mb-3">
            📍 Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </div>
        )}
        
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleViewLarger}
            variant="outline"
            size="sm"
            className="border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white"
          >
            <MapPin className="h-4 w-4 mr-2" />
            View Larger Map
          </Button>
          
          <Button
            onClick={handleDirections}
            variant="outline"
            size="sm"
            className="border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
        </div>
        
        {!showMarker && (
          <div className="text-xs text-gray-500 mt-3">
            💡 This property doesn't have exact coordinates. The map shows a general area view.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
