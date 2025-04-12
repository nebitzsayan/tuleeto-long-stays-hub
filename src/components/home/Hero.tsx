
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const Hero = () => {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Navigate to listings page with search params
    navigate({
      pathname: '/listings',
      search: location ? `location=${encodeURIComponent(location)}` : ''
    });
  };

  return (
    <div className="relative min-h-[80vh] md:min-h-[90vh] flex flex-col items-center justify-center px-4 bg-white">
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="relative z-10 text-center max-w-4xl mx-auto w-full">
        <div className="mb-6 md:mb-8">
          <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
            <AspectRatio ratio={16/9} className="bg-transparent rounded-md overflow-hidden">
              <img 
                src="/lovable-uploads/4e3ca7ad-2ec8-4b08-9eb4-753f2697ea5d.png" 
                alt="Person searching for home" 
                className="object-contain w-full h-full"
              />
            </AspectRatio>
          </div>
        </div>
        
        <h1 className="text-2xl md:text-6xl font-bold mb-4 md:mb-6 text-gray-800">
          Find Your Perfect <span className="text-tuleeto-orange">Long-Term Home</span>
        </h1>
        <p className="text-base md:text-2xl text-gray-600 mb-8 md:mb-12">
          Discover properties for extended stays and make them your home
        </p>

        <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 mx-auto max-w-3xl w-full">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Where do you want to live?"
                className="pl-10 h-12 text-lg"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-12 bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white w-full md:w-auto">
              <Search className="mr-2 h-5 w-5" /> Search
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Hero;
