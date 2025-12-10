
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Square, IndianRupee, Trash2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import WishlistButton from "./WishlistButton";

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
      className="overflow-hidden transition-transform duration-300 hover:shadow-lg hover:scale-[1.01] h-full bg-white border border-gray-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ opacity: property.is_public === false ? 0.7 : 1 }}
    >
      <div className="relative cursor-pointer" onClick={handleImageClick}>
        <AspectRatio ratio={isMobile ? 4/3 : 16/9}>
          <img 
            src={property.image} 
            alt={`${property.title} - ${property.bedrooms} BHK ${property.type} for rent in ${property.location} - Tuleeto`}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            width="400"
            height={isMobile ? "300" : "225"}
          />
        </AspectRatio>
        <Badge className="absolute top-2 right-2 bg-tuleeto-orange text-white text-xs px-2 py-1">
          {property.type}
        </Badge>
        
        {/* Wishlist button - only show if not owner controls */}
        {!showOwnerControls && (
          <div className="absolute top-2 left-2">
            <WishlistButton 
              propertyId={property.id}
              className="bg-white/80 hover:bg-white"
            />
          </div>
        )}
        
        {showOwnerControls && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`absolute top-2 left-2 bg-white hover:bg-gray-100 h-8 w-8 ${isHovered ? 'opacity-100' : 'opacity-70'}`}
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
      </div>
      
      <CardContent className="p-3 bg-white">
        <h3 className="text-sm md:text-lg font-semibold mb-2 text-gray-900 truncate leading-tight">
          {property.title}
        </h3>
        <div className="flex items-center text-gray-500 mb-2">
          <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
          <span className="text-xs md:text-sm font-medium truncate">
            {property.location}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-1 md:gap-2 mb-3">
          <div className="flex items-center text-gray-600 min-w-0">
            <BedDouble className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium truncate">
              {property.bedrooms} bed
            </span>
          </div>
          <div className="flex items-center text-gray-600 min-w-0">
            <Square className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium truncate">
              {property.area} sq ft
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-tuleeto-orange text-sm md:text-lg font-bold flex items-center min-w-0 flex-1">
            <IndianRupee className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
            <span className="truncate">
              {property.price.toLocaleString('en-IN')}/m
            </span>
          </span>
          {showDeleteButton && onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-white z-10 ml-2 flex-shrink-0"
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
