-- ============================================================================
-- ILM ESSENTIALS LMS — MIGRATION 5: ADVANCE BATCH SEMESTER ATOMIC RPC
-- Target Engine: PostgreSQL 15+ (Supabase)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.advance_batch_semester(
    p_from_batch_id VARCHAR(64),
    p_new_batch_id VARCHAR(64),
    p_new_batch_name VARCHAR(150),
    p_target_semester INTEGER,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_tuition_fee INTEGER DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT 'active',
    p_auto_enroll BOOLEAN DEFAULT TRUE,
    p_issue_invoice BOOLEAN DEFAULT TRUE,
    p_student_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pathway_id VARCHAR(64);
    v_cohort_group VARCHAR(64);
    v_student_count INTEGER := 0;
    v_course_count INTEGER := 0;
    v_enrolled_count INTEGER := 0;
    v_invoice_count INTEGER := 0;
    v_student RECORD;
    v_course RECORD;
    v_existing_invoice_id UUID;
    v_invoice_id UUID;
    v_invoice_no VARCHAR(32);
    v_challan_no VARCHAR(32);
BEGIN
    -- 1. Security Guardrail: Enforce Admin-Only Execution
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required to advance batch semesters';
    END IF;

    -- 2. Source-of-Truth Guardrail: Query pathway_id and cohort_group directly from DB
    SELECT pathway_id, COALESCE(cohort_group, id)
    INTO v_pathway_id, v_cohort_group
    FROM public.batches
    WHERE id = p_from_batch_id;

    IF v_pathway_id IS NULL THEN
        RAISE EXCEPTION 'Originating batch "%" does not exist in the database', p_from_batch_id;
    END IF;

    IF p_new_batch_id IS NULL OR TRIM(p_new_batch_id) = '' THEN
        RAISE EXCEPTION 'Target new_batch_id cannot be empty';
    END IF;

    -- 3. Upsert Target Semester Batch
    INSERT INTO public.batches (
        id,
        pathway_id,
        name,
        cohort_group,
        semester,
        course_id,
        start_date,
        end_date,
        tuition_fee,
        status,
        created_at
    ) VALUES (
        p_new_batch_id,
        v_pathway_id,
        p_new_batch_name,
        v_cohort_group,
        p_target_semester,
        NULL,
        p_start_date,
        p_end_date,
        p_tuition_fee,
        COALESCE(p_status, 'active'),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        tuition_fee = EXCLUDED.tuition_fee,
        status = EXCLUDED.status;

    -- 4. Map Semester Instructors
    FOR v_course IN
        SELECT id, instructor_id
        FROM public.courses
        WHERE pathway_id = v_pathway_id AND semester = p_target_semester
    LOOP
        v_course_count := v_course_count + 1;
        IF v_course.instructor_id IS NOT NULL THEN
            INSERT INTO public.batch_course_instructors (cohort_id, course_id, instructor_id)
            VALUES (p_new_batch_id, v_course.id, v_course.instructor_id)
            ON CONFLICT (cohort_id, course_id) DO UPDATE SET instructor_id = EXCLUDED.instructor_id;
        END IF;
    END LOOP;

    -- 5. Atomic Student Enrollment Rollover
    IF p_auto_enroll THEN
        FOR v_student IN
            SELECT s.id, s.name, s.email
            FROM public.students s
            WHERE s.cohort_id = p_from_batch_id
              AND (p_student_ids IS NULL OR s.id = ANY(p_student_ids))
        LOOP
            v_student_count := v_student_count + 1;

            -- Create enrollments in all target semester courses
            IF v_course_count > 0 THEN
                FOR v_course IN
                    SELECT id FROM public.courses
                    WHERE pathway_id = v_pathway_id AND semester = p_target_semester
                LOOP
                    INSERT INTO public.enrollments (student_id, course_id, cohort_id, status)
                    VALUES (v_student.id, v_course.id, p_new_batch_id, 'active')
                    ON CONFLICT (student_id, course_id, cohort_id) DO NOTHING;
                    v_enrolled_count := v_enrolled_count + 1;
                END LOOP;
            END IF;

            -- Update student's primary active cohort to the new semester batch
            UPDATE public.students
            SET cohort_id = p_new_batch_id
            WHERE id = v_student.id;

            -- 6. Issue Tuition Invoice & Initial Installment with Strict Schema Typing
            IF p_issue_invoice AND p_tuition_fee IS NOT NULL AND p_tuition_fee > 0 THEN
                -- Check for existing invoice to prevent duplicates on idempotent re-runs
                SELECT id INTO v_existing_invoice_id
                FROM public.invoices
                WHERE student_id = v_student.id AND cohort_id = p_new_batch_id;

                IF v_existing_invoice_id IS NULL THEN
                    v_invoice_id := uuid_generate_v4();
                    v_invoice_no := 'INV-' || TO_CHAR(NOW(), 'YYMM') || '-' || SUBSTRING(p_new_batch_id, 1, 10) || '-' || SUBSTRING(v_student.id::text, 1, 6);
                    v_challan_no := 'CHL-' || TO_CHAR(NOW(), 'YYMM') || '-' || SUBSTRING(p_new_batch_id, 1, 8) || '-' || SUBSTRING(v_student.id::text, 1, 6) || '-1';

                    -- Insert invoice: id is UUID, status is Title Case ('Pending'), pathway_id is linked
                    INSERT INTO public.invoices (
                        id,
                        invoice_no,
                        student_id,
                        cohort_id,
                        pathway_id,
                        base_fee,
                        discount_amount,
                        net_payable,
                        paid_amount,
                        status,
                        due_date,
                        created_at
                    ) VALUES (
                        v_invoice_id,
                        v_invoice_no,
                        v_student.id,
                        p_new_batch_id,
                        v_pathway_id,
                        p_tuition_fee,
                        0,
                        p_tuition_fee,
                        0,
                        'Pending',
                        COALESCE(p_start_date, CURRENT_DATE),
                        NOW()
                    );

                    -- Insert child installment: status is UPPERCASE ('UNPAID')
                    INSERT INTO public.fee_installments (
                        invoice_id,
                        challan_no,
                        student_id,
                        title,
                        amount,
                        due_date,
                        status,
                        created_at
                    ) VALUES (
                        v_invoice_id,
                        v_challan_no,
                        v_student.id,
                        p_new_batch_name || ' — Semester Fee',
                        p_tuition_fee,
                        COALESCE(p_start_date, CURRENT_DATE),
                        'UNPAID',
                        NOW()
                    );

                    v_invoice_count := v_invoice_count + 1;
                END IF;
            END IF;

        END LOOP;
    END IF;

    -- Return execution summary in one atomic JSON payload
    RETURN jsonb_build_object(
        'success', true,
        'from_batch_id', p_from_batch_id,
        'new_batch_id', p_new_batch_id,
        'pathway_id', v_pathway_id,
        'cohort_group', v_cohort_group,
        'target_semester', p_target_semester,
        'target_courses_count', v_course_count,
        'students_advanced_count', v_student_count,
        'enrollments_created', v_enrolled_count,
        'invoices_issued', v_invoice_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.advance_batch_semester TO authenticated;
