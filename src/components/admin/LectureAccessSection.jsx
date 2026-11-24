/**
 * LectureAccessSection — Minimalist Admin Command Center for Granular Video Permissions
 *
 * Designed with a clean, unified single-surface layout:
 * - Single header bar with compact Course & Lecture dropdown selectors
 * - Subtle Cohort Actions menu
 * - Clean student roster table without noisy repeated input fields
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Clock,
  Infinity as InfinityIcon,
  RotateCcw,
  Search,
  ChevronDown,
  Filter,
  Check,
  MoreHorizontal,
  X,
} from 'lucide-react';

import {
  getAllCourses,
  getCourseDetailById,
  getAllStudents,
  getAllPathways,
  getLessonAccessOverrides,
  setStudentLessonAccess,
  setBulkLessonAccess,
  getActiveAccessOverridesCount,
  matchesCourseYear,
  getStoredAcademicYears,
} from '../../services/courseStorage';
import {
  useSupabaseAccessOverrides,
  setLessonAccessOverrideSupabase,
} from '../../hooks/useSupabaseData';
import { isSupabaseConfigured } from '../../services/supabase';

/**
 * Minimalist Custom Dropdown
 * Replaces native OS <select> popups with modern, sleek, styled floating menus
 */
function MinimalDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  className = '',
  menuWidth = 'w-60',
  align = 'left',
  title = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef} title={title}>
      <button
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-9 px-3 py-2 text-xs font-semibold rounded-xl border border-sand-200 bg-sand-50/70 hover:bg-sand-100/70 text-ink-800 flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
          isOpen ? 'ring-2 ring-primary-500/15 border-sand-300 bg-white shadow-2xs' : ''
        } ${disabled || options.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate text-left">{displayLabel}</span>
        <ChevronDown
          size={13}
          className={`text-ink-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-ink-700' : ''}`}
        />
      </button>

      {isOpen && !disabled && options.length > 0 && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 ${menuWidth} max-w-[90vw] bg-white rounded-xl shadow-xl border border-sand-200/90 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100`}
        >
          <div className="max-h-64 overflow-y-auto px-1 space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-950 font-semibold'
                      : 'text-ink-700 hover:bg-sand-100/75 hover:text-ink-900 font-medium'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-ink-400 font-normal leading-tight">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={13} className="text-emerald-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LectureAccessSection({ onShowToast, initialAcademicYear = 2026, availableYears = [] }) {
  const allCourses = useMemo(() => getAllCourses(), []);
  const allStudents = useMemo(() => getAllStudents(), []);
  const allPathways = useMemo(() => getAllPathways(), []);

  // Academic Year Filter
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(() => initialAcademicYear || 2026);

  const academicYearsList = useMemo(() => {
    if (Array.isArray(availableYears) && availableYears.length > 0) return availableYears;
    const stored = getStoredAcademicYears();
    const set = new Set(stored);
    set.add(2026);
    set.add(2027);
    (allCourses || []).forEach((c) => {
      const y = c.academic_year || c.year || (c.startDate ? new Date(c.startDate).getFullYear() : null);
      if (y && y >= 2020 && y <= 2035) set.add(Number(y));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availableYears, allCourses]);

  const academicYearOptions = useMemo(() => [
    { value: 'all', label: 'All Years' },
    ...academicYearsList.map((yr) => ({
      value: yr,
      label: String(yr),
    })),
  ], [academicYearsList]);

  // Academic Pathway / Program Filter
  const [selectedPathwayId, setSelectedPathwayId] = useState('all');

  // Filter courses by selected academic year and pathway
  const filteredCourses = useMemo(() => {
    let list = allCourses;
    if (selectedAcademicYear && selectedAcademicYear !== 'all') {
      list = list.filter((course) => matchesCourseYear(course, selectedAcademicYear));
    }
    if (selectedPathwayId && selectedPathwayId !== 'all') {
      const activePathway = allPathways.find((p) => p.id === selectedPathwayId || p.slug === selectedPathwayId);
      list = list.filter((course) => {
        const cat = (course.category || '').toLowerCase();
        const prog = (course.program || '').toLowerCase();
        const sub = (course.subtitle || '').toLowerCase();
        const pathId = (course.pathwayId || '').toLowerCase();
        const targetId = selectedPathwayId.toLowerCase();
        const targetSlug = (activePathway?.slug || selectedPathwayId).toLowerCase();
        const targetName = (activePathway?.name || '').toLowerCase();

        return (
          cat === targetId ||
          cat === targetSlug ||
          pathId === targetId ||
          pathId === targetSlug ||
          (targetName && prog.includes(targetName)) ||
          (targetSlug && sub.includes(targetSlug)) ||
          (targetName && sub.includes(targetName))
        );
      });
    }
    return list;
  }, [allCourses, selectedAcademicYear, selectedPathwayId, allPathways]);

  // Selected Course & Lesson
  const [selectedCourseId, setSelectedCourseId] = useState(allCourses[0]?.id || '');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'granted' | 'locked' | 'overrides'
  const [isCohortMenuOpen, setIsCohortMenuOpen] = useState(false);
  const cohortMenuRef = useRef(null);

  // Auto-switch course if active selection is not in filteredCourses
  useEffect(() => {
    if (filteredCourses.length > 0) {
      const exists = filteredCourses.some((c) => c.id === selectedCourseId);
      if (!exists) {
        setSelectedCourseId(filteredCourses[0].id);
      }
    } else {
      setSelectedCourseId('');
    }
  }, [filteredCourses, selectedCourseId]);

  // Active editing student note modal/popover
  const [editingNoteStudentId, setEditingNoteStudentId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Overrides list for active lesson
  const [lessonOverrides, setLessonOverrides] = useState([]);
  const [totalOverridesCount, setTotalOverridesCount] = useState(0);

  // Live Supabase Overrides Hook
  const { overrides: sbOverrides, overridesMap: sbOverridesMap, refetch: refetchSbOverrides } = useSupabaseAccessOverrides(selectedCourseId);

  useEffect(() => {
    if (Array.isArray(sbOverrides) && sbOverrides.length > 0) {
      setTotalOverridesCount(sbOverrides.length);
    }
  }, [sbOverrides]);

  // Active course details with modules & lessons
  const activeCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return getCourseDetailById(selectedCourseId) || allCourses.find((c) => c.id === selectedCourseId);
  }, [selectedCourseId, allCourses]);

  // Flatten all lessons from active course modules
  const courseLessons = useMemo(() => {
    if (!activeCourse?.modules) return [];
    const list = [];
    activeCourse.modules.forEach((mod) => {
      (mod.lessons || []).forEach((les) => {
        list.push({
          ...les,
          moduleTitle: mod.title,
        });
      });
    });
    return list;
  }, [activeCourse]);

  // Dropdown options
  const pathwayOptions = useMemo(() => [
    { value: 'all', label: 'All Programs' },
    ...allPathways.map((p) => ({ value: p.id, label: p.name })),
  ], [allPathways]);

  const courseOptions = useMemo(() => {
    return filteredCourses.map((c) => ({
      value: c.id,
      label: c.title,
      sublabel: c.semester || (c.category === 'foundations' ? 'Foundations' : 'Intensive'),
    }));
  }, [filteredCourses]);

  const lessonOptions = useMemo(() => {
    return courseLessons.map((les) => ({
      value: les.id,
      label: `${les.lessonNumber ? `Lesson ${les.lessonNumber}: ` : ''}${les.title}`,
      sublabel: les.duration || '45m',
    }));
  }, [courseLessons]);

  // Set default lesson when course changes
  useEffect(() => {
    if (courseLessons.length > 0) {
      const exists = courseLessons.some((l) => l.id === selectedLessonId);
      if (!exists) {
        setSelectedLessonId(courseLessons[0].id);
      }
    } else {
      setSelectedLessonId('');
    }
  }, [courseLessons, selectedLessonId]);

  // Reload overrides when selected lesson changes
  const reloadOverrides = () => {
    if (selectedLessonId) {
      setLessonOverrides(getLessonAccessOverrides(selectedLessonId));
    } else {
      setLessonOverrides([]);
    }
    setTotalOverridesCount(getActiveAccessOverridesCount());
  };

  useEffect(() => {
    reloadOverrides();
  }, [selectedLessonId]);

  useEffect(() => {
    const handleUpdate = () => reloadOverrides();
    window.addEventListener('ilm-lesson-access-updated', handleUpdate);
    return () => window.removeEventListener('ilm-lesson-access-updated', handleUpdate);
  }, [selectedLessonId]);

  // Close cohort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cohortMenuRef.current && !cohortMenuRef.current.contains(e.target)) {
        setIsCohortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLesson = useMemo(() => {
    return courseLessons.find((l) => l.id === selectedLessonId) || courseLessons[0] || null;
  }, [courseLessons, selectedLessonId]);

  // Map of studentId -> override record (merges Supabase live overrides with local cache)
  const overridesMap = useMemo(() => {
    const map = {};
    lessonOverrides.forEach((o) => {
      map[o.studentId] = o;
    });

    if (sbOverridesMap) {
      Object.values(sbOverridesMap).forEach((o) => {
        const matchesLesson =
          !selectedLessonId ||
          o.lesson_id === selectedLessonId ||
          o.lessonTitle === activeLesson?.title;

        if (matchesLesson) {
          const mappedKey = o.student_id;
          map[mappedKey] = {
            id: o.id,
            studentId: o.student_id,
            studentName: o.studentName,
            studentEmail: o.studentEmail,
            lessonId: o.lesson_id,
            status: o.effectiveStatus || o.status,
            expiresAt: o.expires_at,
            durationType: o.expires_at ? '7_days' : 'lifetime',
            reason: o.reason,
          };
        }
      });
    }
    return map;
  }, [lessonOverrides, sbOverridesMap, selectedLessonId, activeLesson]);

  // Filter students based on search and status
  const filteredStudents = useMemo(() => {
    return allStudents.filter((std) => {
      const q = studentSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (std.name || '').toLowerCase().includes(q) ||
        (std.email || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const override = overridesMap[std.id] || overridesMap[std.email?.toLowerCase()];
      const status = override?.status || 'default';

      if (statusFilter === 'granted') return status === 'granted';
      if (statusFilter === 'locked') return status === 'locked';
      if (statusFilter === 'overrides') return status === 'granted' || status === 'locked';

      return true;
    });
  }, [allStudents, studentSearchQuery, overridesMap, statusFilter]);

  // Handle single student access change (direct Supabase sync)
  const handleAccessChange = async (student, newStatus, durationType = '7_days', customReason = '') => {
    if (!activeLesson || !activeCourse) return;

    if (isSupabaseConfigured) {
      try {
        await setLessonAccessOverrideSupabase({
          studentId: student.id,
          studentEmail: student.email,
          courseId: activeCourse.id,
          lessonId: activeLesson.id,
          lessonTitle: activeLesson.title,
          status: newStatus,
          durationType,
          reason: customReason,
          adminName: 'Administrator',
        });
        if (refetchSbOverrides) await refetchSbOverrides();
      } catch (sbErr) {
        console.warn('Supabase access override notice:', sbErr);
      }
    }

    await setStudentLessonAccess({
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      courseId: activeCourse.id,
      courseTitle: activeCourse.title,
      lessonId: activeLesson.id,
      lessonTitle: activeLesson.title,
      status: newStatus,
      durationType,
      reason: customReason,
      adminName: 'Administrator',
    });

    reloadOverrides();

    if (onShowToast) {
      if (newStatus === 'granted') {
        const durLabel = durationType === '7_days' ? '7-Day' : 'Lifetime';
        onShowToast(`Granted ${durLabel} access to ${student.name}`);
      } else if (newStatus === 'locked') {
        onShowToast(`Locked video for ${student.name} (Silent)`);
      } else {
        onShowToast(`Reset ${student.name} to default`);
      }
    }
  };

  // Bulk actions for all visible students (direct Supabase sync)
  const handleBulkAction = async (newStatus, durationType = '7_days', reason = '') => {
    if (!activeLesson || !activeCourse || filteredStudents.length === 0) return;
    setIsCohortMenuOpen(false);

    if (isSupabaseConfigured) {
      try {
        for (const std of filteredStudents) {
          await setLessonAccessOverrideSupabase({
            studentId: std.id,
            studentEmail: std.email,
            courseId: activeCourse.id,
            lessonId: activeLesson.id,
            lessonTitle: activeLesson.title,
            status: newStatus,
            durationType,
            reason,
            adminName: 'Administrator',
          });
        }
        if (refetchSbOverrides) await refetchSbOverrides();
      } catch (sbErr) {
        console.warn('Supabase bulk access override notice:', sbErr);
      }
    }

    await setBulkLessonAccess({
      students: filteredStudents,
      courseId: activeCourse.id,
      courseTitle: activeCourse.title,
      lessonId: activeLesson.id,
      lessonTitle: activeLesson.title,
      status: newStatus,
      durationType,
      reason,
      adminName: 'Administrator',
    });

    reloadOverrides();

    if (onShowToast) {
      if (newStatus === 'granted') {
        const durLabel = durationType === '7_days' ? '7-Day' : 'Lifetime';
        onShowToast(`Bulk granted ${durLabel} access to ${filteredStudents.length} students`);
      } else if (newStatus === 'locked') {
        onShowToast(`Bulk locked video for ${filteredStudents.length} students (Silent)`);
      } else {
        onShowToast(`Reset access for ${filteredStudents.length} students`);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-sand-200 shadow-xs overflow-hidden">
      {/* ── 1. Top Header & Unified Controls ── */}
      <div className="p-5 border-b border-sand-200 space-y-4">
        {/* Title & Active Override Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
              <span>Lecture Access</span>
              {totalOverridesCount > 0 && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {totalOverridesCount} overrides
                </span>
              )}
            </h2>
            <p className="text-xs text-ink-400">
              Grant temporary or lifetime access, or enforce custom lesson lockouts.
            </p>
          </div>
        </div>

        {/* Unified Selectors & Cohort Action Menu in a Single Row */}
        <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto no-scrollbar pt-1">
          {/* Academic Year Dropdown */}
          <MinimalDropdown
            value={selectedAcademicYear}
            onChange={setSelectedAcademicYear}
            options={academicYearOptions}
            placeholder="Academic Year"
            className="w-28 shrink-0"
            menuWidth="w-36"
            title="Filter by Academic Year"
          />

          {/* Academic Pathway / Program Dropdown */}
          <MinimalDropdown
            value={selectedPathwayId}
            onChange={setSelectedPathwayId}
            options={pathwayOptions}
            placeholder="All Programs"
            className="w-36 shrink-0"
            menuWidth="w-52"
            title="Filter by Academic Pathway / Program"
          />

          {/* Course Dropdown */}
          <MinimalDropdown
            value={selectedCourseId}
            onChange={setSelectedCourseId}
            options={courseOptions}
            placeholder={selectedAcademicYear !== 'all' ? `No courses for ${selectedAcademicYear}` : 'No courses'}
            disabled={courseOptions.length === 0}
            className="w-44 shrink-0"
            menuWidth="w-64"
            title="Select Enrolled Course"
          />

          {/* Lesson Dropdown */}
          <MinimalDropdown
            value={selectedLessonId}
            onChange={setSelectedLessonId}
            options={lessonOptions}
            placeholder="No lessons"
            disabled={lessonOptions.length === 0}
            className="flex-1 min-w-[220px] max-w-[360px]"
            menuWidth="w-80"
            title="Select Target Lecture / Video"
          />

          {/* Cohort Actions Dropdown */}
          <div className="relative shrink-0" ref={cohortMenuRef}>
            <button
              type="button"
              onClick={() => setIsCohortMenuOpen((prev) => !prev)}
              className={`h-9 px-3 py-2 text-xs font-semibold rounded-xl border border-sand-200 bg-sand-50/70 hover:bg-sand-100/70 text-ink-800 flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                isCohortMenuOpen ? 'ring-2 ring-primary-500/15 border-sand-300 bg-white shadow-2xs' : ''
              }`}
            >
              <span>Cohort Actions</span>
              <ChevronDown size={12} className={`text-ink-400 transition-transform duration-150 ${isCohortMenuOpen ? 'rotate-180 text-ink-700' : ''}`} />
            </button>

              {isCohortMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-sand-200/90 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleBulkAction('granted', '7_days');
                      setIsCohortMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-emerald-900 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <Clock size={13} className="text-emerald-700" />
                    <span>Grant All (7 Days)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleBulkAction('granted', 'lifetime');
                      setIsCohortMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-sand-50 text-ink-800 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <InfinityIcon size={13} className="text-primary-700" />
                    <span>Grant All (Lifetime)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleBulkAction('locked', 'lifetime', 'Restricted by administrator');
                      setIsCohortMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-800 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <Lock size={13} className="text-red-700" />
                    <span>Lock All (Silent)</span>
                  </button>

                  <div className="my-1 border-t border-sand-100" />

                  <button
                    type="button"
                    onClick={() => {
                      handleBulkAction('default');
                      setIsCohortMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-sand-50 text-ink-600 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <RotateCcw size={13} />
                    <span>Reset All to Default</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        {/* ── 2. Filter & Search Strip ── */}
        <div className="mt-4 pt-3 border-t border-sand-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-sand-50/50 border border-sand-200 text-xs text-ink-800 placeholder-ink-400 focus:outline-none focus:bg-white focus:border-sand-400"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: `All (${allStudents.length})` },
              { id: 'granted', label: 'Granted' },
              { id: 'locked', label: 'Locked' },
              { id: 'overrides', label: 'Custom' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-ink-900 text-white'
                    : 'text-ink-600 hover:bg-sand-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Minimal Roster Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-sand-50/60 border-b border-sand-200 text-[11px] font-semibold text-ink-500 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-5">Student</th>
              <th className="py-2.5 px-4">Program</th>
              <th className="py-2.5 px-4 text-center">Permission</th>
              <th className="py-2.5 px-4">Duration & Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((std) => {
                const override = overridesMap[std.id];
                const currentStatus = override?.status || 'default';
                const isGranted = currentStatus === 'granted';
                const isLocked = currentStatus === 'locked';
                const durationType = override?.durationType || '7_days';
                const isEditingNote = editingNoteStudentId === std.id;

                return (
                  <tr key={std.id} className="hover:bg-sand-50/40 transition-colors">
                    {/* Student Info */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-sand-100 text-ink-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                          {(std.name || 'S')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900 leading-tight">{std.name}</p>
                          <p className="text-[11px] text-ink-400">{std.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Program */}
                    <td className="py-3 px-4 text-ink-500 text-[11px]">
                      {std.program || 'Ilm Foundations'}
                    </td>

                    {/* 3-State Minimal Segmented Toggle */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex rounded-lg p-0.5 bg-sand-100/80 border border-sand-200">
                        <button
                          type="button"
                          onClick={() => handleAccessChange(std, 'default')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                            currentStatus === 'default'
                              ? 'bg-white text-ink-900 shadow-2xs font-semibold'
                              : 'text-ink-500 hover:text-ink-800'
                          }`}
                        >
                          Default
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAccessChange(std, 'granted', durationType, override?.reason || '')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                            isGranted
                              ? 'bg-[#0B3324] text-white shadow-2xs font-semibold'
                              : 'text-ink-500 hover:text-emerald-800'
                          }`}
                        >
                          <Unlock size={10} />
                          <span>Grant</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAccessChange(std, 'locked', null, override?.reason || '')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                            isLocked
                              ? 'bg-rose-800 text-white shadow-2xs font-semibold'
                              : 'text-ink-500 hover:text-rose-700'
                          }`}
                        >
                          <Lock size={10} />
                          <span>Lock</span>
                        </button>
                      </div>
                    </td>

                    {/* Duration & Reason (Clean inline presentation) */}
                    <td className="py-3 px-4">
                      {isGranted ? (
                        <div className="flex items-center gap-2">
                          {/* Minimal Duration Toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              const nextDur = durationType === '7_days' ? 'lifetime' : '7_days';
                              handleAccessChange(std, 'granted', nextDur, override?.reason || '');
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                              durationType === '7_days'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-sand-50 text-ink-700 border-sand-200'
                            }`}
                            title="Click to toggle between 7 Days and Lifetime access"
                          >
                            {durationType === '7_days' ? '7 Days' : 'Lifetime'}
                          </button>

                          {durationType === '7_days' && override?.expiryDateFormatted && (
                            <span className="text-[11px] text-ink-400">
                              (until {override.expiryDateFormatted})
                            </span>
                          )}

                          {override?.reason && (
                            <span className="text-[11px] text-ink-400 truncate max-w-[150px]" title={override.reason}>
                              • {override.reason}
                            </span>
                          )}
                        </div>
                      ) : isLocked ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            Locked
                          </span>

                          {isEditingNote ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                autoFocus
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAccessChange(std, 'locked', null, noteDraft);
                                    setEditingNoteStudentId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingNoteStudentId(null);
                                  }
                                }}
                                className="px-2 py-0.5 rounded border border-sand-300 text-[11px] w-36 bg-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  handleAccessChange(std, 'locked', null, noteDraft);
                                  setEditingNoteStudentId(null);
                                }}
                                className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
                              >
                                <Check size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteStudentId(std.id);
                                setNoteDraft(override?.reason || '');
                              }}
                              className="text-[11px] text-ink-400 hover:text-ink-700 truncate max-w-[180px] cursor-pointer"
                              title="Click to edit reason"
                            >
                              {override?.reason ? `• ${override.reason}` : '+ Add reason note'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-ink-300">Sequential</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="py-8 text-center text-ink-400 text-xs">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
