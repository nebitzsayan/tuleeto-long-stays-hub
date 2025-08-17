
import React from 'react';
import { MapPin, Navigation, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateStaticMapUrl, OLA_MAPS_CONFIG } from '@/lib/olaMapsConfig';

interface PropertyMapDisplayProps {
  coordinates: { lat: number; lng: number };
  title: string;
  location: string;
  showMarker?: boolean;
}

export const PropertyMapDisplay = ({ coordinates, title, location, showMarker = true }: PropertyMapDisplayProps) => {
  // Generate Ola Maps static map URL using the helper function
  const getMapImageUrl = () => {
    const zoom = showMarker ? 16 : 10;
    const markers = showMarker ? [{ lat: coordinates.lat, lng: coordinates.lng, color: 'red' }] : undefined;
    
    return generateStaticMapUrl(coordinates, zoom, 800, 400, markers);
  };

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
        
        <div className="w-full h-64 rounded-xl border border-gray-200 shadow-inner overflow-hidden relative">
          <img
            src={getMapImageUrl()}
            alt={`Map showing ${title}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Ola Maps static image failed to load');
              // Fallback to a simple placeholder
              const target = e.target as HTMLImageElement;
              target.src = `data:image/svg+xml,${encodeURIComponent(`
                <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100%" height="100%" fill="#f3f4f6"/>
                  <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="16" fill="#6b7280">
                    Map unavailable
                  </text>
                </svg>
              `)}`;
            }}
            onLoad={() => {
              console.log('Ola Maps static image loaded successfully');
            }}
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
            Powered by Ola Maps
          </div>
        </div>
        
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
            This property has been mapped with high precision coordinates using Ola Maps.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
