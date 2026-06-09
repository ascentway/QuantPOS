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

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
