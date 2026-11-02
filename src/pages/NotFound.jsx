import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BookOpen, Search } from 'lucide-react';

/**
 * NotFound (404) Page — Shown when a route doesn't match.
 * Branded and helpful with navigation links.
 */
export function NotFound() {
  return (
    <div className="min-h-screen bg-sand-50 bg-islamic-pattern flex items-center justify-center px-6">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-[120px] md:text-[160px] font-heading font-bold text-primary-100 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-primary-900 rounded-2xl flex items-center justify-center shadow-elevated">
              <Search className="w-8 h-8 text-gold-400" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="font-heading text-2xl font-bold text-ink-900 mb-3">
          Page Not Found
        </h2>
        <p className="text-ink-500 mb-8 leading-relaxed">
          The path you seek does not exist. Perhaps the knowledge you're looking for 
          can be found elsewhere on our platform.
        </p>

        <p className="text-ink-400 text-sm italic mb-8">
          "Indeed, with hardship comes ease." — Surah Ash-Sharh 94:5
        </p>

        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 
                       bg-primary-900 text-white rounded-xl font-semibold text-sm
                       hover:bg-primary-800 transition-all duration-200 hover:shadow-elevated"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 
                       bg-white border border-sand-200 text-ink-700 rounded-xl font-semibold text-sm
                       hover:bg-sand-50 hover:border-sand-300 transition-all duration-200"
          >
            <BookOpen className="w-4 h-4" />
            Browse Courses
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default NotFound;
