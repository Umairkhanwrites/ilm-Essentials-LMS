/**
 * MediaPlayer — Real Video Player & Learning Canvas for Course Interface.
 *
 * Supports:
 * 1. Bunny.net Stream Video Embeds (player.mediadelivery.net / iframe.mediadelivery.net)
 * 2. YouTube & Vimeo embeds
 * 3. Reading Module Canvas (for text-based lessons)
 * 4. Assessment Module Canvas (for interactive quizzes)
 * 5. Live class indicator
 *
 * @param {object}   currentLesson       - Active lesson object { id, title, type, duration, videoUrl, … }
 * @param {boolean}  isLive              - Whether this is a live session
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  BookOpen,
  FileCheck,
  Video,
  Clock,
  Sparkles,
  ExternalLink,
  Lock,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { DEFAULT_BUNNY_VIDEO_URL } from '../../data/mockData';
import { getEmbedVideoUrl, getStudentVideoRestriction } from '../../services/courseStorage';

export default function MediaPlayer({
  currentLesson,
  isLive = false,
  onGoToUnlockedLesson,
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [restriction, setRestriction] = useState(() => getStudentVideoRestriction());

  useEffect(() => {
    const handleRestrictionUpdate = () => {
      setRestriction(getStudentVideoRestriction());
    };

    window.addEventListener('ilm-video-restriction-updated', handleRestrictionUpdate);
    window.addEventListener('storage', handleRestrictionUpdate);

    return () => {
      window.removeEventListener('ilm-video-restriction-updated', handleRestrictionUpdate);
      window.removeEventListener('storage', handleRestrictionUpdate);
    };
  }, []);

  const lessonType = currentLesson?.type || 'video';
  const rawVideoUrl = currentLesson?.videoUrl || DEFAULT_BUNNY_VIDEO_URL;
  const embedUrl = getEmbedVideoUrl(rawVideoUrl);

  // ---- 0.1 SEQUENTIAL LOCK GUARD ----
  if (currentLesson?.isLocked) {
    return (
      <div className="relative w-full bg-gradient-to-br from-[#071810] via-[#0B2519] to-black rounded-xl sm:rounded-2xl overflow-hidden shadow-elevated select-none text-white border border-sand-300/20">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-4 z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-sand-300/30 text-sand-200 flex items-center justify-center shadow-lg">
              <Lock size={28} className="text-sand-200" />
            </div>

            <div className="max-w-md sm:max-w-lg space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-100/10 text-sand-200 border border-sand-200/20 text-[11px] font-bold uppercase tracking-wider">
                <Lock size={12} />
                <span>Sequential Curriculum Access</span>
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-bold text-white leading-snug">
                This Lesson is Locked
              </h3>
              <p className="text-xs sm:text-sm text-sand-300 leading-relaxed">
                {currentLesson.lockReason || 'You must complete the earlier lessons in this course before accessing this lecture.'}
              </p>
            </div>

            {onGoToUnlockedLesson && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onGoToUnlockedLesson}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
                >
                  <span>Resume Current Accessible Lesson →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- 0.2 VIDEO ACCESS RESTRICTION GUARD ----
  if (restriction.isVideoRestricted && lessonType === 'video') {
    return (
      <div className="relative w-full bg-gradient-to-br from-ink-950 via-[#140808] to-black rounded-xl sm:rounded-2xl overflow-hidden shadow-elevated select-none text-white border border-red-500/40">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-4 z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-400 flex items-center justify-center shadow-lg">
              <Lock size={28} className="animate-pulse text-red-400" />
            </div>

            <div className="max-w-md sm:max-w-lg space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/60 text-red-200 border border-red-700/50 text-[11px] font-bold uppercase tracking-wider">
                <AlertTriangle size={12} />
                <span>Video Access Restricted</span>
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-bold text-white leading-snug">
                Course Video Access Restricted
              </h3>
              <p className="text-xs sm:text-sm text-sand-300 leading-relaxed">
                Your course video access has been restricted by the admin due to pending fee dues. Please clear your overdue installments in the Accounts section to automatically restore access.
              </p>
              {restriction.restrictedByAdminName && (
                <p className="text-[11px] text-sand-400 pt-1">
                  Restriction placed by: <span className="font-semibold text-sand-200">{restriction.restrictedByAdminName}</span>
                </p>
              )}
            </div>

            <div className="pt-2">
              <Link
                to="/accounts"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-ink-950 font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
              >
                <CreditCard size={15} />
                <span>Go to Accounts &amp; Pay Dues →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- 1. READING LESSON CANVAS ----
  if (lessonType === 'reading') {
    return (
      <div className="relative w-full bg-gradient-to-br from-[#0B3324] via-[#0F422F] to-[#072318] rounded-xl overflow-hidden shadow-elevated select-none text-white">
        <div className="relative w-full" style={{ paddingBottom: '45%' }}>
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-between">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-gold-400 text-primary-950 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  <BookOpen size={13} />
                  <span>Reading Assignment</span>
                </span>
                <span className="text-xs text-sand-200">
                  • {currentLesson?.duration || '20 min read'}
                </span>
              </div>
            </div>

            {/* Center Content */}
            <div className="max-w-2xl my-auto space-y-3">
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-white leading-snug">
                {currentLesson?.title || 'Classical Syllabus Reading'}
              </h2>
              <p className="text-sm text-sand-200 leading-relaxed line-clamp-3">
                {currentLesson?.content ||
                  'Delve into selected excerpts, scholarly commentaries, and classical Arabic linguistic analysis curated for this module. Read carefully before proceeding to assessments.'}
              </p>
            </div>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-sand-300">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-gold-400" />
                Textbook &amp; Notes available in Resources tab below
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- 2. ASSESSMENT / QUIZ LESSON CANVAS ----
  if (lessonType === 'assessment') {
    return (
      <div className="relative w-full bg-gradient-to-br from-[#122B20] via-[#0B3324] to-[#071C14] rounded-xl overflow-hidden shadow-elevated select-none text-white">
        <div className="relative w-full" style={{ paddingBottom: '45%' }}>
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-between">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-amber-400 text-ink-900 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  <FileCheck size={13} />
                  <span>Interactive Assessment</span>
                </span>
                <span className="text-xs text-sand-200">
                  • {currentLesson?.duration || '25 min'}
                </span>
              </div>
            </div>

            {/* Center Content */}
            <div className="max-w-2xl my-auto space-y-3">
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-white leading-snug">
                {currentLesson?.title || 'Module Comprehension Assessment'}
              </h2>
              <p className="text-sm text-sand-200 leading-relaxed">
                Test your understanding of the core concepts, vocabulary, and rulings covered in this section. Passing requirement is 70% to mark this module completed.
              </p>
            </div>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-sand-300">
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" />
                Timed quiz • Instant grading &amp; feedback
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- 3. VIDEO LECTURE PLAYER (BUNNY.NET STREAM / YOUTUBE / VIMEO) ----
  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-elevated select-none group">
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {/* Top Control Overlay (Hover Visible) */}
        <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 pointer-events-none flex items-center justify-between transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-2.5 pointer-events-auto min-w-0 pr-2">
            <p className="text-white text-xs sm:text-sm font-semibold truncate drop-shadow-sm">
              {currentLesson?.title || 'Lesson Video'}
            </p>
          </div>
        </div>

        {/* Real Embedded Bunny.net Stream Video Iframe */}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            loading="lazy"
            title={currentLesson?.title || 'Lesson Video Player'}
            className="absolute inset-0 w-full h-full border-0 z-10"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950 text-white p-6 text-center z-10">
            <Video size={36} className="text-primary-400 mb-2" />
            <p className="text-sm font-medium">No video stream configured for this lesson.</p>
          </div>
        )}

        {/* Loading Spinner Skeleton before Iframe finishes initialization */}
        {!iframeLoaded && embedUrl && (
          <div className="absolute inset-0 bg-ink-950 flex flex-col items-center justify-center text-white/60 z-0">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-medium">Loading high-definition stream...</span>
          </div>
        )}
      </div>
    </div>
  );
}
