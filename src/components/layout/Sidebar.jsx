/**
 * Sidebar — Responsive collapsible sidebar for the Ilm Essentials LMS dashboard
 *
 * Features:
 * - Desktop: collapsible (expanded ↔ icon-only) with smooth animation
 * - Mobile: slide-out drawer with overlay backdrop
 * - Navigation items with icons and active state (left-border accent)
 * - Bottom user info mini-card
 *
 * TODO: Persist collapsed state in localStorage or user preferences
 * TODO: Connect user data from auth context
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
} from 'lucide-react';

import { currentUser } from '../../data/mockData';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/** Returns user initials from full name */
function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Navigation items */
const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'My Courses', icon: BookOpen },
  { to: '/library', label: 'e-Library', icon: Library },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/settings', label: 'Settings', icon: Settings },
];

/** Framer-motion variants for mobile drawer */
const drawerVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '-100%', transition: { duration: 0.25, ease: 'easeIn' } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/**
 * Sidebar component
 *
 * @param {object} props
 * @param {boolean} [props.mobileOpen=false] - Whether mobile drawer is open (controlled by parent)
 * @param {function} [props.onMobileClose] - Callback to close mobile drawer
 */
export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  /**
   * Shared nav link component for both desktop and mobile
   * @param {boolean} isExpanded - Whether labels are visible
   */
  const renderNavItems = (isExpanded) =>
    navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/dashboard'}
        onClick={!isDesktop ? onMobileClose : undefined}
        className={({ isActive }) =>
          clsx(
            'group relative flex items-center gap-3 rounded-lg transition-all duration-200',
            isExpanded ? 'px-3 py-2.5' : 'justify-center p-2.5',
            isActive
              ? 'bg-primary-50 text-primary-900 font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-[3px] before:rounded-r-full before:bg-primary-700'
              : 'text-ink-600 hover:bg-sand-100 hover:text-ink-900'
          )
        }
        title={!isExpanded ? item.label : undefined}
      >
        <item.icon size={20} className="flex-shrink-0" />
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="text-sm whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </NavLink>
    ));

  /** User mini-card at the bottom */
  const renderUserCard = (isExpanded) => (
    <div
      className={clsx(
        'border-t border-sand-200 p-3',
        !isExpanded && 'flex justify-center'
      )}
    >
      <div className={clsx('flex items-center', isExpanded ? 'gap-3' : 'justify-center')}>
        {currentUser.avatar ? (
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-primary-200 flex-shrink-0"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-white text-xs font-bold ring-2 ring-primary-200 flex-shrink-0">
            {getInitials(currentUser.name)}
          </span>
        )}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <p className="text-sm font-medium text-ink-900 truncate">{currentUser.name}</p>
            <p className="text-xs text-ink-500 truncate">{currentUser.email}</p>
          </motion.div>
        )}
      </div>
    </div>
  );

  // ── DESKTOP SIDEBAR ──
  if (isDesktop) {
    return (
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-sand-200 flex flex-col z-30 overflow-hidden"
      >
        {/* Collapse toggle */}
        <div className={clsx('flex items-center p-3', collapsed ? 'justify-center' : 'justify-end')}>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="p-1.5 rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-700 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          {renderNavItems(!collapsed)}
        </nav>

        {/* User mini-card */}
        {renderUserCard(!collapsed)}
      </motion.aside>
    );
  }

  // ── MOBILE DRAWER ──
  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={onMobileClose}
            />

            {/* Drawer */}
            <motion.aside
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-elevated flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-sand-200">
                <span className="font-heading text-sm font-bold text-primary-900">Menu</span>
                <button
                  onClick={onMobileClose}
                  className="p-2 rounded-lg text-ink-600 hover:bg-sand-100 transition-colors"
                  aria-label="Close sidebar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {renderNavItems(true)}
              </nav>

              {/* User mini-card */}
              {renderUserCard(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * SidebarTrigger — Mobile-only button to open the sidebar drawer.
 * Place this inside your dashboard layout.
 *
 * @param {object} props
 * @param {function} props.onClick - Callback to open mobile sidebar
 */
export function SidebarTrigger({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed bottom-4 left-4 z-30 flex items-center justify-center h-12 w-12 rounded-full bg-primary-700 text-white shadow-elevated hover:bg-primary-800 active:scale-95 transition-all"
      aria-label="Open sidebar"
    >
      <Menu size={22} />
    </button>
  );
}
