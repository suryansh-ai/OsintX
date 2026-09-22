/**
 * Protected Route Component
 * Restricts access based on authentication and user roles
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingOverlay } from '../common/Loading';

export const ProtectedRoute = ({ children, requireAuth = true, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingOverlay message="Verifying access..." />;
  }

  // Redirect to login if authentication required but user not logged in
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={`/dashboard/${user?.role || 'student'}`} replace />;
  }

  return children;
};

export const GuestRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingOverlay message="Loading..." />;
  }

  // Redirect authenticated users to their dashboard
  if (user?.role) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return children;
};

export const RoleRoute = ({ children, role: requiredRole }) => {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[requiredRole]}>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;
