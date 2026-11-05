/**
 * Login — Dedicated Student Login Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';
import { LogOut, ArrowRight } from 'lucide-react';

export default function Login() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <AuthLayout
      title={isAuthenticated ? 'Welcome Back' : 'Student Sign In'}
      subtitle={
        isAuthenticated
          ? 'You have an active session in Ilm Essentials'
          : 'Access your enrolled classical Islamic sciences courses, lectures & e-Library'
      }
    >
      {isAuthenticated ? (
        <div className="rounded-2xl border border-sand-300 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3.5 pb-4 border-b border-sand-200">
            <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-900 flex items-center justify-center font-bold text-base ring-2 ring-primary-200 shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-bold text-base text-ink-900 truncate">
                  {user?.name}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-800 border border-primary-200">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-ink-500 truncate">{user?.email}</p>
            </div>
          </div>

          <p className="text-xs text-ink-600">
            You are currently signed in. You can proceed directly to your learning workspace or sign out to switch accounts.
          </p>

          <div className="space-y-2.5 pt-1">
            <Link
              to={user?.role === 'admin' ? '/admin' : '/dashboard'}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-primary-900 hover:bg-primary-800 text-white transition-all shadow-sm cursor-pointer"
            >
              <span>Go to {user?.role === 'admin' ? 'Faculty Admin Portal' : 'Student Dashboard'}</span>
              <ArrowRight size={15} />
            </Link>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out / Switch Account</span>
            </button>
          </div>
        </div>
      ) : (
        <LoginForm />
      )}
    </AuthLayout>
  );
}
