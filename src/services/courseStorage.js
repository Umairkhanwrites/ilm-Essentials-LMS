/**
 * courseStorage — Centralized Course Persistence Service
 *
 * Persists administrator-created courses in localStorage while falling
 * back gracefully to default mock catalog data.
 */

import {
  adminAllCourses,
  courseDetail,
  enrolledCourses,
  adminStudentsList,
  adminInstructorsList,
  adminFeeRecords,
} from '../data/mockData';

const STORAGE_KEY_COURSES = 'ilm_admin_courses';
const STORAGE_KEY_DETAILS = 'ilm_course_details_map';
const STORAGE_KEY_STUDENTS = 'ilm_admin_students';
const STORAGE_KEY_ENROLLMENTS = 'ilm_course_enrollments_map';
const STORAGE_KEY_INSTRUCTORS = 'ilm_admin_instructors';
const STORAGE_KEY_FEES = 'ilm_student_fees';
const STORAGE_KEY_DISCUSSIONS = 'ilm_course_discussions_map';

/**
 * Generate a memorable, secure temporary password for students
 */
export function generateTemporaryPassword() {
  const words = ['Ilm', 'Noor', 'Hikmah', 'Sabr', 'Taqwa', 'Barakah', 'Ihsan'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const chars = '!@#$%&*';
  const char = chars[Math.floor(Math.random() * chars.length)];
  return `${word}${char}${num}`;
}

/**
 * Initialize and get all students from storage
 */
export function getAllStudents() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load students from localStorage:', err);
  }
  return adminStudentsList;
}

/**
 * Save or add a new student to storage (handles create and edit)
 */
export function saveStudent(studentData) {
  const current = getAllStudents();
  const id = studentData.id || `std_${Date.now()}`;
  const existing = current.find((s) => s.id === id);

  const defaultPassword = studentData.password || (existing?.password ?? generateTemporaryPassword());
  const mustChangePassword = studentData.mustChangePassword !== undefined
    ? studentData.mustChangePassword
    : (existing?.mustChangePassword ?? true);

  const record = {
    ...existing,
    ...studentData,
    id,
    password: defaultPassword,
    mustChangePassword,
    progress: studentData.progress ?? (existing?.progress ?? 0),
    attendance: studentData.attendance || (existing?.attendance ?? '100%'),
    feeStatus: studentData.feeStatus || (existing?.feeStatus ?? 'Paid'),
    enrolledDate: studentData.enrolledDate || (existing?.enrolledDate ?? new Date().toISOString().split('T')[0]),
  };

  const exists = Boolean(existing);
  const updated = exists ? current.map((s) => (s.id === id ? record : s)) : [record, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save student to localStorage:', err);
  }
  return record;
}

/**
 * Update student password and reset mustChangePassword flag
 */
export function updateStudentPassword(studentId, newPassword) {
  const current = getAllStudents();
  const updated = current.map((s) => {
    if (s.id === studentId || s.email.toLowerCase() === studentId.toLowerCase()) {
      return {
        ...s,
        password: newPassword,
        mustChangePassword: false,
      };
    }
    return s;
  });
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update student password in localStorage:', err);
  }
  return updated;
}

/**
 * Delete a student from storage
 */
export function deleteStudent(id) {
  const current = getAllStudents();
  const updated = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete student from localStorage:', err);
  }
  return updated;
}

/**
 * Get all instructors from storage
 */
export function getAllInstructors() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_INSTRUCTORS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load instructors from localStorage:', err);
  }
  return adminInstructorsList;
}

/**
 * Save or edit an instructor
 */
export function saveInstructor(instructorData) {
  const current = getAllInstructors();
  const id = instructorData.id || `inst_${Date.now()}`;
  const existing = current.find((i) => i.id === id);

  const record = {
    ...existing,
    ...instructorData,
    id,
    status: instructorData.status || 'Active',
    joinedDate: instructorData.joinedDate || (existing?.joinedDate ?? new Date().toISOString().split('T')[0]),
    avatar: instructorData.avatar || (existing?.avatar ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'),
    assignedCourses: Array.isArray(instructorData.assignedCourses)
      ? instructorData.assignedCourses
      : (existing?.assignedCourses || []),
  };

  const exists = Boolean(existing);
  const updated = exists ? current.map((i) => (i.id === id ? record : i)) : [record, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_INSTRUCTORS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save instructor to localStorage:', err);
  }
  return record;
}

/**
 * Delete an instructor
 */
export function deleteInstructor(id) {
  const current = getAllInstructors();
  const updated = current.filter((i) => i.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_INSTRUCTORS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete instructor from localStorage:', err);
  }
  return updated;
}

/**
 * Get all student fee records
 */
export function getFeeRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FEES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load fee records from localStorage:', err);
  }
  return adminFeeRecords;
}

/**
 * Save / Create or Update a student fee record
 */
export function saveFeeRecord(feeData) {
  const current = getFeeRecords();
  const id = feeData.id || `fee_${Date.now()}`;
  const existing = current.find((f) => f.id === id);

  const totalAmount = Number(feeData.totalAmount) || 30000;
  const paidAmount = Number(feeData.paidAmount) || 0;
  const balance = Math.max(0, totalAmount - paidAmount);

  let calculatedStatus = feeData.status;
  if (!calculatedStatus) {
    if (balance === 0) calculatedStatus = 'Paid';
    else if (paidAmount > 0) calculatedStatus = 'Partial';
    else calculatedStatus = 'Pending';
  }

  const record = {
    ...existing,
    ...feeData,
    id,
    invoiceNo: feeData.invoiceNo || (existing?.invoiceNo ?? `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`),
    totalAmount,
    paidAmount,
    balance,
    status: calculatedStatus,
    dueDate: feeData.dueDate || (existing?.dueDate ?? '2026-03-31'),
  };

  const exists = Boolean(existing);
  const updated = exists ? current.map((f) => (f.id === id ? record : f)) : [record, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save fee record to localStorage:', err);
  }
  return record;
}

/**
 * Record a payment against a fee record
 */
export function recordFeePayment(feeId, paymentData) {
  const current = getFeeRecords();
  const record = current.find((f) => f.id === feeId);
  if (!record) return null;

  const newPayment = Number(paymentData.amount) || 0;
  const newPaidAmount = record.paidAmount + newPayment;
  const newBalance = Math.max(0, record.totalAmount - newPaidAmount);

  const newStatus = newBalance === 0 ? 'Paid' : 'Partial';

  const updatedRecord = {
    ...record,
    paidAmount: newPaidAmount,
    balance: newBalance,
    status: newStatus,
    paidDate: paymentData.paidDate || new Date().toISOString().split('T')[0],
    paymentMethod: paymentData.paymentMethod || 'Bank Transfer',
    transactionRef: paymentData.transactionRef || `TRX-${Date.now().toString().slice(-6)}`,
    notes: paymentData.notes
      ? `${record.notes ? record.notes + ' | ' : ''}${paymentData.notes}`
      : record.notes,
  };

  const updated = current.map((f) => (f.id === feeId ? updatedRecord : f));
  try {
    localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(updated));

    // Also sync with student record's feeStatus
    if (record.studentId) {
      saveStudent({
        id: record.studentId,
        feeStatus: newStatus,
      });
    }
  } catch (err) {
    console.error('Failed to record fee payment:', err);
  }
  return updatedRecord;
}

/**
 * Update fee record status
 */
export function updateFeeStatus(feeId, newStatus) {
  const current = getFeeRecords();
  const updated = current.map((f) => {
    if (f.id === feeId) {
      const isPaid = newStatus === 'Paid' || newStatus === 'Waived';
      return {
        ...f,
        status: newStatus,
        paidAmount: isPaid ? f.totalAmount : f.paidAmount,
        balance: isPaid ? 0 : f.totalAmount - f.paidAmount,
      };
    }
    return f;
  });
  try {
    localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update fee status:', err);
  }
  return updated;
}

/**
 * Get Community Discussions for a specific course
 */
export function getCourseDiscussions(courseId) {
  try {
    const rawMap = localStorage.getItem(STORAGE_KEY_DISCUSSIONS);
    if (rawMap) {
      const map = JSON.parse(rawMap);
      if (Array.isArray(map[courseId])) {
        return map[courseId];
      }
    }
  } catch (err) {
    console.error('Failed to load discussions from localStorage:', err);
  }

  // Fallback to courseDetail discussions or default seed
  const defaultDiscussions = courseDetail.discussions || [
    {
      id: 'thread-default-1',
      author: 'Ahmad Raza',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      content: "Could the instructor elaborate on the difference between Asbab al-Nuzul (occasions of revelation) and the general universal ruling derived from a verse?",
      upvotes: 8,
      replies: [
        {
          id: 'reply-default-1',
          author: 'Ustadh Khalil Ahmad',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          isInstructor: true,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          content: "The classical rule states: 'The lesson is in the generality of the wording, not the specificity of the cause' (Al-'Ibrah bi 'umum al-lafdh la bi khusus al-sabab). We will review classical examples in Module 2.",
          upvotes: 12,
        },
      ],
    },
  ];
  return defaultDiscussions;
}

/**
 * Add a new top-level discussion thread to a course
 */
export function saveCourseDiscussion(courseId, newThread) {
  const currentDiscussions = getCourseDiscussions(courseId);
  const updated = [newThread, ...currentDiscussions];
  try {
    const rawMap = localStorage.getItem(STORAGE_KEY_DISCUSSIONS);
    const map = rawMap ? JSON.parse(rawMap) : {};
    map[courseId] = updated;
    localStorage.setItem(STORAGE_KEY_DISCUSSIONS, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save course discussion:', err);
  }
  return updated;
}

/**
 * Add a reply to an existing discussion thread
 */
export function addDiscussionReply(courseId, threadId, reply) {
  const currentDiscussions = getCourseDiscussions(courseId);
  const updated = currentDiscussions.map((thread) => {
    if (thread.id === threadId) {
      return {
        ...thread,
        replies: [...(thread.replies || []), reply],
      };
    }
    return thread;
  });
  try {
    const rawMap = localStorage.getItem(STORAGE_KEY_DISCUSSIONS);
    const map = rawMap ? JSON.parse(rawMap) : {};
    map[courseId] = updated;
    localStorage.setItem(STORAGE_KEY_DISCUSSIONS, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to add discussion reply:', err);
  }
  return updated;
}

/**
 * Retrieve enrolled student IDs for a specific course
 */
export function getCourseEnrolledStudentIds(courseId, category) {
  try {
    const rawMap = localStorage.getItem(STORAGE_KEY_ENROLLMENTS);
    if (rawMap) {
      const map = JSON.parse(rawMap);
      if (Array.isArray(map[courseId])) {
        return map[courseId];
      }
    }
  } catch (err) {
    console.error('Failed to get course enrollments:', err);
  }

  // Check if course has enrolledStudentIds saved on the course object itself
  const allCourses = getAllCourses();
  const match = allCourses.find((c) => c.id === courseId);
  if (match && Array.isArray(match.enrolledStudentIds)) {
    return match.enrolledStudentIds;
  }

  // Institutional default: If course is in Foundations, default to all Foundations students
  if (category === 'foundations' || match?.category === 'foundations') {
    return getAllStudents()
      .filter((s) => s.program.includes('Foundations'))
      .map((s) => s.id);
  }

  return [];
}

/**
 * Update enrolled students for a specific course
 */
export function updateCourseEnrollment(courseId, studentIds) {
  try {
    const rawMap = localStorage.getItem(STORAGE_KEY_ENROLLMENTS);
    const map = rawMap ? JSON.parse(rawMap) : {};
    map[courseId] = studentIds;
    localStorage.setItem(STORAGE_KEY_ENROLLMENTS, JSON.stringify(map));

    // Update course enrolledCount in courses list
    const allCourses = getAllCourses();
    const updatedCourses = allCourses.map((c) => {
      if (c.id === courseId) {
        return {
          ...c,
          enrolledCount: studentIds.length,
          enrolledStudentIds: studentIds,
        };
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(updatedCourses));
    return updatedCourses;
  } catch (err) {
    console.error('Failed to update course enrollments:', err);
  }
}

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
 * Save / Create / Update a course
 * @param {Object} courseData
 * @returns {Object} saved course
 */
export function saveCourse(courseData) {
  const currentCourses = getAllCourses();
  
  const courseId = courseData.id || `crs_${Date.now()}`;
  const isFoundations = courseData.category === 'foundations';
  
  const allStudents = getAllStudents();
  const defaultFoundationsIds = allStudents
    .filter((s) => s.program.includes('Foundations'))
    .map((s) => s.id);

  const enrolledStudentIds = Array.isArray(courseData.enrolledStudentIds)
    ? courseData.enrolledStudentIds
    : (isFoundations ? defaultFoundationsIds : []);

  const enrolledCount = enrolledStudentIds.length > 0
    ? enrolledStudentIds.length
    : (courseData.enrolledCount || (isFoundations ? defaultFoundationsIds.length : 0));

  // Format for admin table & catalog
  const newCourseRecord = {
    id: courseId,
    title: courseData.title,
    subtitle: courseData.subtitle || '',
    category: courseData.category || 'foundations',
    instructor: typeof courseData.instructor === 'object' ? courseData.instructor.name : (courseData.instructor || 'Ustadh Khalil Ahmad'),
    format: courseData.format || 'live-online',
    // Rule: Program students enrolled
    enrolledStudentIds,
    enrolledCount,
    capacity: Number(courseData.capacity) || (isFoundations ? 150 : 100),
    // Rule: Foundations courses are bundled in the main 8-month certificate program
    fee: isFoundations
      ? 'Included in Ilm Foundations Program'
      : (courseData.fee?.startsWith('PKR') ? courseData.fee : `PKR ${courseData.fee || '30,000'}`),
    status: courseData.status || 'Active',
    // Delivery Class Category: 'online' | 'onsite' | 'hybrid' (Online & Onsite)
    classCategory: courseData.classCategory || (courseData.format === 'on-site' ? 'onsite' : (courseData.format === 'hybrid' ? 'hybrid' : 'online')),
    meetingLink: courseData.meetingLink || '',
    meetingPlatform: courseData.meetingPlatform || 'Google Meet',
    venue: courseData.venue || (courseData.classCategory === 'online' ? 'Live Online' : 'Ilm Essentials Campus, DHA Phase 6, Lahore'),
    startDate: courseData.startDate || new Date().toISOString().split('T')[0],
    endDate: courseData.endDate || '',
    duration: courseData.duration || '8 Weeks',
    level: courseData.level || 'Beginner',
    schedule: courseData.schedule || 'Tuesdays & Thursdays, 6:00 PM – 8:30 PM PKT',
    thumbnail: courseData.thumbnail || null,
    color: courseData.color || '#0B4A3F',
    resources: courseData.resources || [],
  };

  const isExisting = currentCourses.some((c) => c.id === courseId);
  const updatedCourses = isExisting
    ? currentCourses.map((c) => (c.id === courseId ? newCourseRecord : c))
    : [newCourseRecord, ...currentCourses];

  try {
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(updatedCourses));
    const rawMap = localStorage.getItem(STORAGE_KEY_ENROLLMENTS);
    const enrollMap = rawMap ? JSON.parse(rawMap) : {};
    enrollMap[courseId] = enrolledStudentIds;
    localStorage.setItem(STORAGE_KEY_ENROLLMENTS, JSON.stringify(enrollMap));
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
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            completed: false,
          },
          {
            id: `les_${Date.now()}_2`,
            title: 'Syllabus & Core Texts Reading',
            type: 'reading',
            duration: '20 min',
            content: 'Comprehensive reading overview of classical foundational texts.',
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
      ...match,
      id: match.id,
      title: match.title,
      subtitle: match.subtitle || courseDetail.subtitle,
      category: match.category,
      format: match.format,
      classCategory: match.classCategory,
      meetingLink: match.meetingLink,
      meetingPlatform: match.meetingPlatform,
      venue: match.venue,
      startDate: match.startDate,
      endDate: match.endDate,
      duration: match.duration,
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
