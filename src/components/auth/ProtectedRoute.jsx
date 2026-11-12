/**
 * ProtectedRoute — Route Guard for Role-Based Access Control (RBAC)
 *
 * Ensures unauthenticated users are redirected to login.
 * Ensures students cannot access administrator endpoints.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole, allowAdmin = false }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Admin Route Protection: if not authenticated or not an admin, send directly to /admin/login
  if (requiredRole === 'admin') {
    if (!isAuthenticated || user?.role !== 'admin') {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return children;
  }

  // 2. Unauthenticated Check for student routes
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Admin attempting to view student routes -> allow if preview enabled, else redirect to /admin
  if (requiredRole === 'student' && user?.role === 'admin') {
    if (allowAdmin) {
      return children;
    }
    return <Navigate to="/admin" replace />;
  }

  return children;
}
