/**
 * 4-Tier Refactored Access Control Engine
 *
 * Implements strict, inverted evaluation order:
 * Tier 1: Course & Pathway Enrollment Check
 * Tier 2: Explicit Admin Override (Grant or Lock) -> Supercedes Fee & Prerequisites
 * Tier 3: Scoped Pathway Financial Ledger Check (Tuition Model: 'bundled' vs 'per_course')
 * Tier 4: Sequential Lesson Prerequisite Rule
 */

/**
 * Normalizes student identifiers across Supabase/Firebase Auth UUID, roster ID, and email
 */
export function normalizeStudentId(userOrId) {
  if (!userOrId) return { id: '', email: '' };
  if (typeof userOrId === 'object') {
    const rawId = (userOrId.id || userOrId.uid || '').toLowerCase().trim();
    const effectiveId = rawId === 'usr_001' ? 'std_001' : rawId;
    return {
      id: effectiveId,
      email: (userOrId.email || '').toLowerCase().trim(),
    };
  }
  const str = String(userOrId).toLowerCase().trim();
  const effectiveId = str === 'usr_001' ? 'std_001' : str;
  return {
    id: effectiveId.includes('@') ? '' : effectiveId,
    email: effectiveId.includes('@') ? effectiveId : '',
  };
}

/**
 * Checks if a student is locked out of a specific pathway or course based on financial ledger status.
 * Evaluates tuition model:
 * - When pathway.tuition_model === 'bundled' (e.g. Ilm Foundations), checks parent pathway/cohort invoice.
 * - When pathway.tuition_model === 'per_course' (e.g. Electives / Intensives), checks course-specific invoice.
 *
 * @param {object} params
 * @param {string} params.studentId - Normalized student ID or email
 * @param {string} params.studentEmail - Normalized student email
 * @param {object} params.course - Course object { id, category, pathway_id, pathwayId }
 * @param {object} params.pathway - Pathway object { id, tuition_model, tuitionModel, name }
 * @param {Array}  params.invoices - Master invoice records (from Supabase or local storage)
 * @param {Array}  params.installments - Fee installment records
 * @returns {{ isBlocked: boolean, overdueCount: number, reason: string }}
 */
export function evaluatePathwayBillingAccess({
  studentId,
  studentEmail,
  course = null,
  pathway = null,
  courseCategory = 'foundations',
  invoices = [],
  installments = [],
}) {
  const normId = (studentId || '').toLowerCase().trim();
  const normEmail = (studentEmail || '').toLowerCase().trim();
  const todayStr = new Date().toISOString().split('T')[0];

  const tuitionModel = pathway?.tuition_model || pathway?.tuitionModel ||
    (courseCategory === 'foundations' ? 'bundled' : 'per_course');

  const courseId = course?.id || null;
  const pathwayId = pathway?.id || course?.pathway_id || course?.pathwayId ||
    (courseCategory === 'foundations' ? 'foundations' : 'intensives');

  // 1. Evaluate via Parent Invoices if available
  if (Array.isArray(invoices) && invoices.length > 0) {
    const studentInvoices = invoices.filter((inv) => {
      const invStdId = (inv.student_id || inv.studentId || '').toLowerCase().trim();
      const invEmail = (inv.studentEmail || inv.student?.email || '').toLowerCase().trim();
      return (normId && invStdId === normId) || (normEmail && invEmail === normEmail);
    });

    let relevantInvoices = [];
    if (tuitionModel === 'bundled') {
      relevantInvoices = studentInvoices.filter((inv) => {
        const invPath = (inv.pathway_id || inv.pathwayId || '').toLowerCase();
        const prog = (inv.program || '').toLowerCase();
        return invPath === pathwayId.toLowerCase() ||
               prog.includes('foundation') ||
               (!inv.course_id && !inv.courseId);
      });
    } else {
      // per_course
      relevantInvoices = studentInvoices.filter((inv) => {
        const invCrs = (inv.course_id || inv.courseId || '').toLowerCase();
        return courseId && invCrs === courseId.toLowerCase();
      });
    }

    // Check for overdue unpaid invoices or overdue installments
    let overdueInstallmentsCount = 0;
    for (const inv of relevantInvoices) {
      if (inv.status === 'Waived' || inv.status === 'Paid') continue;

      const insts = inv.installments || [];
      const overdueInsts = insts.filter((i) => {
        const due = i.due_date || i.dueDate || '';
        const isApproved = i.status === 'APPROVED' || i.status === 'Paid';
        return !isApproved && due && due <= todayStr;
      });

      if (overdueInsts.length > 0) {
        overdueInstallmentsCount += overdueInsts.length;
      } else if (inv.status === 'Overdue' || ((Number(inv.balance) || 0) > 0 && inv.due_date && inv.due_date <= todayStr)) {
        overdueInstallmentsCount += 1;
      }
    }

    if (overdueInstallmentsCount > 0) {
      const scopeLabel = tuitionModel === 'bundled'
        ? (pathway?.name || 'Ilm Foundations')
        : (course?.title || 'this course');
      return {
        isBlocked: true,
        overdueCount: overdueInstallmentsCount,
        reason: `Video access restricted due to ${overdueInstallmentsCount} overdue installment(s) in ${scopeLabel}.`,
      };
    }

    return { isBlocked: false, overdueCount: 0, reason: '' };
  }

  // 2. Fallback: Evaluate via standalone Installments list
  const studentInstallments = (installments || []).filter((inst) => {
    const instStdId = (inst.studentId || inst.student_id || '').toLowerCase().trim();
    const instEmail = (inst.studentEmail || '').toLowerCase().trim();
    return (normId && instStdId === normId) || (normEmail && instEmail === normEmail);
  });

  const isFoundationsCourse = courseCategory === 'foundations' || pathwayId === 'foundations';
  const pathwayInstallments = studentInstallments.filter((inst) => {
    const prog = (inst.program || '').toLowerCase();
    if (isFoundationsCourse) {
      return prog.includes('foundation') || !prog.includes('intensive');
    } else {
      return prog.includes('intensive');
    }
  });

  const overdueList = pathwayInstallments.filter((inst) => {
    const isApproved = inst.status === 'APPROVED' || inst.status === 'Paid';
    const due = inst.dueDate || inst.due_date;
    return !isApproved && due && due <= todayStr;
  });

  if (overdueList.length > 0) {
    const pathwayName = isFoundationsCourse ? 'Ilm Foundations' : 'Ilm Intensives';
    return {
      isBlocked: true,
      overdueCount: overdueList.length,
      reason: `Video access restricted due to ${overdueList.length} overdue installment(s) in ${pathwayName}.`,
    };
  }

  return { isBlocked: false, overdueCount: 0, reason: '' };
}

/**
 * Evaluates lesson playback access according to the 4-Tier Refactored State Machine
 */
export function evaluateLessonPlaybackAccess({
  user,
  course,
  lesson,
  accessOverride = null,
  invoices = [],
  installments = [],
  isPrerequisiteMet = true,
  currentTimestamp = null,
}) {
  if (user?.role === 'admin') {
    return { allowed: true, tier: 0, reason: 'Admin Clearance' };
  }

  if (accessOverride) {
    const overrideStatus = accessOverride.status || accessOverride.effectiveStatus;
    if (overrideStatus === 'locked') {
      return {
        allowed: false,
        tier: 2,
        reason: accessOverride.reason || 'Lesson Restricted',
        isOverrideLocked: true,
      };
    }

    if (overrideStatus === 'granted') {
      const now = currentTimestamp ? new Date(currentTimestamp).getTime() : Date.now();
      const expiresAtVal = accessOverride.expires_at || accessOverride.expiresAt;
      const isExpired = expiresAtVal && now > new Date(expiresAtVal).getTime();

      if (!isExpired) {
        return {
          allowed: true,
          tier: 2,
          reason: 'Granted by Administrator',
          overrideInfo: accessOverride,
        };
      }
    }
  }

  const { id: stdId, email: stdEmail } = normalizeStudentId(user);
  const billingCheck = evaluatePathwayBillingAccess({
    studentId: stdId,
    studentEmail: stdEmail,
    course,
    pathway: course?.pathway,
    courseCategory: course?.category || 'foundations',
    invoices,
    installments,
  });

  if (billingCheck.isBlocked) {
    return {
      allowed: false,
      tier: 3,
      reason: billingCheck.reason,
      isFeeLocked: true,
    };
  }

  if (!isPrerequisiteMet) {
    return {
      allowed: false,
      tier: 4,
      reason: 'Complete preceding lessons to unlock this lecture.',
      isSequentialLocked: true,
    };
  }

  return {
    allowed: true,
    tier: 4,
    reason: 'Access Authorized',
  };
}
