/**
 * Navbar — Fixed/Sticky top navigation bar for Ilm Essentials Student Portal
 *
 * Dedicated strictly to students:
 * - Logo linked to /dashboard
 * - Nav links: Dashboard, My Courses (dropdown), e-Library
 * - Notification bell with unread badge
 * - Student Profile avatar + dropdown (Profile, Settings, Log Out)
 * - Clean mobile drawer without administrative leaks
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  Menu,
  X,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  BookOpen,
  GraduationCap,
  Zap,
  LogIn,
  Library,
  Video,
  ExternalLink,
  Calendar,
  CreditCard,
  Lock,
} from 'lucide-react';

import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import {
  getStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearStudentNotifications,
  getStudentVideoRestriction,
} from '../../services/courseStorage';

/** Returns user initials from full name */
function getInitials(name) {
  if (!name) return 'IE';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Framer-motion variants for dropdown menus */
const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.97,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
};

/** Framer-motion variants for mobile drawer */
const drawerVariants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '100%', transition: { duration: 0.25, ease: 'easeIn' } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/** NavLink styling helper */
function navLinkClass({ isActive }) {
  return clsx(
    'relative px-2 py-2 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'text-primary-900 font-semibold after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary-700 after:rounded-full'
      : 'text-ink-700 hover:text-primary-800'
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const coursesRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const [notificationList, setNotificationList] = useState(() => getStudentNotifications());

  useEffect(() => {
    const refreshNotifications = () => {
      setNotificationList(getStudentNotifications());
    };
    window.addEventListener('ilm-notifications-updated', refreshNotifications);
    window.addEventListener('storage', refreshNotifications);
    return () => {
      window.removeEventListener('ilm-notifications-updated', refreshNotifications);
      window.removeEventListener('storage', refreshNotifications);
    };
  }, []);

  const [restriction, setRestriction] = useState(() => getStudentVideoRestriction());

  useEffect(() => {
    const handleRestrictionUpdate = () => {
      setRestriction(getStudentVideoRestriction());
    };
    window.addEventListener('ilm-video-restriction-updated', handleRestrictionUpdate);
    window.addEventListener('storage', handleRestrictionUpdate);
    return () => {
      window.removeEventListener('ilm-video-restriction-updated', handleRestrictionUpdate);
      window.removeEventListener('storage', handleRestrictionUpdate);
    };
  }, []);

  const unreadCount = notificationList.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
  };

  const handleClearAll = () => {
    clearStudentNotifications();
  };

  // Handle scroll shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside to close dropdowns
  const handleClickOutside = useCallback((e) => {
    if (coursesRef.current && !coursesRef.current.contains(e.target)) {
      setCoursesOpen(false);
    }
    if (notifRef.current && !notifRef.current.contains(e.target)) {
      setNotifOpen(false);
    }
    if (userRef.current && !userRef.current.contains(e.target)) {
      setUserOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const courseSubLinks = [
    { to: '/courses?category=foundations', label: 'Ilm Foundations', icon: GraduationCap },
    { to: '/courses?category=intensives', label: 'Ilm Intensives', icon: Zap },
  ];

  const handleLogout = () => {
    setUserOpen(false);
    setMobileOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      {user?.role !== 'admin' && restriction.isVideoRestricted && (
        <div className="bg-red-950 text-white border-b border-red-700/60 px-4 py-2 text-xs font-medium z-50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span>
                <strong>Video Access Blocked:</strong> Your course video playback has been restricted due to overdue fee installments.
              </span>
            </div>
            <Link
              to="/accounts"
              className="text-amber-300 hover:text-amber-200 underline font-semibold shrink-0"
            >
              Resolve in Accounts &rarr;
            </Link>
          </div>
        </div>
      )}
      <header
        className={clsx(
          'sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-shadow duration-200 border-b border-sand-200',
          scrolled ? 'shadow-sm' : ''
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4 flex-nowrap">
            {/* ── LEFT: Logo ── */}
            <Link
              to={user?.role === 'admin' ? '/admin' : '/dashboard'}
              className="flex items-center gap-2 transition-opacity hover:opacity-90 shrink-0"
              aria-label="ilm essentials LMS Home"
            >
              <img src={logo} alt="ilm essentials" className="h-7 sm:h-8 w-auto object-contain" />
            </Link>

            {/* ── CENTER: Student Nav Links ── */}
            <nav className="hidden md:flex items-center gap-6 shrink-0" aria-label="Main Navigation">
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>

              {/* My Courses dropdown */}
              <div ref={coursesRef} className="relative">
                <button
                  onClick={() => setCoursesOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-ink-700 hover:text-primary-800 transition-colors"
                  aria-expanded={coursesOpen}
                  aria-haspopup="true"
                >
                  My Courses
                  <ChevronDown
                    size={14}
                    className={clsx(
                      'text-ink-400 transition-transform duration-200',
                      coursesOpen && 'rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence>
                  {coursesOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-white border border-sand-200 shadow-elevated overflow-hidden"
                    >
                      <div className="py-1">
                        {courseSubLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setCoursesOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-ink-700 hover:bg-primary-50 hover:text-primary-800 transition-colors"
                          >
                            <link.icon size={18} className="text-primary-600" />
                            {link.label}
                          </Link>
                        ))}
                        <div className="border-t border-sand-200 mt-1 pt-1">
                          <NavLink
                            to="/courses"
                            onClick={() => setCoursesOpen(false)}
                            className="block px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                            end
                          >
                            View All Courses →
                          </NavLink>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NavLink to="/schedule" className={navLinkClass}>
                Timetable
              </NavLink>

              <NavLink to="/library" className={navLinkClass}>
                e-Library
              </NavLink>

              <NavLink to="/accounts" className={navLinkClass}>
                Accounts
              </NavLink>
            </nav>

            {/* ── RIGHT: Student Actions ── */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Notification bell */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative p-2 rounded-lg text-ink-600 hover:bg-sand-100 hover:text-primary-700 transition-colors cursor-pointer"
                  aria-label={`Notifications — ${unreadCount} unread`}
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white border border-sand-200 shadow-elevated overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-sand-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-ink-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        {notificationList.length > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleMarkAllRead}
                              className="text-xs text-primary-700 hover:text-primary-900 font-medium cursor-pointer"
                            >
                              Mark read
                            </button>
                            <span className="text-sand-300">•</span>
                            <button
                              type="button"
                              onClick={handleClearAll}
                              className="text-xs text-ink-400 hover:text-red-600 font-medium cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      {notificationList.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <Bell size={22} className="mx-auto text-sand-300 mb-2 opacity-60" />
                          <p className="font-semibold text-xs text-ink-700">No notifications</p>
                          <p className="text-[11px] text-ink-400 mt-0.5">You're all caught up!</p>
                        </div>
                      ) : (
                        <ul className="max-h-80 overflow-y-auto divide-y divide-sand-100">
                          {notificationList.map((n) => (
                            <li
                              key={n.id}
                              onClick={() => {
                                markNotificationAsRead(n.id);
                                if (n.link) {
                                  navigate(n.link);
                                  setNotifOpen(false);
                                } else if (n.courseId) {
                                  navigate(`/course/${n.courseId}`);
                                  setNotifOpen(false);
                                }
                              }}
                              className={clsx(
                                'px-4 py-3 text-sm transition-colors hover:bg-sand-50 cursor-pointer',
                                !n.read && 'bg-primary-50/40'
                              )}
                            >
                              <div className="flex items-start gap-2.5">
                              {n.type === 'new_lesson' ? (
                                <span className="flex-shrink-0 mt-0.5 p-1 rounded-md bg-emerald-100 text-emerald-800">
                                  <BookOpen size={13} />
                                </span>
                              ) : n.type === 'live_class' || n.meetingLink ? (
                                <span className="flex-shrink-0 mt-0.5 p-1 rounded-md bg-emerald-100 text-emerald-800">
                                  <Video size={13} />
                                </span>
                              ) : null}
                              <div className="flex-1 min-w-0">
                                <p className={clsx('text-ink-800 text-xs leading-relaxed', !n.read && 'font-medium')}>
                                  {n.message}
                                </p>
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="text-[11px] text-ink-400">{n.time}</span>
                                  {n.type === 'new_lesson' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900">
                                      Start Learning →
                                    </span>
                                  )}
                                  {n.meetingLink && (
                                    <a
                                      href={n.meetingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition-colors"
                                    >
                                      <Video size={11} />
                                      Join Class
                                      <ExternalLink size={10} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Student avatar / profile dropdown */}
              {isAuthenticated && user?.role === 'student' ? (
                <div ref={userRef} className="relative hidden md:block">
                  <button
                    onClick={() => setUserOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-sand-100 transition-colors cursor-pointer"
                    aria-expanded={userOpen}
                    aria-haspopup="true"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-900 text-white text-xs font-bold ring-2 ring-primary-100">
                      {getInitials(user?.name)}
                    </span>
                    <ChevronDown
                      size={14}
                      className={clsx(
                        'text-ink-500 transition-transform duration-200',
                        userOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-white border border-sand-200 shadow-elevated overflow-hidden"
                      >
                        {/* Student info header */}
                        <div className="px-4 py-3 border-b border-sand-200 bg-sand-50/50">
                          <p className="text-sm font-bold text-ink-900 truncate">{user?.name}</p>
                          <p className="text-xs text-ink-500 mt-0.5 truncate">{user?.email}</p>
                        </div>

                        <div className="py-1">
                          <Link
                            to="/dashboard"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-sand-100 transition-colors"
                          >
                            <BookOpen size={16} /> Student Hub
                          </Link>

                          <Link
                            to="/courses"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-sand-100 transition-colors"
                          >
                            <GraduationCap size={16} /> My Enrollments
                          </Link>

                          <Link
                            to="/library"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-sand-100 transition-colors"
                          >
                            <Library size={16} /> e-Library
                          </Link>

                          <Link
                            to="/accounts"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-sand-100 transition-colors"
                          >
                            <CreditCard size={16} /> Fee &amp; Accounts
                          </Link>

                          <div className="border-t border-sand-200 my-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <LogOut size={16} /> Log Out
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : isAuthenticated && user?.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-gold-300 text-xs font-bold border border-gold-500/40 shadow-xs transition-colors"
                >
                  Admin Portal
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-900 hover:bg-primary-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <LogIn size={14} />
                  Sign In
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-lg text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
            />

            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl md:hidden flex flex-col"
            >
              <div className="flex h-16 items-center justify-between px-5 border-b border-sand-200">
                <img src={logo} alt="ilm essentials" className="h-6 sm:h-7 w-auto object-contain" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-ink-500 hover:bg-sand-100 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <nav className="space-y-1">
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-primary-50 text-primary-900 font-semibold' : 'text-ink-700 hover:bg-sand-100'
                      )
                    }
                  >
                    <BookOpen size={16} />
                    Dashboard
                  </NavLink>

                  <NavLink
                    to="/courses"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-primary-50 text-primary-900 font-semibold' : 'text-ink-700 hover:bg-sand-100'
                      )
                    }
                  >
                    <GraduationCap size={16} />
                    My Courses
                  </NavLink>

                  <NavLink
                    to="/schedule"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-primary-50 text-primary-900 font-semibold' : 'text-ink-700 hover:bg-sand-100'
                      )
                    }
                  >
                    <Calendar size={16} />
                    Timetable
                  </NavLink>

                  <NavLink
                    to="/library"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-primary-50 text-primary-900 font-semibold' : 'text-ink-700 hover:bg-sand-100'
                      )
                    }
                  >
                    <Library size={16} />
                    e-Library
                  </NavLink>

                  <NavLink
                    to="/accounts"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-primary-50 text-primary-900 font-semibold' : 'text-ink-700 hover:bg-sand-100'
                      )
                    }
                  >
                    <CreditCard size={16} />
                    Accounts
                  </NavLink>
                </nav>
              </div>

              {/* Drawer footer */}
              <div className="p-4 border-t border-sand-200 bg-sand-50">
                {isAuthenticated && user?.role === 'student' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-900 text-white text-xs font-bold">
                        {getInitials(user?.name)}
                      </span>
                      <div className="truncate max-w-[150px]">
                        <p className="text-xs font-bold text-ink-900 truncate">{user?.name}</p>
                        <p className="text-[11px] text-ink-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Log Out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-primary-900 text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <LogIn size={15} />
                    Student Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
