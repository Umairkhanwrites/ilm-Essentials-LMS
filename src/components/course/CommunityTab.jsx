/**
 * CommunityTab — Interactive Discussion & Q&A section for a course.
 *
 * Core Capabilities:
 *  - Header with total questions and answers count
 *  - Active Persona Switcher: Post/Reply as Student or Verified Instructor
 *  - Ask a Question compose area (toggleable)
 *  - Threaded discussion list with instant inline "Reply" composer
 *  - Verified Instructor Badges & Highlighted scholarly responses
 *  - Real-time Upvotes for questions and replies
 *  - Full Persistence across reloads via courseStorage
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  MessageSquarePlus,
  MessageSquare,
  ThumbsUp,
  Send,
  X,
  Shield,
  CheckCircle,
  Sparkles,
  User,
  GraduationCap,
  CornerDownRight,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  getCourseDiscussions,
  saveCourseDiscussion,
  addDiscussionReply,
} from '../../services/courseStorage';

/** Sort options */
const SORT_OPTIONS = [
  { key: 'recent', label: 'Most Recent' },
  { key: 'upvoted', label: 'Most Upvoted' },
];

/**
 * Format timestamp string to a human-readable relative date
 */
function formatTimestamp(ts) {
  if (!ts) return 'Just now';
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Single reply item
 */
function ReplyItem({ reply }) {
  const [upvotes, setUpvotes] = useState(reply.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const handleUpvote = useCallback(() => {
    setHasUpvoted((prev) => {
      setUpvotes((v) => (prev ? v - 1 : v + 1));
      return !prev;
    });
  }, []);

  return (
    <div
      className={clsx(
        'ml-4 sm:ml-10 pl-4 border-l-2 py-3.5 transition-all',
        reply.isInstructor
          ? 'border-gold-500 bg-gold-50/40 rounded-r-xl pr-4 -mr-2 my-1.5'
          : 'border-sand-200'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={reply.author} src={reply.avatar} size="xs" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-ink-900">
              {reply.author}
            </span>
            {reply.isInstructor ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-900 border border-gold-300">
                <Shield size={10} className="text-gold-700" />
                Verified Instructor
              </span>
            ) : (
              <span className="text-[10px] font-medium text-ink-500 bg-sand-100 px-1.5 py-0.5 rounded">
                Student
              </span>
            )}
            <span className="text-[11px] text-ink-400">
              • {formatTimestamp(reply.timestamp)}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-ink-800 mt-1.5 leading-relaxed whitespace-pre-wrap">
            {reply.content}
          </p>

          {/* Upvote reply */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleUpvote}
              className={clsx(
                'flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer',
                hasUpvoted
                  ? 'text-primary-700'
                  : 'text-ink-400 hover:text-primary-700'
              )}
              aria-label={`Upvote (${upvotes})`}
            >
              <ThumbsUp size={12} className={hasUpvoted ? 'fill-primary-600' : ''} />
              {upvotes} {upvotes === 1 ? 'Upvote' : 'Upvotes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Single discussion thread with Inline Reply composer
 */
function DiscussionThread({
  thread,
  onReplySubmit,
  activePersona,
  currentUserName,
  currentUserAvatar,
}) {
  const [upvotes, setUpvotes] = useState(thread.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleUpvote = useCallback(() => {
    setHasUpvoted((prev) => {
      setUpvotes((v) => (prev ? v - 1 : v + 1));
      return !prev;
    });
  }, []);

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    onReplySubmit(thread.id, {
      id: `reply-${Date.now()}`,
      author: currentUserName,
      avatar: currentUserAvatar,
      isInstructor: activePersona === 'instructor',
      timestamp: new Date().toISOString(),
      content: replyContent.trim(),
      upvotes: 0,
    });

    setReplyContent('');
    setIsReplying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-sand-200 p-5 sm:p-6 shadow-card hover:border-sand-300 transition-all space-y-4"
    >
      {/* Author row */}
      <div className="flex items-start gap-3.5">
        <Avatar name={thread.author} src={thread.avatar} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-ink-900">
              {thread.author}
            </span>
            {thread.isInstructor ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-900 border border-gold-300">
                <Shield size={10} className="text-gold-700" />
                Verified Instructor
              </span>
            ) : (
              <span className="text-[10px] font-medium text-ink-500 bg-sand-100 px-1.5 py-0.5 rounded">
                Student
              </span>
            )}
            <span className="text-xs text-ink-400">
              • {formatTimestamp(thread.timestamp)}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-ink-900 mt-2 leading-relaxed">
            {thread.content}
          </h3>

          {/* Action Row: Upvote & Reply Button */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={handleUpvote}
              className={clsx(
                'flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer',
                hasUpvoted
                  ? 'text-primary-700'
                  : 'text-ink-500 hover:text-primary-700'
              )}
              aria-label={`Upvote (${upvotes})`}
            >
              <ThumbsUp size={13} className={hasUpvoted ? 'fill-primary-600' : ''} />
              {upvotes} {upvotes === 1 ? 'Upvote' : 'Upvotes'}
            </button>

            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1.5 text-xs font-bold text-primary-800 hover:text-primary-950 transition-colors cursor-pointer"
            >
              <MessageSquare size={13} />
              {isReplying ? 'Cancel' : 'Reply to Thread'}
            </button>
          </div>
        </div>
      </div>

      {/* Inline Reply Composer */}
      {isReplying && (
        <form
          onSubmit={handleSendReply}
          className="ml-4 sm:ml-10 p-3.5 rounded-xl bg-sand-50/80 border border-sand-200 space-y-2.5 animate-fadeIn"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-ink-600">
              <CornerDownRight size={13} className="text-primary-700" />
              <span>Replying as <strong className="text-ink-900">{currentUserName}</strong></span>
              {activePersona === 'instructor' && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-gold-100 text-gold-900 border border-gold-300">
                  Instructor Answer
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="text-ink-400 hover:text-ink-600 text-xs"
            >
              Cancel
            </button>
          </div>

          <textarea
            required
            rows={3}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={
              activePersona === 'instructor'
                ? 'Provide an authoritative scholarly response or clarification for the cohort...'
                : 'Write your reply or supplementary note...'
            }
            className="w-full p-2.5 rounded-lg border border-sand-300 bg-white text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-primary-900 hover:bg-primary-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Send size={12} />
              Post Reply
            </button>
          </div>
        </form>
      )}

      {/* Threaded Replies */}
      {thread.replies && thread.replies.length > 0 && (
        <div className="pt-2 border-t border-sand-100 space-y-1">
          {thread.replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Main CommunityTab component
 */
export default function CommunityTab({
  courseId = 'crs_001',
  instructorName = 'Ustadh Khalil Ahmad',
  discussions: propDiscussions = [],
  onAddDiscussion,
}) {
  const { user } = useAuth();

  // Load persistent discussions for this course
  const [courseDiscussions, setCourseDiscussions] = useState(() => {
    return getCourseDiscussions(courseId);
  });

  const [sortBy, setSortBy] = useState('recent');
  const [isComposing, setIsComposing] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

  // Active persona toggle: user can post as student or as course instructor
  const isActuallyInstructor = user?.role === 'instructor';
  const [activePersona, setActivePersona] = useState(() => {
    return isActuallyInstructor ? 'instructor' : 'student';
  });

  const currentUserName = useMemo(() => {
    if (activePersona === 'instructor') {
      return user?.role === 'instructor' ? user.name : instructorName;
    }
    return user?.name || 'Ahmad Raza';
  }, [activePersona, user, instructorName]);

  const currentUserAvatar = useMemo(() => {
    if (activePersona === 'instructor') {
      return (
        user?.avatar ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
      );
    }
    return (
      user?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
    );
  }, [activePersona, user]);

  /** Total post count (threads + replies) */
  const postCount = useMemo(() => {
    return courseDiscussions.reduce(
      (sum, d) => sum + 1 + (d.replies ? d.replies.length : 0),
      0
    );
  }, [courseDiscussions]);

  /** Sorted discussions */
  const sortedDiscussions = useMemo(() => {
    const copy = [...courseDiscussions];
    if (sortBy === 'upvoted') {
      copy.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else {
      copy.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
    return copy;
  }, [courseDiscussions, sortBy]);

  /** Handle new question / topic submission */
  const handleSubmitQuestion = useCallback(() => {
    if (!newQuestion.trim()) return;

    const newThread = {
      id: `thread-${Date.now()}`,
      author: currentUserName,
      avatar: currentUserAvatar,
      isInstructor: activePersona === 'instructor',
      timestamp: new Date().toISOString(),
      content: newQuestion.trim(),
      upvotes: 0,
      replies: [],
    };

    const updated = saveCourseDiscussion(courseId, newThread);
    setCourseDiscussions(updated);

    if (onAddDiscussion) {
      onAddDiscussion(newThread);
    }

    setNewQuestion('');
    setIsComposing(false);
  }, [newQuestion, currentUserName, currentUserAvatar, activePersona, courseId, onAddDiscussion]);

  /** Handle reply submission to a thread */
  const handleReplySubmit = useCallback(
    (threadId, reply) => {
      const updated = addDiscussionReply(courseId, threadId, reply);
      setCourseDiscussions(updated);
    },
    [courseId]
  );

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-sand-200 shadow-xs">
        <div>
          <h2 className="text-xl font-heading font-bold text-ink-900 flex items-center gap-2">
            Course Community &amp; Q&amp;A
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-900">
              {postCount} Contributions
            </span>
          </h2>
          <p className="text-xs text-ink-500 mt-1">
            Engage with course faculty, ask theological questions, and collaborate with your cohort.
          </p>
        </div>

        {/* Persona Switcher & Ask Question Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Persona Pill */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-sand-100 border border-sand-200 text-xs">
            <span className="text-[11px] text-ink-500 pl-2 pr-1 font-medium hidden sm:inline">
              Posting as:
            </span>
            <button
              type="button"
              onClick={() => setActivePersona('student')}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1',
                activePersona === 'student'
                  ? 'bg-white text-ink-900 shadow-xs'
                  : 'text-ink-600 hover:text-ink-900'
              )}
            >
              <User size={12} />
              Student
            </button>
            <button
              type="button"
              onClick={() => setActivePersona('instructor')}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1',
                activePersona === 'instructor'
                  ? 'bg-gold-500 text-primary-950 shadow-xs'
                  : 'text-ink-600 hover:text-ink-900'
              )}
            >
              <GraduationCap size={12} />
              Instructor
            </button>
          </div>

          <Button
            onClick={() => setIsComposing((v) => !v)}
            className="inline-flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <MessageSquarePlus size={15} />
            Ask Question
          </Button>
        </div>
      </div>

      {/* Compose Question Area */}
      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-sand-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-elevated">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary-100 text-primary-900">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-900">
                      Post Question to Cohort &amp; Instructor
                    </h3>
                    <p className="text-[11px] text-ink-500">
                      Posting as <strong className="text-ink-800">{currentUserName}</strong>{' '}
                      ({activePersona === 'instructor' ? 'Verified Faculty' : 'Enrolled Student'})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsComposing(false)}
                  className="p-1 rounded-lg text-ink-400 hover:text-ink-700 transition-colors cursor-pointer"
                  aria-label="Cancel"
                >
                  <X size={18} />
                </button>
              </div>

              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ask your question regarding classical texts, lecture points, or rulings..."
                rows={4}
                className="w-full border border-sand-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none transition-colors outline-none"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-ink-400">
                  Scholarly and respectful academic etiquette is required in all course discussions.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 rounded-xl"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleSubmitQuestion}
                    disabled={!newQuestion.trim()}
                    className={clsx(
                      'inline-flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-xl transition-all cursor-pointer',
                      newQuestion.trim()
                        ? 'bg-primary-900 hover:bg-primary-800 text-white shadow-sm'
                        : 'bg-sand-200 text-ink-400 cursor-not-allowed'
                    )}
                  >
                    <Send size={13} />
                    Post Question
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-500 font-semibold">Filter:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={clsx(
                'text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer',
                sortBy === opt.key
                  ? 'bg-primary-900 text-white'
                  : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-ink-500">
          Showing <strong className="text-ink-800">{sortedDiscussions.length}</strong> active threads
        </span>
      </div>

      {/* Discussion Threads List */}
      <div className="space-y-4">
        {sortedDiscussions.map((thread) => (
          <DiscussionThread
            key={thread.id}
            thread={thread}
            onReplySubmit={handleReplySubmit}
            activePersona={activePersona}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
          />
        ))}
      </div>

      {sortedDiscussions.length === 0 && (
        <div className="bg-white rounded-2xl border border-sand-200 p-12 text-center space-y-3">
          <MessageSquare size={40} className="mx-auto text-ink-300" />
          <h3 className="text-base font-bold text-ink-800">
            No discussions yet in this course
          </h3>
          <p className="text-xs text-ink-500 max-w-sm mx-auto">
            Be the first to ask a question regarding the syllabus, readings, or classical methodology.
          </p>
        </div>
      )}
    </div>
  );
}
