/**
 * ResourceTab — Downloadable resources and materials for a course.
 *
 * Displays a grid of resource cards (with type icon, title, size, download button)
 * and a featured "Essentials e-Library" link card at the bottom.
 *
 * @param {Array} resources - courseDetail.resources array
 *
 * TODO: Wire download links to actual file storage (S3, etc.)
 * TODO: Track download analytics
 */
import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import Card from '../../components/ui/Card';

/** Map resource type → icon + colour */
const RESOURCE_TYPE_META = {
  pdf: {
    Icon: FileText,
    bg: 'bg-red-50',
    text: 'text-red-600',
    label: 'PDF',
  },
  doc: {
    Icon: FileText,
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    label: 'DOC',
  },
  xls: {
    Icon: FileSpreadsheet,
    bg: 'bg-green-50',
    text: 'text-green-600',
    label: 'XLS',
  },
  img: {
    Icon: FileImage,
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    label: 'IMG',
  },
  default: {
    Icon: File,
    bg: 'bg-sand-100',
    text: 'text-ink-500',
    label: 'FILE',
  },
};

function getTypeMeta(type) {
  return RESOURCE_TYPE_META[type] || RESOURCE_TYPE_META.default;
}

/** Staggered list animation variants */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function ResourceTab({ resources = [] }) {
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <File size={48} className="text-ink-300 mb-4" />
        <h3 className="text-lg font-heading font-semibold text-ink-700 mb-1">
          No resources yet
        </h3>
        <p className="text-sm text-ink-500 max-w-xs">
          Course materials will appear here as they are made available by the instructor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section title */}
      <div>
        <h2 className="text-xl font-heading font-bold text-ink-900 mb-1">
          Course Resources &amp; Materials
        </h2>
        <p className="text-sm text-ink-500">
          {resources.length} resource{resources.length !== 1 && 's'} available for
          download
        </p>
      </div>

      {/* Resource grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {resources.map((resource) => {
          const meta = getTypeMeta(resource.type);
          const { Icon } = meta;

          return (
            <motion.div key={resource.id} variants={itemVariants}>
              <Card className="flex items-start gap-4 p-4 hover:shadow-soft transition-shadow group">
                {/* Icon */}
                <div
                  className={clsx(
                    'flex items-center justify-center w-11 h-11 rounded-lg flex-shrink-0',
                    meta.bg
                  )}
                >
                  <Icon size={22} className={meta.text} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-800 leading-snug line-clamp-2">
                    {resource.title}
                  </p>
                  <p className="text-xs text-ink-400 mt-1">
                    {meta.label} • {resource.size}
                  </p>
                </div>

                {/* Download button */}
                <a
                  href={resource.downloadUrl}
                  download
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary-600
                             hover:text-primary-800 bg-primary-50 hover:bg-primary-100
                             px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  aria-label={`Download ${resource.title}`}
                >
                  <Download size={14} />
                  Download
                </a>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ---- Featured e-Library card ---- */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <a
          href="#"
          className="block group"
          aria-label="Open Essentials e-Library"
        >
          <div
            className="relative overflow-hidden rounded-xl border-2 border-gold-200
                        bg-gradient-to-r from-gold-50 via-white to-gold-50
                        p-6 flex items-center gap-5 hover:border-gold-400 hover:shadow-glow
                        transition-all duration-300"
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gold-100 group-hover:bg-gold-200 transition-colors flex-shrink-0">
              <BookOpen size={28} className="text-gold-700" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-heading font-bold text-ink-900 mb-0.5">
                Essentials e-Library
              </h3>
              <p className="text-sm text-ink-500">
                Browse the complete digital library with curated Islamic texts,
                reference works, and supplementary readings.
              </p>
            </div>

            {/* Arrow */}
            <ExternalLink
              size={20}
              className="flex-shrink-0 text-gold-500 group-hover:text-gold-700
                         transition-colors"
            />
          </div>
        </a>
      </motion.div>
    </div>
  );
}
