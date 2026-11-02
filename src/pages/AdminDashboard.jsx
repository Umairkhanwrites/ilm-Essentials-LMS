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
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';

import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import logoWhite from '../assets/logo-white.png';
import {
  adminOverviewStats,
  adminStudentsList,
  adminAllCourses,
  courseFormats,
} from '../data/mockData';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Tabs state
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'students' | 'applications' | 'schedules'

  // Student search & filter
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState(adminStudentsList);

  // Courses filter & state
  const [courseCategoryFilter, setCourseCategoryFilter] = useState('all');
  const [courses, setCourses] = useState(adminAllCourses);

  // New Course Modal state
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({
    title: '',
    category: 'foundations',
    instructor: '',
    format: 'live-online',
    capacity: 100,
    fee: 'PKR 30,000',
    startDate: '',
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

  // Handle new course submit
  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!newCourseForm.title || !newCourseForm.instructor) {
      alert('Please fill out all required fields.');
      return;
    }
    const created = {
      id: `crs_adm_${Date.now()}`,
      title: newCourseForm.title,
      category: newCourseForm.category,
      instructor: newCourseForm.instructor,
      format: newCourseForm.format,
      enrolledCount: 0,
      capacity: Number(newCourseForm.capacity) || 100,
      fee: newCourseForm.fee,
      status: 'Active',
      startDate: newCourseForm.startDate || '2026-04-01',
    };
    setCourses([created, ...courses]);
    setIsNewCourseModalOpen(false);
    setNewCourseForm({
      title: '',
      category: 'foundations',
      instructor: '',
      format: 'live-online',
      capacity: 100,
      fee: 'PKR 30,000',
      startDate: '',
    });
  };

  const getFormatIcon = (fmt) => {
    if (fmt === 'on-site') return MapPin;
    if (fmt === 'live-online') return Video;
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

                <button
                  onClick={() => setIsNewCourseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-primary-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={15} />
                  Create Course
                </button>

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
            {adminOverviewStats.map((stat, idx) => {
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
              { id: 'students', label: 'Enrolled Students', count: students.length },
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
                      const FormatIcon = getFormatIcon(c.format);
                      return (
                        <tr key={c.id} className="hover:bg-sand-50/70 transition-colors">
                          <td className="py-4 px-4 font-semibold text-ink-900">
                            <div>{c.title}</div>
                            <span className="text-[11px] font-normal text-primary-700 capitalize">
                              {c.category === 'foundations' ? '8-Month Certificate' : 'Masterclass Intensive'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-ink-600">{c.instructor}</td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-sand-100 text-ink-700 capitalize">
                              <FormatIcon size={12} className="text-primary-700" />
                              {c.format.replace('-', ' ')}
                            </span>
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
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                c.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gold-100 text-gold-800'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right space-x-2">
                            <Link
                              to={`/course/${c.id}`}
                              className="text-xs text-primary-700 hover:text-primary-900 font-semibold underline"
                            >
                              Preview
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Enrolled Students */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-b-2xl border border-sand-200 border-t-0 p-6 space-y-6">
              {/* Search Bar */}
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
                <div className="text-xs text-ink-500">
                  Showing <strong className="text-ink-800">{filteredStudents.length}</strong> enrolled students
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
                      <th className="py-3.5 px-4 text-right">Fee Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100 text-ink-800">
                    {filteredStudents.map((std) => (
                      <tr key={std.id} className="hover:bg-sand-50/70 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-ink-900">{std.name}</div>
                          <div className="text-xs text-ink-500">{std.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-medium text-ink-800">{std.program}</div>
                          <div className="text-[11px] text-ink-500">{std.semester}</div>
                        </td>
                        <td className="py-4 px-4 text-xs capitalize text-ink-600">
                          {std.format.replace('-', ' ')}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-sand-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-700 rounded-full"
                                style={{ width: `${std.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-ink-700">{std.progress}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-xs text-ink-800">
                          {std.attendance}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              std.feeStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {std.feeStatus}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => toggleFeeStatus(std.id)}
                            className="text-xs font-semibold text-primary-700 hover:text-primary-900 underline cursor-pointer"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
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

        {/* Modal: Create New Course */}
        <AnimatePresence>
          {isNewCourseModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNewCourseModalOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-2xl shadow-elevated border border-sand-200 w-full max-w-lg p-6 z-10 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-ink-900">
                      Create New Program Course
                    </h3>
                    <p className="text-xs text-ink-500">
                      Add a new certificate track or intensive masterclass.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsNewCourseModalOpen(false)}
                    className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCourseForm.title}
                      onChange={(e) =>
                        setNewCourseForm({ ...newCourseForm, title: e.target.value })
                      }
                      placeholder="e.g. Usul al-Fiqh: Principles of Jurisprudence"
                      className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">
                        Program Pathway
                      </label>
                      <select
                        value={newCourseForm.category}
                        onChange={(e) =>
                          setNewCourseForm({ ...newCourseForm, category: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      >
                        <option value="foundations">Ilm Foundations (8-Month)</option>
                        <option value="intensives">Ilm Intensives (Masterclass)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">
                        Format
                      </label>
                      <select
                        value={newCourseForm.format}
                        onChange={(e) =>
                          setNewCourseForm({ ...newCourseForm, format: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      >
                        <option value="live-online">Live Online (Google Meet)</option>
                        <option value="on-site">On-Site (Lahore DHA Phase 6)</option>
                        <option value="self-paced">Self-Paced (Recorded)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">
                      Instructor Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCourseForm.instructor}
                      onChange={(e) =>
                        setNewCourseForm({ ...newCourseForm, instructor: e.target.value })
                      }
                      placeholder="e.g. Sheikh Abdullah Nasir"
                      className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">
                        Tuition Fee
                      </label>
                      <input
                        type="text"
                        value={newCourseForm.fee}
                        onChange={(e) =>
                          setNewCourseForm({ ...newCourseForm, fee: e.target.value })
                        }
                        placeholder="PKR 30,000"
                        className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={newCourseForm.capacity}
                        onChange={(e) =>
                          setNewCourseForm({ ...newCourseForm, capacity: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-sand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-200">
                    <button
                      type="button"
                      onClick={() => setIsNewCourseModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-600 hover:bg-sand-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-primary-900 text-white hover:bg-primary-800 transition-colors cursor-pointer"
                    >
                      Create & Publish Course
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
