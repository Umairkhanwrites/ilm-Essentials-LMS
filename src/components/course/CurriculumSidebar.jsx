/**
 * CurriculumSidebar — Collapsible sidebar listing course modules & lessons.
 *
 * Desktop: 350px sidebar that can collapse.
 * Mobile:  Full-screen slide-out drawer.
 *
 * Features:
 *  - Accordion modules with smooth expand/collapse (framer-motion)
 *  - Lesson icons by type (video, reading, assessment)
 *  - Completion checkmarks, current-lesson highlighting
 *  - Mini progress summary at top
 *
 * @param {Array}    modules          - courseDetail.modules
 * @param {number}   totalLessons     - Total lesson count
 * @param {number}   completedLessons - Completed lesson count
 * @param {number}   progress         - Percentage 0-100
 * @param {string}   activeLessonId   - Currently selected lesson id
 * @param {function} onLessonSelect   - Callback when a lesson is clicked
 * @param {boolean}  isCollapsed      - Whether sidebar is collapsed (desktop)
 * @param {function} onToggle         - Toggle collapse state
 * @param {boolean}  isMobileOpen     - Whether mobile drawer is open
 * @param {function} onMobileClose    - Close mobile drawer
 *
 * TODO: Persist expand/collapse state in localStorage
 * TODO: Connect completion status to backend
 */
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  ChevronDown,
  ChevronRight,
  Play,
  BookOpen,
  FileCheck,
  CheckCircle2,
  Circle,
  X,
  PanelLeftClose,
  PanelLeft,
  GraduationCap,
} from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';

/** Map lesson type → icon */
const LESSON_TYPE_ICONS = {
  video: Play,
  reading: BookOpen,
  assessment: FileCheck,
};

/**
 * Single Module Accordion
 */
function ModuleAccordion({
  module,
  index,
  activeLessonId,
  onLessonSelect,
  expandedMap,
  toggleExpand,
}) {
  const isExpanded = expandedMap[module.id] ?? module.expanded ?? false;
  const completedCount = module.lessons.filter((l) => l.completed).length;
  const totalCount = module.lessons.length;
  const allComplete = completedCount === totalCount;

  return (
    <div className="border-b border-sand-200 last:border-b-0">
      {/* Module header */}
      <button
        onClick={() => toggleExpand(module.id)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3.5 text-left
                   hover:bg-sand-100 transition-colors cursor-pointer group"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <motion.span
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 text-ink-400"
          >
            <ChevronDown size={16} />
          </motion.span>
          <span className="text-sm font-semibold text-ink-800 truncate">
            Module {index + 1}: {module.title}
          </span>
        </div>
        <span
          className={clsx(
            'flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full',
            allComplete
              ? 'bg-primary-100 text-primary-700'
              : 'bg-sand-200 text-ink-500'
          )}
        >
          {completedCount}/{totalCount}
          {allComplete && ' ✓'}
        </span>
      </button>

      {/* Lesson list */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key={module.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <ul className="pb-2">
              {module.lessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                const Icon = LESSON_TYPE_ICONS[lesson.type] || Play;

                return (
                  <li key={lesson.id}>
                    <button
                      onClick={() => onLessonSelect(lesson)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 pl-10 py-2.5 text-left transition-colors cursor-pointer',
                        isActive
                          ? 'bg-primary-50 border-l-3 border-primary-500'
                          : 'hover:bg-sand-50 border-l-3 border-transparent'
                      )}
                    >
                      {/* Type icon */}
                      <Icon
                        size={15}
                        className={clsx(
                          'flex-shrink-0',
                          isActive ? 'text-primary-600' : 'text-ink-400'
                        )}
                      />

                      {/* Title + duration */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={clsx(
                            'text-sm truncate',
                            isActive
                              ? 'font-semibold text-primary-800'
                              : 'text-ink-700'
                          )}
                        >
                          {lesson.title}
                        </p>
                        <p className="text-xs text-ink-400 mt-0.5">
                          {lesson.duration}
                        </p>
                      </div>

                      {/* Completion */}
                      {lesson.completed ? (
                        <CheckCircle2
                          size={18}
                          className="flex-shrink-0 text-primary-500"
                        />
                      ) : (
                        <Circle
                          size={18}
                          className="flex-shrink-0 text-ink-300"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Main CurriculumSidebar
 */
export default function CurriculumSidebar({
  modules = [],
  totalLessons = 0,
  completedLessons = 0,
  progress = 0,
  activeLessonId,
  onLessonSelect,
  isCollapsed = false,
  onToggle,
  isMobileOpen = false,
  onMobileClose,
}) {
  /* Track which modules are expanded */
  const [expandedMap, setExpandedMap] = useState(() => {
    const map = {};
    modules.forEach((mod) => {
      map[mod.id] = mod.expanded ?? false;
    });
    return map;
  });

  const toggleExpand = useCallback((moduleId) => {
    setExpandedMap((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }, []);

  /** Sidebar inner content */
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sand-200">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} className="text-primary-600" />
          <h2 className="text-base font-heading font-bold text-ink-800">
            Course Curriculum
          </h2>
        </div>

        {/* Collapse / close buttons */}
        <div className="flex items-center gap-1">
          {/* Desktop collapse */}
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sand-100 transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={18} className="text-ink-500" />
          </button>
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sand-100 transition-colors cursor-pointer"
            aria-label="Close curriculum"
          >
            <X size={18} className="text-ink-500" />
          </button>
        </div>
      </div>

      {/* ---- Progress summary ---- */}
      <div className="px-4 py-3 border-b border-sand-200 space-y-2">
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span className="font-semibold">
            {completedLessons}/{totalLessons} Lessons
          </span>
          <span className="font-bold text-primary-600">{progress}% Complete</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* ---- Module list (scrollable) ---- */}
      <div className="flex-1 overflow-y-auto">
        {modules.map((mod, idx) => (
          <ModuleAccordion
            key={mod.id}
            module={mod}
            index={idx}
            activeLessonId={activeLessonId}
            onLessonSelect={onLessonSelect}
            expandedMap={expandedMap}
            toggleExpand={toggleExpand}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* ====== Desktop Sidebar ====== */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 0 : 350, opacity: isCollapsed ? 0 : 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block flex-shrink-0 bg-white border border-sand-200 rounded-2xl shadow-card overflow-hidden sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col"
        aria-label="Course curriculum sidebar"
      >
        <div className="w-[350px] h-full flex flex-col overflow-hidden">{sidebarContent}</div>
      </motion.aside>

      {/* Collapsed toggle button (desktop) */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                     bg-white border border-sand-200 shadow-card
                     hover:bg-sand-50 text-ink-700 text-xs font-semibold transition-colors cursor-pointer
                     sticky top-24 z-20 shrink-0"
          aria-label="Expand sidebar"
        >
          <PanelLeft size={16} className="text-primary-700" />
          Show Curriculum
        </button>
      )}

      {/* ====== Mobile Drawer ====== */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.div
              key="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="lg:hidden fixed inset-y-0 left-0 w-full max-w-sm z-50 bg-white shadow-elevated"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
