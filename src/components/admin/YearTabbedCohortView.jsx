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
  ExternalLink,
} from 'lucide-react';

/**
 * Format currency in PKR
 */
const formatPKR = (amt) => {
  if (amt === null || amt === undefined) return 'PKR 0';
  return `PKR ${Number(amt).toLocaleString('en-PK')}`;
};

/**
 * Metadata definitions for 3-Year Alimiyyah / Classical Foundations track
 */
const YEAR_METADATA = [
  {
    year: 1,
    title: 'Foundations',
    credential: 'Certificate in Classical Islamic Literacy & Foundations',
    description: 'Core linguistic foundations, scriptural literacy, and legal essentials.',
  },
  {
    year: 2,
    title: 'Intermediate',
    credential: 'Intermediate Diploma in Islamic Sciences & Classical Arabic',
    description: 'Intermediate legal theory, hadith hermeneutics, and contextual jurisprudence.',
  },
  {
    year: 3,
    title: 'Advanced',
    credential: 'Higher Diploma in Textual Hermeneutics & Usūl',
    description: 'Independent research, theological inquiry, and advanced classical mastery.',
  },
];

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
  // Determine configured years or default to 3
  const maxSemesters = Number(pathway?.semesters || 6);
  const totalYears = Math.max(3, Math.ceil(maxSemesters / 2));

  const [activeYear, setActiveYear] = useState(1);

  // Semesters for active academic progression year
  const semA = (activeYear - 1) * 2 + 1; // e.g. Year 1: Sem 1; Year 2: Sem 3; Year 3: Sem 5
  const semB = semA + 1;                 // e.g. Year 1: Sem 2; Year 2: Sem 4; Year 3: Sem 6

  // Year metadata
  const currentYearMeta = YEAR_METADATA[activeYear - 1] || {
    year: activeYear,
    title: `Year ${activeYear}`,
    credential: `Diploma in Islamic Sciences (Year ${activeYear})`,
    description: `Academic curriculum and cohorts for Year ${activeYear}.`,
  };

  // Dual-key fallbacks for Supabase compatibility
  const pathwayId = pathway?.id || pathway?.slug || 'foundations';
  const pathwayName = pathway?.name || pathway?.title || 'Academic Pathway';
  const baseTuitionFee = Number(pathway?.default_tuition_fee ?? pathway?.defaultFee ?? 30000);
  const annualTuition = baseTuitionFee * 2;

  // Filter courses belonging to this pathway
  const pathwayCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.category === pathwayId ||
        c.category === pathway.slug ||
        c.pathway_id === pathwayId ||
        c.pathway_id === pathway.slug
    );
  }, [courses, pathwayId, pathway.slug]);

  // Semester A Courses (Fall)
  const fallCourses = useMemo(() => {
    return pathwayCourses.filter((c) => {
      const s = c.semester;
      if (s === undefined || s === null) return semA === 1;
      const numS = Number(s);
      if (!isNaN(numS)) return numS === semA;
      return (
        String(s).toLowerCase() === `semester ${semA}` ||
        String(s).toLowerCase() === `sem ${semA}` ||
        (semA === 1 && String(s).toLowerCase().includes('semester 1'))
      );
    });
  }, [pathwayCourses, semA]);

  // Semester B Courses (Spring)
  const springCourses = useMemo(() => {
    return pathwayCourses.filter((c) => {
      const s = c.semester;
      if (s === undefined || s === null) return false;
      const numS = Number(s);
      if (!isNaN(numS)) return numS === semB;
      return (
        String(s).toLowerCase() === `semester ${semB}` ||
        String(s).toLowerCase() === `sem ${semB}`
      );
    });
  }, [pathwayCourses, semB]);

  // Filter batches belonging to this pathway
  const pathwayBatches = useMemo(() => {
    return (batches || []).filter(
      (b) =>
        (b.pathway_id === pathwayId || b.pathway_id === pathway.slug) &&
        b.status !== 'archived'
    );
  }, [batches, pathwayId, pathway.slug]);

  // Active Year Cohorts: cohorts currently in semA or semB of this year
  const activeYearCohorts = useMemo(() => {
    return pathwayBatches.filter((b) => {
      const semNum = Number(b.semester ?? b.semesterNumber ?? 1);
      return semNum === semA || semNum === semB;
    });
  }, [pathwayBatches, semA, semB]);

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
              Structured progressive curriculum spanning {totalYears} academic progression years ({maxSemesters} semesters).
            </p>
          </div>
        </div>

        {/* Quick Pathway Actions */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onOpenCreateIntake?.(pathway, semA)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Plus size={13} />
            <span>New Intake</span>
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

      {/* 2. HORIZONTAL YEAR SWITCHER TABS */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 border-b border-sand-200 pb-px overflow-x-auto">
          {Array.from({ length: totalYears }).map((_, idx) => {
            const yr = idx + 1;
            const meta = YEAR_METADATA[idx] || {
              year: yr,
              title: `Year ${yr}`,
            };
            const isActive = activeYear === yr;

            // Cohort count in this year
            const yrSemA = (yr - 1) * 2 + 1;
            const yrSemB = yrSemA + 1;
            const cohortCount = pathwayBatches.filter((b) => {
              const s = Number(b.semester ?? b.semesterNumber ?? 1);
              return s === yrSemA || s === yrSemB;
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
                <GraduationCap
                  size={15}
                  className={isActive ? 'text-primary-800' : 'text-ink-400'}
                />
                <span>
                  Year {yr}: {meta.title}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive
                      ? 'bg-primary-900 text-white'
                      : 'bg-sand-100 text-ink-600'
                  }`}
                >
                  {cohortCount} {cohortCount === 1 ? 'Cohort' : 'Cohorts'}
                </span>
              </button>
            );
          })}
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
                8 Months / 2 Semesters
              </span>
            </div>
            <h4 className="text-sm font-bold text-ink-900 mt-1 truncate">
              {currentYearMeta.credential}
            </h4>
            <p className="text-xs text-ink-500 mt-0.5">
              {currentYearMeta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-sand-200">
          <div className="text-left md:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
              Annual Program Tuition
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

      {/* 4. SIDE-BY-SIDE 2-SEMESTER COURSE GRID (FALL & SPRING) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary-800" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-800">
              Year {activeYear} Course Catalog ({fallCourses.length + springCourses.length} Courses)
            </h4>
          </div>
          <span className="text-[11px] text-ink-500">
            Semesters {semA} & {semB}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FALL SEMESTER (semA) */}
          <div className="rounded-xl border border-sand-200 bg-sand-50/40 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-sand-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-ink-900">
                    Semester {semA} — Fall Term
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-ink-500 bg-white px-2 py-0.5 rounded-full border border-sand-200 shadow-2xs">
                  {fallCourses.length} {fallCourses.length === 1 ? 'Course' : 'Courses'}
                </span>
              </div>

              {/* Course list */}
              <div className="space-y-2">
                {fallCourses.map((crs, idx) => (
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
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        (crs.format || 'online').toLowerCase() === 'onsite'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {crs.format || 'Online'}
                    </span>
                  </div>
                ))}

                {fallCourses.length === 0 && (
                  <div className="p-4 rounded-lg bg-white/70 border border-dashed border-sand-300 text-center text-xs text-ink-400 italic">
                    No courses configured for Semester {semA} yet.
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAddCourse?.(pathway, semA)}
              className="w-full mt-2 py-2 px-3 rounded-lg border border-dashed border-sand-300 hover:border-primary-500 hover:bg-white text-[11px] font-bold text-primary-900 hover:text-primary-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Course to Semester {semA}</span>
            </button>
          </div>

          {/* SPRING SEMESTER (semB) */}
          <div className="rounded-xl border border-sand-200 bg-sand-50/40 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-sand-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-xs font-bold text-ink-900">
                    Semester {semB} — Spring Term
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-ink-500 bg-white px-2 py-0.5 rounded-full border border-sand-200 shadow-2xs">
                  {springCourses.length} {springCourses.length === 1 ? 'Course' : 'Courses'}
                </span>
              </div>

              {/* Course list */}
              <div className="space-y-2">
                {springCourses.map((crs, idx) => (
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
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        (crs.format || 'online').toLowerCase() === 'onsite'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {crs.format || 'Online'}
                    </span>
                  </div>
                ))}

                {springCourses.length === 0 && (
                  <div className="p-4 rounded-lg bg-white/70 border border-dashed border-sand-300 text-center text-xs text-ink-400 italic">
                    No courses configured for Semester {semB} yet.
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAddCourse?.(pathway, semB)}
              className="w-full mt-2 py-2 px-3 rounded-lg border border-dashed border-sand-300 hover:border-primary-500 hover:bg-white text-[11px] font-bold text-primary-900 hover:text-primary-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Course to Semester {semB}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. ACTIVE YEAR COHORTS & PROGRESSION WIZARDS */}
      <div className="space-y-3 pt-3 border-t border-sand-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary-800" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-800">
              Active Year {activeYear} Cohorts ({activeYearCohorts.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onOpenCreateIntake?.(pathway, semA)}
            className="text-xs font-bold text-primary-900 hover:text-primary-950 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>New Batch (Sem {semA})</span>
          </button>
        </div>

        {activeYearCohorts.length === 0 ? (
          <div className="p-5 rounded-xl bg-sand-50/50 border border-dashed border-sand-300 text-center space-y-2">
            <p className="text-xs text-ink-500">
              No active cohort intakes currently running in Year {activeYear} (Semesters {semA} & {semB}).
            </p>
            <button
              type="button"
              onClick={() => onOpenCreateIntake?.(pathway, semA)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Plus size={13} />
              <span>Launch Year {activeYear} Cohort (Semester {semA})</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeYearCohorts.map((b) => {
              const currentSem = Number(b.semester ?? b.semesterNumber ?? semA);
              const isEvenSemester = currentSem % 2 === 0;
              const nextSem = currentSem + 1;
              const targetYear = Math.ceil(nextSem / 2);

              const batchStudents = (students || []).filter(
                (s) => s.cohort_id === b.id || s.cohortId === b.id
              );
              const enrolledCount = batchStudents.length;

              const title = b.name || b.title || 'Cohort Batch';
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
                          Semester {currentSem}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-500 pt-0.5">
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
                      </div>
                    </div>

                    {/* Actions: Advance / Graduate & Delete */}
                    <div className="flex items-center gap-2 self-start sm:self-center pt-2 sm:pt-0">
                      {/* Advance Button with Contextual Labeling */}
                      <button
                        type="button"
                        onClick={() => onAdvanceBatch?.(b, pathway, nextSem)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                          isEvenSemester
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-primary-900 hover:bg-primary-800 text-white'
                        }`}
                      >
                        {isEvenSemester ? (
                          <>
                            <Award size={13} />
                            <span>Graduate Year {activeYear} & Promote to Sem {nextSem} →</span>
                          </>
                        ) : (
                          <>
                            <span>Advance to Semester {nextSem} →</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>

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
                      <span>Year {activeYear} Academic Progression</span>
                      <span>
                        {currentSem === semA ? `Phase 1 of 2 (Semester ${semA})` : `Phase 2 of 2 (Semester ${semB})`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-sand-200 overflow-hidden flex">
                      <div
                        className="h-full bg-primary-800 transition-all duration-300"
                        style={{ width: currentSem === semA ? '50%' : '100%' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
