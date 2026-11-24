-- ============================================================================
-- ILM ESSENTIALS LMS — INITIAL DATABASE MIGRATION (v5.1 Production Hardened)
-- Target Engine: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS & BASE CONFIGURATION
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Helper Function: Check if current caller is an LMS Administrator
-- CRITICAL SECURITY: user_metadata is intentionally omitted (users can edit it via auth.updateUser)
-- SET search_path = public silences Supabase Security Advisor linter warnings
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN (
    coalesce(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role', '') = 'admin'
    OR coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.students
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$;

-- ============================================================================
-- 2. CORE ACADEMIC & FACULTY ENTITIES
-- ============================================================================

-- Table 1: Academic Pathways
CREATE TABLE IF NOT EXISTS public.pathways (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('cohort', 'modular')),
    duration VARCHAR(50),
    semesters INTEGER DEFAULT 1,
    tuition_model VARCHAR(20) NOT NULL CHECK (tuition_model IN ('bundled', 'per_course')),
    default_tuition_fee INTEGER DEFAULT 30000,
    color VARCHAR(30) DEFAULT 'emerald',
    icon VARCHAR(50) DEFAULT 'GraduationCap',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Faculty Directory
CREATE TABLE IF NOT EXISTS public.instructors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    title VARCHAR(200),
    specialization VARCHAR(255),
    bio TEXT,
    email VARCHAR(255),
    phone VARCHAR(32),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Students Profile (Anchored to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(32),
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin', 'instructor')),
    cohort_id VARCHAR(64) NOT NULL,
    format VARCHAR(20) NOT NULL CHECK (format IN ('online', 'onsite', 'hybrid')),
    is_video_restricted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Course Catalog
CREATE TABLE IF NOT EXISTS public.courses (
    id VARCHAR(64) PRIMARY KEY,
    pathway_id VARCHAR(64) NOT NULL REFERENCES public.pathways(id) ON DELETE RESTRICT,
    instructor_id VARCHAR(64) NOT NULL REFERENCES public.instructors(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    format VARCHAR(20) NOT NULL CHECK (format IN ('hybrid', 'online', 'onsite')),
    level VARCHAR(30) DEFAULT 'Beginner',
    tuition_fee INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: Enrollments (Junction Table)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    pathway_id VARCHAR(64) NOT NULL REFERENCES public.pathways(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'completed')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_student_course UNIQUE (student_id, course_id)
);

-- Table 6: Curriculum Modules
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id VARCHAR(64) NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 7: Curriculum Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    duration_minutes INTEGER DEFAULT 0,
    bunny_library_id VARCHAR(32),
    bunny_video_guid VARCHAR(64),
    reading_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 8: Timetable & Schedule Slots (Hybrid Modality Supported)
CREATE TABLE IF NOT EXISTS public.schedule_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id VARCHAR(64) NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    instructor_id VARCHAR(64) NOT NULL REFERENCES public.instructors(id) ON DELETE RESTRICT,
    cohort_id VARCHAR(64) NOT NULL,
    day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    modality VARCHAR(20) NOT NULL CHECK (modality IN ('online_meet', 'onsite_campus', 'hybrid')),
    campus_room VARCHAR(100),
    meet_link VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_time_window CHECK (start_time < end_time)
);

-- ============================================================================
-- 3. FINANCIAL & BILLING LEDGER (MASTER-DETAIL)
-- ============================================================================

-- Table 9: Invoices (Parent Ledger Header)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(32) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    pathway_id VARCHAR(64) REFERENCES public.pathways(id) ON DELETE RESTRICT,
    course_id VARCHAR(64) REFERENCES public.courses(id) ON DELETE RESTRICT,
    base_fee INTEGER NOT NULL CHECK (base_fee >= 0),
    discount_amount INTEGER DEFAULT 0 CHECK (discount_amount >= 0),
    discount_reason VARCHAR(255),
    net_payable INTEGER NOT NULL CHECK (net_payable >= 0),
    paid_amount INTEGER DEFAULT 0 CHECK (paid_amount >= 0),
    balance INTEGER GENERATED ALWAYS AS (net_payable - paid_amount) STORED,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Paid', 'Partial', 'Pending', 'Overdue', 'Waived')),
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_invoice_target CHECK (pathway_id IS NOT NULL OR course_id IS NOT NULL),
    CONSTRAINT chk_invoice_net CHECK (net_payable = (base_fee - discount_amount))
);

-- Table 10: Fee Installments (Child Schedule Lines)
CREATE TABLE IF NOT EXISTS public.fee_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    challan_no VARCHAR(32) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
    receipt_image_url TEXT,
    approved_by VARCHAR(64),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. ATTENDANCE & ACCESS OVERRIDES
-- ============================================================================

-- Table 11: Attendance Sessions
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id VARCHAR(64) NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    topic VARCHAR(255) NOT NULL,
    delivery_mode VARCHAR(20) DEFAULT 'hybrid' CHECK (delivery_mode IN ('hybrid', 'online', 'onsite')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 12: Attendance Records (Child Matrix)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status VARCHAR(15) NOT NULL CHECK (status IN ('present', 'late', 'absent')),
    PRIMARY KEY (session_id, student_id)
);

-- Table 13: Lesson Access Overrides (Flexible Expiry)
CREATE TABLE IF NOT EXISTS public.lesson_access_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('granted', 'locked')),
    expires_at TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    admin_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_student_lesson_override UNIQUE (student_id, lesson_id)
);

-- ============================================================================
-- 5. SUPPORTING PLATFORM MODULES
-- ============================================================================

-- Table 14: Admissions Applications
CREATE TABLE IF NOT EXISTS public.admissions_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_name VARCHAR(150) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(32) NOT NULL,
    applied_pathway_id VARCHAR(64) REFERENCES public.pathways(id),
    preferred_format VARCHAR(20) CHECK (preferred_format IN ('online', 'onsite', 'hybrid')),
    prior_islamic_education TEXT,
    statement_of_intent TEXT,
    status VARCHAR(25) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED')),
    interview_date TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    converted_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 15: e-Library Catalog (Tokenized Asset Management)
CREATE TABLE IF NOT EXISTS public.library_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    title_arabic VARCHAR(255),
    author VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    type VARCHAR(30) DEFAULT 'reference' CHECK (type IN ('reference', 'textbook', 'workbook', 'primary_source')),
    language VARCHAR(50) DEFAULT 'Arabic / English',
    pages INTEGER DEFAULT 0,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    is_download_allowed BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 16: Daily Wisdom & Quotes Engine
CREATE TABLE IF NOT EXISTS public.daily_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text VARCHAR(300) NOT NULL,
    source VARCHAR(80) NOT NULL,
    type VARCHAR(20) DEFAULT 'hadith' CHECK (type IN ('hadith', 'quran', 'scholar', 'wisdom')),
    pinned BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 17: Quizzes & Questions
CREATE TABLE IF NOT EXISTS public.lesson_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID UNIQUE NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    passing_score_percentage INTEGER DEFAULT 75,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.lesson_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_index SMALLINT NOT NULL CHECK (correct_option_index BETWEEN 0 AND 3),
    explanation TEXT,
    display_order INTEGER DEFAULT 1
);

-- ============================================================================
-- 6. AUTOMATED POSTGRESQL TRIGGERS
-- ============================================================================

-- Trigger A: Sync Invoice Payment Status (with Waived Protection)
CREATE OR REPLACE FUNCTION public.sync_invoice_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    target_invoice_id UUID;
    total_approved INTEGER;
    inv_net INTEGER;
    inv_due DATE;
    inv_current_status VARCHAR(20);
    new_status VARCHAR(20);
BEGIN
    target_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);

    SELECT COALESCE(SUM(amount), 0)
    INTO total_approved
    FROM public.fee_installments
    WHERE invoice_id = target_invoice_id AND status = 'APPROVED';

    SELECT net_payable, due_date, status
    INTO inv_net, inv_due, inv_current_status
    FROM public.invoices
    WHERE id = target_invoice_id;

    -- CRITICAL: Protect administratively Waived invoices
    IF inv_current_status = 'Waived' THEN
        UPDATE public.invoices
        SET paid_amount = total_approved
        WHERE id = target_invoice_id;
        RETURN NEW;
    END IF;

    IF total_approved >= inv_net THEN
        new_status := 'Paid';
    ELSIF total_approved > 0 THEN
        new_status := 'Partial';
    ELSIF CURRENT_DATE > inv_due THEN
        new_status := 'Overdue';
    ELSE
        new_status := 'Pending';
    END IF;

    UPDATE public.invoices
    SET paid_amount = total_approved,
        status = new_status
    WHERE id = target_invoice_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_invoice_payments ON public.fee_installments;
CREATE TRIGGER trg_sync_invoice_payments
AFTER INSERT OR UPDATE OR DELETE ON public.fee_installments
FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_payments();

-- Trigger B: 4-Axis Timetable Collision Prevention
CREATE OR REPLACE FUNCTION public.enforce_schedule_conflicts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    conflict_row RECORD;
BEGIN
    IF NEW.status = 'cancelled' THEN
        RETURN NEW;
    END IF;

    FOR conflict_row IN
        SELECT s.*, c.title AS course_title
        FROM public.schedule_slots s
        JOIN public.courses c ON s.course_id = c.id
        WHERE s.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND s.status = 'active'
          AND s.day_of_week = NEW.day_of_week
          AND GREATEST(NEW.start_time, s.start_time) < LEAST(NEW.end_time, s.end_time)
    LOOP
        -- Axis 1: Instructor Collision
        IF conflict_row.instructor_id = NEW.instructor_id THEN
            RAISE EXCEPTION 'Schedule Conflict (Axis 1): Instructor is already assigned to "%" on % between % and %.',
                conflict_row.course_title, NEW.day_of_week, conflict_row.start_time, conflict_row.end_time;
        END IF;

        -- Axis 2: Physical Room Collision (Onsite or Hybrid)
        IF NEW.modality IN ('onsite_campus', 'hybrid') 
           AND conflict_row.modality IN ('onsite_campus', 'hybrid')
           AND NEW.campus_room IS NOT NULL 
           AND conflict_row.campus_room IS NOT NULL
           AND LOWER(TRIM(NEW.campus_room)) = LOWER(TRIM(conflict_row.campus_room)) THEN
            RAISE EXCEPTION 'Schedule Conflict (Axis 2): Campus Room "%" is already booked for "%" on % between % and %.',
                NEW.campus_room, conflict_row.course_title, NEW.day_of_week, conflict_row.start_time, conflict_row.end_time;
        END IF;

        -- Axis 3: Cohort Collision
        IF conflict_row.cohort_id = NEW.cohort_id THEN
            RAISE EXCEPTION 'Schedule Conflict (Axis 3): Cohort "%" already has class "%" scheduled on % between % and %.',
                NEW.cohort_id, conflict_row.course_title, NEW.day_of_week, conflict_row.start_time, conflict_row.end_time;
        END IF;

        -- Axis 4: Online Meeting Link Collision (Online or Hybrid)
        IF NEW.modality IN ('online_meet', 'hybrid')
           AND conflict_row.modality IN ('online_meet', 'hybrid')
           AND NEW.meet_link IS NOT NULL 
           AND conflict_row.meet_link IS NOT NULL
           AND NEW.course_id <> conflict_row.course_id
           AND LOWER(TRIM(NEW.meet_link)) = LOWER(TRIM(conflict_row.meet_link)) THEN
            RAISE EXCEPTION 'Schedule Conflict (Axis 4): Meeting Link "%" is already assigned to "%" on % between % and %.',
                NEW.meet_link, conflict_row.course_title, NEW.day_of_week, conflict_row.start_time, conflict_row.end_time;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_schedule_conflicts ON public.schedule_slots;
CREATE TRIGGER trg_enforce_schedule_conflicts
BEFORE INSERT OR UPDATE ON public.schedule_slots
FOR EACH ROW EXECUTE FUNCTION public.enforce_schedule_conflicts();

-- ============================================================================
-- 7. SECURE RPC: RECEIPT PROOF SUBMISSION
-- ============================================================================

-- Function: submit_receipt_proof
-- Replaces insecure student UPDATE on fee_installments
CREATE OR REPLACE FUNCTION public.submit_receipt_proof(
    p_installment_id UUID,
    p_receipt_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_installment RECORD;
BEGIN
    SELECT * INTO v_installment
    FROM public.fee_installments
    WHERE id = p_installment_id AND student_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Installment not found or does not belong to you.';
    END IF;

    IF v_installment.status NOT IN ('UNPAID', 'REJECTED') THEN
        RAISE EXCEPTION 'Receipt cannot be submitted for installment with status "%".', v_installment.status;
    END IF;

    UPDATE public.fee_installments
    SET receipt_image_url = p_receipt_url,
        status = 'UNDER_REVIEW'
    WHERE id = p_installment_id;

    RETURN jsonb_build_object(
        'success', true,
        'installment_id', p_installment_id,
        'status', 'UNDER_REVIEW'
    );
END;
$$;

-- ============================================================================
-- 8. ZERO-TRUST ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_access_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- 8.1 Universal Admin Bypass
DROP POLICY IF EXISTS "Admin Full Access Pathways" ON public.pathways;
CREATE POLICY "Admin Full Access Pathways" ON public.pathways FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Instructors" ON public.instructors;
CREATE POLICY "Admin Full Access Instructors" ON public.instructors FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Students" ON public.students;
CREATE POLICY "Admin Full Access Students" ON public.students FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Courses" ON public.courses;
CREATE POLICY "Admin Full Access Courses" ON public.courses FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Enrollments" ON public.enrollments;
CREATE POLICY "Admin Full Access Enrollments" ON public.enrollments FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Modules" ON public.modules;
CREATE POLICY "Admin Full Access Modules" ON public.modules FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Lessons" ON public.lessons;
CREATE POLICY "Admin Full Access Lessons" ON public.lessons FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Schedule" ON public.schedule_slots;
CREATE POLICY "Admin Full Access Schedule" ON public.schedule_slots FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Invoices" ON public.invoices;
CREATE POLICY "Admin Full Access Invoices" ON public.invoices FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Fee Installments" ON public.fee_installments;
CREATE POLICY "Admin Full Access Fee Installments" ON public.fee_installments FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Attendance Sessions" ON public.attendance_sessions;
CREATE POLICY "Admin Full Access Attendance Sessions" ON public.attendance_sessions FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Attendance Records" ON public.attendance_records;
CREATE POLICY "Admin Full Access Attendance Records" ON public.attendance_records FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Access Overrides" ON public.lesson_access_overrides;
CREATE POLICY "Admin Full Access Access Overrides" ON public.lesson_access_overrides FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Admissions" ON public.admissions_applications;
CREATE POLICY "Admin Full Access Admissions" ON public.admissions_applications FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Library" ON public.library_items;
CREATE POLICY "Admin Full Access Library" ON public.library_items FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Quotes" ON public.daily_quotes;
CREATE POLICY "Admin Full Access Quotes" ON public.daily_quotes FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Quizzes" ON public.lesson_quizzes;
CREATE POLICY "Admin Full Access Quizzes" ON public.lesson_quizzes FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admin Full Access Quiz Questions" ON public.quiz_questions;
CREATE POLICY "Admin Full Access Quiz Questions" ON public.quiz_questions FOR ALL USING (public.is_admin());

-- 8.2 Public Read Policies
DROP POLICY IF EXISTS "Public Read Active Courses" ON public.courses;
CREATE POLICY "Public Read Active Courses" ON public.courses FOR SELECT USING (status IN ('active', 'upcoming'));

DROP POLICY IF EXISTS "Public Read Pathways" ON public.pathways;
CREATE POLICY "Public Read Pathways" ON public.pathways FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Active Instructors" ON public.instructors;
CREATE POLICY "Public Read Active Instructors" ON public.instructors FOR SELECT USING (status = 'Active');

DROP POLICY IF EXISTS "Public Insert Admissions" ON public.admissions_applications;
CREATE POLICY "Public Insert Admissions" ON public.admissions_applications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Active Quotes" ON public.daily_quotes;
CREATE POLICY "Public Read Active Quotes" ON public.daily_quotes FOR SELECT USING (active = true);

-- 8.3 Student Account & Financial Policies
DROP POLICY IF EXISTS "Student Read Own Profile" ON public.students;
CREATE POLICY "Student Read Own Profile" ON public.students FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Student Read Own Enrollments" ON public.enrollments;
CREATE POLICY "Student Read Own Enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Student Read Own Invoices" ON public.invoices;
CREATE POLICY "Student Read Own Invoices" ON public.invoices FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Student Read Own Fee Installments" ON public.fee_installments;
CREATE POLICY "Student Read Own Fee Installments" ON public.fee_installments FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Student Read Own Attendance Records" ON public.attendance_records;
CREATE POLICY "Student Read Own Attendance Records" ON public.attendance_records FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Student Read Own Access Overrides" ON public.lesson_access_overrides;
CREATE POLICY "Student Read Own Access Overrides" ON public.lesson_access_overrides FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Student Read Published Library" ON public.library_items;
CREATE POLICY "Student Read Published Library" ON public.library_items FOR SELECT USING (status = 'published');

-- 8.4 Student Curriculum & Schedule Enrollment-Gated Policies
DROP POLICY IF EXISTS "Student Read Enrolled Modules" ON public.modules;
CREATE POLICY "Student Read Enrolled Modules" ON public.modules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = modules.course_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
  )
);

DROP POLICY IF EXISTS "Student Read Enrolled Lessons" ON public.lessons;
CREATE POLICY "Student Read Enrolled Lessons" ON public.lessons
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.enrollments e ON e.course_id = m.course_id
    WHERE m.id = lessons.module_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
  )
);

DROP POLICY IF EXISTS "Student Read Enrolled Schedule" ON public.schedule_slots;
CREATE POLICY "Student Read Enrolled Schedule" ON public.schedule_slots
FOR SELECT USING (
  status = 'active' AND (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = schedule_slots.course_id
        AND e.student_id = auth.uid()
        AND e.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = auth.uid()
        AND s.cohort_id = schedule_slots.cohort_id
    )
  )
);

DROP POLICY IF EXISTS "Student Read Enrolled Sessions" ON public.attendance_sessions;
CREATE POLICY "Student Read Enrolled Sessions" ON public.attendance_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = attendance_sessions.course_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
  )
);

DROP POLICY IF EXISTS "Student Read Enrolled Quizzes" ON public.lesson_quizzes;
CREATE POLICY "Student Read Enrolled Quizzes" ON public.lesson_quizzes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.enrollments e ON e.course_id = m.course_id
    WHERE l.id = lesson_quizzes.lesson_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
  )
);

DROP POLICY IF EXISTS "Student Read Enrolled Quiz Questions" ON public.quiz_questions;
CREATE POLICY "Student Read Enrolled Quiz Questions" ON public.quiz_questions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.lesson_quizzes q
    JOIN public.lessons l ON l.id = q.lesson_id
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.enrollments e ON e.course_id = m.course_id
    WHERE q.id = quiz_questions.quiz_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
  )
);

-- ============================================================================
-- 9. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('library_docs', 'library_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Receipts Storage Policies
DROP POLICY IF EXISTS "Student Upload Receipt Screenshot" ON storage.objects;
CREATE POLICY "Student Upload Receipt Screenshot" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Read Receipt Proofs" ON storage.objects;
CREATE POLICY "Read Receipt Proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR public.is_admin()
  )
);

-- Library Storage Policies (Allows signed URL generation by authenticated users)
DROP POLICY IF EXISTS "Library Admin Full Access" ON storage.objects;
CREATE POLICY "Library Admin Full Access" ON storage.objects
FOR ALL USING (bucket_id = 'library_docs' AND public.is_admin());

DROP POLICY IF EXISTS "Student Read Library Docs" ON storage.objects;
CREATE POLICY "Student Read Library Docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'library_docs' 
  AND auth.role() = 'authenticated'
);
