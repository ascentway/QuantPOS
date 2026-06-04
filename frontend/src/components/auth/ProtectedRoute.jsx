import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Guards a route behind authentication and optionally a role check.
 *
 * @param {string[]} requiredRoles - Optional. If provided, user must have one of these roles.
 *                                   e.g. requiredRoles={['OWNER', 'MANAGER']}
 *                                   Roles must match the backend Role enum exactly (uppercase).
 */
const ProtectedRoute = ({ children, requiredRoles }) => {
  const { accessToken, user } = useAuthStore((state) => ({
    accessToken: state.accessToken,
    user: state.user,
  }));

  // Not authenticated — redirect to login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Role check — if requiredRoles is provided, user.role must be in the list
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user?.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
