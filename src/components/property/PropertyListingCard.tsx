
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Bath, Square, IndianRupee, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export interface PropertyType {
  id: string; // Changed from number to string to match Supabase UUID
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  type: string;
}

interface PropertyListingCardProps {
  property: PropertyType;
  onDelete?: (id: string) => void; // Add optional onDelete prop
  showDeleteButton?: boolean; // Flag to show/hide delete button
}

const PropertyListingCard = ({ 
  property, 
  onDelete, 
  showDeleteButton = false 
}: PropertyListingCardProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className="overflow-hidden transition-transform duration-300 hover:shadow-lg hover:scale-[1.01]">
      <div className="relative">
        <img 
          src={property.image} 
          alt={property.title} 
          className="w-full h-48 object-cover"
        />
        <Badge className="absolute top-3 right-3 bg-tuleeto-orange">{property.type}</Badge>
      </div>
      
      <CardContent className="p-3 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">{property.title}</h3>
        <div className="flex items-center text-gray-500 mb-2 md:mb-3">
          <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1" />
          <span className="text-xs md:text-sm">{property.location}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-1 mb-2 md:mb-4">
          <div className="flex items-center text-gray-600">
            <BedDouble className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="text-xs md:text-sm">{property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Bath className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="text-xs md:text-sm">{property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Square className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="text-xs md:text-sm">{property.area} sq ft</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-200">
          <span className="text-tuleeto-orange text-lg md:text-xl font-bold flex items-center">
            <IndianRupee className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            {property.price.toLocaleString('en-IN')}/mo
          </span>
          <div className={`flex ${isMobile ? 'flex-col' : ''} gap-1 md:gap-2`}>
            {showDeleteButton && onDelete && (
              <Button 
                variant="outline" 
                size={isMobile ? "mobile" : "sm"}
                className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                onClick={() => onDelete(property.id)}
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                {!isMobile && <span>Delete</span>}
              </Button>
            )}
            <Link to={`/property/${property.id}`}>
              <Button 
                variant="outline" 
                size={isMobile ? "mobile" : "sm"}
                className="border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white"
              >
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyListingCard;
