-- Migration: Fix receipts bucket DELETE policy & archive internal staff cohorts

-- 1. Archive internal staff cohorts so they don't appear in public admissions or student dropdowns
UPDATE public.batches
SET status = 'archived'
WHERE id IN ('admin_staff', 'faculty_staff');

-- 2. Allow students to delete their own replaced/rejected receipt slips
DROP POLICY IF EXISTS "Student Delete Own Receipt" ON storage.objects;

CREATE POLICY "Student Delete Own Receipt" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Public Admissions Application Insert Policy & Grants
GRANT INSERT ON public.admissions_applications TO anon, authenticated;

DROP POLICY IF EXISTS "Public Insert Admissions" ON public.admissions_applications;
CREATE POLICY "Public Insert Admissions" ON public.admissions_applications
FOR INSERT TO anon, authenticated
WITH CHECK (true);
