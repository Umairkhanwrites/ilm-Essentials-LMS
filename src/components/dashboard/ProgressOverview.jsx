/**
 * ProgressOverview — Unified "My Courses" section for the Student Dashboard
 *
 * Integrates program tabs ("Ilm Foundations" and "Ilm Intensives")
 * with progress tracking, instructor portraits, and direct resume actions.
 *
 * @module components/dashboard/ProgressOverview
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  GraduationCap,
  Zap,
  BookOpen,
} from 'lucide-react';
import clsx from 'clsx';
import { enrolledCourses as defaultEnrolledCourses } from '../../data/mockData';
import { getEnrolledCourses } from '../../services/courseStorage';
import ProgressBar from '../../components/ui/ProgressBar';

/** Category definitions */
const categories = [
  {
    key: 'foundations',
    label: 'Ilm Foundations',
    Icon: GraduationCap,
  },
  {
    key: 'intensives',
    label: 'Ilm Intensives',
    Icon: Zap,
  },
];

export default function ProgressOverview() {
  const [courses, setCourses] = useState(() => getEnrolledCourses());

  const hasFoundations = courses.some((c) => c.category === 'foundations');
  const hasIntensives = courses.some((c) => c.category === 'intensives');

  // Intelligently default to 'intensives' if the student only has intensives courses
  const [activeTab, setActiveTab] = useState(() => (!hasFoundations && hasIntensives ? 'intensives' : 'foundations'));

  useEffect(() => {
    // Refresh courses on mount
    const currentCourses = getEnrolledCourses();
    setCourses(currentCourses);

    const foundationsCount = currentCourses.filter((c) => c.category === 'foundations').length;
    const intensivesCount = currentCourses.filter((c) => c.category === 'intensives').length;

    if (foundationsCount === 0 && intensivesCount > 0) {
      setActiveTab('intensives');
    }

    // Listen for real-time progress updates when user marks lessons complete
    const handleProgressUpdate = () => {
      const refreshed = getEnrolledCourses();
      setCourses(refreshed);
    };

    window.addEventListener('ilm-course-progress-updated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);

    return () => {
      window.removeEventListener('ilm-course-progress-updated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, []);

  const filteredCourses = courses.filter(
    (c) => c.category === activeTab
  );

  return (
    <section>
      {/* Section Header with Title & Program Tabs */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink-900">
          My Courses
        </h2>

        {/* Program Tabs: Ilm Foundations & Ilm Intensives */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-sand-100 p-1 border border-sand-200 text-xs">
            {categories.map((cat) => {
              const isActive = cat.key === activeTab;
              const Icon = cat.Icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveTab(cat.key)}
                  className={clsx(
                    'relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all duration-200 cursor-pointer',
                    isActive
                      ? 'bg-white text-primary-800 shadow-2xs font-bold'
                      : 'text-ink-600 hover:text-ink-900'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand-300 p-8 sm:p-10 text-center bg-white space-y-3">
              {activeTab === 'foundations' ? (
                <>
                  <GraduationCap className="mx-auto h-10 w-10 text-sand-400 mb-2" />
                  <h4 className="font-heading font-bold text-base text-ink-900">
                    Not Enrolled in Ilm Foundations
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-600 max-w-md mx-auto leading-relaxed">
                    You are not currently enrolled in the 8-Month Certificate Programme. Explore the comprehensive classical curriculum covering Qur'ānic Arabic, Tajwīd, Fiqh, Tafsīr, Why Islām, and Sīrah.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/courses"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3324] hover:bg-[#072318] text-white text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <span>Explore Ilm Foundations Curriculum</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Zap className="mx-auto h-10 w-10 text-sand-400 mb-2" />
                  <h4 className="font-heading font-bold text-base text-ink-900">
                    No Modular Intensives Enrolled
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-600 max-w-md mx-auto leading-relaxed">
                    Discover specialized masterclasses and deep-dive workshops taught by leading scholars and guest lecturers.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/courses"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3324] hover:bg-[#072318] text-white text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <span>Browse Intensives Catalog</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredCourses.map((course, index) => {
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    className="flex"
                  >
                    <Link
                      to={`/course/${course.id}`}
                      className={clsx(
                        'group/card relative flex h-full w-full flex-col justify-between rounded-2xl bg-white shadow-2xs transition-all duration-300',
                        'hover:shadow-card hover:-translate-y-0.5 border border-sand-200 border-l-4 border-l-[#0B3324] overflow-hidden block cursor-pointer'
                      )}
                    >
                      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-4">
                        {/* Course Title, Instructor & Avatar */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-heading text-sm sm:text-base font-bold text-ink-900 group-hover/card:text-primary-800 transition-colors leading-snug line-clamp-1">
                              {course.title}
                            </h3>
                            <p className="text-xs text-ink-500 line-clamp-1 mt-0.5 font-medium">
                              {course.instructor}
                            </p>
                            <span className="text-[11px] text-ink-400 font-medium inline-block mt-1">
                              {course.completedLessons}/{course.totalLessons} lessons
                            </span>
                          </div>

                          {/* Instructor Portrait Avatar */}
                          {course.instructorAvatar && (
                            <div className="relative shrink-0">
                              <img
                                src={course.instructorAvatar}
                                alt={course.instructor}
                                className="w-12 h-12 rounded-full object-cover object-top border-2 border-sand-200 bg-sand-100 shadow-2xs group-hover/card:border-primary-500 transition-colors"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>

                        {/* Single Progress Bar with Clean Label */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-ink-600 text-[11px]">Completed</span>
                            <span className="font-heading text-primary-900 font-bold">
                              {course.progress}%
                            </span>
                          </div>
                          <ProgressBar value={course.progress} showLabel={false} size="sm" />
                        </div>

                        {/* Actionable Solid Forest-Green Resume Button */}
                        <div className="pt-2">
                          <div className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#0B3324] group-hover/card:bg-[#072318] active:scale-[0.99] transition-all shadow-2xs">
                            <span>{course.progress > 0 ? '▶ Resume Lesson' : '▶ Start Learning'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
