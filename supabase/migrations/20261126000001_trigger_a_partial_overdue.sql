-- ============================================================================
-- ILM ESSENTIALS LMS — MIGRATION: TRIGGER A PARTIAL + OVERDUE PRECEDENCE
-- Target Engine: PostgreSQL 15+ (Supabase)
--
-- Fixes Trigger A (sync_invoice_payments) so that a partially paid invoice
-- with an overdue unpaid/pending/rejected installment (due_date < CURRENT_DATE)
-- transitions to 'Overdue' rather than staying masked as 'Partial'.
-- ============================================================================

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
    has_overdue_installment BOOLEAN;
    new_status VARCHAR(20);
BEGIN
    target_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);

    SELECT COALESCE(SUM(amount), 0)
    INTO total_approved
    FROM public.fee_installments
    WHERE invoice_id = target_invoice_id AND status = 'APPROVED';

    SELECT EXISTS (
        SELECT 1
        FROM public.fee_installments
        WHERE invoice_id = target_invoice_id
          AND status IN ('UNPAID', 'PENDING', 'REJECTED')
          AND due_date < CURRENT_DATE
    )
    INTO has_overdue_installment;

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
    ELSIF has_overdue_installment OR (total_approved = 0 AND CURRENT_DATE > inv_due) THEN
        new_status := 'Overdue';
    ELSIF total_approved > 0 THEN
        new_status := 'Partial';
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
