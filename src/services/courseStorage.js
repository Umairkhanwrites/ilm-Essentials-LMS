/**
 * courseStorage — Centralized Course Persistence Service
 *
 * Persists administrator-created courses in localStorage while falling
 * back gracefully to default mock catalog data.
 */

import { adminAllCourses, courseDetail, enrolledCourses } from '../data/mockData';

const STORAGE_KEY_COURSES = 'ilm_admin_courses';
const STORAGE_KEY_DETAILS = 'ilm_course_details_map';

/**
 * Initialize and get all courses for admin and catalog
 */
export function getAllCourses() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_COURSES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load courses from localStorage:', err);
  }
  // Default to mock courses
  return adminAllCourses;
}

/**
 * Save / Create a new course
 * @param {Object} courseData
 * @returns {Object} saved course
 */
export function saveCourse(courseData) {
  const currentCourses = getAllCourses();
  
  const courseId = courseData.id || `crs_${Date.now()}`;
  
  // Format for admin table & catalog
  const newCourseRecord = {
    id: courseId,
    title: courseData.title,
    subtitle: courseData.subtitle || '',
    category: courseData.category || 'foundations',
    instructor: typeof courseData.instructor === 'object' ? courseData.instructor.name : (courseData.instructor || 'Ustadh Khalil Ahmad'),
    format: courseData.format || 'live-online',
    enrolledCount: courseData.enrolledCount || 0,
    capacity: Number(courseData.capacity) || 100,
    fee: courseData.fee?.startsWith('PKR') ? courseData.fee : `PKR ${courseData.fee || '30,000'}`,
    status: courseData.status || 'Active',
    startDate: courseData.startDate || new Date().toISOString().split('T')[0],
    level: courseData.level || 'Beginner',
    duration: courseData.duration || '8 Months',
    schedule: courseData.schedule || 'Tuesdays & Thursdays, 6:00 PM – 8:30 PM PKT',
    thumbnail: courseData.thumbnail || null,
    color: courseData.color || '#0B4A3F',
  };

  const updatedCourses = [newCourseRecord, ...currentCourses.filter((c) => c.id !== courseId)];

  try {
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(updatedCourses));
  } catch (err) {
    console.error('Failed to persist course in localStorage:', err);
  }

  // Also persist full syllabus and details for CourseView (/course/:id)
  saveCourseDetail(courseId, {
    ...newCourseRecord,
    description: courseData.description || 'Comprehensive study of classical Islamic sciences with experienced faculty.',
    instructor: typeof courseData.instructor === 'object' ? courseData.instructor : {
      name: courseData.instructor || 'Ustadh Khalil Ahmad',
      title: courseData.instructorTitle || 'Instructor of Islamic Sciences',
      bio: courseData.instructorBio || 'Distinguished graduate with extensive teaching experience in classical curriculum.',
    },
    modules: courseData.modules && courseData.modules.length > 0 ? courseData.modules : [
      {
        id: `mod_${Date.now()}_1`,
        title: 'Module 1: Foundations & Overview',
        expanded: true,
        lessons: [
          {
            id: `les_${Date.now()}_1`,
            title: 'Welcome & Course Orientation',
            type: 'video',
            duration: '35 min',
            completed: false,
          },
          {
            id: `les_${Date.now()}_2`,
            title: 'Syllabus & Core Texts Reading',
            type: 'reading',
            duration: '20 min',
            completed: false,
          },
        ],
      },
    ],
    resources: courseData.resources || [
      {
        id: 'res_default_1',
        title: 'Course Syllabus & Reading Schedule (PDF)',
        type: 'pdf',
        size: '1.8 MB',
      },
    ],
    discussions: [],
    learningObjectives: courseData.learningObjectives || [
      'Master core classical Islamic principles and methodologies',
      'Understand contextual application in modern intellectual contexts',
      'Engage with primary texts under direct scholarly guidance',
    ],
    totalLessons: courseData.modules
      ? courseData.modules.flatMap((m) => m.lessons || []).length
      : 2,
    completedLessons: 0,
    progress: 0,
  });

  return newCourseRecord;
}

/**
 * Persist detailed course curriculum for CourseView
 */
export function saveCourseDetail(id, details) {
  try {
    const rawMap = localStorage.getItem(STORAGE_KEY_DETAILS);
    const map = rawMap ? JSON.parse(rawMap) : {};
    map[id] = details;
    localStorage.setItem(STORAGE_KEY_DETAILS, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save course detail map:', err);
  }
}

/**
 * Retrieve comprehensive course details for /course/:id
 */
export function getCourseDetailById(id) {
  try {
    const rawMap = localStorage.getItem(STORAGE_KEY_DETAILS);
    if (rawMap) {
      const map = JSON.parse(rawMap);
      if (map[id]) {
        return map[id];
      }
    }
  } catch (err) {
    console.error('Failed to get course detail by ID:', err);
  }

  // If matches default courseDetail
  if (id === courseDetail.id) {
    return courseDetail;
  }

  // Look in enrolledCourses or adminAllCourses
  const match = getAllCourses().find((c) => c.id === id);
  if (match) {
    return {
      ...courseDetail,
      id: match.id,
      title: match.title,
      subtitle: match.subtitle || courseDetail.subtitle,
      category: match.category,
      format: match.format,
      instructor: {
        name: match.instructor,
        title: 'Instructor of Islamic Sciences',
        bio: 'Distinguished scholar specialized in classical sciences.',
      },
      fee: match.fee,
      progress: 0,
      completedLessons: 0,
    };
  }

  return courseDetail;
}

/**
 * Delete a course by ID
 */
export function deleteCourse(id) {
  const currentCourses = getAllCourses();
  const updated = currentCourses.filter((c) => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(updated));
    const rawMap = localStorage.getItem(STORAGE_KEY_DETAILS);
    if (rawMap) {
      const map = JSON.parse(rawMap);
      delete map[id];
      localStorage.setItem(STORAGE_KEY_DETAILS, JSON.stringify(map));
    }
  } catch (err) {
    console.error('Failed to delete course from localStorage:', err);
  }
  return updated;
}

/**
 * Update course status (Active / Upcoming / Draft)
 */
export function updateCourseStatus(id, newStatus) {
  const currentCourses = getAllCourses();
  const updated = currentCourses.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
  try {
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update course status:', err);
  }
  return updated;
}
