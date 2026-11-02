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

import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, MapPin, Video, PlayCircle, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { enrolledCourses, courseFormats } from '../../data/mockData';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';

/** Map format icon names to Lucide components */
const formatIconMap = {
  MapPin,
  Video,
  PlayCircle,
};

/**
 * Formats an ISO date string into a short readable form.
 * e.g., "Nov 3, 6:00 PM"
 * @param {string|null} isoString
 * @returns {string}
 */
function formatNextSession(isoString) {
  if (!isoString) return 'Self-paced';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) + ', ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function ProgressOverview() {
  const activeCourses = enrolledCourses.filter((c) => c.progress > 0);

  return (
    <section>
      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink-900">
          Continue Learning
        </h2>
        <a
          href="/courses"
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          View all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>

      {/* Course cards — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:overflow-visible scrollbar-thin">
        {activeCourses.map((course, index) => {
          const fmt = courseFormats[course.format];
          const FormatIcon = formatIconMap[fmt?.icon] || Video;

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="min-w-[300px] flex-shrink-0 lg:min-w-0"
            >
              <div
                className={clsx(
                  'relative flex h-full flex-col rounded-xl bg-white shadow-card transition-all duration-300',
                  'hover:shadow-elevated border-l-4'
                )}
                style={{ borderLeftColor: course.color }}
              >
                <div className="flex flex-1 flex-col p-5">
                  {/* Format badge */}
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        fmt?.color || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      <FormatIcon className="h-3 w-3" />
                      {fmt?.label || course.format}
                    </span>

                    <span className="text-xs font-semibold text-primary-700">
                      {course.progress}%
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading text-base font-semibold text-ink-900 leading-snug line-clamp-1">
                    {course.title}
                  </h3>

                  {/* Instructor */}
                  <p className="mt-1 text-sm text-ink-500">{course.instructor}</p>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <ProgressBar value={course.progress} />
                  </div>

                  {/* Lesson count */}
                  <p className="mt-2 text-xs text-ink-400">
                    {course.completedLessons} / {course.totalLessons} lessons completed
                  </p>

                  {/* Next session */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
                    <Calendar className="h-3.5 w-3.5 text-ink-400" />
                    <span>Next: {formatNextSession(course.nextSession)}</span>
                  </div>

                  {/* Continue button */}
                  <div className="mt-4 pt-3 border-t border-sand-200">
                    <a
                      href={`/course/${course.id}`}
                      className="group/btn inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </a>
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
