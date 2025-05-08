
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PropertyType } from "@/components/property/PropertyListingCard";
import { Loader2 } from "lucide-react";
import PropertyListingCard from "@/components/property/PropertyListingCard";
import { useIsMobile } from "@/hooks/use-mobile";

const FeaturedProperties = () => {
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('properties')
          .select('*, reviews:property_reviews(rating)')
          .eq('is_public', true)
          .limit(4);
        
        if (error) throw error;
        
        if (data) {
          console.log("Fetched featured properties:", data);
          
          // Calculate average rating for each property
          const formattedProperties = data.map(prop => {
            const reviews = prop.reviews as any[] || [];
            const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = reviews.length ? totalRatings / reviews.length : undefined;
            const reviewCount = reviews.length;
            
            return {
              id: prop.id.toString(),
              title: prop.title || "Untitled Property",
              location: prop.location || "Unknown Location",
              price: prop.price || 0,
              bedrooms: prop.bedrooms || 0,
              bathrooms: prop.bathrooms || 0,
              area: prop.area || 0,
              image: prop.images?.[0] || "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=500&h=300&q=80",
              type: prop.type || "Apartment",
              contact_phone: prop.contact_phone || "",
              average_rating: averageRating,
              review_count: reviewCount || 0
            };
          });
          
          setProperties(formattedProperties);
        }
      } catch (error: any) {
        console.error("Error fetching featured properties:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, []);

  return (
    <section className="py-12 px-4 bg-tuleeto-off-white">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Rentals</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium long-term rentals
          </p>
        </div>

        {loading ? (
          <div className="loading-container">
            <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
            <p className="mt-4 text-gray-500">Loading featured properties...</p>
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {properties.map((property) => (
              <div key={property.id} className="h-full">
                <PropertyListingCard property={property} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">No properties available at the moment.</p>
          </div>
        )}
        
        <div className="text-center mt-10">
          <Link to="/listings">
            <Button 
              className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white px-6 py-2 text-base"
            >
              Browse All Properties
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
