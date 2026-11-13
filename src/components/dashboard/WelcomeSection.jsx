/**
 * WelcomeSection — Hero greeting banner for the Student Dashboard
 *
 * Displays a personalized greeting with:
 * - "Assalamu Alaikum, {name}" heading
 * - Formatted current date
 * - Daily Hadith/Quote card with gold accent
 *
 * @module components/dashboard/WelcomeSection
 * TODO: Connect to backend for user data and dynamic quotes
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Quote, BookOpen, Sparkles } from 'lucide-react';
import { currentUser } from '../../data/mockData';
import { getTodaysQuote } from '../../services/courseStorage';
import { useAuth } from '../../context/AuthContext';

/**
 * Formats a Date into a readable string like "Monday, November 3, 2026"
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function WelcomeSection() {
  const { user } = useAuth();
  const [quote, setQuote] = useState(() => getTodaysQuote());
  const today = useMemo(() => formatDate(new Date()), []);

  // Listen to admin quote updates in real-time
  useEffect(() => {
    const handleUpdate = () => {
      setQuote(getTodaysQuote());
    };

    window.addEventListener('ilm-quotes-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('ilm-quotes-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 p-6 sm:p-8 lg:p-9 text-white shadow-soft"
    >
      {/* Decorative soft ambient glows (no plus symbols or harsh patterns) */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-primary-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Greeting */}
        <div className="flex-1 space-y-2">
          {/* Greeting heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white"
          >
            {user?.name || currentUser.name}
          </motion.h1>

          {/* Date */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-primary-200 text-sm sm:text-base font-normal"
          >
            {today}
          </motion.p>
        </div>

        {/* Right: Daily quote card */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-full lg:max-w-md shrink-0"
        >
          <div className="relative rounded-xl border-l-4 border-gold-500 bg-white/5 backdrop-blur-sm p-4 sm:p-5 border border-white/10">
            {/* Decorative quote icon */}
            <Quote className="absolute top-3 right-3 h-6 w-6 text-gold-400/20" />

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-500/20">
                <BookOpen className="h-3.5 w-3.5 text-gold-400" />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm leading-relaxed text-sand-100 italic">
                  &ldquo;{quote?.text || 'The seeking of knowledge is obligatory for every Muslim.'}&rdquo;
                </p>
                <p className="text-xs font-semibold text-gold-400">
                  — {quote?.source || 'Sunan Ibn Majah 224'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
