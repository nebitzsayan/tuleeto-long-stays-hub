import { useEffect, useState } from "react";
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
  const { user, userProfile, isLoading } = useAuth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        console.log('AdminRoute: No user found, skipping admin check');
        setIsCheckingAdmin(false);
        setHasChecked(true);
        return;
      }

      console.log('AdminRoute: Checking admin status for user:', user.email);
      let adminStatus = false;

      try {
        // Primary check via RPC
        const { data, error } = await supabase.rpc('is_current_user_admin');
        
        if (error) {
          console.error('AdminRoute: RPC admin check failed:', error);
          
          // Fallback: check user_roles directly
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
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
        
        // Log unauthorized access attempts and show toast
        if (!adminStatus) {
          console.log('AdminRoute: Admin access denied for user:', user.email);
          toast.error('Admin access denied. You do not have admin privileges.');
          
          await logSecurityEvent('unauthorized_admin_access_attempt', { 
            userId: user.id,
            userEmail: user.email 
          });
        } else {
          console.log('AdminRoute: Admin access granted for user:', user.email);
        }
      } catch (error) {
        console.error('AdminRoute: Admin check failed completely:', error);
        setIsUserAdmin(false);
        toast.error('Failed to verify admin access. Please try again.');
      } finally {
        setIsCheckingAdmin(false);
        setHasChecked(true);
      }
    };

    if (!isLoading && !hasChecked) {
      checkAdminStatus();
    }
  }, [user, isLoading, hasChecked]);

  // Reset check when user changes
  useEffect(() => {
    setHasChecked(false);
    setIsCheckingAdmin(true);
    setIsUserAdmin(false);
  }, [user?.id]);

  if (isLoading || isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PropertyLoader size="lg" text="Verifying admin access..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isUserAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;