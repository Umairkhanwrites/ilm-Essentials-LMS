/**
 * CreateCourse — Dedicated Admin Course Creation & Curriculum Builder Page
 *
 * Supports both CREATE mode (/admin/courses/new) and EDIT mode (/admin/courses/edit/:id)
 * Features:
 *  - Interactive Class Schedule & Timings Configurator (Days, Timings, Presets)
 *  - Ilm Foundations Bundled Program rules (no individual charge, auto-enrolled cohort)
 *  - Reliable 1-click Lesson Addition (no duplicate additions)
 *  - Detailed Content Editor per Lesson: Video URL, Reading text, Quiz Question Builder
 *  - Unsaved Changes Leave Prompt (Publish, Save Draft, Discard, Cancel)
 *  - Seamless Course Updates & Persistence
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
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
  BookOpen,
  Calendar,
  Clock,
  Layers,
  MapPin,
  Video,
  FileCheck,
  AlertCircle,
  Link as LinkIcon,
  HelpCircle,
  Edit2,
  Save,
  ExternalLink,
  Search,
  UserPlus,
  CheckSquare,
  Square,
  UserCheck,
  Download,
  Upload,
  FileSpreadsheet,
  FileImage,
  File,
  Lock,
  Key,
  Eye,
  EyeOff,
  Compass,
} from 'lucide-react';

import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import {
  saveCourse,
  getCourseDetailById,
  getAllCourses,
  getAllStudents,
  saveStudent,
  getCourseEnrolledStudentIds,
  generateTemporaryPassword,
  getAllPathways,
  savePathway,
} from '../services/courseStorage';
import { DEFAULT_BUNNY_VIDEO_URL } from '../data/mockData';
import logoWhite from '../assets/logo-white.png';

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
    name: 'Muhammad Ali',
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

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SCHEDULE_PRESETS = [
  {
    label: 'Weekday Evenings (Tue & Thu, 6:00 PM – 8:30 PM PKT)',
    days: ['Tue', 'Thu'],
    startTime: '06:00 PM',
    endTime: '08:30 PM',
  },
  {
    label: 'Weekend Mornings (Sat & Sun, 10:00 AM – 1:00 PM PKT)',
    days: ['Sat', 'Sun'],
    startTime: '10:00 AM',
    endTime: '01:00 PM',
  },
  {
    label: 'Friday & Saturday Intensives (6:30 PM – 9:00 PM PKT)',
    days: ['Fri', 'Sat'],
    startTime: '06:30 PM',
    endTime: '09:00 PM',
  },
  {
    label: 'Self-Paced / On-Demand Access',
    days: [],
    startTime: 'Flexible',
    endTime: 'On-Demand',
  },
];

// 3 Delivery Categories for Classes (Online, Onsite, Online & Onsite)
const CLASS_CATEGORIES = [
  {
    id: 'online',
    label: 'Online',
    tagline: 'Live Interactive Virtual Class',
    desc: 'Interactive live sessions via Google Meet or Zoom. Accessible globally.',
    icon: Video,
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    activeClass: 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs',
  },
  {
    id: 'onsite',
    label: 'Onsite',
    tagline: 'Physical Campus Attendance',
    desc: 'In-person classroom lectures held at Ilm Essentials DHA Phase 6 Campus, Lahore.',
    icon: MapPin,
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    activeClass: 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-xs',
  },
  {
    id: 'hybrid',
    label: 'Online & Onsite (both)',
    tagline: 'Dual Hybrid Delivery',
    desc: 'Students may attend in-person on campus or join live remotely via meeting link.',
    icon: Layers,
    color: 'purple',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    activeClass: 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-xs',
  },
];

const MEETING_PLATFORMS = [
  'Google Meet',
  'Zoom',
  'Microsoft Teams',
  'Custom Streaming Link',
];

// Helper to compute course duration from start and end dates
const calculateCourseDuration = (startStr, endStr) => {
  if (!startStr || !endStr) return '';
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    if (diffDays <= 0) return 'Same Day Intensive';
    const weeks = Math.round(diffDays / 7);
    if (weeks <= 0) return `${diffDays} Days`;
    if (weeks === 1) return '1 Week';
    if (weeks < 4) return `${weeks} Weeks (${diffDays} Days)`;
    const months = Math.round(diffDays / 30);
    if (months >= 1 && diffDays % 30 < 5) {
      return `${months} ${months === 1 ? 'Month' : 'Months'} (${weeks} Weeks)`;
    }
    return `${weeks} Weeks`;
  } catch {
    return '';
  }
};

export default function CreateCourse() {
  const navigate = useNavigate();
  const { id } = useParams(); // If present, we are in EDIT mode
  const { user } = useAuth();

  const isEditMode = Boolean(id);

  const [currentStep, setCurrentStep] = useState(1);
  const [expandedModules, setExpandedModules] = useState({ 0: true });
  const [activeLessonEditor, setActiveLessonEditor] = useState(null); // { modIdx, lesIdx }
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Student Enrollment State (Defaults to Foundations cohort students for main program)
  const [allStudents, setAllStudents] = useState(() => getAllStudents());
  const [selectedStudentIds, setSelectedStudentIds] = useState(() => {
    return getAllStudents()
      .filter((s) => s.program.includes('Foundations'))
      .map((s) => s.id);
  });
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    email: '',
    phone: '',
    password: generateTemporaryPassword(),
    mustChangePassword: true,
    format: 'online',
    program: 'Ilm Foundations',
    semester: 'Semester 1',
    feeStatus: 'Paid',
  });

  // Downloadable Handouts & Reading Materials State
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [newResourceData, setNewResourceData] = useState({
    title: '',
    type: 'pdf',
    size: '1.5 MB',
    downloadUrl: '',
    description: '',
  });

  // Dynamic Academic Pathways State
  const [pathways, setPathways] = useState(() => getAllPathways());
  const [isPathwayModalOpen, setIsPathwayModalOpen] = useState(false);
  const [pathwayForm, setPathwayForm] = useState({
    name: '',
    subtitle: '',
    description: '',
    programStructure: 'multi_semester', // 'multi_semester' | 'course_group' | 'single_course'
    type: 'cohort',
    duration: '8 Months (2 Semesters)',
    semesters: 2,
    tuitionModel: 'bundled',
    defaultTuitionFee: 30000,
    color: 'emerald',
    icon: 'GraduationCap',
  });
  const [pathwayFormError, setPathwayFormError] = useState('');

  const handleCreatePathway = (e) => {
    e.preventDefault();
    if (!pathwayForm.name.trim()) {
      setPathwayFormError('Pathway name is required.');
      return;
    }
    const created = savePathway({
      ...pathwayForm,
      slug: pathwayForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
    });
    const refreshed = getAllPathways();
    setPathways(refreshed);
    setFormData((prev) => ({
      ...prev,
      category: created.slug || created.id,
      semester: created.programStructure === 'multi_semester' ? 'Semester 1' : '',
    }));
    setIsPathwayModalOpen(false);
    setPathwayForm({
      name: '',
      subtitle: '',
      description: '',
      programStructure: 'multi_semester',
      type: 'cohort',
      duration: '8 Months (2 Semesters)',
      semesters: 2,
      tuitionModel: 'bundled',
      defaultTuitionFee: 30000,
      color: 'emerald',
      icon: 'GraduationCap',
    });
    setPathwayFormError('');
  };

  // Default dates: Today and 8 weeks out
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultEndStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 56); // 8 weeks
    return d.toISOString().split('T')[0];
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'foundations',
    semester: 'Semester 1',
    format: 'live-online',
    classCategory: 'online', // 'online' | 'onsite' | 'hybrid'
    level: 'Beginner',
    description: '',
    color: '#0B4A3F',
    instructorType: 'preset',
    selectedPresetInstructor: PRESET_INSTRUCTORS[0].name,
    customInstructorName: '',
    customInstructorTitle: '',
    customInstructorBio: '',
    startDate: todayStr,
    endDate: defaultEndStr,
    duration: '8 Weeks',
    selectedDays: ['Tue', 'Thu'],
    startTime: '06:00 PM',
    endTime: '08:30 PM',
    scheduleNotes: 'Tuesdays & Thursdays, 6:00 PM – 8:30 PM PKT',
    meetingLink: 'https://meet.google.com/ilm-foundations-live',
    meetingPlatform: 'Google Meet',
    meetingPasscode: '',
    meetingInstructions: 'Meeting link activates 10 minutes prior to scheduled session.',
    campusLocation: 'Ilm Essentials Lahore Campus, DHA Phase 6, Lahore',
    campusRoom: 'Executive Lecture Hall 3 (2nd Floor)',
    venue: 'Online via Google Meet',
    fee: 'Included in Ilm Foundations Program',
    capacity: 150,
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
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            lectureNotes: 'Introduction to foundational terminology, scholarly lineage, and academic prerequisites.',
            content: '',
            meetingLink: 'https://meet.google.com/ilm-foundations-live',
            sessionSchedule: 'Tuesday, 6:00 PM PKT',
            quizQuestions: [],
          },
          {
            id: `les_${Date.now()}_2`,
            title: 'Historical Transmission of Sacred Knowledge',
            type: 'reading',
            duration: '30 min',
            videoUrl: '',
            lectureNotes: '',
            content: 'Detailed reading examining the unbroken chains (Isnad) and transmission methodologies across the classical centuries.',
            meetingLink: '',
            sessionSchedule: '',
            quizQuestions: [],
          },
          {
            id: `les_${Date.now()}_3`,
            title: 'Knowledge Check: Core Terminology',
            type: 'assessment',
            duration: '20 min',
            videoUrl: '',
            lectureNotes: '',
            content: '',
            passingScore: '70%',
            quizQuestions: [
              {
                id: 'q_1',
                question: 'What is the primary role of Usul in Islamic legal thought?',
                options: [
                  'To derive normative rulings methodically from primary sources',
                  'To document historical battles exclusively',
                  'To translate poetic Arabic literature',
                  'None of the above',
                ],
                correctIndex: 0,
              },
            ],
          },
        ],
      },
    ],
  });

  const [formErrors, setFormErrors] = useState({});

  // Load existing course if in EDIT mode
  useEffect(() => {
    if (isEditMode && id) {
      const existing = getCourseDetailById(id);
      if (existing) {
        const isFoundations = existing.category === 'foundations';
        const existingClassCat =
          existing.classCategory ||
          (existing.format === 'on-site' || existing.format === 'onsite'
            ? 'onsite'
            : existing.format === 'hybrid'
            ? 'hybrid'
            : 'online');

        setFormData({
          title: existing.title || '',
          subtitle: existing.subtitle || '',
          category: existing.category || 'foundations',
          semester: existing.semester ? (typeof existing.semester === 'number' ? `Semester ${existing.semester}` : existing.semester) : 'Semester 1',
          format: existing.format || (existingClassCat === 'onsite' ? 'on-site' : (existingClassCat === 'hybrid' ? 'hybrid' : 'live-online')),
          classCategory: existingClassCat,
          level: existing.level || 'Beginner',
          description: existing.description || '',
          color: existing.color || '#0B4A3F',
          instructorType: PRESET_INSTRUCTORS.some((i) => i.name === existing.instructor?.name) ? 'preset' : 'custom',
          selectedPresetInstructor: existing.instructor?.name || PRESET_INSTRUCTORS[0].name,
          customInstructorName: existing.instructor?.name || '',
          customInstructorTitle: existing.instructor?.title || '',
          customInstructorBio: existing.instructor?.bio || '',
          startDate: existing.startDate || todayStr,
          endDate: existing.endDate || defaultEndStr,
          duration: existing.duration || '8 Weeks',
          selectedDays: ['Tue', 'Thu'],
          startTime: '06:00 PM',
          endTime: '08:30 PM',
          scheduleNotes: existing.schedule || 'Tuesdays & Thursdays, 6:00 PM – 8:30 PM PKT',
          meetingLink: existing.meetingLink || 'https://meet.google.com/ilm-foundations-live',
          meetingPlatform: existing.meetingPlatform || 'Google Meet',
          meetingPasscode: existing.meetingPasscode || '',
          meetingInstructions: existing.meetingInstructions || 'Meeting link activates 10 minutes prior to scheduled session.',
          campusLocation: existing.campusLocation || 'Ilm Essentials Lahore Campus, DHA Phase 6, Lahore',
          campusRoom: existing.campusRoom || 'Executive Lecture Hall 3 (2nd Floor)',
          venue: existing.venue || (existingClassCat === 'online' ? 'Live Online via Google Meet' : 'DHA Phase 6 Campus, Lahore'),
          fee: isFoundations ? 'Included in Ilm Foundations Program' : (existing.fee || 'PKR 30,000'),
          capacity: existing.capacity || (isFoundations ? 150 : 100),
          status: existing.status || 'Active',
          learningObjectives: existing.learningObjectives || [],
          resources: existing.resources || [],
          modules: existing.modules || [],
        });

        // Load enrolled students for this course in edit mode
        const existingStudentIds = getCourseEnrolledStudentIds(id, existing.category);
        if (Array.isArray(existingStudentIds) && existingStudentIds.length > 0) {
          setSelectedStudentIds(existingStudentIds);
        }
      }
    }
  }, [isEditMode, id, todayStr, defaultEndStr]);

  // Adjust tuition & capacity automatically based on Pathway
  useEffect(() => {
    const selectedPathway = pathways.find((p) => (p.slug || p.id) === formData.category);
    if (!selectedPathway) return;

    // Preserve custom fee or supply sensible default
    setFormData((prev) => {
      const cleanFee = prev.fee && !prev.fee.startsWith('Included in')
        ? prev.fee
        : (selectedPathway.defaultTuitionFee ? `PKR ${selectedPathway.defaultTuitionFee.toLocaleString()}` : 'PKR 30,000');
      return {
        ...prev,
        fee: cleanFee,
        capacity: prev.capacity || (selectedPathway.slug === 'foundations' ? 150 : 100),
      };
    });

    // Auto-select students matching this pathway's program name
    if (selectedPathway.slug === 'foundations' || selectedPathway.type === 'cohort') {
      const matchingIds = allStudents
        .filter((s) => s.program.toLowerCase().includes(selectedPathway.name.toLowerCase()) || (selectedPathway.slug === 'foundations' && s.program.includes('Foundations')))
        .map((s) => s.id);
      if (matchingIds.length > 0) {
        setSelectedStudentIds((prev) => (prev.length === 0 ? matchingIds : prev));
      }
    }
  }, [formData.category, pathways, allStudents]);

  // Warn on browser tab close when dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Helper to mark form as modified
  const updateFormField = useCallback((field, value) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Compute Instructor details
  const activeInstructor = useMemo(() => {
    if (formData.instructorType === 'preset') {
      return (
        PRESET_INSTRUCTORS.find((i) => i.name === formData.selectedPresetInstructor) ||
        PRESET_INSTRUCTORS[0]
      );
    }
    return {
      name: formData.customInstructorName || 'Faculty Scholar',
      title: formData.customInstructorTitle || 'Instructor of Islamic Sciences',
      bio: formData.customInstructorBio || 'Specialized scholar at Ilm Essentials.',
    };
  }, [formData.instructorType, formData.selectedPresetInstructor, formData.customInstructorName, formData.customInstructorTitle, formData.customInstructorBio]);

  // Schedule Days Toggle
  const toggleScheduleDay = (day) => {
    setIsDirty(true);
    setFormData((prev) => {
      const exists = prev.selectedDays.includes(day);
      const updatedDays = exists
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day];

      const daysLabel = updatedDays.length > 0 ? updatedDays.join(' & ') : 'Flexible';
      const autoSchedule = `${daysLabel}, ${prev.startTime} – ${prev.endTime} PKT`;

      return {
        ...prev,
        selectedDays: updatedDays,
        scheduleNotes: autoSchedule,
      };
    });
  };

  const applySchedulePreset = (preset) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      selectedDays: preset.days,
      startTime: preset.startTime,
      endTime: preset.endTime,
      scheduleNotes: preset.label,
    }));
  };

  // Student Roster Filtering & Enrollment Handlers
  const filteredStudentsList = useMemo(() => {
    if (!studentSearchTerm.trim()) return allStudents;
    const term = studentSearchTerm.toLowerCase();
    return allStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        (s.program && s.program.toLowerCase().includes(term))
    );
  }, [allStudents, studentSearchTerm]);

  const handleToggleStudentEnrollment = (studentId) => {
    setIsDirty(true);
    setSelectedStudentIds((prev) => {
      const exists = prev.includes(studentId);
      const updated = exists ? prev.filter((sId) => sId !== studentId) : [...prev, studentId];
      setFormData((f) => ({
        ...f,
        capacity: Math.max(Number(f.capacity) || 100, updated.length + 10),
      }));
      return updated;
    });
  };

  const handleSelectAllStudents = () => {
    setIsDirty(true);
    const visibleIds = filteredStudentsList.map((s) => s.id);
    setSelectedStudentIds((prev) => {
      const set = new Set([...prev, ...visibleIds]);
      const updated = Array.from(set);
      setFormData((f) => ({
        ...f,
        capacity: Math.max(Number(f.capacity) || 100, updated.length + 10),
      }));
      return updated;
    });
  };

  const handleDeselectAllStudents = () => {
    setIsDirty(true);
    const visibleIds = new Set(filteredStudentsList.map((s) => s.id));
    setSelectedStudentIds((prev) => prev.filter((sId) => !visibleIds.has(sId)));
  };

  const handleAddNewStudentToCourse = (e) => {
    e.preventDefault();
    if (!newStudentData.name.trim() || !newStudentData.email.trim()) {
      alert('Please enter student full name and email.');
      return;
    }
    const created = saveStudent({
      ...newStudentData,
      program: formData.category === 'foundations' ? 'Ilm Foundations' : 'Ilm Intensives',
      semester: 'Cohort 2026',
    });
    setAllStudents((prev) => [created, ...prev]);
    setSelectedStudentIds((prev) => [...prev, created.id]);
    setIsDirty(true);
    setIsAddStudentOpen(false);
    setNewStudentData({
      name: '',
      email: '',
      phone: '',
      password: generateTemporaryPassword(),
      mustChangePassword: true,
      format: 'online',
      program: 'Ilm Foundations',
      semester: 'Semester 1',
      feeStatus: 'Paid',
    });
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
      if (formData.category !== 'foundations' && !formData.fee) {
        errors.fee = 'Tuition fee is required';
      }
      if (!formData.capacity || Number(formData.capacity) <= 0) {
        errors.capacity = 'Capacity must be greater than 0';
      }
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Module Management
  const handleAddModule = () => {
    setIsDirty(true);
    const newMod = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `Module ${formData.modules.length + 1}: New Curriculum Module`,
      lessons: [
        {
          id: `les_${Date.now()}_1`,
          title: 'Lesson 1: Introduction to Topic',
          type: 'video',
          duration: '40 min',
          videoUrl: DEFAULT_BUNNY_VIDEO_URL,
          content: '',
          quizQuestions: [],
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
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index),
    }));
  };

  const handleModuleTitleChange = (index, value) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) => (i === index ? { ...m, title: value } : m)),
    }));
  };

  // Lesson Management — Guaranteed exactly 1 lesson added (pure immutable update)
  const handleAddLesson = (moduleIndex) => {
    setIsDirty(true);
    const newLesson = {
      id: `les_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: 'New Lesson',
      type: 'video',
      duration: '45 min',
      videoUrl: DEFAULT_BUNNY_VIDEO_URL,
      lectureNotes: '',
      content: '',
      passingScore: '70%',
      quizQuestions: [],
    };

    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((mod, idx) => {
        if (idx === moduleIndex) {
          return {
            ...mod,
            lessons: [...mod.lessons, newLesson],
          };
        }
        return mod;
      }),
    }));
  };

  const handleDeleteLesson = (moduleIndex, lessonIndex) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((mod, idx) => {
        if (idx === moduleIndex) {
          return {
            ...mod,
            lessons: mod.lessons.filter((_, lIdx) => lIdx !== lessonIndex),
          };
        }
        return mod;
      }),
    }));
  };

  const handleLessonFieldChange = (moduleIndex, lessonIndex, field, value) => {
    setIsDirty(true);
    let finalValue = value;
    if (field === 'videoUrl' && typeof value === 'string' && value.includes('<iframe')) {
      const match = value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
      if (match) {
        finalValue = match[1];
      }
    }

    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((mod, mIdx) => {
        if (mIdx === moduleIndex) {
          return {
            ...mod,
            lessons: mod.lessons.map((les, lIdx) => {
              if (lIdx === lessonIndex) {
                return { ...les, [field]: finalValue };
              }
              return les;
            }),
          };
        }
        return mod;
      }),
    }));
  };

  // Quiz Question Helpers
  const handleAddQuizQuestion = (moduleIndex, lessonIndex) => {
    setIsDirty(true);
    const newQ = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question: 'New question prompt...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
    };
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((mod, mIdx) => {
        if (mIdx === moduleIndex) {
          return {
            ...mod,
            lessons: mod.lessons.map((les, lIdx) => {
              if (lIdx === lessonIndex) {
                return {
                  ...les,
                  quizQuestions: [...(les.quizQuestions || []), newQ],
                };
              }
              return les;
            }),
          };
        }
        return mod;
      }),
    }));
  };

  const handleUpdateQuizQuestion = (moduleIndex, lessonIndex, qIndex, field, value) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((mod, mIdx) => {
        if (mIdx === moduleIndex) {
          return {
            ...mod,
            lessons: mod.lessons.map((les, lIdx) => {
              if (lIdx === lessonIndex) {
                const updatedQ = [...(les.quizQuestions || [])];
                updatedQ[qIndex] = { ...updatedQ[qIndex], [field]: value };
                return { ...les, quizQuestions: updatedQ };
              }
              return les;
            }),
          };
        }
        return mod;
      }),
    }));
  };

  const handleDeleteQuizQuestion = (moduleIndex, lessonIndex, qIndex) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((mod, mIdx) => {
        if (mIdx === moduleIndex) {
          return {
            ...mod,
            lessons: mod.lessons.map((les, lIdx) => {
              if (lIdx === lessonIndex) {
                return {
                  ...les,
                  quizQuestions: (les.quizQuestions || []).filter((_, qi) => qi !== qIndex),
                };
              }
              return les;
            }),
          };
        }
        return mod;
      }),
    }));
  };

  // Objectives Management
  const handleAddObjective = () => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, ''],
    }));
  };

  const handleObjectiveChange = (index, value) => {
    setIsDirty(true);
    setFormData((prev) => {
      const updated = [...prev.learningObjectives];
      updated[index] = value;
      return { ...prev, learningObjectives: updated };
    });
  };

  const handleDeleteObjective = (index) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
    }));
  };

  // Downloadable Handouts & Reading Materials Management
  const handleOpenAddResource = () => {
    setEditingResourceId(null);
    setNewResourceData({
      title: '',
      type: 'pdf',
      size: '1.5 MB',
      downloadUrl: '',
      description: '',
    });
    setIsAddResourceOpen(true);
  };

  const handleOpenEditResource = (res) => {
    setEditingResourceId(res.id);
    setNewResourceData({
      title: res.title || '',
      type: res.type || 'pdf',
      size: res.size || '1.0 MB',
      downloadUrl: res.downloadUrl || '',
      description: res.description || '',
    });
    setIsAddResourceOpen(true);
  };

  const handleSaveResource = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newResourceData.title.trim()) return;

    setIsDirty(true);
    if (editingResourceId) {
      setFormData((prev) => ({
        ...prev,
        resources: (prev.resources || []).map((res) =>
          res.id === editingResourceId
            ? {
                ...res,
                title: newResourceData.title.trim(),
                type: newResourceData.type,
                size: newResourceData.size || '1.2 MB',
                downloadUrl: newResourceData.downloadUrl || '#',
                description: newResourceData.description || '',
              }
            : res
        ),
      }));
    } else {
      const newEntry = {
        id: `res_${Date.now()}`,
        title: newResourceData.title.trim(),
        type: newResourceData.type || 'pdf',
        size: newResourceData.size || '1.2 MB',
        downloadUrl: newResourceData.downloadUrl || '#',
        description: newResourceData.description || '',
      };
      setFormData((prev) => ({
        ...prev,
        resources: [...(prev.resources || []), newEntry],
      }));
    }

    setIsAddResourceOpen(false);
    setEditingResourceId(null);
  };

  const handleDeleteResource = (resId) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      resources: (prev.resources || []).filter((r) => r.id !== resId),
    }));
  };

  const handleFileUploadSimulated = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const formattedSize = `${parseFloat(sizeInMb) > 0 ? sizeInMb : '0.5'} MB`;

    let inferredType = 'pdf';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') inferredType = 'pdf';
    else if (['doc', 'docx'].includes(ext)) inferredType = 'doc';
    else if (['xls', 'xlsx', 'csv'].includes(ext)) inferredType = 'xls';
    else if (['ppt', 'pptx'].includes(ext)) inferredType = 'slides';
    else if (['png', 'jpg', 'jpeg'].includes(ext)) inferredType = 'img';

    const objectUrl = URL.createObjectURL(file);

    setNewResourceData((prev) => ({
      ...prev,
      title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, ''),
      size: formattedSize,
      type: inferredType,
      downloadUrl: objectUrl,
    }));
  };

  // Final Submit / Save Course
  const handleFinalSubmit = (statusOverride) => {
    const isFoundations = formData.category === 'foundations';
    const isOnline = formData.classCategory === 'online';
    const isOnsite = formData.classCategory === 'onsite';
    const isHybrid = formData.classCategory === 'hybrid';

    const courseToSave = {
      id: id || `crs_${Date.now()}`,
      title: formData.title,
      subtitle: formData.subtitle || `${isFoundations ? 'Ilm Foundations' : 'Ilm Intensives'} Certificate`,
      category: formData.category,
      semester: formData.semester || '',
      format: isOnline ? 'live-online' : (isOnsite ? 'on-site' : 'hybrid'),
      classCategory: formData.classCategory,
      level: formData.level,
      description: formData.description,
      color: formData.color,
      instructor: activeInstructor,
      // Institutional rule: Foundations courses are bundled into the master certificate
      fee: isFoundations
        ? 'Included in Ilm Foundations Program'
        : (formData.fee.startsWith('PKR') ? formData.fee : `PKR ${formData.fee}`),
      // Auto-enrollment rule: Student roster selection
      enrolledStudentIds: selectedStudentIds,
      enrolledCount: selectedStudentIds.length,
      capacity: Math.max(Number(formData.capacity) || (isFoundations ? 150 : 100), selectedStudentIds.length + 10),
      status: statusOverride || formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate,
      duration: formData.duration,
      schedule: formData.scheduleNotes,
      meetingLink: (isOnline || isHybrid) ? formData.meetingLink : '',
      meetingPlatform: formData.meetingPlatform,
      meetingPasscode: formData.meetingPasscode,
      meetingInstructions: formData.meetingInstructions,
      campusLocation: (isOnsite || isHybrid) ? formData.campusLocation : '',
      campusRoom: formData.campusRoom,
      venue: isOnline
        ? `Live Online (${formData.meetingPlatform})`
        : isHybrid
        ? `${formData.campusLocation} & Live Online`
        : formData.campusLocation,
      modules: formData.modules,
      resources: formData.resources,
      learningObjectives: formData.learningObjectives.filter((o) => o.trim().length > 0),
    };

    saveCourse(courseToSave);
    setIsDirty(false);
    navigate('/admin');
  };

  // Handle attempt to exit page
  const handleAttemptExit = () => {
    if (isDirty) {
      setIsExitModalOpen(true);
    } else {
      navigate('/admin');
    }
  };

  const steps = [
    { number: 1, title: 'Overview', desc: 'Title, Pathway & Format' },
    { number: 2, title: 'Faculty & Schedule', desc: 'Scholar & Timings' },
    { number: 3, title: 'Tuition & Seats', desc: 'Pricing & Enrollment' },
    { number: 4, title: 'Curriculum', desc: 'Modules, Lessons & Media' },
    { number: 5, title: 'Objectives', desc: 'Outcomes & Downloads' },
    { number: 6, title: 'Review & Publish', desc: 'Verification & Launch' },
  ];

  const totalLessonsCount = formData.modules.flatMap((m) => m.lessons).length;

  return (
    <Layout fullWidth hideNav>
      <div className="min-h-screen bg-sand-50 pb-20">
        {/* Dedicated Admin Header */}
        <header className="bg-primary-950 text-white border-b border-primary-900 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link to="/admin" className="shrink-0 hover:opacity-90 transition-opacity">
                  <img src={logoWhite} alt="ilm essentials" className="h-7 w-auto object-contain" />
                </Link>

                <div className="h-6 w-px bg-white/15 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-gold-500/20 flex items-center justify-center">
                    <Shield className="h-3.5 w-3.5 text-gold-400" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-gold-400 block leading-none">
                      Admin Portal
                    </span>
                    <span className="text-[11px] text-primary-200 block leading-tight mt-0.5">
                      {isEditMode ? 'Curriculum Operations / Update Course' : 'Curriculum Operations / Add New Course'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Exit */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAttemptExit}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
          {/* Header Title Banner */}
          <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
                <GraduationCap size={15} />
                <span>{isEditMode ? 'Edit Existing Course' : 'New Academic Program'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink-900 leading-tight">
                {isEditMode ? `Edit Course: ${formData.title || 'Course'}` : 'Course & Curriculum Builder'}
              </h1>
              <p className="text-xs sm:text-sm text-ink-500 mt-1">
                Configure classical Islamic curriculum, video links, reading materials, interactive quizzes, faculty, and live schedules.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sand-100 text-ink-700 border border-sand-200">
                Step {currentStep} of 6
              </span>
            </div>
          </div>

          {/* Stepper Navigation Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] ${
                    isActive
                      ? 'bg-primary-900 text-white border-primary-950 shadow-sm ring-2 ring-primary-500/20'
                      : isPast
                      ? 'bg-white text-ink-800 border-primary-200 hover:border-primary-400'
                      : 'bg-white/60 text-ink-400 border-sand-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
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
                    {isActive && <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />}
                  </div>
                  <div className="mt-2">
                    <span className={`block text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-ink-900'}`}>
                      {step.title}
                    </span>
                    <span className={`block text-[10px] mt-0.5 truncate ${isActive ? 'text-primary-200' : 'text-ink-400'}`}>
                      {step.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step Form Container */}
          <div className="bg-white rounded-2xl border border-sand-200 shadow-soft p-6 sm:p-8 space-y-6">
            {/* STEP 1: GENERAL OVERVIEW */}
            {currentStep === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="border-b border-sand-100 pb-4">
                  <h2 className="text-lg font-heading font-bold text-ink-900">1. Course General Overview</h2>
                  <p className="text-xs text-ink-500">Provide core course details, pathway category, and student learning level.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateFormField('title', e.target.value)}
                      placeholder="e.g. Usūl al-Fiqh — Principles & Legal Maxims of Islamic Jurisprudence"
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        formErrors.title ? 'border-red-400 bg-red-50/20' : 'border-sand-200 focus:border-primary-600'
                      }`}
                    />
                    {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                      Subtitle / Track Specification
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => updateFormField('subtitle', e.target.value)}
                      placeholder="e.g. Semester 2 — Ilm Foundations Certificate Programme"
                      className="w-full px-4 py-3 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                    />
                  </div>

                  {/* Class Delivery Mode — 3 Categories */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                      Class Delivery Category (3 Categories) *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {CLASS_CATEGORIES.map((cat) => {
                        const isSelected = formData.classCategory === cat.id;
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              updateFormField('classCategory', cat.id);
                              if (cat.id === 'online') {
                                updateFormField('format', 'live-online');
                                updateFormField('venue', 'Live Online via Google Meet');
                              } else if (cat.id === 'onsite') {
                                updateFormField('format', 'on-site');
                                updateFormField('venue', formData.campusLocation || 'DHA Phase 6 Campus, Lahore');
                              } else {
                                updateFormField('format', 'hybrid');
                                updateFormField('venue', `${formData.campusLocation || 'DHA Phase 6 Campus'} & Live Online`);
                              }
                            }}
                            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? cat.activeClass
                                : 'border-sand-200 bg-white hover:border-sand-300 hover:bg-sand-50/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${cat.badgeClass}`}>
                                  <Icon size={13} />
                                  {cat.label}
                                </span>
                                <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-primary-800 bg-primary-800 text-white' : 'border-sand-300'
                                }`}>
                                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-ink-900">{cat.tagline}</div>
                              <p className="text-[11px] text-ink-500 mt-1 leading-snug">{cat.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700">
                          Academic Program / Pathway
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsPathwayModalOpen(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-800 hover:text-primary-950 hover:underline cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>+ New Program</span>
                        </button>
                      </div>
                      <select
                        value={formData.category}
                        onChange={(e) => updateFormField('category', e.target.value)}
                        className="w-full px-3.5 py-3 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 bg-white"
                      >
                        {pathways.map((p) => (
                          <option key={p.id || p.slug} value={p.slug || p.id}>
                            {p.name} {p.subtitle ? `(${p.subtitle})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Program Semester (if multi-semester like Ilm Foundations) or Program Type display */}
                    {(() => {
                      const currentSelected = pathways.find((p) => (p.slug || p.id) === formData.category);
                      const isMultiSemester = currentSelected?.programStructure === 'multi_semester' || currentSelected?.type === 'cohort';

                      if (isMultiSemester) {
                        return (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700">
                                Program Semester *
                              </label>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                Flagship Cohort
                              </span>
                            </div>
                            <select
                              value={formData.semester || 'Semester 1'}
                              onChange={(e) => updateFormField('semester', e.target.value)}
                              className="w-full px-3.5 py-3 border border-emerald-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/20 font-bold text-ink-900"
                            >
                              {(currentSelected?.semesterNames && currentSelected.semesterNames.length > 0
                                ? currentSelected.semesterNames
                                : ['Semester 1', 'Semester 2']
                              ).map((sem) => (
                                <option key={sem} value={sem}>{sem}</option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      return (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                            Program Structure
                          </label>
                          <div className="px-3.5 py-3 border border-sand-200 rounded-xl text-sm bg-sand-50/80 text-ink-700 flex items-center justify-between">
                            <span className="font-semibold text-xs text-amber-900">
                              {currentSelected?.programStructure === 'single_course' ? '📖 Single Standalone Course' : '⚡ Non-Semester Masterclasses'}
                            </span>
                            <span className="text-[11px] text-ink-500">Individual Course Offering</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                        Academic Level
                      </label>
                      <select
                        value={formData.level}
                        onChange={(e) => updateFormField('level', e.target.value)}
                        className="w-full px-3.5 py-3 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 bg-white"
                      >
                        <option value="Beginner">Beginner / Introductory</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced / Scholarly Track</option>
                      </select>
                    </div>

                    {(() => {
                      const currentSelected = pathways.find((p) => (p.slug || p.id) === formData.category);
                      if (!currentSelected) return null;
                      const isMultiSemester = currentSelected.programStructure === 'multi_semester' || currentSelected.type === 'cohort';

                      return (
                        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                          isMultiSemester ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50/80 border-amber-200 text-amber-950'
                        }`}>
                          <Sparkles size={16} className={`${isMultiSemester ? 'text-emerald-700' : 'text-amber-700'} shrink-0 mt-0.5`} />
                          <div>
                            <strong>{currentSelected.name}</strong> {isMultiSemester ? `• ${formData.semester || 'Semester 1'}` : '• Non-Semester Collection'}
                            {isMultiSemester ? (
                              <span className="block mt-0.5 text-[11px] font-medium text-emerald-800">
                                Main Cohort Program: Students enrolled in {formData.semester || 'this semester'} are automatically enrolled. Tuition is included in the program fee.
                              </span>
                            ) : (
                              <span className="block mt-0.5 text-[11px] font-medium text-amber-800">
                                Non-semester collection of individual courses (e.g. Ilm Intensives). Students enroll and pay specifically for this course.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                      Course Visual Theme Accent
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      {THEME_COLORS.map((col) => (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => updateFormField('color', col.value)}
                          className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                            formData.color === col.value
                              ? 'border-primary-900 ring-2 ring-primary-500/30 shadow-xs'
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
                      rows={5}
                      value={formData.description}
                      onChange={(e) => updateFormField('description', e.target.value)}
                      placeholder="Provide a comprehensive academic summary covering syllabus scope, core classical texts examined, methodology, and relevance to the modern student..."
                      className={`w-full px-4 py-3 border rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        formErrors.description ? 'border-red-400 bg-red-50/20' : 'border-sand-200 focus:border-primary-600'
                      }`}
                    />
                    {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: FACULTY & INTERACTIVE CLASS SCHEDULE */}
            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="border-b border-sand-100 pb-4">
                  <h2 className="text-lg font-heading font-bold text-ink-900">2. Faculty Assignment &amp; Class Schedule</h2>
                  <p className="text-xs text-ink-500">Assign the lead scholar, customize class days, timings, and campus venue or online meeting link.</p>
                </div>

                {/* Faculty Selection */}
                <div className="p-5 rounded-2xl bg-sand-50/70 border border-sand-200 space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-800">
                    Lead Scholar / Instructor Selection
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-ink-800 cursor-pointer">
                      <input
                        type="radio"
                        name="instructorType"
                        checked={formData.instructorType === 'preset'}
                        onChange={() => updateFormField('instructorType', 'preset')}
                        className="text-primary-700 focus:ring-primary-500"
                      />
                      Select Existing Faculty
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-ink-800 cursor-pointer">
                      <input
                        type="radio"
                        name="instructorType"
                        checked={formData.instructorType === 'custom'}
                        onChange={() => updateFormField('instructorType', 'custom')}
                        className="text-primary-700 focus:ring-primary-500"
                      />
                      Add Custom Scholar
                    </label>
                  </div>

                  {formData.instructorType === 'preset' ? (
                    <div className="space-y-3">
                      <select
                        value={formData.selectedPresetInstructor}
                        onChange={(e) => updateFormField('selectedPresetInstructor', e.target.value)}
                        className="w-full px-4 py-3 border border-sand-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        {PRESET_INSTRUCTORS.map((inst) => (
                          <option key={inst.name} value={inst.name}>
                            {inst.name} — {inst.title}
                          </option>
                        ))}
                      </select>
                      <div className="p-3.5 bg-white rounded-xl border border-sand-200 text-xs text-ink-600 space-y-1">
                        <span className="font-bold text-primary-900 block">{activeInstructor.name} ({activeInstructor.title})</span>
                        <p className="leading-relaxed">{activeInstructor.bio}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <input
                        type="text"
                        placeholder="Scholar's Full Name (e.g. Sheikh Dr. Ahmad Al-Qadri)"
                        value={formData.customInstructorName}
                        onChange={(e) => updateFormField('customInstructorName', e.target.value)}
                        className="w-full px-4 py-2.5 border border-sand-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                      <input
                        type="text"
                        placeholder="Academic Credentials / Title (e.g. Graduate of Islamic University of Madinah)"
                        value={formData.customInstructorTitle}
                        onChange={(e) => updateFormField('customInstructorTitle', e.target.value)}
                        className="w-full px-4 py-2.5 border border-sand-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                      <textarea
                        rows={3}
                        placeholder="Brief scholar background, teaching experience, and classical Ijazahs..."
                        value={formData.customInstructorBio}
                        onChange={(e) => updateFormField('customInstructorBio', e.target.value)}
                        className="w-full px-4 py-2.5 border border-sand-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  )}
                </div>

                {/* 1. Course Specific Dates & Duration */}
                <div className="p-5 rounded-2xl bg-white border border-sand-300 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary-700" />
                      <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">
                        Course Academic Dates &amp; Duration
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sand-100 text-ink-700">
                      Independent Course Timeline
                    </span>
                  </div>

                  <p className="text-xs text-ink-500 leading-relaxed">
                    Set the starting and ending dates for this course. While the master Ilm Foundations program spans 8 months, individual courses have specific start/end dates and session durations.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                        Starting Date *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          updateFormField('startDate', newStart);
                          if (formData.endDate) {
                            const autoDur = calculateCourseDuration(newStart, formData.endDate);
                            if (autoDur) updateFormField('duration', autoDur);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                        Ending Date *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          updateFormField('endDate', newEnd);
                          if (formData.startDate) {
                            const autoDur = calculateCourseDuration(formData.startDate, newEnd);
                            if (autoDur) updateFormField('duration', autoDur);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                        Duration (Weeks / Months)
                      </label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => updateFormField('duration', e.target.value)}
                        placeholder="e.g. 8 Weeks, 16 Sessions"
                        className="w-full px-4 py-2.5 border border-sand-200 rounded-xl text-sm font-semibold text-primary-950 bg-sand-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Interactive Schedule & Timings Configurator */}
                <div className="p-5 rounded-2xl bg-white border border-sand-300 space-y-5">
                  <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-primary-700" />
                      <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">
                        Interactive Class Schedule &amp; Timings
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sand-100 text-ink-600">
                      PKT (UTC+5)
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-2">
                      Quick Schedule Presets:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SCHEDULE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applySchedulePreset(preset)}
                          className="px-3 py-2 rounded-xl border border-sand-200 hover:border-primary-400 hover:bg-primary-50/50 text-left text-xs font-medium text-ink-800 transition-all cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Day Chooser */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                      Select Class Days:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = formData.selectedDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleScheduleDay(day)}
                            className={`w-12 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-primary-900 text-white border-primary-950 shadow-xs'
                                : 'bg-sand-50 text-ink-600 border-sand-200 hover:bg-sand-100'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                        Session Start Time
                      </label>
                      <input
                        type="text"
                        value={formData.startTime}
                        onChange={(e) => {
                          updateFormField('startTime', e.target.value);
                          updateFormField(
                            'scheduleNotes',
                            `${formData.selectedDays.join(' & ')}, ${e.target.value} – ${formData.endTime} PKT`
                          );
                        }}
                        placeholder="e.g. 06:00 PM"
                        className="w-full px-4 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                        Session End Time
                      </label>
                      <input
                        type="text"
                        value={formData.endTime}
                        onChange={(e) => {
                          updateFormField('endTime', e.target.value);
                          updateFormField(
                            'scheduleNotes',
                            `${formData.selectedDays.join(' & ')}, ${formData.startTime} – ${e.target.value} PKT`
                          );
                        }}
                        placeholder="e.g. 08:30 PM"
                        className="w-full px-4 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>

                  {/* Formatted Schedule Summary Preview */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                      Formatted Schedule Description (Shown to Students)
                    </label>
                    <input
                      type="text"
                      value={formData.scheduleNotes}
                      onChange={(e) => updateFormField('scheduleNotes', e.target.value)}
                      placeholder="e.g. Tuesdays & Thursdays, 6:00 PM – 8:30 PM PKT"
                      className="w-full px-4 py-2.5 border border-sand-200 rounded-xl text-sm font-semibold bg-sand-50/50 text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                {/* 3. Delivery Details: Meeting Link (Online/Hybrid) & Venue (Onsite/Hybrid) */}
                {(formData.classCategory === 'online' || formData.classCategory === 'hybrid') && (
                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Video size={16} className="text-emerald-700" />
                        <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
                          Live Online Class Meeting Link &amp; Platform
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Live Notifications Active
                      </span>
                    </div>

                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Students enrolled in this course will receive notifications before each scheduled class with this meeting link, allowing them to join the live session with one click.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                          Live Class Meeting Link (Google Meet / Zoom URL) *
                        </label>
                        <div className="relative">
                          <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                          <input
                            type="url"
                            value={formData.meetingLink}
                            onChange={(e) => updateFormField('meetingLink', e.target.value)}
                            placeholder="https://meet.google.com/abc-defg-hij or Zoom meeting link"
                            className="w-full pl-9 pr-24 py-2.5 border border-sand-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          {formData.meetingLink && (
                            <a
                              href={formData.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                            >
                              Test <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                          Meeting Platform
                        </label>
                        <select
                          value={formData.meetingPlatform}
                          onChange={(e) => updateFormField('meetingPlatform', e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-sand-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {MEETING_PLATFORMS.map((plat) => (
                            <option key={plat} value={plat}>
                              {plat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                          Meeting Passcode / PIN (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.meetingPasscode}
                          onChange={(e) => updateFormField('meetingPasscode', e.target.value)}
                          placeholder="e.g. ilm2026 or leave blank if no passcode"
                          className="w-full px-3.5 py-2.5 border border-sand-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                          Class Join Instructions for Students
                        </label>
                        <input
                          type="text"
                          value={formData.meetingInstructions}
                          onChange={(e) => updateFormField('meetingInstructions', e.target.value)}
                          placeholder="e.g. Join with mic muted. Q&A at the end."
                          className="w-full px-3.5 py-2.5 border border-sand-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(formData.classCategory === 'onsite' || formData.classCategory === 'hybrid') && (
                  <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-amber-800" />
                        <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wider">
                          Physical Campus Classroom Venue &amp; Location
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        On-Campus DHA Lahore
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                          Campus Location / Building Address *
                        </label>
                        <input
                          type="text"
                          value={formData.campusLocation}
                          onChange={(e) => updateFormField('campusLocation', e.target.value)}
                          placeholder="e.g. Ilm Essentials Campus, DHA Phase 6, Lahore"
                          className="w-full px-4 py-2.5 border border-sand-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                          Classroom / Lecture Hall Specification
                        </label>
                        <input
                          type="text"
                          value={formData.campusRoom}
                          onChange={(e) => updateFormField('campusRoom', e.target.value)}
                          placeholder="e.g. Executive Lecture Hall 3 (2nd Floor)"
                          className="w-full px-4 py-2.5 border border-sand-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: TUITION & SEAT CAPACITY */}
            {currentStep === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="border-b border-sand-100 pb-4">
                  <h2 className="text-lg font-heading font-bold text-ink-900">3. Tuition &amp; Enrollment Settings</h2>
                  <p className="text-xs text-ink-500">
                    Configure individual course tuition fee, student capacity, and publication status. (Fees vary course-by-course across all programs).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                      {formData.category === 'foundations'
                        ? 'Semester Tuition Fee (PKR) *'
                        : 'Course Tuition Fee (PKR) *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-500">
                        PKR
                      </span>
                      <input
                        type="text"
                        value={formData.fee}
                        onChange={(e) => updateFormField('fee', e.target.value.replace(/[^0-9,]/g, ''))}
                        placeholder="30,000"
                        className="w-full pl-14 pr-4 py-3 border border-sand-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <p className="text-[11px] text-ink-400 mt-1">
                      {formData.category === 'foundations'
                        ? 'PKR 30,000 is the tuition fee for the whole semester, covering all courses in this cohort.'
                        : 'Tuition fee for this individual standalone course.'}
                    </p>
                    {formErrors.fee && <p className="text-red-500 text-xs mt-1">{formErrors.fee}</p>}
                  </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                        Maximum Student Capacity *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">
                          <Users size={16} />
                        </span>
                        <input
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => updateFormField('capacity', e.target.value)}
                          placeholder="100"
                          className="w-full pl-11 pr-4 py-3 border border-sand-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                      {formErrors.capacity && <p className="text-red-500 text-xs mt-1">{formErrors.capacity}</p>}
                    </div>
                  </div>

                {/* INTERACTIVE STUDENT ROSTER ENROLLMENT (Requirement 1 & 2) */}
                <div className="p-5 rounded-2xl bg-white border border-sand-300 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users size={17} className="text-primary-700" />
                        <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">
                          Course Student Enrollment Roster
                        </h3>
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {formData.category === 'foundations'
                          ? 'Foundations cohort students are automatically selected below. You can deselect anyone or add new students directly.'
                          : 'Select which students to enroll into this course, or add a new student to the roster.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
                        <UserCheck size={14} className="text-emerald-700" />
                        <span>{selectedStudentIds.length} Enrolled</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddStudentOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <UserPlus size={13} />
                        <span>Add Student</span>
                      </button>
                    </div>
                  </div>

                  {/* Search and Bulk Select Tools */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                      <input
                        type="text"
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        placeholder="Filter by name, email, or track..."
                        className="w-full pl-8 pr-3 py-2 border border-sand-200 rounded-xl text-xs bg-sand-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={handleSelectAllStudents}
                        className="px-2.5 py-1 rounded-lg border border-sand-200 hover:bg-sand-50 text-ink-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckSquare size={12} className="text-primary-700" />
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllStudents}
                        className="px-2.5 py-1 rounded-lg border border-sand-200 hover:bg-sand-50 text-ink-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Square size={12} className="text-ink-400" />
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Student Table */}
                  <div className="overflow-x-auto rounded-xl border border-sand-200 max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-sand-100/80 text-ink-700 uppercase font-bold sticky top-0 z-10 border-b border-sand-200">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">Enroll</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Registered Program</th>
                          <th className="py-2.5 px-3">Mode</th>
                          <th className="py-2.5 px-3">Fee Status</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand-100">
                        {filteredStudentsList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-ink-400">
                              No students found matching your search.
                            </td>
                          </tr>
                        ) : (
                          filteredStudentsList.map((std) => {
                            const isEnrolled = selectedStudentIds.includes(std.id);
                            return (
                              <tr
                                key={std.id}
                                onClick={() => handleToggleStudentEnrollment(std.id)}
                                className={`transition-colors cursor-pointer select-none ${
                                  isEnrolled ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'hover:bg-sand-50/60 opacity-60'
                                }`}
                              >
                                <td className="py-2.5 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isEnrolled}
                                    onChange={() => {}} // handled by row onClick
                                    className="h-4 w-4 rounded text-primary-700 focus:ring-primary-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-ink-900">{std.name}</div>
                                  <div className="text-[11px] text-ink-500">{std.email}</div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="font-medium text-ink-800">{std.program}</span>
                                  <span className="block text-[10px] text-ink-400">{std.semester || 'Cohort 2026'}</span>
                                </td>
                                <td className="py-2.5 px-3 capitalize text-ink-700">
                                  {std.format || 'Online'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      std.feeStatus === 'Paid'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {std.feeStatus || 'Paid'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                      isEnrolled
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-sand-200 text-ink-600'
                                    }`}
                                  >
                                    {isEnrolled ? '✓ Enrolled' : 'Excluded'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                    Publication Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'Active', title: 'Active & Open', desc: 'Accepting student enrollments immediately' },
                      { key: 'Upcoming', title: 'Upcoming', desc: 'Listed on schedules, admissions opening soon' },
                      { key: 'Draft', title: 'Draft Mode', desc: 'Staged for faculty review, hidden from students' },
                    ].map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => updateFormField('status', st.key)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          formData.status === st.key
                            ? 'border-primary-900 bg-primary-50/70 ring-1 ring-primary-700 shadow-xs'
                            : 'border-sand-200 hover:bg-sand-50'
                        }`}
                      >
                        <span className="block text-xs font-bold text-ink-900">{st.title}</span>
                        <span className="block text-[11px] text-ink-500 mt-1 leading-relaxed">{st.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: CURRICULUM BUILDER & LESSON CONTENT (VIDEO, READING, QUIZ) */}
            {currentStep === 4 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-100 pb-4">
                  <div>
                    <h2 className="text-lg font-heading font-bold text-ink-900">4. Interactive Curriculum Builder &amp; Lesson Media</h2>
                    <p className="text-xs text-ink-500">
                      Organize modules, specify video lecture streaming links, write classical reading texts, or assemble interactive quizzes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-900 text-white text-xs font-bold hover:bg-primary-800 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus size={14} />
                    Add Module
                  </button>
                </div>

                <div className="space-y-5">
                  {formData.modules.map((mod, modIdx) => {
                    const isExpanded = expandedModules[modIdx] ?? false;
                    return (
                      <div key={mod.id} className="border border-sand-300 rounded-2xl bg-white overflow-hidden shadow-xs">
                        {/* Module Accordion Bar */}
                        <div className="flex items-center justify-between px-5 py-4 bg-sand-50/80 border-b border-sand-200">
                          <div className="flex items-center gap-3 flex-1 mr-3">
                            <button
                              type="button"
                              onClick={() => setExpandedModules({ ...expandedModules, [modIdx]: !isExpanded })}
                              className="text-ink-500 hover:text-ink-900 cursor-pointer p-0.5"
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            <input
                              type="text"
                              value={mod.title}
                              onChange={(e) => handleModuleTitleChange(modIdx, e.target.value)}
                              className="flex-1 font-bold text-sm text-ink-900 bg-transparent border-b border-transparent hover:border-sand-300 focus:border-primary-600 focus:outline-none py-0.5"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sand-200 text-ink-700">
                              {mod.lessons.length} Lessons
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteModule(modIdx)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Module"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Lessons inside Module */}
                        {isExpanded && (
                          <div className="p-5 space-y-4 bg-sand-50/30">
                            {mod.lessons.map((lesson, lesIdx) => {
                              const isEditorOpen =
                                activeLessonEditor?.modIdx === modIdx &&
                                activeLessonEditor?.lesIdx === lesIdx;

                              return (
                                <div
                                  key={lesson.id}
                                  className="rounded-xl bg-white border border-sand-200 text-xs shadow-xs overflow-hidden"
                                >
                                  {/* Lesson Header Row */}
                                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <span className="font-bold text-ink-400 w-6 text-center">
                                        {lesIdx + 1}.
                                      </span>
                                      <input
                                        type="text"
                                        value={lesson.title}
                                        onChange={(e) =>
                                          handleLessonFieldChange(modIdx, lesIdx, 'title', e.target.value)
                                        }
                                        placeholder="Lesson Title"
                                        className="flex-1 font-semibold text-ink-900 border-none bg-transparent focus:outline-none text-xs sm:text-sm"
                                      />
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                      <select
                                        value={lesson.type}
                                        onChange={(e) =>
                                          handleLessonFieldChange(modIdx, lesIdx, 'type', e.target.value)
                                        }
                                        className="px-2.5 py-1.5 rounded-lg border border-sand-200 bg-sand-50 text-xs font-semibold text-ink-700 focus:outline-none"
                                      >
                                        <option value="video">Video Lecture</option>
                                        <option value="reading">Reading Text</option>
                                        <option value="assessment">Quiz / Assessment</option>
                                      </select>

                                      <input
                                        type="text"
                                        value={lesson.duration}
                                        onChange={(e) =>
                                          handleLessonFieldChange(modIdx, lesIdx, 'duration', e.target.value)
                                        }
                                        placeholder="Duration"
                                        className="w-20 px-2.5 py-1.5 rounded-lg border border-sand-200 bg-sand-50 text-xs font-semibold text-center focus:outline-none"
                                      />

                                      {/* Content Drawer Toggle */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveLessonEditor(
                                            isEditorOpen ? null : { modIdx, lesIdx }
                                          )
                                        }
                                        className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                          isEditorOpen
                                            ? 'bg-primary-900 text-white'
                                            : 'bg-sand-100 hover:bg-sand-200 text-ink-700'
                                        }`}
                                      >
                                        <Edit2 size={12} />
                                        <span>Content</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLesson(modIdx, lesIdx)}
                                        className="p-1.5 text-ink-400 hover:text-red-500 transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Detailed Content Configuration Drawer */}
                                  {isEditorOpen && (
                                    <div className="border-t border-sand-200 p-4 bg-sand-50/60 space-y-4">
                                      {/* LIVE CLASS MEETING LINK (for Online & Hybrid courses) */}
                                      {(formData.classCategory === 'online' || formData.classCategory === 'hybrid') && (
                                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                                              <Video size={13} className="text-emerald-700" />
                                              <span>Live Class Session Meeting Link (Google Meet / Zoom)</span>
                                            </div>
                                            {formData.meetingLink && (
                                              <button
                                                type="button"
                                                onClick={() => handleLessonFieldChange(modIdx, lesIdx, 'meetingLink', formData.meetingLink)}
                                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                                              >
                                                Use Course Default Link
                                              </button>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                              <input
                                                type="url"
                                                value={lesson.meetingLink || ''}
                                                onChange={(e) => handleLessonFieldChange(modIdx, lesIdx, 'meetingLink', e.target.value)}
                                                placeholder={formData.meetingLink || 'https://meet.google.com/...'}
                                                className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                              />
                                            </div>
                                            <div>
                                              <input
                                                type="text"
                                                value={lesson.sessionSchedule || ''}
                                                onChange={(e) => handleLessonFieldChange(modIdx, lesIdx, 'sessionSchedule', e.target.value)}
                                                placeholder="e.g. Tuesday, 6:00 PM PKT"
                                                className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                              />
                                            </div>
                                          </div>
                                          <span className="text-[10px] text-emerald-700 block">
                                            Students will see a "Join Live Class" button in this lesson and get notified with this direct URL.
                                          </span>
                                        </div>
                                      )}

                                      {/* VIDEO LECTURE CONTENT */}
                                      {lesson.type === 'video' && (
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 text-xs font-bold text-primary-900">
                                            <Video size={14} />
                                            <span>Video Lecture Details &amp; Streaming Link</span>
                                          </div>
                                          <div>
                                            <label className="block text-[11px] font-semibold text-ink-600 mb-1">
                                              Video Stream / Embed URL (Bunny.net Stream, YouTube, Vimeo, or MP4)
                                            </label>
                                            <input
                                              type="text"
                                              value={lesson.videoUrl || ''}
                                              onChange={(e) =>
                                                handleLessonFieldChange(modIdx, lesIdx, 'videoUrl', e.target.value)
                                              }
                                              placeholder="Paste Bunny.net iframe code or https://player.mediadelivery.net/play/800132/..."
                                              className="w-full px-3 py-2 border border-sand-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                            />
                                            <div className="flex items-center justify-between text-[11px] text-ink-500 mt-1">
                                              <span>Paste either the full <strong>&lt;iframe&gt;</strong> code or the direct video link.</span>
                                              {lesson.videoUrl?.includes('mediadelivery.net') && (
                                                <span className="text-primary-800 font-semibold bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                                                  ✓ Bunny.net Stream
                                                </span>
                                              )}
                                              {lesson.videoUrl?.includes('youtu') && (
                                                <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                                  ✓ YouTube Video
                                                </span>
                                              )}
                                              {lesson.videoUrl?.includes('vimeo') && (
                                                <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                  ✓ Vimeo Video
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-[11px] font-semibold text-ink-600 mb-1">
                                              Lecture Synopsis / Classical Commentary Timestamps
                                            </label>
                                            <textarea
                                              rows={3}
                                              value={lesson.lectureNotes || ''}
                                              onChange={(e) =>
                                                handleLessonFieldChange(modIdx, lesIdx, 'lectureNotes', e.target.value)
                                              }
                                              placeholder="Summary of topics covered, classical references, and key timestamps..."
                                              className="w-full px-3 py-2 border border-sand-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* READING TEXT CONTENT */}
                                      {lesson.type === 'reading' && (
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 text-xs font-bold text-primary-900">
                                            <BookOpen size={14} />
                                            <span>Full Reading Text &amp; Scholarly Exegesis</span>
                                          </div>
                                          <div>
                                            <label className="block text-[11px] font-semibold text-ink-600 mb-1">
                                              Reading Material / Text Content (Shown in Student Room)
                                            </label>
                                            <textarea
                                              rows={6}
                                              value={lesson.content || ''}
                                              onChange={(e) =>
                                                handleLessonFieldChange(modIdx, lesIdx, 'content', e.target.value)
                                              }
                                              placeholder="Paste or write the complete reading text, classical Arabic citations, English translations, and explanatory notes for students..."
                                              className="w-full px-3.5 py-2.5 border border-sand-300 rounded-lg text-xs leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-sans"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* ASSESSMENT / QUIZ BUILDER */}
                                      {lesson.type === 'assessment' && (
                                        <div className="space-y-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-bold text-primary-900">
                                              <FileCheck size={14} />
                                              <span>Quiz Assessment Questions</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleAddQuizQuestion(modIdx, lesIdx)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-900 text-white text-[11px] font-bold hover:bg-primary-800 transition-colors cursor-pointer"
                                            >
                                              <Plus size={11} />
                                              Add Question
                                            </button>
                                          </div>

                                          {/* Quiz Questions List */}
                                          {(!lesson.quizQuestions || lesson.quizQuestions.length === 0) ? (
                                            <div className="p-3 text-center border border-dashed border-sand-300 rounded-lg text-ink-500 text-xs">
                                              No quiz questions added yet. Click &quot;Add Question&quot; to build the assessment.
                                            </div>
                                          ) : (
                                            lesson.quizQuestions.map((q, qIdx) => (
                                              <div
                                                key={q.id || qIdx}
                                                className="p-3.5 bg-white border border-sand-200 rounded-xl space-y-3"
                                              >
                                                <div className="flex items-center justify-between gap-2">
                                                  <span className="font-bold text-ink-800 text-xs">
                                                    Question {qIdx + 1}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteQuizQuestion(modIdx, lesIdx, qIdx)}
                                                    className="p-1 text-ink-400 hover:text-red-500 transition-colors cursor-pointer"
                                                  >
                                                    <Trash2 size={13} />
                                                  </button>
                                                </div>

                                                <input
                                                  type="text"
                                                  value={q.question}
                                                  onChange={(e) =>
                                                    handleUpdateQuizQuestion(modIdx, lesIdx, qIdx, 'question', e.target.value)
                                                  }
                                                  placeholder="Enter question text..."
                                                  className="w-full px-3 py-1.5 border border-sand-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                                />

                                                <div className="space-y-1.5">
                                                  <span className="text-[10px] font-bold text-ink-500 uppercase block">
                                                    Answer Options (Select the correct answer):
                                                  </span>
                                                  {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex items-center gap-2">
                                                      <input
                                                        type="radio"
                                                        name={`correct_${modIdx}_${lesIdx}_${qIdx}`}
                                                        checked={q.correctIndex === optIdx}
                                                        onChange={() =>
                                                          handleUpdateQuizQuestion(modIdx, lesIdx, qIdx, 'correctIndex', optIdx)
                                                        }
                                                        className="text-primary-700 focus:ring-primary-500 cursor-pointer"
                                                        title="Mark as correct answer"
                                                      />
                                                      <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                          const newOpts = [...q.options];
                                                          newOpts[optIdx] = e.target.value;
                                                          handleUpdateQuizQuestion(modIdx, lesIdx, qIdx, 'options', newOpts);
                                                        }}
                                                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                        className="flex-1 px-2.5 py-1 border border-sand-200 rounded-md text-xs focus:outline-none"
                                                      />
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Add Lesson Button: strictly adds 1 lesson */}
                            <button
                              type="button"
                              onClick={() => handleAddLesson(modIdx)}
                              className="w-full py-2.5 border border-dashed border-primary-300 hover:border-primary-500 bg-primary-50/50 text-primary-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-3"
                            >
                              <Plus size={14} />
                              Add Lesson to Module {modIdx + 1}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 5: OBJECTIVES & RESOURCES */}
            {currentStep === 5 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="border-b border-sand-100 pb-4">
                  <h2 className="text-lg font-heading font-bold text-ink-900">5. Learning Objectives &amp; Study Materials</h2>
                  <p className="text-xs text-ink-500">Highlight key educational outcomes and attach course handouts or syllabus PDFs.</p>
                </div>

                {/* Learning Objectives */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block">
                      Learning Objectives (Key Takeaways)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddObjective}
                      className="text-xs text-primary-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Add Objective
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formData.learningObjectives.map((obj, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                          ✓
                        </span>
                        <input
                          type="text"
                          value={obj}
                          onChange={(e) => handleObjectiveChange(i, e.target.value)}
                          placeholder={`Objective ${i + 1}`}
                          className="flex-1 px-3.5 py-2.5 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteObjective(i)}
                          className="p-2 text-ink-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Downloadable Handouts & Reading Materials */}
                <div className="pt-6 border-t border-sand-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-ink-900 block flex items-center gap-1.5">
                        <BookOpen size={14} className="text-primary-800" />
                        Downloadable Handouts &amp; Reading Materials
                      </label>
                      <p className="text-xs text-ink-500">
                        Attach classical texts, syllabus roadmaps, lecture slides, or supplementary reading handouts for enrolled students.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddResource}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-900 hover:bg-primary-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      Add Handout / Reading Material
                    </button>
                  </div>

                  {/* List of Resources */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(formData.resources || []).map((res) => {
                      const isPdf = res.type === 'pdf';
                      const isDoc = res.type === 'doc';
                      const isXls = res.type === 'xls';
                      const isSlides = res.type === 'slides';
                      const isImg = res.type === 'img';

                      const typeColor = isPdf
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : isDoc
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : isXls
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isSlides
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : isImg
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-sand-100 text-ink-700 border-sand-200';

                      const TypeIcon = isPdf || isDoc
                        ? FileText
                        : isXls
                        ? FileSpreadsheet
                        : isImg
                        ? FileImage
                        : File;

                      return (
                        <div
                          key={res.id}
                          className="p-3.5 rounded-xl border border-sand-200 bg-white hover:border-sand-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`p-2 rounded-lg border shrink-0 ${typeColor}`}>
                                <TypeIcon size={18} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-ink-900 leading-snug line-clamp-1">
                                  {res.title}
                                </h4>
                                {res.description && (
                                  <p className="text-[11px] text-ink-500 line-clamp-1 mt-0.5">
                                    {res.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${typeColor}`}>
                                    {res.type?.toUpperCase() || 'FILE'}
                                  </span>
                                  <span className="text-[11px] text-ink-400">
                                    {res.size || '1.0 MB'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditResource(res)}
                                className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
                                title="Edit handout details"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteResource(res.id)}
                                className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove this handout"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {res.downloadUrl && res.downloadUrl !== '#' && (
                            <div className="pt-2 border-t border-sand-100 flex items-center justify-between text-[11px]">
                              <span className="text-ink-400 truncate max-w-[200px]" title={res.downloadUrl}>
                                {res.downloadUrl.startsWith('blob:') ? 'Local file attached' : res.downloadUrl.replace('https://', '')}
                              </span>
                              <a
                                href={res.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-800 hover:underline font-semibold inline-flex items-center gap-1 shrink-0"
                              >
                                Preview / Test Link <ExternalLink size={10} />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(!formData.resources || formData.resources.length === 0) && (
                      <div className="col-span-full py-8 px-4 rounded-xl border border-dashed border-sand-300 text-center space-y-2 bg-sand-50/50">
                        <FileText size={24} className="mx-auto text-ink-300" />
                        <div className="text-xs font-semibold text-ink-700">
                          No downloadable handouts or reading materials added yet
                        </div>
                        <p className="text-[11px] text-ink-400 max-w-sm mx-auto">
                          Click "+ Add Handout / Reading Material" above to attach syllabus PDFs, classical texts, or lecture notes for this course.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: REVIEW & LIVE PREVIEW */}
            {currentStep === 6 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="border-b border-sand-100 pb-4">
                  <h2 className="text-lg font-heading font-bold text-ink-900">6. Final Review &amp; Publication</h2>
                  <p className="text-xs text-ink-500">Verify course dates, delivery mode, class schedule, and meeting link before launching.</p>
                </div>

                <div className="bg-sand-50 border border-sand-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                        Live Student Catalog Preview
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      formData.classCategory === 'hybrid'
                        ? 'bg-purple-100 text-purple-900 border-purple-200'
                        : formData.classCategory === 'onsite'
                        ? 'bg-amber-100 text-amber-900 border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                    }`}>
                      {formData.classCategory === 'hybrid'
                        ? 'ONLINE & ONSITE (BOTH)'
                        : formData.classCategory === 'onsite'
                        ? 'ONSITE CAMPUS'
                        : 'ONLINE'}
                    </span>
                  </div>

                  {/* Simulated Student Course Card */}
                  <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary-800">
                      <GraduationCap size={16} />
                      <span>{formData.subtitle || 'Ilm Essentials Classical Sciences Curriculum'}</span>
                    </div>

                    <h3 className="font-heading text-2xl font-bold text-ink-900 leading-tight">
                      {formData.title || 'Course Title Preview'}
                    </h3>

                    <p className="text-sm text-ink-600 line-clamp-2 leading-relaxed">
                      {formData.description || 'Course overview details...'}
                    </p>

                    {/* Course Specific Duration & Dates */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sand-100 text-xs font-semibold text-ink-800 border border-sand-200">
                        <Calendar size={13} className="text-primary-700" />
                        <span>
                          {formData.startDate} {formData.endDate ? `– ${formData.endDate}` : ''} ({formData.duration})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sand-100 text-xs font-semibold text-ink-800 border border-sand-200">
                        <Clock size={13} className="text-primary-700" />
                        <span>{formData.scheduleNotes}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-sand-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-ink-400 block font-bold uppercase">INSTRUCTOR</span>
                        <span className="font-bold text-ink-900 text-sm">{activeInstructor.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-400 block font-bold uppercase">CURRICULUM</span>
                        <span className="font-bold text-ink-900 text-sm">
                          {formData.modules.length} Modules • {totalLessonsCount} Lessons
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-400 block font-bold uppercase">TUITION</span>
                        <span className="font-bold text-primary-900 text-sm">
                          PKR {formData.fee ? formData.fee.replace(/^PKR\s*/i, '') : '0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-400 block font-bold uppercase">ENROLLED COHORT</span>
                        <span className="font-bold text-emerald-800 text-sm">
                          {selectedStudentIds.length} Students ({formData.capacity} Seats)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Mode & Meeting / Campus details review */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {(formData.classCategory === 'online' || formData.classCategory === 'hybrid') && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-900 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Video size={12} />
                          Live Class Meeting Link ({formData.meetingPlatform})
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Auto Student Notifications
                        </span>
                      </div>
                      <div className="text-primary-950 truncate text-xs font-semibold bg-white p-2 rounded-lg border border-primary-200">
                        {formData.meetingLink || 'No link configured'}
                      </div>
                      {formData.meetingInstructions && (
                        <p className="text-[11px] text-emerald-800">{formData.meetingInstructions}</p>
                      )}
                    </div>
                  )}

                  {(formData.classCategory === 'onsite' || formData.classCategory === 'hybrid') && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
                      <span className="text-amber-900 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <MapPin size={12} />
                        Physical Campus Classroom Venue
                      </span>
                      <div className="font-bold text-amber-950 text-xs bg-white p-2 rounded-lg border border-amber-200">
                        {formData.campusLocation}
                        {formData.campusRoom && <span className="block text-ink-600 font-normal">{formData.campusRoom}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Handouts & Reading Materials Review */}
                <div className="p-4 bg-sand-50 rounded-xl border border-sand-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-900 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <FileText size={13} className="text-primary-800" />
                      Course Handouts &amp; Reading Materials ({formData.resources?.length || 0})
                    </span>
                    <span className="text-[11px] text-ink-500">
                      Downloadable in Student Room
                    </span>
                  </div>
                  {formData.resources?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {formData.resources.map((r) => (
                        <div key={r.id} className="p-2.5 rounded-lg bg-white border border-sand-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-sand-100 text-ink-700">
                              {r.type}
                            </span>
                            <span className="font-medium text-ink-900 truncate">{r.title}</span>
                          </div>
                          <span className="text-[11px] text-ink-400 shrink-0">{r.size}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-500 italic">No downloadable handouts attached.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Stepper Footer Controls */}
            <div className="pt-6 border-t border-sand-200 flex items-center justify-between">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={handleBack}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  currentStep === 1
                    ? 'opacity-30 cursor-not-allowed text-ink-400'
                    : 'text-ink-700 hover:bg-sand-100 border border-sand-200'
                }`}
              >
                <ChevronLeft size={16} />
                Previous Step
              </button>

              <div className="flex items-center gap-3">
                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Continue to Next Step
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleFinalSubmit('Draft')}
                      className="px-5 py-3 rounded-xl border border-sand-300 text-ink-700 hover:bg-sand-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFinalSubmit('Active')}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-primary-950 text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <Sparkles size={15} />
                      {isEditMode ? 'Update & Save Course' : 'Publish & Launch Course'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unsaved Changes Confirmation Modal */}
        <AnimatePresence>
          {isExitModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-md w-full border border-sand-200 p-6 shadow-elevated space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gold-100 text-gold-800 flex items-center justify-center shrink-0">
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-ink-900 text-base">
                      Unsaved Course Changes
                    </h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      You have changes in progress. How would you like to proceed?
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit('Active')}
                    className="w-full py-2.5 px-4 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={14} />
                    Publish &amp; Leave
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinalSubmit('Draft')}
                    className="w-full py-2.5 px-4 rounded-xl bg-gold-500 hover:bg-gold-400 text-primary-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save size={14} />
                    Save as Draft &amp; Leave
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(false);
                      setIsExitModalOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full py-2 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Discard Changes &amp; Leave
                  </button>
                </div>

                <div className="pt-2 border-t border-sand-100 text-center">
                  <button
                    type="button"
                    onClick={() => setIsExitModalOpen(false)}
                    className="text-xs text-ink-500 hover:text-ink-800 font-semibold cursor-pointer"
                  >
                    Cancel, Keep Editing
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Quick Add Student Modal */}
          {isAddStudentOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-md w-full border border-sand-200 p-6 shadow-elevated space-y-4"
              >
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div className="flex items-center gap-2 text-primary-950 font-bold text-base">
                    <UserPlus size={18} className="text-primary-700" />
                    <span>Add New Student to Roster</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddStudentOpen(false)}
                    className="p-1 rounded-lg text-ink-400 hover:text-ink-800 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddNewStudentToCourse} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudentData.name}
                      onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                      placeholder="e.g. Ibrahim Qasim"
                      className="w-full px-3.5 py-2.5 border border-sand-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={newStudentData.email}
                      onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                      placeholder="ibrahim.q@example.com"
                      className="w-full px-3.5 py-2.5 border border-sand-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700">
                        Temporary Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewStudentData({ ...newStudentData, password: generateTemporaryPassword() })}
                        className="text-[11px] font-bold text-primary-800 hover:underline"
                      >
                        Generate Random
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={newStudentData.password || ''}
                      onChange={(e) => setNewStudentData({ ...newStudentData, password: e.target.value })}
                      placeholder="e.g. Ilm#2026!9a"
                      className="w-full px-3.5 py-2 border border-sand-300 rounded-xl text-xs font-bold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Attendance Mode
                      </label>
                      <select
                        value={newStudentData.format}
                        onChange={(e) => setNewStudentData({ ...newStudentData, format: e.target.value })}
                        className="w-full px-3 py-2.5 border border-sand-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="online">Online</option>
                        <option value="onsite">Onsite</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Fee Status
                      </label>
                      <select
                        value={newStudentData.feeStatus}
                        onChange={(e) => setNewStudentData({ ...newStudentData, feeStatus: e.target.value })}
                        className="w-full px-3 py-2.5 border border-sand-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-sand-200">
                    <button
                      type="button"
                      onClick={() => setIsAddStudentOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Add &amp; Enroll in Course
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Add / Edit Downloadable Handout & Reading Material Modal */}
          {isAddResourceOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-lg w-full border border-sand-200 p-6 shadow-elevated space-y-4"
              >
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div className="flex items-center gap-2 text-primary-950 font-bold text-base">
                    <FileText size={18} className="text-primary-700" />
                    <span>
                      {editingResourceId
                        ? 'Edit Study Material / Handout'
                        : 'Add Downloadable Handout or Reading Material'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddResourceOpen(false)}
                    className="p-1 rounded-lg text-ink-400 hover:text-ink-800 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveResource} className="space-y-4">
                  {/* Document Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Handout / Document Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newResourceData.title}
                      onChange={(e) =>
                        setNewResourceData({ ...newResourceData, title: e.target.value })
                      }
                      placeholder="e.g. Classical Arabic Grammar Reference Chart (PDF)"
                      className="w-full px-3.5 py-2.5 border border-sand-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  {/* Format & Size Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Material Format
                      </label>
                      <select
                        value={newResourceData.type}
                        onChange={(e) =>
                          setNewResourceData({ ...newResourceData, type: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 border border-sand-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="pdf">PDF Document (.pdf)</option>
                        <option value="doc">Word Document (.docx / .doc)</option>
                        <option value="slides">Presentation Slides (.pptx / slides)</option>
                        <option value="xls">Spreadsheet / Reference Matrix (.xlsx)</option>
                        <option value="img">Manuscript / Diagram Image (.png / .jpg)</option>
                        <option value="default">Other Reading Material</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        File Size
                      </label>
                      <input
                        type="text"
                        value={newResourceData.size}
                        onChange={(e) =>
                          setNewResourceData({ ...newResourceData, size: e.target.value })
                        }
                        placeholder="e.g. 2.4 MB"
                        className="w-full px-3.5 py-2.5 border border-sand-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>

                  {/* Upload Local File or Enter Cloud Link */}
                  <div className="space-y-3 pt-2 border-t border-sand-100">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Attach File from Computer
                      </label>
                      <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-sand-300 hover:border-primary-500 rounded-xl cursor-pointer bg-sand-50/60 hover:bg-primary-50/20 transition-all">
                        <Upload size={18} className="text-primary-700 mb-1" />
                        <span className="text-xs font-semibold text-ink-800">
                          Click to browse and upload file
                        </span>
                        <span className="text-[10px] text-ink-400">
                          Auto-fills title, format, and calculated file size
                        </span>
                        <input
                          type="file"
                          onChange={handleFileUploadSimulated}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Or Cloud / Download Link (Google Drive, Dropbox, PDF URL)
                      </label>
                      <div className="relative">
                        <LinkIcon
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                        />
                        <input
                          type="url"
                          value={newResourceData.downloadUrl}
                          onChange={(e) =>
                            setNewResourceData({
                              ...newResourceData,
                              downloadUrl: e.target.value,
                            })
                          }
                          placeholder="https://drive.google.com/... or https://..."
                          className="w-full pl-9 pr-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Reading Notes / Scope (Optional)
                      </label>
                      <input
                        type="text"
                        value={newResourceData.description}
                        onChange={(e) =>
                          setNewResourceData({
                            ...newResourceData,
                            description: e.target.value,
                          })
                        }
                        placeholder="e.g. Essential reading prior to Module 1 seminar"
                        className="w-full px-3.5 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-sand-200">
                    <button
                      type="button"
                      onClick={() => setIsAddResourceOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      {editingResourceId ? 'Save Changes' : 'Add Handout / Material'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Quick Create Academic Pathway Modal */}
          {isPathwayModalOpen && (
            <div className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-sand-200"
              >
                <div className="px-6 py-5 bg-sand-50/80 border-b border-sand-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-primary-100 flex items-center justify-center text-primary-900">
                      <Compass size={18} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-ink-900 text-base">
                        Create New Academic Pathway
                      </h3>
                      <p className="text-xs text-ink-500">
                        Define a new diploma track or masterclass pathway
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPathwayModalOpen(false)}
                    className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-200/50 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreatePathway} className="p-6 space-y-4">
                  {pathwayFormError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                      {pathwayFormError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Pathway Name *
                    </label>
                    <input
                      type="text"
                      value={pathwayForm.name}
                      onChange={(e) => setPathwayForm({ ...pathwayForm, name: e.target.value })}
                      placeholder="e.g. Classical Arabic & Sarf Immersion"
                      required
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={pathwayForm.subtitle}
                      onChange={(e) => setPathwayForm({ ...pathwayForm, subtitle: e.target.value })}
                      placeholder="e.g. 1-Year Diploma in Sacred Grammar & Rhetoric"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                      Program Structure *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPathwayForm({
                            ...pathwayForm,
                            programStructure: 'multi_semester',
                            type: 'cohort',
                            tuitionModel: 'varies_by_course',
                            semesters: pathwayForm.semesters || 2,
                            duration: '2 Semesters (Duration varies by course)',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          pathwayForm.programStructure === 'multi_semester'
                            ? 'border-primary-900 bg-primary-50/70 ring-2 ring-primary-500/20'
                            : 'border-sand-200 bg-white hover:bg-sand-50/60'
                        }`}
                      >
                        <div className="font-bold text-xs text-ink-900 flex items-center gap-1">
                          🎓 Multi-Semester
                        </div>
                        <p className="text-[10px] text-ink-500 mt-0.5 leading-snug">
                          Cohort program with semesters (e.g. Ilm Foundations)
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPathwayForm({
                            ...pathwayForm,
                            programStructure: 'course_group',
                            type: 'modular',
                            tuitionModel: 'varies_by_course',
                            semesters: 0,
                            duration: 'Duration varies by course',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          pathwayForm.programStructure === 'course_group'
                            ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                            : 'border-sand-200 bg-white hover:bg-sand-50/60'
                        }`}
                      >
                        <div className="font-bold text-xs text-ink-900 flex items-center gap-1">
                          ⚡ Course Group
                        </div>
                        <p className="text-[10px] text-ink-500 mt-0.5 leading-snug">
                          Non-semester masterclass collection (e.g. Ilm Intensives)
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPathwayForm({
                            ...pathwayForm,
                            programStructure: 'single_course',
                            type: 'modular',
                            tuitionModel: 'varies_by_course',
                            semesters: 0,
                            duration: 'Duration varies by course',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          pathwayForm.programStructure === 'single_course'
                            ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20'
                            : 'border-sand-200 bg-white hover:bg-sand-50/60'
                        }`}
                      >
                        <div className="font-bold text-xs text-ink-900 flex items-center gap-1">
                          📖 Single Course
                        </div>
                        <p className="text-[10px] text-ink-500 mt-0.5 leading-snug">
                          Independent one-off course or workshop
                        </p>
                      </button>
                    </div>
                  </div>

                  {pathwayForm.programStructure === 'multi_semester' && (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1">
                            Number of Semesters
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={pathwayForm.semesters}
                            onChange={(e) =>
                              setPathwayForm({ ...pathwayForm, semesters: Number(e.target.value) || 2 })
                            }
                            className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1">
                            Generated Structure
                          </label>
                          <div className="text-xs font-bold text-emerald-900 py-1.5">
                            {Array.from({ length: pathwayForm.semesters || 2 }, (_, i) => `Semester ${i + 1}`).join(' • ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Tuition Pricing Structure
                      </label>
                      <select
                        value={pathwayForm.tuitionModel}
                        onChange={(e) => setPathwayForm({ ...pathwayForm, tuitionModel: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                      >
                        <option value="varies_by_course">Course-Specific Pricing (Varies Course to Course)</option>
                        <option value="per_course">Standard Baseline Per Course</option>
                        <option value="bundled">Bundled Overall Track</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Guideline Base Fee (PKR)
                      </label>
                      <input
                        type="number"
                        value={pathwayForm.defaultTuitionFee}
                        onChange={(e) => setPathwayForm({ ...pathwayForm, defaultTuitionFee: Number(e.target.value) || 0 })}
                        placeholder="30000"
                        className="w-full px-3.5 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Duration Notes
                    </label>
                    <input
                      type="text"
                      value={pathwayForm.duration}
                      onChange={(e) => setPathwayForm({ ...pathwayForm, duration: e.target.value })}
                      placeholder="e.g. Duration varies by course (4-12 Weeks)"
                      className="w-full px-3.5 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <p className="text-[11px] text-ink-400 mt-1">Each individual course defines its own duration and dates.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Pathway Description & Scope
                    </label>
                    <textarea
                      rows={2}
                      value={pathwayForm.description}
                      onChange={(e) => setPathwayForm({ ...pathwayForm, description: e.target.value })}
                      placeholder="Outline the core objective, academic rigor, and targeted student body..."
                      className="w-full px-3.5 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-sand-200">
                    <button
                      type="button"
                      onClick={() => setIsPathwayModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Create &amp; Select Pathway
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
