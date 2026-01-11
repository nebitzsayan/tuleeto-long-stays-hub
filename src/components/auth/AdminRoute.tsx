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

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsCheckingAdmin(false);
        return;
      }

      try {
        // Primary check via RPC
        const { data, error } = await supabase.rpc('is_current_user_admin');
        
        if (error) {
          console.error('RPC admin check failed:', error);
          
          // Fallback: check user_roles directly
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();
          
          if (roleError) {
            console.error('Fallback admin check failed:', roleError);
            setIsUserAdmin(false);
          } else {
            setIsUserAdmin(!!roleData);
          }
        } else {
          setIsUserAdmin(data || false);
        }
        
        // Log unauthorized access attempts
        if (!isUserAdmin) {
          await logSecurityEvent('unauthorized_admin_access_attempt', { 
            userId: user.id,
            userEmail: user.email 
          });
        }
      } catch (error) {
        console.error('Admin check failed completely:', error);
        setIsUserAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    if (!isLoading) {
      checkAdminStatus();
    }
  }, [user, userProfile, isLoading]);

  if (isLoading || isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PropertyLoader size="lg" text="Verifying access..." />
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
