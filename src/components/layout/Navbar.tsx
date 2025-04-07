
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, User, LogIn, House } from "lucide-react";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Home className="h-6 w-6 text-tuleeto-orange" />
          <span className="text-2xl font-bold text-tuleeto-orange">Tuleeto</span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/listings"
            className="text-gray-700 hover:text-tuleeto-orange transition-colors"
          >
            Find Rentals
          </Link>
          <Link
            to="/list-property"
            className="text-gray-700 hover:text-tuleeto-orange transition-colors flex items-center gap-1"
          >
            <House className="h-4 w-4" /> Rent Your House
          </Link>
          <Link to="/login">
            <Button variant="outline" className="flex items-center gap-1 border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white">
              <LogIn className="h-4 w-4" /> Login
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" className="text-gray-700 hover:text-tuleeto-orange">
              <User className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" className="text-tuleeto-orange">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
