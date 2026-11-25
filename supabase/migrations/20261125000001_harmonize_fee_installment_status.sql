-- Migration: Harmonize fee_installments status CHECK constraint
-- Accepts both 'UNPAID' and 'PENDING' alongside 'UNDER_REVIEW', 'APPROVED', and 'REJECTED'
-- Prevents PostgreSQL error 23514 (check_violation) when voiding payments or creating installments.

DO $$
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'fee_installments' AND constraint_name = 'fee_installments_status_check'
    ) THEN
        ALTER TABLE public.fee_installments DROP CONSTRAINT fee_installments_status_check;
    END IF;

    -- Add updated check constraint allowing both UNPAID and PENDING
    ALTER TABLE public.fee_installments
    ADD CONSTRAINT fee_installments_status_check
    CHECK (status IN ('UNPAID', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'));
END $$;
