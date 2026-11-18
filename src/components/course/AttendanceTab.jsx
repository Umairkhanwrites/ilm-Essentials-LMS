/**
 * AttendanceTab — Minimalist Course Attendance Status & Roll-Call History
 *
 * Clean, uncluttered layout matching Ilm Essentials design system:
 * - Minimal summary header with current attendance rate & standing
 * - Subtle inline metric counters
 * - Clean chronological session list with discrete status indicators
 * - Lightweight review request flow
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Clock,
  X,
  MessageSquare,
  Send,
} from 'lucide-react';
import {
  getStudentCourseAttendance,
  submitAttendanceReviewRequest,
  getAttendanceReviewRequests,
} from '../../services/courseStorage';

export default function AttendanceTab({ courseId, courseTitle, student }) {
  const [attendanceData, setAttendanceData] = useState(() =>
    getStudentCourseAttendance(student, courseId)
  );
  const [filter, setFilter] = useState('all');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [reviewRequests, setReviewRequests] = useState(() => getAttendanceReviewRequests());

  useEffect(() => {
    const handleUpdate = () => {
      setAttendanceData(getStudentCourseAttendance(student, courseId));
      setReviewRequests(getAttendanceReviewRequests());
    };

    window.addEventListener('ilm-attendance-updated', handleUpdate);
    window.addEventListener('ilm-attendance-review-submitted', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('ilm-attendance-updated', handleUpdate);
      window.removeEventListener('ilm-attendance-review-submitted', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [student, courseId]);

  useEffect(() => {
    setAttendanceData(getStudentCourseAttendance(student, courseId));
  }, [student, courseId]);

  const {
    rate,
    rateNumber,
    totalSessions,
    presentCount,
    lateCount,
    absentCount,
    hasRecords,
    history,
  } = attendanceData;

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter((s) => s.status === filter);
  }, [history, filter]);

  const isPendingReview = (sessionId) => {
    const sId = (student?.id || student?.uid || '').toLowerCase();
    return reviewRequests.some(
      (r) =>
        r.sessionId === sessionId &&
        (r.studentId?.toLowerCase() === sId || r.studentId === 'std_001') &&
        r.status === 'pending'
    );
  };

  const handleOpenReview = (session) => {
    setSelectedSession(session);
    setReviewReason('');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!selectedSession || !reviewReason.trim()) return;

    submitAttendanceReviewRequest({
      sessionId: selectedSession.id,
      sessionDate: selectedSession.date,
      sessionTopic: selectedSession.topic,
      courseId,
      courseTitle: courseTitle || 'Course',
      studentId: student?.id || student?.uid || 'std_001',
      studentName: student?.name || 'Student',
      currentStatus: selectedSession.status,
      reason: reviewReason.trim(),
    });

    setIsReviewModalOpen(false);
    setSelectedSession(null);
    setReviewReason('');
    setToastMessage('Review request submitted to administration.');
    setTimeout(() => setToastMessage(null), 3500);
    setReviewRequests(getAttendanceReviewRequests());
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pt-1">
      {/* 1. MINIMAL ATTENDANCE SUMMARY STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-sand-200">
        {/* Left: Percentage & Standing */}
        <div className="flex items-baseline gap-3">
          <span className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            {hasRecords ? rate : '—'}
          </span>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-700">Course Attendance</span>
              {hasRecords ? (
                rateNumber >= 80 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Good Standing
                  </span>
                ) : rateNumber >= 75 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    Warning (&lt;80%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    Shortage (&lt;75%)
                  </span>
                )
              ) : (
                <span className="text-[11px] text-ink-400 font-medium">No sessions recorded</span>
              )}
            </div>
            <p className="text-[11px] text-ink-400">
              80% minimum required for diploma eligibility
            </p>
          </div>
        </div>

        {/* Right: Inline Minimal Metric Numbers */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs text-ink-600">
          <div>
            <span className="text-ink-400 block text-[10px] uppercase font-semibold tracking-wider">Held</span>
            <span className="font-heading font-bold text-base text-ink-900">{totalSessions}</span>
          </div>
          <div className="w-px h-7 bg-sand-200" />
          <div>
            <span className="text-emerald-700 block text-[10px] uppercase font-semibold tracking-wider">Present</span>
            <span className="font-heading font-bold text-base text-emerald-900">{presentCount}</span>
          </div>
          <div className="w-px h-7 bg-sand-200" />
          <div>
            <span className="text-amber-700 block text-[10px] uppercase font-semibold tracking-wider">Late</span>
            <span className="font-heading font-bold text-base text-amber-900">{lateCount}</span>
          </div>
          <div className="w-px h-7 bg-sand-200" />
          <div>
            <span className="text-rose-700 block text-[10px] uppercase font-semibold tracking-wider">Absent</span>
            <span className="font-heading font-bold text-base text-rose-900">{absentCount}</span>
          </div>
        </div>
      </div>

      {/* 2. ROLL-CALL SESSION HISTORY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Roll-Call History {totalSessions > 0 ? `(${totalSessions})` : ''}
          </span>

          {/* Filter Pills (only shown if sessions exist) */}
          {history.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              {['all', 'present', 'late', 'absent'].map((f) => {
                const count =
                  f === 'all'
                    ? history.length
                    : f === 'present'
                    ? presentCount
                    : f === 'late'
                    ? lateCount
                    : absentCount;

                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                      filter === f
                        ? 'bg-[#0B3324] text-white'
                        : 'text-ink-500 hover:text-ink-900 hover:bg-sand-100'
                    }`}
                  >
                    {f} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Minimal Session Rows */}
        {filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-400">
            {history.length === 0
              ? 'No live roll-call sessions recorded yet for this course.'
              : `No sessions marked as "${filter}".`}
          </div>
        ) : (
          <div className="divide-y divide-sand-200 border-y border-sand-200">
            {filteredHistory.map((session, idx) => {
              const isPresent = session.status === 'present';
              const isLate = session.status === 'late';
              const isAbsent = session.status === 'absent';
              const isPending = isPendingReview(session.id);

              return (
                <div
                  key={session.id || idx}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Date + Topic */}
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-ink-400 font-mono text-[11px] shrink-0 w-24">
                      {formatDate(session.date)}
                    </span>
                    <span className="text-ink-900 font-medium truncate">
                      {session.topic}
                    </span>
                  </div>

                  {/* Right: Status & Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isPresent && (
                      <span className="inline-flex items-center gap-1 text-emerald-800 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Present
                      </span>
                    )}

                    {isLate && (
                      <span className="inline-flex items-center gap-1 text-amber-800 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        Late (0.75)
                      </span>
                    )}

                    {isAbsent && (
                      <span className="inline-flex items-center gap-1 text-rose-700 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        Absent
                      </span>
                    )}

                    {/* Review link for non-present */}
                    {(isLate || isAbsent) && (
                      isPending ? (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Review Pending
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenReview(session)}
                          className="text-[11px] text-primary-700 hover:text-primary-900 underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          Request Review
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. MINIMAL REVIEW MODAL */}
      <AnimatePresence>
        {isReviewModalOpen && selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-sand-200 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading font-bold text-sm text-ink-900">
                    Attendance Review Request
                  </h3>
                  <p className="text-[11px] text-ink-500 pt-0.5">
                    {formatDate(selectedSession.date)} • {selectedSession.topic}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="text-ink-400 hover:text-ink-700 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Explain why you were marked absent or late (e.g. joined via alternate device)..."
                  className="w-full rounded-lg border border-sand-300 p-2.5 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-primary-700 transition-colors resize-none"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-ink-600 hover:text-ink-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold bg-[#0B3324] hover:bg-[#072419] text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0B3324] text-white px-3.5 py-2 rounded-xl text-xs shadow-lg border border-white/10"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
