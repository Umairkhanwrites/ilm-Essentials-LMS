import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  Calendar,
  DollarSign,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Layers,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { generateBatchSlug } from '../../utils/slugify';

/**
 * Format currency in PKR
 */
const formatPKR = (amt) => {
  if (amt === null || amt === undefined) return 'Rs. 0';
  return `Rs. ${Number(amt).toLocaleString('en-PK')}`;
};

export default function IntakeModal({
  isOpen,
  onClose,
  initialPathway = null, // pathway object or slug (null if opened from global toolbar)
  defaultSemester = 1,
  defaultYear = null,
  mode = 'create', // 'create' | 'advance'
  advancingBatch = null, // batch object if mode === 'advance'
  pathways = [],
  courses = [],
  instructors = [],
  existingBatches = [],
  students = [],
  onSaveIntake, // async (intakeData) => { success, error }
  onSubmit, // alias for onSaveIntake
  onAdvanceSemester, // async (advanceData) => { success, error }
}) {
  if (!isOpen) return null;

  // Selected Pathway ID
  const [selectedPathwayId, setSelectedPathwayId] = useState(() => {
    if (advancingBatch?.pathway_id) return advancingBatch.pathway_id;
    if (initialPathway?.id) return initialPathway.id;
    if (initialPathway?.slug) return initialPathway.slug;
    return pathways[0]?.id || pathways[0]?.slug || 'foundations';
  });

  // Active pathway resolution
  const activePathway = useMemo(() => {
    return (
      pathways.find((p) => p.id === selectedPathwayId || p.slug === selectedPathwayId) || {
        id: selectedPathwayId,
        name: selectedPathwayId === 'foundations' ? 'Ilm Foundations' : 'Ilm Intensives',
        type: selectedPathwayId === 'foundations' ? 'cohort' : 'modular',
        model: selectedPathwayId === 'foundations' ? 'cohort' : 'modular',
        semesters: selectedPathwayId === 'foundations' ? 2 : 1,
        default_tuition_fee: selectedPathwayId === 'foundations' ? 30000 : 12000,
      }
    );
  }, [pathways, selectedPathwayId]);

  // Model locking: Cohort vs Modular derived strictly from activePathway
  const isCohortModel =
    activePathway.type === 'cohort' ||
    activePathway.model === 'cohort' ||
    activePathway.programStructure === 'multi_semester';

  // Courses belonging to active pathway
  const pathwayCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.category === activePathway.slug ||
        c.category === activePathway.id ||
        c.pathway_id === activePathway.slug ||
        c.pathway_id === activePathway.id
    );
  }, [courses, activePathway]);

  // ==========================================
  // FORM STATE
  // ==========================================
  const [batchNumber, setBatchNumber] = useState(1);
  const [startingSemester, setStartingSemester] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isTitleEdited, setIsTitleEdited] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [showAdvancedKey, setShowAdvancedKey] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tuitionFee, setTuitionFee] = useState('');
  const [status, setStatus] = useState('active');
  const [courseInstructors, setCourseInstructors] = useState({});

  // ==========================================
  // ADVANCE MODE STATE & ELIGIBILITY GATE
  // ==========================================
  const [targetSemester, setTargetSemester] = useState(() => {
    if (advancingBatch) return (advancingBatch.semester || 1) + 1;
    return 2;
  });
  const [autoEnrollStudents, setAutoEnrollStudents] = useState(true);
  const [issueInvoice, setIssueInvoice] = useState(true);
  const [eligibilityFilter, setEligibilityFilter] = useState('eligible_only');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Target semester courses for advance mode
  const targetSemesterCourses = useMemo(() => {
    return pathwayCourses.filter((c) => {
      const s = c.semester;
      if (s === undefined || s === null) return false;
      const numS = Number(s);
      if (!isNaN(numS)) return numS === Number(targetSemester);
      return (
        String(s).toLowerCase() === `semester ${targetSemester}` ||
        String(s).toLowerCase() === `sem ${targetSemester}`
      );
    });
  }, [pathwayCourses, targetSemester]);

  // Starting semester courses for cohort mode faculty assignment
  const startingSemesterCourses = useMemo(() => {
    return pathwayCourses.filter((c) => {
      const s = c.semester;
      if (s === undefined || s === null) return Number(startingSemester) === 1;
      const numS = Number(s);
      if (!isNaN(numS)) return numS === Number(startingSemester);
      return (
        String(s).toLowerCase() === `semester ${startingSemester}` ||
        String(s).toLowerCase() === `sem ${startingSemester}` ||
        (Number(startingSemester) === 1 && String(s).toLowerCase().includes('semester 1'))
      );
    });
  }, [pathwayCourses, startingSemester]);

  // Target semester zero courses check & Year-End milestone detection
  const hasZeroTargetCourses = mode === 'advance' && targetSemesterCourses.length === 0;
  const isYearEndMilestone =
    mode === 'advance' && Number(targetSemester) % 2 === 1 && Number(targetSemester) > 1;
  const fromYear = Math.floor(Number(targetSemester) / 2);
  const toYear = Math.ceil(Number(targetSemester) / 2);

  // Students in originating batch
  const advancingBatchStudents = useMemo(() => {
    if (!advancingBatch) return [];
    return students.filter((s) => s.cohort_id === advancingBatch.id);
  }, [students, advancingBatch]);

  // Student Eligibility Assessment (Fees Cleared & Active Status)
  const { eligibleStudents, ineligibleStudents } = useMemo(() => {
    if (!advancingBatchStudents || advancingBatchStudents.length === 0) {
      return { eligibleStudents: [], ineligibleStudents: [] };
    }
    const eligible = [];
    const ineligible = [];

    advancingBatchStudents.forEach((st) => {
      const feeClean = (st.fee_status || st.feeStatus || '').toLowerCase();
      const isFeePaid = feeClean === 'paid' || feeClean === 'waived';
      const isStatusActive = (st.status || 'active').toLowerCase() === 'active';

      if (isFeePaid && isStatusActive) {
        eligible.push(st);
      } else {
        ineligible.push(st);
      }
    });

    return { eligibleStudents: eligible, ineligibleStudents: ineligible };
  }, [advancingBatchStudents]);

  // ==========================================
  // SYNC ON OPEN OR PATHWAY CHANGE
  // ==========================================
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsTitleEdited(false);
    setIsSlugEdited(false);
    setShowAdvancedKey(false);

    if (mode === 'advance' && advancingBatch) {
      const nextSem = (advancingBatch.semester || 1) + 1;
      setTargetSemester(nextSem);
      const groupName = advancingBatch.cohort_group || advancingBatch.id.replace(/_sem\d+$/, '');
      const groupDisplay = groupName.replace(/_/g, ' ').toUpperCase();
      const autoAdvTitle = `${activePathway.name} — ${groupDisplay} (Semester ${nextSem})`;
      const autoAdvSlug = `${groupName}_sem${nextSem}`;

      setCustomTitle(autoAdvTitle);
      setCustomSlug(autoAdvSlug);
      setTuitionFee(advancingBatch.tuition_fee ? String(advancingBatch.tuition_fee) : '30000');

      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      setEndDate(sixMonths.toISOString().split('T')[0]);
    } else {
      // Create Mode: Initialize according to activePathway model
      if (initialPathway?.id) {
        setSelectedPathwayId(initialPathway.id);
      } else if (initialPathway?.slug) {
        setSelectedPathwayId(initialPathway.slug);
      }

      const targetYear = defaultYear ? Number(defaultYear) : new Date().getFullYear();
      const isCurrentYear = targetYear === new Date().getFullYear();
      const today = new Date().toISOString().split('T')[0];
      const initialStart = isCurrentYear ? today : `${targetYear}-08-15`;
      setStartDate(initialStart);

      if (isCohortModel) {
        // Calculate next batch number for this cohort pathway in this target year
        const existingForPathway = existingBatches.filter(
          (b) =>
            (b.pathway_id === activePathway.id || b.pathway_id === activePathway.slug) &&
            ((b.start_date && new Date(b.start_date).getFullYear() === targetYear) ||
              (b.name || '').includes(String(targetYear)))
        );
        const nextNum = Math.max(existingForPathway.length + 1, 1);
        setBatchNumber(nextNum);
        setStartingSemester(Number(defaultSemester) || 1);
        setTuitionFee(
          activePathway.default_tuition_fee
            ? String(activePathway.default_tuition_fee)
            : '30000'
        );

        const endCal = new Date(initialStart);
        endCal.setMonth(endCal.getMonth() + 6);
        setEndDate(endCal.toISOString().split('T')[0]);
      } else {
        // Modular Model
        if (pathwayCourses.length > 0) {
          const firstCrs = pathwayCourses[0];
          setSelectedCourseId(firstCrs.id);
          setSelectedInstructorId(firstCrs.instructor_id || '');
          setTuitionFee(
            firstCrs.tuition_fee
              ? String(firstCrs.tuition_fee)
              : String(activePathway.default_tuition_fee || 12000)
          );
        } else {
          setSelectedCourseId('');
          setSelectedInstructorId('');
          setTuitionFee(String(activePathway.default_tuition_fee || 12000));
        }

        const twoMonths = new Date();
        twoMonths.setMonth(twoMonths.getMonth() + 2);
        setEndDate(twoMonths.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, mode, advancingBatch, activePathway, isCohortModel, initialPathway, defaultSemester, defaultYear]);

  // Synchronize faculty leads whenever startingSemester courses change in cohort mode
  useEffect(() => {
    if (!isCohortModel) return;
    const instMap = {};
    startingSemesterCourses.forEach((c) => {
      if (c.instructor_id) instMap[c.id] = c.instructor_id;
    });
    setCourseInstructors((prev) => ({ ...instMap, ...prev }));
  }, [isCohortModel, startingSemesterCourses]);

  // Selected course object in modular mode
  const activeCourse = useMemo(() => {
    return pathwayCourses.find((c) => c.id === selectedCourseId) || null;
  }, [pathwayCourses, selectedCourseId]);

  // Auto-calculated human-readable title (zero cross-pathway string leaking)
  const autoTitle = useMemo(() => {
    if (mode === 'advance') return customTitle;
    const year = startDate
      ? new Date(startDate).getFullYear()
      : defaultYear || new Date().getFullYear();

    if (isCohortModel) {
      return `${activePathway.name} — ${year} Batch ${batchNumber} (Semester ${startingSemester})`;
    }
    return activeCourse
      ? `${activeCourse.title} — Intake ${year}`
      : `${activePathway.name} — Intake ${year}`;
  }, [mode, customTitle, startDate, defaultYear, isCohortModel, activePathway, batchNumber, startingSemester, activeCourse]);

  // Auto-slug: Formats as ${pathwayId}_${year}_b${batchNumber}_sem${startingSemester} for cohorts
  const autoCohortSlug = useMemo(() => {
    const pathwayKey = activePathway.id || activePathway.slug || 'foundations';
    const year = startDate
      ? new Date(startDate).getFullYear()
      : defaultYear || new Date().getFullYear();
    return generateBatchSlug(`${pathwayKey}_${year}_b${batchNumber}_sem${startingSemester}`);
  }, [activePathway, startDate, defaultYear, batchNumber, startingSemester]);

  const resolvedTitle = isTitleEdited ? customTitle : autoTitle;
  const resolvedSlug = isSlugEdited
    ? customSlug
    : isCohortModel && mode !== 'advance'
    ? autoCohortSlug
    : generateBatchSlug(resolvedTitle);

  // Requirement 2: Check for modular pathways with 0 courses
  const isModularEmpty = !isCohortModel && pathwayCourses.length === 0 && mode !== 'advance';

  // Handle course dropdown change in modular mode
  const handleCourseSelectChange = (crsId) => {
    setSelectedCourseId(crsId);
    const crs = pathwayCourses.find((c) => c.id === crsId);
    if (crs) {
      setSelectedInstructorId(crs.instructor_id || '');
      if (crs.tuition_fee) {
        setTuitionFee(String(crs.tuition_fee));
      }
    }
  };

  // ==========================================
  // SUBMIT HANDLER
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (isModularEmpty) {
      setErrorMessage('Cannot create an intake for a modular pathway without courses.');
      return;
    }

    if (hasZeroTargetCourses) {
      setErrorMessage(
        `Cannot advance: No courses have been configured for Semester ${targetSemester} in this pathway. Please add courses to Semester ${targetSemester} before initiating promotion.`
      );
      return;
    }

    if (!resolvedTitle.trim()) {
      setErrorMessage('Intake Title is required.');
      return;
    }

    if (!resolvedSlug.trim()) {
      setErrorMessage('A valid database identifier is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. ADVANCE MODE BRANCH (Preserves Student Eligibility Gate)
      if (mode === 'advance') {
        if (!onAdvanceSemester) throw new Error('Advance semester handler is not configured.');

        const selectedStudentIds =
          autoEnrollStudents && eligibilityFilter === 'eligible_only' && eligibleStudents.length > 0
            ? eligibleStudents.map((s) => s.id)
            : null;

        const result = await onAdvanceSemester({
          fromBatchId: advancingBatch.id,
          cohortGroup: advancingBatch.cohort_group || advancingBatch.id,
          targetSemester,
          newBatchId: resolvedSlug,
          newBatchName: resolvedTitle.trim(),
          startDate,
          endDate,
          tuitionFee: tuitionFee ? Number(tuitionFee) : null,
          status,
          autoEnrollStudents,
          issueInvoice,
          studentIds: selectedStudentIds,
        });

        if (!result.success) throw new Error(result.error || 'Failed to advance batch semester.');

        setSuccessMessage(`Successfully advanced ${result.enrolledCount || 0} students to ${resolvedTitle}!`);
        setTimeout(() => {
          onClose();
        }, 1200);
        return;
      }

      // 2. CREATE MODE BRANCH (Model-locked: Cohort vs Modular)
      const saveHandler = onSaveIntake || onSubmit;
      if (!saveHandler) throw new Error('Save intake handler is not configured.');

      const intakePayload = {
        id: resolvedSlug,
        pathway_id: activePathway.id || selectedPathwayId,
        name: resolvedTitle.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        tuition_fee: tuitionFee ? Number(tuitionFee) : null,
        status,
      };

      if (isCohortModel) {
        const year = startDate
          ? new Date(startDate).getFullYear()
          : defaultYear || new Date().getFullYear();
        const cleanGroup = generateBatchSlug(`${activePathway.id || activePathway.slug}_${year}_b${batchNumber}`);
        intakePayload.cohort_group = cleanGroup;
        intakePayload.semester = startingSemester;
        intakePayload.course_id = null;

        const instOverrides = Object.entries(courseInstructors)
          .filter(([_, instId]) => Boolean(instId))
          .map(([crsId, instId]) => ({
            course_id: crsId,
            instructor_id: instId,
          }));
        intakePayload.instructors = instOverrides;
      } else {
        // Modular Single Course Track
        if (!selectedCourseId) {
          throw new Error('Please select an active course for this modular intake.');
        }
        intakePayload.cohort_group = resolvedSlug;
        intakePayload.semester = 1;
        intakePayload.course_id = selectedCourseId;
        intakePayload.instructor_id = selectedInstructorId || null;
      }

      const result = await saveHandler(intakePayload);
      if (!result.success) throw new Error(result.error || 'Failed to create intake.');

      setSuccessMessage(`Intake "${resolvedTitle}" created successfully!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Intake modal error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-sand-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-sand-200 bg-sand-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              {mode === 'advance' ? (
                <ArrowRight size={20} />
              ) : isCohortModel ? (
                <GraduationCap size={20} />
              ) : (
                <BookOpen size={20} />
              )}
            </div>
            <div>
              <span className="inline-block rounded-full bg-sand-200/70 px-2.5 py-0.5 text-[10px] font-bold text-ink-700 uppercase tracking-wider mb-1">
                {mode === 'advance'
                  ? 'Semester Rollover Wizard'
                  : isCohortModel
                  ? 'Bundled Cohort Track'
                  : 'Modular Single-Course Track'}
              </span>
              <h2 className="text-lg font-heading font-bold text-ink-900 tracking-tight">
                {mode === 'advance'
                  ? `Advance Batch to Semester ${targetSemester}`
                  : `Create New Intake — ${activePathway.name}`}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 font-medium">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. ADVANCE MODE BRANCH (Student Eligibility Gate)        */}
          {/* ======================================================== */}
          {mode === 'advance' && advancingBatch && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary-50/80 border border-primary-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-950">
                    Originating Cohort
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-primary-950 font-bold text-[10px] border border-primary-200 shadow-2xs">
                    Semester {advancingBatch.semester || 1}
                  </span>
                </div>
                <p className="text-sm font-bold text-ink-900">{advancingBatch.name}</p>
                <div className="flex items-center gap-4 text-xs text-ink-600">
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-primary-700" />
                    <span>
                      <strong>{advancingBatchStudents.length}</strong> enrolled students
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-primary-700" />
                    <span>
                      <strong>{targetSemesterCourses.length}</strong> courses in Semester {targetSemester}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requirement: Zero-Course Target Guard */}
              {hasZeroTargetCourses && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                    <span>Cannot Advance: Zero Courses Configured</span>
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed">
                    Cannot advance: No courses have been configured for Semester {targetSemester} in this pathway. Please add courses to Semester {targetSemester} before initiating promotion.
                  </p>
                </div>
              )}

              {/* Requirement: Year-End Milestone Notice on Odd Target Semesters (e.g. Sem 2 -> 3, Sem 4 -> 5) */}
              {isYearEndMilestone && (
                <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <GraduationCap size={16} className="text-amber-700 shrink-0" />
                    <span>Year-End Academic Milestone (Year {fromYear} → Year {toYear})</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Promoting from <strong>Year {fromYear}</strong> to <strong>Year {toYear}</strong>. Unchecked students will remain enrolled in their completed Year {fromYear} cohort with full transcript integrity and will not be marked as dropouts or billed for Year {toYear}.
                  </p>
                </div>
              )}

              {/* Student Eligibility Gate Breakdown */}
              <div className="p-4 rounded-xl border border-sand-200 bg-sand-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-emerald-700" />
                    <span>Academic & Fee Eligibility Gate</span>
                  </span>
                  <span className="text-[11px] font-medium text-ink-500">
                    {eligibleStudents.length} of {advancingBatchStudents.length} Eligible
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <span className="text-emerald-900 font-medium">Fees Cleared</span>
                    <strong className="text-emerald-950 font-bold">{eligibleStudents.length}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <span className="text-amber-900 font-medium">Unpaid Defaulters</span>
                    <strong className="text-amber-950 font-bold">{ineligibleStudents.length}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-800">
                    <input
                      type="radio"
                      name="eligibility_option"
                      value="eligible_only"
                      checked={eligibilityFilter === 'eligible_only'}
                      onChange={() => setEligibilityFilter('eligible_only')}
                      className="accent-primary-900"
                    />
                    <span>
                      Promote <strong>Eligible Students Only</strong> ({eligibleStudents.length} students)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-800">
                    <input
                      type="radio"
                      name="eligibility_option"
                      value="all"
                      checked={eligibilityFilter === 'all'}
                      onChange={() => setEligibilityFilter('all')}
                      className="accent-primary-900"
                    />
                    <span>
                      Promote <strong>All Students</strong> ({advancingBatchStudents.length} students regardless of balance)
                    </span>
                  </label>
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-sand-200 bg-white">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-800">
                  <input
                    type="checkbox"
                    checked={autoEnrollStudents}
                    onChange={(e) => setAutoEnrollStudents(e.target.checked)}
                    className="rounded accent-primary-900"
                  />
                  <span>Auto-enroll students in Sem {targetSemester} courses</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-800">
                  <input
                    type="checkbox"
                    checked={issueInvoice}
                    onChange={(e) => setIssueInvoice(e.target.checked)}
                    className="rounded accent-primary-900"
                  />
                  <span>Issue Semester {targetSemester} tuition invoice</span>
                </label>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. CREATE MODE BRANCH (Model-locked: Cohort vs Modular)   */}
          {/* ======================================================== */}
          {mode !== 'advance' && (
            <div className="space-y-4">
              {/* Pathway Selector: Only shown when launched globally without initialPathway */}
              {!initialPathway && (
                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1.5">
                    Academic Pathway
                  </label>
                  <select
                    value={selectedPathwayId}
                    onChange={(e) => setSelectedPathwayId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    {pathways.map((p) => (
                      <option key={p.id || p.slug} value={p.id || p.slug}>
                        {p.name} ({p.type === 'cohort' ? 'Bundled Cohort' : 'Modular Masterclasses'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Requirement 2: Handle Modular Pathways with 0 Courses */}
              {isModularEmpty ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    <span>No Courses Available in this Pathway</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This modular pathway currently has no assigned courses. A modular intake requires an active course to launch. Please create or assign a course to this pathway first before creating an intake.
                  </p>
                </div>
              ) : isCohortModel ? (
                /* BUNDLED COHORT FIELDS */
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-sand-50/60 border border-sand-200">
                    <div>
                      <label className="block text-xs font-bold text-ink-800 mb-1.5">
                        Batch Series Number
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-800 mb-1.5">
                        Starting Semester
                      </label>
                      <select
                        value={startingSemester}
                        onChange={(e) => setStartingSemester(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        {Array.from({ length: Math.max(Number(activePathway.semesters || 6), 6) }).map((_, idx) => {
                          const s = idx + 1;
                          const yr = Math.ceil(s / 2);
                          let label = `Semester ${s} — Year ${yr}`;
                          if (s === 1) label = `Semester 1 — Year 1 Entry`;
                          else if (s === 3) label = `Semester 3 — Year 2 Lateral Entry`;
                          else if (s === 5) label = `Semester 5 — Year 3 Entry`;
                          else label = `Semester ${s} — Year ${yr} Mid-Year`;
                          return (
                            <option key={s} value={s}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Requirement: Faculty Override List Filtered to startingSemester */}
                  <div className="p-3.5 rounded-xl bg-sand-50/60 border border-sand-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-ink-800">
                        Semester {startingSemester} Faculty Assignments ({startingSemesterCourses.length} {startingSemesterCourses.length === 1 ? 'Course' : 'Courses'})
                      </label>
                      <span className="text-[10px] text-ink-500 font-medium">
                        Customize instructor per course
                      </span>
                    </div>

                    {startingSemesterCourses.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {startingSemesterCourses.map((crs) => (
                          <div
                            key={crs.id}
                            className="p-2.5 rounded-lg bg-white border border-sand-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <span className="text-xs font-semibold text-ink-900 truncate" title={crs.title}>
                              {crs.title}
                            </span>
                            <select
                              value={courseInstructors[crs.id] || ''}
                              onChange={(e) =>
                                setCourseInstructors((prev) => ({
                                  ...prev,
                                  [crs.id]: e.target.value,
                                }))
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-sand-300 text-xs bg-white text-ink-900 focus:outline-none focus:ring-1 focus:ring-primary-500 shrink-0 w-full sm:w-52"
                            >
                              <option value="">-- Use Course Default --</option>
                              {instructors.map((inst) => (
                                <option key={inst.id} value={inst.id}>
                                  {inst.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-ink-400 italic py-1">
                        No courses configured for Semester {startingSemester} yet.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* MODULAR SINGLE-COURSE FIELDS */
                <div className="space-y-3 p-3.5 rounded-xl bg-sand-50/60 border border-sand-200">
                  <div>
                    <label className="block text-xs font-bold text-ink-800 mb-1.5">
                      Select Masterclass Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => handleCourseSelectChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      {pathwayCourses.map((crs) => (
                        <option key={crs.id} value={crs.id}>
                          {crs.title} {crs.tuition_fee ? `— PKR ${Number(crs.tuition_fee).toLocaleString()}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-800 mb-1.5">
                      Intake Faculty Lead
                    </label>
                    <select
                      value={selectedInstructorId}
                      onChange={(e) => setSelectedInstructorId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="">-- Use Course Default Instructor --</option>
                      {instructors.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.title})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-ink-500 mt-1">
                      Overrides the curriculum default instructor specifically for this batch.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* COMMON INTAKE SPECIFICATIONS                             */}
          {/* ======================================================== */}
          {!isModularEmpty && (
            <div className="space-y-3 pt-1 border-t border-sand-200">
              {/* Human-readable Title */}
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1.5">
                  Intake Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resolvedTitle}
                  onChange={(e) => {
                    setCustomTitle(e.target.value);
                    setIsTitleEdited(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>

              {/* Dates & Tuition Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1.5">Tuition Fee (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(e.target.value)}
                    placeholder="30000"
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {/* Collapsed Database Identifier */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedKey((prev) => !prev)}
                  className="text-[11px] font-bold text-primary-900 hover:text-primary-950 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="text-[10px]">{showAdvancedKey ? '▼' : '▶'}</span>
                  <span>Advanced: Database Identifier ({resolvedSlug || 'auto'})</span>
                </button>
                {showAdvancedKey && (
                  <div className="mt-1.5">
                    <input
                      type="text"
                      value={resolvedSlug}
                      onChange={(e) => {
                        setCustomSlug(generateBatchSlug(e.target.value));
                        setIsSlugEdited(true);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-sand-300 bg-sand-50/70 font-mono text-xs text-ink-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <p className="text-[10px] text-ink-400 mt-0.5">
                      Unique database primary key for Supabase batch tables.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-sand-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isModularEmpty || hasZeroTargetCourses}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
                isModularEmpty || hasZeroTargetCourses
                  ? 'bg-sand-300 text-ink-400 cursor-not-allowed'
                  : 'bg-primary-900 hover:bg-primary-800 cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : mode === 'advance' ? (
                <>
                  <span>Confirm Semester Rollover</span>
                  <ArrowRight size={14} />
                </>
              ) : (
                <span>Launch Intake</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
