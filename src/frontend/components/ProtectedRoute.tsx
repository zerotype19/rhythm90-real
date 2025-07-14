import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

function ProtectedRoute() {
  const { user, teams, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user has no teams and is not already on onboarding, redirect to onboarding
  if (teams.length === 0 && location.pathname !== '/app/onboarding') {
    return <Navigate to="/app/onboarding" replace />;
  }

  // If user has teams and is on onboarding, redirect to dashboard
  if (teams.length > 0 && location.pathname === '/app/onboarding') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute; 