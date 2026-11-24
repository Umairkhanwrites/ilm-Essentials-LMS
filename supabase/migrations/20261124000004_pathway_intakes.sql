-- ============================================================================
-- ILM ESSENTIALS LMS — MIGRATION 4: PATHWAY INTAKES & MULTI-SEMESTER ADVANCEMENT
-- Target Engine: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. ADD COHORT GROUP, SEMESTER, AND COURSE_ID TO BATCHES
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS cohort_group VARCHAR(64),
ADD COLUMN IF NOT EXISTS semester INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS course_id VARCHAR(64) REFERENCES public.courses(id) ON DELETE CASCADE;

-- 2. CREATE INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_batches_cohort_group ON public.batches(cohort_group);
CREATE INDEX IF NOT EXISTS idx_batches_pathway_semester ON public.batches(pathway_id, semester);
CREATE INDEX IF NOT EXISTS idx_batches_course_id ON public.batches(course_id);

-- 3. BACKFILL EXISTING BATCHES
UPDATE public.batches
SET cohort_group = 'batch_1', semester = 1, course_id = NULL
WHERE id = 'foundations_sem1';

UPDATE public.batches
SET cohort_group = 'cohort_2026', semester = 1, course_id = NULL
WHERE id = 'cohort_2026';

UPDATE public.batches
SET cohort_group = id, semester = 1
WHERE cohort_group IS NULL;
