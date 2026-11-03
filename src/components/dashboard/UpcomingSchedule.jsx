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

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  PlayCircle,
  ExternalLink,
  User,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';
import { upcomingSchedule, courseFormats } from '../../data/mockData';
import { getAllCourses } from '../../services/courseStorage';

/** Map format icon names to Lucide components */
const formatIconMap = {
  MapPin,
  Video,
  PlayCircle,
  Layers,
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
  const [sessions, setSessions] = useState(upcomingSchedule.slice(0, 3));

  useEffect(() => {
    try {
      const allCourses = getAllCourses();
      // Look for any courses that have specific schedule and meeting link
      const liveCourses = allCourses.filter(
        (c) => c.classCategory === 'online' || c.classCategory === 'hybrid' || c.meetingLink
      );
      if (liveCourses.length > 0) {
        const dynamicSessions = liveCourses.slice(0, 3).map((c, idx) => ({
          id: `dyn_sch_${c.id}_${idx}`,
          courseTitle: c.title,
          topic: `Class Session • ${c.schedule || 'Live Interactive Class'}`,
          date: c.startDate || new Date().toISOString().split('T')[0],
          time: c.schedule ? c.schedule.split(',')[1] || c.schedule : '6:00 PM – 8:30 PM PKT',
          format: c.classCategory === 'hybrid' ? 'hybrid' : (c.classCategory === 'onsite' ? 'onsite' : 'online'),
          instructor: typeof c.instructor === 'object' ? c.instructor.name : (c.instructor || 'Lead Scholar'),
          meetingLink: c.meetingLink || 'https://meet.google.com/ilm-live-class',
          venue: c.venue || c.campusLocation,
        }));
        setSessions(dynamicSessions);
      }
    } catch (err) {
      console.error('Failed to load dynamic schedule:', err);
    }
  }, []);

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
          const fmt = courseFormats[session.format] || courseFormats['online'];
          const FormatIcon = formatIconMap[fmt?.icon] || Video;
          const isLive = session.format === 'live-online' || session.format === 'online' || session.format === 'hybrid';
          const isHybrid = session.format === 'hybrid';
          const isOnsite = session.format === 'onsite' || session.format === 'on-site';
          const meetingUrl = session.meetingLink || 'https://meet.google.com/ilm-live-class';

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group rounded-xl bg-white p-4 shadow-card transition-all duration-300 hover:shadow-elevated border border-sand-200"
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
                        fmt?.color || 'bg-emerald-100 text-emerald-800'
                      )}
                    >
                      <FormatIcon className="h-3 w-3" />
                      {fmt?.label || 'Online'}
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

                  {/* Onsite Venue info */}
                  {(isOnsite || isHybrid) && session.venue && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{session.venue}</span>
                    </div>
                  )}

                  {/* Join Session link button (for online & hybrid) */}
                  {isLive && (
                    <a
                      href={meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Join Live Class
                      <ExternalLink className="h-3 w-3" />
                    </a>
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
