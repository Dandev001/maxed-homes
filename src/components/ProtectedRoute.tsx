import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../utils/admin';
import { ROUTES } from '../constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that handles authentication-based routing
 * 
 * @param requireAuth - If true, requires user to be authenticated. If false, redirects if authenticated.
 * @param requireAdmin - If true, requires user to be an admin. Implies requireAuth.
 * @param redirectTo - Custom redirect path (defaults to LOGIN or HOME)
 */
export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If admin is required, check admin status
  if (requireAdmin) {
    // First check if user is authenticated
    if (!user) {
      return (
        <Navigate
          to={redirectTo || ROUTES.LOGIN}
          state={{ from: location }}
          replace
        />
      );
    }
    // Then check if user is admin
    if (!isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
            <Link
              to={redirectTo || ROUTES.HOME}
              className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      );
    }
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !user) {
    // Redirect to login, saving the current location for redirect after login
    return (
      <Navigate
        to={redirectTo || ROUTES.LOGIN}
        state={{ from: location }}
        replace
      />
    );
  }

  // If auth is not required but user is authenticated (e.g., login/register pages)
  if (!requireAuth && user) {
    return <Navigate to={redirectTo || ROUTES.HOME} replace />;
  }

  // User is authenticated (and admin if required) - render children
  return <>{children}</>;
}

