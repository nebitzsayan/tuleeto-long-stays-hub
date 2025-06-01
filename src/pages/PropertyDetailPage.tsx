
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, BedDouble, Bath, Square, Calendar, CheckCircle2, Phone, Mail, Loader2, IndianRupee, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PropertyImageCarousel from "@/components/property/PropertyImageCarousel";
import { useIsMobile } from "@/hooks/use-mobile";
import OwnerAvatar from "@/components/profile/OwnerAvatar";
import PropertyReviews from "@/components/property/PropertyReviews";

interface PropertyDetails {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  type: string;
  features: string[];
  available_from: string;
  owner_id: string;
  owner_email?: string;
  owner_name?: string;
  contact_phone?: string;
  is_public?: boolean;
}

const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("description");
  
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        if (!id) {
          setError("No property ID provided");
          setLoading(false);
          return;
        }

        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .single();

        if (propertyError) {
          throw propertyError;
        }

        if (!propertyData) {
          setError("Property not found");
          setLoading(false);
          return;
        }
        
        if (propertyData.is_public === false && propertyData.owner_id !== user?.id) {
          setError("This property is currently not available");
          setLoading(false);
          return;
        }

        console.log("Fetched property data:", propertyData);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", propertyData.owner_id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }
        
        const ownerPhone = propertyData.contact_phone || "";
        
        console.log("Phone number from database:", ownerPhone);
        
        setProperty({
          ...propertyData,
          owner_email: profileData?.email || "Contact via Tuleeto",
          owner_name: profileData?.full_name || "Property Owner",
          contact_phone: ownerPhone
        });
      } catch (error: any) {
        setError(error.message);
        toast.error(`Error loading property: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, user]);

  const handleContact = () => {
    if (!user) {
      toast.error("Please log in to contact property owners");
      return;
    }
    
    if (isMobile && property?.contact_phone) {
      window.location.href = `tel:${property.contact_phone.replace(/\s+/g, '')}`;
      return;
    }
    
    toast.success("Your message has been sent! The owner will contact you soon.");
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="loading-container">
            <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
            <p className="mt-4 text-gray-500">Loading property details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-semibold mb-4">Property not found</h2>
          <p className="text-gray-500 mb-6">{error || "This property may have been removed or doesn't exist."}</p>
          <Link to="/listings">
            <Button className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark">
              Browse Other Properties
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 px-4 pb-12 bg-tuleeto-off-white">
        <div className="container max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{property?.title}</h1>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span>{property?.location}</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <span className="text-3xl font-bold text-tuleeto-orange flex items-center">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {property?.price?.toLocaleString('en-IN')}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            {property?.images && (
              <PropertyImageCarousel 
                images={property.images} 
                title={property.title} 
              />
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="flex flex-col items-center p-4 bg-tuleeto-off-white rounded-lg">
                      <BedDouble className="h-6 w-6 text-tuleeto-orange mb-2" />
                      <span className="text-sm text-gray-500">Bedrooms</span>
                      <span className="font-semibold">{property?.bedrooms}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-tuleeto-off-white rounded-lg">
                      <Bath className="h-6 w-6 text-tuleeto-orange mb-2" />
                      <span className="text-sm text-gray-500">Bathrooms</span>
                      <span className="font-semibold">{property?.bathrooms}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-tuleeto-off-white rounded-lg">
                      <Square className="h-6 w-6 text-tuleeto-orange mb-2" />
                      <span className="text-sm text-gray-500">Area</span>
                      <span className="font-semibold">{property?.area} sq ft</span>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="description" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="description">Description</TabsTrigger>
                      <TabsTrigger value="features">Features</TabsTrigger>
                      <TabsTrigger value="availability">Availability</TabsTrigger>
                    </TabsList>
                    <TabsContent value="description">
                      <p className="text-gray-600">{property?.description}</p>
                    </TabsContent>
                    <TabsContent value="features">
                      <div className="grid grid-cols-2 gap-3">
                        {property?.features && property.features.length > 0 ? (
                          property.features.map((feature, index) => (
                            <div key={index} className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 text-tuleeto-orange mr-2" />
                              <span>{feature}</span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-gray-500">No specific features listed for this property.</div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="availability">
                      <div className="flex items-center mb-4">
                        <Calendar className="h-5 w-5 text-tuleeto-orange mr-2" />
                        <span>Available from: <strong>{property?.available_from && new Date(property.available_from).toLocaleDateString()}</strong></span>
                      </div>
                      <p className="text-gray-600">This property requires a minimum lease of 6 months.</p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Contact the Owner</h3>
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Link to={`/owner/${property?.owner_id}`} className="flex items-center">
                        <OwnerAvatar 
                          ownerId={property?.owner_id || ""} 
                          ownerName={property?.owner_name}
                          className="mr-3"
                        />
                        <h4 className="font-medium hover:text-tuleeto-orange transition-colors">{property?.owner_name}</h4>
                      </Link>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Usually responds within 1 day</p>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-tuleeto-orange mr-2" />
                        <span>{property?.owner_email}</span>
                      </div>
                      {user ? (
                        property?.contact_phone ? (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-tuleeto-orange mr-2" />
                            <span>{property.contact_phone}</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-500">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>No phone number provided</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <Lock className="h-4 w-4 mr-2" />
                          <span>Login to view phone number</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {user ? (
                    <Button 
                      className="w-full bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white"
                      onClick={handleContact}
                      disabled={!property?.contact_phone}
                    >
                      {isMobile && property?.contact_phone ? (
                        <>
                          <Phone className="h-4 w-4 mr-2" />
                          Call {property.contact_phone}
                        </>
                      ) : (
                        "Contact Now"
                      )}
                    </Button>
                  ) : (
                    <Link to="/auth">
                      <Button 
                        className="w-full bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white"
                      >
                        Login to Contact Owner
                      </Button>
                    </Link>
                  )}

                  {property?.owner_id === user?.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-2">This is your listing</p>
                      <Link to="/my-properties">
                        <Button variant="outline" className="w-full">
                          Manage Your Properties
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Reviews Section - Moved below contact section */}
          <PropertyReviews propertyId={property.id} ownerId={property.owner_id} className="mt-8" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PropertyDetailPage;
