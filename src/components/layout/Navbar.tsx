import React from "react";
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
import { Home, LogOut, User, Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "@/components/ui/logo";
import { performCleanSignOut } from "@/utils/authUtils";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    try {
      await performCleanSignOut();
    } catch (error) {
      console.error("Sign out error:", error);
      // Force navigation even if signout fails
      window.location.href = '/auth';
    }
  };

  return (
    <nav className="fixed w-full top-0 z-50 backdrop-blur-md bg-white/20 border-b border-orange-200/30 shadow-sm">
      <div 
        className="absolute inset-0 bg-gradient-to-r from-orange-50/40 via-white/30 to-orange-100/40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(251, 146, 60, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(249, 115, 22, 0.03) 0%, transparent 50%)
          `
        }}
      />
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/listings" 
              className="text-gray-700 hover:text-tuleeto-orange transition-colors font-medium backdrop-blur-sm px-3 py-2 rounded-md"
            >
              Browse Properties
            </Link>
            <Link 
              to="/list-property" 
              className="text-gray-700 hover:text-tuleeto-orange transition-colors font-medium backdrop-blur-sm px-3 py-2 rounded-md"
            >
              List Property
            </Link>
            {user && (
              <Link 
                to="/wishlist" 
                className="text-gray-700 hover:text-tuleeto-orange transition-colors font-medium flex items-center gap-2 backdrop-blur-sm px-3 py-2 rounded-md"
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
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full backdrop-blur-sm">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback className="bg-tuleeto-orange text-white">
                        {user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
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
                  {/* Mobile-only navigation items */}
                  {isMobile && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/listings" className="w-full cursor-pointer md:hidden">
                          <span>Browse Properties</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/list-property" className="w-full cursor-pointer md:hidden">
                          <span>List Property</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  size={isMobile ? "sm" : "sm"}
                  className="text-gray-700 hover:text-tuleeto-orange backdrop-blur-sm"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
