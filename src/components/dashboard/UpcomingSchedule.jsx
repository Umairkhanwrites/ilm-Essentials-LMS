import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import clsx from 'clsx';
import { upcomingSchedule, courseFormats } from '../../data/mockData';
import { getScheduleSlots, formatSlotTimeRange } from '../../services/courseStorage';

/** Map format icon names to Lucide components */
const formatIconMap = {
  MapPin,
  Video,
  PlayCircle,
  Layers,
};

function getSlotDistance(dayOfWeek) {
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  const idx = dayOrder.indexOf(dayOfWeek);
  if (idx === -1) return 99;
  return (idx - todayIndex + 7) % 7;
}

export default function UpcomingSchedule() {
  const [sessions, setSessions] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    try {
      // Prioritize persistent slots if available
      const scheduleSlots = getScheduleSlots();
      const activeSlots = scheduleSlots.filter((s) => s.status !== 'cancelled');

      const sourceSlots = activeSlots.length > 0 ? activeSlots : upcomingSchedule.map((s) => ({
        id: s.id,
        courseTitle: s.courseTitle,
        topic: s.topic,
        dayOfWeek: s.dayOfWeek || (s.date === '2026-11-05' ? 'Thursday' : s.date === '2026-11-07' ? 'Saturday' : s.date === '2026-11-10' ? 'Tuesday' : 'Wednesday'),
        startTime: '18:00',
        endTime: '20:30',
        modality: s.format === 'on-site' ? 'onsite_dha' : 'online_meet',
        instructorName: s.instructor,
        meetLink: s.meetingLink,
        campusRoom: s.venue,
      }));

      // Sort with closest day relative to today first
      const sortedSlots = [...sourceSlots].sort((a, b) => {
        const distA = getSlotDistance(a.dayOfWeek);
        const distB = getSlotDistance(b.dayOfWeek);
        return distA - distB;
      });

      const mappedSessions = sortedSlots.slice(0, 4).map((slot) => {
        const distance = getSlotDistance(slot.dayOfWeek);
        const isToday = distance === 0;
        const isTomorrow = distance === 1;

        let dateLabel = `Every ${slot.dayOfWeek}`;
        if (isToday) dateLabel = 'Today';
        else if (isTomorrow) dateLabel = 'Tomorrow';

        const dayAbbr = (slot.dayOfWeek || 'DAY').slice(0, 3).toUpperCase();
        const formattedTime = slot.startTime && slot.endTime
          ? `${formatSlotTimeRange(slot.startTime, slot.endTime)} PKT`
          : (slot.time || '6:00 PM – 8:30 PM PKT');

        return {
          id: slot.id,
          courseTitle: slot.courseTitle,
          topic: slot.topic || 'Regular Lecture Session',
          dateLabel,
          dayAbbr,
          time: formattedTime,
          format: slot.modality === 'online_meet' ? 'live-online' : 'on-site',
          instructor: slot.instructorName,
          meetingLink: slot.meetLink || 'https://meet.google.com/ilm-arabic-sem1',
          venue: slot.campusRoom || 'DHA Phase 6 Lahore Campus',
          isToday,
          rawDay: slot.dayOfWeek,
        };
      });

      setSessions(mappedSessions);
    } catch (err) {
      console.error('Failed to load dynamic schedule:', err);
    }
  }, []);

  const handleCopy = (id, link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary-800" />
          <h2 className="font-heading text-lg sm:text-xl font-bold text-ink-900">
            Upcoming Sessions
          </h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sand-100 text-ink-700 border border-sand-300">
          Weekly Timetable
        </span>
      </div>

      {/* Session list */}
      <div className="space-y-3">
        {sessions.map((session, index) => {
          const fmt = courseFormats[session.format] || courseFormats['online'];
          const FormatIcon = formatIconMap[fmt?.icon] || Video;
          const isLiveOnline = session.format === 'live-online' || session.format === 'online';
          const isOnsite = session.format === 'onsite' || session.format === 'on-site';
          const meetingUrl = session.meetingLink || 'https://meet.google.com/ilm-live-class';
          const isTodaySession = session.isToday;

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className={clsx(
                'group rounded-2xl bg-white p-4 transition-all duration-300 border shadow-2xs hover:shadow-card',
                isTodaySession
                  ? 'border-[#0B3324]/30 ring-2 ring-[#0B3324]/10 bg-sand-50/60'
                  : 'border-sand-200'
              )}
            >
              <div className="flex gap-3">
                {/* Calendar / Day icon block */}
                <div className={clsx(
                  'flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl font-bold border transition-colors',
                  isTodaySession
                    ? 'bg-[#0B3324] text-white border-[#0B3324] shadow-xs'
                    : 'bg-sand-50 text-ink-800 border-sand-200'
                )}>
                  <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">
                    {session.dayAbbr}
                  </span>
                  {isTodaySession ? (
                    <span className="text-[9px] font-extrabold uppercase tracking-tight text-emerald-300">
                      Today
                    </span>
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-ink-500 mt-0.5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Date + format badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={clsx(
                      'text-xs font-bold',
                      isTodaySession ? 'text-[#0B3324]' : 'text-ink-800'
                    )}>
                      {session.dateLabel}
                    </span>

                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        isTodaySession
                          ? 'bg-[#0B3324]/10 text-[#0B3324] border border-[#0B3324]/20'
                          : fmt?.color || 'bg-sand-100 text-ink-700'
                      )}
                    >
                      <FormatIcon className="h-3 w-3" />
                      {fmt?.label || (isLiveOnline ? 'Online' : 'On-Site')}
                    </span>
                  </div>

                  {/* Course title */}
                  <h3 className="font-heading text-sm font-bold text-ink-900 leading-snug line-clamp-1" title={session.courseTitle}>
                    {session.courseTitle}
                  </h3>

                  {/* Topic */}
                  <p className="text-xs text-ink-500 line-clamp-1 font-medium" title={session.topic}>
                    {session.topic}
                  </p>

                  {/* Time + Instructor */}
                  <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-700">
                      <Clock className="h-3 w-3 text-ink-400" />
                      {session.time}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <User className="h-3 w-3 text-ink-400" />
                      {session.instructor}
                    </span>
                  </div>

                  {/* Onsite Venue info */}
                  {isOnsite && session.venue && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-ink-800 bg-sand-100 px-2.5 py-1 rounded-lg border border-sand-200 font-medium">
                      <MapPin className="h-3 w-3 text-primary-800 shrink-0" />
                      <span className="truncate">{session.venue}</span>
                    </div>
                  )}

                  {/* SMART ACTION BUTTONS */}
                  {isLiveOnline && (
                    <div className="pt-2">
                      {isTodaySession ? (
                        /* Active Emerald Primary Button for Today's class */
                        <div className="flex items-center gap-2">
                          <a
                            href={meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B3324] hover:bg-[#072318] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Join Live Class</span>
                            <ExternalLink size={12} />
                          </a>
                          <span className="text-xs font-semibold text-primary-900 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200">
                            Live Today
                          </span>
                        </div>
                      ) : (
                        /* Future Class: Muted Scheduled State + Copy Link */
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-500 bg-sand-100 px-2.5 py-1 rounded-lg border border-sand-200">
                            <Lock size={11} className="text-ink-400" />
                            Activates every {session.rawDay} before session
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(session.id, meetingUrl)}
                            className="text-[11px] font-semibold text-primary-800 hover:text-primary-950 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-sand-300 bg-white hover:bg-sand-50 transition-colors cursor-pointer"
                            title="Copy Google Meet Link"
                          >
                            {copiedId === session.id ? (
                              <>
                                <Check size={11} className="text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View full schedule link — navigates to dedicated /schedule page */}
      <Link
        to="/schedule"
        className="mt-4 block text-center text-xs font-bold text-primary-800 hover:text-primary-950 hover:underline transition-colors py-1 cursor-pointer"
      >
        View Full Academic Timetable →
      </Link>
    </section>
  );
}
