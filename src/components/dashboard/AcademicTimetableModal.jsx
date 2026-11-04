import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Filter,
  List,
  CalendarDays,
  User,
  Layers,
} from 'lucide-react';
import {
  getScheduleSlots,
  formatSlotTimeRange,
  formatTime12h,
} from '../../services/courseStorage';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function AcademicTimetableModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [slots] = useState(() => getScheduleSlots());
  const [selectedModality, setSelectedModality] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [viewMode, setViewMode] = useState('agenda'); // 'agenda' or 'weekly'
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = (id, link) => {
    if (!link) return;
    navigator.clipboard?.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter slots
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (slot.status === 'cancelled') return false;
      const matchModality =
        selectedModality === 'all' || slot.modality === selectedModality;
      const matchDay = selectedDay === 'all' || slot.dayOfWeek === selectedDay;
      return matchModality && matchDay;
    });
  }, [slots, selectedModality, selectedDay]);

  // Group by day for agenda view
  const groupedByDay = useMemo(() => {
    const map = {};
    for (const day of DAYS_OF_WEEK) {
      map[day] = [];
    }
    for (const slot of filteredSlots) {
      if (map[slot.dayOfWeek]) {
        map[slot.dayOfWeek].push(slot);
      }
    }
    // Sort slots within each day by startTime
    for (const day of DAYS_OF_WEEK) {
      map[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [filteredSlots]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-sand-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleIn">
        {/* Header */}
        <div className="bg-[#0B3324] text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-white leading-tight">
                Academic Timetable
              </h2>
              <p className="text-xs text-sand-200 mt-0.5">
                Full Weekly Class Schedule &bull; Fall Semester 2026
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-sand-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close timetable"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter and View Controls Bar */}
        <div className="p-4 sm:px-6 bg-sand-50 border-b border-sand-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Modality & Day Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-sand-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedModality('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedModality === 'all'
                    ? 'bg-[#0B3324] text-white'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                All Modalities
              </button>
              <button
                type="button"
                onClick={() => setSelectedModality('online_meet')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedModality === 'online_meet'
                    ? 'bg-[#0B3324] text-white'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <Video size={13} />
                <span>Google Meet</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedModality('onsite_campus')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedModality === 'onsite_campus'
                    ? 'bg-[#0B3324] text-white'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <MapPin size={13} />
                <span>DHA Phase 6 Campus</span>
              </button>
            </div>

            {/* Day Selector */}
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white border border-sand-300 font-semibold text-ink-700 focus:outline-none focus:ring-2 focus:ring-[#0B3324]/20"
            >
              <option value="all">All Days (Mon–Sun)</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-sand-200 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-[#0B3324] text-white'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <List size={13} />
              <span>Agenda List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-[#0B3324] text-white'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Calendar size={13} />
              <span>Weekly Grid</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* MODE 1: AGENDA LIST VIEW */}
          {viewMode === 'agenda' && (
            <div className="space-y-6">
              {DAYS_OF_WEEK.filter(
                (day) => selectedDay === 'all' || selectedDay === day
              ).map((day) => {
                const daySlots = groupedByDay[day] || [];
                const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                const isToday = day === currentDayName;

                if (daySlots.length === 0) {
                  if (selectedDay !== 'all') {
                    return (
                      <div
                        key={day}
                        className="p-8 text-center bg-sand-50 rounded-2xl border border-sand-200 text-ink-500 text-xs"
                      >
                        No lecture sessions scheduled for {day}.
                      </div>
                    );
                  }
                  return null;
                }

                return (
                  <div key={day} className="space-y-3">
                    {/* Day Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-sand-200">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-ink-900">
                          {day}
                        </h3>
                        {isToday && (
                          <span className="text-[10px] font-bold text-primary-900 bg-primary-100/90 px-2 py-0.5 rounded-full border border-primary-200">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-ink-500">
                        {daySlots.length} {daySlots.length === 1 ? 'Slot' : 'Slots'}
                      </span>
                    </div>

                    {/* Slots List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {daySlots.map((slot) => {
                        const isOnline = slot.modality === 'online_meet';
                        const meetUrl =
                          slot.meetLink || 'https://meet.google.com/ilm-live-class';

                        return (
                          <div
                            key={slot.id}
                            className={`p-4 rounded-2xl border bg-white shadow-2xs transition-all hover:shadow-card flex flex-col justify-between gap-3 ${
                              isToday
                                ? 'border-[#0B3324]/30 ring-1 ring-[#0B3324]/10 bg-sand-50/30'
                                : 'border-sand-200'
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Top row badges */}
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  {isOnline ? (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                                      <Video size={11} className="text-blue-700" />
                                      Google Meet
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-900 border border-primary-200 inline-flex items-center gap-1">
                                      <MapPin size={11} className="text-primary-800" />
                                      DHA Phase 6 On-Site
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-ink-800 bg-sand-100 px-2 py-0.5 rounded-md">
                                    {formatSlotTimeRange(slot.startTime, slot.endTime)} PKT
                                  </span>
                                </div>

                                <span className="text-[11px] font-semibold text-primary-900 bg-sand-100 px-2 py-0.5 rounded border border-sand-200">
                                  {slot.cohortName || 'Core Cohort'}
                                </span>
                              </div>

                              {/* Title & Topic */}
                              <div>
                                <h4 className="font-heading font-bold text-sm text-ink-900 leading-snug">
                                  {slot.courseTitle}
                                </h4>
                                <p className="text-xs text-ink-600 mt-0.5 line-clamp-2">
                                  {slot.topic || 'Regular curriculum session'}
                                </p>
                              </div>

                              {/* Instructor & Location */}
                              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500 border-t border-sand-100">
                                <span className="inline-flex items-center gap-1">
                                  <User size={12} className="text-primary-800" />
                                  <strong className="text-ink-800">{slot.instructorName}</strong>
                                </span>
                                {!isOnline && (
                                  <span className="inline-flex items-center gap-1 text-ink-700 font-medium">
                                    <MapPin size={12} className="text-primary-800" />
                                    {slot.campusRoom || 'Room 204 • Main Block'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {isOnline ? (
                              <div className="pt-2 flex items-center justify-between gap-2 border-t border-sand-100">
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(slot.id, meetUrl)}
                                  className="text-[11px] font-semibold text-ink-600 hover:text-ink-900 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-sand-300 bg-white hover:bg-sand-50 transition-colors cursor-pointer"
                                >
                                  {copiedId === slot.id ? (
                                    <>
                                      <Check size={11} className="text-emerald-600" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copy Meet Link</span>
                                    </>
                                  )}
                                </button>

                                <a
                                  href={meetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B3324] hover:bg-[#072318] text-white text-xs font-bold transition-all shadow-2xs"
                                >
                                  <span>{isToday ? '🟢 Join Live Class' : 'Launch Meet'}</span>
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            ) : (
                              <div className="pt-2 flex items-center justify-between text-xs text-ink-500 border-t border-sand-100">
                                <span className="text-[11px]">
                                  Venue: DHA Phase 6 Lahore
                                </span>
                                <span className="text-[11px] font-semibold text-primary-900 bg-sand-100 px-2 py-0.5 rounded border border-sand-200">
                                  {slot.roomCapacity || 35} Seats
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODE 2: WEEKLY GRID VIEW */}
          {viewMode === 'weekly' && (
            <div className="overflow-x-auto pb-4">
              <div className="grid grid-cols-7 gap-2.5 min-w-[850px]">
                {DAYS_OF_WEEK.map((day) => {
                  const daySlots = groupedByDay[day] || [];
                  const isToday = day === 'Thursday';

                  return (
                    <div
                      key={day}
                      className={`flex flex-col rounded-2xl border p-2.5 min-h-[360px] ${
                        isToday
                          ? 'border-[#0B3324] bg-sand-50/50 shadow-xs'
                          : 'border-sand-200 bg-sand-50/30'
                      }`}
                    >
                      {/* Column Header */}
                      <div className="pb-2 mb-2 border-b border-sand-200 text-center">
                        <span className="font-heading font-bold text-xs uppercase tracking-wider text-ink-900 block">
                          {day.slice(0, 3)}
                        </span>
                        <span className="text-[10px] font-semibold text-ink-500">
                          {daySlots.length} {daySlots.length === 1 ? 'Slot' : 'Slots'}
                        </span>
                      </div>

                      {/* Day slots stack */}
                      <div className="space-y-2 flex-1">
                        {daySlots.map((slot) => {
                          const isOnline = slot.modality === 'online_meet';

                          return (
                            <div
                              key={slot.id}
                              className={`p-2.5 rounded-xl border bg-white shadow-2xs transition-all hover:shadow-card text-left space-y-1.5 ${
                                isOnline
                                  ? 'border-l-4 border-l-blue-600 border-sand-200'
                                  : 'border-l-4 border-l-emerald-700 border-sand-200'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-ink-500">
                                <span className="font-bold text-ink-800">
                                  {formatTime12h(slot.startTime)}
                                </span>
                                <span>{slot.durationMinutes || 90}m</span>
                              </div>

                              <h5 className="font-heading font-bold text-xs text-ink-900 line-clamp-1" title={slot.courseTitle}>
                                {slot.courseTitle}
                              </h5>

                              <p className="text-[10px] text-ink-500 line-clamp-1">
                                {slot.instructorName}
                              </p>

                              <div className="pt-1 border-t border-sand-100 flex items-center justify-between text-[9px]">
                                <span className={isOnline ? 'text-blue-700 font-bold' : 'text-primary-800 font-bold'}>
                                  {isOnline ? 'Online Meet' : (slot.campusRoom || 'Room 204')}
                                </span>
                                {isOnline && slot.meetLink && (
                                  <a
                                    href={slot.meetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-900 font-bold inline-flex items-center gap-0.5"
                                  >
                                    Join ↗
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {daySlots.length === 0 && (
                          <div className="h-full flex items-center justify-center text-[10px] text-ink-400 italic py-8">
                            No classes
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-sand-100 border-t border-sand-200 flex items-center justify-between text-xs text-ink-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">
              Synchronized with Ilm Essentials Central Timetable
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0B3324] hover:bg-[#072318] text-white font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Close Timetable
          </button>
        </div>
      </div>
    </div>
  );
}
