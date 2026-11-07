/**
 * Dashboard — Main Student Dashboard page
 *
 * Composes all dashboard sub-components into a cohesive layout:
 * - WelcomeSection (full width hero)
 * - QuickStats (4 stat cards)
 * - ProgressOverview (Continue Learning)
 * - Two-column split: CourseCategories (left) + UpcomingSchedule (right sidebar)
 *
 * Features:
 * - Loading state with skeleton placeholders (simulated 1.5s delay)
 * - Smooth page entrance animation with framer-motion
 * - Wrapped in the Layout component
 *
 * @module pages/Dashboard
 * TODO: Replace simulated loading with actual API loading state
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import Skeleton from '../components/ui/Skeleton';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import QuickStats from '../components/dashboard/QuickStats';
import ProgressOverview from '../components/dashboard/ProgressOverview';
import UpcomingSchedule from '../components/dashboard/UpcomingSchedule';
import PendingAssignments from '../components/dashboard/PendingAssignments';

/** Loading skeleton for the WelcomeSection */
function WelcomeSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-4 w-48 bg-white/10" />
          <Skeleton className="h-10 w-72 bg-white/10" />
          <Skeleton className="h-4 w-40 bg-white/10" />
          <Skeleton className="h-8 w-32 rounded-full bg-white/10" />
        </div>
        <Skeleton className="h-28 w-full lg:max-w-md rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

/** Loading skeleton for QuickStats */
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white p-5 shadow-card">
          <div className="flex items-start justify-between">
            <Skeleton className="h-11 w-11 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-8 w-16" />
          <Skeleton className="mt-2 h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

/** Loading skeleton for the main courses section */
function BottomSkeleton() {
  return (
    <div className="space-y-6">
      {/* Live class banner skeleton */}
      <Skeleton className="h-12 w-full rounded-2xl" />

      {/* Courses header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-9 w-56 rounded-xl" />
      </div>

      {/* 3-column courses grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-2xs border border-sand-200">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full mb-4" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Page entrance animation variants */
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  /** Brief transition for smooth component mounting */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      {isLoading ? (
        <div className="space-y-8 animate-fade-in">
          <WelcomeSkeleton />
          <StatsSkeleton />
          <BottomSkeleton />
        </div>
      ) : (
        <motion.div
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Hero welcome banner */}
          <motion.div variants={sectionVariants}>
            <WelcomeSection />
          </motion.div>

          {/* Quick stat cards */}
          <motion.div variants={sectionVariants}>
            <QuickStats />
          </motion.div>

          {/* Collapsible Live Class / Schedule Alert Strip */}
          <motion.div variants={sectionVariants}>
            <UpcomingSchedule />
          </motion.div>

          {/* Full-width My Courses (with Program Tabs) */}
          <motion.div variants={sectionVariants}>
            <ProgressOverview />
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
}
