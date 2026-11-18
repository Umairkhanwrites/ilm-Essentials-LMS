import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  MapPin,
  ExternalLink,
  ChevronDown,
  CalendarDays,
} from 'lucide-react';
import clsx from 'clsx';
import {
  getStudentScheduleSlots,
  formatSlotTimeRange,
  timeToMinutes,
  getSynchronizedNow,
  syncServerTime,
} from '../../services/courseStorage';

/**
 * Calculates the next occurrence of a recurring slot relative to `now`.
 * Accounts for:
 * 1. Classes occurring earlier today that have already ended (pushed to next week).
 * 2. Classes occurring right now (isLiveNow = true, minutesFromNow = 0).
 * 3. Classes occurring later today (sorted by actual start time, so 6:30 PM comes before 8:00 PM, and 8:00 PM takes over once 6:30 PM ends).
 */
function getSlotOccurrence(slot, now = new Date()) {
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = now.getDay();
  const slotDayIndex = dayOrder.indexOf(slot.dayOfWeek);
  if (slotDayIndex === -1) {
    return {
      daysDistance: 99,
      minutesFromNow: Infinity,
      isToday: false,
      isTomorrow: false,
      isLiveNow: false,
      hasEndedToday: false,
      slotDate: new Date(now),
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = slot.startTime ? timeToMinutes(slot.startTime) : 18 * 60;
  const endMinutes = slot.endTime ? timeToMinutes(slot.endTime) : startMinutes + 60;

  let daysDiff = (slotDayIndex - todayIndex + 7) % 7;
  let hasEndedToday = false;
  let isLiveNow = false;

  if (daysDiff === 0) {
    if (currentMinutes >= endMinutes) {
      // Class ended earlier today; its next occurrence is in 7 days
      hasEndedToday = true;
      daysDiff = 7;
    } else {
      // Class is currently live (15 min window before start through duration) or coming up later today
      isLiveNow = currentMinutes >= startMinutes - 15 && currentMinutes < endMinutes;
    }
  }

  let minutesFromNow;
  if (daysDiff === 0) {
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      minutesFromNow = 0; // In-progress class takes absolute priority
    } else {
      minutesFromNow = Math.max(0, startMinutes - currentMinutes);
    }
  } else {
    minutesFromNow = daysDiff * 24 * 60 + (startMinutes - currentMinutes);
  }

  const slotDate = new Date(now);
  slotDate.setDate(now.getDate() + daysDiff);

  return {
    daysDistance: daysDiff,
    minutesFromNow,
    isToday: daysDiff === 0,
    isTomorrow: daysDiff === 1,
    isLiveNow,
    hasEndedToday,
    slotDate,
  };
}

function getCurrentTime() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramTime = urlParams.get('simTime') || urlParams.get('mockTime');
    if (paramTime) {
      const parsed = new Date(paramTime);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const stored = localStorage.getItem('ilm_simulated_time');
    if (stored) {
      const parsed = new Date(stored);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  } catch (e) {
    // fallback
  }
  return getSynchronizedNow();
}

export default function UpcomingSchedule() {
  const [sessions, setSessions] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [, setTick] = useState(0); // used to trigger re-render every minute for live-status checks

  // Synchronize with server authoritative clock to eliminate local time drift
  useEffect(() => {
    syncServerTime().then(() => {
      setTick((t) => t + 1);
    });
  }, []);

  function buildSessions() {
    try {
      const scheduleSlots = getStudentScheduleSlots();
      const activeSlots = scheduleSlots.filter((s) => s.status !== 'cancelled');
      const now = getCurrentTime();

      // Pair each slot with its computed next occurrence and sort chronologically from right now forward
      const sortedSlotsWithOccurrence = activeSlots
        .map((slot) => ({
          slot,
          occurrence: getSlotOccurrence(slot, now),
        }))
        .sort((a, b) => a.occurrence.minutesFromNow - b.occurrence.minutesFromNow);

      const shortDayMap = {
        Sunday: 'Sun',
        Monday: 'Mon',
        Tuesday: 'Tue',
        Wednesday: 'Wed',
        Thursday: 'Thu',
        Friday: 'Fri',
        Saturday: 'Sat',
      };

      const mappedSessions = sortedSlotsWithOccurrence.slice(0, 4).map(({ slot, occurrence }) => {
        const { isToday, isTomorrow, isLiveNow, slotDate } = occurrence;

        const monthShort = slotDate.toLocaleDateString('en-US', { month: 'short' });
        const dayNum = slotDate.getDate();
        const dateFormatted = `${dayNum} ${monthShort}`;
        const shortDay = shortDayMap[slot.dayOfWeek] || slot.dayOfWeek;

        let dayLabel;
        if (isToday) {
          dayLabel = `${dateFormatted}, Today`;
        } else if (isTomorrow) {
          dayLabel = `${dateFormatted}, Tomorrow`;
        } else {
          dayLabel = `${dateFormatted}, ${shortDay}`;
        }

        const formattedTime = slot.startTime && slot.endTime
          ? formatSlotTimeRange(slot.startTime, slot.endTime)
          : (slot.time || '6:00 PM – 8:30 PM');

        const isOnline = slot.modality ? slot.modality.includes('online') : true;

        return {
          id: slot.id,
          courseTitle: slot.courseTitle,
          topic: slot.topic,
          dayLabel,
          time: formattedTime,
          isOnline,
          isLiveNow,
          instructor: slot.instructorName,
          meetingLink: slot.meetLink || 'https://meet.google.com/cbh-ywhg-upu',
          venue: slot.campusRoom || 'DHA Lahore Campus',
          isToday,
          startTime: slot.startTime,
          endTime: slot.endTime,
        };
      });

      setSessions(mappedSessions);
    } catch (err) {
      console.error('Failed to load dynamic schedule:', err);
    }
  }

  useEffect(() => {
    buildSessions();

    const handleUpdate = (e) => {
      if (!e || !e.key || e.key === 'ilm_schedule_slots') {
        buildSessions();
      }
    };
    window.addEventListener('ilm_schedule_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', buildSessions);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        buildSessions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Re-evaluate live status every minute so the button appears/disappears automatically
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      buildSessions();
    }, 60_000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('ilm_schedule_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', buildSessions);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (sessions.length === 0) return null;

  // The primary session is the immediate next (or currently live) session in chronological sequence
  const primarySession = sessions[0];
  const hasLiveToday = primarySession?.isToday ?? false;
  // The primary session's join button is only shown when it is currently live (or ≤15 min away)
  const primaryIsLiveNow = primarySession?.isLiveNow ?? false;

  return (
    <div
      className={clsx(
        'rounded-2xl border transition-all duration-200 shadow-2xs',
        hasLiveToday
          ? 'border-emerald-600/30 bg-emerald-50/30 ring-1 ring-emerald-600/10'
          : 'border-sand-200 bg-white'
      )}
    >
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-4">
        {/* Left: Section title & live / next status */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 font-heading font-bold text-sm text-ink-900 hover:text-primary-800 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse upcoming classes' : 'Expand upcoming classes'}
          >
            <CalendarDays size={15} className="text-primary-800" />
            <span>Upcoming Classes</span>
          </button>

          {hasLiveToday ? (
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300/60 font-bold uppercase tracking-wider text-[10px] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {primaryIsLiveNow ? 'Live Now' : 'Live Today'}
              </span>
              <span className="text-sand-400">•</span>
              <span className="inline-flex items-center gap-1.5 text-xs">
                <strong className="font-bold text-ink-900">{primarySession.courseTitle}</strong>
                <span className="text-ink-600 font-medium">({primarySession.time})</span>
                {primarySession.instructor && (
                  <span className="text-ink-400 hidden lg:inline font-normal">
                    — {primarySession.instructor}
                  </span>
                )}
              </span>
            </div>
          ) : !isExpanded ? (
            <div className="flex items-center gap-1.5 font-medium text-ink-600 text-xs">
              <span className="text-sand-400">•</span>
              <span className="text-ink-500 text-xs">Next:</span>
              <span className="font-semibold text-ink-900">{primarySession.courseTitle}</span>
              <span className="text-ink-500">({primarySession.dayLabel} • {primarySession.time})</span>
            </div>
          ) : null}
        </div>

        {/* Right: Actions & Expand Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {primarySession.isOnline && (hasLiveToday || primaryIsLiveNow) && (
            <a
              href={primarySession.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs',
                primaryIsLiveNow
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white animate-pulse'
                  : 'bg-[#0B3324] hover:bg-[#072318] text-white'
              )}
            >
              {primaryIsLiveNow && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />}
              <span>Join Meet</span>
              <ExternalLink size={11} />
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-600 hover:text-ink-900 hover:bg-sand-100 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Hide schedule' : 'Upcoming'}</span>
            <ChevronDown
              size={13}
              className={clsx('transition-transform duration-200', isExpanded && 'rotate-180')}
            />
          </button>

          <Link
            to="/schedule"
            className="text-xs font-semibold text-primary-800 hover:text-primary-950 transition-colors px-1"
          >
            Timetable →
          </Link>
        </div>
      </div>

      {/* Collapsible Upcoming Sessions Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-sand-200/80 px-3 sm:px-4 pb-3.5 pt-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={clsx(
                    'p-3.5 rounded-xl border bg-white shadow-2xs text-left flex flex-col justify-between space-y-2.5',
                    session.isToday
                      ? 'border-emerald-600/30 ring-1 ring-emerald-600/10'
                      : 'border-sand-200'
                  )}
                >
                  {/* Top: Course Title & Instructor with Online/Onsite Badge on Top Right */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-ink-900 leading-snug">
                        {session.courseTitle}
                      </h4>
                      <p className="text-xs text-ink-500 truncate">
                        {session.instructor}
                      </p>
                    </div>

                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0',
                        session.isOnline
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                          : 'bg-amber-50 text-amber-800 border-amber-200/70'
                      )}
                    >
                      {session.isOnline ? (
                        <>
                          <Video size={10} className="text-emerald-700 shrink-0" />
                          <span>Online</span>
                        </>
                      ) : (
                        <>
                          <MapPin size={10} className="text-amber-700 shrink-0" />
                          <span>Onsite</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Bottom: Day & Time */}
                  <div className="pt-2 border-t border-sand-100 flex items-center justify-between text-[11px] gap-2">
                    <span
                      className={clsx(
                        'text-xs truncate',
                        session.isToday ? 'text-emerald-800 font-bold' : 'text-ink-700 font-semibold'
                      )}
                    >
                      {session.dayLabel} • {session.time}
                    </span>

                    {session.isOnline && session.isLiveNow && (
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-bold text-emerald-800 hover:text-emerald-950 underline text-[10px] shrink-0"
                      >
                        Join <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
