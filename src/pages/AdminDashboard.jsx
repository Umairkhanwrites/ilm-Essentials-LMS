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

import React, { useState, useMemo } from 'react';
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
  updateCourseEnrollment,
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
      const matchSearch =
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.program.toLowerCase().includes(studentSearch.toLowerCase());
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
    format: 'online',
    feeStatus: 'Paid',
    progress: 0,
    attendance: '95%',
  });

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
      format: 'online',
      feeStatus: 'Paid',
      progress: 0,
      attendance: '100%',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student) => {
    setEditingStudent(student);
    setShowStudentPassword(false);
    setStudentFormData({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      password: student.password || '',
      mustChangePassword: student.mustChangePassword !== undefined ? Boolean(student.mustChangePassword) : false,
      program: student.program || 'Ilm Foundations',
      semester: student.semester || 'Semester 1',
      format: student.format || 'online',
      feeStatus: student.feeStatus || 'Paid',
      progress: student.progress ?? 0,
      attendance: student.attendance || '95%',
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

    const chosenPassword =
      studentFormData.password.trim() ||
      (editingStudent?.password ?? generateTemporaryPassword());

    const payload = {
      ...(editingStudent ? { id: editingStudent.id } : {}),
      name: studentFormData.name.trim(),
      email: studentFormData.email.trim(),
      phone: studentFormData.phone.trim(),
      password: chosenPassword,
      mustChangePassword: studentFormData.mustChangePassword,
      program: studentFormData.program,
      semester: studentFormData.semester,
      format: studentFormData.format,
      feeStatus: studentFormData.feeStatus,
      progress: Number(studentFormData.progress) || 0,
      attendance: studentFormData.attendance,
    };

    saveStudent(payload);
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
  const [createForm, setCreateForm] = useState({
    studentSelection: 'all',
    selectedStudentIds: [],
    title: 'Installment 1',
    amount: 8000,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
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
      if (installmentQueueTab === 'approved') return inst.status === 'APPROVED';
      if (installmentQueueTab === 'rejected') return inst.status === 'REJECTED';
      return true; // 'all'
    });
  }, [feeInstallments, installmentQueueTab, installmentSearch, todayDateStr]);

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

  // Create Installments Submit
  const handleCreateInstallmentsSubmit = (e) => {
    e.preventDefault();
    const title = createForm.title.trim();
    const amount = Number(createForm.amount);
    const dueDate = createForm.dueDate;

    if (!title || !amount || !dueDate) {
      alert('Please fill in all required fields (title, amount, and due date).');
      return;
    }

    let targetIds = [];
    if (createForm.studentSelection === 'all') {
      targetIds = students.map((s) => s.id);
    } else {
      targetIds = createForm.selectedStudentIds;
    }

    if (targetIds.length === 0) {
      alert('Please select at least one student.');
      return;
    }

    const created = createInstallments({
      studentIds: targetIds,
      title,
      amount,
      dueDate,
    });

    setFeeInstallments(getFeeInstallments());
    setShowCreateInstallmentModal(false);
    setCreateForm({
      studentSelection: 'all',
      selectedStudentIds: [],
      title: 'Installment 1',
      amount: 8000,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    setAccountsToast({
      type: 'success',
      title: 'Installments Created',
      message: `Successfully created and assigned ${created.length} installment record(s).`,
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

  // Dynamic KPI stats reflecting active courses and student records
  const dynamicStats = useMemo(() => {
    const activeCount = courses.filter((c) => c.status === 'Active').length;
    const foundationsCount = courses.filter((c) => c.category === 'foundations').length;
    const intensivesCount = courses.filter((c) => c.category === 'intensives').length;

    return [
      {
        label: 'Total Enrolled Students',
        value: '1,248',
        icon: 'Users',
        change: '+12% this semester',
      },
      {
        label: 'Course Offerings',
        value: courses.length,
        icon: 'BookOpen',
        change: `${activeCount} Active • ${foundationsCount} Foundations, ${intensivesCount} Intensives`,
      },
      {
        label: 'Pending Applications',
        value: '38',
        icon: 'FileCheck',
        change: 'Requires review',
      },
      {
        label: 'Tuition Revenue',
        value: 'PKR 3.4M',
        icon: 'CreditCard',
        change: '+18% vs last cycle',
      },
    ];
  }, [courses]);

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

  const libraryMetrics = useMemo(() => {
    const totalTitles = libraryList.length;
    const featuredCount = libraryList.filter((i) => i.featured).length;
    const categoryCount = new Set(libraryList.map((i) => i.category)).size;
    const totalPages = libraryList.reduce((acc, i) => acc + (Number(i.pages) || 0), 0);
    return { totalTitles, featuredCount, categoryCount, totalPages };
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
              <div className="flex items-center gap-3">
                <Link
                  to="/admin/courses/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-primary-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={15} />
                  Create Course
                </Link>

                <button
                  onClick={handleAdminLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
                  title="Log out of administrator session"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Admin Content */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dynamicStats.map((stat, idx) => {
              const iconMap = {
                Users,
                BookOpen,
                FileCheck,
                CreditCard,
              };
              const IconComp = iconMap[stat.icon] || BookOpen;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-sand-200 p-5 shadow-xs hover:shadow-card transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-500">{stat.label}</span>
                    <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
                      <IconComp className="h-4 w-4 text-primary-700" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-bold text-ink-900 font-heading">
                      {stat.value}
                    </h3>
                    <p className="text-xs text-primary-700 font-medium mt-1">
                      {stat.change}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

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
                    { id: 'library', label: 'e-Library Catalog', icon: Library, count: libraryList.length },
                    { id: 'quotes', label: 'Daily Quotes & Reflections', icon: Quote, count: quotesList.length },
                    { id: 'students', label: 'Student Accounts', icon: Users, count: students.length },
                    { id: 'instructors', label: 'Faculty & Instructors', icon: GraduationCap, count: instructors.length },
                    { id: 'fees', label: 'Accounts & Fee Management', icon: CreditCard, count: accountsSummary.pendingCount },
                    { id: 'applications', label: 'Admissions & Review', icon: FileCheck, count: 38 },
                    { id: 'schedules', label: 'Class Schedule Planner', icon: Calendar, count: activeWeeklySlots.length },
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
                        ? 'bg-purple-100 text-purple-900 border-purple-200'
                        : isOnsite
                        ? 'bg-amber-100 text-amber-900 border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-200';

                      return (
                        <tr key={c.id} className="hover:bg-sand-50/70 transition-colors">
                          <td className="py-3.5 px-4 min-w-[220px]">
                            <div className="font-bold text-ink-900 text-sm">{c.title}</div>
                            <div className="flex items-center gap-1.5 mt-1 text-xs">
                              {c.semester ? (
                                <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[11px]">
                                  {typeof c.semester === 'number' ? `Semester ${c.semester}` : c.semester}
                                </span>
                              ) : (
                                <span className="text-emerald-800 font-medium">
                                  {c.category === 'foundations' ? '8-Month Certificate' : 'Masterclass Intensive'}
                                </span>
                              )}
                              {(c.startDate || c.duration) && (
                                <>
                                  <span className="text-sand-400">•</span>
                                  <span className="text-ink-500 font-normal">
                                    {c.startDate ? `${c.startDate} (${c.duration || '8 Weeks'})` : c.duration || '8 Weeks'}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 min-w-[140px] whitespace-nowrap">
                            <div className="font-medium text-xs text-ink-800">{c.instructor}</div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-semibold border ${formatColor}`}>
                                <FormatIcon size={12} />
                                {formatLabel}
                              </span>
                              {isOnsite && c.venue && (
                                <div className="text-[10px] text-amber-700 truncate max-w-[130px]" title={c.venue}>
                                  {c.venue}
                                </div>
                              )}
                            </div>
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
                              {c.category === 'foundations' ? (
                                <>
                                  <div>{c.fee || 'PKR 30,000'}</div>
                                  <div className="text-[10px] font-normal text-emerald-700">
                                    {c.semester ? `${typeof c.semester === 'number' ? `Semester ${c.semester}` : c.semester} Tuition` : 'Semester Tuition'}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>{c.fee || 'PKR 12,000'}</div>
                                  <div className="text-[10px] font-normal text-ink-500">Per Course</div>
                                </>
                              )}
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
                                className="p-1.5 rounded-lg text-ink-500 hover:text-primary-800 hover:bg-sand-100 transition-colors"
                                title="Preview course room as student"
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
                  <h3 className="font-heading text-lg font-bold text-ink-900">
                    Academic Pathways &amp; Curriculum Tracks
                  </h3>
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

              {/* Pathways Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-sand-50 border border-sand-200">
                  <span className="text-xs text-ink-500 font-semibold uppercase tracking-wider block">Total Pathways</span>
                  <div className="text-2xl font-bold font-heading text-ink-900 mt-1">{pathways.length} Active Tracks</div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                  <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider block">Cohort Certificate Tracks</span>
                  <div className="text-2xl font-bold font-heading text-emerald-950 mt-1">
                    {pathways.filter((p) => p.type === 'cohort' || p.tuitionModel === 'bundled').length} Programs
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60">
                  <span className="text-xs text-amber-800 font-semibold uppercase tracking-wider block">Modular Masterclass Tracks</span>
                  <div className="text-2xl font-bold font-heading text-amber-950 mt-1">
                    {pathways.filter((p) => p.type !== 'cohort' && p.tuitionModel !== 'bundled').length} Tracks
                  </div>
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
                      <div className="space-y-3">
                        {/* Card Top: Icon */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary-50 border border-primary-200/60 flex items-center justify-center text-primary-900">
                            <Compass size={20} />
                          </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div>
                          <h4 className="font-heading font-bold text-ink-900 text-base">{p.name}</h4>
                          {p.subtitle && (
                            <p className="text-xs text-primary-800 font-medium mt-0.5">{p.subtitle}</p>
                          )}
                        </div>

                        {/* Assigned Courses Section */}
                        <div className="pt-2 space-y-2">
                          <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider block">
                            Constituent Courses ({pathwayCourses.length})
                          </span>

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
                                      <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                                        PKR {(p.defaultTuitionFee || 30000).toLocaleString()} / semester
                                      </span>
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
                      <div className="pt-4 mt-4 border-t border-sand-200 flex items-center justify-between">
                        <Link
                          to="/admin/courses/new"
                          className="text-xs font-semibold text-primary-800 hover:text-primary-950 inline-flex items-center gap-1"
                        >
                          <Plus size={13} />
                          Add Course to Track
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPathway(p)}
                            className="p-1.5 rounded-lg text-ink-600 hover:text-ink-950 hover:bg-sand-100 transition-colors cursor-pointer"
                            title="Edit pathway details"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePathway(p.id || p.slug, p.name)}
                            className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete pathway"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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

          {/* Tab 3: Student Accounts */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-6 shadow-xs">
              {/* Search Bar & Add Student Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by student name, email, or program..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-sand-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-ink-500">
                    Showing <strong className="text-ink-800">{filteredStudents.length}</strong> student accounts
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddStudent}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
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
                          <div className="text-xs font-medium text-ink-800">{std.program}</div>
                          <div className="text-[11px] text-ink-500">{std.semester || 'Semester 1'}</div>
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
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {std.feeStatus || 'Paid'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStudentVideo(std.id, std.name, !!std.isVideoRestricted)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                              std.isVideoRestricted
                                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-2xs'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={
                              std.isVideoRestricted
                                ? `Restricted by ${std.restrictedByAdminName || 'Admin'}. Click to unlock video access.`
                                : 'Video access is active. Click to restrict video access.'
                            }
                          >
                            {std.isVideoRestricted ? (
                              <>
                                <Lock size={11} className="text-red-600" />
                                <span>Restricted</span>
                              </>
                            ) : (
                              <>
                                <Unlock size={11} className="text-emerald-600" />
                                <span>Active</span>
                              </>
                            )}
                          </button>
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

          {/* Tab 3: Faculty & Instructors */}
          {activeTab === 'instructors' && (
            <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-6 shadow-xs">
              {/* Header Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    type="text"
                    value={instructorSearch}
                    onChange={(e) => setInstructorSearch(e.target.value)}
                    placeholder="Search by scholar name, title, specialization, or email..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-sand-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-ink-500">
                    Showing <strong className="text-ink-800">{filteredInstructors.length}</strong> faculty scholars
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddInstructor}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-primary-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
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
              {/* Page Header with Dual Action CTA */}
              <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-heading text-xl font-bold text-ink-900">Accounts &amp; Fee Management</h2>
                    {accountsSummary.pendingCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        {accountsSummary.pendingCount} Verification{accountsSummary.pendingCount > 1 ? 's' : ''} Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-500 mt-1">
                    Verify payment receipts, create fee installments, and control course video access permissions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Bulk Restrict Action */}
                  <button
                    type="button"
                    onClick={() => setShowBulkRestrictModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold border border-red-200 transition-all cursor-pointer shadow-2xs"
                    title="Restrict video playback for all students with overdue installments"
                  >
                    <ShieldAlert size={14} className="text-red-600" />
                    <span>Restrict All Students With Overdue Fees</span>
                    {overdueEligibleStudents.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-600 text-white">
                        {overdueEligibleStudents.length}
                      </span>
                    )}
                  </button>

                  {/* Create Installments Action */}
                  <button
                    type="button"
                    onClick={() => setShowCreateInstallmentModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3324] hover:bg-[#072419] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>+ Create Installments</span>
                  </button>
                </div>
              </div>

              {/* View Switcher Pills */}
              <div className="flex items-center justify-between border-b border-sand-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFeeView('installments')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeFeeView === 'installments'
                        ? 'bg-[#0B3324] text-white shadow-xs'
                        : 'bg-sand-100 text-ink-600 hover:text-ink-900 hover:bg-sand-200'
                    }`}
                  >
                    <Receipt size={14} />
                    <span>Fee Installments &amp; Queue</span>
                    {accountsSummary.pendingCount > 0 && (
                      <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                        activeFeeView === 'installments' ? 'bg-amber-400 text-[#0B3324]' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {accountsSummary.pendingCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFeeView('invoices')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeFeeView === 'invoices'
                        ? 'bg-[#0B3324] text-white shadow-xs'
                        : 'bg-sand-100 text-ink-600 hover:text-ink-900 hover:bg-sand-200'
                    }`}
                  >
                    <CreditCard size={14} />
                    <span>Course Invoices &amp; Tuition</span>
                  </button>
                </div>
              </div>

              {/* VIEW 1: FEE INSTALLMENTS & VERIFICATION QUEUE */}
              {activeFeeView === 'installments' && (
                <div className="space-y-6">
                  {/* Financial Ledger KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Total Received</span>
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      </div>
                      <div className="text-xl font-bold font-heading text-emerald-950 mt-1">
                        PKR {accountsSummary.totalReceived.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-emerald-700">Approved payments</span>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">Total Receivable</span>
                        <Clock size={16} className="text-amber-600" />
                      </div>
                      <div className="text-xl font-bold font-heading text-amber-950 mt-1">
                        PKR {accountsSummary.totalReceivable.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-amber-700">Unpaid &amp; under review</span>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-indigo-800 font-bold uppercase tracking-wider">Pending Review</span>
                        <Receipt size={16} className="text-indigo-600" />
                      </div>
                      <div className="text-xl font-bold font-heading text-indigo-950 mt-1">
                        {accountsSummary.pendingCount} Receipts
                      </div>
                      <span className="text-[10px] text-indigo-700">Needs admin approval</span>
                    </div>

                    <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-red-800 font-bold uppercase tracking-wider">Overdue Accounts</span>
                        <AlertTriangle size={16} className="text-red-600" />
                      </div>
                      <div className="text-xl font-bold font-heading text-red-950 mt-1">
                        {accountsSummary.overdueCount} Accounts
                      </div>
                      <span className="text-[10px] text-red-700">Due date passed</span>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-rose-800 font-bold uppercase tracking-wider">Restricted Students</span>
                        <Lock size={16} className="text-rose-600" />
                      </div>
                      <div className="text-xl font-bold font-heading text-rose-950 mt-1">
                        {accountsSummary.restrictedStudentsCount} Students
                      </div>
                      <span className="text-[10px] text-rose-700">Course video blocked</span>
                    </div>
                  </div>

                  {/* Filter Tabs & Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: 'review', label: 'Pending Review', count: feeInstallments.filter((i) => i.status === 'UNDER_REVIEW').length, badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' },
                        { id: 'overdue', label: 'Overdue / Unpaid', count: feeInstallments.filter((i) => i.status !== 'APPROVED' && i.dueDate <= todayDateStr).length, badgeColor: 'bg-red-100 text-red-900 border-red-200' },
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
                  <div className="overflow-x-auto rounded-xl border border-sand-200 shadow-2xs bg-white">
                    <table className="w-full text-left text-sm min-w-[980px]">
                      <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                        <tr>
                          <th className="py-3 px-3.5">Student</th>
                          <th className="py-3 px-3">Installment Milestone</th>
                          <th className="py-3 px-3">Fixed Amount</th>
                          <th className="py-3 px-3">Payment Status</th>
                          <th className="py-3 px-3">Receipt Proof</th>
                          <th className="py-3 px-3">Course Video Access</th>
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
                              <td className="py-3.5 px-3.5">
                                <div className="font-semibold text-ink-900">{inst.studentName || student?.name || 'Student'}</div>
                                <div className="text-xs text-ink-500">{inst.studentEmail || student?.email || inst.studentId}</div>
                                <span className="text-[10px] text-ink-400 bg-sand-100 px-1.5 py-0.2 rounded font-mono">{inst.studentId}</span>
                              </td>

                              <td className="py-3.5 px-3">
                                <div className="font-semibold text-ink-800 text-xs flex items-center gap-1.5">
                                  <span>{inst.title}</span>
                                  <span className="text-[10px] font-mono font-bold text-primary-900 bg-primary-50 px-1.5 py-0.2 rounded border border-primary-200">
                                    #{inst.challanNo || '23528335'}
                                  </span>
                                </div>
                                <div className={`text-[11px] ${isOverdue ? 'text-red-600 font-bold' : 'text-ink-500'}`}>
                                  Due: {inst.dueDate} {isOverdue && '(Overdue)'}
                                </div>
                                {inst.submittedAt && (
                                  <div className="text-[10px] text-ink-400">
                                    Submitted: {new Date(inst.submittedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-3 text-xs">
                                <div className="font-bold text-ink-900 font-heading text-sm">
                                  PKR {inst.amount?.toLocaleString()}
                                </div>
                                <span className="text-[10px] text-ink-400">Fixed Milestone</span>
                              </td>

                              <td className="py-3.5 px-3 whitespace-nowrap">
                                {inst.status === 'APPROVED' && (
                                  <div>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      <CheckCircle2 size={11} className="text-emerald-600" />
                                      Approved
                                    </span>
                                    {inst.approvedByName && (
                                      <div className="text-[10px] text-ink-500 font-medium mt-0.5">
                                        Approved by <strong className="text-ink-800">{inst.approvedByName}</strong>
                                        {inst.approvedAt && ` on ${new Date(inst.approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {inst.status === 'UNDER_REVIEW' && (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Verification Pending
                                  </span>
                                )}

                                {inst.status === 'REJECTED' && (
                                  <div>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                                      <AlertTriangle size={11} className="text-rose-600" />
                                      Rejected
                                    </span>
                                    {inst.rejectionReason && (
                                      <div className="text-[10px] text-rose-600 max-w-[150px] truncate mt-0.5" title={inst.rejectionReason}>
                                        Reason: {inst.rejectionReason}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {inst.status === 'UNPAID' && (
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    isOverdue
                                      ? 'bg-red-50 text-red-800 border-red-200'
                                      : 'bg-sand-100 text-ink-600 border-sand-200'
                                  }`}>
                                    {isOverdue ? 'Overdue (Unpaid)' : 'Unpaid'}
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-3">
                                {inst.receiptImageUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectingInst(inst);
                                      setIsRejectingMode(false);
                                      setRejectionReasonInput('');
                                    }}
                                    className="group flex items-center gap-2 p-1 rounded-lg hover:bg-sand-100 transition-colors cursor-pointer"
                                    title="Click to inspect receipt screenshot"
                                  >
                                    <div className="w-10 h-10 rounded-md overflow-hidden bg-sand-200 border border-sand-300 shrink-0 relative">
                                      <img
                                        src={inst.receiptImageUrl}
                                        alt="Receipt proof"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye size={12} className="text-white" />
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-semibold text-[#0B3324] underline underline-offset-2">Inspect</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-ink-400 italic">No receipt</span>
                                )}
                              </td>

                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentVideo(inst.studentId, inst.studentName, isRestricted)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                                    isRestricted
                                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-2xs'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title={
                                    isRestricted
                                      ? `Restricted by ${student?.restrictedByAdminName || 'Admin'}. Click to restore video access.`
                                      : 'Video playback is active. Click to lock access.'
                                  }
                                >
                                  {isRestricted ? (
                                    <>
                                      <Lock size={11} className="text-red-600" />
                                      <span>Restricted</span>
                                    </>
                                  ) : (
                                    <>
                                      <Unlock size={11} className="text-emerald-600" />
                                      <span>Active</span>
                                    </>
                                  )}
                                </button>
                                {isRestricted && student?.restrictedByAdminName && (
                                  <div className="text-[9px] text-ink-400 mt-0.5">by {student.restrictedByAdminName}</div>
                                )}
                              </td>

                              <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                {inst.status === 'UNDER_REVIEW' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectingInst(inst);
                                      setIsRejectingMode(false);
                                      setRejectionReasonInput('');
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B3324] hover:bg-[#072419] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                                  >
                                    <CheckCircle2 size={13} className="text-emerald-400" />
                                    <span>Inspect &amp; Verify</span>
                                  </button>
                                ) : inst.receiptImageUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectingInst(inst);
                                      setIsRejectingMode(false);
                                      setRejectionReasonInput('');
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-sand-100 text-ink-700 text-xs font-semibold border border-sand-300 transition-colors cursor-pointer"
                                  >
                                    <Eye size={12} />
                                    <span>View Receipt</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-ink-400">—</span>
                                )}
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
                                    ? 'bg-purple-100 text-purple-800'
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

          {/* Tab 5: Admissions & Review */}
          {activeTab === 'applications' && (
            <div className="bg-white rounded-2xl border border-sand-200 p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-ink-900">
                    Incoming Student Applications (Semester 2 Intake)
                  </h3>
                  <p className="text-xs text-ink-500">
                    Review candidate qualifications, education background, and campus preferences.
                  </p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-3 py-1 rounded-full">
                  38 Applications Pending Review
                </span>
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
                        onClick={() => alert(`Application for ${app.name} marked for interview.`)}
                        className="px-3 py-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-xs font-semibold text-ink-700 transition-colors"
                      >
                        Schedule Interview
                      </button>
                      <button
                        onClick={() => alert(`Application for ${app.name} Approved!`)}
                        className="px-3 py-1.5 rounded-lg bg-primary-900 hover:bg-primary-800 text-xs font-semibold text-white transition-colors"
                      >
                        Approve & Enroll
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Schedules Planner */}
          {activeTab === 'schedules' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Box */}
              <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-100 text-primary-900 border border-primary-200">
                      Timetable Engine
                    </span>
                    <span className="text-xs text-ink-500 font-medium">
                      {activeWeeklySlots.length} Active Weekly Sessions
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-ink-900 mt-1">
                    Live Session &amp; On-Campus Timetable
                  </h3>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Schedule lectures across Google Meet and Lahore DHA Phase 6 campus with automated student broadcast notifications.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddScheduleSlot}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0B3324] hover:bg-[#072318] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <Plus size={15} />
                  <span>+ Add New Lecture Slot</span>
                </button>
              </div>

              {/* 4-Metric Live Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-ink-500 font-semibold uppercase tracking-wider block">Total Weekly Lectures</span>
                    <div className="text-2xl font-bold font-heading text-ink-900 mt-1">{activeWeeklySlots.length} Slots</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center text-primary-900">
                    <Calendar size={18} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-blue-700 font-semibold uppercase tracking-wider block">Google Meet (Online)</span>
                    <div className="text-2xl font-bold font-heading text-blue-950 mt-1">{onlineMeetSlotsCount} Slots</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <Video size={18} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-primary-900 font-semibold uppercase tracking-wider block">DHA Phase 6 (On-Site)</span>
                    <div className="text-2xl font-bold font-heading text-primary-950 mt-1">{onSiteCampusSlotsCount} Slots</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-800">
                    <MapPin size={18} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-ink-500 font-semibold uppercase tracking-wider block">Schedule Health</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      {scheduleConflictCount === 0 ? (
                        <span className="text-xs font-bold text-primary-900 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200 inline-flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          0 Conflicts • Cohorts Synced
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
                          <AlertTriangle size={12} />
                          {scheduleConflictCount} Overlap(s) Detected
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scheduleConflictCount === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    <Bell size={18} />
                  </div>
                </div>
              </div>

              {/* Filter & View Mode Bar */}
              <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                    <input
                      type="text"
                      value={scheduleSearch}
                      onChange={(e) => setScheduleSearch(e.target.value)}
                      placeholder="Search lecture topic, course, faculty, or room..."
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-sand-50/50"
                    />
                  </div>

                  {/* Filter Selectors */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={scheduleCohortFilter}
                      onChange={(e) => setScheduleCohortFilter(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-sand-300 bg-white font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="all">All Academic Cohorts</option>
                      <option value="foundations_sem1">Ilm Foundations • Semester 1</option>
                      <option value="foundations_sem2">Ilm Foundations • Semester 2</option>
                      <option value="intensives_modular">Ilm Intensives • Modular</option>
                    </select>

                    <select
                      value={scheduleModalityFilter}
                      onChange={(e) => setScheduleModalityFilter(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-sand-300 bg-white font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="all">All Modalities</option>
                      <option value="online_meet">Google Meet (Live Online)</option>
                      <option value="onsite_campus">DHA Phase 6 (On-Site)</option>
                    </select>

                    <select
                      value={scheduleInstructorFilter}
                      onChange={(e) => setScheduleInstructorFilter(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-sand-300 bg-white font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="all">All Faculty</option>
                      {Array.from(new Set(scheduleSlots.map((s) => s.instructorName))).filter(Boolean).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    {/* View Switcher Toggle */}
                    <div className="flex items-center p-1 rounded-xl bg-sand-100 border border-sand-200">
                      <button
                        type="button"
                        onClick={() => setScheduleViewMode('agenda')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          scheduleViewMode === 'agenda'
                            ? 'bg-[#0B3324] text-white shadow-2xs'
                            : 'text-ink-600 hover:text-ink-950'
                        }`}
                      >
                        <List size={13} />
                        <span>Agenda List</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setScheduleViewMode('weekly_grid')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          scheduleViewMode === 'weekly_grid'
                            ? 'bg-[#0B3324] text-white shadow-2xs'
                            : 'text-ink-600 hover:text-ink-950'
                        }`}
                      >
                        <CalendarDays size={13} />
                        <span>Weekly Grid</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* VIEW 1: AGENDA LIST VIEW */}
              {scheduleViewMode === 'agenda' && (
                <div className="space-y-6">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const daySlots = filteredScheduleSlots
                      .filter((s) => s.dayOfWeek === day)
                      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

                    if (daySlots.length === 0) return null;

                    return (
                      <div key={day} className="space-y-3">
                        {/* Day Header */}
                        <div className="flex items-center gap-2.5 pb-1 border-b border-sand-200">
                          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-ink-900">
                            {day}
                          </h4>
                          <span className="text-[11px] font-semibold text-ink-600 bg-sand-100 px-2 py-0.5 rounded-md">
                            {daySlots.length} {daySlots.length === 1 ? 'Lecture' : 'Lectures'}
                          </span>
                        </div>

                        {/* Cards under this day */}
                        <div className="grid grid-cols-1 gap-3">
                          {daySlots.map((slot) => {
                            const isOnline = slot.modality === 'online_meet';
                            const isCancelled = slot.status === 'cancelled';
                            const isRescheduled = slot.status === 'rescheduled';

                            return (
                              <div
                                key={slot.id}
                                className={`rounded-2xl border bg-white p-5 transition-all shadow-2xs hover:shadow-card flex flex-col justify-between gap-4 ${
                                  isCancelled
                                    ? 'border-red-200 bg-red-50/20 opacity-80'
                                    : isRescheduled
                                    ? 'border-amber-200 bg-amber-50/10'
                                    : 'border-sand-200 hover:border-sand-300'
                                }`}
                              >
                                <div className="space-y-3">
                                  {/* Top Meta Row */}
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* Modality Badge */}
                                      {isOnline ? (
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1.5">
                                          <Video size={12} className="text-blue-700" />
                                          Google Meet (Live Online)
                                        </span>
                                      ) : (
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-900 border border-primary-200 inline-flex items-center gap-1.5">
                                          <MapPin size={12} className="text-primary-800" />
                                          DHA Phase 6 Lahore Campus (On-Site)
                                        </span>
                                      )}

                                      {/* Timing */}
                                      <span className="text-xs font-bold text-ink-800 bg-sand-100 px-2 py-0.5 rounded-md">
                                        {formatSlotTimeRange(slot.startTime, slot.endTime)} PKT
                                      </span>

                                      {/* Recurrence */}
                                      <span className="text-[10px] text-ink-500 bg-white border border-sand-200 px-2 py-0.5 rounded">
                                        {slot.scheduleType === 'recurring' ? 'Weekly Recurring' : 'Single Makeup'}
                                      </span>

                                      {/* Status if abnormal */}
                                      {isRescheduled && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                          🟡 Rescheduled
                                        </span>
                                      )}
                                      {isCancelled && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">
                                          🔴 Cancelled
                                        </span>
                                      )}
                                    </div>

                                    {/* Cohort Badge */}
                                    <span className="text-[11px] font-semibold text-primary-900 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200">
                                      {slot.cohortName} ({slot.enrolledCount} Enrolled)
                                    </span>
                                  </div>

                                  {/* Main Content: Topic & Instructor */}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-primary-900 uppercase tracking-wide">
                                        {slot.courseTitle}
                                      </span>
                                    </div>
                                    <h4 className="font-heading font-bold text-base text-ink-900 mt-0.5">
                                      {slot.topic || `${slot.courseTitle} — Regular Lecture Session`}
                                    </h4>
                                    <p className="text-xs text-ink-600 mt-1 flex items-center gap-1.5">
                                      <User size={13} className="text-primary-800" />
                                      <span className="font-medium">Lead Faculty:</span>
                                      <span className="font-bold text-ink-900">{slot.instructorName}</span>
                                    </p>
                                  </div>

                                  {/* Logistics & Notification Sub-Row */}
                                  <div className="pt-2 border-t border-sand-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    {isOnline ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-blue-900 bg-blue-50/80 px-2 py-1 rounded border border-blue-200 select-all font-medium">
                                          {slot.meetLink || 'meet.google.com/ilm-live-class'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyMeetLink(slot.id, slot.meetLink)}
                                          className="text-[11px] px-2 py-1 bg-white hover:bg-sand-100 border border-sand-300 rounded font-semibold text-ink-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                        >
                                          <Copy size={11} />
                                          <span>{copiedSlotId === slot.id ? 'Copied!' : 'Copy Link'}</span>
                                        </button>
                                        {slot.meetLink && (
                                          <a
                                            href={slot.meetLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors inline-flex items-center gap-1"
                                          >
                                            <span>Launch Meet</span>
                                            <ExternalLink size={11} />
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-ink-800 font-semibold">
                                          <MapPin size={13} className="text-primary-800" />
                                          <span>{slot.campusRoom || 'Room 204 • Main Block'}</span>
                                        </div>
                                        <span className="text-[11px] font-semibold text-ink-600 bg-sand-100 px-2 py-0.5 rounded">
                                          Cap: {slot.roomCapacity || 35} Seats
                                        </span>
                                      </div>
                                    )}

                                    {/* Notification broadcast state */}
                                    <div className="text-[11px] text-ink-500 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      <span>🔔 Notified {slot.enrolledCount} enrolled students</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Card Actions */}
                                <div className="pt-2 border-t border-sand-100 flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickRemind(slot)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                    title="Send instant reminder blast to enrolled cohort"
                                  >
                                    <Bell size={13} />
                                    <span>Send Reminder</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditScheduleSlot(slot)}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-ink-700 hover:text-ink-950 bg-sand-100 hover:bg-sand-200 border border-sand-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Edit3 size={13} />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteScheduleSlotItem(slot.id, slot.courseTitle)}
                                    className="p-1.5 rounded-xl text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Delete slot"
                                  >
                                    <Trash2 size={14} />
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
                                        ? 'border-l-4 border-l-blue-600 border-sand-200'
                                        : 'border-l-4 border-l-emerald-600 border-sand-200'
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
                                        <span className="text-blue-700 font-bold flex items-center gap-0.5">
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
              <div className="bg-white rounded-2xl border border-sand-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gold-100 text-gold-800 text-[11px] font-bold tracking-wide uppercase mb-2">
                    <Library size={13} />
                    Digital Repository & Reading Materials
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                    e-Library Catalog Management
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-500 mt-1 max-w-2xl">
                    Publish, edit, feature, and manage Islamic reference texts, curriculum companion textbooks, and downloadable study materials for students.
                  </p>
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

              {/* Quick KPI Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Total Resources</span>
                    <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-900 flex items-center justify-center">
                      <BookOpen size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-heading font-bold text-ink-900">{libraryMetrics.totalTitles}</p>
                  <p className="text-[11px] text-ink-500 mt-1">Cataloged in repository</p>
                </div>

                <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Featured Titles</span>
                    <div className="w-8 h-8 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center">
                      <Star size={16} className="fill-gold-500 text-gold-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-heading font-bold text-gold-700">{libraryMetrics.featuredCount}</p>
                  <p className="text-[11px] text-ink-500 mt-1">Highlighted on e-Library home</p>
                </div>

                <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Active Subjects</span>
                    <div className="w-8 h-8 rounded-xl bg-sand-200 text-ink-700 flex items-center justify-center">
                      <Layers size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-heading font-bold text-ink-900">{libraryMetrics.categoryCount}</p>
                  <p className="text-[11px] text-ink-500 mt-1">Disciplines & fields</p>
                </div>

                <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Total Pages</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-heading font-bold text-ink-900">{libraryMetrics.totalPages.toLocaleString()}</p>
                  <p className="text-[11px] text-ink-500 mt-1">Pages across all works</p>
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
                        <th className="py-3.5 px-3">Subject / Type</th>
                        <th className="py-3.5 px-3">Pages & Size</th>
                        <th className="py-3.5 px-3 text-center">Featured</th>
                        <th className="py-3.5 px-3">Status</th>
                        <th className="py-3.5 px-3">Access Links</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {filteredLibraryItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-ink-400">
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
                                    {item.description && (
                                      <p className="text-[10px] text-ink-400 line-clamp-1 mt-0.5">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Category & Type */}
                              <td className="py-3.5 px-3">
                                <div className="space-y-1">
                                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-50 text-primary-900 border border-primary-200">
                                    {item.category}
                                  </span>
                                  <div>
                                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-sand-100 text-ink-600">
                                      {typeLabel}
                                    </span>
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

                              {/* Status */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === 'draft'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'draft' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                  {item.status === 'draft' ? 'Draft' : 'Published'}
                                </span>
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
              <div className="bg-white rounded-2xl border border-sand-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gold-100 text-gold-800 text-[11px] font-bold tracking-wide uppercase mb-2">
                    <Quote size={13} />
                    Daily Reflections & Quotes
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink-900 tracking-tight">
                    Daily Inscriptions & Wisdom
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-500 mt-1 max-w-2xl">
                    Manage the authentic Hadith, Quranic ayahs, and scholarly reflections displayed on the student dashboard hero card.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    to="/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-sand-300 text-xs font-semibold text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>View Student Dashboard</span>
                  </Link>
                  <button
                    onClick={handleOpenAddQuoteModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-900 text-white text-xs font-semibold hover:bg-primary-800 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Add Quote</span>
                  </button>
                </div>
              </div>

              {/* Top Row: KPIs and Live Student Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2 Cols: KPIs */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Total Quotes</span>
                      <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-900 flex items-center justify-center">
                        <Quote size={16} />
                      </div>
                    </div>
                    <p className="text-2xl font-heading font-bold text-ink-900">{quotesMetrics.total}</p>
                    <p className="text-[11px] text-ink-500 mt-1">In platform database</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Active Pool</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                    <p className="text-2xl font-heading font-bold text-emerald-800">{quotesMetrics.active}</p>
                    <p className="text-[11px] text-ink-500 mt-1">Rotating daily</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-xs col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Today's Display</span>
                      <div className="w-8 h-8 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center">
                        <Star size={16} className={quotesMetrics.pinnedQuote ? 'fill-gold-500 text-gold-600' : 'text-gold-600'} />
                      </div>
                    </div>
                    <p className="text-sm font-heading font-bold text-ink-900 truncate">
                      {quotesMetrics.pinnedQuote ? quotesMetrics.pinnedQuote.source : 'Daily Rotation'}
                    </p>
                    <p className="text-[11px] text-ink-500 mt-1">
                      {quotesMetrics.pinnedQuote ? 'Admin Pinned Reflection' : 'Automated Calendar Seed'}
                    </p>
                  </div>

                  {/* Word Limit Guideline Callout */}
                  <div className="col-span-2 sm:col-span-3 bg-sand-100/70 border border-sand-200 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary-900 text-gold-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={14} />
                    </div>
                    <div className="text-xs text-ink-700 leading-relaxed">
                      <strong className="font-semibold text-ink-900 block mb-0.5">Card UI Constraints (Enforced automatically):</strong>
                      Quotes are restricted to a maximum of <strong>40 words</strong> and citations to <strong>8 words</strong> to ensure the student hero banner renders without clipping or overflow.
                    </div>
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
                    <p className="text-[11px] text-ink-500">Configure academic track, format, and fee status.</p>
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
                      Academic Program
                    </label>
                    <select
                      value={studentFormData.program}
                      onChange={(e) => setStudentFormData({ ...studentFormData, program: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="Ilm Foundations">Ilm Foundations (8-Month)</option>
                      <option value="Ilm Intensives">Ilm Intensives Masterclass</option>
                      <option value="Classical Arabic">Classical Arabic Track</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Semester
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
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Fee Status
                    </label>
                    <select
                      value={studentFormData.feeStatus}
                      onChange={(e) => setStudentFormData({ ...studentFormData, feeStatus: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Partial">Partial</option>
                      <option value="Pending">Pending</option>
                      <option value="Waived">Waived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Curriculum Progress (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={studentFormData.progress}
                      onChange={(e) => setStudentFormData({ ...studentFormData, progress: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Attendance Rate
                    </label>
                    <input
                      type="text"
                      value={studentFormData.attendance}
                      onChange={(e) => setStudentFormData({ ...studentFormData, attendance: e.target.value })}
                      placeholder="e.g. 96%"
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                {/* Account Security & Password */}
                <div className="pt-2 border-t border-sand-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                      <Lock size={13} className="text-primary-800" />
                      Account Password &amp; Portal Access
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
        {/* 2. CREATE INSTALLMENTS MODAL                             */}
        {/* ======================================================== */}
        {showCreateInstallmentModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-sand-300 shadow-2xl overflow-hidden my-8">
              <div className="px-6 py-4 bg-sand-50 border-b border-sand-200 flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-ink-900">
                    Create Fee Installments
                  </h3>
                  <p className="text-xs text-ink-500">
                    Assign fixed installment milestone deadlines to single or all enrolled students.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateInstallmentModal(false)}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-sand-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateInstallmentsSubmit} className="p-6 space-y-4">
                {/* Target Students Selection */}
                <div>
                  <label className="text-xs font-bold text-ink-800 block mb-1.5">
                    Target Student Assignment
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      createForm.studentSelection === 'all'
                        ? 'bg-emerald-50/80 border-[#0B3324] text-[#0B3324]'
                        : 'bg-sand-50 border-sand-200 text-ink-700 hover:bg-sand-100'
                    }`}>
                      <input
                        type="radio"
                        name="studentSelection"
                        checked={createForm.studentSelection === 'all'}
                        onChange={() => setCreateForm({ ...createForm, studentSelection: 'all' })}
                        className="text-[#0B3324] focus:ring-[#0B3324]"
                      />
                      <span>All Students ({students.length})</span>
                    </label>

                    <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      createForm.studentSelection === 'specific'
                        ? 'bg-emerald-50/80 border-[#0B3324] text-[#0B3324]'
                        : 'bg-sand-50 border-sand-200 text-ink-700 hover:bg-sand-100'
                    }`}>
                      <input
                        type="radio"
                        name="studentSelection"
                        checked={createForm.studentSelection === 'specific'}
                        onChange={() => setCreateForm({ ...createForm, studentSelection: 'specific' })}
                        className="text-[#0B3324] focus:ring-[#0B3324]"
                      />
                      <span>Specific Students</span>
                    </label>
                  </div>

                  {createForm.studentSelection === 'specific' && (
                    <div className="mt-2.5 p-3 rounded-xl border border-sand-200 bg-sand-50/60 max-h-40 overflow-y-auto space-y-1.5">
                      {students.map((std) => {
                        const isChecked = createForm.selectedStudentIds.includes(std.id);
                        return (
                          <label key={std.id} className="flex items-center gap-2 text-xs text-ink-800 cursor-pointer hover:bg-sand-100 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...createForm.selectedStudentIds, std.id]
                                  : createForm.selectedStudentIds.filter((id) => id !== std.id);
                                setCreateForm({ ...createForm, selectedStudentIds: next });
                              }}
                              className="rounded text-[#0B3324] focus:ring-[#0B3324]"
                            />
                            <span className="font-semibold">{std.name}</span>
                            <span className="text-[10px] text-ink-400">({std.email})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Installment Title */}
                <div>
                  <label className="text-xs font-bold text-ink-800 block mb-1">
                    Installment Title / Milestone
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="e.g. Installment 1 - Semester 1, Registration Fee"
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                {/* Fixed Amount */}
                <div>
                  <label className="text-xs font-bold text-ink-800 block mb-1">
                    Fixed Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                    placeholder="8000"
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono"
                  />
                  <span className="text-[10px] text-ink-400 mt-0.5 block">
                    Fixed installment amount — partial payments are not permitted.
                  </span>
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-xs font-bold text-ink-800 block mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div className="pt-3 border-t border-sand-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateInstallmentModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-600 hover:text-ink-900 hover:bg-sand-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0B3324] hover:bg-[#072419] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Create &amp; Assign Installments
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
