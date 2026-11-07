/**
 * CourseCategories — Tabbed course listing for "Ilm Foundations" and "Ilm Intensives"
 *
 * Sections:
 * 1. Ilm Foundations — 8-Month Certificate Programme (GraduationCap icon)
 * 2. Ilm Intensives — Short Masterclasses (Zap icon)
 *
 * Features:
 * - Tabs to switch between categories on mobile/all screens
 * - Framer-motion AnimatePresence for smooth tab transitions
 * - Course cards with title, instructor, progress, format badge, lesson count
 * - Empty state if no courses in a category
 *
 * @module components/dashboard/CourseCategories
 * TODO: Connect to backend for enrolled course data
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Zap,
  MapPin,
  Video,
  PlayCircle,
  BookOpen,
} from 'lucide-react';
import clsx from 'clsx';
import { enrolledCourses as defaultEnrolledCourses, courseFormats } from '../../data/mockData';
import { getEnrolledCourses } from '../../services/courseStorage';
import ProgressBar from '../../components/ui/ProgressBar';

/** Map format icon names to Lucide components */
const formatIconMap = {
  MapPin,
  Video,
  PlayCircle,
};

/** Category definitions */
const categories = [
  {
    key: 'foundations',
    label: 'Ilm Foundations',
    subtitle: '8-Month Certificate Programme',
    Icon: GraduationCap,
  },
  {
    key: 'intensives',
    label: 'Ilm Intensives',
    subtitle: 'Short Masterclasses',
    Icon: Zap,
  },
];

/** Animation variants for tab content */
const panelVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function CourseCategories() {
  const [activeTab, setActiveTab] = useState('foundations');
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

  const activeCategory = categories.find((c) => c.key === activeTab);
  const filteredCourses = courses.filter(
    (c) => c.category === activeTab
  );

  return (
    <section>
      {/* Section title */}
      <h2 className="mb-5 font-heading text-xl sm:text-2xl font-bold text-ink-900">
        My Courses
      </h2>

      {/* Tab bar */}
      <div className="mb-5 flex gap-2 rounded-xl bg-sand-100 p-1">
        {categories.map((cat) => {
          const isActive = cat.key === activeTab;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={clsx(
                'relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white text-primary-700 shadow-card'
                  : 'text-ink-500 hover:text-ink-700 hover:bg-white/50'
              )}
            >
              <cat.Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{cat.label}</span>
              <span className="sm:hidden">
                {cat.key === 'foundations' ? 'Foundations' : 'Intensives'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subtitle for active tab */}
      {activeCategory && (
        <p className="mb-4 text-sm text-ink-500 flex items-center gap-1.5">
          <activeCategory.Icon className="h-4 w-4 text-ink-400" />
          {activeCategory.subtitle}
        </p>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={panelVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="space-y-3"
        >
          {filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-sand-300 py-12 px-6 text-center">
              <BookOpen className="h-10 w-10 text-ink-300 mb-3" />
              <p className="font-heading text-lg font-semibold text-ink-700">
                No courses yet
              </p>
              <p className="mt-1 text-sm text-ink-500">
                You haven&apos;t enrolled in any {activeCategory?.label.toLowerCase()} courses.
              </p>
            </div>
          ) : (
            filteredCourses.map((course) => {
              const fmt = courseFormats[course.format];
              const FormatIcon = formatIconMap[fmt?.icon] || Video;

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group rounded-xl bg-white shadow-card transition-all duration-300 hover:shadow-elevated"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border-l-4 border-l-[#0B3324] rounded-xl">
                    {/* Instructor Portrait Avatar */}
                    {course.instructorAvatar && (
                      <div className="relative shrink-0 hidden sm:block">
                        <img
                          src={course.instructorAvatar}
                          alt={course.instructor}
                          className="w-12 h-12 rounded-full object-cover object-top border-2 border-sand-200 bg-sand-100 shadow-2xs"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        {course.instructorAvatar && (
                          <img
                            src={course.instructorAvatar}
                            alt={course.instructor}
                            className="w-8 h-8 rounded-full object-cover object-top border border-sand-200 bg-sand-100 sm:hidden shrink-0"
                            loading="lazy"
                          />
                        )}
                        <Link
                          to={`/course/${course.id}`}
                          className="group/courseTitle block truncate"
                          title={course.title}
                        >
                          <h3 className="font-heading text-base font-semibold text-ink-900 group-hover/courseTitle:text-primary-800 transition-colors truncate cursor-pointer">
                            {course.title}
                          </h3>
                        </Link>
                      </div>
                      <p className="mt-0.5 text-sm text-ink-500">
                        {course.instructor}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">
                        {course.completedLessons} / {course.totalLessons} lessons
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="w-full sm:w-40 flex items-center gap-3">
                      <div className="flex-1">
                        <ProgressBar value={course.progress} showLabel={false} />
                      </div>
                      <span className="text-sm font-semibold text-primary-700 tabular-nums w-10 text-right">
                        {course.progress}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
