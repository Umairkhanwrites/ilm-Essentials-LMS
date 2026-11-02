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
import CourseCategories from '../components/dashboard/CourseCategories';
import UpcomingSchedule from '../components/dashboard/UpcomingSchedule';

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

/** Loading skeleton for ProgressOverview */
function ProgressSkeleton() {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-card border-l-4 border-sand-300">
            <Skeleton className="h-5 w-20 rounded-full mb-3" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-32" />
            <Skeleton className="mt-3 h-2 w-full rounded-full" />
            <Skeleton className="mt-2 h-3 w-24" />
            <Skeleton className="mt-3 h-3 w-36" />
            <div className="mt-4 pt-3 border-t border-sand-200">
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Loading skeleton for the bottom two-column section */
function BottomSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Course categories skeleton */}
      <div className="lg:col-span-2">
        <Skeleton className="h-7 w-32 mb-5" />
        <Skeleton className="h-12 w-full rounded-xl mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-4 shadow-card">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="mt-2 h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
                <div className="w-40">
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule skeleton */}
      <div>
        <Skeleton className="h-7 w-44 mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-4 shadow-card">
              <div className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-2 h-4 w-36" />
                  <Skeleton className="mt-2 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
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

  /** Simulate data loading with a 1.5s delay for demo purposes */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      {isLoading ? (
        <div className="space-y-8 animate-fade-in">
          <WelcomeSkeleton />
          <StatsSkeleton />
          <ProgressSkeleton />
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

          {/* Continue Learning */}
          <motion.div variants={sectionVariants}>
            <ProgressOverview />
          </motion.div>

          {/* Two-column: Courses + Schedule */}
          <motion.div variants={sectionVariants}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Courses — takes 2/3 width on desktop */}
              <div className="lg:col-span-2">
                <CourseCategories />
              </div>

              {/* Schedule sidebar — takes 1/3 width on desktop */}
              <div>
                <UpcomingSchedule />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
}
