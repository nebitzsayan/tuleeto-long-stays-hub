import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

const cities = [
  { name: "Bangalore", image: "/images-resources/bangalore-city.png" },
  { name: "Darjeeling", image: "/images-resources/darjeeling-city.png" },
  { name: "Siliguri", image: "/images-resources/siliguri-city.png" },
  { name: "Puri", image: "/images-resources/puri-city-new.png" },
  { name: "Delhi", image: "/images-resources/delhi-city-new.png" },
  { name: "Kolkata", image: "/images-resources/kolkata-city.png" },
  { name: "Mumbai", image: "/images-resources/mumbai-city.png" },
  { name: "Chennai", image: "/images-resources/chennai-city.png" },
];

const ExploreCities = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Explore Rentals by City on Tuleeto
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find your perfect home in India's top cities. Browse verified rental properties with direct owner contact.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {cities.map((city) => (
            <Link
              key={city.name}
              to={`/listings?search=${city.name}`}
              className="group relative overflow-hidden rounded-lg border border-border p-4 hover:shadow-lg transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: '#FEF8F2' }}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <img 
                  src={city.image} 
                  alt={`${city.name} city`}
                  className="w-24 h-24 object-contain"
                />
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {city.name}
                  </h3>
                  <div className="flex items-center justify-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>View Properties</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExploreCities;
