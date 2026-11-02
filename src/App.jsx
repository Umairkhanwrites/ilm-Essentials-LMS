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

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import CourseView from './pages/CourseView';
import MyCourses from './pages/MyCourses';
import ELibrary from './pages/ELibrary';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default redirect to student dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

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

          {/* Protected Administrator Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
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
