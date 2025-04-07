
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Bath, Square } from "lucide-react";

// Mock data for featured properties
const featuredProperties = [
  {
    id: 1,
    title: "Modern Downtown Apartment",
    location: "New York, NY",
    price: 2500,
    bedrooms: 2,
    bathrooms: 1,
    area: 850,
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=500&h=300&q=80",
    type: "Apartment"
  },
  {
    id: 2,
    title: "Spacious Family House",
    location: "Los Angeles, CA",
    price: 3200,
    bedrooms: 3,
    bathrooms: 2,
    area: 1400,
    image: "https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=500&h=300&q=80",
    type: "House"
  },
  {
    id: 3,
    title: "Cozy Studio Apartment",
    location: "Chicago, IL",
    price: 1800,
    bedrooms: 1,
    bathrooms: 1,
    area: 600,
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=500&h=300&q=80",
    type: "Studio"
  }
];

const FeaturedProperties = () => {
  return (
    <section className="py-16 px-4 bg-tuleeto-off-white">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Rentals</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium long-term rentals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProperties.map((property) => (
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
                  <span className="text-tuleeto-orange text-xl font-bold">${property.price}/mo</span>
                  <Button variant="outline" className="border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button 
            className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white px-8 py-6 text-lg"
            onClick={() => window.location.href = '/listings'}
          >
            Browse All Properties
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
