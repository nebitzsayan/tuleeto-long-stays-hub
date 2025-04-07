
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const Hero = () => {
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      toast.error("Please enter a location");
      return;
    }
    // Navigate to listings page with search params
    window.location.href = `/listings?location=${encodeURIComponent(location)}`;
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 bg-white">
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-800">
          Find Your Perfect <span className="text-tuleeto-orange">Long-Term Home</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-12">
          Discover properties for extended stays and make them your home
        </p>

        <div className="bg-white rounded-lg shadow-xl p-6 mx-auto max-w-3xl">
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
            <div className="grid grid-cols-2 gap-4 md:flex">
              <Select>
                <SelectTrigger className="h-12 w-full md:w-32">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1000">$0 - $1000</SelectItem>
                  <SelectItem value="1000-2000">$1000 - $2000</SelectItem>
                  <SelectItem value="2000-3000">$2000 - $3000</SelectItem>
                  <SelectItem value="3000+">$3000+</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-12 w-full md:w-32">
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+ Bedroom</SelectItem>
                  <SelectItem value="2">2+ Bedrooms</SelectItem>
                  <SelectItem value="3">3+ Bedrooms</SelectItem>
                  <SelectItem value="4">4+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="h-12 bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white col-span-2">
                <Search className="mr-2 h-5 w-5" /> Search
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Hero;
