/**
 * QuickStats — Animated stat cards for the Student Dashboard
 *
 * Displays 4 metric cards in a responsive grid:
 * - Enrolled Courses, Hours Learned, Assignments Due, Day Streak
 * - Each card has an icon in a colored circle, large value, label, and change indicator
 * - Staggered entrance animation via framer-motion
 *
 * @module components/dashboard/QuickStats
 * TODO: Connect to backend for live stat data
 */

import { motion } from 'framer-motion';
import { BookOpen, Clock, FileText, CheckCircle } from 'lucide-react';
import { quickStats } from '../../data/mockData';

/** Map icon string names from mock data to actual Lucide components */
const iconMap = {
  BookOpen,
  Clock,
  FileText,
  CheckCircle,
};

/**
 * Maps color names to Tailwind background + text classes for the icon circle.
 * Uses light tints for the circle and vivid for the icon itself.
 */
const colorStyles = {
  primary: {
    bg: 'bg-primary-100',
    icon: 'text-primary-700',
  },
  gold: {
    bg: 'bg-gold-100',
    icon: 'text-gold-700',
  },
  amber: {
    bg: 'bg-amber-100',
    icon: 'text-amber-700',
  },
  emerald: {
    bg: 'bg-emerald-100',
    icon: 'text-emerald-700',
  },
};

/** Stagger container animation */
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/** Individual card animation */
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

export default function QuickStats() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5"
    >
      {quickStats.map((stat) => {
        const IconComponent = iconMap[stat.icon] || BookOpen;
        const colors = colorStyles[stat.color] || colorStyles.primary;

        return (
          <motion.div
            key={stat.label}
            variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative rounded-xl bg-white p-5 shadow-card transition-shadow duration-300 hover:shadow-elevated cursor-default"
          >
            <div className="flex items-start justify-between">
              {/* Icon circle */}
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${colors.bg} transition-transform duration-300 group-hover:scale-110`}
              >
                <IconComponent className={`h-5 w-5 ${colors.icon}`} />
              </div>

              {/* Change indicator */}
              <span className="inline-block max-w-[120px] truncate rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-medium text-primary-700">
                {stat.change}
              </span>
            </div>

            {/* Value */}
            <p className="mt-4 font-heading text-3xl font-bold text-ink-900">
              {stat.value}
            </p>

            {/* Label */}
            <p className="mt-1 text-sm text-ink-500">{stat.label}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
