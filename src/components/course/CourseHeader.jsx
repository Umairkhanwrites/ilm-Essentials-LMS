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

  const meetingUrl = course.meetingLink || (isOnline || isHybrid ? 'https://meet.google.com/ilm-live-class' : null);
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
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors mb-4 group"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-1"
        />
        Back to Dashboard
      </a>

      {/* ---- Main header content ---- */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        {/* Left: Title + instructor */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-ink-900 leading-tight">
              {course.title}
            </h1>

            {/* Delivery Category Badge */}
            <Badge
              className={clsx(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                isHybrid
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : isOnsite
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              )}
            >
              <FormatIcon size={13} />
              {isHybrid
                ? 'Online & Onsite'
                : isOnsite
                ? 'Onsite Campus'
                : 'Online Lectures'}
            </Badge>
          </div>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-ink-500">
            {course.subtitle}
          </p>

          {/* Course Specific Duration & Starting/Ending Dates */}
          {(formattedStart || course.duration) && (
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
            </div>
          )}

          {/* Instructor & Live Meeting Join Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <Avatar
                name={course.instructor?.name || 'Instructor'}
                src={course.instructor?.avatar}
                size="sm"
              />
              <div>
                <p className="text-sm font-semibold text-ink-800">
                  {course.instructor?.name || 'Lead Scholar'}
                </p>
                <p className="text-xs text-ink-500">
                  {course.instructor?.title || 'Faculty of Islamic Sciences'}
                </p>
              </div>
            </div>

            {/* Onsite Venue info */}
            {isOnsite && campusVenue && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                <MapPin size={13} className="text-amber-700" />
                <span>{campusVenue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Progress */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink-700">Overall Progress</span>
            <span className="font-bold text-primary-700">
              {course.progress}%
            </span>
          </div>

          <ProgressBar value={course.progress} />

          <p className="text-xs text-ink-500">
            <span className="font-semibold text-primary-700">
              {course.completedLessons}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-ink-700">
              {course.totalLessons}
            </span>{' '}
            lessons completed
          </p>
        </div>
      </div>
    </motion.header>
  );
}
