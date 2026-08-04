--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-07-23 02:28:12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 48501)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5860 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 989 (class 1247 OID 48754)
-- Name: complaint_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.complaint_category AS ENUM (
    'noise',
    'cleanliness',
    'neighbor_dispute',
    'parking',
    'security',
    'pets',
    'smoking',
    'property_damage',
    'maintenance_issue',
    'other'
);


ALTER TYPE public.complaint_category OWNER TO postgres;

--
-- TOC entry 992 (class 1247 OID 48776)
-- Name: complaint_scope; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.complaint_scope AS ENUM (
    'specific_tenant',
    'common_area',
    'unknown',
    'property_wide'
);


ALTER TYPE public.complaint_scope OWNER TO postgres;

--
-- TOC entry 986 (class 1247 OID 48736)
-- Name: complaint_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.complaint_status AS ENUM (
    'open',
    'under_review',
    'resolved',
    'dismissed',
    'escalated',
    'awaiting_clarification',
    'approved',
    'rejected'
);


ALTER TYPE public.complaint_status OWNER TO postgres;

--
-- TOC entry 968 (class 1247 OID 48644)
-- Name: deposit_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.deposit_status AS ENUM (
    'unpaid',
    'paid',
    'partially_refunded',
    'fully_refunded',
    'forfeited'
);


ALTER TYPE public.deposit_status OWNER TO postgres;

--
-- TOC entry 1016 (class 1247 OID 48864)
-- Name: document_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.document_type AS ENUM (
    'id_document',
    'passport',
    'proof_of_income',
    'bank_statement',
    'proof_of_banking',
    'lease_agreement',
    'inspection_report',
    'maintenance_photo',
    'payment_receipt',
    'other',
    'complaint_evidence'
);


ALTER TYPE public.document_type OWNER TO postgres;

--
-- TOC entry 1004 (class 1247 OID 48816)
-- Name: employment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employment_status AS ENUM (
    'employed',
    'self_employed',
    'student',
    'retired',
    'unemployed',
    'other'
);


ALTER TYPE public.employment_status OWNER TO postgres;

--
-- TOC entry 1007 (class 1247 OID 48830)
-- Name: gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender AS ENUM (
    'male',
    'female',
    'other',
    'prefer_not_to_say'
);


ALTER TYPE public.gender OWNER TO postgres;

--
-- TOC entry 1013 (class 1247 OID 48852)
-- Name: id_document_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.id_document_type AS ENUM (
    'sa_id',
    'passport',
    'drivers_license',
    'asylum_seeker',
    'work_permit'
);


ALTER TYPE public.id_document_type OWNER TO postgres;

--
-- TOC entry 965 (class 1247 OID 48630)
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'partial',
    'cancelled',
    'void'
);


ALTER TYPE public.invoice_status OWNER TO postgres;

--
-- TOC entry 980 (class 1247 OID 48704)
-- Name: lease_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lease_status AS ENUM (
    'draft',
    'active',
    'expired',
    'terminated',
    'renewed',
    'cancelled'
);


ALTER TYPE public.lease_status OWNER TO postgres;

--
-- TOC entry 977 (class 1247 OID 48684)
-- Name: maintenance_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.maintenance_category AS ENUM (
    'plumbing',
    'electrical',
    'structural',
    'appliance',
    'hvac',
    'painting',
    'cleaning',
    'pest_control',
    'other'
);


ALTER TYPE public.maintenance_category OWNER TO postgres;

--
-- TOC entry 974 (class 1247 OID 48672)
-- Name: maintenance_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.maintenance_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent',
    'emergency'
);


ALTER TYPE public.maintenance_priority OWNER TO postgres;

--
-- TOC entry 971 (class 1247 OID 48656)
-- Name: maintenance_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.maintenance_status AS ENUM (
    'needs_repair',
    'assigned',
    'in_progress',
    'completed',
    'cancelled',
    'pending_approval',
    'closed'
);


ALTER TYPE public.maintenance_status OWNER TO postgres;

--
-- TOC entry 1010 (class 1247 OID 48840)
-- Name: marital_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.marital_status AS ENUM (
    'single',
    'married',
    'divorced',
    'widowed',
    'separated'
);


ALTER TYPE public.marital_status OWNER TO postgres;

--
-- TOC entry 1022 (class 1247 OID 48902)
-- Name: message_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.message_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE public.message_priority OWNER TO postgres;

--
-- TOC entry 1019 (class 1247 OID 48888)
-- Name: message_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.message_type AS ENUM (
    'direct',
    'broadcast',
    'maintenance_update',
    'payment_reminder',
    'lease_renewal',
    'announcement'
);


ALTER TYPE public.message_type OWNER TO postgres;

--
-- TOC entry 1025 (class 1247 OID 48912)
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'payment_due',
    'payment_received',
    'payment_approved',
    'payment_rejected',
    'maintenance_update',
    'lease_expiring',
    'lease_expired',
    'complaint_update',
    'message_received',
    'document_uploaded',
    'account_created',
    'property_assigned',
    'property_unassigned',
    'account_status'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- TOC entry 962 (class 1247 OID 48620)
-- Name: payment_frequency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_frequency AS ENUM (
    'weekly',
    'monthly',
    'quarterly',
    'annually'
);


ALTER TYPE public.payment_frequency OWNER TO postgres;

--
-- TOC entry 959 (class 1247 OID 48606)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'bank_transfer',
    'eft',
    'cash',
    'card',
    'mobile_wallet',
    'direct_deposit'
); 


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- TOC entry 956 (class 1247 OID 48590)
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'pending_approval',
    'paid',
    'late',
    'partial',
    'rejected',
    'collections'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- TOC entry 947 (class 1247 OID 48558)
-- Name: property_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.property_type AS ENUM (
    'residential',
    'commercial',
    'mixed_use'
);


ALTER TYPE public.property_type OWNER TO postgres;

--
-- TOC entry 998 (class 1247 OID 48794)
-- Name: reliability_score; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reliability_score AS ENUM (
    'reliable',
    'moderate_risk',
    'high_risk'
);


ALTER TYPE public.reliability_score OWNER TO postgres;

--
-- TOC entry 1001 (class 1247 OID 48802)
-- Name: tenant_standing; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tenant_standing AS ENUM (
    'good_standing',
    'warning_issued',
    'fine_issued',
    'final_warning',
    'eviction_notice',
    'evicted'
);


ALTER TYPE public.tenant_standing OWNER TO postgres;

--
-- TOC entry 983 (class 1247 OID 48718)
-- Name: termination_reason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.termination_reason AS ENUM (
    'non_payment',
    'lease_end',
    'mutual_agreement',
    'breach_of_contract',
    'property_damage',
    'owner_use',
    'renovation',
    'other'
);


ALTER TYPE public.termination_reason OWNER TO postgres;

--
-- TOC entry 953 (class 1247 OID 48580)
-- Name: unit_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.unit_status AS ENUM (
    'occupied',
    'vacant',
    'maintenance',
    'reserved'
);


ALTER TYPE public.unit_status OWNER TO postgres;

--
-- TOC entry 950 (class 1247 OID 48566)
-- Name: unit_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.unit_type AS ENUM (
    'studio',
    '1_bedroom',
    '2_bedroom',
    '3_bedroom',
    '4_bedroom',
    'penthouse'
);


ALTER TYPE public.unit_type OWNER TO postgres;

--
-- TOC entry 941 (class 1247 OID 48540)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'landlord',
    'caretaker',
    'tenant'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 944 (class 1247 OID 48548)
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending_verification'
);


ALTER TYPE public.user_status OWNER TO postgres;

--
-- TOC entry 995 (class 1247 OID 48786)
-- Name: verdict_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.verdict_type AS ENUM (
    'warning',
    'fine',
    'dismissed'
);


ALTER TYPE public.verdict_type OWNER TO postgres;

--
-- TOC entry 302 (class 1255 OID 50138)
-- Name: apply_complaint_verdict(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.apply_complaint_verdict() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  target_tenant uuid;
  current_standing public.tenant_standing;
  current_warnings integer;
BEGIN
  SELECT against_tenant_id INTO target_tenant
  FROM public.complaint WHERE id = NEW.complaint_id;

  IF NEW.verdict_type = 'dismissed' THEN
    UPDATE public.complaint
      SET status = 'dismissed', resolved_at = now(), resolved_by = NEW.issued_by
      WHERE id = NEW.complaint_id;
    RETURN NEW;
  END IF;

  IF target_tenant IS NULL THEN
    -- verdict on a complaint with no specific tenant target (common_area etc.)
    -- gets recorded but doesn't move a standing that doesn't exist
    UPDATE public.complaint
      SET status = 'resolved', resolved_at = now(), resolved_by = NEW.issued_by
      WHERE id = NEW.complaint_id;
    RETURN NEW;
  END IF;

  SELECT standing, total_warnings INTO current_standing, current_warnings
  FROM public.tenant WHERE id = target_tenant;

  IF NEW.verdict_type = 'fine' THEN
    UPDATE public.tenant SET
      standing = CASE WHEN current_standing IN ('final_warning','eviction_notice','evicted')
                       THEN current_standing ELSE 'fine_issued' END,
      standing_updated_at = now(),
      standing_reason = COALESCE(NEW.notes, 'Fine issued'),
      total_fines = total_fines + NEW.fine_amount,
      total_warnings = total_warnings + 1
    WHERE id = target_tenant;

  ELSIF NEW.verdict_type = 'warning' THEN
    UPDATE public.tenant SET
      standing = CASE
        WHEN current_standing IN ('eviction_notice','evicted') THEN current_standing
        WHEN current_warnings >= 2 THEN 'final_warning'
        ELSE 'warning_issued'
      END,
      standing_updated_at = now(),
      standing_reason = COALESCE(NEW.notes, 'Warning issued'),
      total_warnings = total_warnings + 1
    WHERE id = target_tenant;
  END IF;

  UPDATE public.complaint
    SET status = 'resolved', resolved_at = now(), resolved_by = NEW.issued_by
    WHERE id = NEW.complaint_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.apply_complaint_verdict() OWNER TO postgres;

--
-- TOC entry 301 (class 1255 OID 48942)
-- Name: check_user_role(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_user_role() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  actual_role public.user_role;
BEGIN
  SELECT role INTO actual_role FROM public.users WHERE id = NEW.user_id;
  IF actual_role IS NULL THEN
    RAISE EXCEPTION 'user % does not exist', NEW.user_id;
  ELSIF actual_role::text != TG_ARGV[0] THEN
    RAISE EXCEPTION 'user % has role % but is being inserted into %, which requires role %',
      NEW.user_id, actual_role, TG_TABLE_NAME, TG_ARGV[0];
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_user_role() OWNER TO postgres;

--
-- TOC entry 314 (class 1255 OID 50140)
-- Name: get_tenant_standing_summary(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_tenant_standing_summary(p_tenant_id uuid) RETURNS TABLE(standing public.tenant_standing, total_complaints_against bigint, total_warnings integer, total_fines numeric, active_complaints bigint, last_verdict_date timestamp with time zone, risk_level text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.standing,
    (SELECT COUNT(*) FROM public.complaint WHERE against_tenant_id = p_tenant_id),
    t.total_warnings,
    t.total_fines,
    (SELECT COUNT(*) FROM public.complaint
       WHERE against_tenant_id = p_tenant_id
       AND status NOT IN ('resolved','rejected','dismissed')),
    (SELECT MAX(cv.issued_at) FROM public.complaint_verdict cv
       JOIN public.complaint c ON c.id = cv.complaint_id
       WHERE c.against_tenant_id = p_tenant_id),
    CASE
      WHEN t.standing IN ('eviction_notice', 'evicted') THEN 'Critical'
      WHEN t.standing = 'final_warning' THEN 'High'
      WHEN t.standing = 'fine_issued' THEN 'Elevated'
      WHEN t.standing = 'warning_issued' THEN 'Moderate'
      WHEN (SELECT COUNT(*) FROM public.complaint WHERE against_tenant_id = p_tenant_id) >= 3 THEN 'Watch'
      ELSE 'Low'
    END
  FROM public.tenant t
  WHERE t.id = p_tenant_id;
END;
$$;


ALTER FUNCTION public.get_tenant_standing_summary(p_tenant_id uuid) OWNER TO postgres;

--
-- TOC entry 318 (class 1255 OID 51656)
-- Name: handle_payment_status_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_payment_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- When a payment is approved, create invoice_payments record if it doesn't exist
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        INSERT INTO public.invoice_payments (
            invoice_id,
            payment_id,
            amount,
            payment_date,
            method,
            reference,
            status,
            allocated_rent,
            allocated_utilities,
            allocated_late_fees,
            notes
        ) VALUES (
            NEW.invoice_id,
            NEW.id,
            NEW.amount_paid,
            NEW.payment_date,
            NEW.payment_method,
            NEW.bank_reference,
            'approved',
            COALESCE(NEW.allocated_rent, NEW.amount_paid),
            COALESCE(NEW.allocated_utilities, 0),
            COALESCE(NEW.allocated_late_fees, 0),
            'Auto-created from payment approval'
        )
        ON CONFLICT (payment_id) WHERE payment_id IS NOT NULL
        DO UPDATE SET
            status = 'approved',
            amount = EXCLUDED.amount,
            payment_date = EXCLUDED.payment_date
        WHERE invoice_payments.payment_id = NEW.id;
    END IF;

    -- When payment is rejected, update the invoice_payments status
    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        UPDATE public.invoice_payments
        SET status = 'rejected'
        WHERE payment_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_payment_status_change() OWNER TO postgres;

--
-- TOC entry 316 (class 1255 OID 51476)
-- Name: recalculate_invoice_status(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalculate_invoice_status(p_invoice_id uuid) RETURNS public.invoice_status
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_amount_due numeric;
    v_current_status public.invoice_status;
    v_total_paid numeric;
    v_new_status public.invoice_status;
BEGIN
    -- Get invoice details
    SELECT amount_due, status INTO v_amount_due, v_current_status
    FROM public.invoice WHERE id = p_invoice_id;

    IF v_amount_due IS NULL THEN
        RAISE EXCEPTION 'invoice % not found', p_invoice_id;
    END IF;

    -- Calculate total paid from invoice_payments
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.invoice_payments
    WHERE invoice_id = p_invoice_id AND status = 'approved';

    -- Determine new status
    IF v_total_paid >= v_amount_due AND v_amount_due > 0 THEN
        v_new_status := 'paid';
    ELSIF v_total_paid > 0 AND v_total_paid < v_amount_due THEN
        v_new_status := 'partial';
    ELSE
        -- No payments, revert to appropriate status
        IF v_current_status IN ('paid', 'partial') THEN
            v_new_status := 'sent';
        ELSE
            v_new_status := v_current_status;
        END IF;
    END IF;

    -- Update invoice
    UPDATE public.invoice SET
        paid_amount = v_total_paid,
        status = v_new_status,
        paid_date = CASE 
            WHEN v_new_status = 'paid' THEN CURRENT_DATE 
            ELSE NULL 
        END
    WHERE id = p_invoice_id;

    -- Trigger tenant score recalculation
    PERFORM public.recalculate_tenant_score(
        (SELECT tenant_id FROM public.invoice WHERE id = p_invoice_id),
        (SELECT approved_by FROM public.payment WHERE invoice_id = p_invoice_id LIMIT 1)
    );

    RETURN v_new_status;
END;
$$;


ALTER FUNCTION public.recalculate_invoice_status(p_invoice_id uuid) OWNER TO postgres;

--
-- TOC entry 5861 (class 0 OID 0)
-- Dependencies: 316
-- Name: FUNCTION recalculate_invoice_status(p_invoice_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.recalculate_invoice_status(p_invoice_id uuid) IS 'Sums all successful payments against an invoice and derives paid_amount/status from that total — replaces routes directly setting status=''paid'' and overwriting paid_amount with a single payment''s amount.';


--
-- TOC entry 319 (class 1255 OID 51473)
-- Name: recalculate_payment_history(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalculate_payment_history(p_tenant_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_on_time integer := 0;
    v_late integer := 0;
    v_missed integer := 0;
    v_partial integer := 0;
    v_avg_late numeric;
    v_longest integer := 0;
    v_current integer := 0;
BEGIN
    WITH base AS (
        SELECT
            inv.id,
            inv.due_date,
            inv.status AS invoice_status,
            l.grace_period_days,
            ip.status AS payment_status,
            ip.payment_date
        FROM public.invoice inv
        JOIN public.lease l ON l.id = inv.lease_id
        LEFT JOIN LATERAL (
            SELECT ip.status, ip.payment_date
            FROM public.invoice_payments ip
            WHERE ip.invoice_id = inv.id AND ip.status = 'approved'
            ORDER BY ip.payment_date DESC
            LIMIT 1
        ) ip ON true
        WHERE inv.tenant_id = p_tenant_id
        AND inv.status IN ('paid', 'overdue', 'partial', 'sent')
    ),
    flagged AS (
        SELECT
            *,
            (payment_status = 'approved' AND payment_date::date <= due_date + grace_period_days) AS is_on_time,
            (payment_status = 'approved' AND payment_date::date > due_date + grace_period_days) AS is_late,
            (invoice_status = 'overdue' AND payment_status IS NULL) AS is_missed,
            (invoice_status = 'partial') AS is_partial
        FROM base
    ),
    ordered AS (
        SELECT *, ROW_NUMBER() OVER (ORDER BY due_date) AS rn
        FROM flagged
    ),
    islands AS (
        SELECT *, rn - ROW_NUMBER() OVER (PARTITION BY is_on_time ORDER BY rn) AS grp
        FROM ordered
    ),
    streaks AS (
        SELECT grp, COUNT(*) AS len, MAX(rn) AS last_rn
        FROM islands
        WHERE is_on_time
        GROUP BY grp
    )
    SELECT
        COUNT(*) FILTER (WHERE is_on_time),
        COUNT(*) FILTER (WHERE is_late),
        COUNT(*) FILTER (WHERE is_missed),
        COUNT(*) FILTER (WHERE is_partial),
        AVG(GREATEST(0, payment_date::date - due_date)) FILTER (WHERE is_late),
        COALESCE((SELECT MAX(len) FROM streaks), 0),
        COALESCE((SELECT len FROM streaks WHERE last_rn = (SELECT MAX(rn) FROM ordered)), 0)
    INTO v_on_time, v_late, v_missed, v_partial, v_avg_late, v_longest, v_current
    FROM flagged;

    INSERT INTO public.tenant_payment_history (
        tenant_id, on_time_payments, late_payments, missed_payments, partial_payments,
        average_days_late, longest_streak_ontime, current_streak_ontime, last_calculated
    )
    VALUES (
        p_tenant_id, v_on_time, v_late, v_missed, v_partial,
        v_avg_late, v_longest, v_current, now()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        on_time_payments = EXCLUDED.on_time_payments,
        late_payments = EXCLUDED.late_payments,
        missed_payments = EXCLUDED.missed_payments,
        partial_payments = EXCLUDED.partial_payments,
        average_days_late = EXCLUDED.average_days_late,
        longest_streak_ontime = EXCLUDED.longest_streak_ontime,
        current_streak_ontime = EXCLUDED.current_streak_ontime,
        last_calculated = EXCLUDED.last_calculated;
END;
$$;


ALTER FUNCTION public.recalculate_payment_history(p_tenant_id uuid) OWNER TO postgres;

--
-- TOC entry 5862 (class 0 OID 0)
-- Dependencies: 319
-- Name: FUNCTION recalculate_payment_history(p_tenant_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.recalculate_payment_history(p_tenant_id uuid) IS 'Recomputes tenant_payment_history from actual invoice+payment+lease data. Call after any payment approval, rejection, or invoice status change — replaces hand-incrementing counters, which is how a late payment previously got counted as on-time.';


--
-- TOC entry 315 (class 1255 OID 50141)
-- Name: recalculate_tenant_score(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalculate_tenant_score(p_tenant_id uuid, p_changed_by uuid DEFAULT NULL::uuid) RETURNS public.reliability_score
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_landlord_id uuid;
  s public.landlord_settings%ROWTYPE;
  h public.tenant_payment_history%ROWTYPE;
  v_old_score public.reliability_score;
  v_standing public.tenant_standing;
  v_total_payments integer;
  payment_subscore numeric := 100;
  complaints_subscore numeric := 100;
  lease_subscore numeric := 100;
  maintenance_subscore numeric := 100; -- no reliable causal signal modeled yet; left neutral
  tenure_subscore numeric := 60;
  weighted numeric;
  new_score public.reliability_score;
  terminated_bad_leases integer;
  months_tenure numeric;
BEGIN
  SELECT landlord_id, reliability_score, standing INTO v_landlord_id, v_old_score, v_standing
  FROM public.tenant WHERE id = p_tenant_id;

  IF v_landlord_id IS NULL THEN
    RAISE EXCEPTION 'tenant % not found', p_tenant_id;
  END IF;

  SELECT * INTO s FROM public.landlord_settings WHERE landlord_id = v_landlord_id;
  SELECT * INTO h FROM public.tenant_payment_history WHERE tenant_id = p_tenant_id;

  -- payment sub-score: share of on-time payments, defaulting to 100
  -- when there's no history yet (new tenant, benefit of the doubt)
  v_total_payments := COALESCE(h.on_time_payments,0) + COALESCE(h.late_payments,0)
                     + COALESCE(h.missed_payments,0) + COALESCE(h.partial_payments,0);
  IF v_total_payments > 0 THEN
    payment_subscore := 100.0 * COALESCE(h.on_time_payments,0) / v_total_payments;
  END IF;

  -- complaints sub-score: penalize per warning already on record;
  -- double the penalty if the landlord's setting says to
  complaints_subscore := GREATEST(0, 100 - (
      COALESCE((SELECT total_warnings FROM public.tenant WHERE id = p_tenant_id), 0)
      * (CASE WHEN s.score_double_upheld_complaints THEN 30 ELSE 15 END)
  ));

  -- lease sub-score: penalize for leases terminated for cause
  SELECT COUNT(*) INTO terminated_bad_leases
  FROM public.lease
  WHERE tenant_id = p_tenant_id
    AND status = 'terminated'
    AND termination_reason IN ('non_payment', 'breach_of_contract', 'property_damage');
  lease_subscore := GREATEST(0, 100 - terminated_bad_leases * 25);

  -- tenure sub-score: longer standing tenancy nudges the score up,
  -- capped so it can't outweigh actual behavior on its own
  SELECT GREATEST(0, EXTRACT(YEAR FROM age(now(), tenant_since)) * 12
                    + EXTRACT(MONTH FROM age(now(), tenant_since)))
    INTO months_tenure
  FROM public.tenant WHERE id = p_tenant_id AND tenant_since IS NOT NULL;
  tenure_subscore := LEAST(100, 40 + COALESCE(months_tenure, 0) * 2);

  weighted := (
      payment_subscore     * s.score_payment_weight
    + complaints_subscore  * s.score_complaints_weight
    + lease_subscore       * s.score_lease_weight
    + maintenance_subscore * s.score_maintenance_weight
    + tenure_subscore      * s.score_tenure_weight
  ) / 100.0;

  IF s.score_instant_demotion_eviction AND v_standing IN ('eviction_notice', 'evicted') THEN
    new_score := 'high_risk';
    weighted := LEAST(weighted, s.score_high_risk_threshold - 1);
  ELSIF weighted >= s.score_reliable_threshold THEN
    new_score := 'reliable';
  ELSIF weighted >= s.score_moderate_threshold THEN
    new_score := 'moderate_risk';
  ELSE
    new_score := 'high_risk';
  END IF;

  UPDATE public.tenant
    SET reliability_score = new_score, reliability_score_value = weighted
    WHERE id = p_tenant_id;

  IF new_score IS DISTINCT FROM v_old_score THEN
    INSERT INTO public.tenant_score_history
      (tenant_id, old_score, new_score, old_score_value, new_score_value, reason, changed_by)
    VALUES
      (p_tenant_id, v_old_score, new_score, NULL, weighted,
       'Recalculated from payment/complaint/lease/tenure sub-scores', p_changed_by);
  END IF;

  RETURN new_score;
END;
$$;


ALTER FUNCTION public.recalculate_tenant_score(p_tenant_id uuid, p_changed_by uuid) OWNER TO postgres;

--
-- TOC entry 5863 (class 0 OID 0)
-- Dependencies: 315
-- Name: FUNCTION recalculate_tenant_score(p_tenant_id uuid, p_changed_by uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.recalculate_tenant_score(p_tenant_id uuid, p_changed_by uuid) IS 'Call this after anything that should affect a tenant''s score: a payment recorded, a verdict issued, a lease terminated. Sub-score formulas are intentionally simple starting points — read the function body before trusting the numbers in a demo.';


--
-- TOC entry 300 (class 1255 OID 48941)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- TOC entry 317 (class 1255 OID 51654)
-- Name: trigger_recalculate_invoice_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_recalculate_invoice_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- When invoice_payments changes, recalculate the invoice status
    PERFORM public.recalculate_invoice_status(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.invoice_id
            ELSE NEW.invoice_id
        END
    );
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.trigger_recalculate_invoice_status() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 252 (class 1259 OID 50021)
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 49051)
-- Name: caretaker; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.caretaker (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    landlord_id uuid NOT NULL,
    id_number character varying(13),
    address text,
    emergency_contact character varying(20),
    assigned_property uuid,
    hire_date date,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.caretaker OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 48943)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    alternate_phone character varying(20),
    password_hash text NOT NULL,
    role public.user_role NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    full_name character varying(201) GENERATED ALWAYS AS ((((first_name)::text || ' '::text) || (last_name)::text)) STORED,
    profile_image_url text,
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    must_change_password boolean DEFAULT false,
    status public.user_status DEFAULT 'inactive'::public.user_status NOT NULL,
    last_login timestamp with time zone,
    last_active timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5864 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'One row per person, regardless of role. Role-specific detail lives in landlord/caretaker/tenant, joined on user_id.';


--
-- TOC entry 259 (class 1259 OID 50153)
-- Name: caretaker_profile; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.caretaker_profile AS
 SELECT c.id,
    c.user_id,
    c.landlord_id,
    c.id_number,
    c.address,
    c.emergency_contact,
    c.assigned_property,
    c.hire_date,
    c.is_active,
    c.created_by,
    c.created_at,
    c.updated_at,
    u.first_name,
    u.last_name,
    u.full_name,
    u.email,
    u.phone,
    u.profile_image_url,
    u.status AS account_status
   FROM (public.caretaker c
     JOIN public.users u ON ((u.id = c.user_id)));


ALTER VIEW public.caretaker_profile OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 49490)
-- Name: collection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lease_id uuid NOT NULL,
    landlord_id uuid NOT NULL,
    outstanding_balance numeric(10,2) NOT NULL,
    days_overdue integer,
    status character varying(50) DEFAULT 'flagged'::character varying NOT NULL,
    flagged_by uuid,
    flagged_at timestamp with time zone DEFAULT now(),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_days_overdue_check CHECK ((days_overdue >= 0)),
    CONSTRAINT collection_outstanding_balance_check CHECK ((outstanding_balance >= (0)::numeric))
);


ALTER TABLE public.collection OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 49531)
-- Name: collection_invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection_invoice (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    collection_id uuid NOT NULL,
    invoice_id uuid NOT NULL
);


ALTER TABLE public.collection_invoice OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 49781)
-- Name: complaint; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaint (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    filed_by uuid NOT NULL,
    filed_by_tenant_id uuid,
    against_tenant_id uuid,
    against_unit_id uuid,
    subject character varying(200) NOT NULL,
    description text NOT NULL,
    category public.complaint_category NOT NULL,
    complaint_scope public.complaint_scope DEFAULT 'specific_tenant'::public.complaint_scope NOT NULL,
    common_area_location character varying(100),
    status public.complaint_status DEFAULT 'open'::public.complaint_status NOT NULL,
    severity integer DEFAULT 3,
    requires_action boolean DEFAULT true,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    resolution_notes text,
    clarification_requested boolean DEFAULT false,
    clarification_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT complaint_check CHECK ((((complaint_scope = 'specific_tenant'::public.complaint_scope) AND (against_tenant_id IS NOT NULL)) OR ((complaint_scope = 'common_area'::public.complaint_scope) AND (common_area_location IS NOT NULL)) OR (complaint_scope = ANY (ARRAY['unknown'::public.complaint_scope, 'property_wide'::public.complaint_scope])))),
    CONSTRAINT complaint_severity_check CHECK (((severity >= 1) AND (severity <= 5)))
);


ALTER TABLE public.complaint OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 49837)
-- Name: complaint_evidence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaint_evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    complaint_id uuid NOT NULL,
    document_id uuid NOT NULL,
    evidence_type character varying(50) DEFAULT 'photo'::character varying NOT NULL,
    uploaded_by uuid NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.complaint_evidence OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 49865)
-- Name: complaint_verdict; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaint_verdict (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    complaint_id uuid NOT NULL,
    verdict_type public.verdict_type NOT NULL,
    fine_amount numeric(10,2),
    issued_by uuid NOT NULL,
    issued_at timestamp with time zone DEFAULT now(),
    notes text,
    CONSTRAINT complaint_verdict_check CHECK (((verdict_type <> 'fine'::public.verdict_type) OR (fine_amount IS NOT NULL))),
    CONSTRAINT complaint_verdict_fine_amount_check CHECK ((fine_amount >= (0)::numeric))
);


ALTER TABLE public.complaint_verdict OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 49457)
-- Name: deposit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deposit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lease_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    deposit_amount numeric(10,2) NOT NULL,
    amount_paid numeric(10,2) DEFAULT 0,
    payment_date timestamp with time zone,
    payment_reference character varying(100),
    status public.deposit_status DEFAULT 'unpaid'::public.deposit_status NOT NULL,
    refund_amount numeric(10,2),
    refund_date timestamp with time zone,
    refund_reason text,
    deductions jsonb,
    held_until date,
    interest_earned numeric(10,2) DEFAULT 0,
    country character varying(50) DEFAULT 'South Africa'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT deposit_amount_paid_check CHECK ((amount_paid >= (0)::numeric)),
    CONSTRAINT deposit_deposit_amount_check CHECK ((deposit_amount >= (0)::numeric)),
    CONSTRAINT deposit_refund_amount_check CHECK ((refund_amount >= (0)::numeric))
);


ALTER TABLE public.deposit OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 49624)
-- Name: document; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    landlord_id uuid,
    unit_id uuid,
    property_id uuid,
    uploaded_by uuid NOT NULL,
    document_type public.document_type NOT NULL,
    document_name character varying(150) NOT NULL,
    document_url text NOT NULL,
    file_size integer,
    mime_type character varying(50),
    description text,
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    verified_by uuid,
    verified_at timestamp with time zone,
    rejection_reason text,
    issue_date date,
    expiry_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT document_file_size_check CHECK ((file_size >= 0))
);


ALTER TABLE public.document OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 49313)
-- Name: invoice_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_number_seq OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 49316)
-- Name: invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lease_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    landlord_id uuid NOT NULL,
    invoice_number character varying(50) DEFAULT ('INV-'::text || nextval('public.invoice_number_seq'::regclass)) NOT NULL,
    amount_due numeric(10,2) NOT NULL,
    rent_amount numeric(10,2) NOT NULL,
    utilities_amount numeric(10,2) DEFAULT 0,
    late_fees numeric(10,2) DEFAULT 0,
    other_charges numeric(10,2) DEFAULT 0,
    discounts numeric(10,2) DEFAULT 0,
    billing_period_start date NOT NULL,
    billing_period_end date NOT NULL,
    due_date date NOT NULL,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0 NOT NULL,
    paid_date date,
    remaining_balance numeric(10,2) GENERATED ALWAYS AS ((amount_due - paid_amount)) STORED,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invoice_amount_due_check CHECK ((amount_due >= (0)::numeric)),
    CONSTRAINT invoice_check CHECK ((billing_period_end > billing_period_start)),
    CONSTRAINT invoice_discounts_check CHECK ((discounts >= (0)::numeric)),
    CONSTRAINT invoice_late_fees_check CHECK ((late_fees >= (0)::numeric)),
    CONSTRAINT invoice_other_charges_check CHECK ((other_charges >= (0)::numeric)),
    CONSTRAINT invoice_paid_amount_check CHECK ((paid_amount >= (0)::numeric)),
    CONSTRAINT invoice_rent_amount_check CHECK ((rent_amount >= (0)::numeric)),
    CONSTRAINT invoice_utilities_amount_check CHECK ((utilities_amount >= (0)::numeric))
);


ALTER TABLE public.invoice OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 51618)
-- Name: invoice_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    payment_id uuid,
    amount numeric(10,2) NOT NULL,
    payment_date timestamp with time zone DEFAULT now(),
    method public.payment_method,
    reference character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    allocated_rent numeric(10,2) DEFAULT 0,
    allocated_utilities numeric(10,2) DEFAULT 0,
    allocated_late_fees numeric(10,2) DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invoice_payments_allocated_check CHECK ((((allocated_rent + allocated_utilities) + allocated_late_fees) = amount)),
    CONSTRAINT invoice_payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT invoice_payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.invoice_payments OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 51658)
-- Name: invoice_payment_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.invoice_payment_summary AS
 SELECT i.id AS invoice_id,
    i.invoice_number,
    i.tenant_id,
    i.amount_due,
    i.paid_amount,
    i.remaining_balance,
    i.status AS invoice_status,
    count(ip.id) AS payment_count,
    COALESCE(sum(ip.amount) FILTER (WHERE ((ip.status)::text = 'pending'::text)), (0)::numeric) AS pending_amount,
    COALESCE(sum(ip.amount) FILTER (WHERE ((ip.status)::text = 'approved'::text)), (0)::numeric) AS approved_amount,
    COALESCE(sum(ip.amount) FILTER (WHERE ((ip.status)::text = 'rejected'::text)), (0)::numeric) AS rejected_amount,
    max(ip.payment_date) FILTER (WHERE ((ip.status)::text = 'approved'::text)) AS last_payment_date,
    json_agg(json_build_object('id', ip.id, 'amount', ip.amount, 'payment_date', ip.payment_date, 'method', ip.method, 'status', ip.status, 'allocated_rent', ip.allocated_rent, 'allocated_utilities', ip.allocated_utilities, 'allocated_late_fees', ip.allocated_late_fees) ORDER BY ip.payment_date DESC) AS payments
   FROM (public.invoice i
     LEFT JOIN public.invoice_payments ip ON ((i.id = ip.invoice_id)))
  GROUP BY i.id, i.invoice_number, i.tenant_id, i.amount_due, i.paid_amount, i.remaining_balance, i.status;


ALTER VIEW public.invoice_payment_summary OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 48969)
-- Name: landlord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.landlord (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_name character varying(200),
    registration_number character varying(50),
    vat_number character varying(50),
    address_line1 text,
    address_line2 text,
    city character varying(100),
    province character varying(100),
    postal_code character varying(4),
    country character varying(50) DEFAULT 'South Africa'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.landlord OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 50148)
-- Name: landlord_profile; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.landlord_profile AS
 SELECT l.id,
    l.user_id,
    l.company_name,
    l.registration_number,
    l.vat_number,
    l.address_line1,
    l.address_line2,
    l.city,
    l.province,
    l.postal_code,
    l.country,
    l.created_at,
    l.updated_at,
    u.first_name,
    u.last_name,
    u.full_name,
    u.email,
    u.phone,
    u.profile_image_url,
    u.status AS account_status
   FROM (public.landlord l
     JOIN public.users u ON ((u.id = l.user_id)));


ALTER VIEW public.landlord_profile OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 48991)
-- Name: landlord_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.landlord_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    landlord_id uuid NOT NULL,
    notify_rent_reminders boolean DEFAULT true,
    notify_payment_received boolean DEFAULT true,
    notify_lease_expiry boolean DEFAULT true,
    notify_maintenance_updates boolean DEFAULT true,
    notify_tenant_messages boolean DEFAULT true,
    notify_push boolean DEFAULT true,
    notify_email_digest boolean DEFAULT false,
    notify_marketing boolean DEFAULT false,
    default_payment_frequency public.payment_frequency DEFAULT 'monthly'::public.payment_frequency,
    default_due_day integer DEFAULT 1,
    default_deposit_type character varying(20) DEFAULT 'rent'::character varying,
    grace_period_days integer DEFAULT 5,
    auto_mark_late boolean DEFAULT true,
    auto_send_collections boolean DEFAULT false,
    payout_schedule character varying(20) DEFAULT 'instant'::character varying,
    vat_registered boolean DEFAULT false,
    vat_number character varying(50),
    show_phone_to_tenants boolean DEFAULT false,
    share_data_contractors boolean DEFAULT false,
    score_payment_weight integer DEFAULT 40,
    score_complaints_weight integer DEFAULT 25,
    score_lease_weight integer DEFAULT 15,
    score_maintenance_weight integer DEFAULT 10,
    score_tenure_weight integer DEFAULT 10,
    score_reliable_threshold integer DEFAULT 80,
    score_moderate_threshold integer DEFAULT 50,
    score_high_risk_threshold integer DEFAULT 30,
    score_escalate_late_penalty boolean DEFAULT true,
    score_double_upheld_complaints boolean DEFAULT true,
    score_instant_demotion_eviction boolean DEFAULT true,
    score_include_past_tenants boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_score_thresholds_ordered CHECK (((score_high_risk_threshold < score_moderate_threshold) AND (score_moderate_threshold < score_reliable_threshold))),
    CONSTRAINT chk_score_weights_sum_100 CHECK ((((((score_payment_weight + score_complaints_weight) + score_lease_weight) + score_maintenance_weight) + score_tenure_weight) = 100)),
    CONSTRAINT landlord_settings_default_due_day_check CHECK (((default_due_day >= 1) AND (default_due_day <= 31))),
    CONSTRAINT landlord_settings_grace_period_days_check CHECK ((grace_period_days >= 0)),
    CONSTRAINT landlord_settings_score_complaints_weight_check CHECK (((score_complaints_weight >= 0) AND (score_complaints_weight <= 100))),
    CONSTRAINT landlord_settings_score_high_risk_threshold_check CHECK (((score_high_risk_threshold >= 0) AND (score_high_risk_threshold <= 100))),
    CONSTRAINT landlord_settings_score_lease_weight_check CHECK (((score_lease_weight >= 0) AND (score_lease_weight <= 100))),
    CONSTRAINT landlord_settings_score_maintenance_weight_check CHECK (((score_maintenance_weight >= 0) AND (score_maintenance_weight <= 100))),
    CONSTRAINT landlord_settings_score_moderate_threshold_check CHECK (((score_moderate_threshold >= 0) AND (score_moderate_threshold <= 100))),
    CONSTRAINT landlord_settings_score_payment_weight_check CHECK (((score_payment_weight >= 0) AND (score_payment_weight <= 100))),
    CONSTRAINT landlord_settings_score_reliable_threshold_check CHECK (((score_reliable_threshold >= 0) AND (score_reliable_threshold <= 100))),
    CONSTRAINT landlord_settings_score_tenure_weight_check CHECK (((score_tenure_weight >= 0) AND (score_tenure_weight <= 100)))
);


ALTER TABLE public.landlord_settings OWNER TO postgres;

--
-- TOC entry 5865 (class 0 OID 0)
-- Dependencies: 222
-- Name: CONSTRAINT chk_score_weights_sum_100 ON landlord_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT chk_score_weights_sum_100 ON public.landlord_settings IS 'The five score_*_weight columns must always sum to exactly 100. The DB enforces this so the frontend cannot silently save an inconsistent weighting.';


--
-- TOC entry 227 (class 1259 OID 49219)
-- Name: lease; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lease (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    landlord_id uuid NOT NULL,
    lease_start_date date NOT NULL,
    lease_end_date date NOT NULL,
    rent_amount numeric(10,2) NOT NULL,
    deposit_amount numeric(10,2),
    deposit_paid boolean DEFAULT false,
    deposit_paid_date date,
    payment_frequency public.payment_frequency DEFAULT 'monthly'::public.payment_frequency NOT NULL,
    payment_due_day integer DEFAULT 1,
    late_fee_amount numeric(10,2) DEFAULT 250.00,
    late_fee_after_days integer DEFAULT 7,
    grace_period_days integer DEFAULT 5,
    auto_renew boolean DEFAULT false,
    renewal_notice_days integer DEFAULT 60,
    status public.lease_status DEFAULT 'draft'::public.lease_status NOT NULL,
    termination_reason public.termination_reason,
    termination_date date,
    termination_notes text,
    vacate_date date,
    water_included boolean DEFAULT false,
    electricity_included boolean DEFAULT false,
    internet_included boolean DEFAULT false,
    signed_lease_agreement text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lease_check CHECK ((lease_end_date > lease_start_date)),
    CONSTRAINT lease_deposit_amount_check CHECK ((deposit_amount >= (0)::numeric)),
    CONSTRAINT lease_grace_period_days_check CHECK ((grace_period_days >= 0)),
    CONSTRAINT lease_late_fee_after_days_check CHECK ((late_fee_after_days >= 0)),
    CONSTRAINT lease_late_fee_amount_check CHECK ((late_fee_amount >= (0)::numeric)),
    CONSTRAINT lease_payment_due_day_check CHECK (((payment_due_day >= 1) AND (payment_due_day <= 31))),
    CONSTRAINT lease_renewal_notice_days_check CHECK ((renewal_notice_days >= 0)),
    CONSTRAINT lease_rent_amount_check CHECK ((rent_amount >= (0)::numeric))
);


ALTER TABLE public.lease OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 49279)
-- Name: lease_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lease_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lease_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    reason text,
    performed_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lease_history OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 49752)
-- Name: maintenance_photo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_photo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    document_id uuid NOT NULL,
    photo_type character varying(20) DEFAULT 'before'::character varying NOT NULL,
    uploaded_by uuid NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    CONSTRAINT maintenance_photo_photo_type_check CHECK (((photo_type)::text = ANY ((ARRAY['before'::character varying, 'after'::character varying])::text[])))
);


ALTER TABLE public.maintenance_photo OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 49315)
-- Name: maintenance_request_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.maintenance_request_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenance_request_number_seq OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 49672)
-- Name: maintenance_request; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_request (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    landlord_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    reported_by uuid NOT NULL,
    request_number character varying(50) DEFAULT ('MR-'::text || nextval('public.maintenance_request_number_seq'::regclass)) NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    category public.maintenance_category NOT NULL,
    priority public.maintenance_priority DEFAULT 'medium'::public.maintenance_priority NOT NULL,
    status public.maintenance_status DEFAULT 'needs_repair'::public.maintenance_status NOT NULL,
    assigned_to uuid,
    worker_name character varying(200),
    assigned_at timestamp with time zone,
    scheduled_date date,
    scheduled_time time without time zone,
    completed_at timestamp with time zone,
    completion_notes text,
    tenant_confirmed boolean DEFAULT false,
    tenant_confirmed_at timestamp with time zone,
    escalated boolean DEFAULT false,
    escalated_at timestamp with time zone,
    escalation_reason text,
    actual_cost numeric(10,2),
    estimated_cost numeric(10,2),
    contractor_name character varying(200),
    contractor_phone character varying(20),
    contractor_cost numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT maintenance_request_actual_cost_check CHECK ((actual_cost >= (0)::numeric)),
    CONSTRAINT maintenance_request_contractor_cost_check CHECK ((contractor_cost >= (0)::numeric)),
    CONSTRAINT maintenance_request_estimated_cost_check CHECK ((estimated_cost >= (0)::numeric))
);


ALTER TABLE public.maintenance_request OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 49729)
-- Name: maintenance_update; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_update (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    updated_by uuid NOT NULL,
    status_from public.maintenance_status,
    status_to public.maintenance_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.maintenance_update OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 49890)
-- Name: message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid,
    property_id uuid,
    subject character varying(200),
    body text NOT NULL,
    message_type public.message_type DEFAULT 'direct'::public.message_type NOT NULL,
    priority public.message_priority DEFAULT 'normal'::public.message_priority NOT NULL,
    is_read boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    parent_message_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT message_check CHECK (((message_type = 'broadcast'::public.message_type) OR (recipient_id IS NOT NULL)))
);


ALTER TABLE public.message OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 49929)
-- Name: message_attachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_attachment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid NOT NULL,
    document_id uuid NOT NULL
);


ALTER TABLE public.message_attachment OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 49948)
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    title character varying(200) NOT NULL,
    body text NOT NULL,
    related_entity_id uuid,
    related_entity_type character varying(50),
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    email_sent boolean DEFAULT false,
    sms_sent boolean DEFAULT false,
    push_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 50057)
-- Name: password_reset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(150) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.password_reset OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 49376)
-- Name: payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid,
    tenant_id uuid NOT NULL,
    lease_id uuid NOT NULL,
    landlord_id uuid NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    payment_method public.payment_method NOT NULL,
    payment_date timestamp with time zone DEFAULT now() NOT NULL,
    bank_reference character varying(50),
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_reason text,
    proof_of_payment_url text,
    proof_uploaded_at timestamp with time zone,
    allocated_rent numeric(10,2),
    allocated_utilities numeric(10,2),
    allocated_late_fees numeric(10,2),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payment_allocated_late_fees_check CHECK ((allocated_late_fees >= (0)::numeric)),
    CONSTRAINT payment_allocated_rent_check CHECK ((allocated_rent >= (0)::numeric)),
    CONSTRAINT payment_allocated_utilities_check CHECK ((allocated_utilities >= (0)::numeric)),
    CONSTRAINT payment_amount_paid_check CHECK ((amount_paid >= (0)::numeric))
);


ALTER TABLE public.payment OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 49084)
-- Name: property; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    landlord_id uuid NOT NULL,
    caretaker_id uuid,
    name character varying(200) NOT NULL,
    property_type public.property_type DEFAULT 'residential'::public.property_type NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city character varying(100) NOT NULL,
    province character varying(100),
    postal_code character varying(4),
    country character varying(50) DEFAULT 'South Africa'::character varying,
    year_built integer,
    total_floors integer,
    total_units integer,
    has_elevator boolean DEFAULT false,
    has_parking boolean DEFAULT false,
    parking_spots integer,
    has_security boolean DEFAULT false,
    has_pool boolean DEFAULT false,
    pet_friendly boolean DEFAULT false,
    monthly_rates numeric(10,2),
    monthly_levies numeric(10,2),
    property_image_urls text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT property_monthly_levies_check CHECK ((monthly_levies >= (0)::numeric)),
    CONSTRAINT property_monthly_rates_check CHECK ((monthly_rates >= (0)::numeric))
);


ALTER TABLE public.property OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 50088)
-- Name: push_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.push_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.push_tokens OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 49314)
-- Name: receipt_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.receipt_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.receipt_number_seq OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 49426)
-- Name: receipt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receipt (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    receipt_number character varying(50) DEFAULT ('RCT-'::text || nextval('public.receipt_number_seq'::regclass)) NOT NULL,
    receipt_url text,
    issued_by uuid,
    issued_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.receipt OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 49595)
-- Name: repayment_instalment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.repayment_instalment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    repayment_plan_id uuid NOT NULL,
    payment_id uuid,
    instalment_number integer NOT NULL,
    due_date date NOT NULL,
    amount_due numeric(10,2) NOT NULL,
    amount_paid numeric(10,2) DEFAULT 0,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    paid_date timestamp with time zone,
    CONSTRAINT repayment_instalment_amount_due_check CHECK ((amount_due >= (0)::numeric)),
    CONSTRAINT repayment_instalment_amount_paid_check CHECK ((amount_paid >= (0)::numeric)),
    CONSTRAINT repayment_instalment_instalment_number_check CHECK ((instalment_number >= 1))
);


ALTER TABLE public.repayment_instalment OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 49552)
-- Name: repayment_plan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.repayment_plan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    landlord_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    instalments integer NOT NULL,
    amount_per_period numeric(10,2) NOT NULL,
    frequency public.payment_frequency DEFAULT 'monthly'::public.payment_frequency NOT NULL,
    start_date date NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    created_by uuid,
    approved_at timestamp with time zone,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_note text,
    CONSTRAINT repayment_plan_amount_per_period_check CHECK ((amount_per_period >= (0)::numeric)),
    CONSTRAINT repayment_plan_instalments_check CHECK ((instalments >= 1)),
    CONSTRAINT repayment_plan_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.repayment_plan OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 50038)
-- Name: system_setting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_setting (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value jsonb NOT NULL,
    description text,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_setting OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 50069)
-- Name: temp_password; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.temp_password (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    password_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.temp_password OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 49157)
-- Name: tenant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    landlord_id uuid NOT NULL,
    date_of_birth date,
    gender public.gender,
    nationality character varying(50),
    marital_status public.marital_status,
    id_document_type public.id_document_type,
    id_number character varying(13),
    passport_number character varying(20),
    home_address_line1 text,
    home_address_line2 text,
    home_city character varying(100),
    home_postal_code character varying(4),
    home_province character varying(100),
    home_country character varying(50),
    employment_status public.employment_status,
    employer_company character varying(100),
    employer_address text,
    employer_contact character varying(20),
    employer_official_email character varying(255),
    job_title character varying(100),
    monthly_income numeric(10,2),
    payslip_url text,
    three_months_statements text[],
    income_verified boolean DEFAULT false,
    emergency_name character varying(200),
    emergency_relationship character varying(50),
    emergency_phone character varying(20),
    emergency_email character varying(255),
    emergency_address text,
    number_of_occupants integer,
    has_pets boolean DEFAULT false,
    pet_details text,
    vehicle_count integer DEFAULT 0,
    reliability_score public.reliability_score DEFAULT 'reliable'::public.reliability_score NOT NULL,
    reliability_score_value numeric(5,2),
    tenant_since date,
    special_note text,
    profile_completed boolean DEFAULT false,
    standing public.tenant_standing DEFAULT 'good_standing'::public.tenant_standing NOT NULL,
    standing_updated_at timestamp with time zone DEFAULT now(),
    standing_reason text,
    total_fines numeric(10,2) DEFAULT 0.00,
    total_warnings integer DEFAULT 0,
    active_complaints_count integer DEFAULT 0,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tenant_active_complaints_count_check CHECK ((active_complaints_count >= 0)),
    CONSTRAINT tenant_monthly_income_check CHECK ((monthly_income >= (0)::numeric)),
    CONSTRAINT tenant_number_of_occupants_check CHECK ((number_of_occupants >= 1)),
    CONSTRAINT tenant_total_fines_check CHECK ((total_fines >= (0)::numeric)),
    CONSTRAINT tenant_total_warnings_check CHECK ((total_warnings >= 0)),
    CONSTRAINT tenant_vehicle_count_check CHECK ((vehicle_count >= 0))
);


ALTER TABLE public.tenant OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 50158)
-- Name: tenant_needs_attention; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.tenant_needs_attention AS
 SELECT id AS tenant_id,
    landlord_id,
    reliability_score,
    standing,
    (reliability_score = 'high_risk'::public.reliability_score) AS payment_flag,
    (standing <> 'good_standing'::public.tenant_standing) AS standing_flag,
    ((reliability_score = 'high_risk'::public.reliability_score) OR (standing <> 'good_standing'::public.tenant_standing)) AS needs_attention
   FROM public.tenant t;


ALTER VIEW public.tenant_needs_attention OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 49971)
-- Name: tenant_payment_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_payment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    on_time_payments integer DEFAULT 0,
    late_payments integer DEFAULT 0,
    missed_payments integer DEFAULT 0,
    partial_payments integer DEFAULT 0,
    average_days_late numeric(5,2),
    longest_streak_ontime integer DEFAULT 0,
    current_streak_ontime integer DEFAULT 0,
    last_calculated timestamp with time zone DEFAULT now(),
    CONSTRAINT tenant_payment_history_current_streak_ontime_check CHECK ((current_streak_ontime >= 0)),
    CONSTRAINT tenant_payment_history_late_payments_check CHECK ((late_payments >= 0)),
    CONSTRAINT tenant_payment_history_longest_streak_ontime_check CHECK ((longest_streak_ontime >= 0)),
    CONSTRAINT tenant_payment_history_missed_payments_check CHECK ((missed_payments >= 0)),
    CONSTRAINT tenant_payment_history_on_time_payments_check CHECK ((on_time_payments >= 0)),
    CONSTRAINT tenant_payment_history_partial_payments_check CHECK ((partial_payments >= 0))
);


ALTER TABLE public.tenant_payment_history OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 50143)
-- Name: tenant_profile; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.tenant_profile AS
 SELECT t.id,
    t.user_id,
    t.landlord_id,
    t.date_of_birth,
    t.gender,
    t.nationality,
    t.marital_status,
    t.id_document_type,
    t.id_number,
    t.passport_number,
    t.home_address_line1,
    t.home_address_line2,
    t.home_city,
    t.home_postal_code,
    t.home_province,
    t.home_country,
    t.employment_status,
    t.employer_company,
    t.employer_address,
    t.employer_contact,
    t.employer_official_email,
    t.job_title,
    t.monthly_income,
    t.payslip_url,
    t.three_months_statements,
    t.income_verified,
    t.emergency_name,
    t.emergency_relationship,
    t.emergency_phone,
    t.emergency_email,
    t.emergency_address,
    t.number_of_occupants,
    t.has_pets,
    t.pet_details,
    t.vehicle_count,
    t.reliability_score,
    t.reliability_score_value,
    t.tenant_since,
    t.special_note,
    t.profile_completed,
    t.standing,
    t.standing_updated_at,
    t.standing_reason,
    t.total_fines,
    t.total_warnings,
    t.active_complaints_count,
    t.created_by,
    t.updated_by,
    t.created_at,
    t.updated_at,
    u.first_name,
    u.last_name,
    u.full_name,
    u.email,
    u.phone,
    u.profile_image_url,
    u.status AS account_status
   FROM (public.tenant t
     JOIN public.users u ON ((u.id = t.user_id)));


ALTER VIEW public.tenant_profile OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 49999)
-- Name: tenant_score_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_score_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    old_score public.reliability_score,
    new_score public.reliability_score NOT NULL,
    old_score_value numeric(5,2),
    new_score_value numeric(5,2),
    reason text,
    changed_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tenant_score_history OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 49125)
-- Name: unit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    unit_number character varying(20) NOT NULL,
    unit_type public.unit_type,
    floor_number integer,
    square_meters numeric(10,2),
    bedrooms integer,
    bathrooms integer,
    has_balcony boolean DEFAULT false,
    has_garden boolean DEFAULT false,
    furnished boolean DEFAULT false,
    parking_bay boolean DEFAULT false,
    status public.unit_status DEFAULT 'vacant'::public.unit_status NOT NULL,
    monthly_rent numeric(10,2),
    deposit_amount numeric(10,2),
    available_from date,
    current_tenant_id uuid,
    notes text,
    last_inspection_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT unit_bathrooms_check CHECK ((bathrooms >= 0)),
    CONSTRAINT unit_bedrooms_check CHECK ((bedrooms >= 0)),
    CONSTRAINT unit_deposit_amount_check CHECK ((deposit_amount >= (0)::numeric)),
    CONSTRAINT unit_monthly_rent_check CHECK ((monthly_rent >= (0)::numeric)),
    CONSTRAINT unit_square_meters_check CHECK ((square_meters >= (0)::numeric))
);


ALTER TABLE public.unit OWNER TO postgres;

--
-- TOC entry 5548 (class 2606 OID 50032)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5449 (class 2606 OID 49064)
-- Name: caretaker caretaker_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT caretaker_pkey PRIMARY KEY (id);


--
-- TOC entry 5451 (class 2606 OID 49066)
-- Name: caretaker caretaker_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT caretaker_user_id_key UNIQUE (user_id);


--
-- TOC entry 5501 (class 2606 OID 49541)
-- Name: collection_invoice collection_invoice_collection_id_invoice_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_invoice
    ADD CONSTRAINT collection_invoice_collection_id_invoice_id_key UNIQUE (collection_id, invoice_id);


--
-- TOC entry 5503 (class 2606 OID 49539)
-- Name: collection_invoice collection_invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_invoice
    ADD CONSTRAINT collection_invoice_pkey PRIMARY KEY (id);


--
-- TOC entry 5498 (class 2606 OID 49509)
-- Name: collection collection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_pkey PRIMARY KEY (id);


--
-- TOC entry 5528 (class 2606 OID 49849)
-- Name: complaint_evidence complaint_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_evidence
    ADD CONSTRAINT complaint_evidence_pkey PRIMARY KEY (id);


--
-- TOC entry 5524 (class 2606 OID 49805)
-- Name: complaint complaint_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_pkey PRIMARY KEY (id);


--
-- TOC entry 5530 (class 2606 OID 49879)
-- Name: complaint_verdict complaint_verdict_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_verdict
    ADD CONSTRAINT complaint_verdict_pkey PRIMARY KEY (id);


--
-- TOC entry 5496 (class 2606 OID 49478)
-- Name: deposit deposit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deposit
    ADD CONSTRAINT deposit_pkey PRIMARY KEY (id);


--
-- TOC entry 5511 (class 2606 OID 49640)
-- Name: document document_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_pkey PRIMARY KEY (id);


--
-- TOC entry 5482 (class 2606 OID 49355)
-- Name: invoice invoice_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 5568 (class 2606 OID 51638)
-- Name: invoice_payments invoice_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5484 (class 2606 OID 49353)
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (id);


--
-- TOC entry 5440 (class 2606 OID 48981)
-- Name: landlord landlord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landlord
    ADD CONSTRAINT landlord_pkey PRIMARY KEY (id);


--
-- TOC entry 5445 (class 2606 OID 49044)
-- Name: landlord_settings landlord_settings_landlord_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landlord_settings
    ADD CONSTRAINT landlord_settings_landlord_id_key UNIQUE (landlord_id);


--
-- TOC entry 5447 (class 2606 OID 49042)
-- Name: landlord_settings landlord_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landlord_settings
    ADD CONSTRAINT landlord_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5442 (class 2606 OID 48983)
-- Name: landlord landlord_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landlord
    ADD CONSTRAINT landlord_user_id_key UNIQUE (user_id);


--
-- TOC entry 5478 (class 2606 OID 49292)
-- Name: lease_history lease_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease_history
    ADD CONSTRAINT lease_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5476 (class 2606 OID 49257)
-- Name: lease lease_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease
    ADD CONSTRAINT lease_pkey PRIMARY KEY (id);


--
-- TOC entry 5522 (class 2606 OID 49765)
-- Name: maintenance_photo maintenance_photo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_photo
    ADD CONSTRAINT maintenance_photo_pkey PRIMARY KEY (id);


--
-- TOC entry 5516 (class 2606 OID 49700)
-- Name: maintenance_request maintenance_request_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_pkey PRIMARY KEY (id);


--
-- TOC entry 5518 (class 2606 OID 49702)
-- Name: maintenance_request maintenance_request_request_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_request_number_key UNIQUE (request_number);


--
-- TOC entry 5520 (class 2606 OID 49741)
-- Name: maintenance_update maintenance_update_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_update
    ADD CONSTRAINT maintenance_update_pkey PRIMARY KEY (id);


--
-- TOC entry 5537 (class 2606 OID 49937)
-- Name: message_attachment message_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_attachment
    ADD CONSTRAINT message_attachment_pkey PRIMARY KEY (id);


--
-- TOC entry 5535 (class 2606 OID 49908)
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);


--
-- TOC entry 5540 (class 2606 OID 49965)
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- TOC entry 5556 (class 2606 OID 50068)
-- Name: password_reset password_reset_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset
    ADD CONSTRAINT password_reset_pkey PRIMARY KEY (id);


--
-- TOC entry 5490 (class 2606 OID 49399)
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);


--
-- TOC entry 5457 (class 2606 OID 49108)
-- Name: property property_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_pkey PRIMARY KEY (id);


--
-- TOC entry 5560 (class 2606 OID 50100)
-- Name: push_tokens push_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 5562 (class 2606 OID 50102)
-- Name: push_tokens push_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_token_key UNIQUE (token);


--
-- TOC entry 5492 (class 2606 OID 49439)
-- Name: receipt receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt
    ADD CONSTRAINT receipt_pkey PRIMARY KEY (id);


--
-- TOC entry 5494 (class 2606 OID 49441)
-- Name: receipt receipt_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt
    ADD CONSTRAINT receipt_receipt_number_key UNIQUE (receipt_number);


--
-- TOC entry 5507 (class 2606 OID 49611)
-- Name: repayment_instalment repayment_instalment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_instalment
    ADD CONSTRAINT repayment_instalment_pkey PRIMARY KEY (id);


--
-- TOC entry 5509 (class 2606 OID 49613)
-- Name: repayment_instalment repayment_instalment_repayment_plan_id_instalment_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_instalment
    ADD CONSTRAINT repayment_instalment_repayment_plan_id_instalment_number_key UNIQUE (repayment_plan_id, instalment_number);


--
-- TOC entry 5505 (class 2606 OID 49573)
-- Name: repayment_plan repayment_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_plan
    ADD CONSTRAINT repayment_plan_pkey PRIMARY KEY (id);


--
-- TOC entry 5550 (class 2606 OID 50049)
-- Name: system_setting system_setting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_setting
    ADD CONSTRAINT system_setting_pkey PRIMARY KEY (id);


--
-- TOC entry 5552 (class 2606 OID 50051)
-- Name: system_setting system_setting_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_setting
    ADD CONSTRAINT system_setting_setting_key_key UNIQUE (setting_key);


--
-- TOC entry 5558 (class 2606 OID 50082)
-- Name: temp_password temp_password_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_password
    ADD CONSTRAINT temp_password_pkey PRIMARY KEY (id);


--
-- TOC entry 5467 (class 2606 OID 49191)
-- Name: tenant tenant_id_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_id_number_key UNIQUE (id_number);


--
-- TOC entry 5542 (class 2606 OID 49991)
-- Name: tenant_payment_history tenant_payment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_payment_history
    ADD CONSTRAINT tenant_payment_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5544 (class 2606 OID 49993)
-- Name: tenant_payment_history tenant_payment_history_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_payment_history
    ADD CONSTRAINT tenant_payment_history_tenant_id_key UNIQUE (tenant_id);


--
-- TOC entry 5469 (class 2606 OID 49187)
-- Name: tenant tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_pkey PRIMARY KEY (id);


--
-- TOC entry 5546 (class 2606 OID 50010)
-- Name: tenant_score_history tenant_score_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_score_history
    ADD CONSTRAINT tenant_score_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5471 (class 2606 OID 49189)
-- Name: tenant tenant_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_user_id_key UNIQUE (user_id);


--
-- TOC entry 5461 (class 2606 OID 49148)
-- Name: unit unit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_pkey PRIMARY KEY (id);


--
-- TOC entry 5463 (class 2606 OID 49150)
-- Name: unit unit_property_id_unit_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_property_id_unit_number_key UNIQUE (property_id, unit_number);


--
-- TOC entry 5486 (class 2606 OID 51478)
-- Name: invoice uq_invoice_lease_period; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT uq_invoice_lease_period UNIQUE (lease_id, billing_period_start, billing_period_end);


--
-- TOC entry 5435 (class 2606 OID 48967)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5437 (class 2606 OID 48965)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5452 (class 1259 OID 50112)
-- Name: idx_caretaker_landlord_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_caretaker_landlord_id ON public.caretaker USING btree (landlord_id);


--
-- TOC entry 5453 (class 1259 OID 50111)
-- Name: idx_caretaker_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_caretaker_user_id ON public.caretaker USING btree (user_id);


--
-- TOC entry 5499 (class 1259 OID 50137)
-- Name: idx_collection_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_collection_tenant_id ON public.collection USING btree (tenant_id);


--
-- TOC entry 5525 (class 1259 OID 50134)
-- Name: idx_complaint_against_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaint_against_tenant ON public.complaint USING btree (against_tenant_id);


--
-- TOC entry 5526 (class 1259 OID 50135)
-- Name: idx_complaint_property_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaint_property_id ON public.complaint USING btree (property_id);


--
-- TOC entry 5531 (class 1259 OID 50136)
-- Name: idx_complaint_verdict_complaint_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaint_verdict_complaint_id ON public.complaint_verdict USING btree (complaint_id);


--
-- TOC entry 5512 (class 1259 OID 50126)
-- Name: idx_document_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_tenant_id ON public.document USING btree (tenant_id);


--
-- TOC entry 5479 (class 1259 OID 50122)
-- Name: idx_invoice_lease_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_lease_id ON public.invoice USING btree (lease_id);


--
-- TOC entry 5563 (class 1259 OID 51649)
-- Name: idx_invoice_payments_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_payments_invoice_id ON public.invoice_payments USING btree (invoice_id);


--
-- TOC entry 5564 (class 1259 OID 51652)
-- Name: idx_invoice_payments_payment_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_payments_payment_date ON public.invoice_payments USING btree (payment_date);


--
-- TOC entry 5565 (class 1259 OID 51650)
-- Name: idx_invoice_payments_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_payments_payment_id ON public.invoice_payments USING btree (payment_id);


--
-- TOC entry 5566 (class 1259 OID 51651)
-- Name: idx_invoice_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_payments_status ON public.invoice_payments USING btree (status);


--
-- TOC entry 5480 (class 1259 OID 50123)
-- Name: idx_invoice_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_tenant_id ON public.invoice USING btree (tenant_id);


--
-- TOC entry 5443 (class 1259 OID 50110)
-- Name: idx_landlord_settings_landlord_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_landlord_settings_landlord_id ON public.landlord_settings USING btree (landlord_id);


--
-- TOC entry 5438 (class 1259 OID 50109)
-- Name: idx_landlord_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_landlord_user_id ON public.landlord USING btree (user_id);


--
-- TOC entry 5472 (class 1259 OID 50121)
-- Name: idx_lease_landlord_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lease_landlord_id ON public.lease USING btree (landlord_id);


--
-- TOC entry 5473 (class 1259 OID 50119)
-- Name: idx_lease_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lease_tenant_id ON public.lease USING btree (tenant_id);


--
-- TOC entry 5474 (class 1259 OID 50120)
-- Name: idx_lease_unit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lease_unit_id ON public.lease USING btree (unit_id);


--
-- TOC entry 5513 (class 1259 OID 50128)
-- Name: idx_maintenance_request_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintenance_request_tenant_id ON public.maintenance_request USING btree (tenant_id);


--
-- TOC entry 5514 (class 1259 OID 50127)
-- Name: idx_maintenance_request_unit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintenance_request_unit_id ON public.maintenance_request USING btree (unit_id);


--
-- TOC entry 5532 (class 1259 OID 50130)
-- Name: idx_message_recipient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_message_recipient_id ON public.message USING btree (recipient_id);


--
-- TOC entry 5533 (class 1259 OID 50129)
-- Name: idx_message_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_message_sender_id ON public.message USING btree (sender_id);


--
-- TOC entry 5538 (class 1259 OID 50131)
-- Name: idx_notification_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_user_id ON public.notification USING btree (user_id);


--
-- TOC entry 5553 (class 1259 OID 50133)
-- Name: idx_password_reset_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_code ON public.password_reset USING btree (code);


--
-- TOC entry 5554 (class 1259 OID 50132)
-- Name: idx_password_reset_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_email ON public.password_reset USING btree (email);


--
-- TOC entry 5487 (class 1259 OID 50124)
-- Name: idx_payment_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_invoice_id ON public.payment USING btree (invoice_id);


--
-- TOC entry 5488 (class 1259 OID 50125)
-- Name: idx_payment_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_tenant_id ON public.payment USING btree (tenant_id);


--
-- TOC entry 5454 (class 1259 OID 50116)
-- Name: idx_property_caretaker_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_caretaker_id ON public.property USING btree (caretaker_id);


--
-- TOC entry 5455 (class 1259 OID 50115)
-- Name: idx_property_landlord_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_landlord_id ON public.property USING btree (landlord_id);


--
-- TOC entry 5464 (class 1259 OID 50114)
-- Name: idx_tenant_landlord_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_landlord_id ON public.tenant USING btree (landlord_id);


--
-- TOC entry 5465 (class 1259 OID 50113)
-- Name: idx_tenant_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_user_id ON public.tenant USING btree (user_id);


--
-- TOC entry 5458 (class 1259 OID 50118)
-- Name: idx_unit_current_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unit_current_tenant_id ON public.unit USING btree (current_tenant_id);


--
-- TOC entry 5459 (class 1259 OID 50117)
-- Name: idx_unit_property_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unit_property_id ON public.unit USING btree (property_id);


--
-- TOC entry 5569 (class 1259 OID 51653)
-- Name: uq_invoice_payments_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_invoice_payments_payment_id ON public.invoice_payments USING btree (payment_id) WHERE (payment_id IS NOT NULL);


--
-- TOC entry 5665 (class 2620 OID 49083)
-- Name: caretaker trg_check_role_caretaker; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_role_caretaker BEFORE INSERT ON public.caretaker FOR EACH ROW EXECUTE FUNCTION public.check_user_role('caretaker');


--
-- TOC entry 5662 (class 2620 OID 48990)
-- Name: landlord trg_check_role_landlord; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_role_landlord BEFORE INSERT ON public.landlord FOR EACH ROW EXECUTE FUNCTION public.check_user_role('landlord');


--
-- TOC entry 5669 (class 2620 OID 49213)
-- Name: tenant trg_check_role_tenant; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_role_tenant BEFORE INSERT ON public.tenant FOR EACH ROW EXECUTE FUNCTION public.check_user_role('tenant');


--
-- TOC entry 5672 (class 2620 OID 51657)
-- Name: payment trg_payment_status_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payment_status_change AFTER UPDATE OF status ON public.payment FOR EACH ROW EXECUTE FUNCTION public.handle_payment_status_change();


--
-- TOC entry 5682 (class 2620 OID 51655)
-- Name: invoice_payments trg_recalculate_invoice_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recalculate_invoice_status AFTER INSERT OR DELETE OR UPDATE OF status, amount ON public.invoice_payments FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_invoice_status();


--
-- TOC entry 5666 (class 2620 OID 49082)
-- Name: caretaker trg_touch_caretaker; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_caretaker BEFORE UPDATE ON public.caretaker FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5675 (class 2620 OID 49530)
-- Name: collection trg_touch_collection; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_collection BEFORE UPDATE ON public.collection FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5679 (class 2620 OID 49836)
-- Name: complaint trg_touch_complaint; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_complaint BEFORE UPDATE ON public.complaint FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5674 (class 2620 OID 49489)
-- Name: deposit trg_touch_deposit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_deposit BEFORE UPDATE ON public.deposit FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5677 (class 2620 OID 49671)
-- Name: document trg_touch_document; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_document BEFORE UPDATE ON public.document FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5683 (class 2620 OID 51668)
-- Name: invoice_payments trg_touch_invoice_payments; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_invoice_payments BEFORE UPDATE ON public.invoice_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5663 (class 2620 OID 48989)
-- Name: landlord trg_touch_landlord; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_landlord BEFORE UPDATE ON public.landlord FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5664 (class 2620 OID 49050)
-- Name: landlord_settings trg_touch_landlord_settings; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_landlord_settings BEFORE UPDATE ON public.landlord_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5671 (class 2620 OID 49278)
-- Name: lease trg_touch_lease; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_lease BEFORE UPDATE ON public.lease FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5678 (class 2620 OID 49728)
-- Name: maintenance_request trg_touch_maintenance_request; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_maintenance_request BEFORE UPDATE ON public.maintenance_request FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5673 (class 2620 OID 49425)
-- Name: payment trg_touch_payment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_payment BEFORE UPDATE ON public.payment FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5667 (class 2620 OID 49119)
-- Name: property trg_touch_property; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_property BEFORE UPDATE ON public.property FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5681 (class 2620 OID 50108)
-- Name: push_tokens trg_touch_push_tokens; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_push_tokens BEFORE UPDATE ON public.push_tokens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5676 (class 2620 OID 49594)
-- Name: repayment_plan trg_touch_repayment_plan; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_repayment_plan BEFORE UPDATE ON public.repayment_plan FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5670 (class 2620 OID 49212)
-- Name: tenant trg_touch_tenant; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_tenant BEFORE UPDATE ON public.tenant FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5668 (class 2620 OID 49156)
-- Name: unit trg_touch_unit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_unit BEFORE UPDATE ON public.unit FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5661 (class 2620 OID 48968)
-- Name: users trg_touch_users; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_touch_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5680 (class 2620 OID 50139)
-- Name: complaint_verdict trigger_apply_complaint_verdict; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_apply_complaint_verdict AFTER INSERT ON public.complaint_verdict FOR EACH ROW EXECUTE FUNCTION public.apply_complaint_verdict();


--
-- TOC entry 5655 (class 2606 OID 50033)
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5572 (class 2606 OID 49077)
-- Name: caretaker caretaker_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT caretaker_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5573 (class 2606 OID 49072)
-- Name: caretaker caretaker_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT caretaker_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);


--
-- TOC entry 5574 (class 2606 OID 49067)
-- Name: caretaker caretaker_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT caretaker_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5606 (class 2606 OID 49525)
-- Name: collection collection_flagged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.users(id);


--
-- TOC entry 5610 (class 2606 OID 49542)
-- Name: collection_invoice collection_invoice_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_invoice
    ADD CONSTRAINT collection_invoice_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collection(id) ON DELETE CASCADE;


--
-- TOC entry 5611 (class 2606 OID 49547)
-- Name: collection_invoice collection_invoice_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_invoice
    ADD CONSTRAINT collection_invoice_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);


--
-- TOC entry 5607 (class 2606 OID 49520)
-- Name: collection collection_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);


--
-- TOC entry 5608 (class 2606 OID 49515)
-- Name: collection collection_lease_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease(id);


--
-- TOC entry 5609 (class 2606 OID 49510)
-- Name: collection collection_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5634 (class 2606 OID 49821)
-- Name: complaint complaint_against_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_against_tenant_id_fkey FOREIGN KEY (against_tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5635 (class 2606 OID 49826)
-- Name: complaint complaint_against_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_against_unit_id_fkey FOREIGN KEY (against_unit_id) REFERENCES public.unit(id);


--
-- TOC entry 5640 (class 2606 OID 49850)
-- Name: complaint_evidence complaint_evidence_complaint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_evidence
    ADD CONSTRAINT complaint_evidence_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaint(id);


--
-- TOC entry 5641 (class 2606 OID 49855)
-- Name: complaint_evidence complaint_evidence_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_evidence
    ADD CONSTRAINT complaint_evidence_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.document(id);


--
-- TOC entry 5642 (class 2606 OID 49860)
-- Name: complaint_evidence complaint_evidence_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_evidence
    ADD CONSTRAINT complaint_evidence_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- TOC entry 5636 (class 2606 OID 49811)
-- Name: complaint complaint_filed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_filed_by_fkey FOREIGN KEY (filed_by) REFERENCES public.users(id);


--
-- TOC entry 5637 (class 2606 OID 49816)
-- Name: complaint complaint_filed_by_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_filed_by_tenant_id_fkey FOREIGN KEY (filed_by_tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5638 (class 2606 OID 49806)
-- Name: complaint complaint_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id);


--
-- TOC entry 5639 (class 2606 OID 49831)
-- Name: complaint complaint_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- TOC entry 5643 (class 2606 OID 49880)
-- Name: complaint_verdict complaint_verdict_complaint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_verdict
    ADD CONSTRAINT complaint_verdict_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaint(id);


--
-- TOC entry 5644 (class 2606 OID 49885)
-- Name: complaint_verdict complaint_verdict_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_verdict
    ADD CONSTRAINT complaint_verdict_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.users(id);


--
-- TOC entry 5604 (class 2606 OID 49479)
-- Name: deposit deposit_lease_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deposit
    ADD CONSTRAINT deposit_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease(id);


--
-- TOC entry 5605 (class 2606 OID 49484)
-- Name: deposit deposit_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deposit
    ADD CONSTRAINT deposit_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5618 (class 2606 OID 49646)
-- Name: document document_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);


--
-- TOC entry 5619 (class 2606 OID 49656)
-- Name: document document_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id);


--
-- TOC entry 5620 (class 2606 OID 49641)
-- Name: document document_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5621 (class 2606 OID 49651)
-- Name: document document_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit(id);


--
-- TOC entry 5622 (class 2606 OID 49661)
-- Name: document document_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- TOC entry 5623 (class 2606 OID 49666)
-- Name: document document_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- TOC entry 5575 (class 2606 OID 49120)
-- Name: caretaker fk_caretaker_assigned_property; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT fk_caretaker_assigned_property FOREIGN KEY (assigned_property) REFERENCES public.property(id);


--
-- TOC entry 5578 (class 2606 OID 49214)
-- Name: unit fk_unit_current_tenant; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT fk_unit_current_tenant FOREIGN KEY (current_tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5592 (class 2606 OID 49371)
-- Name: invoice invoice_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);


--
-- TOC entry 5593 (class 2606 OID 49356)
-- Name: invoice invoice_lease_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease(id);


--
-- TOC entry 5659 (class 2606 OID 51639)
-- Name: invoice_payments invoice_payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id) ON DELETE CASCADE;


--
-- TOC entry 5660 (class 2606 OID 51644)
-- Name: invoice_payments invoice_payments_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payment(id) ON DELETE SET NULL;


--
-- TOC entry 5594 (class 2606 OID 49361)
-- Name: invoice invoice_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5595 (class 2606 OID 49366)
-- Name: invoice invoice_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit(id);


--
-- TOC entry 5571 (class 2606 OID 49045)
-- Name: landlord_settings landlord_settings_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landlord_settings
    ADD CONSTRAINT landlord_settings_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id) ON DELETE CASCADE;


--
-- TOC entry 5570 (class 2606 OID 48984)
-- Name: landlord landlord_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landlord
    ADD CONSTRAINT landlord_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5584 (class 2606 OID 49273)
-- Name: lease lease_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease
    ADD CONSTRAINT lease_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5588 (class 2606 OID 49293)
-- Name: lease_history lease_history_lease_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease_history
    ADD CONSTRAINT lease_history_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease(id);


--
-- TOC entry 5589 (class 2606 OID 49308)
-- Name: lease_history lease_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease_history
    ADD CONSTRAINT lease_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- TOC entry 5590 (class 2606 OID 49298)
-- Name: lease_history lease_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease_history
    ADD CONSTRAINT lease_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5591 (class 2606 OID 49303)
-- Name: lease_history lease_history_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease_history
    ADD CONSTRAINT lease_history_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit(id);


--
-- TOC entry 5585 (class 2606 OID 49268)
-- Name: lease lease_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease
    ADD CONSTRAINT lease_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);


--
-- TOC entry 5586 (class 2606 OID 49258)
-- Name: lease lease_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease
    ADD CONSTRAINT lease_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5587 (class 2606 OID 49263)
-- Name: lease lease_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lease
    ADD CONSTRAINT lease_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit(id);


--
-- TOC entry 5631 (class 2606 OID 49771)
-- Name: maintenance_photo maintenance_photo_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_photo
    ADD CONSTRAINT maintenance_photo_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.document(id);


--
-- TOC entry 5632 (class 2606 OID 49766)
-- Name: maintenance_photo maintenance_photo_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_photo
    ADD CONSTRAINT maintenance_photo_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_request(id);


--
-- TOC entry 5633 (class 2606 OID 49776)
-- Name: maintenance_photo maintenance_photo_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_photo
    ADD CONSTRAINT maintenance_photo_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- TOC entry 5624 (class 2606 OID 49723)
-- Name: maintenance_request maintenance_request_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- TOC entry 5625 (class 2606 OID 49708)
-- Name: maintenance_request maintenance_request_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);


--
-- TOC entry 5626 (class 2606 OID 49718)
-- Name: maintenance_request maintenance_request_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(id);


--
-- TOC entry 5627 (class 2606 OID 49703)
-- Name: maintenance_request maintenance_request_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5628 (class 2606 OID 49713)
-- Name: maintenance_request maintenance_request_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit(id);


--
-- TOC entry 5629 (class 2606 OID 49742)
-- Name: maintenance_update maintenance_update_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_update
    ADD CONSTRAINT maintenance_update_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_request(id);


--
-- TOC entry 5630 (class 2606 OID 49747)
-- Name: maintenance_update maintenance_update_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_update
    ADD CONSTRAINT maintenance_update_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- TOC entry 5649 (class 2606 OID 49943)
-- Name: message_attachment message_attachment_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_attachment
    ADD CONSTRAINT message_attachment_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.document(id);


--
-- TOC entry 5650 (class 2606 OID 49938)
-- Name: message_attachment message_attachment_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_attachment
    ADD CONSTRAINT message_attachment_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.message(id);


--
-- TOC entry 5645 (class 2606 OID 49924)
-- Name: message message_parent_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_parent_message_id_fkey FOREIGN KEY (parent_message_id) REFERENCES public.message(id);


--
-- TOC entry 5646 (class 2606 OID 49919)
-- Name: message message_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id);


--
-- TOC entry 5647 (class 2606 OID 49914)
-- Name: message message_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id);


--
-- TOC entry 5648 (class 2606 OID 49909)
-- Name: message message_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- TOC entry 5651 (class 2606 OID 49966)
-- Name: notification notification_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5596 (class 2606 OID 49420)
-- Name: payment payment_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- TOC entry 5597 (class 2606 OID 49400)
-- Name: payment payment_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);


--
-- TOC entry 5598 (class 2606 OID 49415)
-- Name: payment payment_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);


--
-- TOC entry 5599 (class 2606 OID 49410)
-- Name: payment payment_lease_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease(id);


--
-- TOC entry 5600 (class 2606 OID 49405)
-- Name: payment payment_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5576 (class 2606 OID 49114)
-- Name: property property_caretaker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_caretaker_id_fkey FOREIGN KEY (caretaker_id) REFERENCES public.caretaker(id);


--
-- TOC entry 5577 (class 2606 OID 49109)
-- Name: property property_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);


--
-- TOC entry 5658 (class 2606 OID 50103)
-- Name: push_tokens push_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5601 (class 2606 OID 49452)
-- Name: receipt receipt_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt
    ADD CONSTRAINT receipt_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.users(id);


--
-- TOC entry 5602 (class 2606 OID 49442)
-- Name: receipt receipt_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt
    ADD CONSTRAINT receipt_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payment(id);


--
-- TOC entry 5603 (class 2606 OID 49447)
-- Name: receipt receipt_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt
    ADD CONSTRAINT receipt_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5616 (class 2606 OID 49619)
-- Name: repayment_instalment repayment_instalment_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_instalment
    ADD CONSTRAINT repayment_instalment_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payment(id);


--
-- TOC entry 5617 (class 2606 OID 49614)
-- Name: repayment_instalment repayment_instalment_repayment_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_instalment
    ADD CONSTRAINT repayment_instalment_repayment_plan_id_fkey FOREIGN KEY (repayment_plan_id) REFERENCES public.repayment_plan(id);


--
-- TOC entry 5612 (class 2606 OID 49589)
-- Name: repayment_plan repayment_plan_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_plan
    ADD CONSTRAINT repayment_plan_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- TOC entry 5613 (class 2606 OID 49584)
-- Name: repayment_plan repayment_plan_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_plan
    ADD CONSTRAINT repayment_plan_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5614 (class 2606 OID 49574)
-- Name: repayment_plan repayment_plan_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_plan
    ADD CONSTRAINT repayment_plan_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);


--
-- TOC entry 5615 (class 2606 OID 49579)
-- Name: repayment_plan repayment_plan_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repayment_plan
    ADD CONSTRAINT repayment_plan_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5656 (class 2606 OID 50052)
-- Name: system_setting system_setting_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_setting
    ADD CONSTRAINT system_setting_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- TOC entry 5657 (class 2606 OID 50083)
-- Name: temp_password temp_password_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_password
    ADD CONSTRAINT temp_password_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5580 (class 2606 OID 49202)
-- Name: tenant tenant_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5581 (class 2606 OID 49197)
-- Name: tenant tenant_landlord_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);


--
-- TOC entry 5652 (class 2606 OID 49994)
-- Name: tenant_payment_history tenant_payment_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_payment_history
    ADD CONSTRAINT tenant_payment_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5653 (class 2606 OID 50016)
-- Name: tenant_score_history tenant_score_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_score_history
    ADD CONSTRAINT tenant_score_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- TOC entry 5654 (class 2606 OID 50011)
-- Name: tenant_score_history tenant_score_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_score_history
    ADD CONSTRAINT tenant_score_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);


--
-- TOC entry 5582 (class 2606 OID 49207)
-- Name: tenant tenant_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- TOC entry 5583 (class 2606 OID 49192)
-- Name: tenant tenant_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5579 (class 2606 OID 49151)
-- Name: unit unit_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id);


--
-- TOC entry 5840 (class 0 OID 49781)
-- Dependencies: 244
-- Name: complaint; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.complaint ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5850 (class 3256 OID 50173)
-- Name: complaint complaint_landlord_scope; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY complaint_landlord_scope ON public.complaint USING ((property_id IN ( SELECT property.id
   FROM public.property
  WHERE ((property.landlord_id)::text = current_setting('app.current_landlord_id'::text, true)))));


--
-- TOC entry 5838 (class 0 OID 49316)
-- Dependencies: 232
-- Name: invoice; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5848 (class 3256 OID 50170)
-- Name: invoice invoice_landlord_scope; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY invoice_landlord_scope ON public.invoice USING (((landlord_id)::text = current_setting('app.current_landlord_id'::text, true)));


--
-- TOC entry 5841 (class 0 OID 51618)
-- Dependencies: 261
-- Name: invoice_payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5853 (class 3256 OID 51666)
-- Name: invoice_payments invoice_payments_landlord_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY invoice_payments_landlord_insert ON public.invoice_payments FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.landlord l
  WHERE (l.user_id = ( SELECT (current_setting('app.current_user_id'::text, true))::uuid AS current_setting)))));


--
-- TOC entry 5852 (class 3256 OID 51665)
-- Name: invoice_payments invoice_payments_landlord_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY invoice_payments_landlord_select ON public.invoice_payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.landlord l
  WHERE (l.user_id = ( SELECT (current_setting('app.current_user_id'::text, true))::uuid AS current_setting)))));


--
-- TOC entry 5854 (class 3256 OID 51667)
-- Name: invoice_payments invoice_payments_landlord_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY invoice_payments_landlord_update ON public.invoice_payments FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.landlord l
  WHERE (l.user_id = ( SELECT (current_setting('app.current_user_id'::text, true))::uuid AS current_setting)))));


--
-- TOC entry 5851 (class 3256 OID 51663)
-- Name: invoice_payments invoice_payments_tenant_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY invoice_payments_tenant_select ON public.invoice_payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.invoice i
     JOIN public.tenant t ON ((t.id = i.tenant_id)))
  WHERE ((i.id = invoice_payments.invoice_id) AND (t.user_id = ( SELECT (current_setting('app.current_user_id'::text, true))::uuid AS current_setting))))));


--
-- TOC entry 5849 (class 3256 OID 50171)
-- Name: invoice invoice_tenant_scope; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY invoice_tenant_scope ON public.invoice USING ((tenant_id IN ( SELECT tenant.id
   FROM public.tenant
  WHERE ((tenant.user_id)::text = current_setting('app.current_user_id'::text, true)))));


--
-- TOC entry 5837 (class 0 OID 49219)
-- Dependencies: 227
-- Name: lease; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lease ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5844 (class 3256 OID 50164)
-- Name: lease lease_landlord_scope; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lease_landlord_scope ON public.lease USING (((landlord_id)::text = current_setting('app.current_landlord_id'::text, true)));


--
-- TOC entry 5845 (class 3256 OID 50165)
-- Name: lease lease_tenant_scope; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lease_tenant_scope ON public.lease USING ((tenant_id IN ( SELECT tenant.id
   FROM public.tenant
  WHERE ((tenant.user_id)::text = current_setting('app.current_user_id'::text, true)))));


--
-- TOC entry 5839 (class 0 OID 49376)
-- Dependencies: 233
-- Name: payment; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payment ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5846 (class 3256 OID 50167)
-- Name: payment payment_landlord_scope; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payment_landlord_scope ON public.payment USING (((landlord_id)::text = current_setting('app.current_landlord_id'::text, true)));


--
-- TOC entry 5847 (class 3256 OID 50168)
-- Name: payment payment_tenant_scope; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payment_tenant_scope ON public.payment USING ((tenant_id IN ( SELECT tenant.id
   FROM public.tenant
  WHERE ((tenant.user_id)::text = current_setting('app.current_user_id'::text, true)))));


--
-- TOC entry 5836 (class 0 OID 49157)
-- Dependencies: 226
-- Name: tenant; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tenant ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5842 (class 3256 OID 50162)
-- Name: tenant tenant_landlord_scope; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_landlord_scope ON public.tenant USING (((landlord_id)::text = current_setting('app.current_landlord_id'::text, true)));


--
-- TOC entry 5843 (class 3256 OID 50163)
-- Name: tenant tenant_self_scope; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_self_scope ON public.tenant USING (((user_id)::text = current_setting('app.current_user_id'::text, true)));


-- Completed on 2026-07-23 02:28:12

--
-- PostgreSQL database dump complete
--


