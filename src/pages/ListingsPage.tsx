
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyFilter from "@/components/property/PropertyFilter";
import PropertyListingCard, { PropertyType } from "@/components/property/PropertyListingCard";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ListingsPage = () => {
  const [searchParams] = useSearchParams();
  const [allProperties, setAllProperties] = useState<PropertyType[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch all properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('properties')
          .select('*');
        
        if (error) throw error;
        
        if (data) {
          console.log("Fetched properties:", data);
          
          // Format the data to match the PropertyType with string id
          const properties = data.map(prop => ({
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
          
          setAllProperties(properties);
          
          // Initially show all properties
          setFilteredProperties(properties);
        }
      } catch (error: any) {
        toast.error(`Error fetching properties: ${error.message}`);
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, []);

  // Filter properties based on search params
  useEffect(() => {
    if (allProperties.length === 0) return;
    
    let filtered = [...allProperties];
    const searchTerm = searchParams.get("search")?.toLowerCase();
    const minPrice = Number(searchParams.get("minPrice")) || 500;
    const maxPrice = Number(searchParams.get("maxPrice")) || 150000;
    const bedrooms = Number(searchParams.get("bedrooms")) || 0;
    const propertyType = searchParams.get("type");
    
    if (searchTerm && searchTerm !== "undefined" && searchTerm !== "null") {
      filtered = filtered.filter(p => 
        p.location.toLowerCase().includes(searchTerm) || 
        p.title.toLowerCase().includes(searchTerm)
      );
    }
    
    // Always apply price filter even if values are default
    filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);
    
    if (bedrooms > 0) {
      filtered = filtered.filter(p => p.bedrooms >= bedrooms);
    }
    
    if (propertyType && propertyType !== "undefined" && propertyType !== "null" && propertyType !== "") {
      filtered = filtered.filter(p => p.type === propertyType);
    }
    
    console.log("Search params:", { searchTerm, minPrice, maxPrice, bedrooms, propertyType });
    console.log("Filtered properties:", filtered);
    setFilteredProperties(filtered);
  }, [searchParams, allProperties]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-16 md:pt-24 px-4 md:px-4 bg-tuleeto-off-white">
        <div className="container max-w-7xl mx-auto">
          <h1 className="text-xl md:text-4xl font-bold mb-3 md:mb-6">Available Rentals</h1>
          
          <PropertyFilter />
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-12">
              {filteredProperties.map((property) => (
                <PropertyListingCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl md:text-2xl font-semibold mb-2">No properties found</h3>
              <p className="text-gray-500">Try adjusting your search filters</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ListingsPage;
