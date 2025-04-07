
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Bath, Square } from "lucide-react";
import { Link } from "react-router-dom";

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
}

const PropertyListingCard = ({ property }: PropertyListingCardProps) => {
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
      
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2">{property.title}</h3>
        <div className="flex items-center text-gray-500 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{property.location}</span>
        </div>
        
        <div className="flex justify-between mb-4">
          <div className="flex items-center text-gray-600">
            <BedDouble className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Bath className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Square className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.area} sq ft</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-tuleeto-orange text-xl font-bold">${property.price}/mo</span>
          <Link to={`/property/${property.id}`}>
            <Button variant="outline" className="border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyListingCard;
