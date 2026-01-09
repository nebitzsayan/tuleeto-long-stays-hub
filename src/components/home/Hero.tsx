import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useLocationContext } from "@/contexts/LocationContext";

// Indian cities for autocomplete
const indianCities = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Pune", "Kolkata", "Jaipur", "Ahmedabad", "Chandigarh",
  "Lucknow", "Surat", "Kochi", "Indore", "Bhopal",
  "Nagpur", "Patna", "Vadodara", "Ghaziabad", "Ludhiana",
  "Coimbatore", "Agra", "Madurai", "Nashik", "Faridabad",
  "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad",
  "Dhanbad", "Amritsar", "Jodhpur", "Ranchi", "Raipur",
  "Siliguri", "Guwahati", "Dehradun", "Mangalore", "Mysore",
  "Bhubaneswar", "Puri", "Cuttack", "Vizag", "Visakhapatnam",
  "Thiruvananthapuram", "Noida", "Gurgaon", "Thane", "Navi Mumbai"
];

const Hero = () => {
  const [location, setLocation] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const hasUserTyped = useRef(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { city, permissionStatus, isLoading, requestLocation } = useLocationContext();

  // Auto-request location permission on every mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Pre-fill search box with detected city (only if user hasn't typed)
  useEffect(() => {
    if (city && !hasUserTyped.current) {
      setLocation(city);
    }
  }, [city]);

  // Filter cities based on input
  useEffect(() => {
    if (location.length > 0) {
      const filtered = indianCities.filter(c =>
        c.toLowerCase().startsWith(location.toLowerCase())
      );
      setFilteredCities(filtered.slice(0, 6)); // Show max 6 suggestions
    } else {
      setFilteredCities([]);
    }
  }, [location]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    navigate({
      pathname: '/listings',
      search: location ? `location=${encodeURIComponent(location)}` : ''
    });
  };

  const handleCitySelect = (selectedCity: string) => {
    setLocation(selectedCity);
    setShowSuggestions(false);
    navigate({
      pathname: '/listings',
      search: `location=${encodeURIComponent(selectedCity)}`
    });
  };

  return (
    <div className="relative min-h-[75vh] md:min-h-[90vh] flex flex-col items-center justify-center px-2 md:px-4 bg-white">
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="relative z-10 text-center max-w-4xl mx-auto w-full">
        <div className="mb-4 md:mb-8 mt-12 md:mt-8">
          <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
            <AspectRatio ratio={1} className="w-full">
              <img 
                src="/images-resources/8f53d3f9-c672-4dbc-8077-05b6cbfc2723.png" 
                alt="Person searching for home" 
                className="w-full h-full object-contain"
                width="320"
                height="320"
                fetchPriority="high"
                decoding="async"
              />
            </AspectRatio>
          </div>
        </div>
        
        <h1 className="text-xl md:text-6xl font-bold mb-2 md:mb-6 text-gray-800">
          Tuleeto - Find Your Perfect Rental Home in India
        </h1>
        <p className="sr-only">
          <strong>Tuleeto</strong> is a modern rental platform connecting tenants and property owners through a secure, AI-ready web application. Discover apartments, houses, and commercial spaces across India with verified listings and direct owner contact.
        </p>

        <div className="bg-white rounded-lg shadow-xl p-3 md:p-6 mx-auto max-w-3xl w-full">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 md:gap-4">
            <div className="flex-grow relative">
              {isLoading && (
                <Loader2 className="absolute left-3 top-2.5 md:top-3 h-4 w-4 md:h-5 md:w-5 text-tuleeto-orange animate-spin z-10" />
              )}
              {!isLoading && (
                <MapPin 
                  className="absolute left-3 top-2.5 md:top-3 h-4 w-4 md:h-5 md:w-5 text-gray-400 cursor-pointer hover:text-tuleeto-orange transition-colors z-10" 
                  onClick={() => {
                    hasUserTyped.current = false; // Reset so detected city will be used
                    requestLocation();
                  }} 
                />
              )}
              <Input
                ref={inputRef}
                type="text"
                placeholder={isLoading ? "Detecting location..." : city ? `Search ${city} property` : "Where do you want to live?"}
                className="pl-10 pr-3 h-9 md:h-12 text-sm md:text-lg"
                value={location}
                onChange={(e) => {
                  hasUserTyped.current = true; // User is typing manually
                  setLocation(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                disabled={isLoading}
                autoComplete="off"
              />
              
              {/* City Autocomplete Dropdown */}
              {showSuggestions && filteredCities.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
                >
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCitySelect(c)}
                      className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center gap-2 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <MapPin className="h-4 w-4 text-tuleeto-orange flex-shrink-0" />
                      <span className="text-gray-700">{c}</span>
                    </button>
                  ))}
                </div>
              )}
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
