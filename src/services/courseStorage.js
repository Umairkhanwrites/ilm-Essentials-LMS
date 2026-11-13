/**
 * courseStorage — Centralized Course Persistence Service
 *
 * Persists administrator-created courses in localStorage while falling
 * back gracefully to default mock catalog data.
 */

import {
  adminAllCourses,
  courseDetail,
  courseDetailsMap,
  enrolledCourses,
  adminStudentsList,
  adminInstructorsList,
  adminFeeRecords,
  initialScheduleSlots,
  initialScheduleNotifications,
  notifications as defaultNotifications,
  DEFAULT_BUNNY_VIDEO_URL,
  dailyQuotes as defaultDailyQuotes,
  initialFeeInstallments,
} from '../data/mockData.js';

const STORAGE_KEY_COURSES = 'ilm_admin_courses';
const STORAGE_KEY_DETAILS = 'ilm_course_details_map';
const STORAGE_KEY_STUDENTS = 'ilm_admin_students';
const STORAGE_KEY_ENROLLMENTS = 'ilm_course_enrollments_map';
const STORAGE_KEY_INSTRUCTORS = 'ilm_admin_instructors';
const STORAGE_KEY_FEES = 'ilm_student_fees';
const STORAGE_KEY_DISCUSSIONS = 'ilm_course_discussions_map';
const STORAGE_KEY_PATHWAYS = 'ilm_academic_pathways';
const STORAGE_KEY_SCHEDULE_SLOTS = 'ilm_schedule_slots';
const STORAGE_KEY_SCHEDULE_NOTIFS = 'ilm_schedule_notifications';
const STORAGE_KEY_ENROLLED_COURSES = 'ilm_enrolled_courses';
const STORAGE_KEY_STUDENT_NOTIFICATIONS = 'ilm_student_notifications';
const STORAGE_KEY_LIBRARY = 'ilm_elibrary_catalog';
const STORAGE_KEY_DAILY_QUOTES = 'ilm_daily_quotes';
const STORAGE_KEY_INSTALLMENTS = 'ilm_fee_installments';
const STORAGE_KEY_ATTENDANCE_SESSIONS = 'ilm_attendance_sessions';

/**
 * Retrieve current student enrolled courses synchronized with live lesson progress
 */
export function getEnrolledCourses() {
  try {
    const rawEnrolled = localStorage.getItem(STORAGE_KEY_ENROLLED_COURSES);
    let baseList = enrolledCourses;
    if (rawEnrolled) {
      const parsed = JSON.parse(rawEnrolled);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseList = parsed;
      }
    }

    // If the student is not enrolled in Ilm Foundations, exclude Foundations courses
    const isFoundations = isStudentEnrolledInFoundations();
    if (!isFoundations) {
      baseList = baseList.filter((c) => c.category !== 'foundations');
    }

    // Merge with authoritative courseDetailsMap and real-time lesson progress stored in STORAGE_KEY_DETAILS
    const rawDetails = localStorage.getItem(STORAGE_KEY_DETAILS);
    const detailsMap = rawDetails ? JSON.parse(rawDetails) : {};

    return baseList.map((c) => {
      // Unify card accent color to official brand forest green
      const uniformColor = '#0B3324';
      const uniformFormat = c.category === 'foundations' ? 'live-online' : (c.format || 'live-online');

      // Check authoritative course definition first to ensure fresh lesson counts (e.g. Lesson 6)
      const official = courseDetailsMap && courseDetailsMap[c.id];
      const officialLessonsCount = official && Array.isArray(official.modules)
        ? official.modules.flatMap((m) => m.lessons || []).length
        : c.totalLessons;

      // 1. Check if course has progress stored in details map (localStorage)
      const detail = detailsMap[c.id];
      if (detail && Array.isArray(detail.modules)) {
        const completed = detail.modules
          .flatMap((m) => m.lessons || [])
          .filter((l) => l.completed).length;
        const total = officialLessonsCount || detail.modules.flatMap((m) => m.lessons || []).length || c.totalLessons;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          ...c,
          color: uniformColor,
          format: uniformFormat,
          completedLessons: completed,
          totalLessons: total,
          progress,
        };
      } else if (
        detail &&
        typeof detail.completedLessons === 'number' &&
        typeof detail.progress === 'number'
      ) {
        const total = officialLessonsCount || detail.totalLessons || c.totalLessons;
        return {
          ...c,
          color: uniformColor,
          format: uniformFormat,
          completedLessons: detail.completedLessons,
          totalLessons: total,
          progress: detail.progress,
        };
      }

      // 2. Check if progress was saved in enrolled courses list (localStorage)
      if (typeof c.completedLessons === 'number' && typeof c.progress === 'number' && rawEnrolled) {
        return {
          ...c,
          color: uniformColor,
          format: uniformFormat,
          totalLessons: officialLessonsCount || c.totalLessons,
        };
      }

      // 3. Fallback to authoritative courseDetailsMap from mockData
      const officialDetail = courseDetailsMap && courseDetailsMap[c.id];
      if (officialDetail && Array.isArray(officialDetail.modules)) {
        const completed = officialDetail.modules
          .flatMap((m) => m.lessons || [])
          .filter((l) => l.completed).length;
        const total = officialDetail.modules.flatMap((m) => m.lessons || []).length || c.totalLessons;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          ...c,
          color: uniformColor,
          format: uniformFormat,
          completedLessons: completed,
          totalLessons: total,
          progress,
        };
      }

      return {
        ...c,
        color: uniformColor,
        format: uniformFormat,
        totalLessons: officialLessonsCount || c.totalLessons,
      };
    });
  } catch (err) {
    console.error('Failed to get enrolled courses:', err);
    return enrolledCourses;
  }
}

/**
 * Update lesson completion progress for an enrolled course
 */
export function updateCourseProgress(courseId, completedLessons, totalLessons, progress) {
  try {
    const currentList = getEnrolledCourses();
    const updatedList = currentList.map((c) => {
      if (c.id === courseId) {
        return {
          ...c,
          completedLessons,
          totalLessons: totalLessons ?? c.totalLessons,
          progress,
        };
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEY_ENROLLED_COURSES, JSON.stringify(updatedList));

    // Also dispatch a custom event so open views/tabs synchronize reactively
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ilm-course-progress-updated', {
        detail: { courseId, completedLessons, totalLessons, progress }
      }));
    }
    return updatedList;
  } catch (err) {
    console.error('Failed to update course progress:', err);
    return enrolledCourses;
  }
}

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
        const officialMap = new Map(adminInstructorsList.map((i) => [(i.name || '').toLowerCase(), i]));
        const updated = parsed.map((inst) => {
          const official = officialMap.get((inst.name || '').toLowerCase());
          if (official && official.avatar && inst.avatar !== official.avatar) {
            return { ...inst, avatar: official.avatar, title: official.title || inst.title, bio: official.bio || inst.bio };
          }
          return inst;
        });

        const existingNames = new Set(updated.map((p) => (p.name || '').toLowerCase()));
        const missing = adminInstructorsList.filter((inst) => !existingNames.has((inst.name || '').toLowerCase()));
        const combined = missing.length > 0 ? [...updated, ...missing] : updated;
        try {
          localStorage.setItem(STORAGE_KEY_INSTRUCTORS, JSON.stringify(combined));
        } catch (e) {}
        return combined;
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
        // Ensure newly added mock records (such as multi-course student records) are included
        const existingIds = new Set(parsed.map((p) => p.id));
        const missingFromStorage = adminFeeRecords.filter((rec) => !existingIds.has(rec.id));
        const combined = [...parsed, ...missingFromStorage];

        return combined.map((f) => {
          const baseFee = Number(f.baseFee) || Number(f.totalAmount) || 30000;
          const discountAmount = Number(f.discountAmount) || 0;
          const netPayable = Number(f.netPayable) || Math.max(0, baseFee - discountAmount);
          const paidAmount = Number(f.paidAmount) || 0;
          const balance = Math.max(0, netPayable - paidAmount);
          return {
            ...f,
            baseFee,
            discountType: f.discountType || 'none',
            discountValue: Number(f.discountValue) || 0,
            discountAmount,
            discountReason: f.discountReason || '',
            discountApprovedBy: f.discountApprovedBy || '',
            netPayable,
            totalAmount: netPayable,
            paidAmount,
            balance,
            paymentPlan: f.paymentPlan || (Array.isArray(f.installments) && f.installments.length > 1 ? `installments_${f.installments.length}` : 'lump_sum'),
            installments: Array.isArray(f.installments) ? f.installments : [],
            paymentHistory: Array.isArray(f.paymentHistory) ? f.paymentHistory : [],
          };
        });
      }
    }
  } catch (err) {
    console.error('Failed to load fee records from localStorage:', err);
  }
  return adminFeeRecords.map((f) => {
    const baseFee = Number(f.baseFee) || Number(f.totalAmount) || 30000;
    const discountAmount = Number(f.discountAmount) || 0;
    const netPayable = Number(f.netPayable) || Math.max(0, baseFee - discountAmount);
    const paidAmount = Number(f.paidAmount) || 0;
    const balance = Math.max(0, netPayable - paidAmount);
    return {
      ...f,
      baseFee,
      discountType: f.discountType || 'none',
      discountValue: Number(f.discountValue) || 0,
      discountAmount,
      discountReason: f.discountReason || '',
      discountApprovedBy: f.discountApprovedBy || '',
      netPayable,
      totalAmount: netPayable,
      paidAmount,
      balance,
      paymentPlan: f.paymentPlan || 'lump_sum',
      installments: Array.isArray(f.installments) ? f.installments : [],
      paymentHistory: Array.isArray(f.paymentHistory) ? f.paymentHistory : [],
    };
  });
}

/**
 * Save / Create or Update a student fee record
 */
export function saveFeeRecord(feeData) {
  const current = getFeeRecords();
  const id = feeData.id || `fee_${Date.now()}`;
  const existing = current.find((f) => f.id === id);

  const baseFee = Number(feeData.baseFee) || Number(existing?.baseFee) || Number(feeData.totalAmount) || 30000;
  const discountType = feeData.discountType || existing?.discountType || 'none';
  const discountValue = Number(feeData.discountValue ?? existing?.discountValue ?? 0);
  let discountAmount = Number(feeData.discountAmount ?? existing?.discountAmount ?? 0);

  if (discountType === 'fixed') {
    discountAmount = Math.min(baseFee, discountValue);
  } else if (discountType === 'percentage') {
    discountAmount = Math.round((baseFee * Math.min(100, Math.max(0, discountValue))) / 100);
  } else if (discountType === 'waiver') {
    discountAmount = baseFee;
  }

  const netPayable = Math.max(0, baseFee - discountAmount);
  const paidAmount = Number(feeData.paidAmount ?? existing?.paidAmount ?? 0);
  const balance = Math.max(0, netPayable - paidAmount);

  let calculatedStatus = feeData.status || existing?.status;
  if (!calculatedStatus || calculatedStatus === 'Pending' || calculatedStatus === 'Paid' || calculatedStatus === 'Partial') {
    if (discountType === 'waiver' || balance === 0) calculatedStatus = discountType === 'waiver' ? 'Waived' : 'Paid';
    else if (paidAmount > 0) calculatedStatus = 'Partial';
    else calculatedStatus = 'Pending';
  }

  const record = {
    ...existing,
    ...feeData,
    id,
    invoiceNo: feeData.invoiceNo || (existing?.invoiceNo ?? `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`),
    baseFee,
    discountType,
    discountValue,
    discountAmount,
    discountReason: feeData.discountReason || existing?.discountReason || '',
    discountApprovedBy: feeData.discountApprovedBy || existing?.discountApprovedBy || '',
    netPayable,
    totalAmount: netPayable,
    paidAmount,
    balance,
    status: calculatedStatus,
    dueDate: feeData.dueDate || (existing?.dueDate ?? '2026-03-31'),
    paymentPlan: feeData.paymentPlan || existing?.paymentPlan || 'lump_sum',
    installments: Array.isArray(feeData.installments) ? feeData.installments : (existing?.installments || []),
    paymentHistory: Array.isArray(feeData.paymentHistory) ? feeData.paymentHistory : (existing?.paymentHistory || []),
  };

  const exists = Boolean(existing);
  const updated = exists ? current.map((f) => (f.id === id ? record : f)) : [record, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(updated));
    if (record.studentId) {
      saveStudent({
        id: record.studentId,
        feeStatus: calculatedStatus === 'Waived' ? 'Paid' : calculatedStatus,
      });
    }
  } catch (err) {
    console.error('Failed to save fee record to localStorage:', err);
  }
  return record;
}

/**
 * Apply a Discount or Scholarship to a Student's Fee
 */
export function applyFeeDiscount(feeId, discountData) {
  const current = getFeeRecords();
  const record = current.find((f) => f.id === feeId);
  if (!record) return null;

  const baseFee = Number(record.baseFee) || Number(record.totalAmount) || 30000;
  const discountType = discountData.discountType || 'none';
  const discountValue = Number(discountData.discountValue) || 0;
  let discountAmount = 0;

  if (discountType === 'fixed') {
    discountAmount = Math.min(baseFee, discountValue);
  } else if (discountType === 'percentage') {
    discountAmount = Math.round((baseFee * Math.min(100, Math.max(0, discountValue))) / 100);
  } else if (discountType === 'waiver') {
    discountAmount = baseFee;
  }

  const netPayable = Math.max(0, baseFee - discountAmount);
  const paidAmount = Number(record.paidAmount) || 0;
  const newBalance = Math.max(0, netPayable - paidAmount);

  let newStatus = record.status;
  if (discountType === 'waiver' || newBalance === 0) {
    newStatus = discountType === 'waiver' ? 'Waived' : 'Paid';
  } else if (paidAmount > 0) {
    newStatus = 'Partial';
  } else {
    newStatus = 'Pending';
  }

  // If installments exist, proportionally recalculate remaining amounts
  let updatedInstallments = record.installments || [];
  if (Array.isArray(updatedInstallments) && updatedInstallments.length > 0) {
    const count = updatedInstallments.length;
    const perPart = Math.floor(netPayable / count);
    const remainder = netPayable - perPart * count;
    let runningPaid = paidAmount;

    updatedInstallments = updatedInstallments.map((inst, idx) => {
      const partAmt = idx === count - 1 ? perPart + remainder : perPart;
      const isInstPaid = runningPaid >= partAmt;
      if (isInstPaid) {
        runningPaid -= partAmt;
      }
      return {
        ...inst,
        amount: partAmt,
        status: isInstPaid ? 'Paid' : inst.status === 'Paid' ? 'Paid' : 'Pending',
      };
    });
  }

  const updatedRecord = {
    ...record,
    baseFee,
    discountType,
    discountValue,
    discountAmount,
    discountReason: discountData.discountReason || '',
    discountApprovedBy: discountData.approvedBy || 'Administrator',
    netPayable,
    totalAmount: netPayable,
    balance: newBalance,
    status: newStatus,
    installments: updatedInstallments,
  };

  const updated = current.map((f) => (f.id === feeId ? updatedRecord : f));
  try {
    localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(updated));
    if (record.studentId) {
      saveStudent({ id: record.studentId, feeStatus: newStatus === 'Waived' ? 'Paid' : newStatus });
    }
  } catch (err) {
    console.error('Failed to apply fee discount:', err);
  }
  return updatedRecord;
}

/**
 * Configure Installment Plan for a Semester Fee Record (supports 2 to 6+ installments)
 */
export function configureInstallmentPlan(feeId, planData) {
  const current = getFeeRecords();
  const record = current.find((f) => f.id === feeId);
  if (!record) return null;

  const netPayable = Number(record.netPayable) || Number(record.totalAmount) || 30000;
  const count = Number(planData.installmentCount) || 1;
  const paymentPlan = count > 1 ? `installments_${count}` : 'lump_sum';

  let installments = [];
  if (count <= 1 || paymentPlan === 'lump_sum') {
    installments = [];
  } else if (Array.isArray(planData.customInstallments) && planData.customInstallments.length === count) {
    installments = planData.customInstallments;
  } else {
    // Generate equal parts spaced by ~30 days
    const basePart = Math.floor(netPayable / count);
    const remainder = netPayable - basePart * count;
    const today = new Date();
    let runningPaid = Number(record.paidAmount) || 0;

    installments = Array.from({ length: count }, (_, idx) => {
      const partAmt = idx === count - 1 ? basePart + remainder : basePart;
      const dueDateObj = new Date(today.getTime() + idx * 30 * 24 * 60 * 60 * 1000);
      const isPaid = runningPaid >= partAmt;
      if (isPaid) {
        runningPaid -= partAmt;
      }

      return {
        id: `inst_${idx + 1}_${Date.now()}`,
        installmentNumber: idx + 1,
        title: `Installment ${idx + 1} of ${count} (${idx === 0 ? 'Admission' : `Month ${idx + 1}`})`,
        amount: partAmt,
        dueDate: dueDateObj.toISOString().split('T')[0],
        status: isPaid ? 'Paid' : 'Pending',
        paidDate: isPaid ? (record.paidDate || today.toISOString().split('T')[0]) : null,
        paymentMethod: isPaid ? record.paymentMethod : null,
        transactionRef: isPaid ? record.transactionRef : null,
      };
    });
  }

  const updatedRecord = {
    ...record,
    paymentPlan,
    installments,
  };

  const updated = current.map((f) => (f.id === feeId ? updatedRecord : f));
  try {
    localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to configure installment plan:', err);
  }
  return updatedRecord;
}

/**
 * Record a payment against a fee record (supports paying installments)
 */
export function recordFeePayment(feeId, paymentData) {
  const current = getFeeRecords();
  const record = current.find((f) => f.id === feeId);
  if (!record) return null;

  const newPayment = Number(paymentData.amount) || 0;
  const currentPaid = Number(record.paidAmount) || 0;
  const netPayable = Number(record.netPayable) || Number(record.totalAmount) || 30000;
  const newPaidAmount = currentPaid + newPayment;
  const newBalance = Math.max(0, netPayable - newPaidAmount);

  const newStatus = newBalance === 0 ? 'Paid' : 'Partial';
  const paymentDate = paymentData.paidDate || new Date().toISOString().split('T')[0];
  const paymentMethod = paymentData.paymentMethod || 'Bank Transfer (Meezan Bank)';
  const transactionRef = paymentData.transactionRef || `TRX-${Date.now().toString().slice(-6)}`;

  // Update installments if plan is active
  let updatedInstallments = record.installments || [];
  if (Array.isArray(updatedInstallments) && updatedInstallments.length > 0) {
    if (paymentData.installmentId) {
      // Mark specific target installment as paid
      updatedInstallments = updatedInstallments.map((inst) =>
        inst.id === paymentData.installmentId
          ? {
              ...inst,
              status: 'Paid',
              paidDate: paymentDate,
              paidAmount: inst.amount,
              paymentMethod,
              transactionRef,
            }
          : inst
      );
    } else {
      // Distribute payment sequentially across pending installments
      let remainingToApply = newPayment;
      updatedInstallments = updatedInstallments.map((inst) => {
        if (inst.status !== 'Paid' && remainingToApply >= inst.amount) {
          remainingToApply -= inst.amount;
          return {
            ...inst,
            status: 'Paid',
            paidDate: paymentDate,
            paidAmount: inst.amount,
            paymentMethod,
            transactionRef,
          };
        }
        return inst;
      });
    }
  }

  const paymentEntry = {
    id: `pay_${Date.now()}`,
    date: paymentDate,
    amount: newPayment,
    method: paymentMethod,
    transactionRef,
    notes: paymentData.notes || '',
    installmentId: paymentData.installmentId || null,
  };

  const updatedRecord = {
    ...record,
    paidAmount: newPaidAmount,
    balance: newBalance,
    status: newStatus,
    paidDate: paymentDate,
    paymentMethod,
    transactionRef,
    installments: updatedInstallments,
    paymentHistory: [paymentEntry, ...(record.paymentHistory || [])],
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
 * Record a combined payment across multiple student fee records (same transaction ID)
 */
export function recordMultiFeePayment(paymentsArray) {
  if (!Array.isArray(paymentsArray)) return [];
  const results = [];
  for (const item of paymentsArray) {
    if (item.feeId && Number(item.amount) > 0) {
      const res = recordFeePayment(item.feeId, item);
      if (res) results.push(res);
    }
  }
  return results;
}

/**
 * Void or reverse a previously recorded fee payment entry
 */
export function voidFeePayment(feeId, paymentEntryId) {
  const current = getFeeRecords();
  const record = current.find((f) => f.id === feeId);
  if (!record) return null;

  const history = Array.isArray(record.paymentHistory) ? record.paymentHistory : [];
  const entryToVoid = history.find((p) => p.id === paymentEntryId);
  if (!entryToVoid) return record;

  const voidedAmount = Number(entryToVoid.amount) || 0;
  const currentPaid = Number(record.paidAmount) || 0;
  const newPaidAmount = Math.max(0, currentPaid - voidedAmount);
  const netPayable = Number(record.netPayable) || Number(record.totalAmount) || 30000;
  const newBalance = Math.max(0, netPayable - newPaidAmount);

  let newStatus = 'Pending';
  if (newBalance === 0 && netPayable > 0) newStatus = 'Paid';
  else if (newPaidAmount > 0) newStatus = 'Partial';

  // Revert targeted installment if applicable
  let updatedInstallments = record.installments || [];
  if (entryToVoid.installmentId && Array.isArray(updatedInstallments)) {
    updatedInstallments = updatedInstallments.map((inst) => {
      if (inst.id === entryToVoid.installmentId) {
        return {
          ...inst,
          status: 'Pending',
          paidDate: null,
          paidAmount: 0,
          paymentMethod: null,
          transactionRef: null,
        };
      }
      return inst;
    });
  }

  const updatedHistory = history.filter((p) => p.id !== paymentEntryId);

  const updatedRecord = {
    ...record,
    paidAmount: newPaidAmount,
    balance: newBalance,
    status: newStatus,
    installments: updatedInstallments,
    paymentHistory: updatedHistory,
  };

  const updated = current.map((f) => (f.id === feeId ? updatedRecord : f));
  try {
    localStorage.setItem(STORAGE_KEY_FEES, JSON.stringify(updated));
    if (record.studentId) {
      saveStudent({
        id: record.studentId,
        feeStatus: newStatus,
      });
    }
  } catch (err) {
    console.error('Failed to void fee payment:', err);
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
      .filter((s) => s.program && s.program.includes('Foundations'))
      .map((s) => s.id);
  }

  // If intensive course, match students enrolled via program name, selectedCourses, or existing session logs
  if (match) {
    const titleLower = (match.title || '').toLowerCase();
    const students = getAllStudents();
    const enrolled = students
      .filter((s) => {
        const progLower = (s.program || '').toLowerCase();
        const hasSelected = Array.isArray(s.selectedCourses) && s.selectedCourses.some((c) => (c || '').toLowerCase().includes(titleLower) || titleLower.includes((c || '').toLowerCase()));
        return (progLower.includes('prophetic') && titleLower.includes('prophetic')) || (progLower.length > 3 && titleLower.includes(progLower)) || hasSelected;
      })
      .map((s) => s.id);
    if (enrolled.length > 0) return enrolled;
  }

  // Also check if any attendance sessions exist with recorded students for this course
  try {
    const rawSessions = localStorage.getItem(STORAGE_KEY_ATTENDANCE_SESSIONS);
    const sessionsList = rawSessions ? JSON.parse(rawSessions) : INITIAL_ATTENDANCE_SESSIONS;
    const courseSessions = (sessionsList || []).filter((s) => s.courseId === courseId);
    if (courseSessions.length > 0) {
      const studentIdSet = new Set();
      courseSessions.forEach((sess) => {
        if (sess.records) {
          Object.keys(sess.records).forEach((id) => studentIdSet.add(id));
        }
      });
      if (studentIdSet.size > 0) {
        return Array.from(studentIdSet);
      }
    }
  } catch (e) {}

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
        // Clean out removed courses (like Purification of the Heart) and update Tahir Mahmood to Muhammad Ali
        const cleaned = parsed
          .filter((c) => c.id !== 'crs_201' && !c.title?.toLowerCase().includes('purification of the heart'))
          .map((c) => {
            let item = c.instructor === 'Dr. Tahir Mahmood' ? { ...c, instructor: 'Muhammad Ali' } : c;
            if (item.fee === 'Included in Ilm Foundations Program') {
              item = { ...item, fee: 'Ilm Foundations' };
            }
            if (!item.semester && item.category === 'foundations') {
              item = { ...item, semester: 'Semester 1' };
            }
            return item;
          });

        // Check if real foundations courses are present
        const hasFoundations = cleaned.some((c) => c.id && c.id.startsWith('crs_found_'));
        if (hasFoundations) {
          return cleaned;
        }
        // Upgrade legacy cache to include real Semester 1 courses
        const existingIds = new Set(cleaned.map((c) => c.id));
        const missingNew = adminAllCourses.filter((c) => !existingIds.has(c.id));
        const combined = [...adminAllCourses, ...cleaned.filter((c) => !c.id.startsWith('crs_10') && !c.id.startsWith('crs_adm_0'))];
        try {
          localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(combined));
        } catch (e) {}
        return combined;
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
      ? 'Ilm Foundations'
      : (courseData.fee?.startsWith('PKR') ? courseData.fee : `PKR ${courseData.fee || '30,000'}`),
    semester: courseData.semester || (isFoundations ? 'Semester 1' : undefined),
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

  // Detect newly added lessons to trigger automated notifications for enrolled students
  try {
    const existingDetail = getCourseDetailById(courseId);
    if (existingDetail && Array.isArray(existingDetail.modules) && Array.isArray(courseData.modules)) {
      const existingLessonIds = new Set(
        existingDetail.modules.flatMap((m) => (m.lessons || []).map((l) => l.id))
      );
      const incomingLessons = courseData.modules.flatMap((m) => m.lessons || []);
      const newLessons = incomingLessons.filter(
        (l) => l && l.title && l.id && !existingLessonIds.has(l.id)
      );

      for (const nl of newLessons) {
        notifyEnrolledStudentsNewLesson({
          courseId,
          courseTitle: courseData.title || existingDetail.title,
          lessonTitle: nl.title,
          lessonId: nl.id,
        });
      }
    }
  } catch (diffErr) {
    console.error('Failed to diff lessons for notification:', diffErr);
  }

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
            videoUrl: DEFAULT_BUNNY_VIDEO_URL,
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
 * Normalizes video URLs (Bunny.net Stream, YouTube, Vimeo, direct MP4) into proper embed URLs.
 * Handles:
 *  - Full HTML iframe snippets: <iframe src="..."></iframe>
 *  - Bunny.net direct player links: https://player.mediadelivery.net/play/800132/...
 *  - Bunny.net embed links: https://player.mediadelivery.net/embed/800132/...
 *  - YouTube & Vimeo URLs
 */
export function getEmbedVideoUrl(url) {
  if (!url) return '';
  let trimmed = url.trim();

  // If user pasted a full HTML <iframe> snippet (like from Bunny.net dashboard embed tab)
  const iframeMatch = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (iframeMatch) {
    trimmed = iframeMatch[1];
  }

  // Bunny.net Stream (mediadelivery.net): supports /play/ or /embed/ with player.mediadelivery.net or iframe.mediadelivery.net
  const bunnyMatch = trimmed.match(/(?:player|iframe)\.mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)(\?[^"'\s]*)?/i);
  if (bunnyMatch) {
    const libId = bunnyMatch[1];
    const vidId = bunnyMatch[2];
    const query = bunnyMatch[3] || '?autoplay=true&loop=false&muted=true&preload=true&responsive=true';
    return `https://player.mediadelivery.net/embed/${libId}/${vidId}${query}`;
  }

  // YouTube
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return trimmed;
}

// Authoritative duration mapping directly derived from video stream metadata
const AUTHORITATIVE_DURATIONS_BY_URL = {
  'https://player.mediadelivery.net/embed/800731/c3d6d829-bb31-4f3f-99cb-924efa490899': '57 min',
  'https://player.mediadelivery.net/embed/800731/ca59b96c-6465-4d14-94d5-ba0b5a7d8da3': '1 hr',
  'https://player.mediadelivery.net/embed/800731/f94dbdec-8399-4015-9b36-fd37fd4e6444': '1 hr 1 min',
  'https://player.mediadelivery.net/embed/800731/ee9e4a09-511f-4a81-9407-d80242f94698': '56 min',
  'https://player.mediadelivery.net/embed/800731/c5317c5d-b614-4f04-ab8c-5dff0fcb423a': '1 hr',
  'https://player.mediadelivery.net/embed/800731/bdadf7b5-947d-47cb-b3e5-f2cbc1d5ea29': '54 min',
  'https://player.mediadelivery.net/embed/800731/2a2261bc-2af4-4e69-8b85-50097d00053d': '1 hr 1 min',
  'https://player.mediadelivery.net/embed/800731/9ec090d3-19df-4a43-a913-a703af03ffe6': '1 hr 9 min',
  'https://player.mediadelivery.net/embed/800731/ee233e49-23ba-43e3-8594-3fc604b509b4': '1 hr 2 min',
  'https://player.mediadelivery.net/embed/800731/17cb87c6-c341-4ad4-abbd-b066f22dbab9': '1 hr 1 min',
  'https://player.mediadelivery.net/embed/800731/76d20e6d-23b1-4b05-9c05-62c33b2c6921': '1 hr 3 min',
  'https://player.mediadelivery.net/embed/800731/d6a5ce82-517e-42eb-a627-961902ebbbde': '52 min',
  'https://player.mediadelivery.net/embed/800731/dce8819f-66ab-4617-91d4-eaacad26226b': '56 min',
  'https://player.mediadelivery.net/embed/800731/faa69855-bcf8-473d-a871-ab42f8048d86': '1 hr 12 min',
  'https://player.mediadelivery.net/embed/800731/b9712a0d-84e0-4e01-a29f-7a4acb821938': '1 hr',
  'https://player.mediadelivery.net/embed/800731/c474f7a9-f1ab-492c-ad6a-3b3cb1e6a23d': '1 hr 6 min',
  'https://player.mediadelivery.net/embed/800731/72357d78-ac79-4979-b681-fc2c93f5761e': '1 hr 1 min',
  'https://player.mediadelivery.net/embed/800731/90d6568c-a4be-49e6-8ab4-19cc665b669d': '59 min',
  'https://player.mediadelivery.net/embed/800731/58fdc5f5-a771-472c-8c31-2cc1f8846d5a': '1 hr 2 min',
  'https://player.mediadelivery.net/embed/800731/39526efc-e304-44a6-8bba-5b547a90e9d4': '1 hr 18 min',
  'https://player.mediadelivery.net/embed/800731/512583d5-2bbb-4862-9bdd-1947e10dbf4b': '57 min',
  'https://player.mediadelivery.net/embed/800132/a958d9df-cdaf-4316-9ef1-d61fd774bb11': '3 hr 15 min',
};

/**
 * Ensures any lesson with type 'video' has an active streaming URL and accurate actual duration
 */
function ensureLessonVideoUrls(course) {
  if (!course || !Array.isArray(course.modules)) return course;
  return {
    ...course,
    modules: course.modules.map((mod) => ({
      ...mod,
      lessons: Array.isArray(mod.lessons)
        ? mod.lessons.map((les) => {
            const videoUrl = (les.type === 'video' && !les.videoUrl) ? DEFAULT_BUNNY_VIDEO_URL : les.videoUrl;
            const cleanUrl = videoUrl ? videoUrl.split('?')[0] : '';
            const authoritativeDuration =
              AUTHORITATIVE_DURATIONS_BY_URL[cleanUrl] ||
              AUTHORITATIVE_DURATIONS_BY_URL[videoUrl];

            const duration = authoritativeDuration || (les.duration && les.duration !== '45 min' ? les.duration : authoritativeDuration || les.duration || '60 min');

            return {
              ...les,
              videoUrl,
              duration,
            };
          })
        : [],
    })),
  };
}

function sanitizeCourseSubtitle(courseObj) {
  if (!courseObj) return courseObj;
  if (typeof courseObj.subtitle === 'string') {
    const cleaned = courseObj.subtitle
      .replace(/\s*—\s*Semester\s*\d+/gi, '')
      .replace(/Semester\s*\d+\s*—\s*/gi, '')
      .replace(/revealed\s*Text/gi, 'Quran')
      .replace(/Law\s*through\s*Sunnah\s*Study/gi, '')
      .replace(/through\s*Sunnah\s*Study/gi, '')
      .replace(/\s*&\s*Juzz\s*29\s*Reflections/gi, '')
      .replace(/\s*&\s*Surah\s*Reflections/gi, '')
      .replace(/Aqeedah\s*/gi, '')
      .trim();
    return { ...courseObj, subtitle: cleaned };
  }
  return courseObj;
}

/**
 * Retrieve comprehensive course details for /course/:id
 */
export function getCourseDetailById(id) {
  // Check authoritative courseDetailsMap first for official Semester 1 courses
  if (courseDetailsMap && courseDetailsMap[id]) {
    const officialCourse = courseDetailsMap[id];
    const completedLessonIds = new Set();

    try {
      const rawMap = localStorage.getItem(STORAGE_KEY_DETAILS);
      if (rawMap) {
        const map = JSON.parse(rawMap);
        if (map[id] && Array.isArray(map[id].modules)) {
          map[id].modules.forEach((mod) => {
            (mod.lessons || []).forEach((les) => {
              if (les.completed) completedLessonIds.add(les.id);
            });
          });
        }
      }
    } catch (e) {}

    // Synchronize authoritative modules & lesson links, preserving student completion checkmarks
    const freshModules = (officialCourse.modules || []).map((mod) => {
      const lessons = (mod.lessons || []).map((les) => ({
        ...les,
        completed: completedLessonIds.has(les.id),
      }));
      return {
        ...mod,
        title: `Module 1: Available Recorded Lectures (${lessons.length} Lessons)`,
        lessons,
      };
    });

    const totalCount = freshModules.flatMap((m) => m.lessons || []).length || officialCourse.totalLessons || 3;
    const completedCount = freshModules.flatMap((m) => m.lessons || []).filter((l) => l.completed).length;
    const calculatedProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const mergedDetail = sanitizeCourseSubtitle(ensureLessonVideoUrls({
      ...officialCourse,
      modules: freshModules,
      totalLessons: totalCount,
      completedLessons: completedCount,
      progress: calculatedProgress,
    }));

    // Auto-sync upgraded course detail back to cache to resolve any stale 2-lesson storage
    try {
      const rawMap = localStorage.getItem(STORAGE_KEY_DETAILS);
      const map = rawMap ? JSON.parse(rawMap) : {};
      map[id] = mergedDetail;
      localStorage.setItem(STORAGE_KEY_DETAILS, JSON.stringify(map));
    } catch (e) {}

    return mergedDetail;
  }

  try {
    const rawMap = localStorage.getItem(STORAGE_KEY_DETAILS);
    if (rawMap) {
      const map = JSON.parse(rawMap);
      if (map[id] && map[id].modules && map[id].modules.length > 0) {
        return sanitizeCourseSubtitle(ensureLessonVideoUrls(map[id]));
      }
    }
  } catch (err) {
    console.error('Failed to get course detail by ID:', err);
  }

  // Check authoritative courseDetailsMap
  if (courseDetailsMap && courseDetailsMap[id]) {
    return sanitizeCourseSubtitle(ensureLessonVideoUrls(courseDetailsMap[id]));
  }

  // If matches default courseDetail
  if (id === courseDetail?.id) {
    return sanitizeCourseSubtitle(ensureLessonVideoUrls(courseDetail));
  }

  // Look in enrolledCourses or adminAllCourses
  const match = getAllCourses().find((c) => c.id === id);
  if (match) {
    // If match title corresponds to an entry in courseDetailsMap
    const detailMatch = courseDetailsMap && Object.values(courseDetailsMap).find(d => d.title.toLowerCase() === match.title.toLowerCase());
    if (detailMatch && detailMatch.id !== id) {
      return getCourseDetailById(detailMatch.id);
    }
    if (detailMatch) {
      return sanitizeCourseSubtitle(ensureLessonVideoUrls({
        ...detailMatch,
        ...match,
        id: match.id,
      }));
    }

    return ensureLessonVideoUrls({
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
    });
  }

  return ensureLessonVideoUrls(courseDetail);
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


/**
 * Default Seed Academic Pathways
 */
export const DEFAULT_ACADEMIC_PATHWAYS = [
  {
    id: 'foundations',
    slug: 'foundations',
    name: 'Ilm Foundations',
    subtitle: '8-Month Flagship Certificate Programme',
    description: 'Flagship foundational curriculum across 2 structured semesters covering Tafsir, Hadith, Fiqh, and Arabic. Individual courses maintain their own schedule duration and tuition fees.',
    programStructure: 'multi_semester', // 'multi_semester' | 'course_group' | 'single_course'
    type: 'cohort',
    duration: '2 Semesters (Duration varies by course)',
    semesters: 2,
    semesterNames: ['Semester 1', 'Semester 2'],
    tuitionModel: 'varies_by_course',
    defaultTuitionFee: 30000,
    color: 'emerald',
    icon: 'GraduationCap',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  {
    id: 'intensives',
    slug: 'intensives',
    name: 'Ilm Intensives',
    subtitle: 'Weekend Masterclasses & Short Courses Collection',
    description: 'Non-semester modular program. Houses multiple individual standalone courses and masterclasses on Tazkiyah, Seerah, and Contemporary Fiqh where fees and durations vary per course.',
    programStructure: 'course_group',
    type: 'modular',
    duration: 'Duration varies by course',
    semesters: 0,
    semesterNames: [],
    tuitionModel: 'varies_by_course',
    defaultTuitionFee: 12000,
    color: 'gold',
    icon: 'Zap',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  {
    id: 'electives',
    slug: 'electives',
    name: 'Electives & Classical Languages',
    subtitle: 'Specialized Grammar, Nahw & Sarf Electives',
    description: 'Non-semester language collection exploring classical Arabic morphology, syntax, and literary rhetoric with course-specific durations and fees.',
    programStructure: 'course_group',
    type: 'modular',
    duration: 'Duration varies by course',
    semesters: 0,
    semesterNames: [],
    tuitionModel: 'varies_by_course',
    defaultTuitionFee: 15000,
    color: 'purple',
    icon: 'BookOpen',
    status: 'Active',
    createdAt: '2026-01-01',
  },
];

/**
 * Get all Academic Pathways from storage (with default seed fallback)
 */
export function getAllPathways() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PATHWAYS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load pathways from localStorage:', err);
  }
  return DEFAULT_ACADEMIC_PATHWAYS;
}

/**
 * Save or Add an Academic Pathway
 */
export function savePathway(pathwayData) {
  const current = getAllPathways();
  const slug = pathwayData.slug || pathwayData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const id = pathwayData.id || slug || `pathway_${Date.now()}`;
  const existing = current.find((p) => p.id === id || p.slug === slug);

  const programStructure = pathwayData.programStructure || (pathwayData.type === 'cohort' ? 'multi_semester' : 'course_group');
  const semesters = programStructure === 'multi_semester' ? (Number(pathwayData.semesters) || 2) : 0;
  const semesterNames = programStructure === 'multi_semester'
    ? (Array.isArray(pathwayData.semesterNames) && pathwayData.semesterNames.length > 0
        ? pathwayData.semesterNames
        : Array.from({ length: semesters }, (_, i) => `Semester ${i + 1}`))
    : [];

  const record = {
    ...existing,
    ...pathwayData,
    id,
    slug,
    name: pathwayData.name,
    subtitle: pathwayData.subtitle || '',
    description: pathwayData.description || '',
    programStructure,
    type: programStructure === 'multi_semester' ? 'cohort' : 'modular',
    duration: pathwayData.duration || (programStructure === 'multi_semester' ? '8 Months (2 Semesters)' : '4 Weeks'),
    semesters,
    semesterNames,
    tuitionModel: pathwayData.tuitionModel || (programStructure === 'multi_semester' ? 'bundled' : 'per_course'),
    defaultTuitionFee: Number(pathwayData.defaultTuitionFee) || 0,
    color: pathwayData.color || 'emerald',
    icon: pathwayData.icon || 'GraduationCap',
    status: pathwayData.status || 'Active',
    createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
  };

  const exists = Boolean(existing);
  const updated = exists ? current.map((p) => (p.id === id || p.slug === slug ? record : p)) : [record, ...current];

  try {
    localStorage.setItem(STORAGE_KEY_PATHWAYS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save pathway to localStorage:', err);
  }
  return record;
}

/**
 * Delete an Academic Pathway
 */
export function deletePathway(id) {
  const current = getAllPathways();
  const updated = current.filter((p) => p.id !== id && p.slug !== id);
  try {
    localStorage.setItem(STORAGE_KEY_PATHWAYS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete pathway from localStorage:', err);
  }
  return updated;
}

/**
 * ==========================================
 * CLASS SCHEDULE & TIMETABLE PLANNER SERVICE
 * ==========================================
 */

/**
 * Convert time string "HH:MM" (e.g. "18:30") to minutes from midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Format minutes or "HH:MM" to friendly 12h display (e.g. "6:00 PM")
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const mFmt = m < 10 ? `0${m}` : `${m}`;
  return `${h12}:${mFmt} ${ampm}`;
}

/**
 * Format time range "18:00" to "20:30" => "6:00 PM – 8:30 PM"
 */
export function formatSlotTimeRange(startTime, endTime) {
  return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
}

/**
 * Retrieve all scheduled lecture slots
 */
export function getScheduleSlots() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHEDULE_SLOTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem(STORAGE_KEY_SCHEDULE_SLOTS, JSON.stringify(initialScheduleSlots));
    return initialScheduleSlots;
  } catch (err) {
    console.error('Failed to load schedule slots:', err);
    return initialScheduleSlots;
  }
}

/**
 * Determine whether a student is enrolled in the Ilm Foundations programme
 */
export function isStudentEnrolledInFoundations(studentId = null) {
  try {
    let targetUser = null;
    const rawUser = localStorage.getItem('ilm_lms_user');
    if (rawUser) {
      targetUser = JSON.parse(rawUser);
    }

    // Administrators have full access
    if (targetUser?.role === 'admin') {
      return true;
    }

    // 1. Check user object explicitly
    if (targetUser?.program && targetUser.program.toLowerCase().includes('foundations')) {
      return true;
    }

    // 2. Check student record from all students list
    const allStudents = getAllStudents();
    const effectiveId = studentId || targetUser?.id;
    const effectiveEmail = targetUser?.email?.toLowerCase();

    const matchedStudent = allStudents.find(
      (s) => (effectiveId && s.id === effectiveId) || (effectiveEmail && s.email?.toLowerCase() === effectiveEmail)
    );

    if (matchedStudent) {
      if (matchedStudent.program && matchedStudent.program.toLowerCase().includes('foundations')) {
        return true;
      }
      // If student has a specific non-foundations program (e.g. "The Prophetic Biography" or "Intensive")
      if (matchedStudent.program && !matchedStudent.program.toLowerCase().includes('foundations')) {
        return false;
      }
    }

    // 3. Check current student's enrolled courses list
    const enrolledList = getEnrolledCourses();
    const hasFoundationsCourses = enrolledList.some(
      (c) => c.category === 'foundations' || (c.program && c.program.toLowerCase().includes('foundations'))
    );

    return hasFoundationsCourses;
  } catch (err) {
    console.error('Failed to verify Ilm Foundations enrollment:', err);
    return false;
  }
}

/**
 * Retrieve schedule slots filtered by the student's enrolled courses / program.
 * Strictly restricts Ilm Foundations slots to students enrolled in Ilm Foundations.
 */
export function getStudentScheduleSlots(studentId = null) {
  try {
    const allSlots = getScheduleSlots();
    const activeSlots = allSlots.filter((s) => s.status !== 'cancelled');
    const isFoundations = isStudentEnrolledInFoundations(studentId);
    const enrolled = getEnrolledCourses();
    const enrolledIds = new Set(enrolled.map((c) => c.id));
    const enrolledTitles = new Set(enrolled.map((c) => (c.title || '').toLowerCase().trim()));

    return activeSlots.filter((slot) => {
      const isSlotFoundations =
        (slot.cohortId && slot.cohortId.includes('foundations')) ||
        (slot.cohortName && slot.cohortName.toLowerCase().includes('foundations')) ||
        (slot.courseId && slot.courseId.startsWith('crs_found_')) ||
        ['Qur\'ānic Arabic', 'Tajwīd', 'Fiqh', 'Tafsīr', 'Why Islam', 'Why Islām?', 'Sīrah'].includes(slot.courseTitle);

      if (isSlotFoundations) {
        return isFoundations;
      }

      // If slot is for another course, verify student is enrolled in that specific course
      if (slot.courseId && enrolledIds.has(slot.courseId)) return true;
      if (slot.courseTitle && enrolledTitles.has(slot.courseTitle.toLowerCase().trim())) return true;

      return false;
    });
  } catch (err) {
    console.error('Failed to get student schedule slots:', err);
    return [];
  }
}

/**
 * Real-time conflict detection between proposed slot and existing schedule
 * Checks:
 * 1. Instructor clash on the same day during overlapping time
 * 2. DHA Campus Room clash on the same day during overlapping time
 * 3. Cohort clash (same student cohort booked twice simultaneously)
 */
export function checkScheduleConflict(proposedSlot, existingSlots = null, excludeSlotId = null) {
  const allSlots = existingSlots || getScheduleSlots();
  const day = proposedSlot.dayOfWeek;
  const pStart = timeToMinutes(proposedSlot.startTime);
  const pEnd = timeToMinutes(proposedSlot.endTime);

  if (!day || pStart >= pEnd) {
    return { hasConflict: false, conflicts: [] };
  }

  const conflicts = [];

  for (const slot of allSlots) {
    if (excludeSlotId && slot.id === excludeSlotId) continue;
    if (slot.status === 'cancelled') continue;
    if (slot.dayOfWeek !== day) continue;

    const sStart = timeToMinutes(slot.startTime);
    const sEnd = timeToMinutes(slot.endTime);

    // Overlap condition: max(startA, startB) < min(endA, endB)
    const isOverlapping = Math.max(pStart, sStart) < Math.min(pEnd, sEnd);
    if (!isOverlapping) continue;

    const timeRangeStr = `${formatTime12h(slot.startTime)} – ${formatTime12h(slot.endTime)}`;

    // 1. Instructor Conflict
    if (
      proposedSlot.instructorName &&
      slot.instructorName &&
      proposedSlot.instructorName.trim().toLowerCase() === slot.instructorName.trim().toLowerCase()
    ) {
      conflicts.push({
        type: 'instructor',
        title: 'Instructor Double-Booking',
        message: `${slot.instructorName} is already assigned to "${slot.courseTitle}" on ${day} (${timeRangeStr}).`,
        conflictingSlot: slot,
      });
    }

    // 2. Room Conflict (Only for on-site slots)
    if (
      proposedSlot.modality === 'onsite_campus' &&
      slot.modality === 'onsite_campus' &&
      proposedSlot.campusRoom &&
      slot.campusRoom &&
      proposedSlot.campusRoom.trim().toLowerCase() === slot.campusRoom.trim().toLowerCase()
    ) {
      conflicts.push({
        type: 'room',
        title: 'Room Double-Booking',
        message: `"${slot.campusRoom}" is already booked for "${slot.courseTitle}" on ${day} (${timeRangeStr}).`,
        conflictingSlot: slot,
      });
    }

    // 3. Cohort Conflict (Same cohort has two mandatory lectures simultaneously)
    if (
      proposedSlot.cohortId &&
      slot.cohortId &&
      proposedSlot.cohortId === slot.cohortId
    ) {
      conflicts.push({
        type: 'cohort',
        title: 'Cohort Schedule Overlap',
        message: `Students in "${slot.cohortName}" already have "${slot.courseTitle}" scheduled on ${day} (${timeRangeStr}).`,
        conflictingSlot: slot,
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Save or update a lecture slot
 */
export function saveScheduleSlot(slotData) {
  const current = getScheduleSlots();
  const id = slotData.id || `slot_${Date.now()}`;
  const existing = current.find((s) => s.id === id);

  const pStart = timeToMinutes(slotData.startTime || '18:00');
  const pEnd = timeToMinutes(slotData.endTime || '20:30');
  const durationMinutes = Math.max(0, pEnd - pStart);

  const record = {
    ...existing,
    ...slotData,
    id,
    durationMinutes,
    updatedAt: new Date().toISOString().split('T')[0],
    createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
  };

  const exists = Boolean(existing);
  const updated = exists
    ? current.map((s) => (s.id === id ? record : s))
    : [record, ...current];

  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULE_SLOTS, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ilm_schedule_updated'));
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_SCHEDULE_SLOTS }));
    }
  } catch (err) {
    console.error('Failed to save schedule slot to localStorage:', err);
  }
  return { record, updatedSlots: updated };
}

/**
 * Delete a lecture slot
 */
export function deleteScheduleSlot(slotId) {
  const current = getScheduleSlots();
  const updated = current.filter((s) => s.id !== slotId);
  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULE_SLOTS, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ilm_schedule_updated'));
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_SCHEDULE_SLOTS }));
    }
  } catch (err) {
    console.error('Failed to delete schedule slot:', err);
  }
  return updated;
}

/**
 * Get all schedule broadcast notifications
 */
export function getScheduleNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHEDULE_NOTIFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_KEY_SCHEDULE_NOTIFS, JSON.stringify(initialScheduleNotifications));
    return initialScheduleNotifications;
  } catch (err) {
    console.error('Failed to load schedule notifications:', err);
    return initialScheduleNotifications;
  }
}

/**
 * Record a student notification broadcast for timetable events
 */
export function recordScheduleNotification(broadcastData) {
  const current = getScheduleNotifications();
  const newRecord = {
    id: broadcastData.id || `notif_sch_${Date.now()}`,
    sentAt: new Date().toISOString(),
    senderAdmin: broadcastData.senderAdmin || 'Accounts & Academic Operations',
    ...broadcastData,
  };
  const updated = [newRecord, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULE_NOTIFS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save schedule notification:', err);
  }

  // Also bridge into student in-app notifications if channels include 'in_app'
  if (broadcastData.channels?.includes('in_app')) {
    const isFoundations =
      broadcastData.cohortId?.includes('foundations') ||
      broadcastData.cohortName?.toLowerCase().includes('foundations') ||
      broadcastData.courseId?.startsWith('crs_found_');

    const inAppNotif = {
      id: `notif_sch_bridge_${Date.now()}`,
      type: 'schedule_update',
      cohortId: broadcastData.cohortId || 'foundations_sem1',
      cohortName: broadcastData.cohortName || 'Ilm Foundations',
      courseId: broadcastData.courseId,
      courseTitle: broadcastData.courseTitle,
      isFoundations,
      message: broadcastData.changeSummary || `Timetable update for ${broadcastData.courseTitle || broadcastData.cohortName}`,
      time: 'Just now',
      timestamp: Date.now(),
      read: false,
      link: '/schedule',
    };
    const studentNotifs = getStudentNotifications();
    saveStudentNotifications([inAppNotif, ...studentNotifs]);
  }

  return { newRecord, updatedNotifs: updated };
}

/**
 * Retrieve unified student notifications with persistence in localStorage.
 * Automatically cleanses any corrupted dummy entries (e.g. [undefined] undefined).
 * Filters notifications strictly according to the student's enrolled program/courses.
 */
export function getStudentNotifications(studentId = null) {
  try {
    let list = [];
    const raw = localStorage.getItem(STORAGE_KEY_STUDENT_NOTIFICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed.filter(
          (n) => n && n.message && !n.message.includes('undefined') && !n.message.includes('[undefined]')
        );
      }
    } else {
      list = (defaultNotifications || []).filter(
        (n) => n && n.message && !n.message.includes('undefined')
      );
      localStorage.setItem(STORAGE_KEY_STUDENT_NOTIFICATIONS, JSON.stringify(list));
    }

    // Filter notifications strictly according to student's enrolled courses/program
    const isFoundations = isStudentEnrolledInFoundations(studentId);
    const enrolledCourses = getEnrolledCourses();
    const enrolledCourseIds = new Set(enrolledCourses.map((c) => c.id));

    return list.filter((n) => {
      // Is this notification related to Ilm Foundations / live sessions?
      const isFoundationsNotif =
        n.isFoundations ||
        n.cohortId?.includes('foundations') ||
        n.cohortName?.toLowerCase().includes('foundations') ||
        (n.courseId && n.courseId.startsWith('crs_found_')) ||
        (n.message && (
          n.message.toLowerCase().includes('foundations') ||
          n.message.toLowerCase().includes('usūl al-fiqh') ||
          n.message.toLowerCase().includes('qur\'ānic arabic') ||
          n.message.toLowerCase().includes('tajwīd')
        ));

      if (isFoundationsNotif) {
        return isFoundations;
      }

      // If notification is tied to a specific courseId
      if (n.courseId && !enrolledCourseIds.has(n.courseId)) {
        return false;
      }

      return true;
    });
  } catch (err) {
    console.error('Failed to load student notifications:', err);
    return [];
  }
}

/**
 * Clear all student notifications
 */
export function clearStudentNotifications() {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENT_NOTIFICATIONS, JSON.stringify([]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ilm-notifications-updated', { detail: [] }));
    }
  } catch (err) {
    console.error('Failed to clear student notifications:', err);
  }
  return [];
}

/**
 * Save student notifications to localStorage and dispatch custom update event
 */
export function saveStudentNotifications(notifs) {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENT_NOTIFICATIONS, JSON.stringify(notifs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ilm-notifications-updated', { detail: notifs }));
    }
  } catch (err) {
    console.error('Failed to save student notifications:', err);
  }
}

/**
 * Mark a single notification as read
 */
export function markNotificationAsRead(id) {
  const current = getStudentNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStudentNotifications(updated);
  return updated;
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead() {
  const current = getStudentNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveStudentNotifications(updated);
  return updated;
}

/**
 * Check whether a student is enrolled in a given course
 */
export function isStudentEnrolledInCourse(courseId, studentId = null) {
  if (!courseId) return false;

  // 1. Direct check in enrolled courses list
  const enrolledList = getEnrolledCourses();
  if (enrolledList.some((c) => c.id === courseId || c.title?.toLowerCase() === courseId?.toLowerCase())) {
    return true;
  }

  // 2. Check if the course is an Ilm Foundations course — strictly restricted to foundations students
  const allCourses = getAllCourses();
  const foundCourse = allCourses.find((c) => c.id === courseId);
  if (foundCourse && foundCourse.category === 'foundations') {
    return isStudentEnrolledInFoundations(studentId);
  }
  const detail = getCourseDetailById(courseId);
  if (detail && detail.category === 'foundations') {
    return isStudentEnrolledInFoundations(studentId);
  }

  // 3. Check enrollment map
  try {
    const rawMap = localStorage.getItem(STORAGE_KEY_ENROLLMENTS);
    if (rawMap) {
      const map = JSON.parse(rawMap);
      const studentIds = map[courseId];
      if (Array.isArray(studentIds)) {
        if (!studentId) {
          const rawUser = localStorage.getItem('ilm_lms_user');
          const currentUser = rawUser ? JSON.parse(rawUser) : null;
          const targetId = currentUser?.id || 'usr_001';
          return studentIds.includes(targetId) || (currentUser?.email && studentIds.includes(currentUser.email));
        }
        return studentIds.includes(studentId);
      }
    }
  } catch (e) {
    console.error('Failed to inspect course enrollments:', e);
  }

  return false;
}

/**
 * Automatically creates and delivers a notification when a new lesson is added
 * to a course in which the student is enrolled.
 */
export function notifyEnrolledStudentsNewLesson({ courseId, courseTitle, lessonTitle, lessonId, moduleId }) {
  if (!courseId || !lessonTitle) return null;

  // Verify enrollment
  if (!isStudentEnrolledInCourse(courseId)) {
    return null;
  }

  const existingNotifs = getStudentNotifications();

  // Deduplicate exact same lesson notification
  const isDuplicate = existingNotifs.some(
    (n) => n.courseId === courseId && (n.lessonId === lessonId || n.lessonTitle === lessonTitle)
  );
  if (isDuplicate) {
    return null;
  }

  const newNotif = {
    id: `notif_lesson_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'new_lesson',
    courseId,
    courseTitle: courseTitle || 'Course',
    lessonTitle: lessonTitle || 'New Lesson',
    lessonId,
    moduleId,
    message: `New lesson added to ${courseTitle || 'your course'}: "${lessonTitle}". Start learning now!`,
    time: 'Just now',
    timestamp: Date.now(),
    read: false,
    link: `/course/${courseId}${lessonId ? `?lessonId=${lessonId}` : ''}`,
  };

  const updatedNotifs = [newNotif, ...existingNotifs];
  saveStudentNotifications(updatedNotifs);

  return newNotif;
}

/**
 * Directly append a new lesson to a course's curriculum and trigger notifications
 */
export function addLessonToCourse(courseId, lessonData, targetModuleId = null) {
  const detail = getCourseDetailById(courseId);
  if (!detail) return null;

  const newLesson = {
    id: lessonData.id || `les_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: lessonData.title || 'Untitled Lesson',
    type: lessonData.type || 'video',
    duration: lessonData.duration || '25 min',
    videoUrl: lessonData.videoUrl || DEFAULT_BUNNY_VIDEO_URL,
    content: lessonData.content || '',
    completed: false,
  };

  let modules = Array.isArray(detail.modules) && detail.modules.length > 0
    ? [...detail.modules]
    : [
        {
          id: `mod_${Date.now()}_1`,
          title: 'Module 1: General Curriculum',
          expanded: true,
          lessons: [],
        },
      ];

  let targetMod = targetModuleId
    ? modules.find((m) => m.id === targetModuleId)
    : modules[0];

  if (!targetMod) {
    targetMod = modules[0];
  }

  targetMod.lessons = [...(targetMod.lessons || []), newLesson];

  const totalLessons = modules.flatMap((m) => m.lessons || []).length;
  const completedLessons = modules.flatMap((m) => m.lessons || []).filter((l) => l.completed).length;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const updatedDetail = {
    ...detail,
    modules,
    totalLessons,
    completedLessons,
    progress,
  };

  saveCourseDetail(courseId, updatedDetail);

  // Synchronize enrolled courses totalLessons
  try {
    const rawEnrolled = localStorage.getItem(STORAGE_KEY_ENROLLED_COURSES);
    if (rawEnrolled) {
      const enrolledList = JSON.parse(rawEnrolled);
      const updatedEnrolled = enrolledList.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            totalLessons,
            progress: totalLessons > 0 ? Math.round(((c.completedLessons || 0) / totalLessons) * 100) : 0,
          };
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEY_ENROLLED_COURSES, JSON.stringify(updatedEnrolled));
    }
  } catch (e) {
    console.error('Failed to sync enrolled courses list on lesson add:', e);
  }

  // Trigger automated notification for enrolled students
  notifyEnrolledStudentsNewLesson({
    courseId,
    courseTitle: detail.title || 'Course',
    lessonTitle: newLesson.title,
    lessonId: newLesson.id,
    moduleId: targetMod.id,
  });

  // Dispatch progress & content update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ilm-course-progress-updated', {
      detail: { courseId, completedLessons, totalLessons, progress }
    }));
  }

  return { updatedDetail, newLesson };
}

// ==========================================
// E-LIBRARY CATALOG MANAGEMENT SERVICES
// ==========================================

export const defaultLibraryItems = [
  {
    id: 'lib_01',
    title: 'Tafsir Ibn Kathir — Abridged',
    author: 'Imam Ibn Kathir (d. 774 AH)',
    category: 'Tafsir',
    type: 'reference',
    pages: 1200,
    fileSize: '18.4 MB',
    language: 'Arabic / English',
    description: 'A comprehensive abridged version of the monumental Tafsir work, essential for Quranic exegesis students.',
    featured: true,
    downloadUrl: 'https://archive.org/download/TafseerIbnKaseer/Tafseer-Ibn-Kaseer.pdf',
    externalUrl: 'https://quran.com',
    status: 'published',
  },
  {
    id: 'lib_02',
    title: 'Riyadh-us-Saliheen',
    author: 'Imam An-Nawawi (d. 676 AH)',
    category: 'Hadith',
    type: 'reference',
    pages: 680,
    fileSize: '12.1 MB',
    language: 'Arabic / English',
    description: 'A compilation of authentic Hadith covering all aspects of a Muslim\'s life, organized thematically.',
    featured: true,
    downloadUrl: 'https://sunnah.com/riyadussalihin',
    externalUrl: 'https://sunnah.com/riyadussalihin',
    status: 'published',
  },
  {
    id: 'lib_03',
    title: 'Al-Fiqh Al-Muyassar — Simplified Fiqh',
    author: 'Multiple Authors',
    category: 'Fiqh',
    type: 'textbook',
    pages: 450,
    fileSize: '8.5 MB',
    language: 'Arabic / Urdu / English',
    description: 'An accessible introduction to Islamic jurisprudence covering acts of worship and daily life.',
    featured: false,
    downloadUrl: '',
    externalUrl: '',
    status: 'published',
  },
  {
    id: 'lib_04',
    title: 'Ar-Raheeq Al-Makhtum (The Sealed Nectar)',
    author: 'Safi-ur-Rahman al-Mubarakpuri',
    category: 'Seerah',
    type: 'reference',
    pages: 580,
    fileSize: '14.2 MB',
    language: 'English',
    description: 'An award-winning biography of Prophet Muhammad ﷺ, regarded as one of the most authentic Seerah works.',
    featured: true,
    downloadUrl: 'https://archive.org/details/TheSealedNectar_201601',
    externalUrl: 'https://archive.org/details/TheSealedNectar_201601',
    status: 'published',
  },
  {
    id: 'lib_05',
    title: 'Arabic Grammar — Essential Nahw & Sarf',
    author: 'Ilm Essentials Faculty',
    category: 'Arabic',
    type: 'course-material',
    pages: 180,
    fileSize: '4.8 MB',
    language: 'Arabic / English',
    description: 'Course companion for Quranic Arabic Level 1. Covers nominal and verbal sentences with exercises.',
    featured: false,
    downloadUrl: '',
    externalUrl: '',
    status: 'published',
  },
  {
    id: 'lib_06',
    title: 'Purification of the Heart — Workbook',
    author: 'Sheikh Yasir Faheem',
    category: 'Tazkiyah',
    type: 'course-material',
    pages: 120,
    fileSize: '3.2 MB',
    language: 'English / Urdu',
    description: 'Self-reflection workbook accompanying the Tazkiyat-un-Nafs intensive course.',
    featured: false,
    downloadUrl: '',
    externalUrl: '',
    status: 'published',
  },
];

/**
 * Retrieve all e-Library items from persistent storage
 */
export function getLibraryItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIBRARY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(defaultLibraryItems));
      return defaultLibraryItems;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultLibraryItems;
  } catch (err) {
    console.error('Failed to get library items:', err);
    return defaultLibraryItems;
  }
}

/**
 * Save (create or update) an e-Library resource
 */
export function saveLibraryItem(itemData) {
  try {
    const currentItems = getLibraryItems();
    let updated;
    const isNew = !itemData.id;
    const finalId = itemData.id || `lib_${Date.now()}`;

    const formattedItem = {
      id: finalId,
      title: itemData.title?.trim() || 'Untitled Resource',
      author: itemData.author?.trim() || 'Ilm Essentials Faculty',
      category: itemData.category || 'General',
      type: itemData.type || 'reference',
      pages: Number(itemData.pages) || 0,
      fileSize: itemData.fileSize?.trim() || 'PDF Document',
      language: itemData.language?.trim() || 'English / Arabic',
      description: itemData.description?.trim() || '',
      featured: Boolean(itemData.featured),
      downloadUrl: itemData.downloadUrl?.trim() || '',
      externalUrl: itemData.externalUrl?.trim() || '',
      status: itemData.status || 'published',
      updatedAt: new Date().toISOString(),
    };

    if (isNew) {
      updated = [formattedItem, ...currentItems];
    } else {
      updated = currentItems.map((item) => (item.id === finalId ? { ...item, ...formattedItem } : item));
      // In case it wasn't in the list
      if (!currentItems.some((i) => i.id === finalId)) {
        updated = [formattedItem, ...currentItems];
      }
    }

    localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ilm-library-updated', { detail: { action: isNew ? 'create' : 'update', item: formattedItem } }));
    }

    return formattedItem;
  } catch (err) {
    console.error('Failed to save library item:', err);
    throw err;
  }
}

/**
 * Delete an e-Library item by ID
 */
export function deleteLibraryItem(id) {
  try {
    const currentItems = getLibraryItems();
    const updated = currentItems.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ilm-library-updated', { detail: { action: 'delete', id } }));
    }

    return updated;
  } catch (err) {
    console.error('Failed to delete library item:', err);
    throw err;
  }
}

/**
 * Toggle featured flag for an e-Library item
 */
export function toggleLibraryItemFeatured(id) {
  try {
    const currentItems = getLibraryItems();
    const updated = currentItems.map((item) => {
      if (item.id === id) {
        return { ...item, featured: !item.featured };
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ilm-library-updated', { detail: { action: 'toggle-featured', id } }));
    }

    return updated;
  } catch (err) {
    console.error('Failed to toggle library item featured:', err);
    throw err;
  }
}

// ==========================================
// DAILY REFLECTIONS & QUOTES SERVICES
// ==========================================

export const defaultQuotesList = (defaultDailyQuotes || []).map((q, idx) => ({
  id: `quo_${idx + 1}`,
  text: q.text,
  source: q.source,
  type: q.type || 'hadith',
  active: true,
  pinned: idx === 1, // Default pinned to "The seeking of knowledge is obligatory for every Muslim."
  createdAt: new Date().toISOString(),
}));

/**
 * Helper to count words in a string
 */
export function countWords(str) {
  if (!str || typeof str !== 'string') return 0;
  const words = str.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * Retrieve all quotes from storage (fallback to seeded default list)
 */
export function getDailyQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_QUOTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DAILY_QUOTES, JSON.stringify(defaultQuotesList));
      return defaultQuotesList;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultQuotesList;
  } catch (err) {
    console.error('Failed to get daily quotes:', err);
    return defaultQuotesList;
  }
}

/**
 * Retrieves today's active quote for the student dashboard.
 * Priority:
 * 1. Pinned quote (if set by admin)
 * 2. Deterministic day-of-year rotation through active quotes
 */
export function getTodaysQuote() {
  const allQuotes = getDailyQuotes();
  const activeQuotes = allQuotes.filter((q) => q.active !== false);
  if (activeQuotes.length === 0) {
    return defaultQuotesList[0];
  }

  // 1. Check if an admin pinned a specific quote
  const pinnedQuote = activeQuotes.find((q) => q.pinned);
  if (pinnedQuote) {
    return pinnedQuote;
  }

  // 2. Deterministic rotation based on day of year
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return activeQuotes[dayOfYear % activeQuotes.length];
}

/**
 * Save or update a quote with strict word-count validation
 * - Quote Text: Max 40 words
 * - Source: Max 8 words
 */
export function saveDailyQuote(quoteData) {
  const text = (quoteData.text || '').trim();
  const source = (quoteData.source || '').trim();

  if (!text) {
    throw new Error('Quote text cannot be empty.');
  }

  const textWordCount = countWords(text);
  if (textWordCount > 40) {
    throw new Error(`Quote text exceeds maximum allowed limit of 40 words (current: ${textWordCount} words).`);
  }

  if (!source) {
    throw new Error('Citation reference (source) cannot be empty.');
  }

  const sourceWordCount = countWords(source);
  if (sourceWordCount > 8) {
    throw new Error(`Citation reference exceeds maximum allowed limit of 8 words (current: ${sourceWordCount} words).`);
  }

  try {
    const currentList = getDailyQuotes();
    const isNew = !quoteData.id;
    const finalId = quoteData.id || `quo_${Date.now()}`;

    const formattedQuote = {
      id: finalId,
      text,
      source,
      type: quoteData.type || 'hadith',
      active: quoteData.active !== false,
      pinned: Boolean(quoteData.pinned),
      updatedAt: new Date().toISOString(),
      createdAt: quoteData.createdAt || new Date().toISOString(),
    };

    let updatedList;
    if (isNew) {
      if (formattedQuote.pinned) {
        updatedList = [formattedQuote, ...currentList.map((q) => ({ ...q, pinned: false }))];
      } else {
        updatedList = [formattedQuote, ...currentList];
      }
    } else {
      updatedList = currentList.map((q) => {
        if (q.id === finalId) {
          return { ...q, ...formattedQuote };
        }
        if (formattedQuote.pinned) {
          return { ...q, pinned: false };
        }
        return q;
      });
      if (!currentList.some((q) => q.id === finalId)) {
        updatedList = [formattedQuote, ...currentList];
      }
    }

    localStorage.setItem(STORAGE_KEY_DAILY_QUOTES, JSON.stringify(updatedList));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ilm-quotes-updated', {
          detail: { action: isNew ? 'create' : 'update', quote: formattedQuote },
        })
      );
    }

    return formattedQuote;
  } catch (err) {
    console.error('Failed to save daily quote:', err);
    throw err;
  }
}

/**
 * Delete a quote by ID
 */
export function deleteDailyQuote(id) {
  try {
    const currentList = getDailyQuotes();
    const updated = currentList.filter((q) => q.id !== id);
    localStorage.setItem(STORAGE_KEY_DAILY_QUOTES, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ilm-quotes-updated', { detail: { action: 'delete', id } })
      );
    }

    return updated;
  } catch (err) {
    console.error('Failed to delete daily quote:', err);
    throw err;
  }
}

/**
 * Toggle pinned status for a quote (setting this quote as today's active quote)
 */
export function toggleQuotePinned(id) {
  try {
    const currentList = getDailyQuotes();
    const target = currentList.find((q) => q.id === id);
    const willBePinned = target ? !target.pinned : true;

    const updated = currentList.map((q) => {
      if (q.id === id) {
        return { ...q, pinned: willBePinned };
      }
      if (willBePinned) {
        return { ...q, pinned: false };
      }
      return q;
    });

    localStorage.setItem(STORAGE_KEY_DAILY_QUOTES, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ilm-quotes-updated', {
          detail: { action: 'toggle-pinned', id, isPinned: willBePinned },
        })
      );
    }

    return updated;
  } catch (err) {
    console.error('Failed to toggle quote pinned status:', err);
    throw err;
  }
}





// ============================================================================
// ACCOUNTS, FEE INSTALLMENTS & VIDEO ACCESS RESTRICTION SERVICE
// ============================================================================

/**
 * Retrieve all fee installments with persistence in localStorage
 */

/**
 * Generate a unique 8-digit numeric Challan Number (e.g. 24070543)
 */
export function generateChallanNo() {
  const prefix = '24';
  const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
  return `${prefix}${randomSuffix}`;
}

export function getFeeInstallments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INSTALLMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load fee installments from localStorage:', err);
  }
  try {
    localStorage.setItem(STORAGE_KEY_INSTALLMENTS, JSON.stringify(initialFeeInstallments));
  } catch (e) {}
  return initialFeeInstallments;
}

/**
 * Save fee installments to localStorage and dispatch update event
 */
export function saveFeeInstallments(installments) {
  try {
    localStorage.setItem(STORAGE_KEY_INSTALLMENTS, JSON.stringify(installments));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ilm-installments-updated', { detail: installments }));
      window.dispatchEvent(new CustomEvent('storage', { key: STORAGE_KEY_INSTALLMENTS }));
    }
  } catch (err) {
    console.error('Failed to save fee installments to localStorage:', err);
  }
}

/**
 * Retrieve installments for a specific student (or current student if null)
 */
export function getStudentInstallments(studentId = null) {
  const all = getFeeInstallments();
  let effectiveId = studentId;
  let effectiveEmail = null;

  if (!effectiveId) {
    try {
      const rawUser = localStorage.getItem('ilm_lms_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        effectiveId = u.id;
        effectiveEmail = u.email ? u.email.toLowerCase().trim() : null;
      }
    } catch (e) {}
  }

  // Fallback demo student
  if (!effectiveId) effectiveId = 'std_001';

  return all
    .filter((inst) => {
      if (inst.studentId === effectiveId) return true;
      if (effectiveId === 'usr_001' && inst.studentId === 'std_001') return true;
      if (effectiveEmail && inst.studentEmail && inst.studentEmail.toLowerCase().trim() === effectiveEmail) return true;
      return false;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

/**
 * Retrieve student accounts financial summary (Total Fee, Received, Receivable, Restriction)
 */
export function getStudentAccountsSummary(studentId = null) {
  const installments = getStudentInstallments(studentId);
  const totalFee = installments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const receivedAmount = installments
    .filter((inst) => inst.status === 'APPROVED')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const receivableAmount = installments
    .filter((inst) => ['UNPAID', 'UNDER_REVIEW', 'REJECTED'].includes(inst.status))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = installments.filter(
    (inst) => inst.status !== 'APPROVED' && inst.dueDate < todayStr
  ).length;

  const restrictionInfo = getStudentVideoRestriction(studentId);

  return {
    totalFee,
    receivedAmount,
    receivableAmount,
    overdueCount,
    isVideoRestricted: restrictionInfo.isVideoRestricted,
    restrictedAt: restrictionInfo.restrictedAt,
    restrictedByAdminName: restrictionInfo.restrictedByAdminName,
    installmentsCount: installments.length,
  };
}

/**
 * Global Admin Accounts Ledger Summary
 */
export function getGlobalAccountsSummary() {
  const all = getFeeInstallments();
  const totalReceived = all
    .filter((inst) => inst.status === 'APPROVED')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalReceivable = all
    .filter((inst) => ['UNPAID', 'UNDER_REVIEW', 'REJECTED'].includes(inst.status))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = all.filter(
    (inst) => inst.status !== 'APPROVED' && inst.dueDate < todayStr
  ).length;
  const pendingReviewCount = all.filter((inst) => inst.status === 'UNDER_REVIEW').length;

  const allStudents = getAllStudents();
  const restrictedCount = allStudents.filter((s) => s.isVideoRestricted).length;

  return {
    totalReceived,
    totalReceivable,
    totalBilled: totalReceived + totalReceivable,
    overdueCount,
    pendingReviewCount,
    pendingCount: pendingReviewCount,
    restrictedCount,
    restrictedStudentsCount: restrictedCount,
    totalInstallments: all.length,
  };
}

/**
 * Check video restriction status for a student
 */
export function getStudentVideoRestriction(studentId = null) {
  let targetId = studentId;
  let targetEmail = null;

  try {
    const rawUser = localStorage.getItem('ilm_lms_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (!studentId && u.role === 'admin') {
        return { isVideoRestricted: false, restrictedAt: null, restrictedByAdminName: null };
      }
      if (!targetId) targetId = u.id;
      targetEmail = u.email ? u.email.toLowerCase().trim() : null;
    }
  } catch (e) {}

  if (!targetId) targetId = 'std_001';

  const allStudents = getAllStudents();
  const student = allStudents.find(
    (s) => s.id === targetId || (targetId === 'usr_001' && s.id === 'std_001') || (targetEmail && s.email?.toLowerCase().trim() === targetEmail)
  );

  return {
    isVideoRestricted: Boolean(student?.isVideoRestricted),
    restrictedAt: student?.restrictedAt || null,
    restrictedByAdminName: student?.restrictedByAdminName || null,
  };
}

/**
 * Manually toggle or set video restriction for an individual student
 */
export function setStudentVideoRestriction(studentId, isRestricted, adminName = 'Ustadh Zafar Iqbal') {
  const allStudents = getAllStudents();
  const effectiveId = studentId === 'usr_001' ? 'std_001' : studentId;

  const updatedStudents = allStudents.map((s) => {
    if (s.id === effectiveId || (studentId && s.id === studentId)) {
      return {
        ...s,
        isVideoRestricted: Boolean(isRestricted),
        restrictedAt: isRestricted ? new Date().toISOString() : null,
        restrictedByAdminName: isRestricted ? adminName : null,
      };
    }
    return s;
  });

  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
  } catch (e) {}

  // Keep active logged-in user in sync if it's the target student
  try {
    const rawUser = localStorage.getItem('ilm_lms_user');
    if (rawUser) {
      const currentUser = JSON.parse(rawUser);
      if (currentUser.id === studentId || currentUser.id === effectiveId) {
        currentUser.isVideoRestricted = Boolean(isRestricted);
        currentUser.restrictedAt = isRestricted ? new Date().toISOString() : null;
        currentUser.restrictedByAdminName = isRestricted ? adminName : null;
        localStorage.setItem('ilm_lms_user', JSON.stringify(currentUser));
      }
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ilm-video-restriction-updated', {
      detail: { studentId: effectiveId, isRestricted, adminName }
    }));
  }

  return updatedStudents;
}

/**
 * Bulk Restrict Video Access for all students with Overdue/Unpaid installments (dueDate <= today)
 */
export function restrictAllOverdueStudents(adminName = 'Ustadh Zafar Iqbal') {
  const allInstallments = getFeeInstallments();
  const todayStr = new Date().toISOString().split('T')[0];

  // Identify all students who have at least one overdue unapproved installment
  const overdueStudentIds = new Set(
    allInstallments
      .filter((inst) => inst.status !== 'APPROVED' && inst.dueDate <= todayStr)
      .map((inst) => inst.studentId)
  );

  const allStudents = getAllStudents();
  let newlyRestrictedCount = 0;

  const updatedStudents = allStudents.map((s) => {
    if (overdueStudentIds.has(s.id) || (s.id === 'std_001' && overdueStudentIds.has('usr_001'))) {
      if (!s.isVideoRestricted) newlyRestrictedCount++;
      return {
        ...s,
        isVideoRestricted: true,
        restrictedAt: new Date().toISOString(),
        restrictedByAdminName: adminName,
      };
    }
    return s;
  });

  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
  } catch (e) {}

  // Update active user session if matched
  try {
    const rawUser = localStorage.getItem('ilm_lms_user');
    if (rawUser) {
      const currentUser = JSON.parse(rawUser);
      if (overdueStudentIds.has(currentUser.id) || (currentUser.id === 'usr_001' && overdueStudentIds.has('std_001'))) {
        currentUser.isVideoRestricted = true;
        currentUser.restrictedAt = new Date().toISOString();
        currentUser.restrictedByAdminName = adminName;
        localStorage.setItem('ilm_lms_user', JSON.stringify(currentUser));
      }
    }
  } catch (e) {}

  // Dispatch global notifications to overdue students
  for (const stdId of overdueStudentIds) {
    const notifs = getStudentNotifications(stdId);
    const newNotif = {
      id: `notif_restr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'account_restriction',
      message: `Your course video playback has been restricted due to overdue fee installments. Please clear your dues in the Accounts section to restore access.`,
      time: 'Just now',
      timestamp: Date.now(),
      read: false,
      link: '/accounts',
    };
    saveStudentNotifications([newNotif, ...notifs]);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ilm-video-restriction-updated', {
      detail: { overdueStudentIds: Array.from(overdueStudentIds), adminName }
    }));
  }

  return { newlyRestrictedCount, totalRestricted: overdueStudentIds.size };
}

/**
 * Bulk Restore / Unlock Video Access for all currently restricted students
 */
export function restoreAllRestrictedStudents(adminName = 'Ustadh Zafar Iqbal') {
  const allStudents = getAllStudents();
  let restoredCount = 0;
  const restoredIds = [];

  const updatedStudents = allStudents.map((s) => {
    if (s.isVideoRestricted) {
      restoredCount++;
      restoredIds.push(s.id);
      return {
        ...s,
        isVideoRestricted: false,
        restrictedAt: null,
        restrictedByAdminName: null,
      };
    }
    return s;
  });

  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
  } catch (e) {}

  // Update active user session if matched
  try {
    const rawUser = localStorage.getItem('ilm_lms_user');
    if (rawUser) {
      const currentUser = JSON.parse(rawUser);
      if (currentUser.isVideoRestricted) {
        currentUser.isVideoRestricted = false;
        currentUser.restrictedAt = null;
        currentUser.restrictedByAdminName = null;
        localStorage.setItem('ilm_lms_user', JSON.stringify(currentUser));
      }
    }
  } catch (e) {}

  // Dispatch global notifications to restored students
  for (const stdId of restoredIds) {
    const notifs = getStudentNotifications(stdId);
    const newNotif = {
      id: `notif_restored_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'account_restored',
      message: `Your course video playback access has been restored by admin (${adminName}). You may now resume watching class lectures.`,
      time: 'Just now',
      timestamp: Date.now(),
      read: false,
      link: '/dashboard',
    };
    saveStudentNotifications([newNotif, ...notifs]);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ilm-video-restriction-updated', {
      detail: { restoredIds, isRestricted: false, adminName }
    }));
  }

  return { restoredCount, updatedStudents };
}

/**
 * Create fixed installments for single or multiple students (supports single milestone or multi-installment plans)
 */
export function createInstallments({
  studentIds,
  milestones, // Array of { title, amount, dueDate }
  title,      // Backwards compatibility for single
  amount,     // Backwards compatibility for single
  dueDate,    // Backwards compatibility for single
  program = 'Ilm Foundations',
}) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new Error('Please provide at least one target student.');
  }

  // Normalize milestone list
  let milestoneList = [];
  if (Array.isArray(milestones) && milestones.length > 0) {
    milestoneList = milestones;
  } else if (title && amount && dueDate) {
    milestoneList = [{ title, amount, dueDate }];
  } else {
    throw new Error('Please provide valid installment details.');
  }

  const all = getFeeInstallments();
  const allStudents = getAllStudents();
  const now = new Date().toISOString();
  const newInstallments = [];

  for (const sId of studentIds) {
    const student = allStudents.find((s) => s.id === sId) || { name: 'Enrolled Student', email: 'student@example.com' };

    milestoneList.forEach((m, idx) => {
      const instId = `inst_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;
      const randomChallan = '23' + Math.floor(100000 + Math.random() * 900000);

      const newInst = {
        id: instId,
        challanNo: randomChallan,
        paymentMode: '—',
        paidDate: null,
        studentId: sId,
        studentName: student.name,
        studentEmail: student.email,
        program: student.program || program,
        title: (m.title || `Installment ${idx + 1}`).trim(),
        amount: Math.round(Number(m.amount) || 0),
        dueDate: m.dueDate,
        status: 'UNPAID',
        receiptImageUrl: null,
        submittedAt: null,
        approvedById: null,
        approvedByName: null,
        approvedAt: null,
        rejectionReason: null,
        createdAt: now,
        updatedAt: now,
      };

      newInstallments.push(newInst);
    });
  }

  const updated = [...newInstallments, ...all];
  saveFeeInstallments(updated);
  return { newInstallments, allInstallments: updated };
}

/**
 * Student uploads or re-uploads payment proof image (Base64 data URL)
 */
export function uploadInstallmentReceipt(installmentId, receiptImageUrl) {
  if (!installmentId || !receiptImageUrl) {
    throw new Error('Installment ID and receipt image are required.');
  }

  const all = getFeeInstallments();
  const target = all.find((inst) => inst.id === installmentId);

  if (!target) {
    throw new Error('Installment not found.');
  }

  if (target.status === 'APPROVED') {
    throw new Error('This installment has already been approved.');
  }

  const now = new Date().toISOString();
  const updated = all.map((inst) => {
    if (inst.id === installmentId) {
      return {
        ...inst,
        receiptImageUrl,
        status: 'UNDER_REVIEW',
        submittedAt: now,
        rejectionReason: null,
        updatedAt: now,
      };
    }
    return inst;
  });

  saveFeeInstallments(updated);

  // Broadcast in-app notification confirming receipt submission
  const notifs = getStudentNotifications(target.studentId);
  const newNotif = {
    id: `notif_submit_${Date.now()}`,
    type: 'receipt_submitted',
    message: `Payment proof for "${target.title}" submitted successfully and is currently under review by Accounts.`,
    time: 'Just now',
    timestamp: Date.now(),
    read: false,
    link: '/accounts',
  };
  saveStudentNotifications([newNotif, ...notifs]);

  return { success: true, installment: updated.find((i) => i.id === installmentId) };
}

/**
 * Admin approves an installment payment proof
 * Automatically runs the Auto-Unlock Check:
 * If all installments with dueDate <= today are now APPROVED, video access is automatically restored!
 */
export function approveInstallment(installmentId, adminUser = { id: 'adm_001', name: 'Ustadh Zafar Iqbal' }, maybeAdminName) {
  if (typeof adminUser === 'string') {
    adminUser = { id: adminUser, name: maybeAdminName || 'Ustadh Zafar Iqbal' };
  }
  const all = getFeeInstallments();
  const target = all.find((inst) => inst.id === installmentId);

  if (!target) {
    throw new Error('Installment not found.');
  }

  const now = new Date().toISOString();
  const adminName = adminUser?.name || 'Ustadh Zafar Iqbal';
  const adminId = adminUser?.id || 'adm_001';

  const updatedInstallments = all.map((inst) => {
    if (inst.id === installmentId) {
      return {
        ...inst,
        status: 'APPROVED',
        approvedById: adminId,
        approvedByName: adminName,
        approvedAt: now,
        paidDate: now.split('T')[0],
        paymentMode: inst.paymentMode && inst.paymentMode !== '—' ? inst.paymentMode : 'Meezan Online',
        rejectionReason: null,
        updatedAt: now,
      };
    }
    return inst;
  });

  saveFeeInstallments(updatedInstallments);

  // AUTO-UNLOCK CHECK:
  // Check if this student has any remaining unapproved installments where dueDate <= today
  const todayStr = new Date().toISOString().split('T')[0];
  const remainingOverdue = updatedInstallments.filter(
    (inst) =>
      inst.studentId === target.studentId &&
      inst.status !== 'APPROVED' &&
      inst.dueDate <= todayStr
  );

  let autoUnlocked = false;
  if (remainingOverdue.length === 0) {
    // Student has cleared all installments up to today (even if future installments exist)
    setStudentVideoRestriction(target.studentId, false, null);
    autoUnlocked = true;
  }

  // Send student notification
  const notifs = getStudentNotifications(target.studentId);
  const newNotif = {
    id: `notif_appr_${Date.now()}`,
    type: 'fee_approved',
    message: autoUnlocked
      ? `Payment of PKR ${target.amount.toLocaleString()} for "${target.title}" was approved by ${adminName}. Your course video access is active!`
      : `Payment of PKR ${target.amount.toLocaleString()} for "${target.title}" was approved by ${adminName}.`,
    time: 'Just now',
    timestamp: Date.now(),
    read: false,
    link: '/accounts',
  };
  saveStudentNotifications([newNotif, ...notifs]);

  return {
    success: true,
    installment: updatedInstallments.find((i) => i.id === installmentId),
    autoUnlocked,
    remainingOverdueCount: remainingOverdue.length,
  };
}

/**
 * Admin rejects an installment payment proof with mandatory reason
 */
export function rejectInstallment(installmentId, rejectionReason, adminUser = { id: 'adm_001', name: 'Ustadh Zafar Iqbal' }, maybeAdminName) {
  if (typeof adminUser === 'string') {
    adminUser = { id: adminUser, name: maybeAdminName || 'Ustadh Zafar Iqbal' };
  }
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error('A rejection reason is mandatory.');
  }

  const all = getFeeInstallments();
  const target = all.find((inst) => inst.id === installmentId);

  if (!target) {
    throw new Error('Installment not found.');
  }

  const now = new Date().toISOString();
  const cleanReason = rejectionReason.trim();

  const updatedInstallments = all.map((inst) => {
    if (inst.id === installmentId) {
      return {
        ...inst,
        status: 'REJECTED',
        rejectionReason: cleanReason,
        updatedAt: now,
      };
    }
    return inst;
  });

  saveFeeInstallments(updatedInstallments);

  // Send student notification
  const notifs = getStudentNotifications(target.studentId);
  const newNotif = {
    id: `notif_rej_${Date.now()}`,
    type: 'fee_rejected',
    message: `Your fee receipt for "${target.title}" was rejected: ${cleanReason}. Please upload a clear receipt to try again.`,
    time: 'Just now',
    timestamp: Date.now(),
    read: false,
    link: '/accounts',
  };
  saveStudentNotifications([newNotif, ...notifs]);

  const finalInst = updatedInstallments.find((i) => i.id === installmentId);
  return {
    success: true,
    installment: finalInst,
    status: finalInst?.status,
    rejectionReason: finalInst?.rejectionReason,
  };
}

/**
 * ============================================================================
 * HYBRID ATTENDANCE MANAGEMENT & TELEMETRY LEDGER
 * (Daily Roll-Call Register + Google Meet / Onsite Sheet Uploader)
 * ============================================================================
 */

export const INITIAL_ATTENDANCE_SESSIONS = [
  {
    id: 'att_ses_01',
    courseId: 'crs_found_01',
    courseTitle: "Qur'ānic Arabic",
    date: '2026-03-02',
    topic: 'Lecture 1: The Noun (Ism) & Fundamentals',
    deliveryMode: 'hybrid',
    records: {
      std_001: 'present',
      std_002: 'present',
      std_003: 'present',
      std_004: 'present',
      std_006: 'present',
      std_007: 'present',
      std_008: 'present',
      std_009: 'late',
      std_010: 'present',
      std_011: 'present',
      std_012: 'absent',
      std_013: 'present',
      std_014: 'present',
      std_015: 'present',
    },
    totalEnrolled: 14,
    presentCount: 12,
    createdAt: '2026-03-02T19:00:00.000Z',
  },
  {
    id: 'att_ses_02',
    courseId: 'crs_found_01',
    courseTitle: "Qur'ānic Arabic",
    date: '2026-03-05',
    topic: 'Lecture 2: Definite & Indefinite Noun Drills',
    deliveryMode: 'online',
    records: {
      std_001: 'present',
      std_002: 'present',
      std_003: 'late',
      std_004: 'present',
      std_006: 'present',
      std_007: 'present',
      std_008: 'present',
      std_009: 'present',
      std_010: 'present',
      std_011: 'absent',
      std_012: 'present',
      std_013: 'present',
      std_014: 'present',
      std_015: 'present',
    },
    totalEnrolled: 14,
    presentCount: 12,
    createdAt: '2026-03-05T19:00:00.000Z',
  },
  {
    id: 'att_ses_03',
    courseId: 'crs_found_02',
    courseTitle: 'Tajwīd',
    date: '2026-03-04',
    topic: 'Lecture 1: Makhaarij Al-Huroof (Articulation Points)',
    deliveryMode: 'onsite',
    records: {
      std_001: 'present',
      std_002: 'present',
      std_003: 'present',
      std_004: 'late',
      std_006: 'present',
      std_007: 'present',
      std_008: 'present',
      std_009: 'present',
      std_010: 'present',
      std_011: 'present',
      std_012: 'present',
      std_013: 'absent',
      std_014: 'present',
      std_015: 'present',
    },
    totalEnrolled: 14,
    presentCount: 12,
    createdAt: '2026-03-04T18:30:00.000Z',
  },
  {
    id: 'att_ses_04',
    courseId: 'crs_202',
    courseTitle: 'The Prophetic Biography (Sīrah)',
    date: '2026-03-07',
    topic: 'Seminar 1: Pre-Islamic Arabia & Lineage of Rasulullah ﷺ',
    deliveryMode: 'online',
    records: {
      std_005: 'present',
      std_001: 'present',
      std_002: 'present',
      std_003: 'present',
    },
    totalEnrolled: 4,
    presentCount: 4,
    createdAt: '2026-03-07T11:00:00.000Z',
  },
];

/**
 * Get all attendance sessions, optionally filtered by course
 */
export function getAttendanceSessions(courseId = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE_SESSIONS);
    let list = INITIAL_ATTENDANCE_SESSIONS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
    if (courseId) {
      return list.filter((s) => s.courseId === courseId);
    }
    return list;
  } catch (err) {
    console.error('Failed to get attendance sessions:', err);
    return INITIAL_ATTENDANCE_SESSIONS;
  }
}

/**
 * Save all attendance sessions
 */
export function saveAllAttendanceSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE_SESSIONS, JSON.stringify(sessions));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ilm-attendance-updated', { detail: { sessions } }));
    }
  } catch (err) {
    console.error('Failed to save attendance sessions to localStorage:', err);
  }
}

/**
 * Calculate accurate live attendance rate for a student across all recorded sessions
 */
export function calculateStudentAttendanceStats(studentId, sessions = null) {
  const allSessions = sessions || getAttendanceSessions();
  let totalSessions = 0;
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  for (const session of allSessions) {
    if (session.records && session.records[studentId] !== undefined) {
      totalSessions++;
      const status = session.records[studentId];
      if (status === 'present') {
        presentCount++;
      } else if (status === 'late') {
        lateCount++;
      } else if (status === 'absent') {
        absentCount++;
      }
    }
  }

  if (totalSessions === 0) {
    return {
      rate: '100%',
      rateNumber: 100,
      totalSessions: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      hasRecords: false,
    };
  }

  // Late counts as 0.75 present
  const score = (presentCount + lateCount * 0.75) / totalSessions;
  const rateNumber = Math.min(100, Math.max(0, Math.round(score * 100)));

  return {
    rate: `${rateNumber}%`,
    rateNumber,
    totalSessions,
    presentCount,
    lateCount,
    absentCount,
    hasRecords: true,
  };
}

/**
 * Calculate live curriculum progress for a student based on real completed lessons
 */
export function calculateStudentProgressStats(studentId) {
  try {
    const rawDetails = localStorage.getItem(STORAGE_KEY_DETAILS);
    const detailsMap = rawDetails ? JSON.parse(rawDetails) : {};
    const enrolledCourses = getEnrolledCourses();

    let totalLessonsAcrossCourses = 0;
    let completedLessonsAcrossCourses = 0;

    for (const course of enrolledCourses) {
      const detail = detailsMap[course.id] || course;
      let courseTotal = 0;
      let courseCompleted = 0;

      if (Array.isArray(detail.modules) && detail.modules.length > 0) {
        detail.modules.forEach((mod) => {
          if (Array.isArray(mod.lessons)) {
            mod.lessons.forEach((l) => {
              courseTotal++;
              if (l.completed) courseCompleted++;
            });
          }
        });
      } else {
        courseTotal = detail.totalLessons || 12;
        courseCompleted = detail.completedLessons || 0;
      }

      totalLessonsAcrossCourses += courseTotal;
      completedLessonsAcrossCourses += courseCompleted;
    }

    if (totalLessonsAcrossCourses > 0) {
      const computedPercent = Math.round((completedLessonsAcrossCourses / totalLessonsAcrossCourses) * 100);
      return {
        progress: computedPercent,
        completedLessons: completedLessonsAcrossCourses,
        totalLessons: totalLessonsAcrossCourses,
      };
    }
  } catch (err) {
    console.error('Failed to calculate live student progress:', err);
  }

  return {
    progress: 0,
    completedLessons: 0,
    totalLessons: 0,
  };
}

/**
 * Save or record an attendance session (handles both daily roll-call and sheet upload)
 * Automatically synchronizes each student's attendance percentage into the students list.
 */
export function saveAttendanceSession(sessionData) {
  const current = getAttendanceSessions();
  const id = sessionData.id || `att_${Date.now()}`;
  const existingIdx = current.findIndex((s) => s.id === id);

  const records = sessionData.records || {};
  const totalEnrolled = Object.keys(records).length;
  const presentCount = Object.values(records).filter((r) => r === 'present' || r === 'late').length;

  const session = {
    ...sessionData,
    id,
    records,
    totalEnrolled,
    presentCount,
    createdAt: sessionData.createdAt || new Date().toISOString(),
  };

  const updatedSessions = existingIdx >= 0
    ? current.map((s, idx) => (idx === existingIdx ? session : s))
    : [session, ...current];

  saveAllAttendanceSessions(updatedSessions);

  // Synchronize computed attendance rates back to all affected students
  syncAllStudentsAttendance(updatedSessions);

  return session;
}

/**
 * Synchronize attendance percentages on student records in storage
 */
export function syncAllStudentsAttendance(sessions = null) {
  try {
    const allStudents = getAllStudents();
    const allSessions = sessions || getAttendanceSessions();

    const updatedStudents = allStudents.map((std) => {
      const stats = calculateStudentAttendanceStats(std.id, allSessions);
      if (stats.hasRecords) {
        return {
          ...std,
          attendance: stats.rate,
        };
      }
      return std;
    });

    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
    return updatedStudents;
  } catch (err) {
    console.error('Failed to sync students attendance:', err);
  }
}

/**
 * Delete an attendance session and re-sync student rates
 */
export function deleteAttendanceSession(sessionId) {
  const current = getAttendanceSessions();
  const updated = current.filter((s) => s.id !== sessionId);
  saveAllAttendanceSessions(updated);
  syncAllStudentsAttendance(updated);
  return updated;
}

/**
 * Parse an uploaded attendance sheet (Google Meet CSV or standard roll-call spreadsheet)
 * and match it against the course student roster.
 */
export function parseAttendanceSheet(sheetText, courseStudents = []) {
  if (!sheetText || typeof sheetText !== 'string') {
    return { matched: [], presentStudentIds: [], absentStudentIds: [], unmatchedRows: [] };
  }

  const lines = sheetText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { matched: [], presentStudentIds: [], absentStudentIds: [], unmatchedRows: [] };
  }

  // Detect header row if present
  let headerIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('email') || lower.includes('name') || lower.includes('duration') || lower.includes('status')) {
      headerIndex = i;
      break;
    }
  }

  const dataRows = lines.slice(headerIndex + 1);

  // Normalize roster lookup maps
  const emailMap = new Map();
  const nameMap = new Map();
  courseStudents.forEach((std) => {
    if (std.email) emailMap.set(std.email.toLowerCase().trim(), std);
    if (std.name) nameMap.set(std.name.toLowerCase().trim(), std);
  });

  const matched = [];
  const presentStudentIds = new Set();
  const absentStudentIds = new Set();
  const unmatchedRows = [];

  for (const row of dataRows) {
    // Split by comma or tab (handles TSV and CSV)
    const columns = row.includes('\t')
      ? row.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''))
      : row.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

    if (columns.length === 0 || !columns[0]) continue;

    let detectedEmail = null;
    let detectedName = null;
    let detectedStatus = 'present'; // Default for attendance logs (e.g. Google Meet lists participants who joined)
    const nameCandidates = [];

    for (const col of columns) {
      if (col.includes('@') && col.includes('.')) {
        detectedEmail = col.toLowerCase().trim();
      } else if (/^(present|p|attended|yes|1)$/i.test(col)) {
        detectedStatus = 'present';
      } else if (/^(absent|a|no|0)$/i.test(col)) {
        detectedStatus = 'absent';
      } else if (/^(late|l)$/i.test(col)) {
        detectedStatus = 'late';
      } else if (col.length > 1 && !/\d{2,}/.test(col) && !/^(joined|left|exited|call|duration|hr|hrs|min|mins|sec|secs)$/i.test(col)) {
        nameCandidates.push(col.trim());
      }
    }

    if (nameCandidates.length > 0) {
      detectedName = nameCandidates.join(' ');
    }

    // Match against course students
    let matchedStudent = null;
    if (detectedEmail && emailMap.has(detectedEmail)) {
      matchedStudent = emailMap.get(detectedEmail);
    } else if (detectedName && nameMap.has(detectedName)) {
      matchedStudent = nameMap.get(detectedName);
    } else {
      // Fuzzy name check
      for (const [sName, std] of nameMap.entries()) {
        if (detectedName && (sName.includes(detectedName) || detectedName.includes(sName))) {
          matchedStudent = std;
          break;
        }
      }
    }

    if (matchedStudent) {
      if (detectedStatus === 'absent') {
        absentStudentIds.add(matchedStudent.id);
      } else {
        presentStudentIds.add(matchedStudent.id);
      }
      matched.push({
        student: matchedStudent,
        rawStatus: detectedStatus,
        rawRow: row,
      });
    } else {
      unmatchedRows.push({
        rawRow: row,
        detectedEmail,
        detectedName,
      });
    }
  }

  // Any course student not present is marked absent if sheet is a full Google Meet participant export
  courseStudents.forEach((std) => {
    if (!presentStudentIds.has(std.id) && !absentStudentIds.has(std.id)) {
      absentStudentIds.add(std.id);
    }
  });

  return {
    matched,
    presentStudentIds: Array.from(presentStudentIds),
    absentStudentIds: Array.from(absentStudentIds),
    unmatchedRows,
  };
}
