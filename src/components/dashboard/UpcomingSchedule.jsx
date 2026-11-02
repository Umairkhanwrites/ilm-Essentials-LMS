/**
 * UpcomingSchedule — Sidebar schedule widget for the Student Dashboard
 *
 * Displays the next 3 scheduled sessions with:
 * - Formatted date, course title, topic, time
 * - Format badge and instructor name
 * - "Join Session" button for live-online sessions (prominently styled)
 * - Calendar icon for each item
 * - Responsive: stacked cards on mobile, list-style on desktop
 *
 * @module components/dashboard/UpcomingSchedule
 * TODO: Connect to backend for real schedule data
 * TODO: Wire up "Join Session" to actual meeting links
 */

import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  PlayCircle,
  ExternalLink,
  User,
} from 'lucide-react';
import clsx from 'clsx';
import { upcomingSchedule, courseFormats } from '../../data/mockData';

/** Map format icon names to Lucide components */
const formatIconMap = {
  MapPin,
  Video,
  PlayCircle,
};

/**
 * Formats an ISO date string into a short human-readable form.
 * e.g., "Mon, Nov 3"
 * @param {string} dateStr — "2026-11-03"
 * @returns {string}
 */
function formatSessionDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function UpcomingSchedule() {
  const sessions = upcomingSchedule.slice(0, 3);

  return (
    <section>
      {/* Section header */}
      <div className="mb-5 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary-600" />
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink-900">
          Upcoming Sessions
        </h2>
      </div>

      {/* Session list */}
      <div className="space-y-3">
        {sessions.map((session, index) => {
          const fmt = courseFormats[session.format];
          const FormatIcon = formatIconMap[fmt?.icon] || Video;
          const isLive = session.format === 'live-online';

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group rounded-xl bg-white p-4 shadow-card transition-all duration-300 hover:shadow-elevated"
            >
              <div className="flex gap-3">
                {/* Calendar icon block */}
                <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <CalendarDays className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Date + format badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-primary-700">
                      {formatSessionDate(session.date)}
                    </span>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        fmt?.color || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      <FormatIcon className="h-3 w-3" />
                      {fmt?.label || session.format}
                    </span>
                  </div>

                  {/* Course title */}
                  <h3 className="mt-1.5 text-sm font-semibold text-ink-900 leading-snug line-clamp-1">
                    {session.courseTitle}
                  </h3>

                  {/* Topic */}
                  <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">
                    {session.topic}
                  </p>

                  {/* Time + Instructor */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {session.instructor}
                    </span>
                  </div>

                  {/* Join Session button (only for live-online) */}
                  {isLive && (
                    <button
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:bg-primary-800"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Join Session
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View full schedule link */}
      <a
        href="/schedule"
        className="mt-4 block text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        View Full Schedule →
      </a>
    </section>
  );
}
