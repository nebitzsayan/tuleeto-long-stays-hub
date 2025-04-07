
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyFilter from "@/components/property/PropertyFilter";
import PropertyListingCard, { PropertyType } from "@/components/property/PropertyListingCard";

// Mock property data
const allProperties: PropertyType[] = [
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
  },
  {
    id: 4,
    title: "Downtown Loft with Views",
    location: "Seattle, WA",
    price: 2800,
    bedrooms: 2,
    bathrooms: 2,
    area: 950,
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=500&h=300&q=80",
    type: "Loft"
  },
  {
    id: 5,
    title: "Suburban Family Home",
    location: "Austin, TX",
    price: 2200,
    bedrooms: 4,
    bathrooms: 3,
    area: 2100,
    image: "https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=500&h=300&q=80",
    type: "House"
  },
  {
    id: 6,
    title: "Renovated Historic Apartment",
    location: "Boston, MA",
    price: 3500,
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=500&h=300&q=80",
    type: "Apartment"
  }
];

const ListingsPage = () => {
  const [searchParams] = useSearchParams();
  const [filteredProperties, setFilteredProperties] = useState<PropertyType[]>(allProperties);

  useEffect(() => {
    // Filter properties based on search parameters
    let filtered = [...allProperties];
    
    const location = searchParams.get("location")?.toLowerCase();
    const minPrice = Number(searchParams.get("minPrice")) || 0;
    const maxPrice = Number(searchParams.get("maxPrice")) || 10000;
    const bedrooms = Number(searchParams.get("bedrooms")) || 0;
    const propertyType = searchParams.get("type");
    
    if (location) {
      filtered = filtered.filter(p => 
        p.location.toLowerCase().includes(location)
      );
    }
    
    filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);
    
    if (bedrooms > 0) {
      filtered = filtered.filter(p => p.bedrooms >= bedrooms);
    }
    
    if (propertyType) {
      filtered = filtered.filter(p => p.type === propertyType);
    }
    
    setFilteredProperties(filtered);
  }, [searchParams]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 px-4 bg-tuleeto-off-white">
        <div className="container max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Available Rentals</h1>
          
          <PropertyFilter />
          
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyListingCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold mb-2">No properties found</h3>
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
