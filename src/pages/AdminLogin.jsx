/**
 * AdminLogin — Dedicated Staff & Administrator Login Portal
 *
 * Direct entry point for administrative staff:
 * - Isolated from student pages
 * - Authenticates role: 'admin'
 * - Redirects to /admin
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, Check, Copy, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { demoCredentials } from '../data/mockData';
import logoWhite from '../assets/logo-white.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: demoCredentials.admin.email,
    password: demoCredentials.admin.password,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(`${demoCredentials.admin.email} / ${demoCredentials.admin.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await login(formData.email, formData.password, 'admin');
      if (res.success) {
        navigate('/admin');
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-950 flex flex-col justify-center items-center p-4 sm:p-6 text-white relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-800/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10 space-y-6"
      >
        {/* Top Brand & Title */}
        <div className="text-center space-y-3">
          <Link to="/login" className="inline-block hover:opacity-90 transition-opacity">
            <img src={logoWhite} alt="ilm essentials" className="h-9 w-auto mx-auto object-contain" />
          </Link>

          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-300 text-xs font-semibold">
              <Shield size={13} />
              Administrative Gateway
            </div>
            <h1 className="font-heading text-2xl font-bold mt-2 text-white">Staff & Faculty Portal</h1>
            <p className="text-xs text-primary-200">
              Authoritative management for curriculum, admissions & schedules
            </p>
          </div>
        </div>

        {/* Credentials Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-elevated space-y-5">
          <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-3 space-y-1.5 text-xs text-gold-200">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1 text-gold-300">
                <Shield size={13} /> Demo Administrator Access
              </span>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="text-[11px] font-semibold text-gold-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs font-semibold text-white/90">
              admin@ilmessentials.pk / admin123
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-primary-200 mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-300" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@ilmessentials.pk"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white placeholder:text-primary-300/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-200 mb-1.5">
                Staff Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white placeholder:text-primary-300/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-primary-950 transition-all shadow-md cursor-pointer disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  <Shield size={15} />
                  Authorize & Access Admin Portal
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to Student Portal Link */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-primary-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} />
            Looking for Student Hub? Go to Student Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
