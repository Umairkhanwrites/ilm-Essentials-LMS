/**
 * CourseHeader — Top section of the Individual Course Interface.
 *
 * Displays course title, subtitle, instructor info, overall progress,
 * format badge, and a back-navigation link.
 *
 * @param {object}   course          - courseDetail object from mockData
 * @param {object}   formatMeta      - courseFormats[course.format] metadata
 * @param {function} [onBack]        - Optional callback; falls back to /dashboard link
 *
 * TODO: Replace static data with API-driven course fetch
 * TODO: Wire back button to react-router navigation
 */
import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  ArrowLeft,
  MapPin,
  Video,
  PlayCircle,
  GraduationCap,
  Layers,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Avatar from '../../components/ui/Avatar';

/** Map format keys → icon components */
const FORMAT_ICONS = {
  online: Video,
  onsite: MapPin,
  hybrid: Layers,
  'on-site': MapPin,
  'live-online': Video,
  'self-paced': PlayCircle,
};

export default function CourseHeader({ course, formatMeta, onBack }) {
  const isOnline = course.classCategory === 'online' || course.format === 'live-online' || course.format === 'online';
  const isOnsite = course.classCategory === 'onsite' || course.format === 'on-site' || course.format === 'onsite';
  const isHybrid = course.classCategory === 'hybrid' || course.format === 'hybrid';

  const FormatIcon = FORMAT_ICONS[course.classCategory] || FORMAT_ICONS[course.format] || GraduationCap;

  const meetingUrl = course.meetingLink || (isOnline || isHybrid ? 'https://meet.google.com/cbh-ywhg-upu' : null);
  const campusVenue = course.campusLocation || course.venue || (isOnsite || isHybrid ? 'Ilm Essentials Campus, DHA Phase 6, Lahore' : null);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formattedStart = formatDate(course.startDate);
  const formattedEnd = formatDate(course.endDate);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      {/* ---- Back link ---- */}
      <a
        href="/dashboard"
        onClick={(e) => {
          if (onBack) {
            e.preventDefault();
            onBack();
          }
        }}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors mb-2.5 sm:mb-4 group"
      >
        <ArrowLeft
          size={15}
          className="transition-transform group-hover:-translate-x-1"
        />
        Back to Dashboard
      </a>

      {/* ---- Main header content ---- */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-5">
        {/* Left: Title + subtitle */}
        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-3">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-ink-900 leading-tight">
              {course.title}
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-ink-500">
            {course.subtitle}
          </p>

          {/* Course Specific Duration & Starting/Ending Dates */}
          {(formattedStart || course.duration || (isOnsite && campusVenue)) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600 pt-1">
              {formattedStart && (
                <div className="flex items-center gap-1.5 bg-sand-100/80 px-2.5 py-1 rounded-lg border border-sand-200">
                  <Calendar size={13} className="text-primary-700" />
                  <span>
                    <strong>Course Duration:</strong> {formattedStart} {formattedEnd ? `– ${formattedEnd}` : ''}
                    {course.duration ? ` (${course.duration})` : ''}
                  </span>
                </div>
              )}
              {course.schedule && (
                <div className="flex items-center gap-1.5 bg-sand-100/80 px-2.5 py-1 rounded-lg border border-sand-200">
                  <Clock size={13} className="text-primary-700" />
                  <span>{course.schedule}</span>
                </div>
              )}
              {isOnsite && campusVenue && (
                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-900 font-semibold">
                  <MapPin size={13} className="text-amber-700" />
                  <span>{campusVenue}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
