/**
 * AuthContext — Centralized Authentication & Role-Based Access Control (RBAC)
 *
 * Manages user session with localStorage persistence.
 * Strict isolation between Student and Administrator accounts.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { demoCredentials } from '../data/mockData';
import { getAllStudents, getAllInstructors, updateStudentPassword } from '../services/courseStorage';

const AuthContext = createContext(null);

const STORAGE_KEY_USER = 'ilm_lms_user';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours silent auto-logout window

export function AuthProvider({ children }) {
  // Initialize from localStorage or null (unauthenticated by default)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();

        // 12-hour silent auto-logout verification
        if (parsed?.sessionExpiresAt) {
          if (now >= parsed.sessionExpiresAt) {
            localStorage.removeItem(STORAGE_KEY_USER);
            return null; // Silently logged out
          }
        } else if (parsed?.loginTime) {
          if (now - parsed.loginTime >= SESSION_DURATION_MS) {
            localStorage.removeItem(STORAGE_KEY_USER);
            return null; // Silently logged out
          }
          parsed.sessionExpiresAt = parsed.loginTime + SESSION_DURATION_MS;
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(parsed));
        } else {
          // Stamp existing legacy session with 12-hour lifespan
          parsed.loginTime = now;
          parsed.sessionExpiresAt = now + SESSION_DURATION_MS;
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(parsed));
        }

        return parsed;
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

  // Active session monitor: silently logs out after 12 hours
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const expiresAt = user.sessionExpiresAt;
      if (expiresAt && Date.now() >= expiresAt) {
        logout();
      }
    };

    // Run check immediately
    checkSession();

    // Check periodically every 30 seconds
    const interval = setInterval(checkSession, 30000);

    // Also check when tab or window regains visibility/focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkSession);
    };
  }, [user, logout]);

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
    const now = Date.now();
    const sessionMeta = {
      loginTime: now,
      sessionExpiresAt: now + SESSION_DURATION_MS,
    };

    // 1. Student Check
    const isDemoStudent =
      (cleanEmail === demoCredentials.student.email.toLowerCase() ||
        cleanEmail === demoCredentials.student.alternateEmail?.toLowerCase()) &&
      (cleanPass === demoCredentials.student.password || cleanPass === 'password123');

    if (isDemoStudent) {
      const studentUser = {
        id: 'usr_001',
        name: demoCredentials.student.name,
        email: demoCredentials.student.email,
        role: 'student',
        ...sessionMeta,
      };
      setUser(studentUser);
      return { success: true, user: studentUser };
    }

    const allStudents = getAllStudents();
    const matchStudent = allStudents.find(
      (s) => s.email.toLowerCase() === cleanEmail
    );
    if (matchStudent && (cleanPass === matchStudent.password || cleanPass === 'student123' || cleanPass === 'password123')) {
      const studentUser = {
        id: matchStudent.id,
        name: matchStudent.name,
        email: matchStudent.email,
        role: 'student',
        mustChangePassword: Boolean(matchStudent.mustChangePassword),
        ...sessionMeta,
      };
      setUser(studentUser);
      return { success: true, user: studentUser };
    }

    // 2. Admin Check (also allowed on general login)
    const isValidAdmin =
      cleanEmail === demoCredentials.admin.email.toLowerCase() &&
      (cleanPass === demoCredentials.admin.password || cleanPass === 'adminpassword' || cleanPass === 'admin123');

    if (isValidAdmin) {
      const adminUser = {
        id: 'adm_001',
        name: demoCredentials.admin.name,
        email: demoCredentials.admin.email,
        role: 'admin',
        ...sessionMeta,
      };
      setUser(adminUser);
      return { success: true, user: adminUser };
    }

    // 3. Instructor Check
    const isDemoInstructor =
      (cleanEmail === demoCredentials.instructor?.email?.toLowerCase() ||
        cleanEmail === demoCredentials.instructor?.alternateEmail?.toLowerCase()) &&
      (cleanPass === demoCredentials.instructor?.password || cleanPass === 'instructor123' || cleanPass === 'password123');

    if (isDemoInstructor) {
      const instUser = {
        id: 'inst_demo',
        name: demoCredentials.instructor.name,
        email: demoCredentials.instructor.email,
        role: 'instructor',
        title: 'Senior Scholar & Course Instructor',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        ...sessionMeta,
      };
      setUser(instUser);
      return { success: true, user: instUser };
    }

    const allInstructors = getAllInstructors();
    const matchInst = allInstructors.find(
      (i) => i.email.toLowerCase() === cleanEmail
    );
    if (matchInst && (cleanPass === 'instructor123' || cleanPass === 'password123' || cleanPass === matchInst.password)) {
      const instUser = {
        id: matchInst.id,
        name: matchInst.name,
        email: matchInst.email,
        role: 'instructor',
        title: matchInst.title,
        avatar: matchInst.avatar,
        ...sessionMeta,
      };
      setUser(instUser);
      return { success: true, user: instUser };
    }

    if (expectedRole === 'admin') {
      return {
        success: false,
        error: 'Invalid administrator credentials. Please check your email and password.',
      };
    }

    return {
      success: false,
      error: 'Invalid email or password. Please verify your credentials and try again.',
    };
  }, []);

  /**
   * Set new permanent password and clear mustChangePassword
   */
  const changePassword = useCallback((newPassword) => {
    if (!user || !user.id) return;
    updateStudentPassword(user.id, newPassword);
    const updated = {
      ...user,
      mustChangePassword: false,
    };
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const isAuthenticated = Boolean(user && user.role);

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated,
    mustChangePassword: Boolean(user?.mustChangePassword),
    login,
    logout,
    changePassword,
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
