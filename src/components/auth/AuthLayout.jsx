import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import logo from '../../assets/logo.png';
import logoWhite from '../../assets/logo-white.png';

/**
 * AuthLayout — Split-screen authentication page wrapper.
 * Left panel: branded showcase with Islamic pattern and features.
 * Right panel: form content (login or signup).
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - The form content to render on the right
 * @param {string} props.title - Form title (e.g., "Welcome Back")
 * @param {string} props.subtitle - Form subtitle
 */
export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ===== Left Panel — Brand Showcase ===== */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
        
        {/* Decorative gold accent circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gold-500/5 blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-16 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-14">
              <img src={logoWhite} alt="ilm essentials" className="h-9 w-auto object-contain" />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="font-heading text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Your Structured Path to{' '}
              <span className="text-gold-400">Divine Knowledge</span>
            </h1>
            <p className="text-primary-200 text-lg leading-relaxed max-w-lg mb-8">
              Join thousands of students on a transformative journey through classical Islamic sciences. 
              Learn from qualified scholars at your own pace.
            </p>
          </motion.div>

          {/* Testimonial quote */}
          <motion.blockquote
            className="mt-12 p-6 rounded-xl bg-white/5 border-l-4 border-gold-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <p className="text-primary-100 italic text-sm leading-relaxed">
              "Whoever follows a path in search of knowledge, Allah will make easy for him a path to Paradise."
            </p>
            <cite className="text-gold-400 text-xs mt-2 block not-italic">
              — Sahih Muslim 2699
            </cite>
          </motion.blockquote>
        </div>
      </div>

      {/* ===== Right Panel — Form ===== */}
      <div className="flex-1 flex items-center justify-center bg-sand-50 px-6 py-12 lg:px-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo (shown only on small screens) */}
          <div className="lg:hidden mb-8">
            <img src={logo} alt="ilm essentials" className="h-8 w-auto object-contain" />
          </div>

          {/* Title */}
          <h1 className="font-heading text-3xl font-bold text-ink-900 mb-2">{title}</h1>
          <p className="text-ink-500 mb-8">{subtitle}</p>

          {/* Form content */}
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
