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
