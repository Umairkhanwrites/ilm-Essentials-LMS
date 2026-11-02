/**
 * CommunityTab — Discussion & Q&A section for a course.
 *
 * Features:
 *  - Header with post count
 *  - "Ask a Question" compose area (toggleable)
 *  - Threaded discussion list with nested replies
 *  - Sort by "Most Recent" or "Most Upvoted"
 *  - Instructor badges & highlighted replies
 *  - Upvote buttons
 *
 * @param {Array} discussions - courseDetail.discussions array
 *
 * TODO: Integrate with backend discussion API (POST / GET / PATCH)
 * TODO: Add real user authentication for posting
 * TODO: Add pagination / infinite scroll
 */
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  MessageSquarePlus,
  ThumbsUp,
  Send,
  X,
  ChevronDown,
  Shield,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

/** Sort options */
const SORT_OPTIONS = [
  { key: 'recent', label: 'Most Recent' },
  { key: 'upvoted', label: 'Most Upvoted' },
];

/**
 * Format a timestamp string to a human-readable relative or absolute date.
 */
function formatTimestamp(ts) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
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
  const [upvotes, setUpvotes] = useState(reply.upvotes);
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
        'ml-6 sm:ml-10 pl-4 border-l-2 py-3',
        reply.isInstructor
          ? 'border-primary-300 bg-primary-50/60 rounded-r-lg -mr-2 pr-3'
          : 'border-sand-200'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={reply.author} src={reply.avatar} size="xs" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink-800">
              {reply.author}
            </span>
            {reply.isInstructor && (
              <Badge className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                <Shield size={10} />
                Instructor
              </Badge>
            )}
            <span className="text-xs text-ink-400">
              {formatTimestamp(reply.timestamp)}
            </span>
          </div>
          <p className="text-sm text-ink-700 mt-1 leading-relaxed">
            {reply.content}
          </p>
          {/* Upvote */}
          <button
            onClick={handleUpvote}
            className={clsx(
              'flex items-center gap-1 mt-2 text-xs font-medium transition-colors cursor-pointer',
              hasUpvoted
                ? 'text-primary-600'
                : 'text-ink-400 hover:text-primary-600'
            )}
            aria-label={`Upvote (${upvotes})`}
          >
            <ThumbsUp size={13} className={hasUpvoted ? 'fill-primary-600' : ''} />
            {upvotes}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Single discussion thread
 */
function DiscussionThread({ thread }) {
  const [upvotes, setUpvotes] = useState(thread.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const handleUpvote = useCallback(() => {
    setHasUpvoted((prev) => {
      setUpvotes((v) => (prev ? v - 1 : v + 1));
      return !prev;
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-sand-200 p-4 sm:p-5 shadow-card"
    >
      {/* Author row */}
      <div className="flex items-start gap-3">
        <Avatar name={thread.author} src={thread.avatar} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink-800">
              {thread.author}
            </span>
            {thread.isInstructor && (
              <Badge className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                <Shield size={10} />
                Instructor
              </Badge>
            )}
            <span className="text-xs text-ink-400">
              {formatTimestamp(thread.timestamp)}
            </span>
          </div>
          <p className="text-sm text-ink-700 mt-2 leading-relaxed">
            {thread.content}
          </p>

          {/* Upvote */}
          <button
            onClick={handleUpvote}
            className={clsx(
              'flex items-center gap-1.5 mt-3 text-xs font-medium transition-colors cursor-pointer',
              hasUpvoted
                ? 'text-primary-600'
                : 'text-ink-400 hover:text-primary-600'
            )}
            aria-label={`Upvote (${upvotes})`}
          >
            <ThumbsUp size={14} className={hasUpvoted ? 'fill-primary-600' : ''} />
            {upvotes}
          </button>
        </div>
      </div>

      {/* Replies */}
      {thread.replies && thread.replies.length > 0 && (
        <div className="mt-4 space-y-1">
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
export default function CommunityTab({ discussions: propDiscussions = [], onAddDiscussion }) {
  const { user } = useAuth();
  const [localDiscussions, setLocalDiscussions] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [isComposing, setIsComposing] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

  // Combined list of prop discussions and any locally created ones
  const discussions = useMemo(() => {
    // Avoid duplicates if onAddDiscussion modified propDiscussions
    const combined = [...localDiscussions, ...propDiscussions];
    const seen = new Set();
    return combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [localDiscussions, propDiscussions]);

  /** Compute total post count (threads + replies) */
  const postCount = useMemo(() => {
    return discussions.reduce(
      (sum, d) => sum + 1 + (d.replies ? d.replies.length : 0),
      0
    );
  }, [discussions]);

  /** Sorted discussions */
  const sortedDiscussions = useMemo(() => {
    const copy = [...discussions];
    if (sortBy === 'upvoted') {
      copy.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      copy.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
    return copy;
  }, [discussions, sortBy]);

  /** Handle post submission */
  const handleSubmit = useCallback(() => {
    if (!newQuestion.trim()) return;

    const newThread = {
      id: `thread-${Date.now()}`,
      author: user?.name || 'Ahmad Raza',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      timestamp: new Date().toISOString(),
      content: newQuestion.trim(),
      upvotes: 0,
      replies: [],
    };

    if (onAddDiscussion) {
      onAddDiscussion(newThread);
    } else {
      setLocalDiscussions((prev) => [newThread, ...prev]);
    }

    setNewQuestion('');
    setIsComposing(false);
  }, [newQuestion, user, onAddDiscussion]);

  return (
    <div className="space-y-6">
      {/* ---- Header row ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold text-ink-900">
            Discussion &amp; Q&amp;A
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            {postCount} post{postCount !== 1 && 's'} in this course
          </p>
        </div>

        <Button
          onClick={() => setIsComposing((v) => !v)}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white
                     text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <MessageSquarePlus size={16} />
          Ask a Question
        </Button>
      </div>

      {/* ---- Compose area ---- */}
      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-sand-200 rounded-xl p-4 space-y-3 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-800">
                  Ask your question
                </h3>
                <button
                  onClick={() => setIsComposing(false)}
                  className="text-ink-400 hover:text-ink-600 transition-colors cursor-pointer"
                  aria-label="Cancel"
                >
                  <X size={18} />
                </button>
              </div>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Type your question here…"
                rows={4}
                className="w-full border border-sand-200 rounded-lg px-3 py-2.5 text-sm text-ink-800
                           placeholder:text-ink-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100
                           resize-none transition-colors outline-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!newQuestion.trim()}
                  className={clsx(
                    'inline-flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer',
                    newQuestion.trim()
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-sand-200 text-ink-400 cursor-not-allowed'
                  )}
                >
                  <Send size={14} />
                  Post Question
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Sort options ---- */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-500 font-medium">Sort by:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={clsx(
              'text-xs font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer',
              sortBy === opt.key
                ? 'bg-primary-100 text-primary-700'
                : 'bg-sand-100 text-ink-500 hover:bg-sand-200'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ---- Discussion threads ---- */}
      <div className="space-y-4">
        {sortedDiscussions.map((thread) => (
          <DiscussionThread key={thread.id} thread={thread} />
        ))}
      </div>

      {discussions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquarePlus size={48} className="text-ink-300 mb-4" />
          <h3 className="text-lg font-heading font-semibold text-ink-700 mb-1">
            No discussions yet
          </h3>
          <p className="text-sm text-ink-500 max-w-xs">
            Be the first to ask a question or start a discussion.
          </p>
        </div>
      )}
    </div>
  );
}
