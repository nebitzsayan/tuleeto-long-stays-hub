
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PropertyType } from "@/components/property/PropertyListingCard";
import { PropertyLoader } from "@/components/ui/property-loader";
import PropertyListingCard from "@/components/property/PropertyListingCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocationContext } from "@/contexts/LocationContext";
import { calculateDistance } from "@/lib/geoUtils";
import { FEATURED_PROPERTIES_QUERY_KEY } from "@/hooks/useProperties";

const FeaturedProperties = () => {
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const isMobile = useIsMobile();
  const { coordinates, city, permissionStatus } = useLocationContext();
  
  const { data: propertiesData, isLoading: loading } = useQuery({
    queryKey: [...FEATURED_PROPERTIES_QUERY_KEY, coordinates?.lat, coordinates?.lng, permissionStatus],
    queryFn: async () => {
      // Fetch more properties if location is denied (for randomness)
      // Otherwise fetch limited set for distance sorting
      const limit = permissionStatus === 'granted' && coordinates ? 20 : 50;
      
      // First get properties
      const { data: propertiesResult, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('is_public', true)
        .limit(limit);
      
      if (propertiesError) throw propertiesError;
      
      if (!propertiesResult) return [];
      
      // Fetch ratings for each property separately
      const formattedProperties = await Promise.all(propertiesResult.map(async (prop) => {
        // Get reviews for this property
        const { data: reviewsData } = await supabase
          .from('property_reviews')
          .select('rating')
          .eq('property_id', prop.id);
          
        // Calculate average rating
        let averageRating;
        let reviewCount = 0;
        
        if (reviewsData && reviewsData.length > 0) {
          reviewCount = reviewsData.length;
          const sum = reviewsData.reduce((total, review) => total + review.rating, 0);
          averageRating = sum / reviewCount;
        }
        
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
          review_count: reviewCount,
          is_public: prop.is_public !== false,
          coordinates: prop.coordinates
        };
      }));
      
      return formattedProperties;
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
  
  // Process properties when data changes
  useEffect(() => {
    if (!propertiesData) return;
    
    let finalProperties = propertiesData;
    
    // If user granted location and we have coordinates, sort by distance
    if (permissionStatus === 'granted' && coordinates) {
      const propertiesWithCoords = propertiesData.filter(p => p.coordinates);
      
      if (propertiesWithCoords.length > 0) {
        const propertiesWithDistance = propertiesWithCoords.map(prop => {
          const propCoords = JSON.parse(prop.coordinates as string);
          const distance = calculateDistance(coordinates, {
            lat: propCoords.lat,
            lng: propCoords.lng
          });
          return { ...prop, distance };
        });
        
        // Sort by distance and take closest 4
        finalProperties = propertiesWithDistance
          .sort((a, b) => a.distance! - b.distance!)
          .slice(0, 4);
      }
    } else {
      // For users who denied location, show random properties on each refresh
      const shuffled = [...propertiesData].sort(() => Math.random() - 0.5);
      finalProperties = shuffled.slice(0, 4);
    }
    
    setProperties(finalProperties);
  }, [propertiesData, coordinates, permissionStatus]);

  return (
    <section className="py-12 px-4 bg-tuleeto-off-white">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {permissionStatus === 'granted' && city 
              ? `Properties Near You in ${city}` 
              : 'Featured Rentals'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {permissionStatus === 'granted' && city
              ? `Discover rental properties closest to your location`
              : `Discover our handpicked selection of premium long-term rentals`}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <PropertyLoader size="lg" text="Finding properties near you..." />
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
