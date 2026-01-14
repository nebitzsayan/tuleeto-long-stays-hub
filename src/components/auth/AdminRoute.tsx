import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logSecurityEvent } from "@/lib/secureLogging";
import { PropertyLoader } from "@/components/ui/property-loader";
import { toast } from "sonner";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async (userId: string, userEmail: string) => {
    console.log('AdminRoute: Checking admin status for user:', userEmail);
    setIsCheckingAdmin(true);
    
    try {
      // Primary check via RPC
      const { data, error } = await supabase.rpc('is_current_user_admin');
      
      let adminStatus = false;
      
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
          adminStatus = false;
        } else {
          adminStatus = !!roleData;
          console.log('AdminRoute: Fallback check result:', adminStatus);
        }
      } else {
        adminStatus = data === true;
        console.log('AdminRoute: RPC check result:', adminStatus);
      }

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
      console.error('AdminRoute: Admin check failed completely:', error);
      setIsUserAdmin(false);
      setCheckedUserId(userId);
      toast.error('Failed to verify admin access. Please try again.');
    } finally {
      setIsCheckingAdmin(false);
    }
  }, []);

  useEffect(() => {
    // Only check if we have a user and haven't checked this user yet
    if (!authLoading && user && checkedUserId !== user.id) {
      checkAdminStatus(user.id, user.email || '');
    }
    
    // Reset state when user logs out
    if (!authLoading && !user && checkedUserId !== null) {
      setIsUserAdmin(null);
      setCheckedUserId(null);
    }
  }, [user, authLoading, checkedUserId, checkAdminStatus]);

  // Show loader while auth is loading or while checking admin status
  if (authLoading || isCheckingAdmin || (user && isUserAdmin === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <PropertyLoader size="lg" text="Verifying admin access..." />
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