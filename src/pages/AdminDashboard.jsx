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
import { Link, useNavigate } from 'react-router-dom';
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
  Shield,
  ArrowLeft,
  ChevronDown,
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
  Building,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  User,
  Key,
  Copy,
  EyeOff,
  Lock,
} from 'lucide-react';

import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import logoWhite from '../assets/logo-white.png';
import FeeInvoiceModal from '../components/admin/FeeInvoiceModal';
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
  recordFeePayment,
  updateFeeStatus,
  getCourseEnrolledStudentIds,
  updateCourseEnrollment,
  generateTemporaryPassword,
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

  // Student Fee Management State & Handlers
  const [feeRecords, setFeeRecords] = useState(() => getFeeRecords());
  const [feeSearch, setFeeSearch] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState('all');
  const [selectedInvoiceRecord, setSelectedInvoiceRecord] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetFee, setPaymentTargetFee] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'Bank Transfer (Meezan Bank)',
    transactionRef: '',
    paidDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const filteredFees = useMemo(() => {
    return feeRecords.filter((f) => {
      const matchSearch =
        f.studentName.toLowerCase().includes(feeSearch.toLowerCase()) ||
        f.studentEmail.toLowerCase().includes(feeSearch.toLowerCase()) ||
        f.invoiceNo.toLowerCase().includes(feeSearch.toLowerCase()) ||
        f.program.toLowerCase().includes(feeSearch.toLowerCase());

      const matchFilter = feeStatusFilter === 'all' || f.status.toLowerCase() === feeStatusFilter.toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [feeRecords, feeSearch, feeStatusFilter]);

  const feeSummary = useMemo(() => {
    const totalBilled = feeRecords.reduce((sum, f) => sum + (Number(f.totalAmount) || 0), 0);
    const totalCollected = feeRecords.reduce((sum, f) => sum + (Number(f.paidAmount) || 0), 0);
    const totalOutstanding = feeRecords.reduce((sum, f) => sum + (Number(f.balance) || 0), 0);
    const overdueCount = feeRecords.filter((f) => f.status === 'Overdue').length;
    const pendingCount = feeRecords.filter((f) => f.status === 'Pending' || f.status === 'Partial').length;
    return { totalBilled, totalCollected, totalOutstanding, overdueCount, pendingCount };
  }, [feeRecords]);

  const handleOpenRecordPayment = (feeRec) => {
    setPaymentTargetFee(feeRec);
    setPaymentFormData({
      amount: feeRec.balance > 0 ? String(feeRec.balance) : String(feeRec.totalAmount),
      paymentMethod: 'Bank Transfer (Meezan Bank)',
      transactionRef: `TRX-${Date.now().toString().slice(-6)}`,
      paidDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!paymentTargetFee || !paymentFormData.amount) return;

    recordFeePayment(paymentTargetFee.id, {
      amount: Number(paymentFormData.amount),
      paymentMethod: paymentFormData.paymentMethod,
      transactionRef: paymentFormData.transactionRef,
      paidDate: paymentFormData.paidDate,
      notes: paymentFormData.notes,
    });

    setFeeRecords(getFeeRecords());
    setStudents(getAllStudents());
    setIsPaymentModalOpen(false);
    setPaymentTargetFee(null);
  };

  const handleQuickFeeStatusChange = (feeId, newStatus) => {
    const updated = updateFeeStatus(feeId, newStatus);
    setFeeRecords(updated);
    setStudents(getAllStudents());
  };

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
        label: 'Active Courses',
        value: activeCount,
        icon: 'BookOpen',
        change: `${foundationsCount} Foundations, ${intensivesCount} Intensives`,
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

  const handleAdminLogout = () => {
    logout();
    navigate('/admin/login');
  };

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
                      Classical Sciences Curriculum & Operations
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Actions & Profile */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right pr-2">
                  <span className="text-xs font-bold text-white block leading-tight">
                    {user?.name || 'Administrator'}
                  </span>
                  <span className="text-[10px] text-primary-300 block">
                    {user?.email || 'admin@ilmessentials.pk'}
                  </span>
                </div>

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
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

          {/* Navigation Tabs */}
          <div className="flex border-b border-sand-200 bg-white rounded-t-2xl px-6 pt-2 gap-6 overflow-x-auto">
            {[
              { id: 'courses', label: 'Course Management', count: courses.length },
              { id: 'students', label: 'Student Accounts', count: students.length },
              { id: 'instructors', label: 'Faculty & Instructors', count: instructors.length },
              { id: 'fees', label: 'Tuition & Fee Management', count: feeSummary.pendingCount },
              { id: 'applications', label: 'Admissions & Review', count: 38 },
              { id: 'schedules', label: 'Class Schedule Planner' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-primary-800 text-primary-900'
                    : 'border-transparent text-ink-500 hover:text-ink-800'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-900 font-bold'
                        : 'bg-sand-100 text-ink-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab 1: Course Management */}
          {activeTab === 'courses' && (
            <div className="bg-white rounded-b-2xl border border-sand-200 border-t-0 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {['all', 'foundations', 'intensives'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCourseCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        courseCategoryFilter === cat
                          ? 'bg-primary-900 text-white'
                          : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                      }`}
                    >
                      {cat === 'all' ? 'All Programs' : cat}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-ink-500">
                  Showing <strong className="text-ink-800">{filteredCourses.length}</strong> active programs
                </div>
              </div>

              {/* Course Table */}
              <div className="overflow-x-auto rounded-xl border border-sand-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                    <tr>
                      <th className="py-3.5 px-4">Program & Title</th>
                      <th className="py-3.5 px-4">Instructor</th>
                      <th className="py-3.5 px-4">Format</th>
                      <th className="py-3.5 px-4">Enrollment</th>
                      <th className="py-3.5 px-4">Tuition Fee</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
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
                          <td className="py-4 px-4 font-semibold text-ink-900">
                            <div>{c.title}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[11px] font-medium text-primary-700 capitalize">
                                {c.category === 'foundations' ? '8-Month Certificate' : 'Masterclass Intensive'}
                              </span>
                              {(c.startDate || c.duration) && (
                                <span className="text-[11px] text-ink-500 font-normal">
                                  • {c.startDate} {c.endDate ? `– ${c.endDate}` : ''} ({c.duration || '8 Weeks'})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-ink-600">{c.instructor}</td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-semibold border ${formatColor}`}>
                                <FormatIcon size={12} />
                                {formatLabel}
                              </span>
                              {isOnline && c.meetingLink && (
                                <div className="text-[10px] text-emerald-700 truncate max-w-[140px]" title={c.meetingLink}>
                                  Link: {c.meetingLink.replace('https://', '')}
                                </div>
                              )}
                              {isOnsite && c.venue && (
                                <div className="text-[10px] text-amber-700 truncate max-w-[140px]" title={c.venue}>
                                  {c.venue}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-xs font-medium">
                              {c.enrolledCount} / {c.capacity} students
                            </div>
                            <div className="w-24 h-1.5 bg-sand-200 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-primary-600 rounded-full"
                                style={{ width: `${(c.enrolledCount / c.capacity) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-ink-900">{c.fee}</td>
                          <td className="py-4 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(c.id, c.status)}
                              title="Click to cycle status: Active / Upcoming / Draft"
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
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
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenRosterModal(c)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200/60 transition-colors cursor-pointer"
                                title="Manage enrolled students roster for this course"
                              >
                                <Users size={12} />
                                Roster ({c.enrolledCount || 0})
                              </button>
                              <Link
                                to={`/admin/courses/edit/${c.id}`}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sand-100 hover:bg-gold-50 text-gold-900 font-semibold transition-colors"
                                title="Edit course curriculum & schedule"
                              >
                                <Edit3 size={12} />
                                Edit
                              </Link>
                              <Link
                                to={`/course/${c.id}`}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sand-100 hover:bg-primary-50 text-primary-800 font-semibold transition-colors"
                                title="Preview course room as student"
                              >
                                <Eye size={12} />
                                Preview
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteCourse(c.id, c.title)}
                                className="p-1 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove course from catalog"
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
            </div>
          )}

          {/* Tab 2: Student Accounts */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-b-2xl border border-sand-200 border-t-0 p-6 space-y-6">
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
                <table className="w-full text-left text-sm">
                  <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Enrolled Program</th>
                      <th className="py-3.5 px-4">Mode</th>
                      <th className="py-3.5 px-4">Curriculum Progress</th>
                      <th className="py-3.5 px-4">Attendance</th>
                      <th className="py-3.5 px-4">Fee Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100 text-ink-800">
                    {filteredStudents.map((std) => (
                      <tr key={std.id} className="hover:bg-sand-50/70 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-ink-900">{std.name}</div>
                          <div className="text-xs text-ink-500">{std.email}</div>
                          {std.phone && <div className="text-[11px] text-ink-400 font-mono">{std.phone}</div>}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-medium text-ink-800">{std.program}</div>
                          <div className="text-[11px] text-ink-500">{std.semester || 'Semester 1'}</div>
                        </td>
                        <td className="py-4 px-4 text-xs capitalize text-ink-600">
                          {std.format?.replace('-', ' ') || 'Online'}
                        </td>
                        <td className="py-4 px-4">
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
                        <td className="py-4 px-4 font-semibold text-xs text-ink-800">
                          {std.attendance || '95%'}
                        </td>
                        <td className="py-4 px-4">
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
                        <td className="py-4 px-4 text-right">
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
            <div className="bg-white rounded-b-2xl border border-sand-200 border-t-0 p-6 space-y-6">
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
                <table className="w-full text-left text-sm">
                  <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                    <tr>
                      <th className="py-3.5 px-4">Scholar / Faculty Member</th>
                      <th className="py-3.5 px-4">Academic Specialization</th>
                      <th className="py-3.5 px-4">Contact Details</th>
                      <th className="py-3.5 px-4">Assigned Courses</th>
                      <th className="py-3.5 px-4">Faculty Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100 text-ink-800">
                    {filteredInstructors.map((inst) => (
                      <tr key={inst.id} className="hover:bg-sand-50/70 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={inst.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                              alt={inst.name}
                              className="h-10 w-10 rounded-full object-cover border border-sand-300 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-ink-900">{inst.name}</div>
                              <div className="text-xs text-primary-800 font-medium">{inst.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs text-ink-600">
                          {inst.specialization || 'Classical Islamic Sciences'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-medium text-ink-800">{inst.email}</div>
                          {inst.phone && (
                            <div className="text-[11px] text-ink-500 font-mono">{inst.phone}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
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
                        <td className="py-4 px-4">
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
                        <td className="py-4 px-4 text-right">
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
          {activeTab === 'fees' && (
            <div className="bg-white rounded-b-2xl border border-sand-200 border-t-0 p-6 space-y-6">
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

              {/* Filters & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
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

                <div className="flex items-center gap-2 overflow-x-auto">
                  {['all', 'Paid', 'Partial', 'Pending', 'Overdue', 'Waived'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFeeStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        feeStatusFilter === status
                          ? 'bg-primary-900 text-white'
                          : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                      }`}
                    >
                      {status === 'all' ? 'All Statuses' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Ledger Table */}
              <div className="overflow-x-auto rounded-xl border border-sand-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sand-100/70 text-ink-700 text-xs font-semibold uppercase tracking-wider border-b border-sand-200">
                    <tr>
                      <th className="py-3.5 px-4">Student &amp; Invoice No</th>
                      <th className="py-3.5 px-4">Program Track</th>
                      <th className="py-3.5 px-4">Billed Amount</th>
                      <th className="py-3.5 px-4">Paid</th>
                      <th className="py-3.5 px-4">Remaining Balance</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100 text-ink-800">
                    {filteredFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-sand-50/70 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-ink-900">{fee.studentName}</div>
                          <div className="text-xs text-ink-500">{fee.studentEmail}</div>
                          <div className="text-[11px] text-primary-700 font-mono font-medium">{fee.invoiceNo}</div>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-ink-800">
                          {fee.program}
                        </td>
                        <td className="py-4 px-4 font-mono font-semibold text-xs text-ink-900">
                          PKR {fee.totalAmount?.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-mono font-semibold text-xs text-emerald-800">
                          PKR {fee.paidAmount?.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-xs">
                          <span className={fee.balance > 0 ? 'text-red-600' : 'text-emerald-700'}>
                            PKR {fee.balance?.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-ink-600">
                          {fee.dueDate}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              fee.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
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
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenRecordPayment(fee)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200/60 transition-colors cursor-pointer"
                              title="Record tuition payment"
                            >
                              <DollarSign size={12} />
                              Record Payment
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceRecord(fee)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sand-100 hover:bg-sand-200 text-ink-800 font-semibold transition-colors cursor-pointer"
                              title="Print official receipt voucher"
                            >
                              <Receipt size={12} />
                              Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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

          {/* Tab 3: Admissions & Review */}
          {activeTab === 'applications' && (
            <div className="bg-white rounded-b-2xl border border-sand-200 border-t-0 p-6 space-y-6">
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

          {/* Tab 4: Schedules Planner */}
          {activeTab === 'schedules' && (
            <div className="bg-white rounded-b-2xl border border-sand-200 border-t-0 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-ink-900">
                    Live Session & On-Campus Timetable
                  </h3>
                  <p className="text-xs text-ink-500">
                    Schedule lectures across Google Meet and Lahore DHA Phase 6 campus.
                  </p>
                </div>
                <button
                  onClick={() => alert('New session creation form initialized.')}
                  className="px-3.5 py-1.5 bg-primary-900 text-white rounded-lg text-xs font-bold hover:bg-primary-800 transition-colors"
                >
                  + Add New Lecture Slot
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Tafsīr-ul-Qur\'ān — Surah Al-Baqarah (Verses 142–152)',
                    instructor: 'Ustadh Khalil Ahmad',
                    timing: 'Tuesday, 6:00 PM – 8:30 PM',
                    type: 'Google Meet (Live Online)',
                    badgeColor: 'bg-blue-50 text-blue-800',
                  },
                  {
                    title: 'Fiqh al-Ibadat — Conditions & Pillars of Salah',
                    instructor: 'Sheikh Abdullah Nasir',
                    timing: 'Wednesday, 6:00 PM – 8:30 PM',
                    type: 'DHA Phase 6 Lahore Campus (On-Site)',
                    badgeColor: 'bg-emerald-50 text-emerald-800',
                  },
                  {
                    title: 'Qur\'ānic Arabic — Nominal Sentences (Jumlah Ismiyyah)',
                    instructor: 'Ustadha Fatima Zahra',
                    timing: 'Thursday, 6:00 PM – 8:30 PM',
                    type: 'Google Meet (Live Online)',
                    badgeColor: 'bg-blue-50 text-blue-800',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-sand-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-sand-50/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                          {item.type}
                        </span>
                        <span className="text-xs text-ink-500">• {item.timing}</span>
                      </div>
                      <h4 className="font-semibold text-ink-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-primary-700 font-medium">Instructor: {item.instructor}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert('Editing session timetable...')}
                        className="text-xs text-ink-600 hover:text-ink-900 px-3 py-1.5 rounded-lg border border-sand-200"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                      className="w-full pl-3.5 pr-10 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono font-semibold text-ink-900"
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
                  <span className="font-mono font-bold text-ink-900">{createdCredentialsModal.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-500">Temporary Password:</span>
                  <span className="font-mono font-bold text-primary-900 bg-white px-2 py-0.5 rounded border border-sand-300">
                    {createdCredentialsModal.password}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Login Portal:</span>
                  <span className="font-mono text-ink-700">ilmessentials.pk/login</span>
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

        {/* RECORD PAYMENT MODAL */}
        {isPaymentModalOpen && paymentTargetFee && (
          <div className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-sand-200 overflow-hidden">
              <div className="px-6 py-4 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-900">
                      Record Tuition Payment
                    </h3>
                    <p className="text-[11px] text-ink-500">
                      {paymentTargetFee.studentName} • {paymentTargetFee.invoiceNo}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1 rounded-lg text-ink-400 hover:text-ink-700"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="p-6 space-y-3.5">
                <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-ink-400 font-bold uppercase block">TOTAL BILLED</span>
                    <span className="font-mono font-bold text-ink-900">
                      PKR {paymentTargetFee.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-400 font-bold uppercase block">CURRENT BALANCE</span>
                    <span className="font-mono font-bold text-red-600">
                      PKR {paymentTargetFee.balance?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1">
                    Payment Amount to Record (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={paymentTargetFee.totalAmount}
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="Bank Transfer (Meezan Bank)">Bank Transfer (Meezan Bank)</option>
                    <option value="HBL Online Banking">HBL Online Banking</option>
                    <option value="Raast Instant Transfer">Raast Instant Transfer</option>
                    <option value="Credit/Debit Card (Online)">Credit/Debit Card (Online)</option>
                    <option value="Cash at DHA Campus">Cash at DHA Lahore Campus</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Transaction / Reference ID
                    </label>
                    <input
                      type="text"
                      value={paymentFormData.transactionRef}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, transactionRef: e.target.value })}
                      placeholder="e.g. TRX-982341"
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentFormData.paidDate}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, paidDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1">
                    Accounts Remarks / Notes
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    placeholder="e.g. Verified by accounts manager"
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="pt-3 border-t border-sand-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-sand-100 hover:bg-sand-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Confirm &amp; Record Payment
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
      </div>
    </Layout>
  );
}
