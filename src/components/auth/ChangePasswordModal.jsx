/**
 * ChangePasswordModal — Required First-Login Password Customization
 *
 * Prompts newly registered students with mustChangePassword=true
 * to establish their personal permanent password before accessing course rooms.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoColor from '../../assets/logo.png';

export default function ChangePasswordModal() {
  const { user, mustChangePassword, changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Only show if user is a student with mustChangePassword active
  if (!user || user.role !== 'student' || !mustChangePassword) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      changePassword(newPassword);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-primary-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl max-w-md w-full border border-sand-200 p-6 sm:p-8 shadow-elevated space-y-6"
      >
        <div className="text-center space-y-2">
          <img
            src={logoColor}
            alt="Ilm Essentials"
            className="h-8 w-auto mx-auto object-contain"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-100 text-gold-900 text-xs font-bold border border-gold-300">
            <ShieldCheck size={13} className="text-gold-700" />
            First-Time Account Activation
          </div>
          <h2 className="text-xl font-heading font-bold text-ink-900">
            Set Your Permanent Password
          </h2>
          <p className="text-xs text-ink-500 leading-relaxed max-w-sm mx-auto">
            Welcome, <strong className="text-ink-800">{user.name}</strong>! Please choose your own secure password to complete your account setup and access your courses.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 size={36} className="text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-sm font-bold text-emerald-900">Password Established Successfully!</h3>
            <p className="text-xs text-emerald-700">Unlocking your student learning dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                New Permanent Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                Confirm Permanent Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="text-[11px] text-ink-400 space-y-1">
              <div>• Choose a password you will remember for future logins.</div>
              <div>• You can use letters, numbers, and special symbols.</div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Save &amp; Enter Student Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
