
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Bath, Square, IndianRupee, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export interface PropertyType {
  id: string;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  type: string;
  contact_phone: string;
}

interface PropertyListingCardProps {
  property: PropertyType;
  onDelete?: (id: string) => void;
  showDeleteButton?: boolean;
}

const PropertyListingCard = ({ 
  property, 
  onDelete, 
  showDeleteButton = false 
}: PropertyListingCardProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    navigate(`/property/${property.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    if (onDelete) {
      onDelete(property.id);
    }
  };
  
  return (
    <Card 
      className="overflow-hidden transition-transform duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer h-full"
      onClick={handleCardClick}
    >
      <div className="relative">
        <AspectRatio ratio={16/9}>
          <img 
            src={property.image} 
            alt={property.title} 
            className="w-full h-full object-cover"
          />
        </AspectRatio>
        <Badge className="absolute top-3 right-3 bg-tuleeto-orange">{property.type}</Badge>
      </div>
      
      <CardContent className="p-3 md:p-4">
        <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 line-clamp-1">{property.title}</h3>
        <div className="flex items-center text-gray-500 mb-2">
          <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1" />
          <span className="text-xs md:text-sm line-clamp-1">{property.location}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-1 mb-2">
          <div className="flex items-center text-gray-600">
            <BedDouble className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="text-xs">{property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Bath className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="text-xs">{property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Square className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="text-xs">{property.area} sq ft</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-tuleeto-orange text-base md:text-lg font-bold flex items-center">
            <IndianRupee className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            {property.price.toLocaleString('en-IN')}/m
          </span>
          {showDeleteButton && onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-white z-10"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline ml-1">Delete</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyListingCard;
