import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logSecurityEvent } from "@/lib/secureLogging";
import { PropertyLoader } from "@/components/ui/property-loader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

const ADMIN_CHECK_TIMEOUT = 10000; // 10 seconds

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async (userId: string, userEmail: string) => {
    console.log('AdminRoute: Checking admin status for user:', userEmail);
    setIsCheckingAdmin(true);
    setCheckError(null);
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Admin verification timed out')), ADMIN_CHECK_TIMEOUT);
      });

      // Create the admin check promise
      const checkPromise = async () => {
        // Primary check via RPC
        const { data, error } = await supabase.rpc('is_current_user_admin');
        
        if (error) {
          console.error('AdminRoute: RPC admin check failed:', error);
          
          // Fallback: check user_roles directly
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();
          
          if (roleError) {
            console.error('AdminRoute: Fallback admin check failed:', roleError);
            return false;
          }
          
          console.log('AdminRoute: Fallback check result:', !!roleData);
          return !!roleData;
        }
        
        console.log('AdminRoute: RPC check result:', data === true);
        return data === true;
      };

      // Race between timeout and actual check
      const adminStatus = await Promise.race([
        checkPromise(),
        timeoutPromise
      ]);

      setIsUserAdmin(adminStatus);
      setCheckedUserId(userId);
      
      // Log unauthorized access attempts
      if (!adminStatus) {
        console.log('AdminRoute: Admin access denied for user:', userEmail);
        toast.error('Admin access denied. You do not have admin privileges.');
        
        await logSecurityEvent('unauthorized_admin_access_attempt', { 
          userId,
          userEmail 
        });
      } else {
        console.log('AdminRoute: Admin access granted for user:', userEmail);
      }
    } catch (error) {
      console.error('AdminRoute: Admin check failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCheckError(errorMessage);
      setIsUserAdmin(false);
      setCheckedUserId(userId);
      
      if (errorMessage.includes('timed out')) {
        toast.error('Admin verification timed out. Please retry.');
      } else {
        toast.error('Failed to verify admin access. Please try again.');
      }
    } finally {
      setIsCheckingAdmin(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (user) {
      setCheckedUserId(null);
      setIsUserAdmin(null);
      setCheckError(null);
    }
  }, [user]);

  useEffect(() => {
    // Only check if we have a user and haven't checked this user yet
    if (!authLoading && user && checkedUserId !== user.id) {
      checkAdminStatus(user.id, user.email || '');
    }
    
    // Reset state when user logs out
    if (!authLoading && !user && checkedUserId !== null) {
      setIsUserAdmin(null);
      setCheckedUserId(null);
      setCheckError(null);
    }
  }, [user, authLoading, checkedUserId, checkAdminStatus]);

  // Show loader while auth is loading or while checking admin status
  if (authLoading || isCheckingAdmin || (user && isUserAdmin === null && !checkError)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <PropertyLoader size="lg" text="Verifying admin access..." />
      </div>
    );
  }

  // Show error state with retry option
  if (checkError && user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 p-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Verification Failed</h2>
          <p className="text-muted-foreground max-w-md">
            {checkError === 'Admin verification timed out' 
              ? 'The admin verification took too long. This could be a network issue.'
              : 'Failed to verify admin access. Please try again.'}
          </p>
        </div>
        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry Verification
        </Button>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to home if not admin
  if (isUserAdmin === false) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
