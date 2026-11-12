/**
 * CourseView — Individual Course Interface (Learning Environment)
 *
 * Provides a responsive media player, collapsible syllabus
 * sidebar (CurriculumSidebar), course header, and tabbed panels for:
 * 1. Overview (Course description, instructor bio, objectives)
 * 2. Resources (Downloadable slides, notes, e-Library link)
 * 3. Community (Threaded Q&A forum with instructor badges)
 *
 * @module pages/CourseView
 * TODO: Fetch course by ID from backend API using useParams()
 * TODO: Save user progress & active lesson to backend on change
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  FileText,
  MessageSquare,
  ListOrdered,
  ChevronRight,
  Target,
  Info,
  CheckCircle,
  Video,
  ExternalLink,
  Lock,
} from 'lucide-react';

import Layout from '../components/layout/Layout';
import CourseHeader from '../components/course/CourseHeader';
import MediaPlayer from '../components/course/MediaPlayer';
import CurriculumSidebar from '../components/course/CurriculumSidebar';
import ResourceTab from '../components/course/ResourceTab';
import CommunityTab from '../components/course/CommunityTab';
import Tabs from '../components/ui/Tabs';
import Skeleton from '../components/ui/Skeleton';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';

import { courseDetail as defaultCourseDetail, courseFormats, enrolledCourses } from '../data/mockData';
import { getCourseDetailById, saveCourseDetail, updateCourseProgress, getStudentVideoRestriction } from '../services/courseStorage';
import { useAuth } from '../context/AuthContext';

export default function CourseView() {
  const { user } = useAuth();
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
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch course details by id from storage or fallback
  const initialCourse = useMemo(() => {
    if (id) {
      return getCourseDetailById(id);
    }
    return defaultCourseDetail;
  }, [id]);

  const [course, setCourse] = useState(initialCourse);

  useEffect(() => {
    setCourse(initialCourse);
  }, [initialCourse]);

  const formatMeta = courseFormats[course.format] || courseFormats['live-online'];

  // Flatten lessons to find the default current lesson
  const allLessons = useMemo(() => {
    return course.modules.flatMap((m) => m.lessons);
  }, [course]);

  const defaultLesson = useMemo(() => {
    return (
      allLessons.find((l) => l.current) ||
      allLessons.find((l) => !l.completed) ||
      allLessons[0]
    );
  }, [allLessons]);

  const [currentLesson, setCurrentLesson] = useState(defaultLesson);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const queryLessonId = searchParams.get('lessonId');

  // If a specific lesson was requested via query param (e.g. from notification), activate it
  useEffect(() => {
    if (queryLessonId && allLessons.length > 0) {
      const match = allLessons.find((l) => l.id === queryLessonId);
      if (match) {
        setCurrentLesson(match);
      }
    }
  }, [queryLessonId, allLessons]);

  // Keep currentLesson synchronized with course changes
  useEffect(() => {
    if (currentLesson) {
      const updated = allLessons.find((l) => l.id === currentLesson.id);
      if (updated) {
        setCurrentLesson(updated);
      }
    }
  }, [allLessons]);

  // Simulate initial course loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [id]);

  // Handle lesson selection from syllabus (accepts ID or lesson object)
  const handleLessonSelect = useCallback(
    (lessonOrId) => {
      const lessonId = typeof lessonOrId === 'object' && lessonOrId ? lessonOrId.id : lessonOrId;
      const selected = allLessons.find((l) => l.id === lessonId);
      if (selected) {
        setCurrentLesson(selected);
      }
    },
    [allLessons]
  );

  // Interactive toggle for lesson completion
  const handleToggleLessonCompletion = useCallback((lessonId) => {
    if (!lessonId) return;
    setCourse((prevCourse) => {
      let isNowCompleted = false;
      const updatedModules = prevCourse.modules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((lesson) => {
          if (lesson.id === lessonId) {
            isNowCompleted = !lesson.completed;
            return { ...lesson, completed: isNowCompleted };
          }
          return lesson;
        }),
      }));

      const totalLessons = updatedModules.flatMap((m) => m.lessons).length;
      const completedLessons = updatedModules
        .flatMap((m) => m.lessons)
        .filter((l) => l.completed).length;
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      setCurrentLesson((prev) =>
        prev && prev.id === lessonId ? { ...prev, completed: isNowCompleted } : prev
      );

      const updatedCourseObj = {
        ...prevCourse,
        modules: updatedModules,
        completedLessons,
        progress,
      };

      // Persist to storage so dashboard & curriculum stay permanently synchronized
      saveCourseDetail(prevCourse.id, updatedCourseObj);
      updateCourseProgress(prevCourse.id, completedLessons, totalLessons, progress);

      return updatedCourseObj;
    });
  }, []);

  // Add discussion thread to active course state
  const handleAddDiscussion = useCallback((newThread) => {
    setCourse((prevCourse) => ({
      ...prevCourse,
      discussions: [newThread, ...(prevCourse.discussions || [])],
    }));
  }, []);

  // Tabs setup
  const tabItems = useMemo(
    () => [
      {
        label: 'Overview',
        icon: <Info className="w-4 h-4" />,
      },
      {
        label: 'Resources',
        icon: <FileText className="w-4 h-4" />,
        count: course.resources?.length || 0,
      },
    ],
    [course]
  );

  if (isLoading) {
    return (
      <Layout fullWidth>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-3/4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth>
      {/* ── Administrator Preview Mode Bar ── */}
      {user?.role === 'admin' && (
        <div className="bg-[#0B3324] text-sand-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-gold-600/30 sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
            <span className="font-bold text-gold-300 tracking-wide uppercase text-[11px]">Administrator Preview Mode</span>
            <span className="text-sand-300 hidden md:inline">
              — You are viewing this course room and curriculum player as students see it.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/courses/edit/${course.id}`}
              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-gold-200 border border-gold-500/30 font-medium transition-colors"
            >
              Edit Course
            </Link>
            <Link
              to="/admin"
              className="text-xs px-3 py-1 rounded-lg bg-gold-500 hover:bg-gold-400 text-primary-950 font-bold transition-all shadow-sm flex items-center gap-1"
            >
              <span>← Return to Admin</span>
            </Link>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-sand-50 pb-16">
        {/* Top Header Banner */}
        <div className="bg-white border-b border-sand-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <CourseHeader
              course={course}
              formatMeta={formatMeta}
              onBack={() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard')}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 transition-all duration-300 space-y-4">
          {restriction.isVideoRestricted && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white border border-red-500/40 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-800/80 border border-red-500/50 flex items-center justify-center shrink-0 text-red-200">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-heading">Course Video Playback Blocked</h4>
                  <p className="text-xs text-red-200">
                    Your video lecture access is currently restricted due to overdue fee installments. Pay your overdue dues to automatically restore access.
                  </p>
                </div>
              </div>
              <Link
                to="/accounts"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-xs"
              >
                <span>View Accounts &amp; Pay Dues →</span>
              </Link>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Curriculum Sidebar (handles both desktop sticky sidebar & mobile drawer) */}
            <CurriculumSidebar
              modules={course.modules}
              totalLessons={course.totalLessons}
              completedLessons={course.completedLessons}
              progress={course.progress}
              activeLessonId={currentLesson?.id}
              onLessonSelect={(id) => {
                handleLessonSelect(id);
                setIsMobileDrawerOpen(false);
              }}
              onToggleLessonCompletion={handleToggleLessonCompletion}
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
              isMobileOpen={isMobileDrawerOpen}
              onMobileClose={() => setIsMobileDrawerOpen(false)}
            />

            {/* Right: Media Player & Content Panels */}
            <div className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6">
              {/* Media Player */}
              <div className="bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-elevated">
                <MediaPlayer
                  currentLesson={currentLesson}
                  isLive={false}
                />
              </div>

              {/* Lesson Info Pill */}
              <div className="bg-white rounded-xl border border-sand-200 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-heading font-semibold text-ink-900 leading-snug">
                    {currentLesson?.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-sand-100">
                  {/* Quick Mobile Curriculum Drawer Button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-50 text-primary-900 border border-primary-200 text-xs font-semibold hover:bg-primary-100 transition-colors cursor-pointer"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-primary-700" />
                    <span>Curriculum</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary-200/70 text-[10px] text-primary-950 font-bold">
                      {course.completedLessons}/{course.totalLessons}
                    </span>
                  </button>

                  <button
                    onClick={() => handleToggleLessonCompletion(currentLesson?.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      currentLesson?.completed
                        ? 'bg-primary-600 text-white hover:bg-primary-700 ring-2 ring-primary-500/20'
                        : 'bg-sand-100 hover:bg-primary-50 text-ink-700 hover:text-primary-800 border border-sand-300'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${currentLesson?.completed ? 'text-gold-300' : 'text-primary-600'}`} />
                    {currentLesson?.completed ? 'Completed' : 'Mark as Completed'}
                  </button>
                </div>
              </div>

              {/* Tabbed Content Sections: Overview, Resources, Community */}
              <div className="bg-white rounded-2xl border border-sand-200 shadow-soft p-4 sm:p-6">
                <Tabs tabs={tabItems} defaultIndex={0}>
                  {/* Tab 1: Overview */}
                  <div className="space-y-6 pt-2">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-ink-900 mb-3">
                        About this Course
                      </h3>
                      <p className="text-ink-600 leading-relaxed text-sm sm:text-base">
                        {course.description}
                      </p>
                    </div>

                    {/* What you'll learn */}
                    <div className="p-5 rounded-xl bg-sand-50 border border-sand-200">
                      <h4 className="font-heading text-base font-bold text-ink-900 mb-3">
                        Learning Outcomes
                      </h4>
                      {Array.isArray(course.learningOutcomes) && course.learningOutcomes.length > 0 ? (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm text-ink-700">
                          {course.learningOutcomes.map((outcome, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary-600 font-bold mt-0.5 shrink-0">✓</span>
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm text-ink-700">
                          <li className="flex items-start gap-2">
                            <span className="text-primary-600 font-bold mt-0.5">✓</span>
                            <span>Understand traditional Asbab al-Nuzul (contexts of revelation)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary-600 font-bold mt-0.5">✓</span>
                            <span>Learn linguistic nuances of classical Qur'anic vocabulary</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary-600 font-bold mt-0.5">✓</span>
                            <span>Extract timeless principles for modern ethical decision-making</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary-600 font-bold mt-0.5">✓</span>
                            <span>Harmonize classical foundations with contemporary scholarship</span>
                          </li>
                        </ul>
                      )}
                    </div>

                    {/* Instructor Bio */}
                    <div className="pt-4 border-t border-sand-200">
                      <h4 className="font-heading text-base font-bold text-ink-900 mb-3">
                        Your Instructor
                      </h4>
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-sand-50/60 border border-sand-200">
                        <Avatar
                          name={course.instructor.name}
                          src={course.instructor.avatar}
                          size="lg"
                          className="shrink-0"
                        />
                        <div className="space-y-1">
                          <h5 className="font-heading font-semibold text-ink-900 text-base">
                            {course.instructor.name}
                          </h5>
                          <p className="text-xs text-primary-700 font-medium">
                            {course.instructor.title}
                          </p>
                          <p className="text-xs text-ink-600 leading-relaxed pt-1">
                            {course.instructor.bio}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tab 2: Resources */}
                  <div className="pt-2">
                    <ResourceTab resources={course.resources} />
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
