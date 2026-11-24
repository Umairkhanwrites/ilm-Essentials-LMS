/**
 * useSupabaseData — Production React Data Hooks for Supabase PostgreSQL
 *
 * Implements real-time queries, caching, and state synchronization
 * for the Ilm Essentials LMS platform.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase.js';
import { compressReceiptImage, sanitizeNoBase64 } from '../utils/imageCompression.js';

/**
 * Hook to retrieve all published academic courses with instructor & pathway relations
 */
export function useSupabaseCourses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:instructors(*),
          pathway:pathways(*)
        `)
        .order('id', { ascending: true });

      if (fetchErr) throw fetchErr;
      setCourses(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching Supabase courses:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, isLoading, error, refetch: fetchCourses };
}

/**
 * Hook to retrieve student profiles (Admin view or individual student view)
 */
export function useSupabaseStudents() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });

      if (fetchErr) throw fetchErr;
      setStudents(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching Supabase students:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, isLoading, error, refetch: fetchStudents };
}

/**
 * Normalize a Supabase invoice record with its nested student and installments
 * to match LMS component expectations (camelCase + snake_case compatibility).
 */
export function normalizeInvoice(inv) {
  if (!inv) return null;
  const student = inv.student || {};
  const rawInsts = Array.isArray(inv.installments) ? [...inv.installments] : [];
  // Sort installments chronologically by installment number or due date
  rawInsts.sort((a, b) => {
    if (a.installment_number && b.installment_number) return a.installment_number - b.installment_number;
    return new Date(a.due_date || 0) - new Date(b.due_date || 0);
  });

  const installments = rawInsts.map((inst, idx) => ({
    ...inst,
    id: inst.id,
    invoiceId: inv.id,
    invoiceNo: inv.invoice_no,
    installmentNumber: inst.installment_number || idx + 1,
    title: inst.title,
    amount: Number(inst.amount) || 0,
    dueDate: inst.due_date,
    status: inst.status,
    paidAmount: inst.status === 'APPROVED' ? Number(inst.amount) : (Number(inst.paid_amount) || 0),
    paidDate: inst.paid_date || inst.approved_at?.split('T')[0] || null,
    paymentMethod: inst.payment_method || 'Bank Transfer',
    transactionRef: inst.transaction_ref || inst.challan_no || 'TRX-DEFAULT',
    challanNo: inst.challan_no || '23528335',
    receiptUrl: inst.receipt_image_url || inst.receipt_url,
    receiptImageUrl: inst.receipt_image_url || inst.receipt_url,
    reviewNotes: inst.review_notes || inst.rejection_reason,
    rejectionReason: inst.rejection_reason || inst.review_notes,
    approvedBy: inst.approved_by,
    approvedAt: inst.approved_at,
    studentId: inv.student_id,
    studentName: student.name || 'Student',
    studentEmail: student.email || '',
    studentAvatar: student.avatar_url || '',
  }));

  const baseFee = Number(inv.base_fee) || 0;
  const discountAmount = Number(inv.discount_amount) || 0;
  const netPayable = Number(inv.net_payable) || Math.max(0, baseFee - discountAmount);
  const paidAmount = Number(inv.paid_amount) || 0;
  const balance = Number(inv.balance) ?? Math.max(0, netPayable - paidAmount);

  return {
    ...inv,
    id: inv.id,
    invoiceNo: inv.invoice_no,
    studentId: inv.student_id,
    studentName: student.name || 'Student',
    studentEmail: student.email || '',
    studentAvatar: student.avatar_url || '',
    program: inv.pathway_id || inv.course_id || student.cohort_id || 'Islamic Studies',
    courseId: inv.course_id,
    pathwayId: inv.pathway_id,
    cohortId: inv.cohort_id,
    baseFee,
    discountType: inv.discount_type || (discountAmount > 0 ? 'fixed' : 'none'),
    discountValue: Number(inv.discount_value) || discountAmount,
    discountAmount,
    discountReason: inv.discount_reason || '',
    discountApprovedBy: inv.discount_approved_by || '',
    netPayable,
    totalAmount: netPayable,
    paidAmount,
    balance,
    status: inv.status,
    dueDate: inv.due_date,
    paymentPlan: installments.length > 1 ? `installments_${installments.length}` : 'lump_sum',
    installments,
    paymentHistory: installments
      .filter((i) => i.status === 'APPROVED' || i.paidAmount > 0)
      .map((i) => ({
        id: `pay_${i.id}`,
        amount: i.paidAmount || i.amount,
        paidDate: i.paidDate || i.dueDate,
        paymentMethod: i.paymentMethod || 'Bank Transfer',
        transactionRef: i.transactionRef || 'TRX-DEFAULT',
        installmentId: i.id,
        notes: i.title,
      })),
  };
}

/**
 * Hook to retrieve financial ledger (Invoices with linked Fee Installments)
 */
export function useSupabaseInvoices(studentId = null) {
  const [invoices, setInvoices] = useState([]);
  const [rawInvoices, setRawInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      let query = supabase
        .from('invoices')
        .select(`
          *,
          student:students(*),
          installments:fee_installments(*)
        `)
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const normalized = (data || []).map(normalizeInvoice);
      setInvoices(normalized);
      setRawInvoices(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching Supabase invoices:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, rawInvoices, isLoading, error, refetch: fetchInvoices };
}

/**
 * Hook to retrieve weekly timetable schedule slots
 */
export function useSupabaseSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('schedule_slots')
        .select(`
          *,
          course:courses(id, title, format),
          instructor:instructors(id, name, avatar_url)
        `)
        .eq('status', 'active')
        .order('start_time', { ascending: true });

      if (fetchErr) throw fetchErr;
      setSchedule(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching Supabase schedule:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return { schedule, isLoading, error, refetch: fetchSchedule };
}

/**
 * Hook to retrieve daily quotes and wisdom
 */
export function useSupabaseDailyQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQuotes() {
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('daily_quotes')
          .select('*')
          .eq('active', true)
          .order('pinned', { ascending: false });
        setQuotes(data || []);
      } catch (e) {
        console.warn('Quotes load note:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuotes();
  }, []);

  return { quotes, isLoading };
}

/**
 * Mutation Hook: Student submits payment receipt proof via secure RPC & Supabase Storage
 */
export function useSubmitReceiptProof() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitProof = useCallback(async (installmentId, receiptUrlOrFile, studentId = null) => {
    setIsSubmitting(true);
    setError(null);
    try {
      let finalReceiptUrl = typeof receiptUrlOrFile === 'string' ? receiptUrlOrFile : '';

      // If a File object is provided and Supabase is configured, compress and upload to storage
      if (typeof File !== 'undefined' && receiptUrlOrFile instanceof File && isSupabaseConfigured) {
        // 1. Client-Side Image Compression (< 150 KB WebP, max 1000px, 10MB limit)
        let fileToUpload = receiptUrlOrFile;
        try {
          fileToUpload = await compressReceiptImage(receiptUrlOrFile);
        } catch (compErr) {
          console.warn('Image compression note:', compErr.message);
        }

        const fileExt = fileToUpload.name.split('.').pop() || (fileToUpload.type === 'image/webp' ? 'webp' : 'png');
        const uid = studentId || (await supabase.auth.getUser()).data.user?.id || 'anonymous';
        const filePath = `${uid}/${Date.now()}_receipt.${fileExt}`;

        // 2. Fetch existing installment to detect and delete orphaned prior slips
        let oldStoragePath = null;
        try {
          const { data: instData } = await supabase
            .from('fee_installments')
            .select('receipt_image_url')
            .eq('id', installmentId)
            .maybeSingle();

          const existingUrl = instData?.receipt_image_url;
          if (
            existingUrl &&
            !existingUrl.startsWith('http://') &&
            !existingUrl.startsWith('https://') &&
            !existingUrl.startsWith('data:') &&
            existingUrl !== filePath
          ) {
            oldStoragePath = existingUrl;
          }
        } catch (fetchOldErr) {
          console.warn('Failed to inspect existing receipt path:', fetchOldErr.message);
        }

        // 3. Upload compressed receipt
        const { error: uploadErr } = await supabase.storage
          .from('receipts')
          .upload(filePath, fileToUpload, { upsert: true });

        if (uploadErr) {
          console.warn('Storage upload warning:', uploadErr.message);
        } else {
          // Store ONLY the relative storage path to prevent expired temporary signed links
          finalReceiptUrl = filePath;

          // 4. Auto-delete orphaned previous slip to stay within 1 GB Free Tier quota
          if (oldStoragePath) {
            try {
              await supabase.storage.from('receipts').remove([oldStoragePath]);
            } catch (removeErr) {
              console.warn('Failed to remove old receipt slip:', removeErr.message);
            }
          }
        }
      }

      if (!finalReceiptUrl && typeof receiptUrlOrFile === 'string') {
        finalReceiptUrl = receiptUrlOrFile;
      }

      const { data, error: rpcErr } = await supabase.rpc('submit_receipt_proof', {
        p_installment_id: installmentId,
        p_receipt_url: finalReceiptUrl,
      });

      if (rpcErr) throw rpcErr;
      return { success: true, data, receiptUrl: finalReceiptUrl };
    } catch (err) {
      console.error('Failed to submit receipt proof:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submitProof, isSubmitting, error };
}

/**
 * On-the-fly Signed URL Resolver for Private Storage Objects (e.g. receipts)
 * If the path is relative, generates a fresh short-lived signed URL (defaults to 3600s / 1 hour).
 * If the value is already an HTTP URL or Base64 data string, passes it through directly.
 */
export async function resolveReceiptUrl(pathOrUrl, expiresIn = 3600) {
  if (!pathOrUrl) return null;
  const str = String(pathOrUrl).trim();
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) {
    return str;
  }
  if (!isSupabaseConfigured) return str;
  try {
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(str, expiresIn);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('Receipt signed URL resolution warning:', err);
  }
  return str;
}

/**
 * Admin Financial Actions (Direct Supabase mutations with Trigger A real-time sync)
 */
export async function approveInstallmentSupabase(installmentId, adminName = 'Administrator') {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('fee_installments')
      .update({
        status: 'APPROVED',
        approved_by: adminName,
        approved_at: new Date().toISOString(),
      })
      .eq('id', installmentId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to approve installment in Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function rejectInstallmentSupabase(installmentId, reason, adminName = 'Administrator') {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('fee_installments')
      .update({
        status: 'REJECTED',
        rejection_reason: reason,
        approved_by: adminName,
        approved_at: new Date().toISOString(),
      })
      .eq('id', installmentId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to reject installment in Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function applyDiscountSupabase({ invoiceId, discountType, discountValue, discountReason, approvedBy, baseFee = 30000 }) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const base = Number(baseFee) || 30000;
    const val = Number(discountValue) || 0;
    let discAmt = 0;
    if (discountType === 'fixed') discAmt = Math.min(base, val);
    else if (discountType === 'percentage') discAmt = Math.round((base * Math.min(100, Math.max(0, val))) / 100);
    else if (discountType === 'waiver') discAmt = base;

    const net = Math.max(0, base - discAmt);
    const updatePayload = {
      discount_amount: discAmt,
      net_payable: net,
      discount_reason: discountReason || null,
      ...(net === 0 ? { status: 'Waived' } : {}),
    };

    const { data, error } = await supabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', invoiceId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to apply discount in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Hook to retrieve all academic batches / intakes with pathway and course instructor assignments
 */
export function useSupabaseBatches() {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBatches = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('batches')
        .select(`
          *,
          pathway:pathways(*),
          course:courses(id, title, category, thumbnail_url),
          course_instructors:batch_course_instructors(
            id,
            course_id,
            instructor_id,
            instructor:instructors(*)
          )
        `)
        .order('start_date', { ascending: false });

      if (fetchErr) throw fetchErr;
      setBatches(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching Supabase batches:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return { batches, isLoading, error, refetch: fetchBatches };
}

/**
 * UUID syntax validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * RFC4122 v4 UUID generator (works in browser and Node)
 */
export function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Helper to resolve student UUID from email, roster ID, or raw UUID
 */
export async function resolveStudentUuid(studentIdentifier) {
  if (!studentIdentifier || !isSupabaseConfigured) return null;
  const str = String(studentIdentifier).trim();
  if (UUID_REGEX.test(str)) return str;

  try {
    if (str.includes('@')) {
      const { data } = await supabase.from('students').select('id').eq('email', str.toLowerCase()).maybeSingle();
      if (data?.id) return data.id;
    }

    const { data: allStds } = await supabase.from('students').select('id, name, email');
    if (Array.isArray(allStds)) {
      const match = allStds.find(
        (s) => (s.id && s.id === str) ||
               (s.email && s.email.toLowerCase() === str.toLowerCase()) ||
               (s.name && s.name.toLowerCase() === str.toLowerCase())
      );
      if (match?.id) return match.id;
    }
  } catch (err) {
    console.warn('Student UUID resolution warning:', err);
  }
  return null;
}

/**
 * Helper to resolve lesson UUID from lesson ID or title
 */
export async function resolveLessonUuid(lessonIdentifier, courseId = null) {
  if (!lessonIdentifier || !isSupabaseConfigured) return null;
  const str = String(lessonIdentifier).trim();
  if (UUID_REGEX.test(str)) return str;

  try {
    const { data: allLessons } = await supabase.from('lessons').select('id, title, module:modules(course_id)');
    if (Array.isArray(allLessons)) {
      const match = allLessons.find(
        (l) => (l.id && l.id === str) ||
               (l.title && l.title.toLowerCase().trim() === str.toLowerCase().trim()) ||
               (courseId && l.module?.course_id === courseId && l.title.includes(str))
      );
      if (match?.id) return match.id;
    }
  } catch (err) {
    console.warn('Lesson UUID resolution warning:', err);
  }
  return null;
}

/**
 * Hook to retrieve Attendance Sessions with child records
 */
export function useSupabaseAttendance(courseId = null, cohortId = null) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      let query = supabase
        .from('attendance_sessions')
        .select(`
          *,
          course:courses(id, title),
          cohort:batches(id, name),
          lesson:lessons(id, title),
          records:attendance_records(student_id, status)
        `)
        .order('session_date', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      if (cohortId) {
        query = query.eq('cohort_id', cohortId);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const normalized = (data || []).map((s) => {
        const recordsMap = {};
        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;

        (s.records || []).forEach((r) => {
          recordsMap[r.student_id] = r.status;
          if (r.status === 'present') presentCount++;
          else if (r.status === 'late') lateCount++;
          else if (r.status === 'absent') absentCount++;
        });

        const totalEnrolled = (s.records || []).length;
        const rateNumber = totalEnrolled > 0
          ? Math.min(100, Math.max(0, Math.round(((presentCount + lateCount * 0.75) / totalEnrolled) * 100)))
          : 100;

        return {
          ...s,
          id: s.id,
          courseId: s.course_id,
          cohortId: s.cohort_id,
          courseTitle: s.course?.title || 'Course',
          cohortName: s.cohort?.name || 'Cohort',
          lessonId: s.lesson_id,
          date: s.session_date,
          sessionDate: s.session_date,
          topic: s.topic,
          deliveryMode: s.delivery_mode,
          records: recordsMap,
          totalEnrolled,
          presentCount,
          lateCount,
          absentCount,
          rateNumber,
          rate: `${rateNumber}%`,
        };
      });

      setSessions(normalized);
      setError(null);
    } catch (err) {
      console.error('Error fetching Supabase attendance sessions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, cohortId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return { sessions, isLoading, error, refetch: fetchAttendance };
}

/**
 * Save / Upsert Attendance Session and its Child Records to Supabase
 */
export async function saveAttendanceSessionSupabase({
  id = null,
  courseId,
  cohortId = null,
  lessonId = null,
  sessionDate,
  date = null,
  topic,
  deliveryMode = 'hybrid',
  records = {},
}) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const finalDate = sessionDate || date || new Date().toISOString().split('T')[0];

    // 1. Resolve cohortId if not directly provided
    let effectiveCohortId = cohortId;
    if (!effectiveCohortId) {
      // Find matching batch for course
      const { data: courseRow } = await supabase.from('courses').select('pathway_id').eq('id', courseId).maybeSingle();
      if (courseRow?.pathway_id) {
        const { data: batchRow } = await supabase
          .from('batches')
          .select('id')
          .eq('pathway_id', courseRow.pathway_id)
          .eq('status', 'active')
          .maybeSingle();
        effectiveCohortId = batchRow?.id || 'foundations_sem1';
      } else {
        effectiveCohortId = 'foundations_sem1';
      }
    }

    // 2. Resolve lesson UUID if lessonId or topic is provided
    let effectiveLessonId = null;
    if (lessonId) {
      effectiveLessonId = await resolveLessonUuid(lessonId, courseId);
    }

    const sessionPayload = {
      course_id: courseId,
      cohort_id: effectiveCohortId,
      lesson_id: effectiveLessonId,
      session_date: finalDate,
      topic: topic || `Class Session (${finalDate})`,
      delivery_mode: deliveryMode,
    };

    // If updating an existing session that already has a UUID
    if (id && UUID_REGEX.test(id)) {
      sessionPayload.id = id;
    }

    const { data: sessionData, error: sessErr } = await supabase
      .from('attendance_sessions')
      .upsert(sessionPayload)
      .select()
      .single();

    if (sessErr) throw sessErr;

    // 3. Upsert records into public.attendance_records
    if (records && typeof records === 'object') {
      const studentKeys = Object.keys(records);
      if (studentKeys.length > 0) {
        // Fetch all students to resolve keys to UUIDs
        const { data: allStds } = await supabase.from('students').select('id, name, email');
        const stdList = Array.isArray(allStds) ? allStds : [];

        const recordRows = [];
        for (const [key, rawStatus] of Object.entries(records)) {
          let stdUuid = null;
          if (UUID_REGEX.test(key)) {
            stdUuid = key;
          } else {
            const match = stdList.find(
              (s) => s.id === key ||
                     (s.email && s.email.toLowerCase() === key.toLowerCase()) ||
                     (s.name && s.name.toLowerCase() === key.toLowerCase())
            );
            stdUuid = match?.id || null;
          }

          if (stdUuid) {
            recordRows.push({
              session_id: sessionData.id,
              student_id: stdUuid,
              status: ['present', 'late', 'absent'].includes(rawStatus) ? rawStatus : 'present',
            });
          }
        }

        if (recordRows.length > 0) {
          const { error: recErr } = await supabase
            .from('attendance_records')
            .upsert(recordRows, { onConflict: 'session_id,student_id' });

          if (recErr) console.warn('Attendance records upsert notice:', recErr.message);
        }
      }
    }

    return { success: true, session: sessionData };
  } catch (err) {
    console.error('Failed to save attendance session in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete Attendance Session from Supabase (cascades to records)
 */
export async function deleteAttendanceSessionSupabase(sessionId) {
  if (!isSupabaseConfigured || !sessionId) return { success: false };
  try {
    if (UUID_REGEX.test(sessionId)) {
      const { error } = await supabase.from('attendance_sessions').delete().eq('id', sessionId);
      if (error) throw error;
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to delete attendance session from Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Hook to retrieve Lesson Access Overrides
 */
export function useSupabaseAccessOverrides(courseId = null) {
  const [overrides, setOverrides] = useState([]);
  const [overridesMap, setOverridesMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverrides = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('lesson_access_overrides')
        .select(`
          *,
          student:students(id, name, email),
          lesson:lessons(id, title, module:modules(course_id, title))
        `);

      if (fetchErr) throw fetchErr;

      let list = data || [];
      if (courseId) {
        list = list.filter((o) => o.lesson?.module?.course_id === courseId);
      }

      const map = {};
      const now = Date.now();
      list.forEach((o) => {
        const isExpired = o.expires_at && now > new Date(o.expires_at).getTime();
        const effectiveStatus = isExpired ? 'default' : o.status;
        const key = `${o.student_id}_${o.lesson_id}`;
        map[key] = {
          ...o,
          studentName: o.student?.name || 'Student',
          studentEmail: o.student?.email || '',
          lessonTitle: o.lesson?.title || 'Lecture',
          isExpired,
          effectiveStatus,
        };
      });

      setOverrides(list);
      setOverridesMap(map);
      setError(null);
    } catch (err) {
      console.error('Error fetching Supabase access overrides:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  return { overrides, overridesMap, isLoading, error, refetch: fetchOverrides };
}

/**
 * Upsert or Remove Lesson Access Override in Supabase
 */
export async function setLessonAccessOverrideSupabase({
  studentId,
  studentEmail = '',
  lessonId,
  lessonTitle = '',
  courseId = null,
  status = 'default', // 'granted' | 'locked' | 'default'
  durationType = '7_days', // '7_days' | 'lifetime'
  expiresAt = null,
  reason = '',
  adminName = 'Administrator',
}) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const studentUuid = await resolveStudentUuid(studentId || studentEmail);
    const lessonUuid = await resolveLessonUuid(lessonId || lessonTitle, courseId);

    if (!studentUuid || !lessonUuid) {
      console.warn('Could not resolve student or lesson UUID for override:', { studentId, lessonId });
      return { success: false, error: 'Invalid student or lesson ID' };
    }

    // If resetting to default: remove override row
    if (status === 'default') {
      const { error: delErr } = await supabase
        .from('lesson_access_overrides')
        .delete()
        .eq('student_id', studentUuid)
        .eq('lesson_id', lessonUuid);

      if (delErr) throw delErr;
      return { success: true, status: 'default' };
    }

    // Determine expires_at timestamp
    let finalExpiresAt = null;
    if (status === 'granted') {
      if (durationType === '7_days') {
        finalExpiresAt = expiresAt || new Date(Date.now() + 7 * 86400000).toISOString();
      } else {
        finalExpiresAt = null; // Lifetime / permanent
      }
    }

    const { data, error } = await supabase
      .from('lesson_access_overrides')
      .upsert(
        {
          student_id: studentUuid,
          lesson_id: lessonUuid,
          status,
          expires_at: finalExpiresAt,
          reason: reason || null,
          admin_name: adminName || 'Administrator',
        },
        { onConflict: 'student_id,lesson_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to set lesson access override in Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteLessonAccessOverrideSupabase(studentId, lessonId) {
  return setLessonAccessOverrideSupabase({ studentId, lessonId, status: 'default' });
}

/**
 * On-the-fly Signed URL Resolver for e-Library Documents
 * - If storagePath starts with http:// or https:// (e.g. Cloudflare R2 / Bunny Storage),
 *   it directly returns the CDN URL without Supabase storage egress.
 * - Otherwise, generates a signed URL from the private 'library_docs' Supabase bucket.
 */
export async function resolveLibraryPdfUrl(storagePathOrUrl, expiresIn = 7200) {
  if (!storagePathOrUrl) return null;
  const str = String(storagePathOrUrl).trim();
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str; // External CDN: Bunny / Cloudflare R2 direct delivery (0 egress)
  }
  if (!isSupabaseConfigured) return str;
  try {
    const { data, error } = await supabase.storage
      .from('library_docs')
      .createSignedUrl(str, expiresIn);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('Library signed URL resolution warning:', err);
  }
  return str;
}

/**
 * Reactive Hook for e-Library Catalog
 * Fetches published books from public.library_items with real-time subscription
 */
export function useSupabaseLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const { data, error: sbErr } = await supabase
        .from('library_items')
        .select('*')
        .order('featured', { ascending: false })
        .order('title', { ascending: true });

      if (sbErr) throw sbErr;
      setItems(data || []);
      setError(null);
    } catch (err) {
      console.warn('Supabase library fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('public:library_items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'library_items' },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  return { items, loading, error, refetch: fetchItems };
}

/**
 * Mutation: Save / Edit Library Resource in Supabase (with direct external CDN support)
 */
export async function saveLibraryItemSupabase(itemData) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const payload = {
      title: itemData.title?.trim(),
      title_arabic: (itemData.title_arabic || itemData.titleArabic || '').trim() || null,
      author: itemData.author?.trim() || 'Faculty of Ilm Essentials',
      category: itemData.category || 'General',
      type: itemData.type || 'reference',
      language: itemData.language || 'Arabic / English',
      pages: Number(itemData.pages) || 0,
      storage_path: (itemData.storage_path || itemData.storagePath || itemData.downloadUrl || itemData.externalUrl || '').trim(),
      file_size_bytes: Number(itemData.file_size_bytes || itemData.fileSizeBytes) || 0,
      is_download_allowed: itemData.is_download_allowed !== undefined ? Boolean(itemData.is_download_allowed) : true,
      featured: Boolean(itemData.featured),
      status: itemData.status || 'published',
    };

    let result;
    if (itemData.id && UUID_REGEX.test(itemData.id)) {
      result = await supabase
        .from('library_items')
        .update(payload)
        .eq('id', itemData.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('library_items')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) throw result.error;
    return { success: true, data: result.data };
  } catch (err) {
    console.error('Failed to save library item to Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Delete Library Resource from Supabase
 */
export async function deleteLibraryItemSupabase(id) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase
      .from('library_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Failed to delete library item from Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Reactive Hook for Daily Wisdom & Quotes (public.daily_quotes)
 */
export function useSupabaseQuotes(includeInactive = false) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuotes = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      let query = supabase
        .from('daily_quotes')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('active', true);
      }

      const { data, error: sbErr } = await query;
      if (sbErr) throw sbErr;
      setQuotes(data || []);
      setError(null);
    } catch (err) {
      console.warn('Supabase quotes fetch note:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchQuotes();
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('public:daily_quotes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_quotes' },
        () => {
          fetchQuotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQuotes]);

  return { quotes, loading, error, refetch: fetchQuotes };
}

/**
 * Mutation: Save / Edit Daily Quote in Supabase
 */
export async function saveQuoteSupabase(quoteData) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const payload = {
      text: quoteData.text?.trim(),
      source: quoteData.source?.trim() || 'Hadith',
      type: quoteData.type || 'hadith',
      pinned: Boolean(quoteData.pinned),
      active: quoteData.active !== undefined ? Boolean(quoteData.active) : true,
    };

    let result;
    if (quoteData.id && UUID_REGEX.test(quoteData.id)) {
      result = await supabase
        .from('daily_quotes')
        .update(payload)
        .eq('id', quoteData.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('daily_quotes')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) throw result.error;
    return { success: true, data: result.data };
  } catch (err) {
    console.error('Failed to save quote in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Toggle Daily Quote Active State
 */
export async function toggleQuoteStatusSupabase(id, currentActive) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('daily_quotes')
      .update({ active: !currentActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to toggle quote active in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Delete Daily Quote from Supabase
 */
export async function deleteQuoteSupabase(id) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase
      .from('daily_quotes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Failed to delete quote from Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Reactive Hook for Admissions Applications (public.admissions_applications)
 */
export function useSupabaseAdmissions() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const { data, error: sbErr } = await supabase
        .from('admissions_applications')
        .select(`
          *,
          batch:batches(id, name, pathway_id)
        `)
        .order('created_at', { ascending: false });

      if (sbErr) throw sbErr;
      setApplications(data || []);
      setError(null);
    } catch (err) {
      console.warn('Supabase admissions fetch note:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('public:admissions_applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admissions_applications' },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApplications]);

  return { applications, loading, error, refetch: fetchApplications };
}

/**
 * Mutation: Public candidate submits admissions application
 * Works seamlessly for unauthenticated anon users via public RLS INSERT policy
 */
export async function submitApplicationSupabase(appData) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const payload = {
      applicant_name: (appData.name || appData.applicant_name || '').trim(),
      applicant_email: (appData.email || appData.applicant_email || '').trim().toLowerCase(),
      applicant_phone: (appData.phone || appData.applicant_phone || '').trim(),
      applied_pathway_id: appData.pathway_id || appData.applied_pathway_id || 'foundations',
      applied_cohort_id: appData.cohort_id || appData.applied_cohort_id || null,
      preferred_format: appData.format || appData.preferred_format || 'online',
      prior_islamic_education: appData.prior_islamic_education || appData.education || null,
      statement_of_intent: appData.statement_of_intent || appData.statement || null,
      status: 'SUBMITTED',
    };

    const { error } = await supabase
      .from('admissions_applications')
      .insert(payload);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Failed to submit application to Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Admin updates admissions application status / links converted student
 */
export async function updateApplicationStatusSupabase(applicationId, status, convertedStudentId = null, reviewerNotes = null) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const updatePayload = {
      status,
      ...(convertedStudentId ? { converted_student_id: convertedStudentId } : {}),
      ...(reviewerNotes ? { reviewer_notes: reviewerNotes } : {}),
    };

    const { data, error } = await supabase
      .from('admissions_applications')
      .update(updatePayload)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to update application status in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Create or update an Academic Pathway Intake / Batch
 * Supports both bundled program cohorts (e.g. Ilm Foundations) and standalone course intakes (e.g. Ilm Intensives)
 */
export async function savePathwayIntakeSupabase(intakeData) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const batchId = (intakeData.id || intakeData.code || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!batchId) throw new Error('A unique Batch ID / Code is required');

    const payload = {
      id: batchId,
      pathway_id: intakeData.pathway_id || 'foundations',
      name: (intakeData.name || '').trim(),
      cohort_group: (intakeData.cohort_group || batchId).trim(),
      semester: intakeData.semester ? parseInt(intakeData.semester, 10) : 1,
      course_id: intakeData.course_id || null,
      start_date: intakeData.start_date || null,
      end_date: intakeData.end_date || null,
      tuition_fee: intakeData.tuition_fee !== undefined && intakeData.tuition_fee !== '' && intakeData.tuition_fee !== null ? parseInt(intakeData.tuition_fee, 10) : null,
      status: intakeData.status || 'active',
    };

    const { data, error } = await supabase
      .from('batches')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;

    // Handle course instructor overrides if provided
    if (intakeData.instructors && Array.isArray(intakeData.instructors) && intakeData.instructors.length > 0) {
      const instructorRows = intakeData.instructors
        .filter(item => item.course_id && item.instructor_id)
        .map(item => ({
          cohort_id: batchId,
          course_id: item.course_id,
          instructor_id: item.instructor_id,
        }));

      if (instructorRows.length > 0) {
        const { error: instErr } = await supabase
          .from('batch_course_instructors')
          .upsert(instructorRows, { onConflict: 'cohort_id,course_id' });
        if (instErr) console.warn('Warning: Failed to assign some batch instructors:', instErr);
      }
    } else if (intakeData.course_id && intakeData.instructor_id) {
      // Single course instructor assignment (e.g. for Intensives)
      const { error: singleInstErr } = await supabase
        .from('batch_course_instructors')
        .upsert({
          cohort_id: batchId,
          course_id: intakeData.course_id,
          instructor_id: intakeData.instructor_id,
        }, { onConflict: 'cohort_id,course_id' });
      if (singleInstErr) console.warn('Warning: Failed to assign intensive instructor:', singleInstErr);
    }

    return { success: true, data };
  } catch (err) {
    console.error('Failed to save pathway intake in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Advance a cohort to its next semester (e.g. Semester 1 -> Semester 2)
 * Creates the new semester intake row, links courses for that semester, auto-enrolls existing students,
 * updates students' active cohort_id, and optionally creates next semester invoices.
 */
export async function advanceBatchSemesterSupabase({
  fromBatchId,
  targetSemester,
  newBatchId,
  newBatchName,
  startDate,
  endDate,
  tuitionFee,
  status = 'active',
  autoEnrollStudents = true,
  issueInvoice = true,
  studentIds = null,
}) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const cleanNewBatchId = (newBatchId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!cleanNewBatchId) throw new Error('New Batch ID is required.');

    const rpcParams = {
      p_from_batch_id: fromBatchId,
      p_new_batch_id: cleanNewBatchId,
      p_new_batch_name: (newBatchName || '').trim(),
      p_target_semester: parseInt(targetSemester, 10) || 2,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_tuition_fee: tuitionFee !== undefined && tuitionFee !== '' && tuitionFee !== null ? parseInt(tuitionFee, 10) : null,
      p_status: status || 'active',
      p_auto_enroll: autoEnrollStudents,
      p_issue_invoice: issueInvoice,
      p_student_ids: studentIds && Array.isArray(studentIds) && studentIds.length > 0 ? studentIds : null,
    };

    const { data, error } = await supabase.rpc('advance_batch_semester', rpcParams);

    if (error) throw error;

    return {
      success: true,
      batchId: cleanNewBatchId,
      enrolledCount: data?.students_advanced_count || 0,
      coursesCount: data?.target_courses_count || 0,
      invoicesIssued: data?.invoices_issued || 0,
      data,
    };
  } catch (err) {
    console.error('Failed to advance batch semester in Supabase via RPC:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Delete an Academic Pathway Intake / Batch
 * Blocked if students are active in the batch to preserve academic records.
 */
export async function deletePathwayIntakeSupabase(batchId) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const { count: studentCount, error: countErr } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', batchId);

    if (countErr) throw countErr;
    if (studentCount > 0) {
      throw new Error(`Cannot delete batch '${batchId}' because it has ${studentCount} active student(s) linked to it. Please archive the batch instead.`);
    }

    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', batchId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Failed to delete pathway intake in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Normalize an Academic Pathway record from Supabase
 * Ensures camelCase and snake_case properties are both populated.
 */
export function normalizePathway(p) {
  if (!p) return null;
  const isCohort = p.type === 'cohort' || p.programStructure === 'multi_semester';
  const semesters = Number(p.semesters) || (isCohort ? 2 : 1);
  return {
    ...p,
    id: p.id,
    slug: p.slug || p.id,
    name: p.name,
    subtitle: p.subtitle || '',
    description: p.description || '',
    type: isCohort ? 'cohort' : 'modular',
    programStructure: isCohort ? 'multi_semester' : 'single_course',
    duration: p.duration || (isCohort ? `${semesters * 4} Months (${semesters} Semesters)` : '4 Weeks'),
    semesters,
    semesterNames: Array.isArray(p.semesterNames) && p.semesterNames.length > 0
      ? p.semesterNames
      : Array.from({ length: semesters }, (_, i) => `Semester ${i + 1}`),
    tuitionModel: p.tuition_model || p.tuitionModel || (isCohort ? 'bundled' : 'per_course'),
    tuition_model: p.tuition_model || p.tuitionModel || (isCohort ? 'bundled' : 'per_course'),
    defaultTuitionFee: Number(p.default_tuition_fee ?? p.defaultTuitionFee) || 0,
    default_tuition_fee: Number(p.default_tuition_fee ?? p.defaultTuitionFee) || 0,
    color: p.color || 'emerald',
    icon: p.icon || 'GraduationCap',
    status: p.status || 'Active',
  };
}

/**
 * Normalize an Instructor record from Supabase
 * Ensures camelCase and snake_case properties are both populated.
 */
export function normalizeInstructor(inst) {
  if (!inst) return null;
  return {
    ...inst,
    id: inst.id,
    name: inst.name,
    title: inst.title || 'Instructor of Islamic Sciences',
    specialization: inst.specialization || '',
    bio: inst.bio || '',
    email: inst.email || '',
    phone: inst.phone || '',
    avatar: inst.avatar_url || inst.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    avatar_url: inst.avatar_url || inst.avatar || '',
    status: inst.status || 'Active',
    assignedCourses: inst.assignedCourses || [],
  };
}

/**
 * Hook to retrieve all academic pathways from Supabase
 */
export function useSupabasePathways() {
  const [pathways, setPathways] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPathways = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('pathways')
        .select('*')
        .order('name', { ascending: true });

      if (fetchErr) throw fetchErr;
      setPathways((data || []).map(normalizePathway));
      setError(null);
    } catch (err) {
      console.error('Error fetching Supabase pathways:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPathways();
  }, [fetchPathways]);

  return { pathways, isLoading, error, refetch: fetchPathways };
}

/**
 * Hook to retrieve all instructors / faculty scholars from Supabase
 */
export function useSupabaseInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInstructors = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('instructors')
        .select('*')
        .order('name', { ascending: true });

      if (fetchErr) throw fetchErr;
      setInstructors((data || []).map(normalizeInstructor));
      setError(null);
    } catch (err) {
      console.error('Error fetching Supabase instructors:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  return { instructors, isLoading, error, refetch: fetchInstructors };
}

/**
 * Mutation: Create or Update an Academic Pathway in Supabase
 */
export async function savePathwaySupabase(pathwayData) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const rawName = (pathwayData.name || '').trim();
    if (!rawName) throw new Error('Pathway name is required.');

    const cleanSlug = (pathwayData.slug || rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
    const cleanId = (pathwayData.id || cleanSlug).trim();

    const isCohort = pathwayData.type === 'cohort' || pathwayData.programStructure === 'multi_semester';
    const semesters = isCohort ? (Number(pathwayData.semesters) || 1) : 1;
    const tuitionModel = pathwayData.tuition_model || pathwayData.tuitionModel || (isCohort ? 'bundled' : 'per_course');

    const payload = {
      id: cleanId,
      slug: cleanSlug,
      name: rawName,
      subtitle: (pathwayData.subtitle || '').trim() || null,
      description: (pathwayData.description || '').trim() || null,
      type: isCohort ? 'cohort' : 'modular',
      duration: (pathwayData.duration || '').trim() || (isCohort ? `${semesters * 4} Months (${semesters} Semesters)` : '4 Weeks'),
      semesters,
      tuition_model: tuitionModel === 'bundled' ? 'bundled' : 'per_course',
      default_tuition_fee: Number(pathwayData.default_tuition_fee ?? pathwayData.defaultTuitionFee) || 0,
      color: pathwayData.color || 'emerald',
      icon: pathwayData.icon || 'GraduationCap',
    };

    const { data, error } = await supabase
      .from('pathways')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: normalizePathway(data) };
  } catch (err) {
    console.error('Failed to save academic pathway in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Delete an Academic Pathway from Supabase
 * Enforces foreign key safety by checking courses and batches first.
 */
export async function deletePathwaySupabase(pathwayId) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const cleanId = (pathwayId || '').trim();
    if (!cleanId) throw new Error('Pathway ID is required.');

    // Check course dependency
    const { count: courseCount, error: crsErr } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('pathway_id', cleanId);
    if (crsErr) throw crsErr;
    if (courseCount > 0) {
      throw new Error(`Cannot delete pathway '${cleanId}' because it is linked to ${courseCount} active course(s). Please reassign or delete them first.`);
    }

    // Check batch dependency
    const { count: batchCount, error: bErr } = await supabase
      .from('batches')
      .select('id', { count: 'exact', head: true })
      .eq('pathway_id', cleanId);
    if (bErr) throw bErr;
    if (batchCount > 0) {
      throw new Error(`Cannot delete pathway '${cleanId}' because it has ${batchCount} intake batch(es) linked to it. Please archive or delete those batches first.`);
    }

    const { error } = await supabase
      .from('pathways')
      .delete()
      .eq('id', cleanId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Failed to delete pathway in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Create or Update a Faculty Scholar / Instructor in Supabase
 */
export async function saveInstructorSupabase(instructorData) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const rawName = (instructorData.name || '').trim();
    if (!rawName) throw new Error('Instructor name is required.');

    const cleanId = (instructorData.id || `inst_${Date.now()}`).trim();
    const rawAvatar = (instructorData.avatar_url || instructorData.avatar || '').trim();
    // Do not store heavy base64 strings in PostgreSQL
    const cleanAvatar = rawAvatar.startsWith('data:') ? '' : rawAvatar;

    const payload = {
      id: cleanId,
      name: rawName,
      title: (instructorData.title || '').trim() || 'Instructor of Islamic Sciences',
      specialization: (instructorData.specialization || '').trim() || null,
      bio: (instructorData.bio || '').trim() || null,
      email: (instructorData.email || '').trim() || null,
      phone: (instructorData.phone || '').trim() || null,
      avatar_url: cleanAvatar || null,
      status: instructorData.status === 'On Leave' ? 'On Leave' : 'Active',
    };

    const { data, error } = await supabase
      .from('instructors')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: normalizeInstructor(data) };
  } catch (err) {
    console.error('Failed to save faculty scholar in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Delete a Faculty Scholar / Instructor from Supabase
 * Enforces relational integrity by checking courses, batches, and schedule slots.
 */
export async function deleteInstructorSupabase(instructorId) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const cleanId = (instructorId || '').trim();
    if (!cleanId) throw new Error('Instructor ID is required.');

    // Check course dependency
    const { count: courseCount, error: crsErr } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', cleanId);
    if (crsErr) throw crsErr;
    if (courseCount > 0) {
      throw new Error(`Cannot delete scholar because they are assigned as primary instructor to ${courseCount} course(s).`);
    }

    // Check batch course instructors
    const { count: batchInstCount, error: bInstErr } = await supabase
      .from('batch_course_instructors')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', cleanId);
    if (bInstErr) throw bInstErr;
    if (batchInstCount > 0) {
      throw new Error(`Cannot delete scholar because they are assigned to ${batchInstCount} cohort batch intake(s).`);
    }

    // Check schedule slots
    const { count: slotCount, error: slotErr } = await supabase
      .from('schedule_slots')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', cleanId);
    if (slotErr) throw slotErr;
    if (slotCount > 0) {
      throw new Error(`Cannot delete scholar because they are scheduled for ${slotCount} timetable lecture slot(s).`);
    }

    const { error } = await supabase
      .from('instructors')
      .delete()
      .eq('id', cleanId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Failed to delete instructor in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Create or Update a Course in Supabase
 * Upserts public.courses, and upserts its modules and lessons, preserving existing lesson UUIDs
 * and stripping any Base64 strings from reading_notes. Also prunes deleted modules & lessons.
 */
export async function saveCourseSupabase(courseData, modulesData = null) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const rawTitle = (courseData.title || '').trim();
    if (!rawTitle) throw new Error('Course title is required.');

    const cleanId = (courseData.id || `crs_${Date.now()}`).trim();
    const cleanSlug = (courseData.slug || rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();

    // Pathway mapping
    const pathwayId = (courseData.pathway_id || courseData.category || 'foundations').trim();

    // Instructor mapping
    let instructorId = courseData.instructor_id || courseData.instructorId;
    if (!instructorId && typeof courseData.instructor === 'object' && courseData.instructor?.id) {
      instructorId = courseData.instructor.id;
    }
    if (!instructorId) {
      instructorId = 'inst_001';
    }

    // Format normalization: 'hybrid' | 'online' | 'onsite'
    let format = 'online';
    const rawFormat = (courseData.format || courseData.classCategory || '').toLowerCase();
    if (rawFormat.includes('onsite') || rawFormat.includes('on-site')) {
      format = 'onsite';
    } else if (rawFormat.includes('hybrid')) {
      format = 'hybrid';
    }

    // Status normalization: 'active' | 'upcoming' | 'draft'
    let status = 'active';
    const rawStatus = (courseData.status || '').toLowerCase();
    if (['active', 'upcoming', 'draft'].includes(rawStatus)) {
      status = rawStatus;
    }

    // Tuition fee numeric extraction
    let tuitionFee = 0;
    if (courseData.tuition_fee !== undefined && courseData.tuition_fee !== null) {
      tuitionFee = Number(courseData.tuition_fee) || 0;
    } else if (typeof courseData.fee === 'string') {
      const match = courseData.fee.replace(/,/g, '').match(/\d+/);
      tuitionFee = match ? parseInt(match[0], 10) : 0;
    } else if (typeof courseData.fee === 'number') {
      tuitionFee = courseData.fee;
    }

    const coursePayload = {
      id: cleanId,
      pathway_id: pathwayId,
      instructor_id: instructorId,
      title: rawTitle,
      slug: cleanSlug,
      description: (courseData.description || courseData.subtitle || '').trim() || null,
      format,
      level: courseData.level || 'Beginner',
      tuition_fee: tuitionFee,
      status,
      semester: parseInt(courseData.semester, 10) || 1,
    };

    // 1. Upsert course record
    const { data: courseRow, error: courseErr } = await supabase
      .from('courses')
      .upsert(coursePayload, { onConflict: 'id' })
      .select()
      .single();

    if (courseErr) throw courseErr;

    // 2. Process modules & lessons if provided
    const modules = modulesData || courseData.modules || [];
    if (Array.isArray(modules) && modules.length > 0) {
      const persistedModuleIds = [];

      for (let modIdx = 0; modIdx < modules.length; modIdx++) {
        const mod = modules[modIdx];
        const rawModTitle = (mod.title || `Module ${modIdx + 1}`).trim();
        const isExistingModUuid = mod.id && UUID_REGEX.test(mod.id);
        const moduleId = isExistingModUuid ? mod.id : generateUuid();

        const modPayload = {
          id: moduleId,
          course_id: cleanId,
          title: rawModTitle,
          display_order: modIdx + 1,
        };

        const { data: savedMod, error: modErr } = await supabase
          .from('modules')
          .upsert(modPayload, { onConflict: 'id' })
          .select()
          .single();

        if (modErr) {
          console.warn(`Warning: Failed to upsert module ${moduleId}:`, modErr);
          continue;
        }

        persistedModuleIds.push(savedMod.id);

        // Process lessons inside this module
        const lessons = mod.lessons || [];
        if (Array.isArray(lessons)) {
          const persistedLessonIds = [];

          for (let lesIdx = 0; lesIdx < lessons.length; lesIdx++) {
            const les = lessons[lesIdx];
            const rawLesTitle = (les.title || `Lesson ${lesIdx + 1}`).trim();
            const isExistingLesUuid = les.id && UUID_REGEX.test(les.id);
            const lessonId = isExistingLesUuid ? les.id : generateUuid();

            // Sanitize reading_notes by removing any base64 data URLs
            const rawNotes = les.reading_notes || les.readingNotes || '';
            const cleanNotes = sanitizeNoBase64(rawNotes, '');

            const lesPayload = {
              id: lessonId,
              module_id: savedMod.id,
              title: rawLesTitle,
              display_order: lesIdx + 1,
              duration_minutes: parseInt(les.duration_minutes || les.duration, 10) || 0,
              bunny_library_id: les.bunny_library_id || les.bunnyLibraryId || null,
              bunny_video_guid: les.bunny_video_guid || les.bunnyVideoGuid || null,
              reading_notes: cleanNotes || null,
            };

            const { data: savedLes, error: lesErr } = await supabase
              .from('lessons')
              .upsert(lesPayload, { onConflict: 'id' })
              .select()
              .single();

            if (lesErr) {
              console.warn(`Warning: Failed to upsert lesson ${lessonId}:`, lesErr);
              continue;
            }

            persistedLessonIds.push(savedLes.id);
          }

          // Clean up deleted/orphaned lessons within this module
          if (persistedLessonIds.length > 0) {
            const { error: pruneLesErr } = await supabase
              .from('lessons')
              .delete()
              .eq('module_id', savedMod.id)
              .not('id', 'in', `(${persistedLessonIds.join(',')})`);
            if (pruneLesErr) console.warn('Lesson prune notice:', pruneLesErr);
          }
        }
      }

      // Clean up deleted/orphaned modules for this course
      if (persistedModuleIds.length > 0) {
        const { error: pruneModErr } = await supabase
          .from('modules')
          .delete()
          .eq('course_id', cleanId)
          .not('id', 'in', `(${persistedModuleIds.join(',')})`);
        if (pruneModErr) console.warn('Module prune notice:', pruneModErr);
      }
    }

    return { success: true, data: courseRow };
  } catch (err) {
    console.error('Failed to save course in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Delete a Course from Supabase
 * Enforces relational integrity by checking invoices and intake batches first.
 */
export async function deleteCourseSupabase(courseId) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const cleanId = (courseId || '').trim();
    if (!cleanId) throw new Error('Course ID is required.');

    // 1. Check if invoices are linked
    const { count: invoiceCount, error: invErr } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', cleanId);

    if (invErr) throw invErr;
    if (invoiceCount > 0) {
      throw new Error(`Cannot delete course '${cleanId}' because it has ${invoiceCount} linked invoice billing record(s).`);
    }

    // 2. Check if intake batches are linked
    const { count: batchCount, error: bErr } = await supabase
      .from('batches')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', cleanId);

    if (bErr) throw bErr;
    if (batchCount > 0) {
      throw new Error(`Cannot delete course '${cleanId}' because it is linked to ${batchCount} intake batch(es).`);
    }

    // 3. Delete from courses (cascades to modules, lessons, enrollments, schedule_slots)
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', cleanId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Failed to delete course in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mutation: Update Course Status in Supabase ('active', 'upcoming', 'draft')
 */
export async function updateCourseStatusSupabase(courseId, newStatus) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    const cleanId = (courseId || '').trim();
    const cleanStatus = (newStatus || 'active').toLowerCase();
    const validStatus = ['active', 'upcoming', 'draft'].includes(cleanStatus) ? cleanStatus : 'active';

    const { data, error } = await supabase
      .from('courses')
      .update({ status: validStatus })
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to update course status in Supabase:', err);
    return { success: false, error: err.message };
  }
}
