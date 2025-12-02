import { Home, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4">
      <div className="text-center max-w-2xl">
        {/* Animated 404 with Bouncing Icon */}
        <div className="relative mb-8">
          <h1 className="text-[120px] sm:text-[160px] md:text-[200px] font-bold text-tuleeto-orange/20 select-none animate-pulse leading-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce">
              <MapPin className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-tuleeto-orange drop-shadow-lg" />
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 animate-fade-in">
          Oops! This Property Doesn't Exist
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto animate-fade-in">
          The page you're looking for has moved or doesn't exist. Let's help you find your perfect rental instead!
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <Button 
            asChild 
            size="lg"
            className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg"
            className="border-2 border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white transition-all"
          >
            <Link to="/listings">
              <Search className="mr-2 h-5 w-5" />
              Browse Listings
            </Link>
          </Button>
        </div>
        
        {/* Decorative Elements */}
        <div className="mt-12 flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-tuleeto-orange/40 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
