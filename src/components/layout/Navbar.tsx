import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, User, LogOut, Home, Plus, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/logo";
import { toast } from "sonner";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-100/30 via-orange-50/20 to-amber-50/30 backdrop-blur-lg border-b border-orange-200/40 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <Logo className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/listings" className="text-gray-800 hover:text-tuleeto-orange transition-colors font-semibold">
              Find Properties
            </Link>
            <Link to="/list-property" className="text-gray-800 hover:text-tuleeto-orange transition-colors font-semibold">
              List Property
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-transparent border-0 shadow-none">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={userProfile?.avatar_url || ""} 
                          alt={userProfile?.full_name || "User"} 
                        />
                        <AvatarFallback className="bg-tuleeto-orange text-white">
                          {userProfile?.full_name ? (
                            userProfile.full_name
                              .split(' ')
                              .map(name => name[0])
                              .join('')
                              .toUpperCase()
                              .substring(0, 2)
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white shadow-lg border" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>My Profile</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/my-properties" className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        My Properties
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/list-property" className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        List Property
                      </Link>
                    </DropdownMenuItem>
                    {userProfile?.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="bg-transparent border-0 shadow-none text-gray-800 font-semibold hover:text-tuleeto-orange">
                  <Link to="/auth">Sign In</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-transparent border-0 shadow-none">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={userProfile?.avatar_url || ""} 
                        alt={userProfile?.full_name || "User"} 
                      />
                      <AvatarFallback className="bg-tuleeto-orange text-white">
                        {userProfile?.full_name ? (
                          userProfile.full_name
                            .split(' ')
                            .map(name => name[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2)
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white shadow-lg border" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>My Profile</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/listings" className="flex items-center">
                      Find Properties
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-properties" className="flex items-center">
                      <Home className="mr-2 h-4 w-4" />
                      My Properties
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/list-property" className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      List Property
                    </Link>
                  </DropdownMenuItem>
                  {userProfile?.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="bg-transparent border-0 shadow-none text-gray-800"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu - With white background */}
        {isMobileMenuOpen && !user && (
          <div className="md:hidden fixed inset-0 top-16 bg-white z-40 shadow-lg">
            <div className="h-full flex flex-col">
              <div className="flex-1 px-6 py-6 space-y-6">
                <Link 
                  to="/listings" 
                  className="block text-gray-800 hover:text-tuleeto-orange transition-colors py-4 text-lg font-medium border-b border-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Find Properties
                </Link>
                <Link 
                  to="/list-property" 
                  className="block text-gray-800 hover:text-tuleeto-orange transition-colors py-4 text-lg font-medium border-b border-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  List Property
                </Link>
              </div>
              
              {/* Sign In Button - Fixed at bottom with white background */}
              <div className="p-6 border-t border-gray-100 bg-white">
                <Link
                  to="/auth"
                  className="block w-full text-center bg-tuleeto-orange text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-orange-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
