
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User, LogIn, House, LogOut, Plus, X, Shield } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

  // Check if user is admin
  useEffect(() => {
    if (user && user.email === "admin@gmail.com") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Fetch user avatar
  useEffect(() => {
    const fetchAvatar = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
          
          if (!error && data && data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        } catch (error) {
          console.error('Error fetching avatar:', error);
        }
      }
    };

    fetchAvatar();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
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
              
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-tuleeto-orange transition-colors flex items-center gap-1"
                >
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage src={avatarUrl || ""} alt="User profile" />
                      <AvatarFallback className="bg-tuleeto-orange text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
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
                    {isAdmin && (
                      <DropdownMenuItem>
                        <Link to="/admin" className="flex items-center w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
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
          {user ? (
            <Button variant="ghost" className="p-0 h-auto hover:bg-transparent" onClick={toggleMobileMenu}>
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-tuleeto-orange" />
              ) : (
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={avatarUrl || ""} alt="User profile" />
                  <AvatarFallback className="bg-tuleeto-orange text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              )}
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className="flex items-center gap-1 border-tuleeto-orange text-tuleeto-orange hover:bg-tuleeto-orange hover:text-white">
                <LogIn className="h-4 w-4" /> Login
              </Button>
            </Link>
          )}
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
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-tuleeto-orange transition-colors py-2 flex items-center gap-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Link>
                )}
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
