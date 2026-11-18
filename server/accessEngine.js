/**
 * 4-Tier Refactored Access Control Engine
 *
 * Implements strict, inverted evaluation order:
 * Tier 1: Course & Pathway Enrollment Check
 * Tier 2: Explicit Admin Override (Grant or Lock) -> Supercedes Fee & Prerequisites
 * Tier 3: Scoped Pathway Financial Ledger Check (Foundations vs Intensives)
 * Tier 4: Sequential Lesson Prerequisite Rule
 */

/**
 * Normalizes student identifiers across Firebase UID, roster ID, and email
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
 * Checks if a student is locked out of a specific pathway based on overdue fee installments.
 * Strictly scopes financial locks to the course's parent academic pathway.
 *
 * @param {object} params
 * @param {string} params.studentId - Normalized student ID or email
 * @param {string} params.studentEmail - Normalized student email
 * @param {string} params.courseCategory - 'foundations' | 'intensives'
 * @param {Array}  params.installments - Fee installment records
 * @returns {{ isBlocked: boolean, overdueCount: number, reason: string }}
 */
export function evaluatePathwayBillingAccess({
  studentId,
  studentEmail,
  courseCategory = 'foundations',
  installments = [],
}) {
  const normId = (studentId || '').toLowerCase().trim();
  const normEmail = (studentEmail || '').toLowerCase().trim();
  const todayStr = new Date().toISOString().split('T')[0];

  // Match installments belonging to this student
  const studentInstallments = (installments || []).filter((inst) => {
    const instStdId = (inst.studentId || '').toLowerCase().trim();
    const instEmail = (inst.studentEmail || '').toLowerCase().trim();
    return (normId && instStdId === normId) || (normEmail && instEmail === normEmail);
  });

  // Filter installments for the specific academic pathway
  // e.g., 'foundations' corresponds to 'Ilm Foundations', 'intensives' to 'Ilm Intensives'
  const isFoundationsCourse = courseCategory === 'foundations';
  const pathwayInstallments = studentInstallments.filter((inst) => {
    const prog = (inst.program || '').toLowerCase();
    if (isFoundationsCourse) {
      return prog.includes('foundation') || !prog.includes('intensive');
    } else {
      return prog.includes('intensive');
    }
  });

  // Find overdue unpaid/unapproved installments
  const overdueList = pathwayInstallments.filter(
    (inst) => inst.status !== 'APPROVED' && inst.dueDate <= todayStr
  );

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
 *
 * @param {object} params
 * @param {object} params.user - Active user object { id, email, role }
 * @param {object} params.course - Course object { id, category, modules }
 * @param {object} params.lesson - Target lesson object { id, title, type }
 * @param {object} params.accessOverride - Active override for this lesson (if any)
 * @param {Array}  params.installments - Array of fee installment records
 * @param {boolean} params.isPrerequisiteMet - Whether preceding lessons in sequence are completed
 * @returns {{ allowed: boolean, tier: number, reason: string, overrideInfo?: object }}
 */
export function evaluateLessonPlaybackAccess({
  user,
  course,
  lesson,
  accessOverride = null,
  installments = [],
  isPrerequisiteMet = true,
}) {
  // Admins always have full playback clearance
  if (user?.role === 'admin') {
    return { allowed: true, tier: 0, reason: 'Admin Clearance' };
  }

  // TIER 1: Course Category / Enrollment
  // (Caller ensures student is enrolled in course catalog)

  // TIER 2: Explicit Admin Override (Supercedes all billing and prerequisite locks)
  if (accessOverride) {
    if (accessOverride.status === 'locked') {
      return {
        allowed: false,
        tier: 2,
        reason: accessOverride.reason || 'Lesson restricted.',
        isOverrideLocked: true,
      };
    }

    if (accessOverride.status === 'granted') {
      const now = Date.now();
      const isExpired =
        accessOverride.durationType === '7_days' &&
        accessOverride.expiresAt &&
        now > accessOverride.expiresAt;

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

  // TIER 3: Scoped Pathway Financial Ledger Check
  const { id: stdId, email: stdEmail } = normalizeStudentId(user);
  const billingCheck = evaluatePathwayBillingAccess({
    studentId: stdId,
    studentEmail: stdEmail,
    courseCategory: course?.category || 'foundations',
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

  // TIER 4: Sequential Lesson Prerequisites
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
