
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Bath, Square, IndianRupee, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PropertyType } from "@/components/property/PropertyListingCard";
import { Loader2 } from "lucide-react";

const FeaturedProperties = () => {
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .limit(3);
        
        if (error) throw error;
        
        if (data) {
          console.log("Fetched featured properties:", data);
          
          // Format the data to match the PropertyType with string id
          const formattedProperties = data.map(prop => ({
            id: prop.id.toString(),
            title: prop.title || "Untitled Property",
            location: prop.location || "Unknown Location",
            price: prop.price || 0,
            bedrooms: prop.bedrooms || 0,
            bathrooms: prop.bathrooms || 0,
            area: prop.area || 0,
            image: prop.images?.[0] || "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=500&h=300&q=80",
            type: prop.type || "Apartment"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden transition-transform duration-300 hover:shadow-lg hover:scale-[1.02]">
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
                    <span className="text-tuleeto-orange text-xl font-bold flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {property.price.toLocaleString('en-IN')}/mo
                    </span>
                    <Link to={`/property/${property.id}`}>
                      <Button variant="outline" className="border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white">
                        <Eye className="mr-1 h-4 w-4" /> Open
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
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
