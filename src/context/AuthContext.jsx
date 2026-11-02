/**
 * AuthContext — Centralized Authentication & Role-Based Access Control (RBAC)
 *
 * Manages user session with localStorage persistence.
 * Strict isolation between Student and Administrator accounts.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { demoCredentials } from '../data/mockData';

const AuthContext = createContext(null);

const STORAGE_KEY_USER = 'ilm_lms_user';

export function AuthProvider({ children }) {
  // Initialize from localStorage or null (unauthenticated by default)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored auth user', e);
    }
    // No automatic session - user must explicitly log in with credentials
    return null;
  });

  // Keep localStorage synchronized
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.error('Failed to update localStorage', e);
    }
  }, [user]);

  /**
   * Log in with credentials and expected role
   * @param {string} email
   * @param {string} password
   * @param {'student'|'admin'} expectedRole
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = useCallback(async (email, password, expectedRole = 'student') => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // Student Authentication Check
    if (expectedRole === 'student') {
      const isValidStudent =
        (cleanEmail === demoCredentials.student.email.toLowerCase() ||
          cleanEmail === demoCredentials.student.alternateEmail?.toLowerCase()) &&
        (cleanPass === demoCredentials.student.password || cleanPass === 'password123');

      if (isValidStudent) {
        const studentUser = {
          id: 'usr_001',
          name: demoCredentials.student.name,
          email: demoCredentials.student.email,
          role: 'student',
        };
        setUser(studentUser);
        return { success: true, user: studentUser };
      }

      return {
        success: false,
        error: 'Invalid student credentials. Use student@ilmessentials.pk / student123',
      };
    }

    // Admin Authentication Check
    if (expectedRole === 'admin') {
      const isValidAdmin =
        cleanEmail === demoCredentials.admin.email.toLowerCase() &&
        (cleanPass === demoCredentials.admin.password || cleanPass === 'adminpassword');

      if (isValidAdmin) {
        const adminUser = {
          id: 'adm_001',
          name: demoCredentials.admin.name,
          email: demoCredentials.admin.email,
          role: 'admin',
        };
        setUser(adminUser);
        return { success: true, user: adminUser };
      }

      return {
        success: false,
        error: 'Invalid staff credentials. Use admin@ilmessentials.pk / admin123',
      };
    }

    return { success: false, error: 'Unknown role specified.' };
  }, []);

  /**
   * Log out and clear session
   */
  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const isAuthenticated = Boolean(user && user.role);

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
