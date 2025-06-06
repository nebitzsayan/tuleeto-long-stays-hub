
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { isAdmin, logSecurityEvent } from "@/lib/security";

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
        const adminStatus = await isAdmin();
        setIsUserAdmin(adminStatus);
        
        if (!adminStatus) {
          await logSecurityEvent('unauthorized_admin_access_attempt', { 
            userId: user.id,
            userEmail: user.email 
          });
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        await logSecurityEvent('admin_check_error', { 
          userId: user.id,
          error: error 
        });
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
        <Loader2 className="h-8 w-8 animate-spin" />
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
