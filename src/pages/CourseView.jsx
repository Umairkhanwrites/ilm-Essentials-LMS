/**
 * CourseView — Individual Course Interface (Learning Environment)
 *
 * Provides a theater-mode capable media player, collapsible syllabus
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
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  FileText,
  MessageSquare,
  ListOrdered,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle,
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

export default function CourseView() {
  const { id } = useParams();
  const navigate = useNavigate();

  // In real app, fetch courseDetail by id; here we fallback gracefully
  const initialCourse = useMemo(() => {
    if (id && id !== defaultCourseDetail.id) {
      const match = enrolledCourses.find((c) => c.id === id);
      if (match) {
        return {
          ...defaultCourseDetail,
          id: match.id,
          title: match.title,
          instructor: {
            ...defaultCourseDetail.instructor,
            name: match.instructor,
          },
          progress: match.progress,
          totalLessons: match.totalLessons,
          completedLessons: match.completedLessons,
          format: match.format,
          description: match.description,
        };
      }
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
  const [theaterMode, setTheaterMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

      return {
        ...prevCourse,
        modules: updatedModules,
        completedLessons,
        progress,
      };
    });
  }, []);

  // Add discussion thread to active course state
  const handleAddDiscussion = useCallback((newThread) => {
    setCourse((prevCourse) => ({
      ...prevCourse,
      discussions: [newThread, ...(prevCourse.discussions || [])],
    }));
  }, []);

  const toggleTheaterMode = useCallback(() => {
    setTheaterMode((prev) => {
      const next = !prev;
      if (next) {
        setIsSidebarCollapsed(true);
      }
      return next;
    });
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
      {
        label: 'Q&A & Community',
        icon: <MessageSquare className="w-4 h-4" />,
        count: course.discussions?.length || 0,
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
      <div className="min-h-screen bg-sand-50 pb-16">
        {/* Top Header Banner */}
        <div className="bg-white border-b border-sand-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CourseHeader
              course={course}
              formatMeta={formatMeta}
              onBack={() => navigate('/dashboard')}
            />
          </div>
        </div>

        {/* Mobile Curriculum Trigger Button */}
        <div className="lg:hidden sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-sand-200 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm text-ink-700 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
            <span className="truncate">{currentLesson?.title || 'Current Lesson'}</span>
          </div>
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-900 border border-primary-200 text-xs font-semibold hover:bg-primary-100 transition-colors shrink-0"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Curriculum
          </button>
        </div>

        {/* Main Content Area */}
        <div
          className={
            theaterMode
              ? 'w-full px-2 sm:px-4 py-6 transition-all duration-300'
              : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300'
          }
        >
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
              isCollapsed={theaterMode || isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
              isMobileOpen={isMobileDrawerOpen}
              onMobileClose={() => setIsMobileDrawerOpen(false)}
            />

            {/* Right: Media Player & Content Panels */}
            <div className="flex-1 min-w-0 w-full space-y-6">
              {/* Theater Mode Exit Bar (if active) */}
              {theaterMode && (
                <div className="flex items-center justify-between bg-primary-950 text-sand-100 px-4 py-2 rounded-xl text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold-400" />
                    Theater Mode Active — Full Width Experience
                  </span>
                  <button
                    onClick={toggleTheaterMode}
                    className="text-gold-400 hover:text-gold-300 underline font-medium cursor-pointer"
                  >
                    Exit Theater Mode
                  </button>
                </div>
              )}

              {/* Media Player */}
              <div className="bg-black rounded-2xl overflow-hidden shadow-elevated">
                <MediaPlayer
                  currentLesson={currentLesson}
                  isLive={course.format === 'live-online'}
                  theaterMode={theaterMode}
                  onTheaterToggle={toggleTheaterMode}
                />
              </div>

              {/* Lesson Info Pill */}
              <div className="bg-white rounded-xl border border-sand-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                      Current Lesson
                    </span>
                    <span className="text-xs text-ink-500">• {currentLesson?.duration || '45 min'}</span>
                  </div>
                  <h2 className="text-lg font-heading font-semibold text-ink-900">
                    {currentLesson?.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleLessonCompletion(currentLesson?.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      currentLesson?.completed
                        ? 'bg-primary-600 text-white hover:bg-primary-700 ring-2 ring-primary-500/20'
                        : 'bg-sand-100 hover:bg-primary-50 text-ink-700 hover:text-primary-800 border border-sand-300'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${currentLesson?.completed ? 'text-gold-300' : 'text-primary-600'}`} />
                    {currentLesson?.completed ? 'Completed (Click to Undo)' : 'Mark as Completed'}
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
                      <h4 className="font-heading text-base font-bold text-ink-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold-600" />
                        Learning Objectives
                      </h4>
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
                          <span>Harmonize Tafsir bil-Ma'thur with contemporary scholarship</span>
                        </li>
                      </ul>
                    </div>

                    {/* Instructor Bio */}
                    <div className="pt-4 border-t border-sand-200">
                      <h4 className="font-heading text-base font-bold text-ink-900 mb-3">
                        Your Instructor
                      </h4>
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-sand-50/60 border border-sand-200">
                        <Avatar
                          name={course.instructor.name}
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

                  {/* Tab 3: Community & Q&A */}
                  <div className="pt-2">
                    <CommunityTab
                      discussions={course.discussions}
                      onAddDiscussion={handleAddDiscussion}
                    />
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
