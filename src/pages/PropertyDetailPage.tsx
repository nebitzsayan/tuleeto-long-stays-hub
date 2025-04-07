
import { useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, BedDouble, Bath, Square, Calendar, CheckCircle2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

// Mock property data
const properties = [
  {
    id: 1,
    title: "Modern Downtown Apartment",
    location: "123 Main St, New York, NY",
    price: 2500,
    bedrooms: 2,
    bathrooms: 1,
    area: 850,
    images: [
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&h=500&q=80",
      "https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=800&h=500&q=80",
      "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=800&h=500&q=80"
    ],
    type: "Apartment",
    description: "This beautiful modern apartment is located in the heart of downtown. Walking distance to restaurants, shopping centers, and public transportation. The apartment features hardwood floors, stainless steel appliances, and a balcony with city views. Perfect for professionals or small families looking for a convenient urban lifestyle.",
    features: [
      "Air conditioning", 
      "In-unit laundry", 
      "Dishwasher", 
      "Balcony", 
      "Hardwood floors", 
      "Stainless steel appliances", 
      "Walk-in closet", 
      "Pet friendly"
    ],
    availableFrom: "2025-05-01",
    owner: {
      name: "John Smith",
      phone: "(555) 123-4567",
      email: "john@example.com",
      responseTime: "Usually responds within 1 day"
    }
  }
];

const PropertyDetailPage = () => {
  const { id } = useParams();
  const propertyId = parseInt(id || "1");
  
  const property = properties.find(p => p.id === propertyId);
  
  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <h2 className="text-2xl font-semibold">Property not found</h2>
        </div>
        <Footer />
      </div>
    );
  }

  const handleContact = () => {
    toast.success("Your message has been sent! The owner will contact you soon.");
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 px-4 pb-12 bg-tuleeto-off-white">
        <div className="container max-w-7xl mx-auto">
          {/* Property Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span>{property.location}</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <span className="text-3xl font-bold text-tuleeto-orange">${property.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>
          </div>
          
          {/* Property Images */}
          <div className="mb-8 overflow-hidden rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <img 
                  src={property.images[0]} 
                  alt={property.title} 
                  className="w-full h-[400px] object-cover rounded-t-lg"
                />
              </div>
              {property.images.slice(1).map((image, index) => (
                <div key={index} className="hidden md:block">
                  <img 
                    src={image} 
                    alt={`${property.title} - ${index + 2}`} 
                    className="w-full h-[200px] object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Property Details and Contact */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {/* Quick Info */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="flex flex-col items-center p-4 bg-tuleeto-off-white rounded-lg">
                      <BedDouble className="h-6 w-6 text-tuleeto-orange mb-2" />
                      <span className="text-sm text-gray-500">Bedrooms</span>
                      <span className="font-semibold">{property.bedrooms}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-tuleeto-off-white rounded-lg">
                      <Bath className="h-6 w-6 text-tuleeto-orange mb-2" />
                      <span className="text-sm text-gray-500">Bathrooms</span>
                      <span className="font-semibold">{property.bathrooms}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-tuleeto-off-white rounded-lg">
                      <Square className="h-6 w-6 text-tuleeto-orange mb-2" />
                      <span className="text-sm text-gray-500">Area</span>
                      <span className="font-semibold">{property.area} sq ft</span>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="description">
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="description">Description</TabsTrigger>
                      <TabsTrigger value="features">Features</TabsTrigger>
                      <TabsTrigger value="availability">Availability</TabsTrigger>
                    </TabsList>
                    <TabsContent value="description">
                      <p className="text-gray-600">{property.description}</p>
                    </TabsContent>
                    <TabsContent value="features">
                      <div className="grid grid-cols-2 gap-3">
                        {property.features.map((feature, index) => (
                          <div key={index} className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 text-tuleeto-orange mr-2" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="availability">
                      <div className="flex items-center mb-4">
                        <Calendar className="h-5 w-5 text-tuleeto-orange mr-2" />
                        <span>Available from: <strong>{new Date(property.availableFrom).toLocaleDateString()}</strong></span>
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
                    <h4 className="font-medium mb-1">{property.owner.name}</h4>
                    <p className="text-sm text-gray-500 mb-3">{property.owner.responseTime}</p>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-tuleeto-orange mr-2" />
                        <span>{property.owner.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-tuleeto-orange mr-2" />
                        <span>{property.owner.email}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white"
                    onClick={handleContact}
                  >
                    Contact Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PropertyDetailPage;
