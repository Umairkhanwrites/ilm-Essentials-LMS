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
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoWhite from '../assets/logo-white.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
        {/* Top Brand Logo */}
        <div className="text-center">
          <Link to="/login" className="inline-block hover:opacity-90 transition-opacity">
            <img src={logoWhite} alt="ilm essentials" className="h-9 w-auto mx-auto object-contain" />
          </Link>
        </div>

        {/* Credentials Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-elevated space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-primary-200 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-300" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@ilmessentials.pk"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white placeholder:text-primary-300/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-200 mb-1.5">
                Password
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
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
