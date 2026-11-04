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
  initialScheduleSlots,
  initialScheduleNotifications,
} from '../data/mockData';

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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_KEY_SCHEDULE_SLOTS, JSON.stringify(initialScheduleSlots));
    return initialScheduleSlots;
  } catch (err) {
    console.error('Failed to load schedule slots:', err);
    return initialScheduleSlots;
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
  return { newRecord, updatedNotifs: updated };
}

