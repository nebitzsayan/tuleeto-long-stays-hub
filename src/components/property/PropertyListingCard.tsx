
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Square, IndianRupee, Trash2, Star, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

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
  average_rating?: number;
  review_count?: number;
  is_public?: boolean;
  owner_id?: string;
}

interface PropertyListingCardProps {
  property: PropertyType;
  onDelete?: (id: string) => void;
  showDeleteButton?: boolean;
  onToggleVisibility?: (id: string, isPublic: boolean) => void;
  showOwnerControls?: boolean;
}

const PropertyListingCard = ({ 
  property, 
  onDelete, 
  showDeleteButton = false,
  onToggleVisibility,
  showOwnerControls = false
}: PropertyListingCardProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleImageClick = () => {
    navigate(`/property/${property.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(property.id);
    }
  };
  
  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleVisibility) {
      onToggleVisibility(property.id, !property.is_public);
    }
  };
  
  return (
    <Card 
      className="overflow-hidden transition-transform duration-300 hover:shadow-lg hover:scale-[1.01] h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ opacity: property.is_public === false ? 0.7 : 1 }}
    >
      <div className="relative cursor-pointer" onClick={handleImageClick}>
        <AspectRatio ratio={16/9}>
          <img 
            src={property.image} 
            alt={property.title} 
            className="w-full h-full object-cover"
          />
        </AspectRatio>
        <Badge className="absolute top-3 right-3 bg-tuleeto-orange">{property.type}</Badge>
        
        {showOwnerControls && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`absolute top-3 left-3 bg-white hover:bg-gray-100 ${isHovered ? 'opacity-100' : 'opacity-70'}`}
                  onClick={handleToggleVisibility}
                >
                  {property.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{property.is_public ? "Make private" : "Make public"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {property.average_rating !== undefined && property.average_rating > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded-md text-sm flex items-center">
            <Star className="h-3.5 w-3.5 text-yellow-400 mr-1 fill-yellow-400" />
            <span>{property.average_rating.toFixed(1)}</span>
            {property.review_count && property.review_count > 0 && (
              <span className="text-xs ml-1">({property.review_count})</span>
            )}
          </div>
        )}
      </div>
      
      <CardContent className="p-3 md:p-4">
        <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 line-clamp-1">{property.title}</h3>
        <div className="flex items-center text-gray-500 mb-2">
          <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1" />
          <span className="text-xs md:text-sm line-clamp-1 font-medium">{property.location}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-1 mb-2">
          <div className="flex items-center text-gray-600">
            <BedDouble className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="text-xs font-medium">{property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Square className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="text-xs font-medium">{property.area} sq ft</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Star className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="text-xs font-medium">
              {property.average_rating ? property.average_rating.toFixed(1) : "N/A"}
            </span>
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
