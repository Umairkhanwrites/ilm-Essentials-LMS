/**
 * LoginForm — Dedicated Student Authentication Form
 *
 * Dedicated strictly to students accessing:
 * - /dashboard
 * - /courses
 * - /course/:id
 * - /library
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, Info, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await login(formData.email, formData.password, 'student');
      if (res.success) {
        if (res.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMessage(res.error || 'Failed to sign in.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Error Banner ── */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* ── Forgot Password Notice ── */}
      {showForgotNotice && (
        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between gap-2.5 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="leading-snug">
              Please contact your class administrator or email{' '}
              <a href="mailto:contact@ilmessentials.pk" className="font-semibold underline hover:text-amber-950">
                contact@ilmessentials.pk
              </a>{' '}
              to reset your password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForgotNotice(false)}
            className="text-amber-500 hover:text-amber-800 p-1 rounded-md hover:bg-amber-100/60 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Login Form ── */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="student-email" className="block text-xs font-semibold text-ink-700 mb-1.5">
            Student Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              id="student-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@example.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sand-200 bg-white text-ink-900 placeholder:text-ink-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="student-pass" className="block text-xs font-semibold text-ink-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotNotice(true)}
              className="text-xs text-primary-700 hover:text-primary-900 font-medium cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              id="student-pass"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-sand-200 bg-white text-ink-900 placeholder:text-ink-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
              className="w-4 h-4 rounded border-sand-300 text-primary-700 focus:ring-primary-500"
            />
            <span className="text-xs text-ink-600 group-hover:text-ink-800">
              Remember my session
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-primary-900 hover:bg-primary-800 active:bg-primary-950 text-white transition-all shadow-sm cursor-pointer disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign In to Student Dashboard
            </>
          )}
        </button>
      </form>
    </div>
  );
}
