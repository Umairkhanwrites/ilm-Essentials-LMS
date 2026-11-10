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
  Table,
  GraduationCap,
} from 'lucide-react';
import {
  isStudentEnrolledInFoundations,
  getStudentScheduleSlots,
  getEnrolledCourses,
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

  const isFoundationsEnrolled = useMemo(() => isStudentEnrolledInFoundations(), []);
  const enrolledCourses = useMemo(() => getEnrolledCourses(), []);
  const [slots] = useState(() => getStudentScheduleSlots());
  const [selectedModality, setSelectedModality] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table', 'agenda', or 'weekly'
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
        {/* Header with Integrated View Switcher */}
        <div className="bg-[#0B3324] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shrink-0">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-bold text-white leading-tight">
                Academic Timetable
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle: Timetable & Agenda */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#0B3324] shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Table size={13} />
                <span>Timetable</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-white text-[#0B3324] shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <List size={13} />
                <span>Agenda</span>
              </button>
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
        </div>

        {/* Modality & Day Filters — visible only under Agenda List view */}
        {viewMode === 'agenda' && (
          <div className="p-3.5 sm:px-6 bg-sand-50 border-b border-sand-200 flex flex-wrap items-center gap-2 shrink-0 animate-fadeIn">
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
                <span>DHA Phase 6</span>
              </button>
            </div>

            {/* Day Selector */}
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white border border-sand-300 font-semibold text-ink-700 focus:outline-none focus:ring-2 focus:ring-[#0B3324]/20"
            >
              <option value="all">All Days</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!isFoundationsEnrolled && slots.length === 0 ? (
            <div className="bg-sand-50/50 rounded-2xl border border-sand-200 p-8 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-sand-100 border border-sand-200 text-ink-700 flex items-center justify-center">
                <Calendar size={24} className="text-primary-800" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading font-bold text-base text-ink-900">
                  No Live Timetable for Your Enrolled Courses
                </h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  {enrolledCourses.length > 0 ? (
                    <>
                      You are enrolled in{' '}
                      <span className="font-semibold text-ink-900">
                        {enrolledCourses.map((c) => c.title).join(', ')}
                      </span>
                      . These courses feature on-demand recorded lessons.
                    </>
                  ) : (
                    <>You are not enrolled in any courses with a live timetable.</>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-sand-200 text-xs text-ink-600 text-left flex items-start gap-2.5">
                <GraduationCap size={16} className="text-primary-800 shrink-0 mt-0.5" />
                <p>
                  The weekly live timetable and Google Meet sessions are reserved exclusively for students enrolled in the <strong>Ilm Foundations 8-Month Certificate Programme</strong>.
                </p>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            isFoundationsEnrolled ? (
              /* MODE 0: OFFICIAL TIMETABLE TABLE */
              <div className="bg-white rounded-2xl border border-sand-200 shadow-2xs overflow-hidden">
                {/* Heading Banner Before Table */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-emerald-50/60 via-sand-50/40 to-white border-b border-sand-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-900 border border-emerald-200 flex items-center justify-center shrink-0">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-heading font-bold text-ink-900 leading-tight">
                        Ilm Foundations
                      </h2>
                      <p className="text-xs text-ink-600 mt-0.5">
                        8-Month Certificate Programme &bull; Tuesday, Wednesday &amp; Thursday (6:30 PM – 9:00 PM PKT)
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-sand-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Classes</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="border-b border-sand-200 bg-sand-50/70 text-ink-900">
                        <th className="py-4 px-4 sm:px-6 text-left font-heading font-bold text-xs sm:text-sm text-ink-700 w-1/4 sm:w-1/5 border-r border-sand-200/80">
                          Time Slot
                        </th>
                        <th className="py-4 px-4 sm:px-6 font-heading font-bold text-sm sm:text-base text-ink-900 w-1/4 border-r border-sand-200/80">
                          Tuesday
                        </th>
                        <th className="py-4 px-4 sm:px-6 font-heading font-bold text-sm sm:text-base text-ink-900 w-1/4 border-r border-sand-200/80">
                          Wednesday
                        </th>
                        <th className="py-4 px-4 sm:px-6 font-heading font-bold text-sm sm:text-base text-ink-900 w-1/4">
                          Thursday
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-200">
                      {/* Row 1: 6:30 PM - 7:30 PM */}
                      <tr className="hover:bg-sand-50/40 transition-colors">
                        <td className="py-6 px-4 sm:px-6 text-left font-bold text-xs sm:text-sm text-ink-900 bg-sand-50/40 border-r border-sand-200/80 whitespace-nowrap">
                          6:30 PM - 7:30 PM
                        </td>
                        {/* Tuesday: Qur'ānic Arabic */}
                        <td className="py-6 px-4 sm:px-6 align-middle border-r border-sand-200/80">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <span className="font-heading font-bold text-sm sm:text-base text-ink-900">
                              Qur'ānic Arabic
                            </span>
                            <span className="text-xs sm:text-sm text-ink-600 italic">
                              Dr. Mutee Ur Rehman
                            </span>
                            <a
                              href="https://meet.google.com/cbh-ywhg-upu"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                            >
                              Launch Meet <ExternalLink size={11} />
                            </a>
                          </div>
                        </td>
                        {/* Wednesday: Fiqh */}
                        <td className="py-6 px-4 sm:px-6 align-middle border-r border-sand-200/80">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <span className="font-heading font-bold text-sm sm:text-base text-ink-900">
                              Fiqh
                            </span>
                            <span className="text-xs sm:text-sm text-ink-600 italic">
                              Dr. Hafiz Muhammad Zubair
                            </span>
                            <a
                              href="https://meet.google.com/cbh-ywhg-upu"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                            >
                              Launch Meet <ExternalLink size={11} />
                            </a>
                          </div>
                        </td>
                        {/* Thursday: Why Islam */}
                        <td className="py-6 px-4 sm:px-6 align-middle">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <span className="font-heading font-bold text-sm sm:text-base text-ink-900">
                              Why Islam
                            </span>
                            <span className="text-xs sm:text-sm text-ink-600 italic">
                              Sir Ahmed Khan
                            </span>
                            <a
                              href="https://meet.google.com/cbh-ywhg-upu"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                            >
                              Launch Meet <ExternalLink size={11} />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* Row 2: 7:30 PM - 8:00 PM (Break) */}
                      <tr className="bg-sand-50/60">
                        <td className="py-4 px-4 sm:px-6 text-left font-bold text-xs sm:text-sm text-ink-900 bg-sand-100/40 border-r border-sand-200/80 whitespace-nowrap">
                          7:30 PM - 8:00 PM
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-xs sm:text-sm text-ink-500 font-medium border-r border-sand-200/80">
                          Break
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-xs sm:text-sm text-ink-500 font-medium border-r border-sand-200/80">
                          Break
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-xs sm:text-sm text-ink-500 font-medium">
                          Break
                        </td>
                      </tr>

                      {/* Row 3: 8:00 PM - 9:00 PM */}
                      <tr className="hover:bg-sand-50/40 transition-colors">
                        <td className="py-6 px-4 sm:px-6 text-left font-bold text-xs sm:text-sm text-ink-900 bg-sand-50/40 border-r border-sand-200/80 whitespace-nowrap">
                          8:00 PM - 9:00 PM
                        </td>
                        {/* Tuesday: Tajwīd */}
                        <td className="py-6 px-4 sm:px-6 align-middle border-r border-sand-200/80">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <span className="font-heading font-bold text-sm sm:text-base text-ink-900">
                              Tajwīd
                            </span>
                            <span className="text-xs sm:text-sm text-ink-600 italic">
                              Qari Salman Saleem
                            </span>
                            <a
                              href="https://meet.google.com/cbh-ywhg-upu"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                            >
                              Launch Meet <ExternalLink size={11} />
                            </a>
                          </div>
                        </td>
                        {/* Wednesday: Tafsīr */}
                        <td className="py-6 px-4 sm:px-6 align-middle border-r border-sand-200/80">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <span className="font-heading font-bold text-sm sm:text-base text-ink-900">
                              Tafsīr
                            </span>
                            <span className="text-xs sm:text-sm text-ink-600 italic">
                              Shaykh Hamid Kamal UD DIn
                            </span>
                            <a
                              href="https://meet.google.com/cbh-ywhg-upu"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                            >
                              Launch Meet <ExternalLink size={11} />
                            </a>
                          </div>
                        </td>
                        {/* Thursday: Sīrah */}
                        <td className="py-6 px-4 sm:px-6 align-middle">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <span className="font-heading font-bold text-sm sm:text-base text-ink-900">
                              Sīrah
                            </span>
                            <span className="text-xs sm:text-sm text-ink-600 italic">
                              Sir Ali Ahmed Saeed
                            </span>
                            <a
                              href="https://meet.google.com/cbh-ywhg-upu"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                            >
                              Launch Meet <ExternalLink size={11} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Enrolled Courses Schedule Table */
              <div className="bg-white rounded-2xl border border-sand-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-sand-50 border-b border-sand-200">
                  <h3 className="font-heading font-bold text-ink-900 text-sm">
                    Enrolled Courses Schedule
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-sand-200 bg-sand-50/50 font-bold text-ink-700">
                        <th className="p-3">Day &amp; Time</th>
                        <th className="p-3">Course</th>
                        <th className="p-3">Instructor</th>
                        <th className="p-3">Modality</th>
                        <th className="p-3 text-right">Join Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-200">
                      {slots.map((slot) => {
                        const isOnline = slot.modality ? slot.modality.includes('online') : true;
                        return (
                          <tr key={slot.id} className="hover:bg-sand-50/40">
                            <td className="p-3 font-semibold text-ink-900 whitespace-nowrap">
                              {slot.dayOfWeek} • {formatSlotTimeRange(slot.startTime, slot.endTime)}
                            </td>
                            <td className="p-3 font-medium text-ink-900">{slot.courseTitle}</td>
                            <td className="p-3 text-ink-600">{slot.instructorName}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${isOnline ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                                {isOnline ? <Video size={10} /> : <MapPin size={10} />}
                                {isOnline ? 'Online' : 'Onsite'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {isOnline && slot.meetLink ? (
                                <a
                                  href={slot.meetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-800 font-semibold underline"
                                >
                                  Join Meet
                                </a>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : null}

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
                          slot.meetLink || 'https://meet.google.com/cbh-ywhg-upu';

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
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                      <Video size={11} className="text-emerald-700" />
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
