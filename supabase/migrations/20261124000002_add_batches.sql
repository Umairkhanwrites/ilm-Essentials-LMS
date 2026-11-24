-- ============================================================================
-- ILM ESSENTIALS LMS — MIGRATION 2: BATCH / INTAKE MANAGEMENT
-- Target Engine: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- ============================================================================
-- 1. CREATE BATCHES & BATCH-COURSE-INSTRUCTORS TABLES
-- ============================================================================

-- Table 1: Batches / Intakes
CREATE TABLE IF NOT EXISTS public.batches (
    id VARCHAR(64) PRIMARY KEY,
    pathway_id VARCHAR(64) NOT NULL REFERENCES public.pathways(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    start_date DATE,
    end_date DATE,
    tuition_fee INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('enrolling', 'active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Batch Course Instructors (Enables Different Instructors Per Batch)
CREATE TABLE IF NOT EXISTS public.batch_course_instructors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cohort_id VARCHAR(64) NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    instructor_id VARCHAR(64) NOT NULL REFERENCES public.instructors(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_batch_course_instructor UNIQUE (cohort_id, course_id)
);

-- ============================================================================
-- 2. SAFE BACKFILL FOR EXISTING COHORTS (BEFORE ADDING FOREIGN KEYS)
-- ============================================================================

-- Insert foundations_sem1
INSERT INTO public.batches (id, pathway_id, name, start_date, end_date, tuition_fee, status)
VALUES ('foundations_sem1', 'foundations', 'Ilm Foundations — Fall 2026 (Semester 1)', '2026-09-01', '2027-01-31', 30000, 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pathway_id = EXCLUDED.pathway_id;

-- Insert cohort_2026
INSERT INTO public.batches (id, pathway_id, name, start_date, end_date, tuition_fee, status)
VALUES ('cohort_2026', 'foundations', 'General Student Cohort 2026', '2026-09-01', '2027-06-30', 30000, 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pathway_id = EXCLUDED.pathway_id;

-- Insert admin_staff
INSERT INTO public.batches (id, pathway_id, name, start_date, end_date, tuition_fee, status)
VALUES ('admin_staff', 'foundations', 'Administrative Faculty & Staff Cohort', '2026-01-01', '2030-12-31', 0, 'archived')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pathway_id = EXCLUDED.pathway_id, status = EXCLUDED.status;

-- Insert faculty_staff
INSERT INTO public.batches (id, pathway_id, name, start_date, end_date, tuition_fee, status)
VALUES ('faculty_staff', 'foundations', 'Academic Faculty Instructors Cohort', '2026-01-01', '2030-12-31', 0, 'archived')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pathway_id = EXCLUDED.pathway_id, status = EXCLUDED.status;

-- Dynamic backfill for any other distinct cohort_id in students or schedule_slots
INSERT INTO public.batches (id, pathway_id, name, status)
SELECT DISTINCT s.cohort_id, 'foundations', s.cohort_id, 'active'
FROM public.students s
WHERE s.cohort_id NOT IN (SELECT id FROM public.batches)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.batches (id, pathway_id, name, status)
SELECT DISTINCT sl.cohort_id, 'foundations', sl.cohort_id, 'active'
FROM public.schedule_slots sl
WHERE sl.cohort_id NOT IN (SELECT id FROM public.batches)
ON CONFLICT (id) DO NOTHING;

-- Populate default batch_course_instructors for foundations_sem1 from courses catalog
INSERT INTO public.batch_course_instructors (cohort_id, course_id, instructor_id)
SELECT 'foundations_sem1', c.id, c.instructor_id
FROM public.courses c
ON CONFLICT (cohort_id, course_id) DO NOTHING;

-- ============================================================================
-- 3. LINK EXISTING TABLES TO batches(id) VIA FOREIGN KEYS
-- ============================================================================

-- 3.1 students.cohort_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_students_cohort_batches'
    ) THEN
        ALTER TABLE public.students
        ADD CONSTRAINT fk_students_cohort_batches
        FOREIGN KEY (cohort_id) REFERENCES public.batches(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 3.2 schedule_slots.cohort_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_schedule_slots_cohort_batches'
    ) THEN
        ALTER TABLE public.schedule_slots
        ADD CONSTRAINT fk_schedule_slots_cohort_batches
        FOREIGN KEY (cohort_id) REFERENCES public.batches(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 3.3 attendance_sessions.cohort_id
ALTER TABLE public.attendance_sessions
ADD COLUMN IF NOT EXISTS cohort_id VARCHAR(64) REFERENCES public.batches(id) ON DELETE RESTRICT;

-- Backfill existing attendance_sessions to foundations_sem1
UPDATE public.attendance_sessions
SET cohort_id = 'foundations_sem1'
WHERE cohort_id IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE public.attendance_sessions
ALTER COLUMN cohort_id SET NOT NULL;

-- 3.4 enrollments.cohort_id
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS cohort_id VARCHAR(64) REFERENCES public.batches(id) ON DELETE RESTRICT;

-- Backfill enrollments.cohort_id from students.cohort_id
UPDATE public.enrollments e
SET cohort_id = s.cohort_id
FROM public.students s
WHERE e.student_id = s.id AND e.cohort_id IS NULL;

-- Fallback for any unlinked enrollments
UPDATE public.enrollments
SET cohort_id = 'foundations_sem1'
WHERE cohort_id IS NULL;

-- Enforce NOT NULL
ALTER TABLE public.enrollments
ALTER COLUMN cohort_id SET NOT NULL;

-- Replace uk_student_course with uk_student_course_cohort
ALTER TABLE public.enrollments
DROP CONSTRAINT IF EXISTS uk_student_course;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'uk_student_course_cohort'
    ) THEN
        ALTER TABLE public.enrollments
        ADD CONSTRAINT uk_student_course_cohort UNIQUE (student_id, course_id, cohort_id);
    END IF;
END $$;

-- 3.5 invoices.cohort_id
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS cohort_id VARCHAR(64) REFERENCES public.batches(id) ON DELETE RESTRICT;

-- Backfill invoices.cohort_id from students.cohort_id
UPDATE public.invoices inv
SET cohort_id = s.cohort_id
FROM public.students s
WHERE inv.student_id = s.id AND inv.cohort_id IS NULL;

-- 3.6 admissions_applications.applied_cohort_id
ALTER TABLE public.admissions_applications
ADD COLUMN IF NOT EXISTS applied_cohort_id VARCHAR(64) REFERENCES public.batches(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES FOR BATCHES
-- ============================================================================

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_course_instructors ENABLE ROW LEVEL SECURITY;

-- 4.1 Admin Full Access
DROP POLICY IF EXISTS "Admin Full Access Batches" ON public.batches;
CREATE POLICY "Admin Full Access Batches" ON public.batches FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin Full Access Batch Instructors" ON public.batch_course_instructors;
CREATE POLICY "Admin Full Access Batch Instructors" ON public.batch_course_instructors FOR ALL USING (public.is_admin());

-- 4.2 Public / Student Read Access
DROP POLICY IF EXISTS "Public Read Active Batches" ON public.batches;
CREATE POLICY "Public Read Active Batches" ON public.batches FOR SELECT USING (status IN ('enrolling', 'active'));

DROP POLICY IF EXISTS "Public Read Batch Instructors" ON public.batch_course_instructors;
CREATE POLICY "Public Read Batch Instructors" ON public.batch_course_instructors FOR SELECT USING (true);

-- 4.3 Update Student Attendance Policy to match course AND cohort
DROP POLICY IF EXISTS "Student Read Enrolled Sessions" ON public.attendance_sessions;
CREATE POLICY "Student Read Enrolled Sessions" ON public.attendance_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = attendance_sessions.course_id
      AND e.cohort_id = attendance_sessions.cohort_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
  )
);

-- ============================================================================
-- 5. PERMISSIONS
-- ============================================================================

GRANT ALL ON public.batches TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.batch_course_instructors TO postgres, anon, authenticated, service_role;
