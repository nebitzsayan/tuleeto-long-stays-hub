
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, IndianRupee } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const PropertyFilter = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [minPrice, setMinPrice] = useState(Number(searchParams.get("minPrice")) || 500);
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("maxPrice")) || 150000);
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [propertyType, setPropertyType] = useState(searchParams.get("type") || "");

  // Update form values when URL params change
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setMinPrice(Number(searchParams.get("minPrice")) || 500);
    setMaxPrice(Number(searchParams.get("maxPrice")) || 150000);
    setBedrooms(searchParams.get("bedrooms") || "");
    setPropertyType(searchParams.get("type") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
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
    <div className="bg-white p-2 md:p-4 rounded-lg shadow-md mb-3 md:mb-6">
      <form onSubmit={handleSearch}>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-2 md:mb-4">
          <div className="flex-grow">
            <Input
              type="text"
              placeholder="Search by location or property title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 md:h-12"
            />
          </div>
          <Button 
            type="submit" 
            size={isMobile ? "mobile" : "default"}
            className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white h-9 md:h-12"
          >
            <Search className="h-4 w-4 md:mr-2" />
            {!isMobile && <span>Search</span>}
          </Button>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 pt-2 md:pt-4 border-t border-gray-200`}>
          <div>
            <Label htmlFor="price-range" className="mb-1 md:mb-2 block flex items-center text-xs md:text-sm">
              <IndianRupee className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Price Range: ₹{minPrice.toLocaleString('en-IN')} - ₹{maxPrice === 150000 ? "150,000+" : maxPrice.toLocaleString('en-IN')}
            </Label>
            <div className="pt-2 md:pt-4 px-2">
              <Slider
                id="price-range"
                value={[minPrice, maxPrice]}
                min={500}
                max={150000}
                step={1000}
                onValueChange={(values) => {
                  setMinPrice(values[0]);
                  setMaxPrice(values[1]);
                }}
                className="my-2 md:my-4"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="bedrooms" className="mb-1 md:mb-2 block text-xs md:text-sm">Bedrooms</Label>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger id="bedrooms" className="h-9 md:h-12 bg-white">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white w-full z-50">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="property-type" className="mb-1 md:mb-2 block text-xs md:text-sm">Property Type</Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger id="property-type" className="h-9 md:h-12 bg-white">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white w-full z-50">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Studio">Studio</SelectItem>
                <SelectItem value="Condo">Condo</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Flat">Flat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isMobile && (
            <Button 
              type="submit" 
              size="mobile"
              className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white mt-2"
            >
              Apply Filters
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PropertyFilter;
