
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const PropertyFilter = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [minPrice, setMinPrice] = useState(Number(searchParams.get("minPrice")) || 0);
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("maxPrice")) || 5000);
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [propertyType, setPropertyType] = useState(searchParams.get("type") || "");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (propertyType) params.set("type", propertyType);
    params.set("minPrice", minPrice.toString());
    params.set("maxPrice", maxPrice.toString());
    
    navigate({
      pathname: "/listings",
      search: params.toString(),
    });
  };

  return (
    <div className="bg-white p-3 md:p-4 rounded-lg shadow-md mb-6">
      <form onSubmit={handleSearch}>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4">
          <div className="flex-grow">
            <Input
              type="text"
              placeholder="Location, neighborhood, or address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 md:h-12"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 h-10 md:h-12"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="inline-block">{isMobile ? "" : "Filters"}</span>
          </Button>
          <Button 
            type="submit" 
            className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white h-10 md:h-12"
          >
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <Label htmlFor="price-range" className="mb-2 block">
                Price Range: ${minPrice} - ${maxPrice === 5000 ? "5000+" : maxPrice}
              </Label>
              <div className="pt-4 px-2">
                <Slider
                  defaultValue={[minPrice, maxPrice]}
                  max={5000}
                  step={100}
                  onValueChange={(values) => {
                    setMinPrice(values[0]);
                    setMaxPrice(values[1]);
                  }}
                  className="my-4"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bedrooms" className="mb-2 block">Bedrooms</Label>
              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger id="bedrooms" className="h-10 md:h-12">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="property-type" className="mb-2 block">Property Type</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="property-type" className="h-10 md:h-12">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Studio">Studio</SelectItem>
                  <SelectItem value="Condo">Condo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PropertyFilter;
