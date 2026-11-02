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
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, ArrowRight, Check, Copy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { demoCredentials } from '../../data/mockData';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: demoCredentials.student.email,
    password: demoCredentials.student.password,
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(`${demoCredentials.student.email} / ${demoCredentials.student.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await login(formData.email, formData.password, 'student');
      if (res.success) {
        navigate('/dashboard');
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
      {/* ── Demo Credentials Helper Box ── */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-emerald-950 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Student Demo Credentials
          </span>
          <button
            type="button"
            onClick={handleCopyCredentials}
            className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-ink-800">
          <div className="p-1.5 rounded-lg bg-white/80 border border-emerald-100">
            <span className="text-[10px] text-ink-400 font-sans block">Email</span>
            <span className="truncate block font-medium">{demoCredentials.student.email}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-white/80 border border-emerald-100">
            <span className="text-[10px] text-ink-400 font-sans block">Password</span>
            <span className="block font-medium">{demoCredentials.student.password}</span>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {errorMessage}
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
              placeholder="student@ilmessentials.pk"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sand-200 bg-white text-ink-900 placeholder:text-ink-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="student-pass" className="block text-xs font-semibold text-ink-700">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-primary-700 hover:text-primary-900 font-medium">
              Forgot password?
            </Link>
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
              <ArrowRight size={14} />
            </>
          )}
        </button>

        <p className="text-center text-xs text-ink-500 pt-2">
          New applicant or student?{' '}
          <Link to="/signup" className="text-primary-700 hover:text-primary-900 font-bold underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
