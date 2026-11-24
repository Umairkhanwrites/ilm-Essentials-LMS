import React, { useState, useMemo } from 'react';
import {
  Compass,
  Calendar,
  GraduationCap,
  Plus,
  ArrowRight,
  BookOpen,
  Users,
  Award,
  DollarSign,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Edit3,
  AlertCircle,
  Video,
  MapPin,
} from 'lucide-react';

/**
 * Format currency in PKR
 */
const formatPKR = (amt) => {
  if (amt === null || amt === undefined) return 'PKR 0';
  return `PKR ${Number(amt).toLocaleString('en-PK')}`;
};

export default function YearTabbedCohortView({
  pathway,
  courses = [],
  batches = [],
  students = [],
  instructors = [],
  onAdvanceBatch,
  onOpenCreateIntake,
  onDeleteBatch,
  onAddCourse,
  onEditPathway,
  onDeletePathway,
}) {
  // Dual-key fallbacks for Supabase compatibility
  const pathwayId = pathway?.id || pathway?.slug || 'foundations';
  const pathwayName = pathway?.name || pathway?.title || 'Academic Pathway';
  const baseTuitionFee = Number(pathway?.default_tuition_fee ?? pathway?.defaultFee ?? 30000);
  const annualTuition = baseTuitionFee * 2;

  // Filter batches belonging to this pathway
  const pathwayBatches = useMemo(() => {
    return (batches || []).filter(
      (b) =>
        (b.pathway_id === pathwayId || b.pathway_id === pathway.slug) &&
        b.status !== 'archived'
    );
  }, [batches, pathwayId, pathway.slug]);

  // Extract distinct calendar intake years (e.g. 2026, 2027)
  const currentCalendarYear = new Date().getFullYear();
  const availableYears = useMemo(() => {
    const yearsSet = new Set([2026, 2027]);
    pathwayBatches.forEach((b) => {
      const d = b.start_date || b.startDate;
      if (d) {
        const y = new Date(d).getFullYear();
        if (!isNaN(y) && y >= 2020 && y <= 2035) yearsSet.add(y);
      }
      const titleMatch = (b.name || b.title || '').match(/\b(202\d)\b/);
      if (titleMatch) {
        yearsSet.add(Number(titleMatch[1]));
      }
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [pathwayBatches]);

  const [activeYear, setActiveYear] = useState(currentCalendarYear);

  // Filter batches of the active calendar year (they perform individually)
  const activeYearBatches = useMemo(() => {
    return pathwayBatches.filter((b) => {
      const d = b.start_date || b.startDate;
      if (d) {
        const y = new Date(d).getFullYear();
        if (y === activeYear) return true;
      }
      const titleMatch = (b.name || b.title || '').match(/\b(202\d)\b/);
      if (titleMatch) {
        return Number(titleMatch[1]) === activeYear;
      }
      // If batch has no date or year in title, assign to currentCalendarYear by default
      if (activeYear === currentCalendarYear) return true;
      return false;
    });
  }, [pathwayBatches, activeYear, currentCalendarYear]);

  // Pathway Courses: Semester 1 (Fall) & Semester 2 (Spring)
  const pathwayCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.category === pathwayId ||
        c.category === pathway.slug ||
        c.pathway_id === pathwayId ||
        c.pathway_id === pathway.slug
    );
  }, [courses, pathwayId, pathway.slug]);

  const sem1Courses = useMemo(() => {
    return pathwayCourses.filter((c) => {
      const s = c.semester;
      if (s === undefined || s === null) return true;
      const numS = Number(s);
      if (!isNaN(numS)) return numS === 1;
      return (
        String(s).toLowerCase() === 'semester 1' ||
        String(s).toLowerCase() === 'sem 1' ||
        String(s).toLowerCase().includes('semester 1')
      );
    });
  }, [pathwayCourses]);

  const sem2Courses = useMemo(() => {
    return pathwayCourses.filter((c) => {
      const s = c.semester;
      if (s === undefined || s === null) return false;
      const numS = Number(s);
      if (!isNaN(numS)) return numS === 2;
      return (
        String(s).toLowerCase() === 'semester 2' ||
        String(s).toLowerCase() === 'sem 2' ||
        String(s).toLowerCase().includes('semester 2')
      );
    });
  }, [pathwayCourses]);

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
      {/* 1. PATHWAY HEADER & METADATA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-100">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-primary-50 border border-primary-200/80 flex items-center justify-center text-primary-900 shrink-0 shadow-2xs">
            <Compass size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-ink-900 text-lg sm:text-xl tracking-tight">
                {pathwayName}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-sand-100 text-ink-700 text-[10px] font-bold uppercase tracking-wider">
                Multi-Year Cohort Model
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              Annual intake cohort progression model • Active Intake Cycle: <strong>{activeYear}</strong> (2 Semesters per Academic Year).
            </p>
          </div>
        </div>

        {/* Quick Pathway Actions */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onOpenCreateIntake?.(pathway, 1, activeYear)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Plus size={13} />
            <span>New {activeYear} Intake</span>
          </button>
          {onEditPathway && (
            <button
              type="button"
              onClick={() => onEditPathway(pathway)}
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-800 hover:bg-sand-100 transition-colors cursor-pointer"
              title="Edit pathway"
            >
              <Edit3 size={15} />
            </button>
          )}
          {onDeletePathway && (
            <button
              type="button"
              onClick={() => onDeletePathway(pathwayId, pathwayName)}
              className="p-1.5 rounded-lg text-ink-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Delete pathway"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. CALENDAR YEAR SWITCHER TABS (e.g. 2026, 2027) */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 border-b border-sand-200 pb-px overflow-x-auto">
          {availableYears.map((yr) => {
            const isActive = activeYear === yr;

            // Batch count in this specific year
            const yearCount = pathwayBatches.filter((b) => {
              const d = b.start_date || b.startDate;
              if (d && new Date(d).getFullYear() === yr) return true;
              const titleMatch = (b.name || b.title || '').match(/\b(202\d)\b/);
              if (titleMatch && Number(titleMatch[1]) === yr) return true;
              if (!d && !titleMatch && yr === currentCalendarYear) return true;
              return false;
            }).length;

            return (
              <button
                key={yr}
                type="button"
                onClick={() => setActiveYear(yr)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-primary-900 text-primary-950 bg-primary-50/50 rounded-t-xl'
                    : 'border-transparent text-ink-500 hover:text-ink-800 hover:border-sand-300'
                }`}
              >
                <Calendar
                  size={15}
                  className={isActive ? 'text-primary-800' : 'text-ink-400'}
                />
                <span>
                  {yr} Academic Cohorts
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive
                      ? 'bg-primary-900 text-white'
                      : 'bg-sand-100 text-ink-600'
                  }`}
                >
                  {yearCount} {yearCount === 1 ? 'Batch' : 'Batches'}
                </span>
              </button>
            );
          })}

          {/* Quick Add Upcoming Year Tab */}
          {!availableYears.includes(currentCalendarYear + 2) && (
            <button
              type="button"
              onClick={() => setActiveYear(currentCalendarYear + 2)}
              className="px-3 py-2 text-xs font-semibold text-ink-400 hover:text-primary-900 flex items-center gap-1 transition-colors cursor-pointer"
              title={`View or plan ${currentCalendarYear + 2}`}
            >
              <Plus size={12} />
              <span>{currentCalendarYear + 2}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. EXIT CREDENTIAL & ANNUAL TUITION SUMMARY STRIP */}
      <div className="p-4 rounded-xl bg-sand-50/70 border border-sand-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-white border border-sand-200 text-primary-900 shrink-0 shadow-2xs">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-950 bg-primary-100/60 px-2 py-0.5 rounded-full">
                Exit Credential & Milestones
              </span>
              <span className="text-xs text-ink-500 font-medium">
                8 Months / 2 Semesters per Academic Year
              </span>
            </div>
            <h4 className="text-sm font-bold text-ink-900 mt-1 truncate">
              Certificate in Classical Islamic Literacy & Foundations ({activeYear} Intake Cycle)
            </h4>
            <p className="text-xs text-ink-500 mt-0.5">
              Individual batch tracking for students admitted in the {activeYear} academic calendar year.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-sand-200">
          <div className="text-left md:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
              Annual Program Tuition ({activeYear})
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-heading font-bold text-ink-900">
                {formatPKR(annualTuition)}
              </span>
              <span className="text-[11px] text-ink-500 font-medium">/ year</span>
            </div>
            <span className="text-[10px] text-ink-400">
              ({formatPKR(baseTuitionFee)} billed per semester)
            </span>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE YEAR BATCHES (Batches of each year perform individually) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary-800" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-800">
              {activeYear} Batches & Cohort Progressions ({activeYearBatches.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onOpenCreateIntake?.(pathway, 1, activeYear)}
            className="text-xs font-bold text-primary-900 hover:text-primary-950 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Launch {activeYear} Batch</span>
          </button>
        </div>

        {activeYearBatches.length === 0 ? (
          <div className="p-6 rounded-xl bg-sand-50/50 border border-dashed border-sand-300 text-center space-y-2.5">
            <p className="text-xs text-ink-600 font-medium">
              No active batches scheduled for Academic Year <strong>{activeYear}</strong> yet.
            </p>
            <p className="text-[11px] text-ink-400 max-w-md mx-auto">
              Batches launched for {activeYear} will perform and advance through their Fall & Spring semesters independently from other academic years.
            </p>
            <button
              type="button"
              onClick={() => onOpenCreateIntake?.(pathway, 1, activeYear)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer mt-1"
            >
              <Plus size={14} />
              <span>Launch {activeYear} Intake (Semester 1)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeYearBatches.map((b) => {
              const currentSem = Number(b.semester ?? b.semesterNumber ?? 1);
              const isSemester1 = currentSem === 1;

              const batchStudents = (students || []).filter(
                (s) => s.cohort_id === b.id || s.cohortId === b.id
              );
              const enrolledCount = batchStudents.length;

              const title = b.name || b.title || `Batch (${activeYear})`;
              const startDate = b.start_date || b.startDate || '';
              const endDate = b.end_date || b.endDate || '';

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-sand-200 bg-sand-50/40 hover:bg-sand-50/80 transition-all space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-ink-900">{title}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            b.status === 'enrolling'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : b.status === 'active'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-sand-100 text-ink-600 border border-sand-200'
                          }`}
                        >
                          {b.status || 'Active'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100/70 text-primary-950 border border-primary-200/60">
                          Semester {currentSem} {currentSem === 1 ? '— Fall' : '— Spring'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-500 pt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-primary-800" />
                          <strong>{enrolledCount}</strong> Students Enrolled
                        </span>
                        {startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-ink-400" />
                            {new Date(startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            –{' '}
                            {endDate
                              ? new Date(endDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Ongoing'}
                          </span>
                        )}
                        {b.tuition_fee && (
                          <span>
                            • <strong>{formatPKR(b.tuition_fee)}</strong> / sem
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions: Advance Semester & Delete */}
                    <div className="flex items-center gap-2 self-start sm:self-center pt-2 sm:pt-0">
                      {isSemester1 ? (
                        <button
                          type="button"
                          onClick={() => onAdvanceBatch?.(b, pathway, 2)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-900 hover:bg-primary-800 text-white transition-all shadow-2xs cursor-pointer"
                        >
                          <span>Advance to Semester 2 (Spring) →</span>
                          <ArrowRight size={13} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAdvanceBatch?.(b, pathway, 3)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-2xs cursor-pointer"
                        >
                          <Award size={13} />
                          <span>Graduate {activeYear} Cohort 🎓</span>
                        </button>
                      )}

                      {onDeleteBatch && (
                        <button
                          type="button"
                          onClick={() => onDeleteBatch(b.id, title)}
                          className="p-1.5 rounded-lg text-ink-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete intake batch"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visual Progression Progress Bar for the 2-Semester Year */}
                  <div className="pt-2 border-t border-sand-200/60">
                    <div className="flex items-center justify-between text-[10px] font-bold text-ink-600 mb-1">
                      <span>{activeYear} Academic Progression</span>
                      <span>
                        {currentSem === 1 ? 'Phase 1 of 2 (Semester 1 Fall)' : 'Phase 2 of 2 (Semester 2 Spring)'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-sand-200 overflow-hidden flex">
                      <div
                        className="h-full bg-primary-800 transition-all duration-300"
                        style={{ width: currentSem === 1 ? '50%' : '100%' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. SIDE-BY-SIDE 2-SEMESTER COURSE GRID (FALL & SPRING) */}
      <div className="space-y-3 pt-3 border-t border-sand-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary-800" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-800">
              Curriculum Structure ({sem1Courses.length + sem2Courses.length} Courses across 2 Semesters)
            </h4>
          </div>
          <span className="text-[11px] text-ink-500 font-medium">
            Fall & Spring Syllabi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FALL SEMESTER (Semester 1) */}
          <div className="rounded-xl border border-sand-200 bg-sand-50/40 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-sand-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-ink-900">
                    Semester 1 — Fall Term
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-ink-500 bg-white px-2 py-0.5 rounded-full border border-sand-200 shadow-2xs">
                  {sem1Courses.length} {sem1Courses.length === 1 ? 'Course' : 'Courses'}
                </span>
              </div>

              {/* Course list */}
              <div className="space-y-2">
                {sem1Courses.map((crs, idx) => (
                  <div
                    key={crs.id}
                    className="p-2.5 rounded-lg bg-white border border-sand-200 shadow-2xs flex items-center justify-between gap-2 hover:border-sand-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-sand-100 text-primary-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink-900 truncate" title={crs.title}>
                          {crs.title}
                        </p>
                        <p className="text-[10px] text-ink-500 truncate">
                          {crs.instructor || crs.instructor_name || 'Assigned Faculty Lead'}
                        </p>
                      </div>
                    </div>
                    {(crs.format || 'online').toLowerCase() === 'onsite' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 shrink-0">
                        <MapPin size={10} className="text-amber-700" />
                        <span>Onsite</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                        <Video size={10} className="text-emerald-700" />
                        <span>Online</span>
                      </span>
                    )}
                  </div>
                ))}

                {sem1Courses.length === 0 && (
                  <div className="p-4 rounded-lg bg-white/70 border border-dashed border-sand-300 text-center text-xs text-ink-400 italic">
                    No courses configured for Semester 1 yet.
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAddCourse?.(pathway, 1)}
              className="w-full mt-2 py-2 px-3 rounded-lg border border-dashed border-sand-300 hover:border-primary-500 hover:bg-white text-[11px] font-bold text-primary-900 hover:text-primary-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Course to Semester 1</span>
            </button>
          </div>

          {/* SPRING SEMESTER (Semester 2) */}
          <div className="rounded-xl border border-sand-200 bg-sand-50/40 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-sand-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-xs font-bold text-ink-900">
                    Semester 2 — Spring Term
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-ink-500 bg-white px-2 py-0.5 rounded-full border border-sand-200 shadow-2xs">
                  {sem2Courses.length} {sem2Courses.length === 1 ? 'Course' : 'Courses'}
                </span>
              </div>

              {/* Course list or balanced empty prompt */}
              <div className="space-y-2">
                {sem2Courses.map((crs, idx) => (
                  <div
                    key={crs.id}
                    className="p-2.5 rounded-lg bg-white border border-sand-200 shadow-2xs flex items-center justify-between gap-2 hover:border-sand-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-sand-100 text-primary-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink-900 truncate" title={crs.title}>
                          {crs.title}
                        </p>
                        <p className="text-[10px] text-ink-500 truncate">
                          {crs.instructor || crs.instructor_name || 'Assigned Faculty Lead'}
                        </p>
                      </div>
                    </div>
                    {(crs.format || 'online').toLowerCase() === 'onsite' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 shrink-0">
                        <MapPin size={10} className="text-amber-700" />
                        <span>Onsite</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                        <Video size={10} className="text-emerald-700" />
                        <span>Online</span>
                      </span>
                    )}
                  </div>
                ))}

                {sem2Courses.length === 0 && (
                  <div className="p-6 rounded-lg bg-white/70 border border-dashed border-sand-300 text-center space-y-1">
                    <p className="text-xs font-semibold text-ink-600">
                      Spring Term Curriculum Pending
                    </p>
                    <p className="text-[11px] text-ink-400">
                      Semester 2 courses can be populated prior to Spring batch promotions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAddCourse?.(pathway, 2)}
              className="w-full mt-2 py-2 px-3 rounded-lg border border-dashed border-sand-300 hover:border-primary-500 hover:bg-white text-[11px] font-bold text-primary-900 hover:text-primary-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Course to Semester 2</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
