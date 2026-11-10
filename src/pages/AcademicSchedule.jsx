import React, { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import {
  Calendar,
  Video,
  MapPin,
  ExternalLink,
  List,
  ArrowLeft,
  Table,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  isStudentEnrolledInFoundations,
  getStudentScheduleSlots,
  getEnrolledCourses,
  formatSlotTimeRange,
  formatTime12h,
} from '../services/courseStorage';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function AcademicSchedule() {
  const isFoundationsEnrolled = useMemo(() => isStudentEnrolledInFoundations(), []);
  const enrolledCourses = useMemo(() => getEnrolledCourses(), []);
  const [slots] = useState(() => getStudentScheduleSlots());
  const [selectedModality, setSelectedModality] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // Default to exact timetable table view

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (slot.status === 'cancelled') return false;
      const isOnline = slot.modality ? slot.modality.includes('online') : true;
      const matchModality =
        selectedModality === 'all' ||
        (selectedModality === 'online' && isOnline) ||
        (selectedModality === 'onsite' && !isOnline);
      const matchDay = selectedDay === 'all' || slot.dayOfWeek === selectedDay;
      return matchModality && matchDay;
    });
  }, [slots, selectedModality, selectedDay]);

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
    for (const day of DAYS_OF_WEEK) {
      map[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [filteredSlots]);

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
        {/* Page Header with Integrated View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-sand-200">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-primary-800 transition-colors mb-1.5"
            >
              <ArrowLeft size={13} />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
              Academic Timetable
            </h1>
          </div>

          {/* View Switcher: Timetable and Agenda List */}
          {(isFoundationsEnrolled || slots.length > 0) && (
            <div className="inline-flex items-center p-0.5 rounded-xl bg-sand-100 border border-sand-200 text-xs shrink-0 self-start sm:self-end">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-white text-ink-900 shadow-2xs font-semibold'
                    : 'text-ink-600 hover:text-ink-900'
                )}
              >
                <Table size={13} />
                <span>Timetable</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer',
                  viewMode === 'agenda'
                    ? 'bg-white text-ink-900 shadow-2xs font-semibold'
                    : 'text-ink-600 hover:text-ink-900'
                )}
              >
                <List size={13} />
                <span>Agenda List</span>
              </button>
            </div>
          )}
        </div>

        {/* Agenda Modality & Day Filter Toolbar — visible only in Agenda view */}
        {viewMode === 'agenda' && (
          <div className="flex flex-wrap items-center gap-2 pt-1 animate-fadeIn">
            <div className="inline-flex items-center p-0.5 rounded-lg bg-sand-100 border border-sand-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedModality('all')}
                className={clsx(
                  'px-3 py-1 rounded-md font-medium transition-colors cursor-pointer',
                  selectedModality === 'all'
                    ? 'bg-white text-ink-900 shadow-2xs font-semibold'
                    : 'text-ink-600 hover:text-ink-900'
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedModality('online')}
                className={clsx(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-colors cursor-pointer',
                  selectedModality === 'online'
                    ? 'bg-white text-ink-900 shadow-2xs font-semibold'
                    : 'text-ink-600 hover:text-ink-900'
                )}
              >
                <Video size={12} />
                <span>Online</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedModality('onsite')}
                className={clsx(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-colors cursor-pointer',
                  selectedModality === 'onsite'
                    ? 'bg-white text-ink-900 shadow-2xs font-semibold'
                    : 'text-ink-600 hover:text-ink-900'
                )}
              >
                <MapPin size={12} />
                <span>Onsite</span>
              </button>
            </div>

            {/* Day Dropdown */}
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-sand-200 font-medium text-ink-700 hover:border-sand-300 focus:outline-none focus:ring-1 focus:ring-primary-800"
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

        {/* Content Section */}
        {!isFoundationsEnrolled && slots.length === 0 ? (
          /* Informative State for Non-Foundations Students */
          <div className="bg-white rounded-2xl border border-sand-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xs space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sand-100 border border-sand-200 text-ink-700 flex items-center justify-center">
              <Calendar size={28} className="text-primary-800" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading font-bold text-lg sm:text-xl text-ink-900">
                No Live Timetable for Your Enrolled Courses
              </h2>
              <p className="text-sm text-ink-600 max-w-md mx-auto leading-relaxed">
                {enrolledCourses.length > 0 ? (
                  <>
                    You are currently enrolled in{' '}
                    <span className="font-semibold text-ink-900">
                      {enrolledCourses.map((c) => c.title).join(', ')}
                    </span>
                    . These courses feature on-demand recorded lessons and self-paced study modules.
                  </>
                ) : (
                  <>You are not currently enrolled in any courses with a live class timetable.</>
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-sand-50/80 border border-sand-200 text-xs text-ink-600 max-w-lg mx-auto text-left flex items-start gap-3">
              <GraduationCap size={18} className="text-primary-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink-900 block mb-0.5">
                  Ilm Foundations Live Sessions
                </span>
                The weekly live lecture timetable (Tuesday, Wednesday &amp; Thursday) and Google Meet sessions are reserved exclusively for students enrolled in the <strong>Ilm Foundations 8-Month Certificate Programme</strong>.
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/my-courses"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3324] hover:bg-[#072318] text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <span>Go to My Courses</span>
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-sand-200 hover:bg-sand-50 text-ink-800 text-xs font-semibold transition-colors shadow-2xs"
              >
                <span>Explore Ilm Foundations</span>
              </Link>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          isFoundationsEnrolled ? (
            /* Exact Official Ilm Foundations Table */
            <div className="bg-white rounded-2xl border border-sand-200 shadow-2xs overflow-hidden">
              {/* Distinct Program Heading Banner Before Table */}
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
                            Join Google Meet <ExternalLink size={11} />
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
                            Join Google Meet <ExternalLink size={11} />
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
                            Join Google Meet <ExternalLink size={11} />
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
                            Join Google Meet <ExternalLink size={11} />
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
                            Join Google Meet <ExternalLink size={11} />
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
                            Join Google Meet <ExternalLink size={11} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Table for Non-Foundations Enrolled Courses with Active Slots */
            <div className="bg-white rounded-2xl border border-sand-200 shadow-2xs overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-emerald-50/60 via-sand-50/40 to-white border-b border-sand-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-900 border border-emerald-200 flex items-center justify-center shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-heading font-bold text-ink-900 leading-tight">
                      Enrolled Courses Timetable
                    </h2>
                    <p className="text-xs text-ink-600 mt-0.5">
                      Live interactive sessions for your enrolled subjects
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-sand-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live Classes</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50/70 text-xs font-bold text-ink-700 uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6">Day &amp; Time</th>
                      <th className="py-3 px-4 sm:px-6">Course</th>
                      <th className="py-3 px-4 sm:px-6">Instructor</th>
                      <th className="py-3 px-4 sm:px-6">Modality</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Join Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200 text-sm">
                    {slots.map((slot) => {
                      const isOnline = slot.modality ? slot.modality.includes('online') : true;
                      return (
                        <tr key={slot.id} className="hover:bg-sand-50/40 transition-colors">
                          <td className="py-4 px-4 sm:px-6 font-semibold text-ink-900 whitespace-nowrap">
                            <span className="block">{slot.dayOfWeek}</span>
                            <span className="text-xs text-ink-500 font-normal">
                              {formatSlotTimeRange(slot.startTime, slot.endTime)}
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <span className="font-heading font-bold text-ink-900 block">
                              {slot.courseTitle}
                            </span>
                            {slot.topic && (
                              <span className="text-xs text-ink-500 line-clamp-1">
                                {slot.topic}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-ink-700 whitespace-nowrap">
                            {slot.instructorName}
                          </td>
                          <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                                isOnline ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                              )}
                            >
                              {isOnline ? <Video size={11} /> : <MapPin size={11} />}
                              {isOnline ? 'Online' : 'Onsite'}
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                            {isOnline && slot.meetLink ? (
                              <a
                                href={slot.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                              >
                                Join Meet <ExternalLink size={11} />
                              </a>
                            ) : (
                              <span className="text-xs text-ink-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Minimal Agenda List View */
          <div className="space-y-6">
            {DAYS_OF_WEEK.filter(
              (day) => selectedDay === 'all' || selectedDay === day
            ).map((day) => {
              const daySlots = groupedByDay[day] || [];
              const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
              const isToday = day === currentDayName;

              if (daySlots.length === 0) return null;

              return (
                <div key={day} className="space-y-2.5">
                  {/* Minimal Day Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-sand-200/80">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-xs uppercase tracking-wider text-ink-800">
                        {day}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-ink-400">
                      {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>

                  {/* Clean Class Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {daySlots.map((slot) => {
                      const isOnline = slot.modality ? slot.modality.includes('online') : true;
                      const meetUrl =
                        slot.meetLink || 'https://meet.google.com/cbh-ywhg-upu';

                      return (
                        <div
                          key={slot.id}
                          className={clsx(
                            'p-3.5 rounded-xl border bg-white shadow-2xs transition-all hover:border-sand-300 flex flex-col justify-between gap-3',
                            isToday
                              ? 'border-emerald-600/30 bg-emerald-50/10'
                              : 'border-sand-200'
                          )}
                        >
                          <div>
                            {/* Time & Modality Pill */}
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-ink-900">
                                {formatSlotTimeRange(slot.startTime, slot.endTime)}
                              </span>
                              <span
                                className={clsx(
                                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border',
                                  isOnline
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                                    : 'bg-amber-50 text-amber-800 border-amber-200/70'
                                )}
                              >
                                {isOnline ? (
                                  <>
                                    <Video size={10} />
                                    Online
                                  </>
                                ) : (
                                  <>
                                    <MapPin size={10} />
                                    Onsite
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Subject Title */}
                            <h4 className="font-heading font-bold text-sm text-ink-900 leading-snug mt-2">
                              {slot.courseTitle}
                            </h4>
                            {slot.topic && (
                              <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">
                                {slot.topic}
                              </p>
                            )}
                          </div>

                          {/* Footer: Instructor, Venue & Action */}
                          <div className="pt-2 border-t border-sand-100 flex items-center justify-between text-xs text-ink-500">
                            <span className="truncate">
                              {slot.instructorName}
                              {!isOnline && slot.campusRoom ? ` • ${slot.campusRoom}` : ''}
                            </span>
                            {isOnline && (
                              <a
                                href={meetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 shrink-0 ml-2"
                              >
                                Join <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
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
    </Layout>
  );
}
