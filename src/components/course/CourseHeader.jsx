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
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Avatar from '../../components/ui/Avatar';

/** Map format keys → icon components */
const FORMAT_ICONS = {
  'on-site': MapPin,
  'live-online': Video,
  'self-paced': PlayCircle,
};

export default function CourseHeader({ course, formatMeta, onBack }) {
  const FormatIcon = FORMAT_ICONS[course.format] || GraduationCap;

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

            {/* Format badge */}
            {formatMeta && (
              <Badge
                className={clsx(
                  'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                  formatMeta.color
                )}
              >
                <FormatIcon size={13} />
                {formatMeta.label}
              </Badge>
            )}
          </div>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-ink-500">
            {course.subtitle}
          </p>

          {/* Instructor */}
          <div className="flex items-center gap-3">
            <Avatar
              name={course.instructor.name}
              src={course.instructor.avatar}
              size="sm"
            />
            <div>
              <p className="text-sm font-semibold text-ink-800">
                {course.instructor.name}
              </p>
              <p className="text-xs text-ink-500">
                {course.instructor.title}
              </p>
            </div>
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
