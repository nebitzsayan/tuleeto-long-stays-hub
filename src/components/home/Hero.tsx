
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useLocationContext } from "@/contexts/LocationContext";

const Hero = () => {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { city, permissionStatus, isLoading, requestLocation } = useLocationContext();

  // Auto-request location permission on every mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Pre-fill search box with detected city
  useEffect(() => {
    if (city && permissionStatus === 'granted') {
      setLocation(city);
    }
  }, [city, permissionStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Navigate to listings page with search params
    navigate({
      pathname: '/listings',
      search: location ? `location=${encodeURIComponent(location)}` : ''
    });
  };

  return (
    <div className="relative min-h-[75vh] md:min-h-[90vh] flex flex-col items-center justify-center px-2 md:px-4 bg-white">
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="relative z-10 text-center max-w-4xl mx-auto w-full">
        <div className="mb-4 md:mb-8">
          <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
            <AspectRatio ratio={1} className="w-full">
              <img 
                src="/images-resources/8f53d3f9-c672-4dbc-8077-05b6cbfc2723.png" 
                alt="Person searching for home" 
                className="w-full h-full object-contain"
                width="320"
                height="320"
                fetchPriority="high"
              />
            </AspectRatio>
          </div>
        </div>
        
        <h1 className="text-xl md:text-6xl font-bold mb-2 md:mb-6 text-gray-800">
          Find Your Perfect <span className="text-tuleeto-orange">Long-Term Home</span>
        </h1>
        <p className="text-sm md:text-2xl text-gray-600 mb-4 md:mb-12">
          Discover properties for extended stays and make them your home
        </p>

        <div className="bg-white rounded-lg shadow-xl p-3 md:p-6 mx-auto max-w-3xl w-full">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 md:gap-4">
            <div className="flex-grow relative">
              {isLoading && (
                <Loader2 className="absolute left-3 top-2.5 md:top-3 h-4 w-4 md:h-5 md:w-5 text-tuleeto-orange animate-spin" />
              )}
              {!isLoading && (
                <MapPin className="absolute left-3 top-2.5 md:top-3 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              )}
              <Input
                type="text"
                placeholder={isLoading ? "Detecting location..." : "Where do you want to live?"}
                className="pl-10 h-9 md:h-12 text-sm md:text-lg"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              size={isMobile ? "mobile" : "default"}
              className="h-9 md:h-12 bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white w-full md:w-auto"
            >
              <Search className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> Search
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Hero;
