
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PropertyListingCard from "@/components/property/PropertyListingCard";
import { MapPin, Mail, Phone, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OwnerAvatar from "@/components/profile/OwnerAvatar";
import { PropertyType } from "@/components/property/PropertyListingCard";

interface OwnerProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

const OwnerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchOwnerData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch owner profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
          
        if (profileError) throw profileError;
        
        if (profileData) {
          setOwner(profileData);
        }
        
        // Fetch owner's properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', id);
          
        if (propertiesError) throw propertiesError;
        
        if (propertiesData) {
          console.log("Owner properties:", propertiesData);
          
          // Format property data
          const formattedProperties = propertiesData.map(prop => ({
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
      } catch (error) {
        console.error("Error fetching owner data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOwnerData();
  }, [id]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 px-4 pb-12 bg-tuleeto-off-white">
        <div className="container max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
            </div>
          ) : owner ? (
            <>
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <OwnerAvatar 
                      ownerId={owner.id} 
                      ownerName={owner.full_name} 
                      size="lg"
                      withLink={false}
                      className="h-20 w-20"
                    />
                    
                    <div className="flex-1">
                      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center md:text-left">
                        {owner.full_name || "Property Owner"}
                      </h1>
                      
                      <div className="flex items-center justify-center md:justify-start text-gray-600 mb-4">
                        <User className="h-4 w-4 mr-2" />
                        <span>Property Owner</span>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {user && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2 text-tuleeto-orange" />
                            <span>{owner.email}</span>
                          </div>
                        )}
                        
                        {/* Property count */}
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-tuleeto-orange" />
                          <span>{properties.length} {properties.length === 1 ? 'Property' : 'Properties'} Listed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Properties by {owner.full_name}</h2>
                
                {properties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {properties.map((property) => (
                      <div key={property.id} className="h-full">
                        <PropertyListingCard property={property} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500">This owner has no properties listed at the moment.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Owner not found</h2>
              <p className="text-gray-500">We couldn't find this property owner.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OwnerProfilePage;
