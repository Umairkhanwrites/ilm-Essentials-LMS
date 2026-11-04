/**
 * ProgressOverview — "Continue Learning" section for the Student Dashboard
 *
 * Displays currently active courses (progress > 0) as horizontal cards with:
 * - Course title, instructor, progress bar, next session info, format badge
 * - Colored left border matching the course color
 * - "Continue" CTA button linking to /course/{id}
 * - Horizontal scroll on mobile, grid on desktop
 *
 * @module components/dashboard/ProgressOverview
 * TODO: Connect to backend for real course progress data
 * TODO: Hook up Continue button to actual course pages via router
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Video, PlayCircle, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import { enrolledCourses, courseFormats } from '../../data/mockData';
import ProgressBar from '../../components/ui/ProgressBar';

/** Map format icon names to Lucide components */
const formatIconMap = {
  MapPin,
  Video,
  PlayCircle,
};

export default function ProgressOverview() {
  const activeCourses = enrolledCourses.filter((c) => c.progress > 0);

  return (
    <section>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink-900">
            Continue Learning
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Pick up right where you left off in your active syllabus modules
          </p>
        </div>
        <Link
          to="/courses"
          className="group inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary-700 hover:text-primary-900 transition-colors"
        >
          View all courses
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Balanced 4-Column Grid: 1 row on large desktops, 2x2 on tablets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeCourses.map((course, index) => {
          const fmt = courseFormats[course.format];
          const FormatIcon = formatIconMap[fmt?.icon] || Video;

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className="flex"
            >
              <div
                className={clsx(
                  'relative flex h-full w-full flex-col justify-between rounded-2xl bg-white shadow-2xs transition-all duration-300',
                  'hover:shadow-card hover:-translate-y-0.5 border border-sand-200 border-l-4 overflow-hidden'
                )}
                style={{ borderLeftColor: course.color || '#0B3324' }}
              >
                <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-4">
                  {/* 1. Course Title & Instructor ON TOP (Clickable Title) */}
                  <div>
                    <Link
                      to={`/course/${course.id}`}
                      className="group/title block cursor-pointer"
                      title={course.title}
                    >
                      <h3 className="font-heading text-sm sm:text-base font-bold text-ink-900 group-hover/title:text-primary-800 transition-colors leading-snug line-clamp-1">
                        {course.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-ink-500 line-clamp-1">
                        {course.instructor}
                      </p>
                      <span className="text-[11px] text-ink-400 font-medium shrink-0">
                        {course.completedLessons}/{course.totalLessons} lessons
                      </span>
                    </div>
                  </div>

                  {/* Single Progress Bar with Clean Label */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-ink-600 text-[11px]">Completed</span>
                      <span className="font-heading text-primary-900 font-bold">{course.progress}%</span>
                    </div>
                    <ProgressBar value={course.progress} showLabel={false} size="sm" />
                  </div>

                  {/* Actionable Solid Forest-Green Resume Button */}
                  <div className="pt-2">
                    <Link
                      to={`/course/${course.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#0B3324] hover:bg-[#072318] active:scale-[0.99] transition-all shadow-2xs cursor-pointer"
                    >
                      <span>▶ Resume Lesson</span>
                    </Link>
                  </div>

                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
