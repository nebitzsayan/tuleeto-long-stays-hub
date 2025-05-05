
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
          .select('*')
          .limit(4);
        
        if (error) throw error;
        
        if (data) {
          console.log("Fetched featured properties:", data);
          
          // Format the data to match the PropertyType with string id and contact_phone
          const formattedProperties = data.map(prop => ({
            id: prop.id.toString(),
            title: prop.title || "Untitled Property",
            location: prop.location || "Unknown Location",
            price: prop.price || 0,
            bedrooms: prop.bedrooms || 0,
            bathrooms: prop.bathrooms || 0,
            area: prop.area || 0,
            image: prop.images?.[0] || "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=500&h=300&q=80",
            type: prop.type || "Apartment",
            contact_phone: prop.contact_phone || ""
          }));
          
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
    <section className="py-16 px-4 bg-tuleeto-off-white">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Rentals</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium long-term rentals
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {properties.map((property) => (
              <PropertyListingCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">No properties available at the moment.</p>
          </div>
        )}
        
        <div className="text-center mt-12">
          <Link to="/listings">
            <Button 
              className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white px-8 py-6 text-lg"
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
