/**
 * AdminDashboard — Administration Portal for Ilm Essentials LMS
 *
 * Core Administrative Capabilities:
 * 1. Overview KPIs: Enrolled students, course counts, pending applications, tuition revenue.
 * 2. Course Management: Create new course modal, filter by format/category, edit status.
 * 3. Student Roster: Search, progress tracking, fee verification (Paid / Pending), attendance.
 * 4. Admissions / Applications: Review incoming student registrations.
 * 5. Class Scheduling: Live online and on-campus DHA Lahore session planner.
 *
 * @module pages/AdminDashboard
 * TODO: Connect to Admin REST API or GraphQL endpoints
 * TODO: Add RBAC (Role-Based Access Control) authentication check
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  FileCheck,
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  MapPin,
  Video,
  PlayCircle,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  List,
  UserCheck,
  AlertCircle,
  Download,
  Calendar,
  X,
  LogOut,
  Trash2,
  Eye,
  Check,
  Edit3,
  Layers,
  ExternalLink,
  UserPlus,
  CheckSquare,
  Square,
  Receipt,
  DollarSign,
  CheckCircle2,
  GraduationCap,
  Printer,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  User,
  Key,
  Copy,
  EyeOff,
  Lock,
  Compass,
  Sparkles,
  Tag,
  Split,
  Percent,
  Bell,
  CalendarDays,
  Send,
  MessageSquare,
  Smartphone,
  Library,
  BookMarked,
  Quote,
  ShieldAlert,
  Unlock,
  Image,
  ZoomIn,
  Star,
  UploadCloud,
  ClipboardCheck,
} from 'lucide-react';

import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import logoWhite from '../assets/logo-white.png';
import FeeInvoiceModal from '../components/admin/FeeInvoiceModal';
import BillingDrawer from '../components/admin/BillingDrawer';
import ScheduleDrawer from '../components/admin/ScheduleDrawer';
import {
  adminOverviewStats,
  adminStudentsList,
  courseFormats,
} from '../data/mockData';
import {
  getAllCourses,
  saveCourse,
  deleteCourse,
  updateCourseStatus,
  getAllStudents,
  saveStudent,
  deleteStudent,
  getAllInstructors,
  saveInstructor,
  deleteInstructor,
  getFeeRecords,
  saveFeeRecord,
  applyFeeDiscount,
  configureInstallmentPlan,
  recordFeePayment,
  recordMultiFeePayment,
  voidFeePayment,
  updateFeeStatus,
  getCourseEnrolledStudentIds,
  getCourseDetailById,
  updateCourseEnrollment,
  getAttendanceSessions,
  saveAttendanceSession,
  deleteAttendanceSession,
  calculateStudentAttendanceStats,
  calculateStudentProgressStats,
  parseAttendanceSheet,
  syncAllStudentsAttendance,
  generateTemporaryPassword,
  getAllPathways,
  savePathway,
  deletePathway,
  getScheduleSlots,
  saveScheduleSlot,
  deleteScheduleSlot,
  getScheduleNotifications,
  recordScheduleNotification,
  formatSlotTimeRange,
  formatTime12h,
  timeToMinutes,
  getLibraryItems,
  saveLibraryItem,
  deleteLibraryItem,
  toggleLibraryItemFeatured,
  getDailyQuotes,
  saveDailyQuote,
  deleteDailyQuote,
  toggleQuotePinned,
  countWords,
  getTodaysQuote,
  getFeeInstallments,
  saveFeeInstallments,
  getGlobalAccountsSummary,
  getStudentVideoRestriction,
  setStudentVideoRestriction,
  restrictAllOverdueStudents,
  restoreAllRestrictedStudents,
  createInstallments,
  uploadInstallmentReceipt,
  approveInstallment,
  rejectInstallment,
} from '../services/courseStorage';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Tabs state
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'students' | 'applications' | 'schedules'

  // Student search & filter
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState(() => getAllStudents());

  // Courses filter & persistent state
  const [courseCategoryFilter, setCourseCategoryFilter] = useState('all');
  const [courses, setCourses] = useState(() => getAllCourses());

  // Roster Management Modal State
  const [rosterModalCourse, setRosterModalCourse] = useState(null);
  const [rosterSelectedStudentIds, setRosterSelectedStudentIds] = useState([]);
  const [rosterSearch, setRosterSearch] = useState('');
  const [isRosterAddStudentOpen, setIsRosterAddStudentOpen] = useState(false);
  const [rosterNewStudent, setRosterNewStudent] = useState({
    name: '',
    email: '',
    format: 'online',
  });

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const term = studentSearch.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        (s.program && s.program.toLowerCase().includes(term)) ||
        (s.semester && s.semester.toLowerCase().includes(term)) ||
        (Array.isArray(s.selectedCourses) && s.selectedCourses.some((c) => c.toLowerCase().includes(term)));
      return matchSearch;
    });
  }, [students, studentSearch]);

  // Filter students inside Roster Modal
  const rosterFilteredStudents = useMemo(() => {
    if (!rosterSearch.trim()) return students;
    const term = rosterSearch.toLowerCase();
    return students.filter((s) => {
      return (
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.program.toLowerCase().includes(term)
      );
    });
  }, [students, rosterSearch]);

  // Roster Modal Handlers
  const handleOpenRosterModal = (course) => {
    setRosterModalCourse(course);
    const enrolledIds = getCourseEnrolledStudentIds(course.id, course.category);
    setRosterSelectedStudentIds(enrolledIds);
    setRosterSearch('');
    setIsRosterAddStudentOpen(false);
  };

  const handleCloseRosterModal = () => {
    setRosterModalCourse(null);
    setRosterSelectedStudentIds([]);
    setIsRosterAddStudentOpen(false);
  };

  const handleToggleRosterStudent = (studentId) => {
    setRosterSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllRoster = () => {
    const idsToAdd = rosterFilteredStudents.map((s) => s.id);
    setRosterSelectedStudentIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleDeselectAllRoster = () => {
    const idsToRemove = new Set(rosterFilteredStudents.map((s) => s.id));
    setRosterSelectedStudentIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
  };

  const handleSaveRoster = () => {
    if (!rosterModalCourse) return;
    updateCourseEnrollment(rosterModalCourse.id, rosterSelectedStudentIds);
    setCourses(getAllCourses());
    handleCloseRosterModal();
  };

  const handleAddStudentToRoster = (e) => {
    e.preventDefault();
    if (!rosterNewStudent.name.trim() || !rosterNewStudent.email.trim()) return;

    const programName = rosterModalCourse?.category === 'foundations'
      ? 'ilm Foundations'
      : (rosterModalCourse?.title || 'Ilm Essentials');

    const createdStudent = saveStudent({
      name: rosterNewStudent.name.trim(),
      email: rosterNewStudent.email.trim(),
      program: programName,
      format: rosterNewStudent.format || 'online',
    });

    setStudents(getAllStudents());
    setRosterSelectedStudentIds((prev) => [...prev, createdStudent.id]);
    setRosterNewStudent({ name: '', email: '', format: 'online' });
    setIsRosterAddStudentOpen(false);
  };

  // Student Account Modal State & Handlers
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const [studentFormData, setStudentFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    mustChangePassword: true,
    program: 'Ilm Foundations',
    semester: 'Semester 1',
    selectedCourses: [],
    format: 'online',
    feeStatus: 'Pending',
    progress: 0,
    attendance: '100%',
  });

  const availableIntensiveCourses = useMemo(() => {
    const list = courses.filter((c) => {
      const cat = (c.category || '').toLowerCase();
      const prog = (c.program || '').toLowerCase();
      return (
        cat === 'intensives' ||
        cat === 'ilm-intensives' ||
        cat.includes('intensive') ||
        prog.includes('intensive')
      );
    });
    if (list.length > 0) return list;
    return [
      { id: 'crs_202', title: 'The Prophetic Biography (Sīrah)', instructor: 'Muhammad Ali' },
      { id: 'crs_adm_06', title: 'Decoding Isms & Modern Ideologies', instructor: 'Raja Zia ul Haq' },
    ];
  }, [courses]);

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setShowStudentPassword(true);
    setStudentFormData({
      name: '',
      email: '',
      phone: '',
      password: generateTemporaryPassword(),
      mustChangePassword: true,
      program: 'Ilm Foundations',
      semester: 'Semester 1',
      selectedCourses: [],
      format: 'online',
      feeStatus: 'Pending',
      progress: 0,
      attendance: '100%',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student) => {
    setEditingStudent(student);
    setShowStudentPassword(false);

    let existingSelectedCourses = [];
    if (Array.isArray(student.selectedCourses)) {
      existingSelectedCourses = student.selectedCourses;
    } else if (student.program === 'Ilm Intensives' && student.semester && student.semester !== 'Intensive') {
      existingSelectedCourses = student.semester.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // Auto-calculate telemetry from real logs
    const attStats = calculateStudentAttendanceStats(student.id);
    const progStats = calculateStudentProgressStats(student.id);
    const calculatedAttendance = attStats.hasRecords ? attStats.rate : (student.attendance || '95%');
    const calculatedProgress = progStats.totalLessons > 0 ? progStats.progress : (student.progress ?? 0);

    setStudentFormData({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      password: student.password || '',
      mustChangePassword: student.mustChangePassword !== undefined ? Boolean(student.mustChangePassword) : false,
      program: student.program === 'Ilm Intensives' ? 'Ilm Intensives' : 'Ilm Foundations',
      semester: student.semester || 'Semester 1',
      selectedCourses: existingSelectedCourses,
      format: student.format || 'online',
      feeStatus: student.feeStatus || 'Pending',
      progress: calculatedProgress,
      attendance: calculatedAttendance,
    });
    setIsStudentModalOpen(true);
  };

  const handleGenerateNewPassword = () => {
    setStudentFormData((prev) => ({
      ...prev,
      password: generateTemporaryPassword(),
      mustChangePassword: true,
    }));
    setShowStudentPassword(true);
  };

  const handleSaveStudentForm = (e) => {
    e.preventDefault();
    if (!studentFormData.name.trim() || !studentFormData.email.trim()) return;

    const isIntensive = studentFormData.program === 'Ilm Intensives';
    if (isIntensive && (!studentFormData.selectedCourses || studentFormData.selectedCourses.length === 0)) {
      alert('Please select at least one course under Ilm Intensives.');
      return;
    }

    const chosenPassword =
      studentFormData.password.trim() ||
      (editingStudent?.password ?? generateTemporaryPassword());

    const finalSemester = isIntensive
      ? studentFormData.selectedCourses.join(', ')
      : (studentFormData.semester || 'Semester 1');

    const payload = {
      ...(editingStudent ? { id: editingStudent.id } : {}),
      name: studentFormData.name.trim(),
      email: studentFormData.email.trim(),
      phone: studentFormData.phone.trim(),
      password: chosenPassword,
      mustChangePassword: studentFormData.mustChangePassword,
      program: studentFormData.program,
      semester: finalSemester,
      selectedCourses: isIntensive ? (studentFormData.selectedCourses || []) : [],
      format: studentFormData.format,
      feeStatus: editingStudent ? (editingStudent.feeStatus || 'Pending') : 'Pending',
      progress: editingStudent ? (Number(studentFormData.progress) || 0) : 0,
      attendance: editingStudent ? (studentFormData.attendance || '100%') : '100%',
    };

    const saved = saveStudent(payload);

    // If intensive courses are selected, sync student into those course rosters
    if (isIntensive && Array.isArray(studentFormData.selectedCourses) && studentFormData.selectedCourses.length > 0) {
      const studentId = saved?.id || payload.id;
      if (studentId) {
        studentFormData.selectedCourses.forEach((courseTitle) => {
          const matchCourse = courses.find((c) => c.title.toLowerCase() === courseTitle.toLowerCase());
          if (matchCourse) {
            const currentRoster = getCourseEnrolledStudentIds(matchCourse.id, matchCourse.category);
            if (!currentRoster.includes(studentId)) {
              updateCourseEnrollment(matchCourse.id, [...currentRoster, studentId]);
            }
          }
        });
        setCourses(getAllCourses());
      }
    }

    setStudents(getAllStudents());
    setIsStudentModalOpen(false);

    // Show credential distribution card for newly created students
    if (!editingStudent) {
      setCreatedCredentialsModal({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        mustChange: payload.mustChangePassword,
      });
      setCopiedCredentials(false);
    }
    setEditingStudent(null);
  };

  const handleDeleteStudent = (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to remove student "${studentName}"? This will also remove them from active enrollments.`)) {
      const updated = deleteStudent(studentId);
      setStudents(updated);
    }
  };

  // Attendance Manager Modal State & Handlers
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceModalMode, setAttendanceModalMode] = useState('lessons'); // 'lessons' | 'rollcall'
  const [attendanceLessonsTab, setAttendanceLessonsTab] = useState('lessons'); // 'lessons' | 'history'
  const [editingAttendanceSessionId, setEditingAttendanceSessionId] = useState(null);
  const [attendanceCourseId, setAttendanceCourseId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceTopic, setAttendanceTopic] = useState('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [attendanceDeliveryMode, setAttendanceDeliveryMode] = useState('hybrid');
  const [attendanceActiveTab, setAttendanceActiveTab] = useState('register'); // 'register' | 'upload'
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceSheetText, setAttendanceSheetText] = useState('');
  const [attendanceParseResult, setAttendanceParseResult] = useState(null);
  const [attendanceToast, setAttendanceToast] = useState('');
  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState('all');
  const [attendanceFormatFilter, setAttendanceFormatFilter] = useState('all'); // 'all' | 'onsite' | 'online'
  const [attendanceSessions, setAttendanceSessions] = useState(() => getAttendanceSessions());
  const [attendanceSectionTab, setAttendanceSectionTab] = useState('courses'); // 'courses' | 'sessions'
  const [attendanceSectionSearch, setAttendanceSectionSearch] = useState('');
  const [attendanceSectionCourseFilter, setAttendanceSectionCourseFilter] = useState('all');
  const [attendanceSectionPathwayFilter, setAttendanceSectionPathwayFilter] = useState('all');
  const [attendanceSectionStandingFilter, setAttendanceSectionStandingFilter] = useState('all');

  // Enrolled students for selected course in attendance modal
  const attendanceEnrolledStudents = useMemo(() => {
    if (!attendanceCourseId) return [];
    const course = courses.find((c) => c.id === attendanceCourseId);
    if (!course) return [];
    const enrolledIds = getCourseEnrolledStudentIds(course.id, course.category);
    return students.filter((s) => enrolledIds.includes(s.id));
  }, [attendanceCourseId, courses, students]);

  // Lessons for selected course
  const availableCourseLessons = useMemo(() => {
    if (!attendanceCourseId) return [];
    try {
      const detail = getCourseDetailById(attendanceCourseId);
      if (detail && Array.isArray(detail.modules)) {
        return detail.modules.flatMap((m) => m.lessons || []).filter(Boolean);
      }
    } catch (e) {
      console.error('Failed to load lessons for course:', e);
    }
    return [];
  }, [attendanceCourseId]);

  const handleOpenAttendanceModal = (courseId = null, existingSession = null, initialMode = null) => {
    if (existingSession) {
      setEditingAttendanceSessionId(existingSession.id);
      setAttendanceCourseId(existingSession.courseId);
      setAttendanceDate(existingSession.date);
      setAttendanceTopic(existingSession.topic || '');
      setAttendanceDeliveryMode(existingSession.deliveryMode || 'hybrid');
      setAttendanceRecords(existingSession.records || {});

      const detail = getCourseDetailById(existingSession.courseId);
      const lessons = detail?.modules?.flatMap((m) => m.lessons || []) || [];
      const matchesExisting = lessons.some((l) => l.title === existingSession.topic);
      setIsCustomTopic(!matchesExisting);
      setAttendanceModalMode('rollcall');
    } else {
      const selectedCourseId = courseId || courses[0]?.id || '';
      setEditingAttendanceSessionId(null);
      setAttendanceCourseId(selectedCourseId);
      const today = new Date().toISOString().split('T')[0];
      setAttendanceDate(today);
      setAttendanceDeliveryMode('hybrid');
      setIsCustomTopic(false);

      const detail = getCourseDetailById(selectedCourseId);
      const lessons = detail?.modules?.flatMap((m) => m.lessons || []) || [];
      setAttendanceTopic(lessons[0]?.title || `Lesson 1: Introduction`);

      const course = courses.find((c) => c.id === selectedCourseId);
      const enrolledIds = course ? getCourseEnrolledStudentIds(course.id, course.category) : [];
      const initialRecs = {};
      enrolledIds.forEach((id) => {
        initialRecs[id] = 'present';
      });
      setAttendanceRecords(initialRecs);
      setAttendanceModalMode(initialMode || 'lessons');
    }

    setAttendanceLessonsTab('lessons');
    setAttendanceActiveTab('register');
    setAttendanceSheetText('');
    setAttendanceParseResult(null);
    setAttendanceFilterStatus('all');
    setAttendanceFormatFilter('all');
    setIsAttendanceModalOpen(true);
  };

  const handleStartLessonAttendance = (lesson) => {
    setEditingAttendanceSessionId(null);
    const today = new Date().toISOString().split('T')[0];
    setAttendanceDate(today);
    setAttendanceTopic(lesson.title);
    setIsCustomTopic(false);

    const course = courses.find((c) => c.id === attendanceCourseId);
    const enrolledIds = course ? getCourseEnrolledStudentIds(course.id, course.category) : [];
    const initialRecs = {};
    enrolledIds.forEach((id) => {
      initialRecs[id] = 'present';
    });
    setAttendanceRecords(initialRecs);

    setAttendanceActiveTab('register');
    setAttendanceSheetText('');
    setAttendanceParseResult(null);
    setAttendanceFilterStatus('all');
    setAttendanceFormatFilter('all');
    setAttendanceModalMode('rollcall');
  };

  const handleViewSessionAttendance = (session) => {
    setEditingAttendanceSessionId(session.id);
    setAttendanceCourseId(session.courseId);
    setAttendanceDate(session.date);
    setAttendanceTopic(session.topic || '');
    setAttendanceDeliveryMode(session.deliveryMode || 'hybrid');
    setAttendanceRecords(session.records || {});

    const detail = getCourseDetailById(session.courseId);
    const lessons = detail?.modules?.flatMap((m) => m.lessons || []) || [];
    const matchesExisting = lessons.some((l) => l.title === session.topic);
    setIsCustomTopic(!matchesExisting);

    setAttendanceActiveTab('register');
    setAttendanceSheetText('');
    setAttendanceParseResult(null);
    setAttendanceFilterStatus('all');
    setAttendanceFormatFilter('all');
    setAttendanceModalMode('rollcall');
  };

  const handleAttendanceCourseChange = (newCourseId) => {
    setAttendanceCourseId(newCourseId);
    setAttendanceSheetText('');
    setAttendanceParseResult(null);

    // If not editing an existing past session, load lessons and reset roster for new course
    if (!editingAttendanceSessionId) {
      const detail = getCourseDetailById(newCourseId);
      const lessons = detail?.modules?.flatMap((m) => m.lessons || []) || [];
      setAttendanceTopic(lessons[0]?.title || `Lesson 1`);

      const course = courses.find((c) => c.id === newCourseId);
      const enrolledIds = course ? getCourseEnrolledStudentIds(course.id, course.category) : [];
      const initialRecs = {};
      enrolledIds.forEach((id) => {
        initialRecs[id] = 'present';
      });
      setAttendanceRecords(initialRecs);
    }
  };

  const handleSetStudentAttendance = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAllAttendance = (status, formatTarget = 'all') => {
    const updated = { ...attendanceRecords };
    attendanceEnrolledStudents.forEach((std) => {
      const format = (std.format || 'online').toLowerCase();
      if (formatTarget === 'all' || format.includes(formatTarget)) {
        updated[std.id] = status;
      }
    });
    setAttendanceRecords(updated);
  };

  const handleAttendanceFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setAttendanceSheetText(text);
      const res = parseAttendanceSheet(text, attendanceEnrolledStudents);
      setAttendanceParseResult(res);
      setAttendanceToast('File loaded: ' + res.matched.length + ' students matched.');
      setTimeout(() => setAttendanceToast(''), 3500);
    };
    reader.readAsText(file);
  };

  const handleParseAttendanceSheet = () => {
    if (!attendanceSheetText.trim()) return;
    const res = parseAttendanceSheet(attendanceSheetText, attendanceEnrolledStudents);
    setAttendanceParseResult(res);
  };

  const handleApplyParsedAttendance = (mode = 'safe_hybrid') => {
    if (!attendanceParseResult) return;
    const updated = { ...attendanceRecords };

    // Set present for matched students from sheet
    (attendanceParseResult.presentStudentIds || []).forEach((id) => {
      updated[id] = 'present';
    });

    if (mode === 'safe_hybrid') {
      // In Simultaneous Hybrid Classes:
      // Online attendees who didn't join the Google Meet are marked absent,
      // but Onsite students (who attend in person) are PRESERVED!
      (attendanceParseResult.absentStudentIds || []).forEach((id) => {
        const std = attendanceEnrolledStudents.find((s) => s.id === id);
        const format = (std?.format || '').toLowerCase();
        if (format.includes('online')) {
          updated[id] = 'absent';
        }
      });
      setAttendanceToast(`Online attendees synced! Onsite students were preserved.`);
    } else {
      // Full override: all students not in the sheet are marked absent
      (attendanceParseResult.absentStudentIds || []).forEach((id) => {
        updated[id] = 'absent';
      });
      setAttendanceToast(`Applied full sheet: ${attendanceParseResult.matched.length} present, ${attendanceParseResult.absentStudentIds.length} absent.`);
    }

    setAttendanceRecords(updated);
    setAttendanceActiveTab('register');
    setTimeout(() => setAttendanceToast(''), 4000);
  };

  const handleSaveAttendance = () => {
    if (!attendanceCourseId) return;
    const course = courses.find((c) => c.id === attendanceCourseId);
    const courseTitle = course ? course.title : 'Course';

    const sessionPayload = {
      ...(editingAttendanceSessionId ? { id: editingAttendanceSessionId } : {}),
      courseId: attendanceCourseId,
      courseTitle,
      date: attendanceDate,
      topic: attendanceTopic.trim() || `Class Session (${attendanceDate})`,
      deliveryMode: attendanceDeliveryMode,
      records: attendanceRecords,
    };

    saveAttendanceSession(sessionPayload);
    setStudents(getAllStudents());
    setAttendanceSessions(getAttendanceSessions());
    setAttendanceToast('Attendance saved & student rates recalculated successfully!');
    setTimeout(() => {
      setAttendanceToast('');
      setAttendanceModalMode('lessons');
      setEditingAttendanceSessionId(null);
    }, 900);
  };

  const handleDeleteAttendanceSession = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this attendance session? All student rates will be recalculated.')) {
      deleteAttendanceSession(sessionId);
      setStudents(getAllStudents());
      setAttendanceSessions(getAttendanceSessions());
      setAttendanceToast('Session deleted and attendance rates updated.');
      setTimeout(() => setAttendanceToast(''), 3000);
    }
  };

  // Faculty & Instructor Management State & Handlers
  const [instructorSearch, setInstructorSearch] = useState('');
  const [instructors, setInstructors] = useState(() => getAllInstructors());
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [instructorFormData, setInstructorFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: 'Instructor of Islamic Sciences',
    specialization: '',
    bio: '',
    status: 'Active',
    assignedCourses: '',
    avatar: '',
  });

  const filteredInstructors = useMemo(() => {
    return instructors.filter((inst) => {
      const term = instructorSearch.toLowerCase();
      return (
        inst.name.toLowerCase().includes(term) ||
        inst.email.toLowerCase().includes(term) ||
        inst.title.toLowerCase().includes(term) ||
        (inst.specialization && inst.specialization.toLowerCase().includes(term))
      );
    });
  }, [instructors, instructorSearch]);

  const handleOpenAddInstructor = () => {
    setEditingInstructor(null);
    setInstructorFormData({
      name: '',
      email: '',
      phone: '',
      title: 'Instructor of Classical Islamic Sciences',
      specialization: '',
      bio: '',
      status: 'Active',
      assignedCourses: '',
      avatar: '',
    });
    setIsInstructorModalOpen(true);
  };

  const handleOpenEditInstructor = (inst) => {
    setEditingInstructor(inst);
    setInstructorFormData({
      name: inst.name || '',
      email: inst.email || '',
      phone: inst.phone || '',
      title: inst.title || '',
      specialization: inst.specialization || '',
      bio: inst.bio || '',
      status: inst.status || 'Active',
      assignedCourses: Array.isArray(inst.assignedCourses) ? inst.assignedCourses.join(', ') : (inst.assignedCourses || ''),
      avatar: inst.avatar || '',
    });
    setIsInstructorModalOpen(true);
  };

  const handleSaveInstructorForm = (e) => {
    e.preventDefault();
    if (!instructorFormData.name.trim() || !instructorFormData.email.trim()) return;

    const assignedArray = instructorFormData.assignedCourses
      ? instructorFormData.assignedCourses.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    const payload = {
      ...(editingInstructor ? { id: editingInstructor.id } : {}),
      name: instructorFormData.name.trim(),
      email: instructorFormData.email.trim(),
      phone: instructorFormData.phone.trim(),
      title: instructorFormData.title.trim(),
      specialization: instructorFormData.specialization.trim(),
      bio: instructorFormData.bio.trim(),
      status: instructorFormData.status,
      assignedCourses: assignedArray,
      avatar: instructorFormData.avatar.trim() || undefined,
    };

    saveInstructor(payload);
    setInstructors(getAllInstructors());
    setIsInstructorModalOpen(false);
    setEditingInstructor(null);
  };

  const handleDeleteInstructor = (instId, instName) => {
    if (window.confirm(`Are you sure you want to remove faculty scholar "${instName}"?`)) {
      const updated = deleteInstructor(instId);
      setInstructors(updated);
    }
  };

  const handleToggleInstructorStatus = (instId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'On Leave' : 'Active';
    saveInstructor({ id: instId, status: newStatus });
    setInstructors(getAllInstructors());
  };

  // ========================================================
  // Accounts, Fee Installments & Video Restriction State
  // ========================================================
  const [feeInstallments, setFeeInstallments] = useState(() => getFeeInstallments());
  const [activeFeeView, setActiveFeeView] = useState('installments'); // 'installments' | 'invoices'
  const [installmentQueueTab, setInstallmentQueueTab] = useState('review'); // 'review' | 'overdue' | 'approved' | 'rejected' | 'all'
  const [installmentSearch, setInstallmentSearch] = useState('');
  const [inspectingInst, setInspectingInst] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [showCreateInstallmentModal, setShowCreateInstallmentModal] = useState(false);
  const [showBulkRestrictModal, setShowBulkRestrictModal] = useState(false);
  const [showBulkRestoreModal, setShowBulkRestoreModal] = useState(false);
  // Installment Plan Builder Form State
  const [createPlanMode, setCreatePlanMode] = useState('plan'); // 'plan' | 'single'
  const [targetStudentMode, setTargetStudentMode] = useState('all'); // 'all' | 'program' | 'specific'
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearchInModal, setStudentSearchInModal] = useState('');

  // Plan Generator Config
  const [planTotalFee, setPlanTotalFee] = useState(45000);
  const [planInstallmentCount, setPlanInstallmentCount] = useState(3);
  const [planIntervalDays, setPlanIntervalDays] = useState(30);

  // Dynamic Milestones List (2, 3, 4, etc.)
  const [milestones, setMilestones] = useState(() => {
    const today = Date.now();
    return [
      { id: 'm1', title: 'Installment 1 — Registration & Tuition', amount: 15000, dueDate: new Date(today + 14 * 86400000).toISOString().split('T')[0] },
      { id: 'm2', title: 'Installment 2 — Midterm Dues', amount: 15000, dueDate: new Date(today + 44 * 86400000).toISOString().split('T')[0] },
      { id: 'm3', title: 'Installment 3 — Final Dues', amount: 15000, dueDate: new Date(today + 74 * 86400000).toISOString().split('T')[0] },
    ];
  });

  // Single Installment State
  const [singleTitle, setSingleTitle] = useState('Installment 1');
  const [singleAmount, setSingleAmount] = useState(15000);
  const [singleDueDate, setSingleDueDate] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);

  const [accountsToast, setAccountsToast] = useState(null);

  // Accounts Global Ledger Summary
  const accountsSummary = useMemo(() => {
    return getGlobalAccountsSummary();
  }, [feeInstallments, students]);

  // Today string YYYY-MM-DD
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered Installments
  const filteredInstallments = useMemo(() => {
    const q = (installmentSearch || '').toLowerCase().trim();
    return feeInstallments.filter((inst) => {
      if (!inst) return false;
      const matchSearch =
        !q ||
        (inst.studentName || '').toLowerCase().includes(q) ||
        (inst.studentEmail || '').toLowerCase().includes(q) ||
        (inst.title || '').toLowerCase().includes(q) ||
        (inst.challanNo || '').toLowerCase().includes(q) ||
        String(inst.amount).includes(q);

      if (!matchSearch) return false;

      if (installmentQueueTab === 'review') return inst.status === 'UNDER_REVIEW';
      if (installmentQueueTab === 'overdue') return inst.status !== 'APPROVED' && inst.dueDate <= todayDateStr;
      if (installmentQueueTab === 'restricted') {
        const student = students.find((s) => s.id === inst.studentId || (inst.studentId === 'usr_001' && s.id === 'std_001'));
        return Boolean(student?.isVideoRestricted);
      }
      if (installmentQueueTab === 'approved') return inst.status === 'APPROVED';
      if (installmentQueueTab === 'rejected') return inst.status === 'REJECTED';
      return true; // 'all'
    });
  }, [feeInstallments, installmentQueueTab, installmentSearch, students, todayDateStr]);

  // List of all currently restricted students
  const restrictedStudentsList = useMemo(() => {
    return students.filter((s) => Boolean(s.isVideoRestricted));
  }, [students]);

  // Count of students eligible for overdue bulk restriction
  const overdueEligibleStudents = useMemo(() => {
    const overdueInsts = feeInstallments.filter(
      (inst) => inst.status !== 'APPROVED' && inst.dueDate <= todayDateStr
    );
    const studentIdSet = new Set(overdueInsts.map((i) => i.studentId));
    return students.filter((s) => studentIdSet.has(s.id) && !s.isVideoRestricted);
  }, [feeInstallments, students, todayDateStr]);

  // Approve Installment Action (with Auto-Unlock Check)
  const handleApproveInstallmentAction = (inst) => {
    if (!inst) return;
    const adminId = user?.id || 'adm_001';
    const adminName = user?.name || 'Administrator';
    const result = approveInstallment(inst.id, adminId, adminName);
    if (!result) return;

    // Refresh state
    setFeeInstallments(getFeeInstallments());
    setStudents(getAllStudents());
    setInspectingInst(null);
    setIsRejectingMode(false);
    setRejectionReasonInput('');

    if (result.unlockedVideo) {
      setAccountsToast({
        type: 'success',
        title: 'Payment Approved & Access Restored!',
        message: `PKR ${inst.amount.toLocaleString()} approved by ${adminName}. All overdue installments are cleared — student course video access automatically restored.`,
      });
    } else {
      setAccountsToast({
        type: 'success',
        title: 'Payment Approved',
        message: `Installment "${inst.title}" (PKR ${inst.amount.toLocaleString()}) approved and stamped by ${adminName}.`,
      });
    }
    setTimeout(() => setAccountsToast(null), 5000);
  };

  // Reject Installment Action
  const handleRejectInstallmentAction = (inst) => {
    if (!inst) return;
    if (!rejectionReasonInput.trim()) {
      alert('Please provide a specific rejection reason for the student.');
      return;
    }
    const adminId = user?.id || 'adm_001';
    const adminName = user?.name || 'Administrator';
    const rejected = rejectInstallment(inst.id, rejectionReasonInput.trim(), adminId, adminName);
    if (!rejected) return;

    // Refresh state
    setFeeInstallments(getFeeInstallments());
    setStudents(getAllStudents());
    setInspectingInst(null);
    setIsRejectingMode(false);
    setRejectionReasonInput('');

    setAccountsToast({
      type: 'error',
      title: 'Payment Proof Rejected',
      message: `Installment "${inst.title}" marked as REJECTED. In-app notification sent to ${inst.studentName}.`,
    });
    setTimeout(() => setAccountsToast(null), 5000);
  };

  // Manual Toggle Individual Student Video Restriction
  const handleToggleStudentVideo = (studentId, studentName, currentlyRestricted) => {
    const adminName = user?.name || 'Administrator';
    const newStatus = !currentlyRestricted;
    setStudentVideoRestriction(studentId, newStatus, adminName);
    setStudents(getAllStudents());

    setAccountsToast({
      type: newStatus ? 'warning' : 'success',
      title: newStatus ? 'Course Video Access Restricted' : 'Course Video Access Restored',
      message: newStatus
        ? `${studentName}'s course video player has been manually locked by ${adminName}.`
        : `${studentName}'s course video player access has been unlocked.`,
    });
    setTimeout(() => setAccountsToast(null), 4000);
  };

  // Bulk Restrict Overdue Students Action
  const handleConfirmBulkRestrict = () => {
    const adminName = user?.name || 'Administrator';
    const result = restrictAllOverdueStudents(adminName);
    setStudents(getAllStudents());
    setShowBulkRestrictModal(false);

    setAccountsToast({
      type: 'warning',
      title: 'Bulk Video Restriction Applied',
      message: `Restricted course video access for ${result.restrictedCount} overdue student account(s). In-app notifications sent.`,
    });
    setTimeout(() => setAccountsToast(null), 5000);
  };

  // Bulk Restore All Restricted Students Action
  const handleConfirmBulkRestore = () => {
    const adminName = user?.name || 'Administrator';
    const result = restoreAllRestrictedStudents(adminName);
    setStudents(getAllStudents());
    setShowBulkRestoreModal(false);

    setAccountsToast({
      type: 'success',
      title: 'Course Video Access Restored',
      message: `Restored course video access for ${result.restoredCount} student account(s). In-app notifications sent.`,
    });
    setTimeout(() => setAccountsToast(null), 5000);
  };

  // Target students calculation for installment plan assignment
  const targetStudentList = useMemo(() => {
    if (targetStudentMode === 'all') return students;
    if (targetStudentMode === 'program') {
      if (selectedProgramFilter === 'all') return students;
      return students.filter((s) => (s.program || '').toLowerCase().includes(selectedProgramFilter.toLowerCase()));
    }
    return students.filter((s) => selectedStudentIds.includes(s.id));
  }, [students, targetStudentMode, selectedProgramFilter, selectedStudentIds]);

  // Auto-split plan into equal installments with spaced due dates
  const handleAutoSplitPlan = (count, total = planTotalFee, intervalDays = planIntervalDays) => {
    const num = Math.max(1, Number(count) || 1);
    const tot = Math.max(0, Number(total) || 0);
    const baseAmt = Math.floor(tot / num);
    const remainder = tot - baseAmt * num;
    const now = Date.now();

    const standardTitles3 = [
      'Installment 1 — Registration & Tuition',
      'Installment 2 — Midterm Dues',
      'Installment 3 — Final Dues',
    ];
    const standardTitles2 = [
      'Installment 1 — Term 1 Tuition',
      'Installment 2 — Term 2 Tuition',
    ];
    const standardTitles4 = [
      'Installment 1 — Q1 Dues',
      'Installment 2 — Q2 Dues',
      'Installment 3 — Q3 Dues',
      'Installment 4 — Q4 Dues',
    ];

    const generated = Array.from({ length: num }, (_, idx) => {
      const partAmt = idx === num - 1 ? baseAmt + remainder : baseAmt;
      const daysOffset = 14 + idx * intervalDays;
      const dueDate = new Date(now + daysOffset * 86400000).toISOString().split('T')[0];
      let t = `Installment ${idx + 1}`;
      if (num === 3 && standardTitles3[idx]) t = standardTitles3[idx];
      else if (num === 2 && standardTitles2[idx]) t = standardTitles2[idx];
      else if (num === 4 && standardTitles4[idx]) t = standardTitles4[idx];

      return {
        id: `m_${Date.now()}_${idx}`,
        title: t,
        amount: partAmt,
        dueDate,
      };
    });

    setPlanInstallmentCount(num);
    setPlanTotalFee(tot);
    setMilestones(generated);
  };

  const handleAddMilestoneRow = () => {
    const nextIdx = milestones.length + 1;
    const lastDueDate = milestones.length > 0 ? new Date(milestones[milestones.length - 1].dueDate) : new Date();
    const nextDueDate = new Date(lastDueDate.getTime() + (planIntervalDays || 30) * 86400000).toISOString().split('T')[0];
    setMilestones((prev) => [
      ...prev,
      {
        id: `m_${Date.now()}_${nextIdx}`,
        title: `Installment ${nextIdx}`,
        amount: Math.round(planTotalFee / Math.max(1, prev.length + 1)) || 10000,
        dueDate: nextDueDate,
      },
    ]);
  };

  const handleRemoveMilestoneRow = (idxToRemove) => {
    if (milestones.length <= 1) {
      alert('You must maintain at least one installment milestone.');
      return;
    }
    setMilestones((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleUpdateMilestone = (idx, field, value) => {
    setMilestones((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  // Create Installments & Multi-Installment Plans Submit
  const handleCreateInstallmentsSubmit = (e) => {
    e.preventDefault();

    if (targetStudentList.length === 0) {
      alert('Please select at least one student.');
      return;
    }

    let payloadMilestones = [];
    if (createPlanMode === 'plan') {
      if (milestones.length === 0) {
        alert('Please add at least one installment milestone.');
        return;
      }
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        if (!m.title.trim() || !Number(m.amount) || !m.dueDate) {
          alert(`Please fill in all fields for Installment #${i + 1} (title, amount, and due date).`);
          return;
        }
      }
      payloadMilestones = milestones.map((m) => ({
        title: m.title.trim(),
        amount: Number(m.amount),
        dueDate: m.dueDate,
      }));
    } else {
      if (!singleTitle.trim() || !Number(singleAmount) || !singleDueDate) {
        alert('Please fill in title, amount, and due date.');
        return;
      }
      payloadMilestones = [{
        title: singleTitle.trim(),
        amount: Number(singleAmount),
        dueDate: singleDueDate,
      }];
    }

    const targetIds = targetStudentList.map((s) => s.id);
    const result = createInstallments({
      studentIds: targetIds,
      milestones: payloadMilestones,
    });

    setFeeInstallments(getFeeInstallments());
    setShowCreateInstallmentModal(false);

    setAccountsToast({
      type: 'success',
      title: 'Installment Plan Created & Assigned!',
      message: `Successfully created ${result.newInstallments.length} installment records (${payloadMilestones.length} milestone(s) each) across ${targetIds.length} student(s).`,
    });
    setTimeout(() => setAccountsToast(null), 5000);
  };

    // Student Fee Management State & Handlers
  const [feeRecords, setFeeRecords] = useState(() => getFeeRecords());
  const [feeSearch, setFeeSearch] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState('all');
  const [selectedInvoiceRecord, setSelectedInvoiceRecord] = useState(null);

  // View Mode: 'flat' (All Invoices) vs 'grouped' (Grouped by Student)
  const [tableViewMode, setTableViewMode] = useState('flat');
  const [expandedStudentKeys, setExpandedStudentKeys] = useState(() => new Set(['std_001', 'std_004']));

  const toggleExpandStudent = (key) => {
    setExpandedStudentKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Unified Slide-Over Billing Drawer State & Handlers
  const [isBillingDrawerOpen, setIsBillingDrawerOpen] = useState(false);
  const [selectedDrawerFeeId, setSelectedDrawerFeeId] = useState(null);

  const filteredFees = useMemo(() => {
    const q = (feeSearch || '').toLowerCase().trim();
    return feeRecords.filter((f) => {
      if (!f) return false;
      const matchSearch =
        !q ||
        (f.studentName || '').toLowerCase().includes(q) ||
        (f.studentEmail || '').toLowerCase().includes(q) ||
        (f.invoiceNo || '').toLowerCase().includes(q) ||
        (f.program || '').toLowerCase().includes(q);

      const matchFilter =
        feeStatusFilter === 'all' ||
        (f.status || '').toLowerCase() === (feeStatusFilter || '').toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [feeRecords, feeSearch, feeStatusFilter]);

  // Grouped Students calculation for Grouped by Student view mode
  const groupedStudents = useMemo(() => {
    const groups = new Map();

    for (const fee of filteredFees) {
      if (!fee) continue;
      const key = fee.studentId || (fee.studentEmail ? fee.studentEmail.toLowerCase() : fee.id || 'std_unknown');
      if (!groups.has(key)) {
        groups.set(key, {
          studentKey: key,
          studentId: fee.studentId || key,
          studentName: fee.studentName || 'Student',
          studentEmail: fee.studentEmail || '',
          invoices: [],
          totalBilled: 0,
          totalPaid: 0,
          totalBalance: 0,
          programs: new Set(),
          hasOverdue: false,
          hasPartial: false,
          hasPending: false,
        });
      }
      const group = groups.get(key);
      group.invoices.push(fee);
      group.totalBilled += Number(fee.totalAmount) || 0;
      group.totalPaid += Number(fee.paidAmount) || 0;
      group.totalBalance += Number(fee.balance) || 0;
      if (fee.program) group.programs.add(fee.program);
      if (fee.status === 'Overdue') group.hasOverdue = true;
      if (fee.status === 'Partial') group.hasPartial = true;
      if (fee.status === 'Pending') group.hasPending = true;
    }

    return Array.from(groups.values()).map((g) => {
      let aggStatus = 'Paid';
      if (g.totalBalance === 0) aggStatus = 'Paid';
      else if (g.hasOverdue) aggStatus = 'Overdue';
      else if (g.totalPaid > 0) aggStatus = 'Partial';
      else aggStatus = 'Pending';

      // Earliest due date across unpaid invoices
      const unpaidInvoices = g.invoices.filter((i) => (Number(i.balance) || 0) > 0);
      const earliestDue =
        unpaidInvoices.length > 0
          ? unpaidInvoices.reduce((earliest, i) => (!earliest || (i.dueDate && i.dueDate < earliest) ? i.dueDate : earliest), '')
          : 'All Cleared';

      return {
        ...g,
        status: aggStatus,
        programList: Array.from(g.programs),
        percentPaid: g.totalBilled > 0 ? Math.min(100, Math.round((g.totalPaid / g.totalBilled) * 100)) : 100,
        earliestDue: earliestDue || 'All Cleared',
      };
    });
  }, [filteredFees]);

  const selectedDrawerFee = useMemo(() => {
    return feeRecords.find((f) => f.id === selectedDrawerFeeId) || null;
  }, [feeRecords, selectedDrawerFeeId]);

  const currentDrawerIndex = useMemo(() => {
    if (!selectedDrawerFeeId) return -1;
    return filteredFees.findIndex((f) => f.id === selectedDrawerFeeId);
  }, [filteredFees, selectedDrawerFeeId]);

  const hasPrevDrawerStudent = currentDrawerIndex > 0;
  const hasNextDrawerStudent = currentDrawerIndex >= 0 && currentDrawerIndex < filteredFees.length - 1;

  const handleOpenBillingDrawer = (feeRec) => {
    setSelectedDrawerFeeId(feeRec.id);
    setIsBillingDrawerOpen(true);
  };

  const handleCloseBillingDrawer = () => {
    setIsBillingDrawerOpen(false);
    setSelectedDrawerFeeId(null);
  };

  const handlePrevDrawerStudent = () => {
    if (hasPrevDrawerStudent) {
      setSelectedDrawerFeeId(filteredFees[currentDrawerIndex - 1].id);
    }
  };

  const handleNextDrawerStudent = () => {
    if (hasNextDrawerStudent) {
      setSelectedDrawerFeeId(filteredFees[currentDrawerIndex + 1].id);
    }
  };

  const handleDrawerSaveDiscount = (feeId, discountData) => {
    applyFeeDiscount(feeId, discountData);
    setFeeRecords(getFeeRecords());
    setStudents(getAllStudents());
  };

  const handleDrawerSaveInstallments = (feeId, planData) => {
    configureInstallmentPlan(feeId, planData);
    setFeeRecords(getFeeRecords());
  };

  const handleDrawerRecordPayment = (feeId, paymentData) => {
    recordFeePayment(feeId, paymentData);
    setFeeRecords(getFeeRecords());
    setStudents(getAllStudents());
  };

  const handleDrawerRecordMultiPayment = (paymentsArray) => {
    recordMultiFeePayment(paymentsArray);
    setFeeRecords(getFeeRecords());
    setStudents(getAllStudents());
  };

  const handleDrawerVoidPayment = (feeId, paymentEntryId) => {
    voidFeePayment(feeId, paymentEntryId);
    setFeeRecords(getFeeRecords());
    setStudents(getAllStudents());
  };

  const feeSummary = useMemo(() => {
    const totalBilled = feeRecords.reduce((sum, f) => sum + (Number(f.totalAmount) || 0), 0);
    const totalCollected = feeRecords.reduce((sum, f) => sum + (Number(f.paidAmount) || 0), 0);
    const totalOutstanding = feeRecords.reduce((sum, f) => sum + (Number(f.balance) || 0), 0);
    const overdueCount = feeRecords.filter((f) => f.status === 'Overdue').length;
    const pendingCount = feeRecords.filter((f) => f.status === 'Pending' || f.status === 'Partial').length;
    return { totalBilled, totalCollected, totalOutstanding, overdueCount, pendingCount };
  }, [feeRecords]);

  const handleQuickFeeStatusChange = (feeId, newStatus) => {
    const updated = updateFeeStatus(feeId, newStatus);
    setFeeRecords(updated);
    setStudents(getAllStudents());
  };

  // Pathways State & Handlers
  const [pathways, setPathways] = useState(() => getAllPathways());
  const [pathwaySearch, setPathwaySearch] = useState('');
  const [isPathwayModalOpen, setIsPathwayModalOpen] = useState(false);
  const [editingPathway, setEditingPathway] = useState(null);
  const [pathwayFormData, setPathwayFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    type: 'cohort',
    duration: '8 Months (2 Semesters)',
    semesters: 2,
    tuitionModel: 'bundled',
    defaultTuitionFee: 30000,
    color: 'emerald',
    icon: 'GraduationCap',
  });
  const [pathwayFormError, setPathwayFormError] = useState('');

  const handleOpenAddPathway = () => {
    setEditingPathway(null);
    setPathwayFormData({
      name: '',
      subtitle: '',
      description: '',
      type: 'cohort',
      duration: '8 Months (2 Semesters)',
      semesters: 2,
      tuitionModel: 'bundled',
      defaultTuitionFee: 30000,
      color: 'emerald',
      icon: 'GraduationCap',
    });
    setPathwayFormError('');
    setIsPathwayModalOpen(true);
  };

  const handleOpenEditPathway = (p) => {
    setEditingPathway(p);
    setPathwayFormData({
      name: p.name || '',
      subtitle: p.subtitle || '',
      description: p.description || '',
      type: p.type || 'cohort',
      duration: p.duration || '8 Weeks',
      semesters: p.semesters || 1,
      tuitionModel: p.tuitionModel || 'per_course',
      defaultTuitionFee: p.defaultTuitionFee || 0,
      color: p.color || 'emerald',
      icon: p.icon || 'GraduationCap',
    });
    setPathwayFormError('');
    setIsPathwayModalOpen(true);
  };

  const handleSavePathwaySubmit = (e) => {
    e.preventDefault();
    if (!pathwayFormData.name.trim()) {
      setPathwayFormError('Pathway name is required.');
      return;
    }
    const slug = editingPathway?.slug || pathwayFormData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    savePathway({
      ...(editingPathway || {}),
      ...pathwayFormData,
      slug,
    });
    setPathways(getAllPathways());
    setIsPathwayModalOpen(false);
    setEditingPathway(null);
  };

  const handleDeletePathway = (id, name) => {
    const isAssigned = courses.some((c) => c.category === id);
    if (isAssigned) {
      alert(`Cannot delete pathway "${name}" because active courses are currently assigned to it. Please reassign or delete the courses first.`);
      return;
    }
    if (window.confirm(`Are you sure you want to remove Academic Pathway "${name}"?`)) {
      const updated = deletePathway(id);
      setPathways(updated);
    }
  };

  const filteredPathways = useMemo(() => {
    return pathways.filter((p) => {
      const q = pathwaySearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.subtitle && p.subtitle.toLowerCase().includes(q));
    });
  }, [pathways, pathwaySearch]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (courseCategoryFilter === 'all') return true;
      return c.category === courseCategoryFilter;
    });
  }, [courses, courseCategoryFilter]);

  // Handle fee status toggle
  const toggleFeeStatus = (studentId) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            feeStatus: s.feeStatus === 'Paid' ? 'Pending' : 'Paid',
          };
        }
        return s;
      })
    );
  };

  // Handle course deletion
  const handleDeleteCourse = (courseId, courseTitle) => {
    if (window.confirm(`Are you sure you want to remove "${courseTitle}" from the course catalog?`)) {
      const updated = deleteCourse(courseId);
      setCourses(updated);
    }
  };

  // Handle course status toggle
  const handleToggleStatus = (courseId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Upcoming' : currentStatus === 'Upcoming' ? 'Draft' : 'Active';
    const updated = updateCourseStatus(courseId, nextStatus);
    setCourses(updated);
  };

  const getFormatIcon = (c) => {
    const cat = c.classCategory || (c.format === 'on-site' ? 'onsite' : (c.format === 'hybrid' ? 'hybrid' : 'online'));
    if (cat === 'hybrid') return Layers;
    if (cat === 'onsite') return MapPin;
    if (cat === 'online') return Video;
    return PlayCircle;
  };

  // ==========================================
  // Class Schedule Planner State & Handlers
  // ==========================================
  const [scheduleSlots, setScheduleSlots] = useState(() => getScheduleSlots());
  const [scheduleNotifications, setScheduleNotifications] = useState(() => getScheduleNotifications());
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const [editingScheduleSlot, setEditingScheduleSlot] = useState(null);
  const [scheduleViewMode, setScheduleViewMode] = useState('agenda'); // 'agenda' | 'weekly_grid'
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleCohortFilter, setScheduleCohortFilter] = useState('all');
  const [scheduleModalityFilter, setScheduleModalityFilter] = useState('all');
  const [scheduleInstructorFilter, setScheduleInstructorFilter] = useState('all');
  const [scheduleToast, setScheduleToast] = useState(null);
  const [isAuditLogExpanded, setIsAuditLogExpanded] = useState(false);
  const [copiedSlotId, setCopiedSlotId] = useState(null);

  // Keep schedule slots synced across windows and updates
  useEffect(() => {
    const handleSync = (e) => {
      if (!e || !e.key || e.key === 'ilm_schedule_slots') {
        setScheduleSlots(getScheduleSlots());
      }
    };
    window.addEventListener('ilm_schedule_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ilm_schedule_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const activeWeeklySlots = useMemo(
    () => scheduleSlots.filter((s) => s.status !== 'cancelled'),
    [scheduleSlots]
  );
  const onlineMeetSlotsCount = useMemo(
    () => scheduleSlots.filter((s) => s.modality === 'online_meet' && s.status !== 'cancelled').length,
    [scheduleSlots]
  );
  const onSiteCampusSlotsCount = useMemo(
    () => scheduleSlots.filter((s) => s.modality === 'onsite_campus' && s.status !== 'cancelled').length,
    [scheduleSlots]
  );

  const scheduleConflictCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < scheduleSlots.length; i++) {
      const s1 = scheduleSlots[i];
      if (s1.status === 'cancelled') continue;
      for (let j = i + 1; j < scheduleSlots.length; j++) {
        const s2 = scheduleSlots[j];
        if (s2.status === 'cancelled') continue;
        if (s1.dayOfWeek !== s2.dayOfWeek) continue;
        const start1 = timeToMinutes(s1.startTime);
        const end1 = timeToMinutes(s1.endTime);
        const start2 = timeToMinutes(s2.startTime);
        const end2 = timeToMinutes(s2.endTime);
        if (Math.max(start1, start2) < Math.min(end1, end2)) {
          if (
            (s1.instructorName && s1.instructorName === s2.instructorName) ||
            (s1.modality === 'onsite_campus' && s2.modality === 'onsite_campus' && s1.campusRoom && s1.campusRoom === s2.campusRoom) ||
            (s1.cohortId && s1.cohortId === s2.cohortId)
          ) {
            count++;
          }
        }
      }
    }
    return count;
  }, [scheduleSlots]);

  const filteredScheduleSlots = useMemo(() => {
    return scheduleSlots.filter((slot) => {
      if (scheduleSearch) {
        const q = scheduleSearch.toLowerCase();
        const matchTopic = slot.topic?.toLowerCase().includes(q);
        const matchCourse = slot.courseTitle?.toLowerCase().includes(q);
        const matchInstructor = slot.instructorName?.toLowerCase().includes(q);
        const matchRoom = slot.campusRoom?.toLowerCase().includes(q);
        if (!matchTopic && !matchCourse && !matchInstructor && !matchRoom) return false;
      }
      if (scheduleCohortFilter !== 'all' && slot.cohortId !== scheduleCohortFilter) return false;
      if (scheduleModalityFilter !== 'all' && slot.modality !== scheduleModalityFilter) return false;
      if (scheduleInstructorFilter !== 'all' && slot.instructorName !== scheduleInstructorFilter) return false;
      return true;
    });
  }, [scheduleSlots, scheduleSearch, scheduleCohortFilter, scheduleModalityFilter, scheduleInstructorFilter]);

  const handleOpenAddScheduleSlot = () => {
    setEditingScheduleSlot(null);
    setIsScheduleDrawerOpen(true);
  };

  const handleOpenEditScheduleSlot = (slot) => {
    setEditingScheduleSlot(slot);
    setIsScheduleDrawerOpen(true);
  };

  const handleSaveScheduleSlot = (slotData, notificationData) => {
    const { record, updatedSlots } = saveScheduleSlot(slotData);
    setScheduleSlots(updatedSlots);

    if (notificationData) {
      const { updatedNotifs } = recordScheduleNotification(notificationData);
      setScheduleNotifications(updatedNotifs);
      setScheduleToast({
        message: `✓ Lecture schedule saved! Notification broadcasted to ${notificationData.recipientCount} students in ${notificationData.cohortName} via ${notificationData.channels.map(c => c === 'in_app' ? 'Portal' : c === 'email' ? 'Email' : 'WhatsApp').join(', ')}.`,
      });
    } else {
      setScheduleToast({
        message: `✓ Lecture slot "${record.courseTitle}" saved successfully.`,
      });
    }

    setTimeout(() => {
      setScheduleToast(null);
    }, 5000);
  };

  const handleDeleteScheduleSlotItem = (slotId, courseTitle) => {
    if (window.confirm(`Are you sure you want to remove the lecture slot for "${courseTitle}"?`)) {
      const updated = deleteScheduleSlot(slotId);
      setScheduleSlots(updated);
      setScheduleToast({
        message: `✓ Lecture slot removed from timetable.`,
      });
      setTimeout(() => setScheduleToast(null), 3000);
    }
  };

  const handleQuickRemind = (slot) => {
    const broadcastData = {
      slotId: slot.id,
      courseTitle: slot.courseTitle,
      cohortName: slot.cohortName,
      recipientCount: slot.enrolledCount,
      type: 'manual_reminder',
      changeSummary: `Lecture reminder: "${slot.courseTitle}" is coming up on ${slot.dayOfWeek} at ${formatSlotTimeRange(slot.startTime, slot.endTime)} (${slot.modality === 'online_meet' ? 'Google Meet Online' : slot.campusRoom})`,
      channels: ['in_app', 'email', 'whatsapp'],
      customNote: 'Looking forward to seeing everyone in class!',
    };
    const { updatedNotifs } = recordScheduleNotification(broadcastData);
    setScheduleNotifications(updatedNotifs);
    setScheduleToast({
      message: `✓ Reminder sent to ${slot.enrolledCount} enrolled students in ${slot.cohortName} via Portal, Email & WhatsApp!`,
    });
    setTimeout(() => {
      setScheduleToast(null);
    }, 4000);
  };

  const handleCopyMeetLink = (slotId, url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedSlotId(slotId);
    setTimeout(() => setCopiedSlotId(null), 2000);
  };


  // ==========================================
  // E-LIBRARY MANAGEMENT STATE & HANDLERS
  // ==========================================
  const [libraryList, setLibraryList] = useState(() => getLibraryItems());
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState('all');
  const [libraryTypeFilter, setLibraryTypeFilter] = useState('all');
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [editingLibraryItem, setEditingLibraryItem] = useState(null);
  const [isLibraryDeleteModalOpen, setIsLibraryDeleteModalOpen] = useState(false);
  const [libraryItemToDelete, setLibraryItemToDelete] = useState(null);
  const [libraryFormError, setLibraryFormError] = useState('');

  const initialLibraryForm = {
    title: '',
    author: '',
    category: 'Tafsir',
    type: 'reference',
    pages: '',
    fileSize: '',
    language: 'Arabic / English',
    description: '',
    featured: false,
    downloadUrl: '',
    externalUrl: '',
    status: 'published',
  };
  const [libraryFormData, setLibraryFormData] = useState(initialLibraryForm);

  // Synchronize library items dynamically on custom & storage events
  React.useEffect(() => {
    const handleUpdate = () => {
      setLibraryList(getLibraryItems());
    };
    window.addEventListener('ilm-library-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('ilm-library-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleOpenAddLibraryModal = () => {
    setEditingLibraryItem(null);
    setLibraryFormData(initialLibraryForm);
    setLibraryFormError('');
    setIsLibraryModalOpen(true);
  };

  const handleOpenEditLibraryModal = (item) => {
    setEditingLibraryItem(item);
    setLibraryFormData({
      title: item.title || '',
      author: item.author || '',
      category: item.category || 'Tafsir',
      type: item.type || 'reference',
      pages: item.pages ?? '',
      fileSize: item.fileSize || '',
      language: item.language || 'Arabic / English',
      description: item.description || '',
      featured: Boolean(item.featured),
      downloadUrl: item.downloadUrl || '',
      externalUrl: item.externalUrl || '',
      status: item.status || 'published',
    });
    setLibraryFormError('');
    setIsLibraryModalOpen(true);
  };

  const handleSaveLibrarySubmit = (e) => {
    e.preventDefault();
    if (!libraryFormData.title.trim()) {
      setLibraryFormError('Please enter a title for the library resource.');
      return;
    }

    try {
      saveLibraryItem({
        ...(editingLibraryItem ? { id: editingLibraryItem.id } : {}),
        ...libraryFormData,
        pages: libraryFormData.pages ? Number(libraryFormData.pages) : 0,
      });
      setLibraryList(getLibraryItems());
      setIsLibraryModalOpen(false);
      setEditingLibraryItem(null);
    } catch (err) {
      setLibraryFormError('Failed to save library resource: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleToggleLibraryFeatured = (id) => {
    const updated = toggleLibraryItemFeatured(id);
    setLibraryList(updated);
  };

  const handleOpenDeleteLibraryModal = (item) => {
    setLibraryItemToDelete(item);
    setIsLibraryDeleteModalOpen(true);
  };

  const handleConfirmDeleteLibrary = () => {
    if (libraryItemToDelete) {
      const updated = deleteLibraryItem(libraryItemToDelete.id);
      setLibraryList(updated);
      setIsLibraryDeleteModalOpen(false);
      setLibraryItemToDelete(null);
    }
  };

  // Filtered library items
  const filteredLibraryItems = useMemo(() => {
    return libraryList.filter((item) => {
      const q = librarySearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.author?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);

      const matchesCategory =
        libraryCategoryFilter === 'all' || item.category === libraryCategoryFilter;

      const matchesType =
        libraryTypeFilter === 'all' || item.type === libraryTypeFilter;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [libraryList, librarySearch, libraryCategoryFilter, libraryTypeFilter]);

  const libraryCategories = useMemo(() => {
    const defaultCats = ['Tafsir', 'Hadith', 'Fiqh', 'Seerah', 'Arabic', 'Tazkiyah', 'Aqeedah', 'General'];
    const activeCats = libraryList.map((i) => i.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...activeCats]));
  }, [libraryList]);

  // ==========================================
  // DAILY REFLECTIONS & QUOTES STATE & ACTIONS
  // ==========================================
  const [quotesList, setQuotesList] = useState(() => getDailyQuotes());
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteTypeFilter, setQuoteTypeFilter] = useState('all');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [isQuoteDeleteModalOpen, setIsQuoteDeleteModalOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState(null);
  const [quoteFormError, setQuoteFormError] = useState('');

  const initialQuoteForm = {
    text: '',
    source: '',
    type: 'hadith',
    active: true,
    pinned: false,
  };
  const [quoteFormData, setQuoteFormData] = useState(initialQuoteForm);

  // Sync quotes dynamically across events
  React.useEffect(() => {
    const handleUpdate = () => {
      setQuotesList(getDailyQuotes());
    };
    window.addEventListener('ilm-quotes-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('ilm-quotes-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleOpenAddQuoteModal = () => {
    setEditingQuote(null);
    setQuoteFormData(initialQuoteForm);
    setQuoteFormError('');
    setIsQuoteModalOpen(true);
  };

  const handleOpenEditQuoteModal = (quote) => {
    setEditingQuote(quote);
    setQuoteFormData({
      text: quote.text || '',
      source: quote.source || '',
      type: quote.type || 'hadith',
      active: quote.active !== false,
      pinned: Boolean(quote.pinned),
    });
    setQuoteFormError('');
    setIsQuoteModalOpen(true);
  };

  const handleSaveQuoteSubmit = (e) => {
    e.preventDefault();
    setQuoteFormError('');

    const textWords = countWords(quoteFormData.text);
    if (textWords > 40) {
      setQuoteFormError(`Quote text exceeds the 40-word limit (current: ${textWords} words). Please shorten.`);
      return;
    }

    const sourceWords = countWords(quoteFormData.source);
    if (sourceWords > 8) {
      setQuoteFormError(`Citation reference exceeds the 8-word limit (current: ${sourceWords} words).`);
      return;
    }

    try {
      saveDailyQuote({
        ...(editingQuote ? { id: editingQuote.id, createdAt: editingQuote.createdAt } : {}),
        ...quoteFormData,
      });
      setQuotesList(getDailyQuotes());
      setIsQuoteModalOpen(false);
      setEditingQuote(null);
    } catch (err) {
      setQuoteFormError(err.message || 'Failed to save quote.');
    }
  };

  const handleToggleQuotePinned = (id) => {
    const updated = toggleQuotePinned(id);
    setQuotesList(updated);
  };

  const handleOpenDeleteQuoteModal = (quote) => {
    setQuoteToDelete(quote);
    setIsQuoteDeleteModalOpen(true);
  };

  const handleConfirmDeleteQuote = () => {
    if (quoteToDelete) {
      const updated = deleteDailyQuote(quoteToDelete.id);
      setQuotesList(updated);
      setIsQuoteDeleteModalOpen(false);
      setQuoteToDelete(null);
    }
  };

  // Filtered quotes list
  const filteredQuotes = useMemo(() => {
    return quotesList.filter((q) => {
      const query = quoteSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        q.text?.toLowerCase().includes(query) ||
        q.source?.toLowerCase().includes(query);

      const matchesType = quoteTypeFilter === 'all' || q.type === quoteTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [quotesList, quoteSearch, quoteTypeFilter]);

  const quotesMetrics = useMemo(() => {
    const total = quotesList.length;
    const active = quotesList.filter((q) => q.active !== false).length;
    const pinnedQuote = quotesList.find((q) => q.pinned);
    return { total, active, pinnedQuote };
  }, [quotesList]);

  const activeTodayQuote = useMemo(() => {
    return quotesMetrics.pinnedQuote || quotesList.find((q) => q.active !== false) || quotesList[0];
  }, [quotesMetrics, quotesList]);

  const handleAdminLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <Layout fullWidth hideNav>
      <div className="min-h-screen bg-sand-50 pb-20">
        {/* Dedicated Admin Header */}
        <header className="bg-primary-950 text-white border-b border-primary-900 sticky top-0 z-40 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link to="/admin" className="shrink-0 hover:opacity-90 transition-opacity">
                  <img src={logoWhite} alt="ilm essentials" className="h-7 w-auto object-contain" />
                </Link>
              </div>

              {/* Admin Actions & Profile */}
              <div className="flex items-center gap-2.5">
                <Link
                  to="/admin/courses/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Course</span>
                </Link>

                <button
                  onClick={handleAdminLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                  title="Log out of administrator session"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Admin Content */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
          {/* Two-Column Admin Layout: Left Navigation Sidebar + Right Workspace */}
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Left Vertical Navigation Sidebar */}
            <aside className="w-full lg:w-60 xl:w-64 shrink-0 lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-sand-200 p-3 shadow-xs">
                <div className="px-3 py-2.5 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    Admin Portal Menu
                  </p>
                </div>
                <nav className="space-y-1">
                  {[
                    { id: 'courses', label: 'Course Management', icon: BookOpen, count: courses.length },
                    { id: 'pathways', label: 'Academic Pathways', icon: Compass, count: pathways.length },
                    { id: 'library', label: 'e-Library', icon: Library, count: libraryList.length },
                    { id: 'quotes', label: 'Quotes', icon: Quote, count: quotesList.length },
                    { id: 'students', label: 'Students', icon: Users, count: students.length },
                    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, count: attendanceSessions.length },
                    { id: 'instructors', label: 'Faculty', icon: GraduationCap, count: instructors.length },
                    { id: 'fees', label: 'Accounts', icon: CreditCard, count: accountsSummary.pendingCount },
                    { id: 'applications', label: 'Admissions', icon: FileCheck, count: 38 },
                    { id: 'schedules', label: 'Schedule', icon: Calendar, count: activeWeeklySlots.length },
                  ].map((tab) => {
                    const IconComp = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                          isActive
                            ? 'bg-primary-900 text-white shadow-sm'
                            : 'text-ink-600 hover:text-ink-950 hover:bg-sand-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <IconComp
                            size={17}
                            className={`shrink-0 ${
                              isActive ? 'text-gold-400' : 'text-ink-400'
                            }`}
                          />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {tab.count !== undefined && (
                          <span
                            className={`shrink-0 ml-2 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              isActive
                                ? 'bg-gold-500 text-primary-950'
                                : 'bg-sand-100 text-ink-600'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Right Main Content Panel */}
            <main className="flex-1 min-w-0 w-full space-y-6">
              {/* Tab 1: Course Management */}
              {activeTab === 'courses' && (
                <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-6 shadow-xs">
                  {/* Header & Course Offerings Metric */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-sand-200/80">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                        Course Management
                      </h2>
                      <p className="text-xs text-ink-500 mt-1">
                        Manage semester courses, instructor assignments, delivery modes, and student rosters.
                      </p>
                    </div>

                    <div className="bg-sand-50 border border-sand-200/80 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Course Offerings</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-ink-900 font-heading">{courses.length}</span>
                          <span className="text-[11px] text-emerald-800 font-medium">
                            {courses.filter((c) => c.status === 'Active').length} Active • {courses.filter((c) => c.category === 'foundations').length} Foundations, {courses.filter((c) => c.category === 'intensives').length} Intensives
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCourseCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      courseCategoryFilter === 'all'
                        ? 'bg-primary-900 text-white'
                        : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                    }`}
                  >
                    All Pathways ({courses.length})
                  </button>
                  {pathways.map((p) => {
                    const count = courses.filter((c) => c.category === p.slug || c.category === p.id).length;
                    return (
                      <button
                        key={p.id || p.slug}
                        onClick={() => setCourseCategoryFilter(p.slug || p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          courseCategoryFilter === (p.slug || p.id)
                            ? 'bg-primary-900 text-white'
                            : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                        }`}
                      >
                        {p.name} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs text-ink-500">
                  Showing <strong className="text-ink-800">{filteredCourses.length}</strong> active programs
                </div>
              </div>

              {/* Course Table */}
              <div className="overflow-x-auto rounded-xl border border-sand-200">
                <table className="w-full text-left text-sm min-w-[960px]">
                  <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                    <tr>
                      <th className="py-3 px-4 min-w-[220px]">Program &amp; Title</th>
                      <th className="py-3 px-3 min-w-[140px] whitespace-nowrap">Instructor</th>
                      <th className="py-3 px-3 whitespace-nowrap">Format</th>
                      <th className="py-3 px-3 whitespace-nowrap">Enrollment</th>
                      <th className="py-3 px-3 whitespace-nowrap">Tuition Fee</th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[90px]">Status</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap min-w-[200px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100 text-ink-800">
                    {filteredCourses.map((c) => {
                      const FormatIcon = getFormatIcon(c);
                      const isOnline = c.classCategory === 'online' || c.format === 'live-online' || c.format === 'online';
                      const isOnsite = c.classCategory === 'onsite' || c.format === 'on-site' || c.format === 'onsite';
                      const isHybrid = c.classCategory === 'hybrid' || c.format === 'hybrid';

                      const formatLabel = isHybrid
                        ? 'Online & Onsite'
                        : isOnsite
                        ? 'Onsite'
                        : 'Online';

                      const formatColor = isHybrid
                        ? 'bg-gold-100/90 text-gold-900 border-gold-300'
                        : isOnsite
                        ? 'bg-amber-100 text-amber-900 border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-200';

                      return (
                        <tr key={c.id} className="hover:bg-sand-50/70 transition-colors">
                          <td className="py-3.5 px-4 min-w-[220px]">
                            <div className="font-bold text-ink-900 text-sm">{c.title}</div>
                          </td>
                          <td className="py-3.5 px-3 min-w-[140px] whitespace-nowrap">
                            <div className="font-medium text-xs text-ink-800">{c.instructor}</div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-semibold border ${formatColor}`}>
                              <FormatIcon size={12} />
                              {formatLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="text-xs font-semibold text-ink-800">
                              {c.enrolledCount} / {c.capacity} students
                            </div>
                            <div className="w-20 h-1.5 bg-sand-200 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-primary-600 rounded-full"
                                style={{ width: `${Math.min(100, (c.enrolledCount / c.capacity) * 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="font-semibold text-xs text-ink-900">
                              {(() => {
                                const isFoundations =
                                  c.category === 'foundations' ||
                                  c.fee === 'Included in Ilm Foundations Program' ||
                                  c.fee === 'Ilm Foundations';

                                const feeTitle = isFoundations
                                  ? 'Ilm Foundations'
                                  : (c.fee && c.fee !== 'Included in Ilm Foundations Program' ? c.fee : 'PKR 12,000');

                                const semesterSubtitle = c.semester
                                  ? (typeof c.semester === 'number'
                                      ? `Semester ${c.semester}`
                                      : (String(c.semester).trim().toLowerCase().startsWith('semester')
                                          ? String(c.semester).trim()
                                          : `Semester ${c.semester}`))
                                  : (isFoundations
                                      ? (c.subtitle && c.subtitle.toLowerCase().includes('semester 2') ? 'Semester 2' : 'Semester 1')
                                      : 'Per Course');

                                return (
                                  <>
                                    <div>{feeTitle}</div>
                                    <div className={`text-[10px] font-normal ${isFoundations ? 'text-emerald-700' : 'text-ink-500'}`}>
                                      {semesterSubtitle}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap min-w-[90px]">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(c.id, c.status)}
                              title="Click to cycle status: Active / Upcoming / Draft"
                              className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                                c.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : c.status === 'Upcoming'
                                  ? 'bg-gold-100 text-gold-800 hover:bg-gold-200'
                                  : 'bg-sand-200 text-ink-600 hover:bg-sand-300'
                              }`}
                            >
                              {c.status}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[200px]">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenRosterModal(c)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200/60 transition-colors cursor-pointer"
                                title="Manage enrolled students roster for this course"
                              >
                                <Users size={12} />
                                <span>Roster ({c.enrolledCount || 0})</span>
                              </button>
                              <Link
                                to={`/admin/courses/edit/${c.id}`}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sand-100 hover:bg-gold-100 text-gold-950 font-semibold border border-sand-200 transition-colors"
                                title="Edit course curriculum & schedule"
                              >
                                <Edit3 size={12} />
                                <span>Edit</span>
                              </Link>
                              <Link
                                to={`/course/${c.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-ink-500 hover:text-primary-800 hover:bg-sand-100 transition-colors"
                                title="Preview course room as student (Opens in new tab)"
                              >
                                <Eye size={14} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteCourse(c.id, c.title)}
                                className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove course from catalog"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Academic Pathways */}
          {activeTab === 'pathways' && (
            <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-6 shadow-xs">
              {/* Header & Search / Add Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                    Academic Pathways
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-56 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                    <input
                      type="text"
                      value={pathwaySearch}
                      onChange={(e) => setPathwaySearch(e.target.value)}
                      placeholder="Search pathways..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddPathway}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Plus size={14} />
                    Create New Pathway
                  </button>
                </div>
              </div>

              {/* Grid of Pathway Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPathways.map((p) => {
                  const pathwayCourses = courses.filter((c) => c.category === p.slug || c.category === p.id);
                  const isMultiSemester = p.programStructure === 'multi_semester' || p.type === 'cohort';

                  return (
                    <div
                      key={p.id || p.slug}
                      className="rounded-2xl border border-sand-200 bg-white p-5 flex flex-col justify-between hover:shadow-card transition-all"
                    >
                      <div className="space-y-4">
                        {/* Pathway Header Row: Icon + Title + Count + Quick Actions */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-sand-100">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-11 w-11 rounded-xl bg-primary-50 border border-primary-200/70 flex items-center justify-center text-primary-900 shrink-0 shadow-2xs">
                              <Compass size={20} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-heading font-bold text-ink-900 text-base sm:text-lg leading-tight tracking-tight truncate" title={p.name}>
                                {p.name}
                              </h3>
                              <span className="text-xs text-ink-500 font-medium mt-0.5 block">
                                {pathwayCourses.length} {pathwayCourses.length === 1 ? 'Course' : 'Courses'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPathway(p)}
                              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-sand-100 transition-colors cursor-pointer"
                              title="Edit pathway"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePathway(p.id || p.slug, p.name)}
                              className="p-1.5 rounded-lg text-ink-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete pathway"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Assigned Courses Section */}
                        <div className="space-y-2">

                          {isMultiSemester ? (
                            <div className="space-y-2">
                              {(p.semesterNames || ['Semester 1', 'Semester 2']).map((semName, sIdx) => {
                                const semCourses = pathwayCourses.filter(
                                  (c) =>
                                    c.semester === semName ||
                                    c.semester === sIdx + 1 ||
                                    (sIdx === 0 && (!c.semester || c.semester === 1))
                                );
                                return (
                                  <div key={semName} className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200/60">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-ink-800 mb-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-ink-900 font-bold">{semName}</span>
                                        <span className="text-[10px] text-ink-400 font-normal">({semCourses.length} courses)</span>
                                      </div>
                                    </div>
                                    <ol className="space-y-1.5">
                                      {semCourses.map((crs, cIdx) => (
                                        <li
                                          key={crs.id}
                                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-sand-200/90 text-xs font-medium text-ink-900 shadow-2xs hover:border-sand-300 transition-colors"
                                        >
                                          <span className="w-5 h-5 rounded-full bg-sand-100 text-primary-900 font-bold text-[10px] flex items-center justify-center shrink-0">
                                            {cIdx + 1}
                                          </span>
                                          <span className="truncate font-semibold" title={crs.title}>
                                            {crs.title}
                                          </span>
                                        </li>
                                      ))}
                                      {semCourses.length === 0 && (
                                        <li className="text-[11px] text-ink-400 italic py-1 list-none">No courses in {semName} yet</li>
                                      )}
                                    </ol>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <ol className="space-y-1.5">
                              {pathwayCourses.map((crs, cIdx) => (
                                <li
                                  key={crs.id}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sand-50/90 border border-sand-200/90 text-xs font-medium text-ink-900 shadow-2xs hover:border-sand-300 transition-colors"
                                >
                                  <span className="w-5 h-5 rounded-full bg-sand-200 text-ink-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {cIdx + 1}
                                  </span>
                                  <span className="truncate font-semibold" title={crs.title}>
                                    {crs.title}
                                  </span>
                                </li>
                              ))}
                              {pathwayCourses.length === 0 && (
                                <li className="text-xs text-ink-400 italic py-1 list-none">No courses in this track yet</li>
                              )}
                            </ol>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 mt-3 border-t border-sand-100 flex items-center justify-between">
                        <Link
                          to="/admin/courses/new"
                          className="text-xs font-bold text-primary-900 hover:text-primary-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Add Course</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {filteredPathways.length === 0 && (
                  <div className="col-span-full py-12 text-center text-xs text-ink-500 border border-dashed border-sand-300 rounded-2xl">
                    No academic pathways found matching "{pathwaySearch}".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Students */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-6 shadow-xs">
              {/* Header Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-sand-200/80">
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                    Students
                  </h2>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Showing <strong className="text-ink-800">{filteredStudents.length}</strong> enrolled students
                  </p>
                </div>

                <div className="bg-sand-50 border border-sand-200/80 rounded-xl px-4 py-2 flex items-center gap-3 shrink-0">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Total Enrolled Students</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-ink-900 font-heading">1,248</span>
                      <span className="text-[11px] text-emerald-700 font-medium">+12% this semester</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-64 sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search students..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddStudent}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <UserPlus size={14} />
                    Add New Student
                  </button>
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto rounded-xl border border-sand-200">
                <table className="w-full text-left text-sm min-w-[860px]">
                  <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                    <tr>
                      <th className="py-3 px-3.5">Student</th>
                      <th className="py-3 px-3">Enrolled Program</th>
                      <th className="py-3 px-3">Mode</th>
                      <th className="py-3 px-3">Curriculum Progress</th>
                      <th className="py-3 px-3">Attendance</th>
                      <th className="py-3 px-3">Fee Status</th>
                      <th className="py-3 px-3">Video Access</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100 text-ink-800">
                    {filteredStudents.map((std) => (
                      <tr key={std.id} className="group hover:bg-sand-50/70 transition-colors">
                        <td className="py-3.5 px-3.5">
                          <div className="font-semibold text-ink-900">{std.name}</div>
                          <div className="text-xs text-ink-500">{std.email}</div>
                          {std.phone && <div className="text-[11px] text-ink-400">{std.phone}</div>}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="text-xs font-semibold text-ink-800">{std.program}</div>
                          <div className="text-[11px] text-ink-500 line-clamp-2" title={Array.isArray(std.selectedCourses) && std.selectedCourses.length > 0 ? std.selectedCourses.join(', ') : (std.semester || 'Semester 1')}>
                            {Array.isArray(std.selectedCourses) && std.selectedCourses.length > 0
                              ? std.selectedCourses.join(', ')
                              : (std.semester || 'Semester 1')}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-xs capitalize text-ink-600 whitespace-nowrap">
                          {std.format?.replace('-', ' ') || 'Online'}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-sand-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-700 rounded-full"
                                style={{ width: `${std.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-ink-700">{std.progress ?? 0}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-xs text-ink-800 whitespace-nowrap">
                          {std.attendance || '95%'}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              std.feeStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : std.feeStatus === 'Partial'
                                ? 'bg-amber-100 text-amber-800'
                                : std.feeStatus === 'Waived'
                                ? 'bg-sand-200 text-ink-700 border border-sand-300'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {std.feeStatus || 'Paid'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {std.isVideoRestricted ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                                <Lock size={11} className="text-red-600" />
                                <span>Restricted</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleStudentVideo(std.id, std.name, true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-2xs cursor-pointer"
                                title={`Restricted by ${std.restrictedByAdminName || 'Admin'}. Click to restore video access.`}
                              >
                                <Unlock size={11} />
                                <span>Restore Access</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} className="text-emerald-600" />
                                <span>Active</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleStudentVideo(std.id, std.name, false)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-ink-500 hover:text-red-700 hover:bg-red-50 border border-sand-200 transition-all cursor-pointer"
                                title="Video access is active. Click to restrict video access."
                              >
                                <Lock size={10} />
                                <span>Restrict</span>
                              </button>
                            </div>
                          )}
                          {std.isVideoRestricted && std.restrictedByAdminName && (
                            <div className="text-[9px] text-ink-400 mt-0.5">by {std.restrictedByAdminName}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStudent(std)}
                              className="p-1.5 rounded-lg text-ink-600 hover:text-ink-950 hover:bg-sand-100 transition-colors cursor-pointer"
                              title="Edit student account"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(std.id, std.name)}
                              className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remove student account"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-ink-500">
                          No student accounts found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dedicated Attendance Management Section (Minimal) */}
          {activeTab === 'attendance' && (() => {
            const filteredAttendanceCourses = courses.filter((c) => {
              return (
                (c.title || '').toLowerCase().includes(attendanceSectionSearch.toLowerCase()) ||
                (c.instructor || '').toLowerCase().includes(attendanceSectionSearch.toLowerCase())
              );
            });

            const filteredAttendanceSessionsList = attendanceSessions.filter((sess) => {
              return (
                (sess.topic || '').toLowerCase().includes(attendanceSectionSearch.toLowerCase()) ||
                (sess.courseTitle || '').toLowerCase().includes(attendanceSectionSearch.toLowerCase()) ||
                (sess.date || '').includes(attendanceSectionSearch)
              );
            });

            return (
              <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-5 shadow-xs animate-in fade-in duration-200">
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sand-200/80">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                      Attendance
                    </h2>
                    <p className="text-xs text-ink-500 mt-0.5">
                      Record daily roll calls and track student attendance rates.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAttendanceModal()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    <ClipboardCheck size={14} />
                    Take / Upload Attendance
                  </button>
                </div>

                {/* Minimal Tab Switcher & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Clean Tab Pills */}
                  <div className="flex items-center gap-1 bg-sand-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceSectionTab('courses');
                        setAttendanceSectionSearch('');
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        attendanceSectionTab === 'courses'
                          ? 'bg-white text-ink-900 shadow-xs font-bold'
                          : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      By Course ({courses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceSectionTab('sessions');
                        setAttendanceSectionSearch('');
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        attendanceSectionTab === 'sessions'
                          ? 'bg-white text-ink-900 shadow-xs font-bold'
                          : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      Sessions Log ({attendanceSessions.length})
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                    <input
                      type="text"
                      value={attendanceSectionSearch}
                      onChange={(e) => setAttendanceSectionSearch(e.target.value)}
                      placeholder={
                        attendanceSectionTab === 'courses'
                          ? 'Search courses or faculty...'
                          : 'Search sessions by topic or date...'
                      }
                      className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                {/* TAB 1: COURSES TABLE */}
                {attendanceSectionTab === 'courses' && (
                  <div className="overflow-x-auto rounded-xl border border-sand-200">
                    <table className="w-full text-left text-sm min-w-[720px]">
                      <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                        <tr>
                          <th className="py-3 px-4">Course</th>
                          <th className="py-3 px-4">Instructor</th>
                          <th className="py-3 px-4">Format</th>
                          <th className="py-3 px-4">Enrolled</th>
                          <th className="py-3 px-4">Sessions</th>
                          <th className="py-3 px-4">Attendance Rate</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand-200">
                        {filteredAttendanceCourses.map((c) => {
                          const enrolledIds = getCourseEnrolledStudentIds(c.id, c.category);
                          const courseSessions = attendanceSessions.filter((s) => s.courseId === c.id);

                          let courseAvg = null;
                          if (courseSessions.length > 0) {
                            let totalPresent = 0;
                            let totalPossible = 0;
                            courseSessions.forEach((sess) => {
                              const recs = sess.records || {};
                              Object.values(recs).forEach((val) => {
                                totalPossible += 1;
                                if (val === 'present') totalPresent += 1;
                                else if (val === 'late') totalPresent += 0.75;
                              });
                            });
                            if (totalPossible > 0) {
                              courseAvg = Math.round((totalPresent / totalPossible) * 100);
                            }
                          }

                          return (
                            <tr key={c.id} className="hover:bg-sand-50/60 transition-colors">
                              <td className="py-3 px-4">
                                <div className="text-xs font-bold text-ink-900">{c.title}</div>
                                <span className="text-[10px] text-ink-400 capitalize">{c.category || 'Course'}</span>
                              </td>
                              <td className="py-3 px-4 text-xs text-ink-600">
                                {c.instructor || 'Faculty'}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sand-100 text-ink-700 border border-sand-200">
                                  {c.deliveryMode || 'Hybrid'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-ink-800 whitespace-nowrap">
                                {enrolledIds.length === 1 ? '1 Student' : `${enrolledIds.length} Students`}
                              </td>
                              <td className="py-3 px-4 text-xs text-ink-600 whitespace-nowrap">
                                {courseSessions.length === 1 ? '1 Session' : `${courseSessions.length} Sessions`}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {courseAvg !== null ? (
                                  <span
                                    className={`text-xs font-bold ${
                                      courseAvg >= 85
                                        ? 'text-emerald-800'
                                        : courseAvg >= 75
                                        ? 'text-amber-700'
                                        : 'text-rose-700'
                                    }`}
                                  >
                                    {courseAvg}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-ink-400 font-normal">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAttendanceModal(c.id)}
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary-900 hover:bg-primary-800 text-white transition-colors cursor-pointer"
                                >
                                  Mark Attendance
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredAttendanceCourses.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-xs text-ink-500">
                              No courses found matching your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 2: SESSIONS LOG */}
                {attendanceSectionTab === 'sessions' && (
                  <div className="overflow-x-auto rounded-xl border border-sand-200">
                    <table className="w-full text-left text-sm min-w-[720px]">
                      <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Course</th>
                          <th className="py-3 px-4">Topic / Lesson</th>
                          <th className="py-3 px-4">Mode</th>
                          <th className="py-3 px-4">Present / Absent</th>
                          <th className="py-3 px-4">Rate</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand-200">
                        {filteredAttendanceSessionsList.map((sess) => {
                          const recs = sess.records || {};
                          const sTotal = Object.keys(recs).length;
                          const sPresent = Object.values(recs).filter((r) => r === 'present').length;
                          const sLate = Object.values(recs).filter((r) => r === 'late').length;
                          const sRate = sTotal > 0 ? Math.round(((sPresent + sLate * 0.75) / sTotal) * 100) : 0;

                          return (
                            <tr key={sess.id} className="hover:bg-sand-50/60 transition-colors">
                              <td className="py-3 px-4 text-xs font-mono font-bold text-ink-900 whitespace-nowrap">
                                {sess.date}
                              </td>
                              <td className="py-3 px-4 text-xs font-bold text-ink-900 whitespace-nowrap">
                                {sess.courseTitle}
                              </td>
                              <td className="py-3 px-4 text-xs text-ink-600">
                                {sess.topic}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sand-100 text-ink-700 border border-sand-200 uppercase">
                                  {sess.deliveryMode || 'hybrid'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-ink-600 whitespace-nowrap">
                                <strong className="text-ink-900">{sPresent}</strong> Present • <strong className="text-ink-900">{sTotal - sPresent - sLate}</strong> Absent
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="text-xs font-bold text-emerald-800">
                                  {sRate}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAttendanceModal(sess.courseId, sess)}
                                    className="px-2.5 py-1 text-xs font-semibold text-primary-900 bg-sand-100 hover:bg-sand-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAttendanceSession(sess.id)}
                                    className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete Session"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredAttendanceSessionsList.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-xs text-ink-500">
                              No attendance sessions found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}


          {/* Tab 3: Faculty */}
          {activeTab === 'instructors' && (
            <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-6 shadow-xs">
              {/* Header Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                    Faculty
                  </h2>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Showing <strong className="text-ink-800">{filteredInstructors.length}</strong> faculty scholars
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64 sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                    <input
                      type="text"
                      value={instructorSearch}
                      onChange={(e) => setInstructorSearch(e.target.value)}
                      placeholder="Search faculty..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddInstructor}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Plus size={14} />
                    Add Faculty Member
                  </button>
                </div>
              </div>

              {/* Instructors Table */}
              <div className="overflow-x-auto rounded-xl border border-sand-200">
                <table className="w-full text-left text-sm min-w-[860px]">
                  <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                    <tr>
                      <th className="py-3 px-3.5">Scholar / Faculty Member</th>
                      <th className="py-3 px-3">Academic Specialization</th>
                      <th className="py-3 px-3">Contact Details</th>
                      <th className="py-3 px-3">Assigned Courses</th>
                      <th className="py-3 px-3">Faculty Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100 text-ink-800">
                    {filteredInstructors.map((inst) => (
                      <tr key={inst.id} className="group hover:bg-sand-50/70 transition-colors">
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={inst.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                              alt={inst.name}
                              className="h-9 w-9 rounded-full object-cover border border-sand-300 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-ink-900">{inst.name}</div>
                              <div className="text-xs text-primary-800 font-medium">{inst.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-xs text-ink-600">
                          {inst.specialization || 'Classical Islamic Sciences'}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="text-xs font-medium text-ink-800">{inst.email}</div>
                          {inst.phone && (
                            <div className="text-[11px] text-ink-500">{inst.phone}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(inst.assignedCourses || []).map((crs, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-sand-100 text-ink-700 font-medium"
                              >
                                {crs}
                              </span>
                            ))}
                            {(!inst.assignedCourses || inst.assignedCourses.length === 0) && (
                              <span className="text-xs text-ink-400 italic">No courses assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleInstructorStatus(inst.id, inst.status)}
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold cursor-pointer transition-colors ${
                              inst.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-sand-200 text-ink-600 hover:bg-sand-300'
                            }`}
                            title="Click to toggle status"
                          >
                            {inst.status || 'Active'}
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditInstructor(inst)}
                              className="p-1.5 rounded-lg text-ink-600 hover:text-ink-950 hover:bg-sand-100 transition-colors cursor-pointer"
                              title="Edit instructor details"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteInstructor(inst.id, inst.name)}
                              className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remove faculty member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredInstructors.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-ink-500">
                          No faculty members found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Student Tuition & Fee Management */}
                    {/* Tab 4: Accounts, Fee Installments & Video Access Management */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              {/* Minimal Clean Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sand-200/80">
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                    Accounts
                  </h2>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Manage student fee installments, verify receipts, and monitor tuition collection.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {overdueEligibleStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBulkRestrictModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold border border-red-200 transition-all cursor-pointer"
                      title="Restrict course video access for overdue students"
                    >
                      <ShieldAlert size={13} className="text-red-600" />
                      <span>Restrict Overdue ({overdueEligibleStudents.length})</span>
                    </button>
                  )}

                  {restrictedStudentsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBulkRestoreModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300 transition-all cursor-pointer"
                    >
                      <Unlock size={13} className="text-emerald-700" />
                      <span>Restore Access ({restrictedStudentsList.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowCreateInstallmentModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Plus size={14} />
                    <span>Create Installment Plan</span>
                  </button>
                </div>
              </div>

              {/* Minimal Clean Tab Switcher */}
              <div className="flex items-center gap-1 bg-sand-100 p-1 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setActiveFeeView('installments')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeFeeView === 'installments'
                      ? 'bg-white text-ink-900 font-bold shadow-xs'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <Receipt size={13} />
                  <span>Fee Installments</span>
                  {accountsSummary.pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-amber-100 text-amber-900">
                      {accountsSummary.pendingCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFeeView('invoices')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeFeeView === 'invoices'
                      ? 'bg-white text-ink-900 font-bold shadow-xs'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <CreditCard size={13} />
                  <span>Course Invoices</span>
                </button>
              </div>

              {/* VIEW 1: FEE INSTALLMENTS & VERIFICATION QUEUE */}
              {activeFeeView === 'installments' && (
                <div className="space-y-6">
                  {/* Minimal KPI Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-sand-50 border border-sand-200">
                      <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider block">Total Received</span>
                      <div className="text-lg font-bold text-ink-900 font-heading mt-0.5">
                        PKR {accountsSummary.totalReceived.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-ink-400">Approved payments</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sand-50 border border-sand-200">
                      <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider block">Total Receivable</span>
                      <div className="text-lg font-bold text-ink-900 font-heading mt-0.5">
                        PKR {accountsSummary.totalReceivable.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-ink-400">Pending & under review</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sand-50 border border-sand-200">
                      <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider block">Pending Review</span>
                      <div className="text-lg font-bold text-amber-900 font-heading mt-0.5">
                        {accountsSummary.pendingCount} Receipts
                      </div>
                      <span className="text-[10px] text-ink-400">Needs admin approval</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sand-50 border border-sand-200">
                      <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider block">Overdue Accounts</span>
                      <div className="text-lg font-bold text-red-700 font-heading mt-0.5">
                        {accountsSummary.overdueCount} Accounts
                      </div>
                      <span className="text-[10px] text-ink-400">Due date passed</span>
                    </div>
                  </div>

                  {/* Filter Tabs & Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: 'review', label: 'Pending Review', count: feeInstallments.filter((i) => i.status === 'UNDER_REVIEW').length, badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' },
                        { id: 'overdue', label: 'Overdue / Unpaid', count: feeInstallments.filter((i) => i.status !== 'APPROVED' && i.dueDate <= todayDateStr).length, badgeColor: 'bg-red-100 text-red-900 border-red-200' },
                        { id: 'restricted', label: 'Restricted Students', count: restrictedStudentsList.length, badgeColor: 'bg-rose-100 text-rose-900 border-rose-200' },
                        { id: 'approved', label: 'Approved', count: feeInstallments.filter((i) => i.status === 'APPROVED').length, badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
                        { id: 'rejected', label: 'Rejected', count: feeInstallments.filter((i) => i.status === 'REJECTED').length, badgeColor: 'bg-rose-100 text-rose-900 border-rose-200' },
                        { id: 'all', label: 'All Installments', count: feeInstallments.length, badgeColor: 'bg-sand-200 text-ink-800' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setInstallmentQueueTab(tab.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            installmentQueueTab === tab.id
                              ? 'bg-primary-900 text-white shadow-2xs'
                              : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                            installmentQueueTab === tab.id ? 'bg-white/20 text-white' : tab.badgeColor
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                      <input
                        type="text"
                        value={installmentSearch}
                        onChange={(e) => setInstallmentSearch(e.target.value)}
                        placeholder="Search student, email, title..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Installments Table */}
                  <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white">
                    <table className="w-full text-left text-sm min-w-[880px]">
                      <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                        <tr>
                          <th className="py-3 px-3.5">Student</th>
                          <th className="py-3 px-3">Milestone</th>
                          <th className="py-3 px-3">Amount</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Receipt</th>
                          <th className="py-3 px-3">Video Access</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand-100 text-ink-800">
                        {filteredInstallments.map((inst) => {
                          const student = students.find((s) => s.id === inst.studentId);
                          const isRestricted = !!(student?.isVideoRestricted);
                          const isOverdue = inst.status !== 'APPROVED' && inst.dueDate <= todayDateStr;

                          return (
                            <tr key={inst.id} className="hover:bg-sand-50/70 transition-colors">
                              <td className="py-3 px-3.5">
                                <div className="font-semibold text-ink-900 text-xs">{inst.studentName || student?.name || 'Student'}</div>
                                <div className="text-[11px] text-ink-500">{inst.studentEmail || student?.email || inst.studentId}</div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-medium text-ink-800 text-xs">
                                  {inst.title}
                                </div>
                                <div className={`text-[11px] ${isOverdue ? 'text-red-600 font-semibold' : 'text-ink-500'}`}>
                                  Due: {inst.dueDate} {isOverdue && '(Overdue)'}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-xs">
                                <span className="font-bold text-ink-900 font-heading">
                                  PKR {inst.amount?.toLocaleString()}
                                </span>
                              </td>

                              <td className="py-3 px-3 whitespace-nowrap">
                                {inst.status === 'APPROVED' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Approved
                                  </span>
                                )}

                                {inst.status === 'UNDER_REVIEW' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Pending Review
                                  </span>
                                )}

                                {inst.status === 'REJECTED' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                                    Rejected
                                  </span>
                                )}

                                {inst.status === 'UNPAID' && (
                                  <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                    isOverdue
                                      ? 'bg-red-50 text-red-800 border-red-200'
                                      : 'bg-sand-100 text-ink-600 border-sand-200'
                                  }`}>
                                    {isOverdue ? 'Overdue' : 'Unpaid'}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                {inst.receiptImageUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectingInst(inst);
                                      setIsRejectingMode(false);
                                      setRejectionReasonInput('');
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-900 hover:text-primary-700 underline underline-offset-2 cursor-pointer"
                                  >
                                    <Eye size={12} />
                                    <span>Receipt</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-ink-400">—</span>
                                )}
                              </td>

                              <td className="py-3 px-3 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentVideo(inst.studentId, inst.studentName, isRestricted)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                                    isRestricted
                                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title={isRestricted ? 'Click to restore video access' : 'Click to restrict video access'}
                                >
                                  {isRestricted ? <Lock size={10} className="text-red-600" /> : <Unlock size={10} className="text-emerald-600" />}
                                  <span>{isRestricted ? 'Restricted' : 'Active'}</span>
                                </button>
                              </td>

                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {inst.status === 'UNDER_REVIEW' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInspectingInst(inst);
                                        setIsRejectingMode(false);
                                        setRejectionReasonInput('');
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-900 hover:bg-primary-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                                    >
                                      <span>Verify</span>
                                    </button>
                                  ) : inst.receiptImageUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInspectingInst(inst);
                                        setIsRejectingMode(false);
                                        setRejectionReasonInput('');
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sand-100 hover:bg-sand-200 text-ink-700 text-xs font-medium transition-colors cursor-pointer"
                                    >
                                      <span>Inspect</span>
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-ink-400">—</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredInstallments.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-10 text-center">
                              <Receipt className="mx-auto h-8 w-8 text-ink-300 mb-2" />
                              <p className="text-xs font-bold text-ink-700">No installments found</p>
                              <p className="text-[11px] text-ink-500">There are no installment records matching your current filter.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: COURSE INVOICES & TUITION (LEGACY) */}
              {activeFeeView === 'invoices' && (
                <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-6 shadow-xs">
              {/* Fee KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-sand-50 border border-sand-200">
                  <span className="text-xs text-ink-500 font-semibold uppercase tracking-wider block">Total Billed Tuition</span>
                  <div className="text-2xl font-bold font-heading text-ink-900 mt-1">
                    PKR {feeSummary.totalBilled.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-ink-500">Across all enrolled tracks</span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider block">Revenue Collected</span>
                  <div className="text-2xl font-bold font-heading text-emerald-900 mt-1">
                    PKR {feeSummary.totalCollected.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-700">Cleared &amp; verified</span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-xs text-amber-800 font-semibold uppercase tracking-wider block">Outstanding Receivables</span>
                  <div className="text-2xl font-bold font-heading text-amber-900 mt-1">
                    PKR {feeSummary.totalOutstanding.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-amber-700">Pending &amp; installment balances</span>
                </div>

                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200">
                  <span className="text-xs text-red-800 font-semibold uppercase tracking-wider block">Overdue Accounts</span>
                  <div className="text-2xl font-bold font-heading text-red-900 mt-1">
                    {feeSummary.overdueCount} Accounts
                  </div>
                  <span className="text-[11px] text-red-700">Requires follow-up</span>
                </div>
              </div>

              {/* Filters, Search Bar & View Mode Toggle */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    type="text"
                    value={feeSearch}
                    onChange={(e) => setFeeSearch(e.target.value)}
                    placeholder="Search by student name, email, invoice #, or program..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-sand-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {['all', 'Paid', 'Partial', 'Pending', 'Overdue', 'Waived'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFeeStatusFilter(status)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                          feeStatusFilter === status
                            ? 'bg-primary-900 text-white'
                            : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                        }`}
                      >
                        {status === 'all' ? 'All Statuses' : status}
                      </button>
                    ))}
                  </div>

                  {/* View Mode Toggle: All Invoices (Flat View) vs Grouped by Student */}
                  <div className="flex items-center gap-1 p-1 bg-sand-100 rounded-xl border border-sand-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setTableViewMode('flat')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tableViewMode === 'flat'
                          ? 'bg-[#0B3324] text-white shadow-xs'
                          : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      <List size={13} />
                      <span>All Invoices (Flat)</span>
                      <span className="text-[10px] font-semibold opacity-80">({filteredFees.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableViewMode('grouped')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tableViewMode === 'grouped'
                          ? 'bg-[#0B3324] text-white shadow-xs'
                          : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      <Users size={13} />
                      <span>Grouped by Student</span>
                      <span className="text-[10px] font-semibold opacity-80">({groupedStudents.length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Fee Ledger Table */}
              <div className="overflow-x-auto rounded-xl border border-sand-200 shadow-2xs">
                <table className="w-full text-left text-sm min-w-[1060px]">
                  <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                    <tr>
                      <th className="py-3 px-3.5">
                        {tableViewMode === 'grouped' ? 'Student & Enrolled Tracks' : 'Student & Invoice No'}
                      </th>
                      <th className="py-3 px-3">Program &amp; Cohort</th>
                      <th className="py-3 px-3">Tuition &amp; Discount</th>
                      <th className="py-3 px-3">Payment Plan</th>
                      <th className="py-3 px-3">Paid / Balance</th>
                      <th className="py-3 px-3">Due Date</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100 text-ink-800">
                    {/* ==================================================== */}
                    {/* MODE 1: ALL INVOICES (FLAT VIEW)                     */}
                    {/* ==================================================== */}
                    {tableViewMode === 'flat' &&
                      filteredFees.map((fee) => {
                        const isSemester = fee.isSemesterWise ?? (
                          fee.program?.toLowerCase().includes('foundation') ||
                          fee.semester?.toLowerCase().includes('semester')
                        );
                        const baseFee = fee.baseFee || fee.totalAmount || 0;
                        const hasDiscount = (Number(fee.discountAmount) || 0) > 0 || fee.discountType === 'waiver';
                        const hasInstallments = isSemester && fee.paymentPlan?.startsWith('installments') && Array.isArray(fee.installments) && fee.installments.length > 0;
                        const paidInstallmentsCount = hasInstallments ? fee.installments.filter(i => i.status === 'Paid').length : 0;
                        const percentPaid = fee.totalAmount > 0 ? Math.min(100, Math.round(((fee.paidAmount || 0) / fee.totalAmount) * 100)) : 100;
                        const isOverdue = fee.status === 'Overdue';
                        const isRowActive = selectedDrawerFeeId === fee.id && isBillingDrawerOpen;

                        // Check if student has multiple course enrollments
                        const studentCourseCount = feeRecords.filter(
                          (f) => (f.studentId && f.studentId === fee.studentId) || f.studentEmail === fee.studentEmail
                        ).length;

                        return (
                          <tr
                            key={fee.id}
                            onClick={() => handleOpenBillingDrawer(fee)}
                            className={`group transition-all cursor-pointer ${
                              isRowActive
                                ? 'bg-emerald-50/80 border-l-4 border-[#0B3324] shadow-2xs'
                                : 'hover:bg-sand-50/70'
                            }`}
                          >
                            <td className="py-3.5 px-3.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-ink-900 group-hover:text-[#0B3324] transition-colors">
                                  {fee.studentName}
                                </span>
                                {studentCourseCount > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const key = fee.studentId || (fee.studentEmail ? fee.studentEmail.toLowerCase() : fee.id);
                                      if (key) {
                                        setExpandedStudentKeys((prev) => new Set([...(prev || []), key]));
                                      }
                                      setFeeSearch('');
                                      setTableViewMode('grouped');
                                    }}
                                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary-900 bg-primary-50 hover:bg-primary-100 px-2 py-0.5 rounded-full border border-primary-200 transition-colors cursor-pointer"
                                    title="Click to view all courses enrolled by this student"
                                  >
                                    <Layers size={9} />
                                    <span>{studentCourseCount} Courses</span>
                                  </button>
                                )}
                              </div>
                              <div className="text-xs text-ink-500">{fee.studentEmail}</div>
                              <div className="text-[11px] text-[#0B3324] font-semibold">{fee.invoiceNo}</div>
                            </td>

                            <td className="py-3.5 px-3 text-xs">
                              <div className="font-semibold text-ink-800">{fee.program}</div>
                              <div className="text-[11px] text-ink-500">
                                {fee.semester || (isSemester ? 'Semester 1' : 'Modular Course')}
                              </div>
                              <span className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded ${
                                isSemester ? 'bg-primary-50 text-primary-800 border border-primary-200/60' : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              }`}>
                                {isSemester ? 'Semester Track' : 'Individual Course'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-xs">
                              <div className="font-bold text-ink-900">
                                PKR {fee.totalAmount?.toLocaleString()}
                              </div>
                              {hasDiscount ? (
                                <div className="mt-1 flex flex-col gap-0.5">
                                  <span className="text-[10px] text-ink-400 line-through">
                                    Base: PKR {baseFee.toLocaleString()}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-900 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200 w-fit">
                                    <Tag size={9} />
                                    {fee.discountType === 'waiver'
                                      ? '100% Scholarship'
                                      : fee.discountType === 'percentage'
                                      ? `-${fee.discountValue}% Off`
                                      : `-PKR ${fee.discountAmount?.toLocaleString()}`}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-ink-400">Standard Tuition</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-xs">
                              {hasInstallments ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                                    <Split size={10} />
                                    {fee.installments.length} Installments
                                  </span>
                                  <div className="text-[10px] text-ink-500">
                                    {paidInstallmentsCount} of {fee.installments.length} paid
                                  </div>
                                </div>
                              ) : isSemester ? (
                                <span className="text-[11px] text-ink-600 bg-sand-100 px-2 py-0.5 rounded-md">
                                  Lump Sum
                                </span>
                              ) : (
                                <span className="text-[11px] text-ink-500 bg-sand-100 px-2 py-0.5 rounded-md">
                                  Upfront (Course)
                                </span>
                              )}
                            </td>

                            {/* Explicit PAID / BALANCE figures above progress bar */}
                            <td className="py-3.5 px-3 text-xs">
                              <div className="flex items-center gap-1.5 text-[11px] mb-1 whitespace-nowrap">
                                <span className="text-primary-900 font-bold">
                                  PKR {fee.paidAmount?.toLocaleString()} Paid
                                </span>
                                <span className="text-ink-300 font-sans">&bull;</span>
                                <span
                                  className={`font-bold ${
                                    fee.balance === 0
                                      ? 'text-primary-800'
                                      : isOverdue
                                      ? 'text-red-600'
                                      : 'text-ink-800'
                                  }`}
                                >
                                  PKR {fee.balance?.toLocaleString()} Due
                                </span>
                              </div>
                              <div className="w-32 bg-sand-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    percentPaid >= 100
                                      ? 'bg-primary-800'
                                      : percentPaid > 0
                                      ? 'bg-primary-600'
                                      : 'bg-sand-400'
                                  }`}
                                  style={{ width: `${percentPaid}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-xs text-ink-600 whitespace-nowrap">
                              {fee.dueDate}
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                  fee.status === 'Paid'
                                    ? 'bg-primary-50 text-primary-900 border border-primary-200'
                                    : fee.status === 'Partial'
                                    ? 'bg-amber-100 text-amber-800'
                                    : fee.status === 'Pending'
                                    ? 'bg-gold-100 text-gold-800'
                                    : fee.status === 'Waived'
                                    ? 'bg-sand-200 text-ink-700 border border-sand-300'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {fee.status}
                              </span>
                            </td>

                            {/* De-cluttered Single Contextual Button */}
                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                              {fee.status === 'Paid' || fee.balance === 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenBillingDrawer(fee);
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white hover:bg-sand-100 text-ink-700 border border-sand-300 font-semibold transition-colors cursor-pointer shadow-2xs"
                                  title="View payment ledger & receipt"
                                >
                                  <span>View Ledger</span>
                                  <span className="text-ink-400 font-bold">&rarr;</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenBillingDrawer(fee);
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#0B3324] hover:bg-[#072419] text-white font-semibold transition-all cursor-pointer shadow-xs"
                                  title="Open unified billing drawer"
                                >
                                  <span>Manage Billing</span>
                                  <span className="text-emerald-300 font-bold">&rarr;</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                    {/* ==================================================== */}
                    {/* MODE 2: GROUPED BY STUDENT VIEW                      */}
                    {/* ==================================================== */}
                    {tableViewMode === 'grouped' &&
                      groupedStudents.map((group) => {
                        const isExpanded = expandedStudentKeys.has(group.studentKey);
                        const isSettled = group.totalBalance === 0;
                        const isGroupActive =
                          selectedDrawerFee &&
                          (selectedDrawerFee.studentId === group.studentId ||
                            selectedDrawerFee.studentEmail === group.studentEmail) &&
                          isBillingDrawerOpen;

                        // Target invoice for primary action: first unpaid invoice, or first invoice
                        const targetInvoice =
                          group.invoices.find((i) => (Number(i.balance) || 0) > 0) || group.invoices[0];

                        return (
                          <React.Fragment key={group.studentKey}>
                            {/* Parent Student Row */}
                            <tr
                              onClick={() => toggleExpandStudent(group.studentKey)}
                              className={`group transition-all cursor-pointer font-medium ${
                                isGroupActive
                                  ? 'bg-emerald-50/90 border-l-4 border-[#0B3324]'
                                  : 'hover:bg-sand-50/80 bg-white'
                              }`}
                            >
                              <td className="py-3.5 px-3.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpandStudent(group.studentKey);
                                    }}
                                    className="p-1 rounded text-ink-500 hover:text-[#0B3324] hover:bg-sand-200 transition-colors"
                                  >
                                    <ChevronRight
                                      size={15}
                                      className={`transition-transform duration-200 ${
                                        isExpanded ? 'rotate-90 text-[#0B3324]' : 'text-ink-400'
                                      }`}
                                    />
                                  </button>
                                  <div>
                                    <div className="font-bold text-ink-900 group-hover:text-[#0B3324] transition-colors flex items-center gap-2">
                                      <span>{group.studentName}</span>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-900 bg-primary-100/80 px-2 py-0.5 rounded-full border border-primary-200">
                                        <Layers size={9} />
                                        {group.invoices.length} Active Courses
                                      </span>
                                    </div>
                                    <div className="text-xs text-ink-500">{group.studentEmail}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Stacked Program Pills */}
                              <td className="py-3.5 px-3 text-xs">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {group.programList.map((prog) => (
                                    <span
                                      key={prog}
                                      className="inline-block text-[10px] font-bold bg-sand-100 text-ink-800 px-2 py-0.5 rounded border border-sand-200"
                                    >
                                      {prog}
                                    </span>
                                  ))}
                                </div>
                              </td>

                              {/* Aggregated Total Billed */}
                              <td className="py-3.5 px-3 text-xs">
                                <div className="font-bold text-ink-900">
                                  PKR {group.totalBilled.toLocaleString()}
                                </div>
                                <span className="text-[10px] text-ink-400">
                                  Total ({group.invoices.length} invoices)
                                </span>
                              </td>

                              {/* Aggregated Payment Plan */}
                              <td className="py-3.5 px-3 text-xs">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-700 bg-sand-100 px-2 py-0.5 rounded-md">
                                  {group.invoices.length} Invoices
                                </span>
                              </td>

                              {/* Aggregated Paid / Balance */}
                              <td className="py-3.5 px-3 text-xs">
                                <div className="flex items-center gap-1.5 text-[11px] mb-1 whitespace-nowrap">
                                  <span className="text-primary-900 font-bold">
                                    PKR {group.totalPaid.toLocaleString()} Paid
                                  </span>
                                  <span className="text-ink-300 font-sans">&bull;</span>
                                  <span
                                    className={`font-bold ${
                                      isSettled
                                        ? 'text-primary-800'
                                        : group.hasOverdue
                                        ? 'text-red-600'
                                        : 'text-ink-900'
                                    }`}
                                  >
                                    PKR {group.totalBalance.toLocaleString()} Due
                                  </span>
                                </div>
                                <div className="w-32 bg-sand-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      group.percentPaid >= 100
                                        ? 'bg-primary-800'
                                        : group.percentPaid > 0
                                        ? 'bg-primary-600'
                                        : 'bg-sand-400'
                                    }`}
                                    style={{ width: `${group.percentPaid}%` }}
                                  />
                                </div>
                              </td>

                              {/* Earliest Due */}
                              <td className="py-3.5 px-3 text-xs text-ink-600 whitespace-nowrap">
                                {group.earliestDue}
                              </td>

                              {/* Aggregated Status */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span
                                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                    group.status === 'Paid'
                                      ? 'bg-primary-50 text-primary-900 border border-primary-200'
                                      : group.status === 'Partial'
                                      ? 'bg-amber-100 text-amber-800'
                                      : group.status === 'Pending'
                                      ? 'bg-gold-100 text-gold-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {group.status}
                                </span>
                              </td>

                              {/* Parent Row Contextual Action */}
                              <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                {isSettled ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenBillingDrawer(targetInvoice);
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white hover:bg-sand-100 text-ink-700 border border-sand-300 font-semibold transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <span>View Ledgers</span>
                                    <span className="text-ink-400 font-bold">&rarr;</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenBillingDrawer(targetInvoice);
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#0B3324] hover:bg-[#072419] text-white font-semibold transition-all cursor-pointer shadow-xs"
                                  >
                                    <span>Manage Billing</span>
                                    <span className="text-emerald-300 font-bold">&rarr;</span>
                                  </button>
                                )}
                              </td>
                            </tr>

                            {/* Nested Sub-Rows (Expanded Course Invoices) */}
                            {isExpanded &&
                              group.invoices.map((inv) => {
                                const isSubSemester = inv.isSemesterWise ?? (
                                  inv.program?.toLowerCase().includes('foundation') ||
                                  inv.semester?.toLowerCase().includes('semester')
                                );
                                const invBaseFee = inv.baseFee || inv.totalAmount || 0;
                                const invHasDiscount = (Number(inv.discountAmount) || 0) > 0 || inv.discountType === 'waiver';
                                const invPercentPaid = inv.totalAmount > 0 ? Math.min(100, Math.round(((inv.paidAmount || 0) / inv.totalAmount) * 100)) : 100;
                                const isSubRowActive = selectedDrawerFeeId === inv.id && isBillingDrawerOpen;

                                return (
                                  <tr
                                    key={inv.id}
                                    onClick={() => handleOpenBillingDrawer(inv)}
                                    className={`text-xs transition-colors cursor-pointer border-t border-sand-100 ${
                                      isSubRowActive
                                        ? 'bg-emerald-50/70 border-l-4 border-emerald-700'
                                        : 'bg-sand-50/50 hover:bg-sand-100/70'
                                    }`}
                                  >
                                    <td className="py-2.5 pl-9 pr-3">
                                      <div className="flex items-center gap-1.5 text-ink-600">
                                        <span className="text-sand-400">↳</span>
                                        <span className="text-[#0B3324] font-bold">
                                          {inv.invoiceNo}
                                        </span>
                                        <span className="text-ink-400">&bull;</span>
                                        <span className="text-ink-700 font-medium truncate max-w-[160px]">
                                          {inv.semester || 'Modular Course'}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="py-2.5 px-3">
                                      <span className="font-semibold text-ink-800">{inv.program}</span>
                                      <span className="text-[10px] text-ink-400 block">
                                        {isSubSemester ? 'Semester Program' : 'Modular Track'}
                                      </span>
                                    </td>

                                    <td className="py-2.5 px-3">
                                      <span className="font-bold text-ink-900">
                                        PKR {inv.totalAmount?.toLocaleString()}
                                      </span>
                                      {invHasDiscount && (
                                        <span className="text-[10px] text-primary-900 bg-primary-50 px-1 rounded block w-fit font-bold border border-primary-200">
                                          Concession Applied
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-2.5 px-3">
                                      <span className="text-[10px] text-ink-600 bg-white px-2 py-0.5 rounded border border-sand-200">
                                        {inv.paymentPlan?.startsWith('installments')
                                          ? `${inv.installments?.length || 2} Parts`
                                          : 'Lump Sum'}
                                      </span>
                                    </td>

                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-1 text-[10px]">
                                        <span className="text-primary-900 font-bold">
                                          PKR {inv.paidAmount?.toLocaleString()}
                                        </span>
                                        <span className="text-ink-300">/</span>
                                        <span
                                          className={`font-bold ${
                                            inv.balance === 0 ? 'text-primary-800' : 'text-ink-900'
                                          }`}
                                        >
                                          PKR {inv.balance?.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="w-24 bg-sand-200 h-1 rounded-full overflow-hidden mt-0.5">
                                        <div
                                          className="h-full bg-primary-800 rounded-full"
                                          style={{ width: `${invPercentPaid}%` }}
                                        />
                                      </div>
                                    </td>

                                    <td className="py-2.5 px-3 text-ink-500">
                                      {inv.dueDate}
                                    </td>

                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                          inv.status === 'Paid'
                                            ? 'bg-primary-50 text-primary-900 border border-primary-200'
                                            : inv.status === 'Partial'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-gold-100 text-gold-800'
                                        }`}
                                      >
                                        {inv.status}
                                      </span>
                                    </td>

                                    <td className="py-2.5 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenBillingDrawer(inv);
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-white hover:bg-sand-100 text-ink-700 border border-sand-300 font-semibold transition-colors cursor-pointer"
                                      >
                                        <span>Open Course</span>
                                        <ArrowRight size={10} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}

                    {filteredFees.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-ink-500">
                          No fee records found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

          {/* Tab 5: Admissions */}
          {activeTab === 'applications' && (
            <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sand-200/80">
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                    Admissions
                  </h2>
                  <p className="text-xs text-ink-500 mt-1">
                    Review candidate qualifications, education background, and campus preferences.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-2 flex items-center gap-3 shrink-0">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <FileCheck size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Pending Applications</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-ink-900 font-heading">38</span>
                      <span className="text-[11px] text-amber-800 font-semibold">Requires review</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Kashif Mehmood',
                    age: '22 yrs',
                    education: 'BS Computer Science (LUMS)',
                    program: 'Ilm Foundations (Lahore Campus)',
                    applied: 'Yesterday',
                  },
                  {
                    name: 'Sara Farhan',
                    age: '24 yrs',
                    education: 'MBBS Doctor',
                    program: 'Ilm Foundations (Live Online)',
                    applied: '2 days ago',
                  },
                  {
                    name: 'Zeeshan Ali',
                    age: '20 yrs',
                    education: 'A-Levels Completed',
                    program: 'Purification of the Heart Intensive',
                    applied: '3 days ago',
                  },
                  {
                    name: 'Hina Qureshi',
                    age: '26 yrs',
                    education: 'Chartered Accountant',
                    program: 'Ilm Foundations (Live Online)',
                    applied: '4 days ago',
                  },
                ].map((app, i) => (
                  <div
                    key={i}
                    className="border border-sand-200 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-sand-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-ink-900">{app.name}</h4>
                        <span className="text-[11px] text-ink-400">{app.applied}</span>
                      </div>
                      <p className="text-xs text-primary-800 font-medium mt-0.5">{app.program}</p>
                      <p className="text-xs text-ink-500 mt-2">
                        Education: <span className="text-ink-700">{app.education}</span> • Age: {app.age}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-sand-100">
                      <button
                        type="button"
                        onClick={() => setAccountsToast({
                          type: 'success',
                          title: 'Interview Scheduled',
                          message: `Candidate ${app.name} has been queued for faculty interview.`
                        })}
                        className="px-3 py-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-xs font-semibold text-ink-700 transition-colors cursor-pointer"
                      >
                        Schedule Interview
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountsToast({
                          type: 'success',
                          title: 'Application Approved',
                          message: `Application for ${app.name} approved. Welcome packet issued.`
                        })}
                        className="px-3 py-1.5 rounded-lg bg-primary-900 hover:bg-primary-800 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        Approve &amp; Enroll
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Schedules Planner */}
          {activeTab === 'schedules' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Minimal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                    Schedule
                  </h2>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Weekly timetable across Google Meet and Lahore DHA Phase 6 campus with student broadcasts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddScheduleSlot}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus size={14} />
                  <span>Add Lecture Slot</span>
                </button>
              </div>

              {/* Minimal 4-Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-sand-200">
                  <span className="text-[10px] text-ink-500 font-bold uppercase tracking-wider block">Total Weekly</span>
                  <div className="text-sm font-bold text-ink-900 mt-0.5">{activeWeeklySlots.length} Slots</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-sand-200">
                  <span className="text-[10px] text-emerald-900 font-bold uppercase tracking-wider block">Google Meet</span>
                  <div className="text-sm font-bold text-emerald-900 mt-0.5">{onlineMeetSlotsCount} Slots</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-sand-200">
                  <span className="text-[10px] text-ink-500 font-bold uppercase tracking-wider block">DHA Phase 6</span>
                  <div className="text-sm font-bold text-ink-800 mt-0.5">{onSiteCampusSlotsCount} Slots</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-sand-200">
                  <span className="text-[10px] text-ink-500 font-bold uppercase tracking-wider block">Schedule Status</span>
                  <div className="text-xs font-bold text-emerald-800 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    {scheduleConflictCount === 0 ? 'Synced • 0 Conflicts' : `${scheduleConflictCount} Conflict(s)`}
                  </div>
                </div>
              </div>

              {/* Minimal Filter & View Bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                  <input
                    type="text"
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                    placeholder="Search lecture topic, course, faculty..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-sand-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                {/* Filter Selectors & View Toggle */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={scheduleCohortFilter}
                    onChange={(e) => setScheduleCohortFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-sand-200 bg-white font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="all">All Cohorts</option>
                    <option value="foundations_sem1">Foundations • Sem 1</option>
                    <option value="foundations_sem2">Foundations • Sem 2</option>
                    <option value="intensives_modular">Intensives • Modular</option>
                  </select>

                  <select
                    value={scheduleModalityFilter}
                    onChange={(e) => setScheduleModalityFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-sand-200 bg-white font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="all">All Modalities</option>
                    <option value="online_meet">Google Meet</option>
                    <option value="onsite_campus">DHA On-Site</option>
                  </select>

                  <select
                    value={scheduleInstructorFilter}
                    onChange={(e) => setScheduleInstructorFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-sand-200 bg-white font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="all">All Faculty</option>
                    {Array.from(new Set(scheduleSlots.map((s) => s.instructorName))).filter(Boolean).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>

                  {/* View Switcher Toggle */}
                  <div className="flex items-center p-0.5 rounded-xl bg-sand-100 border border-sand-200">
                    <button
                      type="button"
                      onClick={() => setScheduleViewMode('agenda')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        scheduleViewMode === 'agenda'
                          ? 'bg-white text-ink-900 shadow-xs font-bold'
                          : 'text-ink-600 hover:text-ink-950'
                      }`}
                    >
                      <List size={12} />
                      <span>Agenda</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduleViewMode('weekly_grid')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        scheduleViewMode === 'weekly_grid'
                          ? 'bg-white text-ink-900 shadow-xs font-bold'
                          : 'text-ink-600 hover:text-ink-950'
                      }`}
                    >
                      <CalendarDays size={12} />
                      <span>Weekly Grid</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* VIEW 1: AGENDA LIST VIEW */}
              {scheduleViewMode === 'agenda' && (
                <div className="space-y-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const daySlots = filteredScheduleSlots
                      .filter((s) => s.dayOfWeek === day)
                      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

                    if (daySlots.length === 0) return null;

                    return (
                      <div key={day} className="space-y-2">
                        {/* Day Header */}
                        <div className="flex items-center gap-2 pb-1 border-b border-sand-200">
                          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-ink-900">
                            {day}
                          </h4>
                          <span className="text-[10px] font-semibold text-ink-600 bg-sand-100 px-1.5 py-0.2 rounded">
                            {daySlots.length} {daySlots.length === 1 ? 'Lecture' : 'Lectures'}
                          </span>
                        </div>

                        {/* Minimal cards under this day */}
                        <div className="grid grid-cols-1 gap-2">
                          {daySlots.map((slot) => {
                            const isOnline = slot.modality === 'online_meet';
                            const isCancelled = slot.status === 'cancelled';
                            const isRescheduled = slot.status === 'rescheduled';

                            return (
                              <div
                                key={slot.id}
                                className={`rounded-xl border bg-white p-3 sm:p-3.5 transition-all shadow-2xs hover:border-sand-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isCancelled
                                    ? 'border-red-200 bg-red-50/20 opacity-80'
                                    : isRescheduled
                                    ? 'border-amber-200 bg-amber-50/10'
                                    : 'border-sand-200'
                                }`}
                              >
                                {/* Left Content */}
                                <div className="flex items-start gap-3 min-w-0">
                                  {/* Time block */}
                                  <div className="text-left sm:text-center shrink-0 min-w-[95px]">
                                    <span className="block text-xs font-bold text-ink-900 whitespace-nowrap">
                                      {formatSlotTimeRange(slot.startTime, slot.endTime)}
                                    </span>
                                    <span className="text-[10px] text-ink-400 font-medium">PKT</span>
                                  </div>

                                  <div className="h-8 w-px bg-sand-200 shrink-0 hidden sm:block" />

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                      <span className="text-[10px] font-bold text-primary-900 uppercase tracking-wide">
                                        {slot.courseTitle}
                                      </span>
                                      {isOnline ? (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary-50 text-primary-900 border border-primary-200 inline-flex items-center gap-1">
                                          <Video size={10} />
                                          Google Meet
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sand-100 text-ink-700 border border-sand-200 inline-flex items-center gap-1">
                                          <MapPin size={10} />
                                          DHA Phase 6
                                        </span>
                                      )}
                                      <span className="text-[10px] text-ink-400">
                                        • {slot.cohortName} ({slot.enrolledCount} enrolled)
                                      </span>
                                      {isRescheduled && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                          Rescheduled
                                        </span>
                                      )}
                                      {isCancelled && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-300">
                                          Cancelled
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="font-bold text-xs sm:text-sm text-ink-900 truncate">
                                      {slot.topic || `${slot.courseTitle} — Regular Lecture Session`}
                                    </h4>

                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-ink-500">
                                      <span>Faculty: <strong className="text-ink-800 font-semibold">{slot.instructorName}</strong></span>
                                      {isOnline ? (
                                        slot.meetLink && (
                                          <>
                                            <span>•</span>
                                            <a
                                              href={slot.meetLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-primary-900 font-semibold hover:underline inline-flex items-center gap-0.5"
                                            >
                                              Launch Meet <ExternalLink size={10} />
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => handleCopyMeetLink(slot.id, slot.meetLink)}
                                              className="text-[10px] text-ink-400 hover:text-ink-700 cursor-pointer"
                                            >
                                              {copiedSlotId === slot.id ? 'Copied!' : 'Copy'}
                                            </button>
                                          </>
                                        )
                                      ) : (
                                        <>
                                          <span>•</span>
                                          <span>{slot.campusRoom || 'Room 204'}</span>
                                          <span>(Cap: {slot.roomCapacity || 35})</span>
                                        </>
                                      )}
                                      <span>•</span>
                                      <span className="text-emerald-800">🔔 Notified {slot.enrolledCount} students</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Actions */}
                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickRemind(slot)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="Send instant reminder blast"
                                  >
                                    <Bell size={12} />
                                    <span>Remind</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditScheduleSlot(slot)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-ink-700 bg-sand-100 hover:bg-sand-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 size={12} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteScheduleSlotItem(slot.id, slot.courseTitle)}
                                    className="p-1 rounded-lg text-ink-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete slot"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {filteredScheduleSlots.length === 0 && (
                    <div className="py-12 text-center bg-white rounded-2xl border border-sand-200 p-8 space-y-3">
                      <Calendar className="w-10 h-10 text-ink-300 mx-auto" />
                      <h4 className="text-sm font-bold text-ink-800">No lecture slots found</h4>
                      <p className="text-xs text-ink-500 max-w-sm mx-auto">
                        No schedule entries match your current search and filter criteria. Adjust your filters or add a new lecture slot.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleSearch('');
                          setScheduleCohortFilter('all');
                          setScheduleModalityFilter('all');
                          setScheduleInstructorFilter('all');
                        }}
                        className="px-4 py-2 text-xs font-bold text-primary-900 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: WEEKLY GRID VIEW (7-Column Timetable) */}
              {scheduleViewMode === 'weekly_grid' && (
                <div className="bg-white rounded-2xl border border-sand-200 p-5 shadow-xs overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-7 gap-3">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const daySlots = filteredScheduleSlots
                          .filter((s) => s.dayOfWeek === day)
                          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

                        return (
                          <div key={day} className="flex flex-col rounded-xl bg-sand-50/70 border border-sand-200/80 p-2.5 min-h-[460px]">
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-sand-200 text-center">
                              <span className="font-heading font-bold text-xs uppercase tracking-wider text-ink-900">
                                {day.slice(0, 3)}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-ink-600 border border-sand-200">
                                {daySlots.length}
                              </span>
                            </div>

                            {/* Column Cards */}
                            <div className="space-y-2 flex-1">
                              {daySlots.map((slot) => {
                                const isOnline = slot.modality === 'online_meet';
                                const isCancelled = slot.status === 'cancelled';

                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => handleOpenEditScheduleSlot(slot)}
                                    className={`p-2.5 rounded-xl border bg-white cursor-pointer transition-all hover:shadow-sm hover:scale-[1.01] ${
                                      isCancelled
                                        ? 'border-red-300 border-dashed opacity-75'
                                        : isOnline
                                        ? 'border-l-4 border-l-primary-800 border-sand-200'
                                        : 'border-l-4 border-l-gold-500 border-sand-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-[10px] text-ink-500 mb-1">
                                      <span className="font-bold text-ink-800">
                                        {formatTime12h(slot.startTime)}
                                      </span>
                                      <span>{slot.durationMinutes}m</span>
                                    </div>

                                    <h5 className="font-heading font-bold text-xs text-ink-900 line-clamp-1" title={slot.courseTitle}>
                                      {slot.courseTitle}
                                    </h5>
                                    <p className="text-[10px] text-ink-500 line-clamp-1 mt-0.5" title={slot.topic}>
                                      {slot.topic || 'Regular Lecture'}
                                    </p>

                                    <div className="mt-2 pt-1.5 border-t border-sand-100 flex items-center justify-between text-[9px]">
                                      <span className="truncate max-w-[80px] font-medium text-ink-600" title={slot.instructorName}>
                                        {slot.instructorName.split(' ')[0]}
                                      </span>
                                      {isOnline ? (
                                        <span className="text-primary-800 font-bold flex items-center gap-0.5">
                                          <Video size={10} />
                                          Online
                                        </span>
                                      ) : (
                                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                          <MapPin size={10} />
                                          DHA
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {daySlots.length === 0 && (
                                <div className="py-8 text-center text-[11px] text-ink-300 italic">
                                  No classes
                                </div>
                              )}
                            </div>

                            {/* Quick Add Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingScheduleSlot({
                                  dayOfWeek: day,
                                  startTime: '18:00',
                                  endTime: '20:30',
                                  cohortId: 'foundations_sem1',
                                  cohortName: 'Ilm Foundations • Semester 1',
                                  enrolledCount: 15,
                                  courseId: 'crs_adm_01',
                                  courseTitle: "Tafsīr-ul-Qur'ān",
                                  modality: 'online_meet',
                                  meetLink: 'https://meet.google.com/ilm-live-class',
                                  campusRoom: 'Room 204 • Main Academic Block',
                                  roomCapacity: 35,
                                });
                                setIsScheduleDrawerOpen(true);
                              }}
                              className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-sand-300 hover:border-primary-600 hover:bg-white text-[10px] font-bold text-ink-500 hover:text-primary-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus size={11} />
                              <span>Add Slot</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIT LOG: Recent Schedule Notifications Broadcast Log */}
              <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsAuditLogExpanded(!isAuditLogExpanded)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-sand-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-emerald-800" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-ink-900">
                        Recent Schedule Notifications Broadcast Log
                      </h4>
                      <p className="text-[11px] text-ink-500">
                        Timestamped audit trail of broadcast alerts dispatched to students and faculty
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sand-100 text-ink-700">
                      {scheduleNotifications.length} Broadcasts
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-ink-400 transition-transform ${isAuditLogExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {isAuditLogExpanded && (
                  <div className="border-t border-sand-200 p-6 overflow-x-auto animate-fadeIn">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-sand-200 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                          <th className="py-2.5 px-3">Target Cohort &amp; Course</th>
                          <th className="py-2.5 px-3">Change Broadcast Summary</th>
                          <th className="py-2.5 px-3">Channels</th>
                          <th className="py-2.5 px-3">Recipients</th>
                          <th className="py-2.5 px-3">Dispatched At</th>
                          <th className="py-2.5 px-3 text-right">Dispatcher</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand-100 text-xs">
                        {scheduleNotifications.map((notif) => (
                          <tr key={notif.id} className="hover:bg-sand-50/60 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-bold text-ink-900 block">{notif.courseTitle}</span>
                              <span className="text-[10px] text-ink-500">{notif.cohortName}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-medium text-ink-800 block">{notif.changeSummary}</span>
                              {notif.customNote && (
                                <span className="text-[10px] text-ink-500 italic block mt-0.5">
                                  Note: "{notif.customNote}"
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1">
                                {(notif.channels || ['in_app']).map((ch) => (
                                  <span
                                    key={ch}
                                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-50 text-primary-900 border border-primary-200"
                                  >
                                    {ch === 'in_app' ? 'Portal' : ch}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-ink-700 font-semibold">
                              👥 {notif.recipientCount} Students
                            </td>
                            <td className="py-3 px-3 text-ink-500 text-[11px]">
                              {new Date(notif.sentAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-3 text-right text-[11px] text-ink-600 font-medium">
                              {notif.senderAdmin}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
            
          {/* ==================================================== */}
          {/* TAB: E-LIBRARY RESOURCE MANAGEMENT                  */}
          {/* ==================================================== */}
          {activeTab === 'library' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Banner & Action Button */}
              <div className="bg-white rounded-2xl border border-sand-200 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                    e-Library
                  </h2>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    to="/library"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-sand-300 text-xs font-semibold text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>View Student Library</span>
                  </Link>
                  <button
                    onClick={handleOpenAddLibraryModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-900 text-white text-xs font-semibold hover:bg-primary-800 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Add Resource</span>
                  </button>
                </div>
              </div>

              {/* Filter & Search Controls */}
              <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      placeholder="Search by title, author, scholar, or content keywords..."
                      className="w-full pl-9 pr-4 py-2 text-xs border border-sand-300 rounded-xl bg-sand-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all"
                    />
                    {librarySearch && (
                      <button
                        onClick={() => setLibrarySearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 text-xs"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Type Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-ink-500 shrink-0">Type:</label>
                    <select
                      value={libraryTypeFilter}
                      onChange={(e) => setLibraryTypeFilter(e.target.value)}
                      className="text-xs border border-sand-300 rounded-xl px-3 py-2 bg-white text-ink-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="all">All Resource Types</option>
                      <option value="reference">Reference Works</option>
                      <option value="textbook">Course Textbooks</option>
                      <option value="course-material">Study Materials</option>
                    </select>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-sand-100">
                  <span className="text-[11px] font-bold uppercase text-ink-400 mr-1 shrink-0">Category:</span>
                  <button
                    onClick={() => setLibraryCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                      libraryCategoryFilter === 'all'
                        ? 'bg-primary-900 text-white'
                        : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                    }`}
                  >
                    All ({libraryList.length})
                  </button>
                  {libraryCategories.map((cat) => {
                    const count = libraryList.filter((i) => i.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setLibraryCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                          libraryCategoryFilter === cat
                            ? 'bg-primary-900 text-white'
                            : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                        }`}
                      >
                        {cat} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resource Table / Catalog Listing */}
              <div className="bg-white rounded-2xl border border-sand-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-sand-50/80 border-b border-sand-200 text-ink-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4">Title & Details</th>
                        <th className="py-3.5 px-3">Pages & Size</th>
                        <th className="py-3.5 px-3 text-center">Featured</th>
                        <th className="py-3.5 px-3">Access Links</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {filteredLibraryItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-ink-400">
                            <div className="w-12 h-12 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto mb-3 text-ink-400">
                              <BookOpen size={22} />
                            </div>
                            <p className="text-sm font-semibold text-ink-700">No library resources found</p>
                            <p className="text-xs text-ink-500 mt-1">Try adjusting your search criteria or add a new resource.</p>
                            <button
                              onClick={handleOpenAddLibraryModal}
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-900 text-white text-xs font-medium hover:bg-primary-800 transition-colors cursor-pointer"
                            >
                              <Plus size={14} /> Add First Resource
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredLibraryItems.map((item) => {
                          const isFeatured = Boolean(item.featured);
                          const typeLabel =
                            item.type === 'reference'
                              ? 'Reference'
                              : item.type === 'textbook'
                              ? 'Textbook'
                              : 'Study Material';

                          return (
                            <tr key={item.id} className="hover:bg-sand-50/60 transition-colors">
                              {/* Title & Author */}
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-sand-100 text-primary-900 flex items-center justify-center shrink-0 mt-0.5">
                                    <BookMarked size={16} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-heading font-bold text-ink-900 text-xs truncate">
                                      {item.title}
                                    </p>
                                    <p className="text-[11px] text-ink-500 truncate mt-0.5">
                                      {item.author || 'Author unspecified'}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Pages & Size */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <p className="font-semibold text-ink-900 text-xs">
                                  {item.pages > 0 ? `${item.pages} pgs` : '—'}
                                </p>
                                <p className="text-[10px] text-ink-400">
                                  {item.fileSize || item.language || 'Digital'}
                                </p>
                              </td>

                              {/* Featured Toggle */}
                              <td className="py-3.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleLibraryFeatured(item.id)}
                                  title={isFeatured ? 'Featured on e-Library — click to unfeature' : 'Click to feature on e-Library home'}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isFeatured
                                      ? 'text-amber-500 hover:bg-amber-50'
                                      : 'text-ink-300 hover:text-amber-500 hover:bg-sand-100'
                                  }`}
                                >
                                  <Star
                                    size={16}
                                    className={isFeatured ? 'fill-amber-400 text-amber-500' : ''}
                                  />
                                </button>
                              </td>

                              {/* Access Links */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  {item.downloadUrl ? (
                                    <a
                                      href={item.downloadUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded-md text-primary-700 hover:bg-primary-50 transition-colors"
                                      title="Test Download Link"
                                    >
                                      <Download size={14} />
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-ink-300">No link</span>
                                  )}
                                  {item.externalUrl && (
                                    <a
                                      href={item.externalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded-md text-ink-500 hover:bg-sand-100 transition-colors"
                                      title="Test Online Link"
                                    >
                                      <ExternalLink size={14} />
                                    </a>
                                  )}
                                </div>
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleOpenEditLibraryModal(item)}
                                    className="p-1.5 rounded-lg text-ink-600 hover:text-primary-900 hover:bg-sand-100 transition-colors cursor-pointer"
                                    title="Edit Resource"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteLibraryModal(item)}
                                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Delete Resource"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

            
          {/* ==================================================== */}
          {/* TAB: DAILY REFLECTIONS & QUOTES MANAGEMENT          */}
          {/* ==================================================== */}
          {activeTab === 'quotes' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Banner & Action Button */}
              <div className="bg-white rounded-2xl border border-sand-200 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                    Quotes
                  </h2>
                  <p className="text-xs text-ink-500 mt-1 max-w-2xl">
                    Authentic Hadith, Quranic ayahs, and scholarly reflections displayed on the student dashboard hero card.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    to="/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sand-300 text-xs font-semibold text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>View Student Dashboard</span>
                  </Link>
                  <button
                    onClick={handleOpenAddQuoteModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-900 text-white text-xs font-semibold hover:bg-primary-800 transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Add Quote</span>
                  </button>
                </div>
              </div>

              {/* Top Row: KPIs and Live Student Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 2 Cols: KPIs */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-sand-200/80 p-4 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Total Quotes</span>
                      <div className="w-7 h-7 rounded-lg bg-sand-100 text-primary-900 flex items-center justify-center">
                        <Quote size={14} />
                      </div>
                    </div>
                    <p className="text-2xl font-heading font-bold text-ink-900">{quotesMetrics.total}</p>
                    <p className="text-[11px] text-ink-400 mt-1">In platform database</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-sand-200/80 p-4 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Active Pool</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 size={14} />
                      </div>
                    </div>
                    <p className="text-2xl font-heading font-bold text-emerald-800">{quotesMetrics.active}</p>
                    <p className="text-[11px] text-ink-400 mt-1">Rotating daily</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-sand-200/80 p-4 shadow-2xs col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Today's Display</span>
                      <div className="w-7 h-7 rounded-lg bg-gold-50 text-gold-700 flex items-center justify-center">
                        <Star size={14} className={quotesMetrics.pinnedQuote ? 'fill-gold-500 text-gold-600' : 'text-gold-600'} />
                      </div>
                    </div>
                    <p className="text-sm font-heading font-bold text-ink-900 truncate">
                      {quotesMetrics.pinnedQuote ? quotesMetrics.pinnedQuote.source : 'Daily Rotation'}
                    </p>
                    <p className="text-[11px] text-ink-400 mt-1">
                      {quotesMetrics.pinnedQuote ? 'Admin Pinned' : 'Automated Calendar'}
                    </p>
                  </div>
                </div>

                {/* 1 Col: Live Student Preview Card */}
                <div className="bg-gradient-to-br from-[#0B3324] via-[#0F422F] to-[#072318] rounded-2xl p-5 border border-primary-900 shadow-md text-white flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                      <Eye size={12} />
                      Live Student Card Preview
                    </span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-sand-200">
                      Hero Banner
                    </span>
                  </div>

                  {/* Exact Visual Replica */}
                  <div className="relative rounded-xl border-l-4 border-gold-500 bg-white/5 backdrop-blur-sm p-4 border border-white/10 my-auto">
                    <Quote className="absolute top-2.5 right-2.5 h-5 w-5 text-gold-400/20" />
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-500/20">
                        <BookOpen className="h-3.5 w-3.5 text-gold-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs leading-relaxed text-sand-100 italic line-clamp-4">
                          &ldquo;{activeTodayQuote?.text || 'The seeking of knowledge is obligatory for every Muslim.'}&rdquo;
                        </p>
                        <p className="text-[11px] font-semibold text-gold-400">
                          — {activeTodayQuote?.source || 'Sunan Ibn Majah 224'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-sand-300 mt-3 text-right">
                    {activeTodayQuote?.pinned ? '★ Currently pinned for all students' : 'Rotating dynamically'}
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      value={quoteSearch}
                      onChange={(e) => setQuoteSearch(e.target.value)}
                      placeholder="Search by quote text, book citation, or keywords..."
                      className="w-full pl-9 pr-4 py-2 text-xs border border-sand-300 rounded-xl bg-sand-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all"
                    />
                    {quoteSearch && (
                      <button
                        onClick={() => setQuoteSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 text-xs"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Type Filter */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'all', label: 'All Quotes' },
                      { id: 'hadith', label: 'Hadith' },
                      { id: 'quran', label: 'Quran' },
                      { id: 'scholarly', label: 'Scholarly' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setQuoteTypeFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          quoteTypeFilter === tab.id
                            ? 'bg-primary-900 text-white'
                            : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quotes Listing Table */}
              <div className="bg-white rounded-2xl border border-sand-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-sand-50/80 border-b border-sand-200 text-ink-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4">Quote Text & Word Count</th>
                        <th className="py-3.5 px-3">Reference / Citation</th>
                        <th className="py-3.5 px-3">Category</th>
                        <th className="py-3.5 px-3 text-center">Pin Today</th>
                        <th className="py-3.5 px-3">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {filteredQuotes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-ink-400">
                            <div className="w-12 h-12 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto mb-3 text-ink-400">
                              <Quote size={22} />
                            </div>
                            <p className="text-sm font-semibold text-ink-700">No quotes match your filter</p>
                            <p className="text-xs text-ink-500 mt-1">Add a new quote or adjust your search.</p>
                            <button
                              onClick={handleOpenAddQuoteModal}
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-900 text-white text-xs font-medium hover:bg-primary-800 transition-colors cursor-pointer"
                            >
                              <Plus size={14} /> Add First Quote
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredQuotes.map((q) => {
                          const wCount = countWords(q.text);
                          const isPinned = Boolean(q.pinned);
                          return (
                            <tr key={q.id} className="hover:bg-sand-50/60 transition-colors">
                              {/* Text & Word count */}
                              <td className="py-3.5 px-4 max-w-md">
                                <p className="font-medium text-ink-900 text-xs italic leading-relaxed">
                                  &ldquo;{q.text}&rdquo;
                                </p>
                                <span className="inline-block mt-1 text-[10px] text-ink-400 font-medium">
                                  {wCount}/40 words
                                </span>
                              </td>

                              {/* Source */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span className="font-heading font-bold text-ink-800 text-xs">
                                  {q.source}
                                </span>
                              </td>

                              {/* Type */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  q.type === 'quran'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : q.type === 'hadith'
                                    ? 'bg-gold-100 text-gold-900 border border-gold-300'
                                    : 'bg-sand-100 text-ink-700 border border-sand-300'
                                }`}>
                                  {q.type}
                                </span>
                              </td>

                              {/* Pin Toggle */}
                              <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleQuotePinned(q.id)}
                                  title={isPinned ? "Currently pinned today — click to unpin" : "Pin as today's active quote for all students"}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isPinned
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                                      : 'text-ink-400 hover:text-amber-600 hover:bg-sand-100'
                                  }`}
                                >
                                  <Star size={14} className={isPinned ? 'fill-amber-500 text-amber-600' : ''} />
                                  <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                                </button>
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  q.active !== false
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-sand-200 text-ink-600'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${q.active !== false ? 'bg-emerald-500' : 'bg-ink-400'}`} />
                                  {q.active !== false ? 'Active' : 'Archived'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleOpenEditQuoteModal(q)}
                                    className="p-1.5 rounded-lg text-ink-600 hover:text-primary-900 hover:bg-sand-100 transition-colors cursor-pointer"
                                    title="Edit Quote"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteQuoteModal(q)}
                                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Delete Quote"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

            </main>
          </div>
        </div>

        {/* Course Student Roster & Enrollment Management Modal */}
        {rosterModalCourse && (
          <div className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-sand-200">
              {/* Modal Header */}
              <div className="px-6 py-5 bg-sand-50/80 border-b border-sand-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-gold-100 text-gold-900 border border-gold-300">
                      {rosterModalCourse.category === 'foundations' ? 'ilm Foundations' : 'Intensive'}
                    </span>
                    <span className="text-xs text-ink-500 font-medium">Course Roster Management</span>
                  </div>
                  <h3 className="text-lg font-bold text-ink-900 mt-1 line-clamp-1">
                    {rosterModalCourse.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseRosterModal}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-200/60 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Cohort Notice if Foundations */}
                {rosterModalCourse.category === 'foundations' && (
                  <div className="p-3.5 rounded-xl bg-primary-50/60 border border-primary-100 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-primary-900">
                      <strong className="font-bold">Main Program Enrollment Active:</strong> Students enrolled in
                      the <span className="font-semibold text-primary-800">ilm Foundations</span> cohort have access
                      to this course included in their primary program tuition. You can selectively deselect any student or add custom students below.
                    </div>
                  </div>
                )}

                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                    <input
                      type="text"
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      placeholder="Search roster by student name, email, or program..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSelectAllRoster}
                      className="text-xs px-2.5 py-1.5 font-semibold text-ink-700 hover:text-ink-900 bg-sand-100 hover:bg-sand-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllRoster}
                      className="text-xs px-2.5 py-1.5 font-semibold text-ink-700 hover:text-ink-900 bg-sand-100 hover:bg-sand-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Deselect All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cid = rosterModalCourse.id;
                        handleCloseRosterModal();
                        handleOpenAttendanceModal(cid);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                      title="Take or upload attendance for this course"
                    >
                      <ClipboardCheck size={13} />
                      Mark Attendance
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRosterAddStudentOpen(!isRosterAddStudentOpen)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 font-bold text-white bg-primary-900 hover:bg-primary-800 rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      <UserPlus size={13} />
                      {isRosterAddStudentOpen ? 'Cancel' : '+ Add Student'}
                    </button>
                  </div>
                </div>

                {/* Collapsible Add Student Inline Form */}
                {isRosterAddStudentOpen && (
                  <form
                    onSubmit={handleAddStudentToRoster}
                    className="p-4 rounded-xl bg-gold-50/50 border border-gold-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gold-950 uppercase tracking-wide">
                        Add New Student & Enroll in Course
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsRosterAddStudentOpen(false)}
                        className="text-ink-400 hover:text-ink-600 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Student Full Name *"
                        value={rosterNewStudent.name}
                        onChange={(e) => setRosterNewStudent({ ...rosterNewStudent, name: e.target.value })}
                        className="px-3 py-1.5 text-xs rounded-lg border border-gold-200 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Email Address *"
                        value={rosterNewStudent.email}
                        onChange={(e) => setRosterNewStudent({ ...rosterNewStudent, email: e.target.value })}
                        className="px-3 py-1.5 text-xs rounded-lg border border-gold-200 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                      <select
                        value={rosterNewStudent.format}
                        onChange={(e) => setRosterNewStudent({ ...rosterNewStudent, format: e.target.value })}
                        className="px-3 py-1.5 text-xs rounded-lg border border-gold-200 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                      >
                        <option value="online">Online</option>
                        <option value="onsite">Onsite (DHA Lahore)</option>
                        <option value="hybrid">Online & Onsite (Hybrid)</option>
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-bold text-primary-950 bg-gold-500 hover:bg-gold-400 rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        Save & Enroll Student
                      </button>
                    </div>
                  </form>
                )}

                {/* Roster Counter */}
                <div className="flex items-center justify-between text-xs text-ink-500 pt-1">
                  <span>
                    Enrolled:{' '}
                    <strong className="text-emerald-700 font-bold">{rosterSelectedStudentIds.length}</strong> of{' '}
                    <span className="font-semibold text-ink-700">{students.length}</span> students
                  </span>
                  <span>Click any student row or checkbox to toggle enrollment status</span>
                </div>

                {/* Students Roster Table */}
                <div className="border border-sand-200 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-sand-100 text-ink-700 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-sand-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">Enrolled</th>
                        <th className="py-2.5 px-3">Student Name & Email</th>
                        <th className="py-2.5 px-3">Program Track</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {rosterFilteredStudents.map((std) => {
                        const isEnrolled = rosterSelectedStudentIds.includes(std.id);
                        return (
                          <tr
                            key={std.id}
                            onClick={() => handleToggleRosterStudent(std.id)}
                            className={`cursor-pointer transition-colors ${
                              isEnrolled ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-sand-50'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isEnrolled}
                                onChange={() => handleToggleRosterStudent(std.id)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-ink-900">{std.name}</div>
                              <div className="text-[11px] text-ink-500">{std.email}</div>
                            </td>
                            <td className="py-2.5 px-3 text-ink-700 font-medium">
                              {std.program}
                            </td>
                            <td className="py-2.5 px-3 capitalize text-ink-600">
                              {std.format?.replace('-', ' ') || 'Online'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                  isEnrolled
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-sand-100 text-ink-400'
                                }`}
                              >
                                {isEnrolled ? (
                                  <>
                                    <Check size={11} />
                                    Enrolled
                                  </>
                                ) : (
                                  'Not Enrolled'
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {rosterFilteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-ink-500 text-xs">
                            No students match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-sand-50/80 border-t border-sand-200 flex items-center justify-between">
                <div className="text-xs text-ink-600">
                  Total Enrolled in Course:{' '}
                  <strong className="text-ink-900 font-bold">{rosterSelectedStudentIds.length}</strong>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseRosterModal}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 hover:bg-sand-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRoster}
                    className="px-4 py-2 text-xs font-bold text-white bg-primary-900 hover:bg-primary-800 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    Save Roster ({rosterSelectedStudentIds.length} Enrolled)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD / EDIT STUDENT MODAL */}
        {isStudentModalOpen && (
          <div className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-sand-200 overflow-hidden">
              <div className="px-6 py-4 bg-sand-50 border-b border-sand-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary-100 text-primary-900">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-900">
                      {editingStudent ? 'Edit Student Account' : 'Add New Student Account'}
                    </h3>
                    <p className="text-[11px] text-ink-500">Configure academic track and delivery format.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-200/60"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveStudentForm} className="p-6 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentFormData.name}
                      onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                      placeholder="e.g. Ibrahim Qasim"
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={studentFormData.email}
                      onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                      placeholder="student@example.com"
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={studentFormData.phone}
                      onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Academic Pathway *
                    </label>
                    <select
                      value={studentFormData.program}
                      onChange={(e) => {
                        const newProg = e.target.value;
                        setStudentFormData({
                          ...studentFormData,
                          program: newProg,
                          selectedCourses:
                            newProg === 'Ilm Intensives' && (!studentFormData.selectedCourses || studentFormData.selectedCourses.length === 0)
                              ? [availableIntensiveCourses[0]?.title].filter(Boolean)
                              : studentFormData.selectedCourses,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-semibold text-ink-900"
                    >
                      <option value="Ilm Foundations">Ilm Foundations</option>
                      <option value="Ilm Intensives">Ilm Intensives</option>
                    </select>
                  </div>
                </div>

                {studentFormData.program === 'Ilm Foundations' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-ink-700 block mb-1">
                        Semester *
                      </label>
                      <select
                        value={studentFormData.semester}
                        onChange={(e) => setStudentFormData({ ...studentFormData, semester: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Graduated">Graduated</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-ink-700 block mb-1">
                        Format
                      </label>
                      <select
                        value={studentFormData.format}
                        onChange={(e) => setStudentFormData({ ...studentFormData, format: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="online">Online</option>
                        <option value="onsite">Onsite (DHA)</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-ink-700 block mb-1">
                        Format
                      </label>
                      <select
                        value={studentFormData.format}
                        onChange={(e) => setStudentFormData({ ...studentFormData, format: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="online">Online</option>
                        <option value="onsite">Onsite (DHA)</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-sand-50/80 border border-sand-200">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-ink-800 block">
                          Select Courses under Ilm Intensives *
                        </label>
                        <span className="text-[10px] text-ink-500">
                          {studentFormData.selectedCourses?.length || 0} selected
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {availableIntensiveCourses.map((c) => {
                          const isChecked = (studentFormData.selectedCourses || []).includes(c.title);
                          return (
                            <label
                              key={c.id || c.title}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                  : 'bg-white border-sand-200 text-ink-700 hover:bg-sand-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const curr = studentFormData.selectedCourses || [];
                                    const next = isChecked
                                      ? curr.filter((t) => t !== c.title)
                                      : [...curr, c.title];
                                    setStudentFormData({ ...studentFormData, selectedCourses: next });
                                  }}
                                  className="rounded text-primary-700 focus:ring-primary-500 cursor-pointer accent-primary-700"
                                />
                                <span>{c.title}</span>
                              </div>
                              {c.instructor && (
                                <span className="text-[10px] text-ink-400 font-normal">
                                  {c.instructor}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-calculated Progress and Attendance Telemetry (Read-only) */}
                {editingStudent && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-sand-50/90 border border-sand-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-primary-700" />
                          Curriculum Progress
                        </span>
                        <span className="text-xs font-bold text-ink-900 bg-white px-2 py-0.5 rounded-full border border-sand-200 shadow-2xs">
                          {studentFormData.progress ?? 0}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-sand-200 rounded-full overflow-hidden mt-1.5 mb-1">
                        <div
                          className="h-full bg-primary-700 rounded-full transition-all"
                          style={{ width: `${studentFormData.progress ?? 0}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-ink-400 mt-1">
                        Auto-calculated from watched / completed lessons
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-sand-50/90 border border-sand-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
                          <Clock size={13} className="text-emerald-700" />
                          Attendance Rate
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                          {studentFormData.attendance || '100%'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-sand-200 rounded-full overflow-hidden mt-1.5 mb-1">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all"
                          style={{ width: studentFormData.attendance || '100%' }}
                        />
                      </div>
                      <p className="text-[10px] text-ink-400 mt-1">
                        Auto-calculated from class attendance records
                      </p>
                    </div>
                  </div>
                )}

                {/* Account Security & Password */}
                <div className="pt-2 border-t border-sand-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                      <Lock size={13} className="text-primary-800" />
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateNewPassword}
                      className="text-[11px] font-bold text-primary-800 hover:text-primary-950 inline-flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <Key size={11} />
                      Generate Random Password
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showStudentPassword ? 'text' : 'password'}
                      required
                      value={studentFormData.password}
                      onChange={(e) => setStudentFormData({ ...studentFormData, password: e.target.value })}
                      placeholder="Enter or generate student password"
                      className="w-full pl-3.5 pr-10 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-semibold text-ink-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 cursor-pointer"
                    >
                      {showStudentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
                    <input
                      type="checkbox"
                      checked={studentFormData.mustChangePassword}
                      onChange={(e) => setStudentFormData({ ...studentFormData, mustChangePassword: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-primary-700 focus:ring-primary-500 cursor-pointer accent-primary-700"
                    />
                    <span className="text-[11px] text-ink-600 font-medium">
                      Require student to choose personal password upon first login
                    </span>
                  </label>
                </div>

                <div className="pt-3 border-t border-sand-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStudentModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-sand-100 hover:bg-sand-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-primary-900 hover:bg-primary-800 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {editingStudent ? 'Save Changes' : 'Create Student Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREATED CREDENTIALS CARD MODAL */}
        {createdCredentialsModal && (
          <div className="fixed inset-0 bg-primary-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-sand-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-900">
                      Student Account Created
                    </h3>
                    <p className="text-[11px] text-ink-500">Share login credentials with student</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatedCredentialsModal(null)}
                  className="p-1 rounded-lg text-ink-400 hover:text-ink-700"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-500">Student Name:</span>
                  <span className="font-bold text-ink-900">{createdCredentialsModal.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Login Email:</span>
                  <span className="font-bold text-ink-900">{createdCredentialsModal.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-500">Temporary Password:</span>
                  <span className="font-bold text-primary-900 bg-white px-2 py-0.5 rounded border border-sand-300">
                    {createdCredentialsModal.password}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Login Portal:</span>
                  <span className="text-ink-700 font-semibold">ilmessentials.pk/login</span>
                </div>
                {createdCredentialsModal.mustChange && (
                  <div className="pt-2 border-t border-sand-200 text-[11px] text-emerald-800 font-medium">
                    ✓ Student will be prompted to set their permanent password upon first login.
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Assalamu Alaikum ${createdCredentialsModal.name},\n\nYour student account for Ilm Essentials LMS has been activated.\n\nPortal: ${window.location.origin}/login\nEmail: ${createdCredentialsModal.email}\nTemporary Password: ${createdCredentialsModal.password}\n\nPlease log in and update your password when prompted.\n\nBarakAllahu Feekum,\nIlm Essentials Administration`;
                    navigator.clipboard.writeText(text);
                    setCopiedCredentials(true);
                    setTimeout(() => setCopiedCredentials(false), 3000);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    copiedCredentials
                      ? 'bg-emerald-600 text-white'
                      : 'bg-primary-900 hover:bg-primary-800 text-white shadow-sm'
                  }`}
                >
                  <Copy size={13} />
                  {copiedCredentials ? 'Credentials Copied!' : 'Copy Credentials'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedCredentialsModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-ink-700 text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE MANAGER & DAILY ROLL-CALL MODAL (MINIMAL & LESSONS INTEGRATED) */}
        {isAttendanceModalOpen && (() => {
          const currentCourse = courses.find((c) => c.id === attendanceCourseId) || courses[0];
          const totalEnrolled = attendanceEnrolledStudents.length;
          const onsiteEnrolled = attendanceEnrolledStudents.filter((s) => (s.format || '').toLowerCase().includes('onsite')).length;
          const onlineEnrolled = attendanceEnrolledStudents.filter((s) => (s.format || '').toLowerCase().includes('online')).length;
          const presentCount = attendanceEnrolledStudents.filter((s) => (attendanceRecords[s.id] || 'present') === 'present').length;
          const lateCount = attendanceEnrolledStudents.filter((s) => attendanceRecords[s.id] === 'late').length;
          const absentCount = attendanceEnrolledStudents.filter((s) => attendanceRecords[s.id] === 'absent').length;
          const currentRatePct = totalEnrolled > 0 ? Math.round(((presentCount + lateCount * 0.75) / totalEnrolled) * 100) : 0;

          const filteredStudents = attendanceEnrolledStudents.filter((s) => {
            const fmt = (s.format || 'online').toLowerCase();
            if (attendanceFormatFilter === 'all') return true;
            return fmt.includes(attendanceFormatFilter);
          });

          // All sessions for this course
          const thisCourseSessions = attendanceSessions.filter((s) => s.courseId === attendanceCourseId);

          // Course average attendance rate
          let courseAvgRate = null;
          if (thisCourseSessions.length > 0) {
            let sum = 0;
            thisCourseSessions.forEach((sess) => {
              let p = 0, l = 0, a = 0;
              if (sess.records) {
                Object.values(sess.records).forEach((st) => {
                  if (st === 'present') p++;
                  else if (st === 'late') l++;
                  else if (st === 'absent') a++;
                });
              }
              const tot = p + l + a;
              sum += tot > 0 ? ((p + l * 0.75) / tot) * 100 : 100;
            });
            courseAvgRate = Math.round(sum / thisCourseSessions.length);
          }

          // Unmatched historical/custom sessions for this course that aren't in availableCourseLessons
          const unmatchedSessions = thisCourseSessions.filter((s) => {
            if (!s.topic) return true;
            const sTopic = s.topic.trim().toLowerCase();
            return !availableCourseLessons.some((l) => {
              const lTitle = (l.title || '').trim().toLowerCase();
              return sTopic === lTitle || sTopic.includes(lTitle) || lTitle.includes(sTopic);
            });
          });

          // Count of pending (unrecorded) curriculum lessons
          const pendingLessonsCount = availableCourseLessons.filter((l) => {
            const lTitle = (l.title || '').trim().toLowerCase();
            return !thisCourseSessions.some((s) => {
              const sTopic = (s.topic || '').trim().toLowerCase();
              return sTopic === lTitle || sTopic.includes(lTitle) || lTitle.includes(sTopic);
            });
          }).length;

          return (
            <div className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
              <div
                className={`bg-white rounded-2xl shadow-2xl ${
                  attendanceModalMode === 'lessons' ? 'max-w-3xl' : 'max-w-2xl'
                } w-full border border-sand-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150`}
              >
                {/* ========================================================= */}
                {/* VIEW 1: COURSE LESSONS & ATTENDANCE HISTORY LIST */}
                {/* ========================================================= */}
                {attendanceModalMode === 'lessons' && (
                  <>
                    {/* Header */}
                    <div className="px-5 py-3.5 bg-sand-50 border-b border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary-900 text-white shadow-xs">
                          <BookOpen size={17} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-ink-900">
                              {currentCourse?.title || 'Course Attendance'}
                            </h3>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-sand-200 text-ink-700">
                              {currentCourse?.category || 'Course'}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-500 mt-0.5">
                            Instructor: <span className="font-semibold text-ink-800">{currentCourse?.instructor || 'Faculty Scholar'}</span> • {totalEnrolled} Enrolled • Mode: <span className="capitalize font-semibold text-ink-800">{currentCourse?.format || 'Hybrid'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Course Switcher */}
                        <select
                          value={attendanceCourseId}
                          onChange={(e) => handleAttendanceCourseChange(e.target.value)}
                          className="px-2.5 py-1.5 text-xs border border-sand-300 rounded-lg bg-white font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer max-w-[190px] truncate"
                        >
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setIsAttendanceModalOpen(false)}
                          className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-200/60 transition-colors cursor-pointer"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Minimal Metrics Telemetry Strip */}
                    <div className="px-5 py-2.5 bg-sand-50/60 border-b border-sand-200 grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-sand-200">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Curriculum</div>
                        <div className="text-xs font-bold text-ink-900 mt-0.5">{availableCourseLessons.length} Lessons</div>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-sand-200">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Sessions Logged</div>
                        <div className="text-xs font-bold text-emerald-800 mt-0.5">{thisCourseSessions.length} Recorded</div>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-sand-200">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Unrecorded</div>
                        <div className="text-xs font-bold text-ink-700 mt-0.5">{pendingLessonsCount} Pending</div>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-sand-200">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Attendance Rate</div>
                        <div className={`text-xs font-bold mt-0.5 ${courseAvgRate !== null && courseAvgRate >= 85 ? 'text-emerald-800' : 'text-amber-800'}`}>
                          {courseAvgRate !== null ? `${courseAvgRate}% Avg` : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Sub Navigation Bar inside Modal */}
                    <div className="px-5 border-b border-sand-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setAttendanceLessonsTab('lessons')}
                          className={`py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                            attendanceLessonsTab === 'lessons'
                              ? 'border-primary-900 text-primary-950'
                              : 'border-transparent text-ink-400 hover:text-ink-700'
                          }`}
                        >
                          Course Lessons ({availableCourseLessons.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendanceLessonsTab('history')}
                          className={`py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                            attendanceLessonsTab === 'history'
                              ? 'border-primary-900 text-primary-950'
                              : 'border-transparent text-ink-400 hover:text-ink-700'
                          }`}
                        >
                          Session History ({thisCourseSessions.length})
                        </button>
                      </div>

                      <div className="flex items-center gap-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomTopic(true);
                            setAttendanceTopic('');
                            setEditingAttendanceSessionId(null);
                            setAttendanceModalMode('rollcall');
                            setAttendanceActiveTab('register');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-900 bg-sand-100 hover:bg-sand-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus size={12} />
                          Custom Session
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAttendanceSessionId(null);
                            setAttendanceModalMode('rollcall');
                            setAttendanceActiveTab('upload');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-700 bg-sand-100 hover:bg-sand-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <UploadCloud size={12} />
                          Upload Sheet
                        </button>
                      </div>
                    </div>

                    {/* Lessons View Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                      {/* TAB 1: CURRICULUM LESSONS */}
                      {attendanceLessonsTab === 'lessons' && (
                        <div className="space-y-3">
                          {availableCourseLessons.length === 0 ? (
                            <div className="p-8 text-center bg-sand-50 rounded-xl border border-sand-200 space-y-2">
                              <p className="text-xs text-ink-600 font-medium">
                                No pre-configured syllabus lessons found for this course.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCustomTopic(true);
                                  setAttendanceTopic('');
                                  setEditingAttendanceSessionId(null);
                                  setAttendanceModalMode('rollcall');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold cursor-pointer"
                              >
                                <Plus size={13} />
                                Take Custom Roll Call
                              </button>
                            </div>
                          ) : (
                            availableCourseLessons.map((les, idx) => {
                              const matchedSessions = thisCourseSessions.filter((s) => {
                                if (!s.topic) return false;
                                const sTopic = s.topic.trim().toLowerCase();
                                const lTitle = (les.title || '').trim().toLowerCase();
                                return sTopic === lTitle || sTopic.includes(lTitle) || lTitle.includes(sTopic);
                              });
                              const hasRecorded = matchedSessions.length > 0;
                              const latest = hasRecorded ? matchedSessions[matchedSessions.length - 1] : null;

                              let presentTotal = 0;
                              let lateTotal = 0;
                              let absentTotal = 0;
                              if (latest && latest.records) {
                                Object.values(latest.records).forEach((st) => {
                                  if (st === 'present') presentTotal++;
                                  else if (st === 'late') lateTotal++;
                                  else if (st === 'absent') absentTotal++;
                                });
                              }
                              const sessionRate = (presentTotal + lateTotal + absentTotal) > 0
                                ? Math.round(((presentTotal + lateTotal * 0.75) / (presentTotal + lateTotal + absentTotal)) * 100)
                                : null;

                              return (
                                <div
                                  key={les.id || idx}
                                  className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    hasRecorded
                                      ? 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300'
                                      : 'bg-white border-sand-200 hover:border-sand-300'
                                  }`}
                                >
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                        hasRecorded
                                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                          : 'bg-sand-100 text-ink-600 border border-sand-200'
                                      }`}
                                    >
                                      {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-ink-900 truncate sm:whitespace-normal">
                                        {les.title}
                                      </h4>
                                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-ink-500">
                                        {les.duration && <span>{les.duration}</span>}
                                        {hasRecorded ? (
                                          <>
                                            <span>•</span>
                                            <span className="font-semibold text-emerald-800">
                                              Recorded on {latest.date} ({latest.deliveryMode || 'hybrid'})
                                            </span>
                                            <span>•</span>
                                            <span className="font-bold text-ink-700">
                                              {presentTotal} Present • {absentTotal} Absent ({sessionRate}%)
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span>•</span>
                                            <span className="text-ink-400">Not yet recorded</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    {hasRecorded ? (
                                      <>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                          <Check size={11} />
                                          Recorded
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleViewSessionAttendance(latest)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 text-ink-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                          title="View & inspect recorded student roll call for this lesson"
                                        >
                                          <Eye size={13} />
                                          View Attendance
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sand-100 text-ink-500 font-semibold text-[10px]">
                                          Pending
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleStartLessonAttendance(les)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                          title="Mark attendance for this lesson"
                                        >
                                          <ClipboardCheck size={13} />
                                          Mark Attendance
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}

                          {/* Historical or Additional Custom Sessions for this Course */}
                          {unmatchedSessions.length > 0 && (
                            <div className="pt-3 border-t border-sand-200 space-y-2 mt-4">
                              <div className="flex items-center justify-between">
                                <h5 className="text-[11px] font-bold uppercase tracking-wider text-ink-600">
                                  Additional Recorded Sessions ({unmatchedSessions.length})
                                </h5>
                                <span className="text-[11px] text-ink-400">
                                  Custom or historical lectures recorded for this course
                                </span>
                              </div>
                              {unmatchedSessions.map((sess) => {
                                let presentTotal = 0;
                                let absentTotal = 0;
                                let lateTotal = 0;
                                if (sess.records) {
                                  Object.values(sess.records).forEach((st) => {
                                    if (st === 'present') presentTotal++;
                                    else if (st === 'late') lateTotal++;
                                    else if (st === 'absent') absentTotal++;
                                  });
                                }
                                const sRate = (presentTotal + lateTotal + absentTotal) > 0
                                  ? Math.round(((presentTotal + lateTotal * 0.75) / (presentTotal + lateTotal + absentTotal)) * 100)
                                  : null;

                                return (
                                  <div
                                    key={sess.id}
                                    className="p-3 bg-emerald-50/20 rounded-xl border border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900 shrink-0">
                                        <Calendar size={14} />
                                      </div>
                                      <div className="truncate">
                                        <div className="font-bold text-ink-900 truncate">{sess.topic}</div>
                                        <div className="text-[11px] text-ink-500 mt-0.5">
                                          {sess.date} • {sess.deliveryMode || 'hybrid'} • {presentTotal} Present, {absentTotal} Absent ({sRate}%)
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                        <Check size={11} />
                                        Recorded
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleViewSessionAttendance(sess)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 text-ink-800 text-xs font-bold transition-colors cursor-pointer"
                                      >
                                        <Eye size={12} />
                                        View Attendance
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 2: COURSE SESSION HISTORY TABLE */}
                      {attendanceLessonsTab === 'history' && (
                        <div className="space-y-3">
                          {thisCourseSessions.length === 0 ? (
                            <div className="py-10 text-center text-xs text-ink-500">
                              No attendance sessions logged yet for this course. Click "Mark Attendance" on any lesson to record your first roll call.
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-sand-200">
                              <table className="w-full text-left text-sm min-w-[620px]">
                                <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                                  <tr>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Lesson / Topic</th>
                                    <th className="py-2.5 px-3">Mode</th>
                                    <th className="py-2.5 px-3">Present / Absent</th>
                                    <th className="py-2.5 px-3">Rate</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-sand-200 text-xs">
                                  {thisCourseSessions.map((sess) => {
                                    let pCount = 0;
                                    let lCount = 0;
                                    let aCount = 0;
                                    if (sess.records) {
                                      Object.values(sess.records).forEach((st) => {
                                        if (st === 'present') pCount++;
                                        else if (st === 'late') lCount++;
                                        else if (st === 'absent') aCount++;
                                      });
                                    }
                                    const totalLogged = pCount + lCount + aCount;
                                    const rate = totalLogged > 0 ? Math.round(((pCount + lCount * 0.75) / totalLogged) * 100) : 0;

                                    return (
                                      <tr key={sess.id} className="hover:bg-sand-50/60 transition-colors">
                                        <td className="py-2.5 px-3 font-semibold text-ink-900 whitespace-nowrap">
                                          {sess.date}
                                        </td>
                                        <td className="py-2.5 px-3 text-ink-900 font-medium max-w-xs truncate">
                                          {sess.topic}
                                        </td>
                                        <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-ink-600 whitespace-nowrap">
                                          {sess.deliveryMode || 'hybrid'}
                                        </td>
                                        <td className="py-2.5 px-3 text-ink-700 whitespace-nowrap">
                                          <span className="font-semibold text-emerald-800">{pCount} Present</span>
                                          {aCount > 0 && <span className="ml-1 text-rose-700 font-semibold">• {aCount} Absent</span>}
                                        </td>
                                        <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                                          <span className={rate >= 85 ? 'text-emerald-800' : 'text-amber-800'}>
                                            {rate}%
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleViewSessionAttendance(sess)}
                                              className="px-2.5 py-1 rounded-md bg-sand-100 hover:bg-sand-200 text-ink-800 font-bold text-[11px] transition-colors cursor-pointer"
                                            >
                                              View / Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteAttendanceSession(sess.id)}
                                              className="p-1 rounded-md text-ink-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                              title="Delete session"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lessons View Footer */}
                    <div className="px-5 py-3 bg-sand-50 border-t border-sand-200 flex items-center justify-between shrink-0">
                      <div className="text-xs text-ink-500">
                        {attendanceToast ? (
                          <span className="font-bold text-emerald-800">• {attendanceToast}</span>
                        ) : (
                          'Select any lesson to mark attendance or click "View Attendance" to inspect student records.'
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAttendanceModalOpen(false)}
                        className="px-4 py-1.5 rounded-lg bg-sand-200 hover:bg-sand-300 text-ink-800 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}

                {/* ========================================================= */}
                {/* VIEW 2: DAILY ROLL CALL / ATTENDANCE REGISTER */}
                {/* ========================================================= */}
                {attendanceModalMode === 'rollcall' && (
                  <>
                    {/* Header */}
                    <div className="px-5 py-3.5 bg-sand-50 border-b border-sand-200 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAttendanceModalMode('lessons');
                            setEditingAttendanceSessionId(null);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-700 hover:text-ink-900 bg-sand-100 hover:bg-sand-200 border border-sand-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer mr-1"
                          title="Return to course lessons list"
                        >
                          <ArrowLeft size={13} />
                          Back to Lessons
                        </button>
                        <div>
                          <h3 className="text-sm font-bold text-ink-900">
                            {editingAttendanceSessionId ? 'View / Edit Lesson Attendance' : 'Mark Lesson Attendance'}
                          </h3>
                          <p className="text-[11px] text-ink-500">
                            {currentCourse?.title} • {attendanceTopic || 'Selected Lesson'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAttendanceModalOpen(false)}
                        className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-200/60 transition-colors cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                {/* Session Configuration (Compact Row) */}
                <div className="p-4 bg-sand-50/40 border-b border-sand-200 space-y-2.5 shrink-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-ink-500 block mb-1">
                        Course
                      </label>
                      <select
                        value={attendanceCourseId}
                        onChange={(e) => handleAttendanceCourseChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-lg bg-white font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-ink-500 block mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-lg bg-white font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-ink-500 block mb-1">
                        Delivery Mode
                      </label>
                      <select
                        value={attendanceDeliveryMode}
                        onChange={(e) => setAttendanceDeliveryMode(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-lg bg-white font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="hybrid">Hybrid (Both)</option>
                        <option value="onsite">Onsite (DHA)</option>
                        <option value="online">Online (Meet)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                        Lecture / Topic
                      </label>
                      {availableCourseLessons.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = !isCustomTopic;
                            setIsCustomTopic(next);
                            if (next) {
                              setAttendanceTopic('');
                            } else if (availableCourseLessons[0]) {
                              setAttendanceTopic(availableCourseLessons[0].title);
                            }
                          }}
                          className="text-[10px] text-primary-800 hover:underline font-semibold cursor-pointer"
                        >
                          {isCustomTopic ? '← Select from Course Lessons' : '+ Custom Topic'}
                        </button>
                      )}
                    </div>

                    {!isCustomTopic && availableCourseLessons.length > 0 ? (
                      <select
                        value={attendanceTopic}
                        onChange={(e) => setAttendanceTopic(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-lg bg-white font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        {availableCourseLessons.map((l, i) => (
                          <option key={l.id || i} value={l.title}>
                            {l.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={attendanceTopic}
                        onChange={(e) => setAttendanceTopic(e.target.value)}
                        placeholder="e.g. Lesson 4: The Definite Noun or Exam Review"
                        className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-lg bg-white font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    )}
                  </div>
                </div>

                {/* Sub Tabs */}
                <div className="px-5 border-b border-sand-200 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setAttendanceActiveTab('register')}
                      className={`py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                        attendanceActiveTab === 'register'
                          ? 'border-primary-900 text-primary-950'
                          : 'border-transparent text-ink-400 hover:text-ink-700'
                      }`}
                    >
                      Roll Call ({totalEnrolled})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceActiveTab('upload')}
                      className={`py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                        attendanceActiveTab === 'upload'
                          ? 'border-primary-900 text-primary-950'
                          : 'border-transparent text-ink-400 hover:text-ink-700'
                      }`}
                    >
                      Upload Sheet
                      {attendanceParseResult && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  {/* TAB 1: ROLL CALL */}
                  {attendanceActiveTab === 'register' && (
                    <div className="space-y-3">
                      {/* Single Compact Toolbar Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                        <div className="flex items-center gap-1 bg-sand-100 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setAttendanceFormatFilter('all')}
                            className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                              attendanceFormatFilter === 'all'
                                ? 'bg-white text-ink-900 shadow-xs font-bold'
                                : 'text-ink-600 hover:text-ink-900'
                            }`}
                          >
                            All ({totalEnrolled})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceFormatFilter('onsite')}
                            className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                              attendanceFormatFilter === 'onsite'
                                ? 'bg-white text-ink-900 shadow-xs font-bold'
                                : 'text-ink-600 hover:text-ink-900'
                            }`}
                          >
                            Onsite ({onsiteEnrolled})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceFormatFilter('online')}
                            className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                              attendanceFormatFilter === 'online'
                                ? 'bg-white text-ink-900 shadow-xs font-bold'
                                : 'text-ink-600 hover:text-ink-900'
                            }`}
                          >
                            Online ({onlineEnrolled})
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMarkAllAttendance('present', 'all')}
                            className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 px-2 py-1 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            Mark All Present
                          </button>
                          <span className="text-sand-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleMarkAllAttendance('absent', 'all')}
                            className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            Mark All Absent
                          </button>
                        </div>
                      </div>

                      {/* Roster List */}
                      {totalEnrolled === 0 ? (
                        <div className="p-6 text-center text-xs text-ink-500 bg-sand-50 rounded-xl">
                          No students enrolled in this course.
                        </div>
                      ) : (
                        <div className="divide-y divide-sand-100 rounded-xl border border-sand-200 overflow-hidden">
                          {filteredStudents.map((std) => {
                            const status = attendanceRecords[std.id] || 'present';
                            const initial = (std.name || 'S').charAt(0).toUpperCase();

                            return (
                              <div
                                key={std.id}
                                className="p-3 flex items-center justify-between gap-3 hover:bg-sand-50/50 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-sand-200 text-ink-800 font-bold flex items-center justify-center text-[11px] shrink-0">
                                    {initial}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-ink-900 truncate">{std.name}</span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sand-100 text-ink-600 uppercase">
                                        {std.format || 'online'}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-ink-400 truncate">{std.email}</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleSetStudentAttendance(std.id, 'present')}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                      status === 'present'
                                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                        : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                                    }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetStudentAttendance(std.id, 'late')}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                      status === 'late'
                                        ? 'bg-amber-500 text-white font-bold shadow-xs'
                                        : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                                    }`}
                                  >
                                    Late
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetStudentAttendance(std.id, 'absent')}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                      status === 'absent'
                                        ? 'bg-rose-600 text-white font-bold shadow-xs'
                                        : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                                    }`}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: UPLOAD SHEET */}
                  {attendanceActiveTab === 'upload' && (
                    <div className="space-y-3.5 text-xs">
                      <div className="p-3 bg-sand-50 rounded-xl border border-sand-200 text-ink-600">
                        Upload or paste Google Meet CSV attendance. Attendees will automatically match by email/name.
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="p-4 rounded-xl border-2 border-dashed border-sand-300 hover:border-sand-400 flex flex-col items-center justify-center text-center cursor-pointer space-y-1.5 transition-colors">
                          <UploadCloud size={20} className="text-ink-400" />
                          <span className="font-semibold text-ink-800">Upload CSV file</span>
                          <span className="text-[10px] text-ink-400">Google Meet or Roll-call CSV</span>
                          <input
                            type="file"
                            accept=".csv,.tsv,.txt"
                            onChange={handleAttendanceFileUpload}
                            className="hidden"
                          />
                        </label>

                        <div className="space-y-1.5">
                          <textarea
                            rows={4}
                            value={attendanceSheetText}
                            onChange={(e) => setAttendanceSheetText(e.target.value)}
                            placeholder="Or paste attendee emails or CSV rows here..."
                            className="w-full p-2.5 text-xs font-mono border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          />
                          <button
                            type="button"
                            onClick={handleParseAttendanceSheet}
                            disabled={!attendanceSheetText.trim()}
                            className="w-full py-1.5 px-3 text-xs font-bold rounded-lg bg-sand-200 hover:bg-sand-300 text-ink-800 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Parse Pasted Text
                          </button>
                        </div>
                      </div>

                      {attendanceParseResult && (
                        <div className="p-3.5 bg-sand-50 rounded-xl border border-sand-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-ink-900">
                              Matched: {attendanceParseResult.matched.length} of {totalEnrolled} enrolled
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApplyParsedAttendance('safe_hybrid')}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                              >
                                Sync Online (Keep Onsite)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyParsedAttendance('all')}
                                className="px-2.5 py-1 rounded-lg bg-sand-200 hover:bg-sand-300 text-ink-800 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Full Override
                              </button>
                            </div>
                          </div>

                          {/* Unmatched / External Attendees */}
                          {attendanceParseResult.unmatchedRows?.length > 0 && (
                            <div className="pt-2.5 border-t border-sand-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                                  <span className="text-xs font-bold text-amber-900">
                                    {attendanceParseResult.unmatchedRows.length} Unmatched {attendanceParseResult.unmatchedRows.length === 1 ? 'Attendee' : 'Attendees'} (Not in Course Roster)
                                  </span>
                                </div>
                                <span className="text-[11px] text-ink-500">
                                  Ask in class to identify students who joined with alternate emails
                                </span>
                              </div>
                              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                {attendanceParseResult.unmatchedRows.map((unmatched, uIdx) => (
                                  <div
                                    key={uIdx}
                                    className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-sand-200 rounded-lg text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-5 h-5 rounded-full bg-sand-100 text-ink-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {(unmatched.detectedName?.[0] || unmatched.detectedEmail?.[0] || '?').toUpperCase()}
                                      </div>
                                      <div className="truncate">
                                        <span className="font-semibold text-ink-900">
                                          {unmatched.detectedName || 'Unknown Name'}
                                        </span>
                                        {unmatched.detectedEmail && (
                                          <span className="ml-1.5 text-ink-500 font-mono text-[11px]">
                                            &lt;{unmatched.detectedEmail}&gt;
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAttendanceActiveTab('register');
                                        setAttendanceToast(`Check roster for: ${unmatched.detectedName || unmatched.detectedEmail}`);
                                        setTimeout(() => setAttendanceToast(''), 4000);
                                      }}
                                      className="ml-2 px-2 py-0.5 text-[11px] font-semibold text-primary-900 bg-sand-100 hover:bg-sand-200 rounded transition-colors shrink-0 cursor-pointer"
                                    >
                                      Mark in Roll Call &rarr;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-sand-50 border-t border-sand-200 flex items-center justify-between shrink-0">
                  <div className="text-xs text-ink-600 font-medium">
                    {presentCount} of {totalEnrolled} Present ({currentRatePct}%)
                    {attendanceToast && (
                      <span className="ml-2 font-bold text-emerald-800">
                        • {attendanceToast}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceModalMode('lessons');
                        setEditingAttendanceSessionId(null);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-ink-600 hover:bg-sand-200/80 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Back to Lessons
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAttendance}
                      className="px-4 py-1.5 rounded-lg bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      {editingAttendanceSessionId ? 'Save & Update Session' : 'Save Attendance'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );
    })()}


        {/* ADD / EDIT INSTRUCTOR MODAL */}
        {isInstructorModalOpen && (
          <div className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-sand-200 overflow-hidden">
              <div className="px-6 py-4 bg-sand-50 border-b border-sand-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gold-100 text-gold-900">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-900">
                      {editingInstructor ? 'Edit Faculty Scholar Profile' : 'Add New Faculty Member'}
                    </h3>
                    <p className="text-[11px] text-ink-500">Scholar designation, courses taught, and contact details.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInstructorModalOpen(false)}
                  className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-200/60"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveInstructorForm} className="p-6 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Faculty / Scholar Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={instructorFormData.name}
                      onChange={(e) => setInstructorFormData({ ...instructorFormData, name: e.target.value })}
                      placeholder="e.g. Sheikh Abdullah Nasir"
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Academic Designation / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={instructorFormData.title}
                      onChange={(e) => setInstructorFormData({ ...instructorFormData, title: e.target.value })}
                      placeholder="e.g. Senior Scholar of Fiqh & Usul"
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={instructorFormData.email}
                      onChange={(e) => setInstructorFormData({ ...instructorFormData, email: e.target.value })}
                      placeholder="scholar@ilmessentials.pk"
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={instructorFormData.phone}
                      onChange={(e) => setInstructorFormData({ ...instructorFormData, phone: e.target.value })}
                      placeholder="+92 300 8472910"
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1">
                    Academic Specialization
                  </label>
                  <input
                    type="text"
                    value={instructorFormData.specialization}
                    onChange={(e) => setInstructorFormData({ ...instructorFormData, specialization: e.target.value })}
                    placeholder="e.g. Comparative Fiqh, Islamic Legal Theory"
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1">
                    Assigned Courses (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={instructorFormData.assignedCourses}
                    onChange={(e) => setInstructorFormData({ ...instructorFormData, assignedCourses: e.target.value })}
                    placeholder="e.g. Fiqh — Acts of Worship, Tafsir Al-Baqarah"
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1">
                    Scholar Biography
                  </label>
                  <textarea
                    rows={2}
                    value={instructorFormData.bio}
                    onChange={(e) => setInstructorFormData({ ...instructorFormData, bio: e.target.value })}
                    placeholder="Brief background, university pedigree, and scholarly credentials..."
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Faculty Status
                    </label>
                    <select
                      value={instructorFormData.status}
                      onChange={(e) => setInstructorFormData({ ...instructorFormData, status: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="Active">Active Faculty</option>
                      <option value="On Leave">On Leave / Sabbatical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Photo Avatar URL
                    </label>
                    <input
                      type="url"
                      value={instructorFormData.avatar}
                      onChange={(e) => setInstructorFormData({ ...instructorFormData, avatar: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-sand-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInstructorModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-sand-100 hover:bg-sand-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-primary-950 bg-gold-500 hover:bg-gold-400 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {editingInstructor ? 'Save Faculty Profile' : 'Add Faculty Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE OFFICIAL FEE INVOICE / RECEIPT MODAL */}
        {selectedInvoiceRecord && (
          <FeeInvoiceModal
            feeRecord={selectedInvoiceRecord}
            onClose={() => setSelectedInvoiceRecord(null)}
          />
        )}

        {/* CREATE / EDIT ACADEMIC PATHWAY MODAL */}
        {isPathwayModalOpen && (
          <div className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-sand-200">
              <div className="px-6 py-5 bg-sand-50/80 border-b border-sand-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-primary-100 flex items-center justify-center text-primary-900">
                    <Compass size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-ink-900 text-base">
                      {editingPathway ? 'Edit Academic Pathway' : 'Create New Academic Pathway'}
                    </h3>
                    <p className="text-xs text-ink-500">
                      Define curriculum tracks, cohort diploma programs, and masterclass pathways
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

              <form onSubmit={handleSavePathwaySubmit} className="p-6 space-y-4">
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
                    value={pathwayFormData.name}
                    onChange={(e) => setPathwayFormData({ ...pathwayFormData, name: e.target.value })}
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
                    value={pathwayFormData.subtitle}
                    onChange={(e) => setPathwayFormData({ ...pathwayFormData, subtitle: e.target.value })}
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
                        setPathwayFormData({
                          ...pathwayFormData,
                          programStructure: 'multi_semester',
                          type: 'cohort',
                          tuitionModel: 'bundled',
                          semesters: pathwayFormData.semesters || 2,
                          duration: '8 Months (2 Semesters)',
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        pathwayFormData.programStructure === 'multi_semester'
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
                        setPathwayFormData({
                          ...pathwayFormData,
                          programStructure: 'course_group',
                          type: 'modular',
                          tuitionModel: 'per_course',
                          semesters: 0,
                          duration: '2–4 Weeks per course',
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        pathwayFormData.programStructure === 'course_group'
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
                        setPathwayFormData({
                          ...pathwayFormData,
                          programStructure: 'single_course',
                          type: 'modular',
                          tuitionModel: 'per_course',
                          semesters: 0,
                          duration: '4 Weeks',
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        pathwayFormData.programStructure === 'single_course'
                          ? 'border-gold-600 bg-gold-50/70 ring-2 ring-gold-500/20'
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

                {pathwayFormData.programStructure === 'multi_semester' && (
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
                          value={pathwayFormData.semesters}
                          onChange={(e) =>
                            setPathwayFormData({
                              ...pathwayFormData,
                              semesters: Number(e.target.value) || 2,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1">
                          Generated Structure
                        </label>
                        <div className="text-xs font-bold text-emerald-900 py-1.5">
                          {Array.from(
                            { length: pathwayFormData.semesters || 2 },
                            (_, i) => `Semester ${i + 1}`
                          ).join(' • ')}
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
                      value={pathwayFormData.tuitionModel}
                      onChange={(e) =>
                        setPathwayFormData({ ...pathwayFormData, tuitionModel: e.target.value })
                      }
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
                      value={pathwayFormData.defaultTuitionFee}
                      onChange={(e) =>
                        setPathwayFormData({
                          ...pathwayFormData,
                          defaultTuitionFee: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="e.g. 30000"
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
                    value={pathwayFormData.duration}
                    onChange={(e) =>
                      setPathwayFormData({ ...pathwayFormData, duration: e.target.value })
                    }
                    placeholder="e.g. Duration varies by course (4-12 Weeks)"
                    className="w-full px-3.5 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <p className="text-[11px] text-ink-400 mt-1">Each individual course can define its own duration and dates.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Pathway Description &amp; Scope
                  </label>
                  <textarea
                    rows={2}
                    value={pathwayFormData.description}
                    onChange={(e) => setPathwayFormData({ ...pathwayFormData, description: e.target.value })}
                    placeholder="Outline curriculum coverage, classical texts, and prerequisites..."
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
                    {editingPathway ? 'Update Pathway' : 'Save Pathway'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* E-LIBRARY ADD / EDIT RESOURCE MODAL                     */}
        {/* ======================================================== */}
        {isLibraryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-sand-200 shadow-2xl w-full max-w-xl overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-sand-200 flex items-center justify-between bg-sand-50/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-900 flex items-center justify-center">
                    <Library size={16} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-ink-900">
                      {editingLibraryItem ? 'Edit Library Resource' : 'Add New Library Resource'}
                    </h3>
                    <p className="text-xs text-ink-500">
                      Publish reference texts, course textbooks, or downloadable materials
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLibraryModalOpen(false)}
                  className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg hover:bg-sand-100 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveLibrarySubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {libraryFormError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{libraryFormError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-ink-700">Resource Title *</label>
                  <input
                    type="text"
                    required
                    value={libraryFormData.title}
                    onChange={(e) => setLibraryFormData({ ...libraryFormData, title: e.target.value })}
                    placeholder="e.g. Tafsir Ibn Kathir — Abridged"
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">Author / Scholar</label>
                    <input
                      type="text"
                      value={libraryFormData.author}
                      onChange={(e) => setLibraryFormData({ ...libraryFormData, author: e.target.value })}
                      placeholder="e.g. Imam Ibn Kathir"
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">Subject / Category</label>
                    <input
                      type="text"
                      value={libraryFormData.category}
                      onChange={(e) => setLibraryFormData({ ...libraryFormData, category: e.target.value })}
                      placeholder="e.g. Tafsir, Hadith, Fiqh, Arabic"
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">Resource Type</label>
                    <select
                      value={libraryFormData.type}
                      onChange={(e) => setLibraryFormData({ ...libraryFormData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="reference">Reference Work</option>
                      <option value="textbook">Textbook</option>
                      <option value="course-material">Study Material</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">Pages</label>
                    <input
                      type="number"
                      value={libraryFormData.pages}
                      onChange={(e) => setLibraryFormData({ ...libraryFormData, pages: e.target.value })}
                      placeholder="e.g. 450"
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">Status</label>
                    <select
                      value={libraryFormData.status}
                      onChange={(e) => setLibraryFormData({ ...libraryFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">File Size</label>
                    <input
                      type="text"
                      value={libraryFormData.fileSize}
                      onChange={(e) => setLibraryFormData({ ...libraryFormData, fileSize: e.target.value })}
                      placeholder="e.g. 12.5 MB"
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">Language</label>
                    <input
                      type="text"
                      value={libraryFormData.language}
                      onChange={(e) => setLibraryFormData({ ...libraryFormData, language: e.target.value })}
                      placeholder="e.g. Arabic / English"
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink-700">PDF Download URL</label>
                  <input
                    type="url"
                    value={libraryFormData.downloadUrl}
                    onChange={(e) => setLibraryFormData({ ...libraryFormData, downloadUrl: e.target.value })}
                    placeholder="https://archive.org/... or cloud PDF link"
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink-700">Online Reading URL (Optional)</label>
                  <input
                    type="url"
                    value={libraryFormData.externalUrl}
                    onChange={(e) => setLibraryFormData({ ...libraryFormData, externalUrl: e.target.value })}
                    placeholder="https://sunnah.com/... or web reader link"
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink-700">Description</label>
                  <textarea
                    rows={3}
                    value={libraryFormData.description}
                    onChange={(e) => setLibraryFormData({ ...libraryFormData, description: e.target.value })}
                    placeholder="Brief summary or curriculum note for students..."
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="lib_featured"
                    checked={libraryFormData.featured}
                    onChange={(e) => setLibraryFormData({ ...libraryFormData, featured: e.target.checked })}
                    className="w-4 h-4 text-primary-900 rounded border-sand-300 focus:ring-primary-500 cursor-pointer"
                  />
                  <label htmlFor="lib_featured" className="text-xs font-semibold text-ink-800 cursor-pointer">
                    Feature this resource on the e-Library homepage
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sand-200">
                  <button
                    type="button"
                    onClick={() => setIsLibraryModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {editingLibraryItem ? 'Update Resource' : 'Save Resource'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* E-LIBRARY DELETE CONFIRMATION MODAL */}
        {isLibraryDeleteModalOpen && libraryItemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-sand-200 shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4 animate-scaleIn">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 size={20} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-heading font-bold text-base text-ink-900">Delete Library Resource</h3>
                <p className="text-xs text-ink-500">
                  Are you sure you want to remove <strong className="text-ink-800">{libraryItemToDelete.title}</strong> from the catalog? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLibraryDeleteModalOpen(false);
                    setLibraryItemToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteLibrary}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Delete Resource
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DAILY QUOTE ADD / EDIT MODAL                            */}
        {/* ======================================================== */}
        {isQuoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-sand-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-sand-200 flex items-center justify-between bg-sand-50/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gold-100 text-gold-800 flex items-center justify-center">
                    <Quote size={16} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-ink-900">
                      {editingQuote ? 'Edit Wisdom Quote' : 'Add New Daily Inscription'}
                    </h3>
                    <p className="text-xs text-ink-500">
                      Displayed on student dashboard hero banner (Max 40 words)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg hover:bg-sand-100 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveQuoteSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {quoteFormError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{quoteFormError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-ink-700">Quote Text *</label>
                    <span className={`text-[10px] font-bold ${countWords(quoteFormData.text) > 40 ? 'text-red-600' : 'text-ink-400'}`}>
                      {countWords(quoteFormData.text)} / 40 words
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={quoteFormData.text}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, text: e.target.value })}
                    placeholder="e.g. The seeking of knowledge is obligatory for every Muslim."
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 resize-none text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-ink-700">Reference / Citation *</label>
                      <span className={`text-[10px] font-bold ${countWords(quoteFormData.source) > 8 ? 'text-red-600' : 'text-ink-400'}`}>
                        {countWords(quoteFormData.source)} / 8 words
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={quoteFormData.source}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, source: e.target.value })}
                      placeholder="e.g. Sunan Ibn Majah 224"
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">Category / Classification</label>
                    <select
                      value={quoteFormData.type}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl bg-white text-ink-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="hadith">Hadith</option>
                      <option value="quran">Quran Ayah</option>
                      <option value="scholarly">Scholarly Wisdom</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-sand-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="quote_pinned"
                      checked={quoteFormData.pinned}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, pinned: e.target.checked })}
                      className="w-4 h-4 text-primary-900 rounded border-sand-300 focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="quote_pinned" className="text-xs font-semibold text-ink-800 cursor-pointer">
                      Pin as today's active wisdom on student hero banner
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="quote_active"
                      checked={quoteFormData.active}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, active: e.target.checked })}
                      className="w-4 h-4 text-primary-900 rounded border-sand-300 focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="quote_active" className="text-xs font-semibold text-ink-800 cursor-pointer">
                      Include in daily automated rotation pool
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sand-200">
                  <button
                    type="button"
                    onClick={() => setIsQuoteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {editingQuote ? 'Update Quote' : 'Save Quote'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DAILY QUOTE DELETE CONFIRMATION MODAL */}
        {isQuoteDeleteModalOpen && quoteToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-sand-200 shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4 animate-scaleIn">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 size={20} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-heading font-bold text-base text-ink-900">Delete Wisdom Quote</h3>
                <p className="text-xs text-ink-500">
                  Are you sure you want to remove this quote from the database?
                </p>
                <p className="text-[11px] text-ink-700 italic border-l-2 border-sand-300 pl-2 mt-2">
                  "{quoteToDelete.text}"
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuoteDeleteModalOpen(false);
                    setQuoteToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteQuote}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Delete Quote
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UNIFIED SLIDE-OVER BILLING DRAWER */}
        <BillingDrawer
          feeRecord={selectedDrawerFee}
          allStudentInvoices={
            selectedDrawerFee
              ? feeRecords.filter(
                  (f) =>
                    (f.studentId && f.studentId === selectedDrawerFee.studentId) ||
                    f.studentEmail?.toLowerCase() === selectedDrawerFee.studentEmail?.toLowerCase()
                )
              : []
          }
          onSelectStudentInvoice={(inv) => setSelectedDrawerFeeId(inv.id)}
          isOpen={isBillingDrawerOpen}
          onClose={handleCloseBillingDrawer}
          onPrevStudent={handlePrevDrawerStudent}
          onNextStudent={handleNextDrawerStudent}
          hasPrevStudent={hasPrevDrawerStudent}
          hasNextStudent={hasNextDrawerStudent}
          onSaveDiscount={handleDrawerSaveDiscount}
          onSaveInstallments={handleDrawerSaveInstallments}
          onRecordPayment={handleDrawerRecordPayment}
          onRecordMultiPayment={handleDrawerRecordMultiPayment}
          onVoidPayment={handleDrawerVoidPayment}
          onOpenOfficialReceipt={(rec) => setSelectedInvoiceRecord(rec)}
        />

        {/* INTERACTIVE CLASS SCHEDULE PLANNER DRAWER */}
        <ScheduleDrawer
          isOpen={isScheduleDrawerOpen}
          onClose={() => setIsScheduleDrawerOpen(false)}
          initialSlot={editingScheduleSlot}
          allSlots={scheduleSlots}
          onSaveSlot={handleSaveScheduleSlot}
        />

        {/* PRINTABLE OFFICIAL FEE INVOICE / RECEIPT MODAL */}
        {selectedInvoiceRecord && (
          <FeeInvoiceModal
            feeRecord={selectedInvoiceRecord}
            onClose={() => setSelectedInvoiceRecord(null)}
          />
        )}

        {/* FLOATING NOTIFICATION BROADCAST TOAST */}
        {scheduleToast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-primary-950 text-white p-4 rounded-2xl shadow-2xl border border-primary-800 flex items-start gap-3 animate-slideIn">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1 text-xs leading-relaxed">
              <span className="font-bold text-emerald-300 block mb-0.5">Notification Dispatched</span>
              <p className="text-sand-100">{scheduleToast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setScheduleToast(null)}
              className="text-primary-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. RECEIPT INSPECTION & VERIFICATION MODAL               */}
        {/* ======================================================== */}
        {inspectingInst && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-sand-300 shadow-2xl overflow-hidden my-8">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-sand-50 border-b border-sand-200 flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-ink-900">
                    Verify Payment Proof Receipt
                  </h3>
                  <p className="text-xs text-ink-500">
                    Review uploaded transfer screenshot, verify amount, and update access permissions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInspectingInst(null);
                    setIsRejectingMode(false);
                    setRejectionReasonInput('');
                  }}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-sand-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Student & Milestone Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-sand-50/70 border border-sand-200 text-xs">
                  <div>
                    <span className="text-ink-400 block text-[10px] uppercase font-bold">Student</span>
                    <span className="font-bold text-ink-900 block truncate">{inspectingInst.studentName}</span>
                    <span className="text-[10px] text-ink-500 block truncate">{inspectingInst.studentEmail}</span>
                  </div>
                  <div>
                    <span className="text-ink-400 block text-[10px] uppercase font-bold">Milestone</span>
                    <span className="font-bold text-ink-900 block">{inspectingInst.title}</span>
                    <span className="text-[10px] text-ink-500 block">Due: {inspectingInst.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-ink-400 block text-[10px] uppercase font-bold">Fixed Amount</span>
                    <span className="font-bold text-emerald-800 font-heading text-sm block">
                      PKR {inspectingInst.amount?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-ink-500 block">Full Installment</span>
                  </div>
                  <div>
                    <span className="text-ink-400 block text-[10px] uppercase font-bold">Status</span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {inspectingInst.status}
                    </span>
                  </div>
                </div>

                {/* Auto-Unlock Information Callout */}
                <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-emerald-900 leading-relaxed text-[11px]">
                    <strong className="block font-bold">Automatic Video Access Unlock:</strong>
                    Approving this receipt checks whether all installments due up to today for this student are now cleared. If no overdue dues remain, course video playback is <strong>automatically restored</strong>.
                  </div>
                </div>

                {/* Course Video Access Permission & Instant Unlock */}
                {(() => {
                  const targetStudent = students.find((s) => s.id === inspectingInst.studentId || (inspectingInst.studentId === 'usr_001' && s.id === 'std_001'));
                  const isRestricted = Boolean(targetStudent?.isVideoRestricted);
                  return (
                    <div className="p-3.5 rounded-xl bg-sand-50/80 border border-sand-200 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isRestricted ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                          {isRestricted ? <Lock size={15} /> : <Unlock size={15} />}
                        </div>
                        <div>
                          <div className="font-bold text-ink-900 text-[12px] flex items-center gap-1.5">
                            <span>Course Video Access:</span>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${isRestricted ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                              {isRestricted ? 'Restricted' : 'Active'}
                            </span>
                          </div>
                          <p className="text-[10px] text-ink-500 mt-0.5">
                            {isRestricted
                              ? `Student course video player is currently locked${targetStudent?.restrictedByAdminName ? ` by ${targetStudent.restrictedByAdminName}` : ''}.`
                              : 'Student currently has full video playback access.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleStudentVideo(inspectingInst.studentId, inspectingInst.studentName, isRestricted)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5 ${
                          isRestricted
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            : 'bg-white hover:bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {isRestricted ? (
                          <>
                            <Unlock size={12} />
                            <span>Restore Access Now</span>
                          </>
                        ) : (
                          <>
                            <Lock size={12} />
                            <span>Restrict Video</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}

                {/* Admin Audit Stamp (if approved) */}
                {inspectingInst.approvedByName && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>
                      Audit Record: Verified &amp; Approved by <strong>{inspectingInst.approvedByName}</strong>
                      {inspectingInst.approvedAt && ` on ${new Date(inspectingInst.approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </span>
                  </div>
                )}

                {/* Receipt Image Display */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                      <Image size={14} className="text-ink-500" />
                      Uploaded Payment Screenshot
                    </span>
                    {inspectingInst.receiptImageUrl && (
                      <a
                        href={inspectingInst.receiptImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#0B3324] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <ZoomIn size={12} />
                        Open High-Resolution Original
                      </a>
                    )}
                  </div>

                  {inspectingInst.receiptImageUrl ? (
                    <div className="rounded-xl border border-sand-300 bg-sand-100 overflow-hidden flex items-center justify-center p-2 max-h-[380px]">
                      <img
                        src={inspectingInst.receiptImageUrl}
                        alt="Receipt preview"
                        className="max-h-[360px] w-auto object-contain rounded-lg shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl border border-dashed border-sand-300 bg-sand-50 text-xs text-ink-500">
                      No receipt screenshot attached.
                    </div>
                  )}
                </div>

                {/* Rejection Form Drawer (if admin clicks Reject) */}
                {isRejectingMode && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-rose-600" />
                        Specify Rejection Reason (Required)
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsRejectingMode(false)}
                        className="text-[11px] text-rose-700 hover:text-rose-900 underline"
                      >
                        Cancel
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={rejectionReasonInput}
                      onChange={(e) => setRejectionReasonInput(e.target.value)}
                      placeholder="e.g. Transaction ID unreadable, transfer amount mismatch, blurred bank statement..."
                      className="w-full p-2.5 rounded-lg border border-rose-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-ink-900 placeholder:text-ink-400"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRejectInstallmentAction(inspectingInst)}
                        className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Confirm Rejection &amp; Notify Student
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 bg-sand-50 border-t border-sand-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setInspectingInst(null);
                    setIsRejectingMode(false);
                    setRejectionReasonInput('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-600 hover:text-ink-900 hover:bg-sand-200 transition-colors"
                >
                  Close
                </button>

                <div className="flex items-center gap-2.5">
                  {!isRejectingMode && (
                    <button
                      type="button"
                      onClick={() => setIsRejectingMode(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Reject Payment Proof
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleApproveInstallmentAction(inspectingInst)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0B3324] hover:bg-[#072419] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 size={15} className="text-emerald-300" />
                    <span>Approve Payment &amp; Verify</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. CREATE FEE INSTALLMENTS & PAYMENT PLANS MODAL         */}
        {/* ======================================================== */}
        {showCreateInstallmentModal && (() => {
          const totalMilestoneSum = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
          const uniquePrograms = Array.from(new Set(students.map((s) => s.program).filter(Boolean)));
          const filteredStudentsForModal = students.filter((std) => {
            if (!studentSearchInModal) return true;
            const q = studentSearchInModal.toLowerCase();
            return (std.name || '').toLowerCase().includes(q) || (std.email || '').toLowerCase().includes(q) || (std.program || '').toLowerCase().includes(q);
          });
          const totalChallansToCreate = targetStudentList.length * (createPlanMode === 'plan' ? milestones.length : 1);

          return (
            <div className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-2xl w-full border border-sand-200 shadow-xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="px-5 py-4 bg-white border-b border-sand-200 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-heading text-base font-bold text-ink-900">
                      Create Fee Installments
                    </h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      Configure installment schedules and assign payment milestones to students.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateInstallmentModal(false)}
                    className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateInstallmentsSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
                  {/* Mode Toggle: Multi-Installment vs Single Milestone */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-sand-100 border border-sand-200">
                    <button
                      type="button"
                      onClick={() => setCreatePlanMode('plan')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        createPlanMode === 'plan'
                          ? 'bg-white text-ink-900 shadow-2xs font-bold'
                          : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      <Split size={13} />
                      <span>Multi-Installment Plan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreatePlanMode('single')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        createPlanMode === 'single'
                          ? 'bg-white text-ink-900 shadow-2xs font-bold'
                          : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      <Receipt size={13} />
                      <span>Single Milestone</span>
                    </button>
                  </div>

                  {/* Target Student Assignment */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                        Target Students
                      </span>
                      <span className="text-[11px] font-semibold text-ink-500">
                        {targetStudentList.length} Selected
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTargetStudentMode('all')}
                        className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          targetStudentMode === 'all'
                            ? 'bg-primary-900 text-white border-primary-900 shadow-2xs font-bold'
                            : 'bg-white border-sand-200 text-ink-700 hover:bg-sand-50'
                        }`}
                      >
                        All ({students.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetStudentMode('program')}
                        className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          targetStudentMode === 'program'
                            ? 'bg-primary-900 text-white border-primary-900 shadow-2xs font-bold'
                            : 'bg-white border-sand-200 text-ink-700 hover:bg-sand-50'
                        }`}
                      >
                        By Program
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetStudentMode('specific')}
                        className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          targetStudentMode === 'specific'
                            ? 'bg-primary-900 text-white border-primary-900 shadow-2xs font-bold'
                            : 'bg-white border-sand-200 text-ink-700 hover:bg-sand-50'
                        }`}
                      >
                        Specific ({selectedStudentIds.length})
                      </button>
                    </div>

                    {/* Program dropdown if 'program' mode */}
                    {targetStudentMode === 'program' && (
                      <div className="pt-1 flex items-center gap-2">
                        <select
                          value={selectedProgramFilter}
                          onChange={(e) => setSelectedProgramFilter(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-sand-200 bg-white text-xs font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                          <option value="all">All Programs ({students.length} students)</option>
                          {uniquePrograms.map((prog) => {
                            const count = students.filter((s) => (s.program || '').toLowerCase() === prog.toLowerCase()).length;
                            return (
                              <option key={prog} value={prog}>
                                {prog} ({count} student{count !== 1 ? 's' : ''})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    {/* Specific students checklist if 'specific' mode */}
                    {targetStudentMode === 'specific' && (
                      <div className="pt-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-ink-400" />
                            <input
                              type="text"
                              value={studentSearchInModal}
                              onChange={(e) => setStudentSearchInModal(e.target.value)}
                              placeholder="Search by name or email..."
                              className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-sand-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentIds(students.map((s) => s.id))}
                              className="font-semibold text-primary-900 hover:underline cursor-pointer"
                            >
                              All
                            </button>
                            <span className="text-sand-300">•</span>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentIds([])}
                              className="font-semibold text-ink-500 hover:underline cursor-pointer"
                            >
                              None
                            </button>
                          </div>
                        </div>

                        <div className="max-h-36 overflow-y-auto border border-sand-200 rounded-xl bg-white p-1 divide-y divide-sand-100">
                          {filteredStudentsForModal.map((std) => {
                            const isChecked = selectedStudentIds.includes(std.id);
                            return (
                              <label key={std.id} className="flex items-center justify-between py-1 px-2 hover:bg-sand-50 rounded-lg cursor-pointer">
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const next = e.target.checked
                                        ? [...selectedStudentIds, std.id]
                                        : selectedStudentIds.filter((id) => id !== std.id);
                                      setSelectedStudentIds(next);
                                    }}
                                    className="rounded text-primary-900 focus:ring-primary-500 accent-primary-900"
                                  />
                                  <div className="min-w-0">
                                    <span className="text-xs font-semibold text-ink-900 block truncate">{std.name}</span>
                                    <span className="text-[10px] text-ink-500 block truncate">{std.email}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sand-100 text-ink-600 font-medium shrink-0 ml-2">
                                  {std.program || 'Ilm Foundations'}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-sand-200" />

                  {/* Step 3: Multi-Installment Plan Builder Form */}
                  {createPlanMode === 'plan' ? (
                    <div className="space-y-3">
                      {/* Quick Presets Pills */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                            Quick Presets
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAutoSplitPlan(3, 45000, 30)}
                            className="px-2.5 py-1 rounded-lg border border-sand-200 bg-sand-50 hover:bg-white text-ink-800 text-xs font-medium transition-colors cursor-pointer"
                          >
                            3-Stage Semester <span className="text-[10px] text-ink-500">(PKR 15k × 3)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAutoSplitPlan(2, 45000, 45)}
                            className="px-2.5 py-1 rounded-lg border border-sand-200 bg-sand-50 hover:bg-white text-ink-800 text-xs font-medium transition-colors cursor-pointer"
                          >
                            2-Stage Semi-Annual <span className="text-[10px] text-ink-500">(PKR 22.5k × 2)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAutoSplitPlan(4, 45000, 30)}
                            className="px-2.5 py-1 rounded-lg border border-sand-200 bg-sand-50 hover:bg-white text-ink-800 text-xs font-medium transition-colors cursor-pointer"
                          >
                            4-Stage Quarterly <span className="text-[10px] text-ink-500">(PKR 11.25k × 4)</span>
                          </button>
                        </div>
                      </div>

                      {/* Generator Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-ink-700 block mb-1">
                            Total Tuition (PKR)
                          </label>
                          <input
                            type="number"
                            min="1000"
                            step="500"
                            value={planTotalFee}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setPlanTotalFee(val);
                              handleAutoSplitPlan(planInstallmentCount, val, planIntervalDays);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-sand-200 bg-white text-xs font-bold text-ink-900 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-ink-700 block mb-1">
                            Installments
                          </label>
                          <div className="grid grid-cols-4 gap-1">
                            {[2, 3, 4, 5].map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => handleAutoSplitPlan(cnt, planTotalFee, planIntervalDays)}
                                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  milestones.length === cnt
                                    ? 'bg-primary-900 text-white shadow-2xs'
                                    : 'bg-sand-50 border border-sand-200 text-ink-700 hover:bg-sand-100'
                                }`}
                              >
                                {cnt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-ink-700 block mb-1">
                            Interval
                          </label>
                          <select
                            value={planIntervalDays}
                            onChange={(e) => {
                              const days = Number(e.target.value);
                              setPlanIntervalDays(days);
                              handleAutoSplitPlan(milestones.length, planTotalFee, days);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-sand-200 bg-white text-xs font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          >
                            <option value={30}>Every 30 Days (Monthly)</option>
                            <option value={45}>Every 45 Days</option>
                            <option value={60}>Every 60 Days (Bi-Monthly)</option>
                          </select>
                        </div>
                      </div>

                      {/* Milestone Table */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                            Milestones ({milestones.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleAddMilestoneRow}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-900 hover:underline cursor-pointer"
                          >
                            <Plus size={12} />
                            <span>Add Milestone</span>
                          </button>
                        </div>

                        <div className="border border-sand-200 rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-sand-50/80 border-b border-sand-200 text-ink-600 font-semibold text-[10px] uppercase tracking-wider">
                              <tr>
                                <th className="py-2 px-3 w-8">#</th>
                                <th className="py-2 px-3">Title</th>
                                <th className="py-2 px-3 w-28">Amount (PKR)</th>
                                <th className="py-2 px-3 w-32">Due Date</th>
                                <th className="py-2 px-2 w-8 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-sand-100">
                              {milestones.map((m, idx) => (
                                <tr key={m.id || idx} className="hover:bg-sand-50/40">
                                <td className="py-1.5 px-3 font-semibold text-ink-400">
                                  {idx + 1}
                                </td>
                                <td className="py-1.5 px-3">
                                  <input
                                    type="text"
                                    required
                                    value={m.title}
                                    onChange={(e) => handleUpdateMilestone(idx, 'title', e.target.value)}
                                    placeholder={`Installment ${idx + 1}`}
                                    className="w-full px-2 py-1 rounded-lg border border-sand-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                  />
                                </td>
                                <td className="py-1.5 px-3">
                                  <input
                                    type="number"
                                    min="1"
                                    required
                                    value={m.amount}
                                    onChange={(e) => handleUpdateMilestone(idx, 'amount', Number(e.target.value))}
                                    className="w-full px-2 py-1 rounded-lg border border-sand-200 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                  />
                                </td>
                                <td className="py-1.5 px-3">
                                  <input
                                    type="date"
                                    required
                                    value={m.dueDate}
                                    onChange={(e) => handleUpdateMilestone(idx, 'dueDate', e.target.value)}
                                    className="w-full px-2 py-1 rounded-lg border border-sand-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                  />
                                </td>
                                <td className="py-1.5 px-2 text-center">
                                  <button
                                    type="button"
                                    disabled={milestones.length <= 1}
                                    onClick={() => handleRemoveMilestoneRow(idx)}
                                    className="p-1 rounded text-ink-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="px-3 py-2 bg-sand-50/60 border-t border-sand-200 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-medium text-ink-500">
                            Total: <strong className="text-ink-900 font-mono">PKR {totalMilestoneSum.toLocaleString()}</strong>
                          </span>
                          {totalMilestoneSum === planTotalFee ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check size={10} /> Balanced
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Target: PKR {planTotalFee.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single Milestone Form */
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-ink-700 block mb-1">
                        Installment Title
                      </label>
                      <input
                        type="text"
                        required
                        value={singleTitle}
                        onChange={(e) => setSingleTitle(e.target.value)}
                        placeholder="e.g. Registration Fee, Semester 1 Dues"
                        className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-ink-700 block mb-1">
                          Amount (PKR)
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={singleAmount}
                          onChange={(e) => setSingleAmount(Number(e.target.value))}
                          placeholder="15000"
                          className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-ink-700 block mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          required
                          value={singleDueDate}
                          onChange={(e) => setSingleDueDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Info Strip */}
                <div className="p-2.5 rounded-xl bg-sand-50 border border-sand-200 text-xs flex items-center justify-between text-ink-600">
                  <span>
                    Assigning <strong className="text-ink-900">{totalChallansToCreate} challans</strong> to <strong className="text-ink-900">{targetStudentList.length} students</strong>
                  </span>
                  <span className="font-mono font-bold text-ink-900">
                    PKR {(targetStudentList.length * (createPlanMode === 'plan' ? totalMilestoneSum : Number(singleAmount))).toLocaleString()}
                  </span>
                </div>

                {/* Modal Footer */}
                <div className="pt-2 border-t border-sand-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateInstallmentModal(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-ink-600 hover:text-ink-900 hover:bg-sand-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={targetStudentList.length === 0}
                    className="px-4 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Generate &amp; Assign Plan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 3. BULK RESTRICT OVERDUE CONFIRMATION MODAL             */}
        {/* ======================================================== */}
        {showBulkRestrictModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full border border-sand-300 shadow-2xl overflow-hidden my-8 p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto border border-red-200">
                <ShieldAlert size={26} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-heading text-lg font-bold text-ink-900">
                  Restrict Course Video Access?
                </h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  This action will immediately restrict course video playback for all students with pending overdue installments (due date on or before today).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-xs space-y-2">
                <div className="font-bold text-red-900 flex items-center justify-between">
                  <span>Eligible Overdue Accounts:</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[11px]">
                    {overdueEligibleStudents.length} Students
                  </span>
                </div>
                {overdueEligibleStudents.length > 0 ? (
                  <ul className="divide-y divide-red-200/60 max-h-32 overflow-y-auto text-[11px] text-red-800">
                    {overdueEligibleStudents.map((s) => (
                      <li key={s.id} className="py-1 flex items-center justify-between">
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-[10px] text-red-600 font-mono">{s.id}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-red-700 italic">No unrestricted overdue accounts found.</p>
                )}
              </div>

              <div className="text-[11px] text-ink-500 leading-relaxed">
                <em>Note: Approving a student's overdue fee receipt in the future will automatically unlock their video access.</em>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkRestrictModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-600 hover:text-ink-900 hover:bg-sand-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkRestrict}
                  disabled={overdueEligibleStudents.length === 0}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Confirm &amp; Restrict Access
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3B. BULK RESTORE COURSE VIDEO ACCESS MODAL              */}
        {/* ======================================================== */}
        {showBulkRestoreModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full border border-sand-300 shadow-2xl overflow-hidden my-8 p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-300">
                <Unlock size={26} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-heading text-lg font-bold text-ink-900">
                  Restore Course Video Access?
                </h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  This action will immediately unlock and restore course video lecture playback for all currently restricted student accounts.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>Currently Restricted Accounts:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white font-extrabold text-[11px]">
                    {restrictedStudentsList.length} Students
                  </span>
                </div>
                {restrictedStudentsList.length > 0 ? (
                  <ul className="divide-y divide-emerald-200/60 max-h-36 overflow-y-auto text-[11px] text-emerald-900">
                    {restrictedStudentsList.map((s) => (
                      <li key={s.id} className="py-1.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold block">{s.name}</span>
                          <span className="text-[10px] text-ink-500 font-mono">{s.email || s.id}</span>
                        </div>
                        <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-bold">
                          Restricted
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-emerald-700 italic">No restricted student accounts found.</p>
                )}
              </div>

              <div className="text-[11px] text-ink-500 leading-relaxed">
                <em>Students will immediately regain full access to their enrolled video lectures and receive in-app notification of the access restoration.</em>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkRestoreModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-600 hover:text-ink-900 hover:bg-sand-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkRestore}
                  disabled={restrictedStudentsList.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Confirm &amp; Restore Access
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. ACCOUNTS FLOATING TOAST NOTIFICATION                 */}
        {/* ======================================================== */}
        {accountsToast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#0B3324] text-white p-4 rounded-2xl shadow-2xl border border-emerald-800 flex items-start gap-3 animate-slideIn">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              {accountsToast.type === 'error' ? (
                <AlertTriangle size={18} className="text-rose-400" />
              ) : (
                <CheckCircle2 size={18} className="text-emerald-400" />
              )}
            </div>
            <div className="flex-1 text-xs leading-relaxed">
              <span className="font-bold text-emerald-300 block mb-0.5">{accountsToast.title}</span>
              <p className="text-sand-100">{accountsToast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setAccountsToast(null)}
              className="text-primary-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
