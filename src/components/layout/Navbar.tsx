
import React, { useState, useEffect } from "react";
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
import { Home, LogOut, User, Heart, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "@/components/ui/logo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Navbar = () => {
  const { user, userProfile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Show install on iOS even without the event
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isStandalone) {
      setShowInstall(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstall(false);
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
            {showInstall && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleInstallClick}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Install App
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full backdrop-blur-sm">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile?.avatar_url || user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback className="bg-tuleeto-orange text-white">
                        {userProfile?.full_name ? (
                          userProfile.full_name
                            .split(' ')
                            .map((name: string) => name[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2)
                        ) : (
                          user.email?.[0]?.toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.full_name || user?.user_metadata?.full_name || 'User'}</p>
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
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
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
