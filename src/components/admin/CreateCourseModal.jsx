/**
 * CreateCourseModal — Multi-Step Course & Curriculum Builder for Ilm Essentials Admin
 *
 * 6-Step Guided Creation Workflow:
 *  1. General Info (Title, Pathway, Format, Level, Theme, Description)
 *  2. Faculty & Schedule (Instructor, Bio, Class Timings, Campus/Meeting link)
 *  3. Tuition & Capacity (PKR Fee, Max Seats, Status)
 *  4. Curriculum Builder (Dynamic Modules, Video/Reading/Quiz Lessons, Durations)
 *  5. Learning Objectives & Materials (Key outcomes, downloadable syllabus)
 *  6. Review & Live Preview (Student view preview card, Publish / Draft)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Users,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Shield,
  GraduationCap,
  FileText,
  Check,
} from 'lucide-react';

const PRESET_INSTRUCTORS = [
  {
    name: 'Ustadh Khalil Ahmad',
    title: "Instructor of Qur'anic Sciences & Classical Tafsir",
    bio: 'Graduate of Al-Azhar University with specialization in classical Tafsir methodology. Teaching for over 10 years.',
  },
  {
    name: 'Sheikh Abdullah Nasir',
    title: 'Senior Faculty in Islamic Jurisprudence (Fiqh)',
    bio: 'Specialist in classical Hanbali and comparative jurisprudence with classical Ijazah in legal maxims.',
  },
  {
    name: 'Ustadha Fatima Zahra',
    title: "Head of Classical Qur'anic Arabic & Morphology",
    bio: 'Master of Arts in Arabic Linguistics. Dedicated to equipping seekers with direct access to sacred scripture.',
  },
  {
    name: 'Sheikh Yasir Faheem',
    title: 'Instructor in Spiritual Purification (Tazkiyah)',
    bio: 'Traditional scholar focused on inner ethical development, classical Ghazalian spiritual psychology, and Hadith.',
  },
  {
    name: 'Dr. Tahir Mahmood',
    title: 'Senior Researcher in Prophetic Biography (Sirah)',
    bio: 'Doctorate in Islamic History with extensive published monographs on the Madinan political landscape.',
  },
  {
    name: 'Raja Zia ul Haq',
    title: 'Instructor in Contemporary Ideologies & Youth Dawah',
    bio: 'Global speaker and youth mentor addressing modern philosophical currents and atheistic challenges.',
  },
];

const THEME_COLORS = [
  { name: 'Emerald', value: '#0B4A3F', bg: 'bg-[#0B4A3F]' },
  { name: 'Navy', value: '#102A43', bg: 'bg-[#102A43]' },
  { name: 'Warm Gold', value: '#8C6D3F', bg: 'bg-[#8C6D3F]' },
  { name: 'Burgundy', value: '#4A1525', bg: 'bg-[#4A1525]' },
  { name: 'Forest', value: '#134E4A', bg: 'bg-[#134E4A]' },
];

export default function CreateCourseModal({ isOpen, onClose, onCourseCreated }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedModules, setExpandedModules] = useState({ 0: true });

  // Course Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'foundations',
    format: 'live-online',
    level: 'Beginner',
    description: '',
    color: '#0B4A3F',
    instructorType: 'preset',
    selectedPresetInstructor: PRESET_INSTRUCTORS[0].name,
    customInstructorName: '',
    customInstructorTitle: '',
    customInstructorBio: '',
    duration: '8 Months',
    startDate: new Date().toISOString().split('T')[0],
    schedule: 'Tuesdays & Thursdays, 6:00 PM – 8:30 PM PKT',
    venue: 'Live Online (Google Meet Link provided upon enrollment)',
    fee: '30,000',
    capacity: 100,
    status: 'Active',
    learningObjectives: [
      'Master core classical Islamic principles and authentic methodologies',
      'Understand contextual application to modern ethical dilemmas',
      'Engage directly with traditional primary texts and classical commentaries',
    ],
    resources: [
      { id: 'res_1', title: 'Course Syllabus & Reading Roadmap (PDF)', type: 'pdf', size: '2.4 MB' },
      { id: 'res_2', title: 'Classical Terminology Glossary (Handout)', type: 'slides', size: '1.2 MB' },
    ],
    modules: [
      {
        id: `mod_${Date.now()}_1`,
        title: 'Module 1: Foundations & Classical Framework',
        lessons: [
          {
            id: `les_${Date.now()}_1`,
            title: 'Course Introduction & Spiritual Intentions',
            type: 'video',
            duration: '45 min',
          },
          {
            id: `les_${Date.now()}_2`,
            title: 'Historical Transmission of Sacred Knowledge',
            type: 'reading',
            duration: '30 min',
          },
          {
            id: `les_${Date.now()}_3`,
            title: 'Knowledge Check: Core Terminology',
            type: 'assessment',
            duration: '20 min',
          },
        ],
      },
      {
        id: `mod_${Date.now()}_2`,
        title: 'Module 2: Methodological Analysis & Primary Texts',
        lessons: [
          {
            id: `les_${Date.now()}_4`,
            title: 'Textual Exegesis & Commentary Walkthrough',
            type: 'video',
            duration: '50 min',
          },
          {
            id: `les_${Date.now()}_5`,
            title: 'Practical Application in Modern Contexts',
            type: 'video',
            duration: '40 min',
          },
        ],
      },
    ],
  });

  const [formErrors, setFormErrors] = useState({});

  if (!isOpen) return null;

  // Compute Instructor details
  const activeInstructor =
    formData.instructorType === 'preset'
      ? PRESET_INSTRUCTORS.find((i) => i.name === formData.selectedPresetInstructor) || PRESET_INSTRUCTORS[0]
      : {
          name: formData.customInstructorName || 'Faculty Scholar',
          title: formData.customInstructorTitle || 'Instructor of Islamic Sciences',
          bio: formData.customInstructorBio || 'Specialized scholar at Ilm Essentials.',
        };

  // Step Validation
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.title.trim()) errors.title = 'Course title is required';
      if (!formData.description.trim()) errors.description = 'Description is required';
    } else if (step === 2) {
      if (formData.instructorType === 'custom' && !formData.customInstructorName.trim()) {
        errors.customInstructorName = 'Instructor name is required';
      }
    } else if (step === 3) {
      if (!formData.fee) errors.fee = 'Tuition fee is required';
      if (!formData.capacity || Number(formData.capacity) <= 0) errors.capacity = 'Capacity must be greater than 0';
    } else if (step === 4) {
      if (!formData.modules || formData.modules.length === 0) {
        errors.modules = 'At least one module is required';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Module Management
  const handleAddModule = () => {
    const newMod = {
      id: `mod_${Date.now()}`,
      title: `Module ${formData.modules.length + 1}: New Curriculum Module`,
      lessons: [
        {
          id: `les_${Date.now()}_1`,
          title: 'Lesson 1: Introduction to Topic',
          type: 'video',
          duration: '40 min',
        },
      ],
    };
    setFormData((prev) => ({
      ...prev,
      modules: [...prev.modules, newMod],
    }));
    setExpandedModules((prev) => ({ ...prev, [formData.modules.length]: true }));
  };

  const handleDeleteModule = (index) => {
    if (formData.modules.length <= 1) {
      alert('A course must have at least one module.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index),
    }));
  };

  const handleModuleTitleChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.modules];
      updated[index].title = value;
      return { ...prev, modules: updated };
    });
  };

  // Lesson Management
  const handleAddLesson = (moduleIndex) => {
    const newLesson = {
      id: `les_${Date.now()}`,
      title: 'New Lesson',
      type: 'video',
      duration: '45 min',
    };
    setFormData((prev) => {
      const updated = [...prev.modules];
      updated[moduleIndex].lessons = [...updated[moduleIndex].lessons, newLesson];
      return { ...prev, modules: updated };
    });
  };

  const handleDeleteLesson = (moduleIndex, lessonIndex) => {
    setFormData((prev) => {
      const updated = [...prev.modules];
      updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
      return { ...prev, modules: updated };
    });
  };

  const handleLessonChange = (moduleIndex, lessonIndex, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.modules];
      updated[moduleIndex].lessons[lessonIndex][field] = value;
      return { ...prev, modules: updated };
    });
  };

  // Objectives Management
  const handleAddObjective = () => {
    setFormData((prev) => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, ''],
    }));
  };

  const handleObjectiveChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.learningObjectives];
      updated[index] = value;
      return { ...prev, learningObjectives: updated };
    });
  };

  const handleDeleteObjective = (index) => {
    setFormData((prev) => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
    }));
  };

  // Final Submit
  const handleFinalSubmit = (statusOverride) => {
    const finalCourse = {
      id: `crs_${Date.now()}`,
      title: formData.title,
      subtitle: formData.subtitle || `${formData.category === 'foundations' ? 'Ilm Foundations' : 'Ilm Intensives'} Certificate`,
      category: formData.category,
      format: formData.format,
      level: formData.level,
      description: formData.description,
      color: formData.color,
      instructor: activeInstructor,
      fee: formData.fee.startsWith('PKR') ? formData.fee : `PKR ${formData.fee}`,
      capacity: Number(formData.capacity) || 100,
      enrolledCount: 0,
      status: statusOverride || formData.status,
      startDate: formData.startDate,
      duration: formData.duration,
      schedule: formData.schedule,
      venue: formData.venue,
      modules: formData.modules,
      resources: formData.resources,
      learningObjectives: formData.learningObjectives.filter((o) => o.trim().length > 0),
    };

    onCourseCreated(finalCourse);
    onClose();
  };

  const steps = [
    { number: 1, title: 'Overview' },
    { number: 2, title: 'Faculty & Schedule' },
    { number: 3, title: 'Tuition & Seats' },
    { number: 4, title: 'Curriculum' },
    { number: 5, title: 'Objectives' },
    { number: 6, title: 'Review & Publish' },
  ];

  const totalLessonsCount = formData.modules.flatMap((m) => m.lessons).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-elevated border border-sand-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-primary-950 text-white border-b border-primary-900">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gold-500/20 flex items-center justify-center text-gold-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-white leading-tight">
                Create New Academic Course
              </h2>
              <p className="text-xs text-primary-200">
                Classical Islamic sciences curriculum builder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-primary-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Tabs */}
        <div className="bg-sand-50/80 border-b border-sand-200 px-6 py-2.5 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[560px] gap-2">
            {steps.map((step) => {
              const isActive = currentStep === step.number;
              const isPast = currentStep > step.number;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => {
                    if (step.number < currentStep || validateStep(currentStep)) {
                      setCurrentStep(step.number);
                    }
                  }}
                  className={`flex items-center gap-2 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary-900 text-white shadow-xs'
                      : isPast
                      ? 'text-primary-800 bg-primary-100/60 hover:bg-primary-100'
                      : 'text-ink-400 hover:text-ink-700'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-gold-400 text-primary-950'
                        : isPast
                        ? 'bg-primary-600 text-white'
                        : 'bg-sand-200 text-ink-500'
                    }`}
                  >
                    {isPast ? <Check size={11} strokeWidth={3} /> : step.number}
                  </span>
                  <span>{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: GENERAL OVERVIEW */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Usūl al-Fiqh — Principles of Islamic Jurisprudence"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    formErrors.title ? 'border-red-400 bg-red-50/20' : 'border-sand-200 focus:border-primary-600'
                  }`}
                />
                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  Subtitle / Programme Track
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Semester 2 — Ilm Foundations Certificate Programme"
                  className="w-full px-3.5 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                    Academic Pathway
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  >
                    <option value="foundations">Ilm Foundations (8-Month)</option>
                    <option value="intensives">Ilm Intensives (Masterclass)</option>
                    <option value="electives">Electives &amp; Language</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                    Delivery Format
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full px-3 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  >
                    <option value="live-online">Live Online (Google Meet)</option>
                    <option value="on-site">On-Site (DHA Phase 6, Lahore)</option>
                    <option value="self-paced">Self-Paced (Recorded Archive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                    Academic Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  >
                    <option value="Beginner">Beginner / Introductory</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced / Scholarly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  Course Visual Theme Accent
                </label>
                <div className="flex items-center gap-3">
                  {THEME_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: col.value })}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                        formData.color === col.value
                          ? 'border-primary-900 ring-2 ring-primary-500/30'
                          : 'border-sand-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${col.bg}`} />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  Detailed Course Description *
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide an authoritative summary of the course topics, methodologies, classical texts explored, and spiritual significance..."
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    formErrors.description ? 'border-red-400 bg-red-50/20' : 'border-sand-200 focus:border-primary-600'
                  }`}
                />
                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
              </div>
            </motion.div>
          )}

          {/* STEP 2: FACULTY & SCHEDULE */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700">
                  Assigned Scholar / Instructor
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="instructorType"
                      checked={formData.instructorType === 'preset'}
                      onChange={() => setFormData({ ...formData, instructorType: 'preset' })}
                      className="text-primary-700 focus:ring-primary-500"
                    />
                    Select Existing Faculty
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="instructorType"
                      checked={formData.instructorType === 'custom'}
                      onChange={() => setFormData({ ...formData, instructorType: 'custom' })}
                      className="text-primary-700 focus:ring-primary-500"
                    />
                    Add New Scholar
                  </label>
                </div>

                {formData.instructorType === 'preset' ? (
                  <div>
                    <select
                      value={formData.selectedPresetInstructor}
                      onChange={(e) => setFormData({ ...formData, selectedPresetInstructor: e.target.value })}
                      className="w-full px-3 py-2.5 border border-sand-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      {PRESET_INSTRUCTORS.map((inst) => (
                        <option key={inst.name} value={inst.name}>
                          {inst.name} — {inst.title}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 p-3 bg-white rounded-lg border border-sand-200 text-xs text-ink-600">
                      <strong>Bio:</strong> {activeInstructor.bio}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <input
                      type="text"
                      placeholder="Scholar's Full Name (e.g. Sheikh Dr. Ahmad Al-Qadri)"
                      value={formData.customInstructorName}
                      onChange={(e) => setFormData({ ...formData, customInstructorName: e.target.value })}
                      className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <input
                      type="text"
                      placeholder="Academic Title (e.g. Graduate of Islamic University of Madinah)"
                      value={formData.customInstructorTitle}
                      onChange={(e) => setFormData({ ...formData, customInstructorTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <textarea
                      rows={2}
                      placeholder="Brief scholar background and credentials..."
                      value={formData.customInstructorBio}
                      onChange={(e) => setFormData({ ...formData, customInstructorBio: e.target.value })}
                      className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                    Program Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 8 Months, 16 Weeks, 4 Week Intensive"
                    className="w-full px-3.5 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                    Commencement Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  Class Schedule &amp; Timings
                </label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="e.g. Every Saturday &amp; Sunday, 10:00 AM – 1:00 PM PKT"
                  className="w-full px-3.5 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  Classroom Venue / Online Meeting Link
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. DHA Phase 6 Lahore Campus, Hall 3 OR Google Meet Link"
                  className="w-full px-3.5 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 3: TUITION & SEAT CAPACITY */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                    Tuition Fee (PKR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-500">
                      PKR
                    </span>
                    <input
                      type="text"
                      value={formData.fee}
                      onChange={(e) => setFormData({ ...formData, fee: e.target.value.replace(/[^0-9,]/g, '') })}
                      placeholder="30,000"
                      className="w-full pl-12 pr-3.5 py-2.5 border border-sand-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  {formErrors.fee && <p className="text-red-500 text-xs mt-1">{formErrors.fee}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                    Maximum Student Capacity *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
                      <Users size={15} />
                    </span>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="100"
                      className="w-full pl-10 pr-3.5 py-2.5 border border-sand-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  {formErrors.capacity && <p className="text-red-500 text-xs mt-1">{formErrors.capacity}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  Initial Publication Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'Active', title: 'Active & Open', desc: 'Accepting enrollments immediately' },
                    { key: 'Upcoming', title: 'Upcoming', desc: 'Listed on schedule, registrations opening soon' },
                    { key: 'Draft', title: 'Draft Mode', desc: 'Hidden from student portal' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: st.key })}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.status === st.key
                          ? 'border-primary-900 bg-primary-50/70 ring-1 ring-primary-700'
                          : 'border-sand-200 hover:bg-sand-50'
                      }`}
                    >
                      <span className="block text-xs font-bold text-ink-900">{st.title}</span>
                      <span className="block text-[11px] text-ink-500 mt-0.5">{st.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gold-50/60 border border-gold-200 flex items-start gap-3 text-xs text-gold-950">
                <Shield size={16} className="text-gold-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tuition Policy Note:</strong> Installment plans and scholarship review allocations can be assigned per student directly from the <em>Admissions &amp; Review</em> admin tab.
                </span>
              </div>
            </motion.div>
          )}

          {/* STEP 4: CURRICULUM BUILDER */}
          {currentStep === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink-900">Course Syllabus &amp; Modules</h3>
                  <p className="text-xs text-ink-500">
                    {formData.modules.length} module{formData.modules.length !== 1 ? 's' : ''} • {totalLessonsCount} lesson{totalLessonsCount !== 1 ? 's' : ''} total
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddModule}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-900 text-white text-xs font-bold hover:bg-primary-800 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  Add Module
                </button>
              </div>

              {formData.modules.map((mod, modIdx) => {
                const isExpanded = expandedModules[modIdx] ?? false;
                return (
                  <div key={mod.id} className="border border-sand-300 rounded-xl bg-white overflow-hidden shadow-xs">
                    {/* Module Accordion Bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-sand-50 border-b border-sand-200">
                      <div className="flex items-center gap-2 flex-1 mr-3">
                        <button
                          type="button"
                          onClick={() => setExpandedModules({ ...expandedModules, [modIdx]: !isExpanded })}
                          className="text-ink-500 hover:text-ink-900 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => handleModuleTitleChange(modIdx, e.target.value)}
                          className="flex-1 font-bold text-xs sm:text-sm text-ink-900 bg-transparent border-b border-transparent hover:border-sand-300 focus:border-primary-600 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sand-200 text-ink-700">
                          {mod.lessons.length} Lessons
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(modIdx)}
                          className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Module"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Lessons inside Module */}
                    {isExpanded && (
                      <div className="p-4 space-y-2.5 bg-sand-50/30">
                        {mod.lessons.map((lesson, lesIdx) => (
                          <div
                            key={lesson.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg bg-white border border-sand-200 text-xs"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-bold text-ink-400 w-5 text-center">
                                {lesIdx + 1}.
                              </span>
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => handleLessonChange(modIdx, lesIdx, 'title', e.target.value)}
                                placeholder="Lesson Title"
                                className="flex-1 font-medium text-ink-800 border-none bg-transparent focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <select
                                value={lesson.type}
                                onChange={(e) => handleLessonChange(modIdx, lesIdx, 'type', e.target.value)}
                                className="px-2 py-1 rounded-md border border-sand-200 bg-sand-50 text-[11px] font-semibold text-ink-700 focus:outline-none"
                              >
                                <option value="video">Video</option>
                                <option value="reading">Reading</option>
                                <option value="assessment">Quiz</option>
                              </select>

                              <input
                                type="text"
                                value={lesson.duration}
                                onChange={(e) => handleLessonChange(modIdx, lesIdx, 'duration', e.target.value)}
                                placeholder="Duration"
                                className="w-18 px-2 py-1 rounded-md border border-sand-200 bg-sand-50 text-[11px] font-mono text-center focus:outline-none"
                              />

                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(modIdx, lesIdx)}
                                className="p-1 text-ink-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddLesson(modIdx)}
                          className="w-full py-2 border border-dashed border-primary-300 hover:border-primary-500 bg-primary-50/40 text-primary-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                        >
                          <Plus size={13} />
                          Add Lesson to Module {modIdx + 1}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* STEP 5: OBJECTIVES & RESOURCES */}
          {currentStep === 5 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Learning Objectives */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block">
                    Key Learning Objectives (What Students Will Master)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddObjective}
                    className="text-xs text-primary-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Objective
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                        ✓
                      </span>
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => handleObjectiveChange(i, e.target.value)}
                        placeholder={`Objective ${i + 1}`}
                        className="flex-1 px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteObjective(i)}
                        className="p-1.5 text-ink-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Downloadable Handouts */}
              <div className="pt-4 border-t border-sand-200 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block">
                  Course Resources &amp; Downloads
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.resources.map((res) => (
                    <div key={res.id} className="p-3 rounded-xl border border-sand-200 bg-sand-50/70 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText size={16} className="text-primary-700 shrink-0" />
                        <span className="font-semibold text-ink-800 truncate">{res.title}</span>
                      </div>
                      <span className="font-mono text-[10px] text-ink-400 shrink-0">{res.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: REVIEW & LIVE PREVIEW */}
          {currentStep === 6 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-sand-50 border border-sand-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                      Student Preview Card
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800">
                    {formData.format.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Simulated Student Course Card */}
                <div className="rounded-xl border border-sand-200 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary-800">
                    <GraduationCap size={15} />
                    <span>{formData.subtitle || 'Ilm Essentials Academic Curriculum'}</span>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-ink-900 leading-tight">
                    {formData.title || 'Course Title Preview'}
                  </h3>

                  <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">
                    {formData.description || 'Course overview details...'}
                  </p>

                  <div className="pt-3 border-t border-sand-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-ink-400 block font-semibold">INSTRUCTOR</span>
                      <span className="font-bold text-ink-800">{activeInstructor.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-400 block font-semibold">CURRICULUM</span>
                      <span className="font-bold text-ink-800">
                        {formData.modules.length} Modules • {totalLessonsCount} Lessons
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-400 block font-semibold">TUITION</span>
                      <span className="font-bold text-primary-900">
                        PKR {formData.fee}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-400 block font-semibold">SCHEDULE</span>
                      <span className="font-bold text-ink-800">{formData.duration}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
                  <span className="text-ink-400 block text-[10px] font-bold">START DATE</span>
                  <span className="font-bold text-ink-900 text-sm mt-0.5 block">{formData.startDate}</span>
                </div>
                <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
                  <span className="text-ink-400 block text-[10px] font-bold">SEATS CAPACITY</span>
                  <span className="font-bold text-ink-900 text-sm mt-0.5 block">{formData.capacity} Students</span>
                </div>
                <div className="p-3 bg-sand-50 rounded-xl border border-sand-200">
                  <span className="text-ink-400 block text-[10px] font-bold">LEVEL</span>
                  <span className="font-bold text-ink-900 text-sm mt-0.5 block">{formData.level}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-sand-50 border-t border-sand-200 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handleBack}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              currentStep === 1
                ? 'opacity-30 cursor-not-allowed text-ink-400'
                : 'text-ink-700 hover:bg-sand-200/70'
            }`}
          >
            <ChevronLeft size={15} />
            Back
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Continue
                <ChevronRight size={15} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFinalSubmit('Draft')}
                  className="px-4 py-2.5 rounded-xl border border-sand-300 text-ink-700 hover:bg-sand-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalSubmit('Active')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-primary-950 text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Sparkles size={14} />
                  Publish &amp; Launch Course
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
