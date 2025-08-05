
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { generatePropertyPoster } from "@/utils/pdfGenerator";
import { useAuth } from "@/contexts/AuthContext";

interface PropertyPosterButtonProps {
  property: {
    id?: string;
    title: string;
    location: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    area: number;
    description: string;
    features: string[];
    images: string[];
    owner_name?: string;
    contact_phone?: string;
    average_rating?: number;
    review_count?: number;
    ownerId?: string;
  };
  className?: string;
}

const PropertyPosterButton = ({ property, className = "" }: PropertyPosterButtonProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  // Only show the button if the current user is the property owner
  if (!user || !property.ownerId || user.id !== property.ownerId) {
    return null;
  }

  const handleGeneratePoster = async () => {
    if (!property.contact_phone) {
      toast.error("Contact phone number is required to generate poster");
      return;
    }

    setIsGenerating(true);
    
    try {
      await generatePropertyPoster({
        title: property.title,
        location: property.location,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        description: property.description,
        features: property.features || [],
        ownerName: property.owner_name || "Property Owner",
        contactPhone: property.contact_phone,
        images: property.images || [],
        averageRating: property.average_rating,
        reviewCount: property.review_count,
        propertyId: property.id
      });
      
      toast.success("Property poster generated successfully!");
    } catch (error) {
      console.error("Error generating poster:", error);
      toast.error("Failed to generate poster. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGeneratePoster}
      disabled={isGenerating}
      variant="outline"
      className={`border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white ${className}`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          Create Poster
        </>
      )}
    </Button>
  );
};

export default PropertyPosterButton;
