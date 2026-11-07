/**
 * QuickStats — Minimal stat cards for the Student Dashboard
 *
 * Displays 4 clean, minimalist metric cards in a responsive grid.
 *
 * @module components/dashboard/QuickStats
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { quickStats as defaultQuickStats } from '../../data/mockData';
import { getEnrolledCourses } from '../../services/courseStorage';

const iconMap = {
  BookOpen,
  Clock,
  FileText,
  CheckCircle: CheckCircle2,
};

export default function QuickStats() {
  const [courses, setCourses] = useState(() => getEnrolledCourses());

  useEffect(() => {
    setCourses(getEnrolledCourses());

    const handleProgressUpdate = () => {
      setCourses(getEnrolledCourses());
    };

    window.addEventListener('ilm-course-progress-updated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);

    return () => {
      window.removeEventListener('ilm-course-progress-updated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, []);

  const totalCompletedLessons = courses.reduce(
    (sum, c) => sum + (Number(c.completedLessons) || 0),
    0
  );

  const totalLessonsCount = courses.reduce(
    (sum, c) => sum + (Number(c.totalLessons) || 0),
    0
  );

  const completionPercentage = totalLessonsCount > 0
    ? Math.round((totalCompletedLessons / totalLessonsCount) * 100)
    : 0;

  // Synchronized Hours Learned (approx 45 min = ~0.75h per completed lesson, 0h when 0 completed)
  const hoursLearned =
    totalCompletedLessons === 0
      ? '0h'
      : `${Math.max(1, Math.round(totalCompletedLessons * 0.75))}h`;

  const stats = [
    {
      id: 'courses',
      label: 'Enrolled Courses',
      value: courses.length,
      icon: BookOpen,
      subtext: 'Active learning tracks',
    },
    {
      id: 'hours',
      label: 'Hours Learned',
      value: hoursLearned,
      icon: Clock,
      subtext: 'Study time logged',
    },
    {
      id: 'assignments',
      label: 'Assignments Due',
      value: 0,
      icon: FileText,
      subtext: 'No pending deadlines',
    },
    {
      id: 'completed',
      label: 'Completed Lessons',
      value: totalCompletedLessons,
      icon: CheckCircle2,
      subtext: totalLessonsCount > 0 ? `${totalCompletedLessons} of ${totalLessonsCount} completed` : 'In progress',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
            className="group rounded-2xl bg-white border border-sand-200 p-4 sm:p-4.5 shadow-2xs hover:border-sand-300 hover:shadow-card transition-all duration-200 flex flex-col justify-between"
          >
            {/* Top row: Label + subtle minimalist icon */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-ink-500 line-clamp-1">
                {stat.label}
              </span>
              <IconComponent size={16} className="text-ink-400 group-hover:text-primary-800 transition-colors shrink-0" />
            </div>

            {/* Metric Value + Subtle Context Subtext */}
            <div className="mt-3">
              <p className="font-heading text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight leading-none">
                {stat.value}
              </p>
              {stat.subtext && (
                <p className="text-[11px] text-ink-400 mt-1 font-normal">
                  {stat.subtext}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
