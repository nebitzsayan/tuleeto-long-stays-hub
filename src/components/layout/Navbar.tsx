
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User, LogIn, House, LogOut, Plus, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

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

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 flex justify-between items-center">
        <Logo />

        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/listings"
            className="text-gray-700 hover:text-tuleeto-orange transition-colors"
          >
            Find Rentals
          </Link>
          
          {user ? (
            <>
              <Link
                to="/list-property"
                className="text-gray-700 hover:text-tuleeto-orange transition-colors flex items-center gap-1"
              >
                <House className="h-4 w-4" /> Rent Your House
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:text-tuleeto-orange">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Link to="/profile" className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to="/list-property" className="flex items-center w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        <span>List a Property</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to="/my-properties" className="flex items-center w-full">
                        <House className="mr-2 h-4 w-4" />
                        <span>My Properties</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className="flex items-center gap-1 border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white">
                <LogIn className="h-4 w-4" /> Login
              </Button>
            </Link>
          )}
        </div>

        <div className="md:hidden">
          <Button variant="ghost" className="text-tuleeto-orange" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg py-4 px-4 absolute w-full">
          <div className="flex flex-col space-y-4">
            <Link
              to="/listings"
              className="text-gray-700 hover:text-tuleeto-orange transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Rentals
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/list-property"
                  className="text-gray-700 hover:text-tuleeto-orange transition-colors py-2 flex items-center gap-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <House className="h-4 w-4" /> Rent Your House
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-tuleeto-orange transition-colors py-2 flex items-center gap-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link
                  to="/my-properties"
                  className="text-gray-700 hover:text-tuleeto-orange transition-colors py-2 flex items-center gap-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <House className="h-4 w-4" /> My Properties
                </Link>
                <Button 
                  variant="ghost" 
                  className="text-gray-700 hover:text-tuleeto-orange justify-start p-0 h-auto hover:bg-transparent"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-1" /> Log out
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="flex items-center gap-1 border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white w-full">
                  <LogIn className="h-4 w-4" /> Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
