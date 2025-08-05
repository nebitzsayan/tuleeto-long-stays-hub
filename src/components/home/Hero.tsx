
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const [searchLocation, setSearchLocation] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchLocation.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchLocation)}`);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 z-10"></div>
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images-resources/59d0637d-392f-4229-908a-fa6bc4dc3db2.png')"
        }}
      ></div>

      {/* Content */}
      <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Find Your Perfect
          <span className="block text-tuleeto-orange">Home in India</span>
        </h1>
        
        <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-2xl mx-auto">
          Discover amazing rental properties across India. From cozy apartments to spacious villas, 
          find your next home with ease.
        </p>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Enter city, area, or landmark..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 py-3 text-lg bg-white/90 border-0 focus:bg-white transition-colors"
            />
          </div>
          <Button 
            onClick={handleSearch}
            className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white px-8 py-3 text-lg font-semibold transition-colors"
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl md:text-3xl font-bold text-tuleeto-orange">1000+</div>
            <div className="text-sm text-gray-300">Properties</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-tuleeto-orange">50+</div>
            <div className="text-sm text-gray-300">Cities</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-tuleeto-orange">500+</div>
            <div className="text-sm text-gray-300">Happy Tenants</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-tuleeto-orange">24/7</div>
            <div className="text-sm text-gray-300">Support</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
