
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

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
        <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
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
