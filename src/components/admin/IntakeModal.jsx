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
} from 'lucide-react';

/**
 * Format currency in PKR
 */
const formatPKR = (amt) => {
  if (amt === null || amt === undefined) return 'Rs. 0';
  return `Rs. ${Number(amt).toLocaleString('en-PK')}`;
};

/**
 * Helper to slugify names into valid database batch IDs
 */
const slugifyBatchId = (str) => {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
};

export default function IntakeModal({
  isOpen,
  onClose,
  initialPathway = null, // pathway object or slug
  mode = 'create', // 'create' | 'advance'
  advancingBatch = null, // batch object if mode === 'advance'
  pathways = [],
  courses = [],
  instructors = [],
  existingBatches = [],
  students = [],
  onSaveIntake, // async (intakeData) => { success, error }
  onAdvanceSemester, // async (advanceData) => { success, error }
}) {
  if (!isOpen) return null;

  // Selected Pathway
  const [selectedPathwayId, setSelectedPathwayId] = useState(() => {
    if (advancingBatch?.pathway_id) return advancingBatch.pathway_id;
    if (initialPathway?.id) return initialPathway.id;
    if (initialPathway?.slug) return initialPathway.slug;
    return 'foundations';
  });

  const activePathway = useMemo(() => {
    return pathways.find((p) => p.id === selectedPathwayId || p.slug === selectedPathwayId) || {
      id: selectedPathwayId,
      name: selectedPathwayId === 'foundations' ? 'Ilm Foundations' : 'Ilm Intensives',
      type: selectedPathwayId === 'foundations' ? 'cohort' : 'modular',
      semesters: selectedPathwayId === 'foundations' ? 2 : 1,
      default_tuition_fee: selectedPathwayId === 'foundations' ? 30000 : 12000,
    };
  }, [pathways, selectedPathwayId]);

  const isCohortPathway = activePathway.type === 'cohort' || activePathway.programStructure === 'multi_semester';

  // Modal active tab / submode when in 'create' mode
  const [createType, setCreateType] = useState(() => {
    if (mode === 'advance') return 'advance';
    return isCohortPathway ? 'program_cohort' : 'course_intake';
  });

  // Keep createType in sync if user changes pathway dropdown
  useEffect(() => {
    if (mode !== 'advance') {
      setCreateType(isCohortPathway ? 'program_cohort' : 'course_intake');
    }
  }, [isCohortPathway, mode]);

  // Form State
  const [cohortGroupName, setCohortGroupName] = useState(''); // e.g. "Batch 2"
  const [batchName, setBatchName] = useState('');
  const [batchId, setBatchId] = useState('');
  const [isIdManual, setIsIdManual] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tuitionFee, setTuitionFee] = useState('');
  const [status, setStatus] = useState('active');

  // Instructor overrides for program cohort courses: { [courseId]: instructorId }
  const [courseInstructors, setCourseInstructors] = useState({});

  // Advance Mode State
  const [targetSemester, setTargetSemester] = useState(() => {
    if (advancingBatch) return (advancingBatch.semester || 1) + 1;
    return 2;
  });
  const [autoEnrollStudents, setAutoEnrollStudents] = useState(true);
  const [issueInvoice, setIssueInvoice] = useState(true);

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filter courses for active pathway
  const pathwayCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.category === activePathway.slug ||
        c.category === activePathway.id ||
        c.pathway_id === activePathway.slug ||
        c.pathway_id === activePathway.id
    );
  }, [courses, activePathway]);

  // For semester 1 courses in program cohort
  const semester1Courses = useMemo(() => {
    return pathwayCourses.filter(
      (c) => !c.semester || c.semester === 1 || String(c.semester).toLowerCase().includes('1')
    );
  }, [pathwayCourses]);

  // For target semester courses in advance mode
  const targetSemesterCourses = useMemo(() => {
    return pathwayCourses.filter(
      (c) =>
        String(c.semester) === String(targetSemester) ||
        String(c.semester).toLowerCase() === `semester ${targetSemester}`
    );
  }, [pathwayCourses, targetSemester]);

  // Active students in advancing batch
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

  const [eligibilityFilter, setEligibilityFilter] = useState('eligible_only');

  // Initial populate when modal opens or mode changes
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsIdManual(false);

    if (mode === 'advance' && advancingBatch) {
      const nextSem = (advancingBatch.semester || 1) + 1;
      setTargetSemester(nextSem);
      const groupName = advancingBatch.cohort_group || advancingBatch.id.replace(/_sem\d+$/, '');
      const groupDisplay = groupName.replace(/_/g, ' ').toUpperCase();
      const generatedName = `Ilm Foundations — ${groupDisplay} (Semester ${nextSem})`;
      const generatedId = `${groupName}_sem${nextSem}`;

      setBatchName(generatedName);
      setBatchId(generatedId);
      setTuitionFee(advancingBatch.tuition_fee ? String(advancingBatch.tuition_fee) : '30000');
      // Default dates 6 months after starting
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      setEndDate(sixMonths.toISOString().split('T')[0]);
    } else if (createType === 'program_cohort') {
      // Find next batch number
      const existingFoundations = existingBatches.filter(
        (b) => b.pathway_id === 'foundations' && b.semester === 1
      );
      const nextBatchNum = existingFoundations.length + 1;
      const groupName = `Batch ${nextBatchNum}`;
      setCohortGroupName(groupName);
      const generatedName = `Ilm Foundations — ${groupName} (Semester 1)`;
      const generatedId = `foundations_b${nextBatchNum}_sem1`;

      setBatchName(generatedName);
      setBatchId(generatedId);
      setTuitionFee(activePathway.default_tuition_fee ? String(activePathway.default_tuition_fee) : '30000');

      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      setEndDate(sixMonths.toISOString().split('T')[0]);

      // Initialize default instructors from course leads
      const instMap = {};
      semester1Courses.forEach((c) => {
        if (c.instructor_id) instMap[c.id] = c.instructor_id;
      });
      setCourseInstructors(instMap);
    } else {
      // course_intake (Intensives / Electives)
      if (pathwayCourses.length > 0) {
        const firstCrs = pathwayCourses[0];
        setSelectedCourseId(firstCrs.id);
        setSelectedInstructorId(firstCrs.instructor_id || '');
        const autoName = `${firstCrs.title} — Intake ${new Date().getFullYear()}`;
        setBatchName(autoName);
        setBatchId(slugifyBatchId(autoName));
        setTuitionFee(firstCrs.tuition_fee ? String(firstCrs.tuition_fee) : String(activePathway.default_tuition_fee || 12000));
      } else {
        setSelectedCourseId('');
        setSelectedInstructorId('');
        setBatchName('');
        setBatchId('');
        setTuitionFee(String(activePathway.default_tuition_fee || 12000));
      }

      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const twoMonths = new Date();
      twoMonths.setMonth(twoMonths.getMonth() + 2);
      setEndDate(twoMonths.toISOString().split('T')[0]);
    }
  }, [mode, createType, advancingBatch, activePathway, existingBatches]);

  // Handle course select change in course_intake mode
  const handleCourseChange = (crsId) => {
    setSelectedCourseId(crsId);
    const crs = pathwayCourses.find((c) => c.id === crsId);
    if (crs) {
      setSelectedInstructorId(crs.instructor_id || '');
      const year = new Date().getFullYear();
      const season = new Date().getMonth() >= 7 ? 'Fall' : 'Spring';
      const autoName = `${crs.title} — ${season} ${year}`;
      setBatchName(autoName);
      if (!isIdManual) {
        setBatchId(slugifyBatchId(autoName));
      }
      setTuitionFee(crs.tuition_fee ? String(crs.tuition_fee) : String(activePathway.default_tuition_fee || 12000));
    }
  };

  // Handle cohort group name change for program cohorts
  const handleCohortGroupChange = (val) => {
    setCohortGroupName(val);
    const cleanGroup = val.trim();
    const cleanSlug = slugifyBatchId(cleanGroup);
    const autoName = `Ilm Foundations — ${cleanGroup} (Semester 1)`;
    setBatchName(autoName);
    if (!isIdManual) {
      setBatchId(`foundations_${cleanSlug}_sem1`);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!batchName.trim()) {
      setErrorMessage('Batch / Intake display name is required.');
      return;
    }

    const cleanId = (batchId || slugifyBatchId(batchName)).trim();
    if (!cleanId) {
      setErrorMessage('A unique Batch Identifier (Code) is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'advance') {
        if (!onAdvanceSemester) throw new Error('Advance handler is not configured.');

        const selectedStudentIds =
          autoEnrollStudents && eligibilityFilter === 'eligible_only' && eligibleStudents.length > 0
            ? eligibleStudents.map((s) => s.id)
            : null;

        const result = await onAdvanceSemester({
          fromBatchId: advancingBatch.id,
          cohortGroup: advancingBatch.cohort_group || advancingBatch.id,
          targetSemester,
          newBatchId: cleanId,
          newBatchName: batchName.trim(),
          startDate,
          endDate,
          tuitionFee: tuitionFee ? Number(tuitionFee) : null,
          status,
          autoEnrollStudents,
          issueInvoice,
          studentIds: selectedStudentIds,
        });

        if (!result.success) throw new Error(result.error || 'Failed to advance semester.');

        setSuccessMessage(`Successfully advanced ${result.enrolledCount || 0} students to ${batchName}!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        // Create Mode
        if (!onSaveIntake) throw new Error('Save intake handler is not configured.');

        const intakePayload = {
          id: cleanId,
          pathway_id: activePathway.id || selectedPathwayId,
          name: batchName.trim(),
          start_date: startDate || null,
          end_date: endDate || null,
          tuition_fee: tuitionFee ? Number(tuitionFee) : null,
          status,
        };

        if (createType === 'program_cohort') {
          const cleanGroup = slugifyBatchId(cohortGroupName || cleanId);
          intakePayload.cohort_group = cleanGroup;
          intakePayload.semester = 1;
          intakePayload.course_id = null;

          // Instructor overrides
          const instOverrides = Object.entries(courseInstructors)
            .filter(([_, instId]) => Boolean(instId))
            .map(([crsId, instId]) => ({
              course_id: crsId,
              instructor_id: instId,
            }));
          intakePayload.instructors = instOverrides;
        } else {
          // course_intake
          if (!selectedCourseId) {
            throw new Error('Please select an individual course for this intake.');
          }
          intakePayload.cohort_group = cleanId;
          intakePayload.semester = 1;
          intakePayload.course_id = selectedCourseId;
          intakePayload.instructor_id = selectedInstructorId || null;
        }

        const result = await onSaveIntake(intakePayload);
        if (!result.success) throw new Error(result.error || 'Failed to create intake.');

        setSuccessMessage(`Intake "${batchName}" created successfully!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Error submitting intake form:', err);
      setErrorMessage(err.message || 'An error occurred while saving the intake.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-sand-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-sand-200 bg-linear-to-r from-sand-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-100/70 border border-primary-200 flex items-center justify-center text-primary-950 shadow-2xs">
              {mode === 'advance' ? <Layers size={20} /> : <Compass size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-ink-900 tracking-tight">
                {mode === 'advance'
                  ? `Advance Batch to Semester ${targetSemester}`
                  : `Create New Intake — ${activePathway.name}`}
              </h2>
              <p className="text-xs text-ink-500 font-medium">
                {mode === 'advance'
                  ? `Rollover roster and academic history for ${advancingBatch?.name}`
                  : isCohortPathway
                  ? 'Multi-semester bundled program intake with roster continuity'
                  : 'Standalone course intake with custom faculty lead'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Messages */}
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

          {/* ADVANCE MODE BANNER */}
          {mode === 'advance' && advancingBatch && (
            <div className="p-4 rounded-xl bg-primary-50/80 border border-primary-200/80 space-y-2.5">
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
                    <strong>{advancingBatchStudents.length}</strong> active students ready for rollover
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
          )}

          {/* CREATE MODE: MODEL SELECTOR TABS (If not advance) */}
          {mode !== 'advance' && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-sand-100/70 rounded-xl border border-sand-200/60">
              <button
                type="button"
                onClick={() => setCreateType('program_cohort')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  createType === 'program_cohort'
                    ? 'bg-white text-primary-950 shadow-2xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <GraduationCap size={15} />
                <span>Bundled Program Cohort</span>
              </button>
              <button
                type="button"
                onClick={() => setCreateType('course_intake')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  createType === 'course_intake'
                    ? 'bg-white text-primary-950 shadow-2xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <BookOpen size={15} />
                <span>Single Course Intake</span>
              </button>
            </div>
          )}

          {/* FIELD: Pathway Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Academic Pathway
              </label>
              <select
                value={selectedPathwayId}
                onChange={(e) => setSelectedPathwayId(e.target.value)}
                disabled={mode === 'advance'}
                className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-sand-50 disabled:text-ink-500"
              >
                {pathways.map((p) => (
                  <option key={p.id || p.slug} value={p.id || p.slug}>
                    {p.name} ({p.type === 'cohort' ? 'Bundled' : 'Modular'})
                  </option>
                ))}
              </select>
            </div>

            {/* FIELD: Cohort Identifier or Course Picker */}
            {createType === 'program_cohort' ? (
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1.5">
                  Cohort Series / Batch Group <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cohortGroupName}
                  onChange={(e) => handleCohortGroupChange(e.target.value)}
                  placeholder="e.g. Batch 2, Spring 2027"
                  className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                />
              </div>
            ) : createType === 'course_intake' ? (
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1.5">
                  Select Standalone Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  {pathwayCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                  {pathwayCourses.length === 0 && (
                    <option value="">No courses assigned to this pathway</option>
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1.5">
                  Target Semester
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded-xl bg-sand-100 border border-sand-200 text-xs font-bold text-primary-950 flex-1">
                    Semester {targetSemester}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* FIELD: Intake Display Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Intake Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g. Ilm Foundations — Fall 2026 (Semester 1)"
                className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Batch Code (Database Key) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={batchId}
                onChange={(e) => {
                  setIsIdManual(true);
                  setBatchId(e.target.value);
                }}
                placeholder="e.g. foundations_b2_sem1"
                className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs bg-sand-50/70 text-ink-800 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          {/* FACULTY / INSTRUCTOR ASSIGNMENT */}
          {createType === 'course_intake' ? (
            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Intake Instructor (Faculty Lead)
              </label>
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">-- Use Course Default Instructor --</option>
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.designation || inst.role || 'Faculty'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-ink-400 mt-1">
                Overrides the default curriculum instructor specifically for this batch.
              </p>
            </div>
          ) : createType === 'program_cohort' ? (
            <div className="space-y-2 p-3.5 rounded-xl bg-sand-50/70 border border-sand-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-900">
                  Semester 1 Faculty Assignments ({semester1Courses.length} Courses)
                </span>
                <span className="text-[10px] text-ink-500">Customize instructor per course</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {semester1Courses.map((crs) => (
                  <div
                    key={crs.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-white border border-sand-200/80 text-xs shadow-2xs"
                  >
                    <span className="font-semibold text-ink-900 truncate max-w-xs" title={crs.title}>
                      {crs.title}
                    </span>
                    <select
                      value={courseInstructors[crs.id] || crs.instructor_id || ''}
                      onChange={(e) =>
                        setCourseInstructors((prev) => ({ ...prev, [crs.id]: e.target.value }))
                      }
                      className="px-2 py-1 rounded-md border border-sand-200 text-[11px] bg-white text-ink-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {instructors.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* DATES & TUITION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Tuition Fee (PKR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={tuitionFee}
                  onChange={(e) => setTuitionFee(e.target.value)}
                  placeholder="30000"
                  className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* STATUS & ENROLLMENT TOGGLES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Initial Intake Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
              >
                <option value="active">Active (Currently In-Session)</option>
                <option value="enrolling">Enrolling (Open in Public Admissions)</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived (Internal / Inactive)</option>
              </select>
            </div>

            {/* Advance Mode Options */}
            {mode === 'advance' ? (
              <div className="space-y-3 col-span-full pt-3 mt-1 border-t border-sand-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-ink-900">
                    Student Promotion & Eligibility Gate
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                      {eligibleStudents.length} Eligible (Fees Cleared)
                    </span>
                    {ineligibleStudents.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                        {ineligibleStudents.length} Ineligible (Unpaid / Default)
                      </span>
                    )}
                  </div>
                </div>

                {ineligibleStudents.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      <span>Defaulter Notice:</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      <strong>{ineligibleStudents.map((s) => s.name).join(', ')}</strong> currently {ineligibleStudents.length === 1 ? 'has' : 'have'} an unpaid fee balance or non-active status for the previous semester.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    eligibilityFilter === 'eligible_only'
                      ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500/20'
                      : 'border-sand-200 bg-sand-50/40 hover:bg-sand-100/60'
                  }`}>
                    <input
                      type="radio"
                      name="eligibility_filter"
                      value="eligible_only"
                      checked={eligibilityFilter === 'eligible_only'}
                      onChange={() => setEligibilityFilter('eligible_only')}
                      className="mt-0.5 text-primary-900 focus:ring-primary-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-ink-900 block">
                        Promote Only Cleared Students ({eligibleStudents.length})
                      </span>
                      <span className="text-[11px] text-ink-500 leading-normal block mt-0.5">
                        Recommended: Defaulters remain in their current batch until tuition fees are settled.
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    eligibilityFilter === 'all'
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20'
                      : 'border-sand-200 bg-sand-50/40 hover:bg-sand-100/60'
                  }`}>
                    <input
                      type="radio"
                      name="eligibility_filter"
                      value="all"
                      checked={eligibilityFilter === 'all'}
                      onChange={() => setEligibilityFilter('all')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-ink-900 block">
                        Promote All Students ({advancingBatchStudents.length})
                      </span>
                      <span className="text-[11px] text-ink-500 leading-normal block mt-0.5">
                        Admin Override: Rollover all students regardless of fee balances.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-5 pt-1">
                  <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoEnrollStudents}
                      onChange={(e) => setAutoEnrollStudents(e.target.checked)}
                      className="rounded text-primary-900 focus:ring-primary-500"
                    />
                    <span className="font-medium">Auto-create course enrollments</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={issueInvoice}
                      onChange={(e) => setIssueInvoice(e.target.checked)}
                      className="rounded text-primary-900 focus:ring-primary-500"
                    />
                    <span className="font-medium">Generate Semester {targetSemester} tuition invoices</span>
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-sand-200 bg-sand-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-sand-300 text-xs font-bold text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-primary-900 text-white text-xs font-bold hover:bg-primary-950 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === 'advance' ? (
              <>
                <span>Advance to Semester {targetSemester}</span>
                <ArrowRight size={14} />
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Create Intake</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
