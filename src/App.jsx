/**
 * App — Root Application with Centralized AuthProvider and Role Guards (RBAC)
 *
 * Dedicated Account Isolation:
 * - Student Access: /dashboard, /courses, /course/:id, /library
 * - Administrator Access: /admin
 * - Student Login: /login
 * - Staff/Admin Login: /admin/login
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import CourseView from './pages/CourseView';
import MyCourses from './pages/MyCourses';
import ELibrary from './pages/ELibrary';
import AdminDashboard from './pages/AdminDashboard';
import CreateCourse from './pages/CreateCourse';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';

/** Root route router — directs guests to /login, students to /dashboard, admins to /admin */
function RootRoute() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default entry point: direct to /login if unauthenticated */}
          <Route path="/" element={<RootRoute />} />

          {/* Dedicated Login Endpoints */}
          <Route path="/login" element={<Login />} />
          <Route path="/student/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:id"
            element={
              <ProtectedRoute requiredRole="student">
                <CourseView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute requiredRole="student">
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute requiredRole="student">
                <ELibrary />
              </ProtectedRoute>
            }
          />

          {/* Protected Administrator Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/new"
            element={
              <ProtectedRoute requiredRole="admin">
                <CreateCourse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/edit/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <CreateCourse />
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
