
import { MapPin, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PropertyLocationProps {
  location: string;
  coordinates?: { lat: number; lng: number };
}

export const PropertyLocation = ({ location, coordinates }: PropertyLocationProps) => {
  const handleDirections = () => {
    if (coordinates) {
      // Open Google Maps with directions
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    } else {
      // Fallback to search by location name
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

  const handleViewOnMap = () => {
    if (coordinates) {
      // Open Google Maps at specific coordinates
      const url = `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},15z`;
      window.open(url, '_blank');
    } else {
      // Fallback to search by location name
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-tuleeto-orange" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-gray-700 mb-3">{location}</p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={handleViewOnMap}
            variant="outline"
            size="sm"
            className="border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white"
          >
            <MapPin className="h-4 w-4 mr-2" />
            View on Map
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
        
        <div className="text-xs text-gray-500 mt-3">
          💡 Click "View on Map" to see the exact location or "Get Directions" for navigation.
        </div>
      </CardContent>
    </Card>
  );
};
