import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, LogOut, Menu, User, Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "./Logo";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/listings" 
              className="text-gray-600 hover:text-tuleeto-orange transition-colors font-medium"
            >
              Browse Properties
            </Link>
            <Link 
              to="/list-property" 
              className="text-gray-600 hover:text-tuleeto-orange transition-colors font-medium"
            >
              List Property
            </Link>
            {user && (
              <Link 
                to="/wishlist" 
                className="text-gray-600 hover:text-tuleeto-orange transition-colors font-medium flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                Wishlist
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-properties" className="w-full cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      <span>My Properties</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist" className="w-full cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Wishlist</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button 
                    variant="ghost" 
                    size={isMobile ? "mobile" : "sm"}
                    className="text-gray-600 hover:text-tuleeto-orange"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    size={isMobile ? "mobile" : "sm"}
                    className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white py-2 border-t border-gray-100">
            <div className="flex flex-col items-center space-y-3">
              <Link to="/listings" className="text-gray-600 hover:text-tuleeto-orange transition-colors font-medium">
                Browse Properties
              </Link>
              <Link to="/list-property" className="text-gray-600 hover:text-tuleeto-orange transition-colors font-medium">
                List Property
              </Link>
              {user && (
                <>
                  <Link to="/profile" className="text-gray-600 hover:text-tuleeto-orange transition-colors font-medium">
                    Profile
                  </Link>
                  <Link to="/my-properties" className="text-gray-600 hover:text-tuleeto-orange transition-colors font-medium">
                    My Properties
                  </Link>
                  <Link to="/wishlist" className="text-gray-600 hover:text-tuleeto-orange transition-colors font-medium">
                    Wishlist
                  </Link>
                  <Button onClick={handleSignOut} variant="ghost" className="text-gray-600 hover:text-tuleeto-orange transition-colors font-medium">
                    Log out
                  </Button>
                </>
              )}
              {!user && (
                <>
                  <Link to="/auth" className="text-gray-600 hover:text-tuleeto-orange transition-colors font-medium">
                    Sign In
                  </Link>
                  <Link to="/auth" className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white font-medium px-4 py-2 rounded-md transition-colors">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
