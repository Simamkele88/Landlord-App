CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE SEQUENCE public.invoice_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.maintenance_request_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.receipt_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

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

CREATE TYPE public.complaint_scope AS ENUM (
    'specific_tenant',
    'common_area',
    'unknown',
    'property_wide'
);

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

CREATE TYPE public.deposit_status AS ENUM (
    'unpaid',
    'paid',
    'partially_refunded',
    'fully_refunded',
    'forfeited'
);

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

CREATE TYPE public.employment_status AS ENUM (
    'employed',
    'self_employed',
    'student',
    'retired',
    'unemployed',
    'other'
);

CREATE TYPE public.gender AS ENUM (
    'male',
    'female',
    'other',
    'prefer_not_to_say'
);

CREATE TYPE public.id_document_type AS ENUM (
    'sa_id',
    'passport',
    'drivers_license',
    'asylum_seeker',
    'work_permit'
);

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'partial',
    'cancelled',
    'void'
);

CREATE TYPE public.lease_status AS ENUM (
    'draft',
    'active',
    'expired',
    'terminated',
    'renewed',
    'cancelled'
);

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

CREATE TYPE public.maintenance_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent',
    'emergency'
);

CREATE TYPE public.maintenance_status AS ENUM (
    'needs_repair',
    'assigned',
    'in_progress',
    'completed',
    'cancelled',
    'pending_approval',
    'closed'
);

CREATE TYPE public.marital_status AS ENUM (
    'single',
    'married',
    'divorced',
    'widowed',
    'separated'
);

CREATE TYPE public.message_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);

CREATE TYPE public.message_type AS ENUM (
    'direct',
    'broadcast',
    'maintenance_update',
    'payment_reminder',
    'lease_renewal',
    'announcement'
);

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

CREATE TYPE public.payment_frequency AS ENUM (
    'weekly',
    'monthly',
    'quarterly',
    'annually'
);

CREATE TYPE public.payment_method AS ENUM (
    'bank_transfer',
    'eft',
    'cash',
    'card',
    'mobile_wallet',
    'direct_deposit'
);

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'pending_approval',
    'paid',
    'late',
    'partial',
    'rejected',
    'collections'
);

CREATE TYPE public.property_type AS ENUM (
    'residential',
    'commercial',
    'mixed_use'
);

CREATE TYPE public.reliability_score AS ENUM (
    'reliable',
    'moderate_risk',
    'high_risk'
);

CREATE TYPE public.tenant_standing AS ENUM (
    'good_standing',
    'warning_issued',
    'fine_issued',
    'final_warning',
    'eviction_notice',
    'evicted'
);

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

CREATE TYPE public.unit_status AS ENUM (
    'occupied',
    'vacant',
    'maintenance',
    'reserved'
);

CREATE TYPE public.unit_type AS ENUM (
    'studio',
    '1_bedroom',
    '2_bedroom',
    '3_bedroom',
    '4_bedroom',
    'penthouse'
);

CREATE TYPE public.user_role AS ENUM (
    'landlord',
    'caretaker',
    'tenant'
);

CREATE TYPE public.user_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending_verification'
);

CREATE TYPE public.verdict_type AS ENUM (
    'warning',
    'fine',
    'dismissed'
);

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

CREATE TABLE public.collection_invoice (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    collection_id uuid NOT NULL,
    invoice_id uuid NOT NULL
);

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

CREATE TABLE public.complaint_evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    complaint_id uuid NOT NULL,
    document_id uuid NOT NULL,
    evidence_type character varying(50) DEFAULT 'photo'::character varying NOT NULL,
    uploaded_by uuid NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now()
);

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
    used_amount numeric(10,2) DEFAULT 0 NOT NULL,
    CONSTRAINT deposit_amount_paid_check CHECK ((amount_paid >= (0)::numeric)),
    CONSTRAINT deposit_deposit_amount_check CHECK ((deposit_amount >= (0)::numeric)),
    CONSTRAINT deposit_refund_amount_check CHECK ((refund_amount >= (0)::numeric))
);

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
    invoice_type text DEFAULT 'rent'::text NOT NULL,
    CONSTRAINT invoice_amount_due_check CHECK ((amount_due >= (0)::numeric)),
    CONSTRAINT invoice_check CHECK ((billing_period_end > billing_period_start)),
    CONSTRAINT invoice_discounts_check CHECK ((discounts >= (0)::numeric)),
    CONSTRAINT invoice_late_fees_check CHECK ((late_fees >= (0)::numeric)),
    CONSTRAINT invoice_other_charges_check CHECK ((other_charges >= (0)::numeric)),
    CONSTRAINT invoice_paid_amount_check CHECK ((paid_amount >= (0)::numeric)),
    CONSTRAINT invoice_rent_amount_check CHECK ((rent_amount >= (0)::numeric)),
    CONSTRAINT invoice_type_check CHECK ((invoice_type = ANY (ARRAY['rent'::text, 'deposit'::text, 'utility'::text, 'damage'::text, 'other'::text, 'fine'::text]))),
    CONSTRAINT invoice_utilities_amount_check CHECK ((utilities_amount >= (0)::numeric))
);

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

CREATE TABLE public.maintenance_photo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    document_id uuid NOT NULL,
    photo_type character varying(20) DEFAULT 'before'::character varying NOT NULL,
    uploaded_by uuid NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    CONSTRAINT maintenance_photo_photo_type_check CHECK (((photo_type)::text = ANY ((ARRAY['before'::character varying, 'after'::character varying])::text[])))
);

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

CREATE TABLE public.maintenance_update (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    updated_by uuid NOT NULL,
    status_from public.maintenance_status,
    status_to public.maintenance_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

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

CREATE TABLE public.message_attachment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid NOT NULL,
    document_id uuid NOT NULL
);

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

CREATE TABLE public.password_reset (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(150) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

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
    latitude numeric(10,7) DEFAULT NULL::numeric,
    longitude numeric(10,7) DEFAULT NULL::numeric,
    CONSTRAINT property_latitude_check CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)))),
    CONSTRAINT property_longitude_check CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))),
    CONSTRAINT property_monthly_levies_check CHECK ((monthly_levies >= (0)::numeric)),
    CONSTRAINT property_monthly_rates_check CHECK ((monthly_rates >= (0)::numeric))
);

CREATE TABLE public.push_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.receipt (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    receipt_number character varying(50) DEFAULT ('RCT-'::text || nextval('public.receipt_number_seq'::regclass)) NOT NULL,
    receipt_url text,
    issued_by uuid,
    issued_at timestamp with time zone DEFAULT now()
);

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

CREATE TABLE public.repayment_plan_invoice (
    repayment_plan_id uuid NOT NULL,
    invoice_id uuid NOT NULL
);

CREATE TABLE public.system_setting (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value jsonb NOT NULL,
    description text,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.temp_password (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    password_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

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

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT caretaker_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT caretaker_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY public.collection_invoice
    ADD CONSTRAINT collection_invoice_collection_id_invoice_id_key UNIQUE (collection_id, invoice_id);

ALTER TABLE ONLY public.collection_invoice
    ADD CONSTRAINT collection_invoice_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.complaint_evidence
    ADD CONSTRAINT complaint_evidence_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.complaint_verdict
    ADD CONSTRAINT complaint_verdict_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.deposit
    ADD CONSTRAINT deposit_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_invoice_number_key UNIQUE (invoice_number);

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.landlord
    ADD CONSTRAINT landlord_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.landlord_settings
    ADD CONSTRAINT landlord_settings_landlord_id_key UNIQUE (landlord_id);

ALTER TABLE ONLY public.landlord_settings
    ADD CONSTRAINT landlord_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.landlord
    ADD CONSTRAINT landlord_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY public.lease_history
    ADD CONSTRAINT lease_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease
    ADD CONSTRAINT lease_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.maintenance_photo
    ADD CONSTRAINT maintenance_photo_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_request_number_key UNIQUE (request_number);

ALTER TABLE ONLY public.maintenance_update
    ADD CONSTRAINT maintenance_update_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.message_attachment
    ADD CONSTRAINT message_attachment_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.password_reset
    ADD CONSTRAINT password_reset_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_token_key UNIQUE (token);

ALTER TABLE ONLY public.receipt
    ADD CONSTRAINT receipt_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.receipt
    ADD CONSTRAINT receipt_receipt_number_key UNIQUE (receipt_number);

ALTER TABLE ONLY public.repayment_instalment
    ADD CONSTRAINT repayment_instalment_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.repayment_instalment
    ADD CONSTRAINT repayment_instalment_repayment_plan_id_instalment_number_key UNIQUE (repayment_plan_id, instalment_number);

ALTER TABLE ONLY public.repayment_plan_invoice
    ADD CONSTRAINT repayment_plan_invoice_pkey PRIMARY KEY (repayment_plan_id, invoice_id);

ALTER TABLE ONLY public.repayment_plan
    ADD CONSTRAINT repayment_plan_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.system_setting
    ADD CONSTRAINT system_setting_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.system_setting
    ADD CONSTRAINT system_setting_setting_key_key UNIQUE (setting_key);

ALTER TABLE ONLY public.temp_password
    ADD CONSTRAINT temp_password_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_id_number_key UNIQUE (id_number);

ALTER TABLE ONLY public.tenant_payment_history
    ADD CONSTRAINT tenant_payment_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenant_payment_history
    ADD CONSTRAINT tenant_payment_history_tenant_id_key UNIQUE (tenant_id);

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenant_score_history
    ADD CONSTRAINT tenant_score_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_property_id_unit_number_key UNIQUE (property_id, unit_number);

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT uq_invoice_lease_period UNIQUE (lease_id, billing_period_start, billing_period_end);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT caretaker_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT caretaker_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT caretaker_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.collection_invoice
    ADD CONSTRAINT collection_invoice_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collection(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.collection_invoice
    ADD CONSTRAINT collection_invoice_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease(id);

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT collection_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_against_tenant_id_fkey FOREIGN KEY (against_tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_against_unit_id_fkey FOREIGN KEY (against_unit_id) REFERENCES public.unit(id);

ALTER TABLE ONLY public.complaint_evidence
    ADD CONSTRAINT complaint_evidence_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaint(id);

ALTER TABLE ONLY public.complaint_evidence
    ADD CONSTRAINT complaint_evidence_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.document(id);

ALTER TABLE ONLY public.complaint_evidence
    ADD CONSTRAINT complaint_evidence_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_filed_by_fkey FOREIGN KEY (filed_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_filed_by_tenant_id_fkey FOREIGN KEY (filed_by_tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id);

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.complaint_verdict
    ADD CONSTRAINT complaint_verdict_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaint(id);

ALTER TABLE ONLY public.complaint_verdict
    ADD CONSTRAINT complaint_verdict_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.deposit
    ADD CONSTRAINT deposit_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease(id);

ALTER TABLE ONLY public.deposit
    ADD CONSTRAINT deposit_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id);

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit(id);

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.caretaker
    ADD CONSTRAINT fk_caretaker_assigned_property FOREIGN KEY (assigned_property) REFERENCES public.property(id);

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT fk_unit_current_tenant FOREIGN KEY (current_tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease(id);

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payment(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit(id);

ALTER TABLE ONLY public.landlord_settings
    ADD CONSTRAINT landlord_settings_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.landlord
    ADD CONSTRAINT landlord_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.lease
    ADD CONSTRAINT lease_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.lease_history
    ADD CONSTRAINT lease_history_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease(id);

ALTER TABLE ONLY public.lease_history
    ADD CONSTRAINT lease_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.lease_history
    ADD CONSTRAINT lease_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.lease_history
    ADD CONSTRAINT lease_history_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit(id);

ALTER TABLE ONLY public.lease
    ADD CONSTRAINT lease_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);

ALTER TABLE ONLY public.lease
    ADD CONSTRAINT lease_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.lease
    ADD CONSTRAINT lease_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit(id);

ALTER TABLE ONLY public.maintenance_photo
    ADD CONSTRAINT maintenance_photo_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.document(id);

ALTER TABLE ONLY public.maintenance_photo
    ADD CONSTRAINT maintenance_photo_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_request(id);

ALTER TABLE ONLY public.maintenance_photo
    ADD CONSTRAINT maintenance_photo_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.maintenance_request
    ADD CONSTRAINT maintenance_request_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit(id);

ALTER TABLE ONLY public.maintenance_update
    ADD CONSTRAINT maintenance_update_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_request(id);

ALTER TABLE ONLY public.maintenance_update
    ADD CONSTRAINT maintenance_update_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.message_attachment
    ADD CONSTRAINT message_attachment_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.document(id);

ALTER TABLE ONLY public.message_attachment
    ADD CONSTRAINT message_attachment_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.message(id);

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_parent_message_id_fkey FOREIGN KEY (parent_message_id) REFERENCES public.message(id);

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id);

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease(id);

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_caretaker_id_fkey FOREIGN KEY (caretaker_id) REFERENCES public.caretaker(id);

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.receipt
    ADD CONSTRAINT receipt_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.receipt
    ADD CONSTRAINT receipt_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payment(id);

ALTER TABLE ONLY public.receipt
    ADD CONSTRAINT receipt_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.repayment_instalment
    ADD CONSTRAINT repayment_instalment_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payment(id);

ALTER TABLE ONLY public.repayment_instalment
    ADD CONSTRAINT repayment_instalment_repayment_plan_id_fkey FOREIGN KEY (repayment_plan_id) REFERENCES public.repayment_plan(id);

ALTER TABLE ONLY public.repayment_plan
    ADD CONSTRAINT repayment_plan_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.repayment_plan
    ADD CONSTRAINT repayment_plan_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.repayment_plan_invoice
    ADD CONSTRAINT repayment_plan_invoice_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);

ALTER TABLE ONLY public.repayment_plan_invoice
    ADD CONSTRAINT repayment_plan_invoice_repayment_plan_id_fkey FOREIGN KEY (repayment_plan_id) REFERENCES public.repayment_plan(id);

ALTER TABLE ONLY public.repayment_plan
    ADD CONSTRAINT repayment_plan_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);

ALTER TABLE ONLY public.repayment_plan
    ADD CONSTRAINT repayment_plan_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.system_setting
    ADD CONSTRAINT system_setting_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.temp_password
    ADD CONSTRAINT temp_password_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.landlord(id);

ALTER TABLE ONLY public.tenant_payment_history
    ADD CONSTRAINT tenant_payment_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.tenant_score_history
    ADD CONSTRAINT tenant_score_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.tenant_score_history
    ADD CONSTRAINT tenant_score_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(id);

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id);

CREATE UNIQUE INDEX uq_invoice_payments_payment_id ON public.invoice_payments USING btree (payment_id) WHERE (payment_id IS NOT NULL);