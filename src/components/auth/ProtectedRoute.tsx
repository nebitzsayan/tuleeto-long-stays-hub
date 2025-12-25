
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyLoader } from '@/components/ui/property-loader';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, redirectTo = '/auth', requireAdmin = false }: ProtectedRouteProps) => {
  const { user, userProfile, isLoading } = useAuth();

  console.log('ProtectedRoute - User:', user?.email, 'Profile:', userProfile, 'Loading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PropertyLoader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} />;
  }

  if (requireAdmin && !userProfile?.isAdmin) {
    console.log('Admin required but user is not admin, redirecting to home');
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
