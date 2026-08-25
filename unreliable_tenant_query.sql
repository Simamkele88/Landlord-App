-- =============================================
-- Create Abraham Moyo - Tenant with 11-month payment history (7 on-time, 4 late)
-- =============================================

-- Insert tenant user
INSERT INTO public.users (id, email, phone, password_hash, role, first_name, last_name, email_verified, phone_verified, must_change_password, status, last_login, last_active, created_at, updated_at) VALUES
('aaaaaaaa-1000-4000-a010-000000000000','abraham.moyo2@email.com','0761234568','$2b$12$W3tT7uQubTw.qbaWrVZSren9CpGeEgGiyHIhjriEskiGgZHKBTT02','tenant','Abraham','Moyo',true,true,false,'active', now() - INTERVAL '1 day', now(), CURRENT_DATE - INTERVAL '1 year', now());

-- Insert tenant details
INSERT INTO public.tenant (id, user_id, landlord_id, date_of_birth, gender, nationality, marital_status, id_document_type, id_number, employment_status, employer_company, job_title, monthly_income, income_verified, emergency_name, emergency_relationship, emergency_phone, number_of_occupants, has_pets, vehicle_count, reliability_score, reliability_score_value, tenant_since, special_note, profile_completed, standing, standing_updated_at, total_fines, total_warnings, active_complaints_count, created_by, created_at, updated_at) VALUES
('aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-1000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001','1985-06-18','male','South African','married','sa_id','8506185009093','employed','Moyo Logistics','Operations Manager',28000.00,true,'Lindiwe Moyo','Spouse','0761234569',2,false,1,'moderate_risk',65.00, CURRENT_DATE - INTERVAL '1 year','Score driver: 7 of 11 rent payments on time (64%), 4 late payments with fees, 1-year tenure.',true,'good_standing', now(),0.00,0,0,'c1a2b3c4-1000-4000-a000-000000000001', CURRENT_DATE - INTERVAL '1 year', now());

-- Insert payment history (11 total payments: 7 on-time, 4 late)
INSERT INTO public.tenant_payment_history (id, tenant_id, on_time_payments, late_payments, missed_payments, partial_payments, average_days_late, longest_streak_ontime, current_streak_ontime, last_calculated) VALUES
('aaaaaaaa-4000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000',7,4,0,0,6.50,4,0, now());

-- Insert lease (12-month lease, started 1 year ago)
INSERT INTO public.lease (id, tenant_id, unit_id, landlord_id, lease_start_date, lease_end_date, rent_amount, deposit_amount, deposit_paid, deposit_paid_date, payment_frequency, payment_due_day, late_fee_amount, late_fee_after_days, grace_period_days, auto_renew, status, water_included, created_by, created_at, updated_at) VALUES
('aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001', CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE, 15000.00,15000.00,true, CURRENT_DATE - INTERVAL '1 year', 'monthly',1,500.00,3,5,false,'active',true,'c1a2b3c4-1000-4000-a000-000000000001', CURRENT_DATE - INTERVAL '1 year', now());

-- Update unit to have this tenant
UPDATE public.unit SET current_tenant_id = 'aaaaaaaa-2000-4000-a010-000000000000' WHERE id = 'c1a2b3c4-6000-4000-a000-000000000011';

-- =============================================
-- Insert 11 invoices (one per month for the 12-month lease)
-- Month 0: current month - sent (not yet paid)
-- Months 1-10: paid (with 4 late payments)
-- =============================================

-- Month 0 (current month) - sent (on time, not yet paid)
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15000.00,15000.00,0, date_trunc('month', CURRENT_DATE), date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE),'sent',0, date_trunc('month', CURRENT_DATE));

-- Month 1 (1 month ago) - on time
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000001','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15000.00,15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '1 month'), date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '1 month'),'paid',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '1 month'));

-- Month 2 - on time
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000002','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15000.00,15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '2 months'), date_trunc('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '2 months'),'paid',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '2 months'));

-- Month 3 - LATE (paid 5 days late) - Late payment #1
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000003','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15500.00,15000.00,500.00, date_trunc('month', CURRENT_DATE - INTERVAL '3 months'), date_trunc('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '3 months'),'paid',15500.00, date_trunc('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '5 days', date_trunc('month', CURRENT_DATE - INTERVAL '3 months'));

-- Month 4 - on time
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000004','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15000.00,15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '4 months'), date_trunc('month', CURRENT_DATE - INTERVAL '4 months') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '4 months'),'paid',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '4 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '4 months'));

-- Month 5 - LATE (paid 8 days late) - Late payment #2
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000005','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15500.00,15000.00,500.00, date_trunc('month', CURRENT_DATE - INTERVAL '5 months'), date_trunc('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),'paid',15500.00, date_trunc('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '8 days', date_trunc('month', CURRENT_DATE - INTERVAL '5 months'));

-- Month 6 - on time
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000006','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15000.00,15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '6 months'), date_trunc('month', CURRENT_DATE - INTERVAL '6 months') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '6 months'),'paid',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '6 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '6 months'));

-- Month 7 - LATE (paid 12 days late) - Late payment #3
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000007','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15500.00,15000.00,500.00, date_trunc('month', CURRENT_DATE - INTERVAL '7 months'), date_trunc('month', CURRENT_DATE - INTERVAL '7 months') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '7 months'),'paid',15500.00, date_trunc('month', CURRENT_DATE - INTERVAL '7 months') + INTERVAL '12 days', date_trunc('month', CURRENT_DATE - INTERVAL '7 months'));

-- Month 8 - on time
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000008','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15000.00,15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '8 months'), date_trunc('month', CURRENT_DATE - INTERVAL '8 months') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '8 months'),'paid',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '8 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '8 months'));

-- Month 9 - on time
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000009','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15000.00,15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '9 months'), date_trunc('month', CURRENT_DATE - INTERVAL '9 months') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '9 months'),'paid',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '9 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '9 months'));

-- Month 10 - LATE (paid 10 days late) - Late payment #4
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000010','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15500.00,15000.00,500.00, date_trunc('month', CURRENT_DATE - INTERVAL '10 months'), date_trunc('month', CURRENT_DATE - INTERVAL '10 months') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '10 months'),'paid',15500.00, date_trunc('month', CURRENT_DATE - INTERVAL '10 months') + INTERVAL '10 days', date_trunc('month', CURRENT_DATE - INTERVAL '10 months'));

-- Month 11 - on time (1 year ago, first month of lease)
INSERT INTO public.invoice (id, lease_id, tenant_id, unit_id, landlord_id, amount_due, rent_amount, late_fees, billing_period_start, billing_period_end, due_date, status, paid_amount, paid_date, created_at) VALUES
('aaaaaaaa-5000-4000-a010-000000000011','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-6000-4000-a000-000000000011','c1a2b3c4-2000-4000-a000-000000000001',15000.00,15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '11 months'), date_trunc('month', CURRENT_DATE - INTERVAL '11 months') + INTERVAL '1 month' - INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),'paid',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '11 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '11 months'));

-- =============================================
-- Insert payments for all paid invoices
-- =============================================

-- Month 1 (on time)
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000001','aaaaaaaa-5000-4000-a010-000000000001','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15000.00,'eft', date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 day','EFT-AM-01','paid','c1a2b3c4-1000-4000-a000-000000000001', date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 day','https://docs.example.com/pop/EFT-AM-01.pdf', date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 day',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 day');

-- Month 2 (on time)
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000002','aaaaaaaa-5000-4000-a010-000000000002','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15000.00,'bank_transfer', date_trunc('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 day','BT-AM-02','paid','c1a2b3c4-1000-4000-a000-000000000001', date_trunc('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 day','https://docs.example.com/pop/BT-AM-02.pdf', date_trunc('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 day',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 day');

-- Month 3 (LATE - 5 days)
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, notes, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000003','aaaaaaaa-5000-4000-a010-000000000003','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15500.00,'eft', date_trunc('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '5 days','EFT-AM-03-LATE','late','c1a2b3c4-1000-4000-a000-000000000001', date_trunc('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '5 days','https://docs.example.com/pop/EFT-AM-03-LATE.pdf', date_trunc('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '5 days',15000.00,500.00,'Paid 5 days late - late fee applied', date_trunc('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '5 days', date_trunc('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '5 days');

-- Month 4 (on time)
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000004','aaaaaaaa-5000-4000-a010-000000000004','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15000.00,'card', date_trunc('month', CURRENT_DATE - INTERVAL '4 months') + INTERVAL '1 day','CARD-AM-04','paid',NULL, date_trunc('month', CURRENT_DATE - INTERVAL '4 months') + INTERVAL '1 day',NULL,NULL,15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '4 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '4 months') + INTERVAL '1 day');

-- Month 5 (LATE - 8 days)
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, notes, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000005','aaaaaaaa-5000-4000-a010-000000000005','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15500.00,'eft', date_trunc('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '8 days','EFT-AM-05-LATE','late','c1a2b3c4-1000-4000-a000-000000000001', date_trunc('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '8 days','https://docs.example.com/pop/EFT-AM-05-LATE.pdf', date_trunc('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '8 days',15000.00,500.00,'Paid 8 days late - late fee applied', date_trunc('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '8 days', date_trunc('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '8 days');

-- Month 6 (on time)
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000006','aaaaaaaa-5000-4000-a010-000000000006','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15000.00,'bank_transfer', date_trunc('month', CURRENT_DATE - INTERVAL '6 months') + INTERVAL '1 day','BT-AM-06','paid','c1a2b3c4-1000-4000-a000-000000000001', date_trunc('month', CURRENT_DATE - INTERVAL '6 months') + INTERVAL '1 day','https://docs.example.com/pop/BT-AM-06.pdf', date_trunc('month', CURRENT_DATE - INTERVAL '6 months') + INTERVAL '1 day',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '6 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '6 months') + INTERVAL '1 day');

-- Month 7 (LATE - 12 days)
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, notes, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000007','aaaaaaaa-5000-4000-a010-000000000007','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15500.00,'eft', date_trunc('month', CURRENT_DATE - INTERVAL '7 months') + INTERVAL '12 days','EFT-AM-07-LATE','late','c1a2b3c4-1000-4000-a000-000000000001', date_trunc('month', CURRENT_DATE - INTERVAL '7 months') + INTERVAL '12 days','https://docs.example.com/pop/EFT-AM-07-LATE.pdf', date_trunc('month', CURRENT_DATE - INTERVAL '7 months') + INTERVAL '12 days',15000.00,500.00,'Paid 12 days late - late fee applied', date_trunc('month', CURRENT_DATE - INTERVAL '7 months') + INTERVAL '12 days', date_trunc('month', CURRENT_DATE - INTERVAL '7 months') + INTERVAL '12 days');

-- Month 8 (on time)
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000008','aaaaaaaa-5000-4000-a010-000000000008','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15000.00,'card', date_trunc('month', CURRENT_DATE - INTERVAL '8 months') + INTERVAL '1 day','CARD-AM-08','paid',NULL, date_trunc('month', CURRENT_DATE - INTERVAL '8 months') + INTERVAL '1 day',NULL,NULL,15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '8 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '8 months') + INTERVAL '1 day');

-- Month 9 (on time)
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000009','aaaaaaaa-5000-4000-a010-000000000009','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15000.00,'eft', date_trunc('month', CURRENT_DATE - INTERVAL '9 months') + INTERVAL '1 day','EFT-AM-09','paid','c1a2b3c4-1000-4000-a000-000000000001', date_trunc('month', CURRENT_DATE - INTERVAL '9 months') + INTERVAL '1 day','https://docs.example.com/pop/EFT-AM-09.pdf', date_trunc('month', CURRENT_DATE - INTERVAL '9 months') + INTERVAL '1 day',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '9 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '9 months') + INTERVAL '1 day');

-- Month 10 (LATE - 10 days) - 4th late payment
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, notes, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000010','aaaaaaaa-5000-4000-a010-000000000010','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15500.00,'bank_transfer', date_trunc('month', CURRENT_DATE - INTERVAL '10 months') + INTERVAL '10 days','BT-AM-10-LATE','late','c1a2b3c4-1000-4000-a000-000000000001', date_trunc('month', CURRENT_DATE - INTERVAL '10 months') + INTERVAL '10 days','https://docs.example.com/pop/BT-AM-10-LATE.pdf', date_trunc('month', CURRENT_DATE - INTERVAL '10 months') + INTERVAL '10 days',15000.00,500.00,'Paid 10 days late - late fee applied', date_trunc('month', CURRENT_DATE - INTERVAL '10 months') + INTERVAL '10 days', date_trunc('month', CURRENT_DATE - INTERVAL '10 months') + INTERVAL '10 days');

-- Month 11 (on time - first month)
INSERT INTO public.payment (id, invoice_id, tenant_id, lease_id, landlord_id, amount_paid, payment_method, payment_date, bank_reference, status, approved_by, approved_at, proof_of_payment_url, proof_uploaded_at, allocated_rent, allocated_late_fees, created_at, updated_at) VALUES
('aaaaaaaa-6000-4000-a010-000000000011','aaaaaaaa-5000-4000-a010-000000000011','aaaaaaaa-2000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001',15000.00,'eft', date_trunc('month', CURRENT_DATE - INTERVAL '11 months') + INTERVAL '1 day','EFT-AM-11','paid','c1a2b3c4-1000-4000-a000-000000000001', date_trunc('month', CURRENT_DATE - INTERVAL '11 months') + INTERVAL '1 day','https://docs.example.com/pop/EFT-AM-11.pdf', date_trunc('month', CURRENT_DATE - INTERVAL '11 months') + INTERVAL '1 day',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '11 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '11 months') + INTERVAL '1 day');

-- =============================================
-- Insert invoice_payments records (linking payments to invoices)
-- =============================================

INSERT INTO public.invoice_payments (id, invoice_id, payment_id, amount, payment_date, method, reference, status, allocated_rent, allocated_late_fees, created_at, updated_at) VALUES
-- Month 1
('aaaaaaaa-7000-4000-a010-000000000001','aaaaaaaa-5000-4000-a010-000000000001','aaaaaaaa-6000-4000-a010-000000000001',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 day','eft','EFT-AM-01','approved',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 day'),
-- Month 2
('aaaaaaaa-7000-4000-a010-000000000002','aaaaaaaa-5000-4000-a010-000000000002','aaaaaaaa-6000-4000-a010-000000000002',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 day','bank_transfer','BT-AM-02','approved',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 day'),
-- Month 3 (LATE)
('aaaaaaaa-7000-4000-a010-000000000003','aaaaaaaa-5000-4000-a010-000000000003','aaaaaaaa-6000-4000-a010-000000000003',15500.00, date_trunc('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '5 days','eft','EFT-AM-03-LATE','approved',15000.00,500.00, date_trunc('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '5 days', date_trunc('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '5 days'),
-- Month 4
('aaaaaaaa-7000-4000-a010-000000000004','aaaaaaaa-5000-4000-a010-000000000004','aaaaaaaa-6000-4000-a010-000000000004',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '4 months') + INTERVAL '1 day','card','CARD-AM-04','approved',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '4 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '4 months') + INTERVAL '1 day'),
-- Month 5 (LATE)
('aaaaaaaa-7000-4000-a010-000000000005','aaaaaaaa-5000-4000-a010-000000000005','aaaaaaaa-6000-4000-a010-000000000005',15500.00, date_trunc('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '8 days','eft','EFT-AM-05-LATE','approved',15000.00,500.00, date_trunc('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '8 days', date_trunc('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '8 days'),
-- Month 6
('aaaaaaaa-7000-4000-a010-000000000006','aaaaaaaa-5000-4000-a010-000000000006','aaaaaaaa-6000-4000-a010-000000000006',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '6 months') + INTERVAL '1 day','bank_transfer','BT-AM-06','approved',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '6 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '6 months') + INTERVAL '1 day'),
-- Month 7 (LATE)
('aaaaaaaa-7000-4000-a010-000000000007','aaaaaaaa-5000-4000-a010-000000000007','aaaaaaaa-6000-4000-a010-000000000007',15500.00, date_trunc('month', CURRENT_DATE - INTERVAL '7 months') + INTERVAL '12 days','eft','EFT-AM-07-LATE','approved',15000.00,500.00, date_trunc('month', CURRENT_DATE - INTERVAL '7 months') + INTERVAL '12 days', date_trunc('month', CURRENT_DATE - INTERVAL '7 months') + INTERVAL '12 days'),
-- Month 8
('aaaaaaaa-7000-4000-a010-000000000008','aaaaaaaa-5000-4000-a010-000000000008','aaaaaaaa-6000-4000-a010-000000000008',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '8 months') + INTERVAL '1 day','card','CARD-AM-08','approved',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '8 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '8 months') + INTERVAL '1 day'),
-- Month 9
('aaaaaaaa-7000-4000-a010-000000000009','aaaaaaaa-5000-4000-a010-000000000009','aaaaaaaa-6000-4000-a010-000000000009',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '9 months') + INTERVAL '1 day','eft','EFT-AM-09','approved',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '9 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '9 months') + INTERVAL '1 day'),
-- Month 10 (LATE - 4th late payment)
('aaaaaaaa-7000-4000-a010-000000000010','aaaaaaaa-5000-4000-a010-000000000010','aaaaaaaa-6000-4000-a010-000000000010',15500.00, date_trunc('month', CURRENT_DATE - INTERVAL '10 months') + INTERVAL '10 days','bank_transfer','BT-AM-10-LATE','approved',15000.00,500.00, date_trunc('month', CURRENT_DATE - INTERVAL '10 months') + INTERVAL '10 days', date_trunc('month', CURRENT_DATE - INTERVAL '10 months') + INTERVAL '10 days'),
-- Month 11 (first month)
('aaaaaaaa-7000-4000-a010-000000000011','aaaaaaaa-5000-4000-a010-000000000011','aaaaaaaa-6000-4000-a010-000000000011',15000.00, date_trunc('month', CURRENT_DATE - INTERVAL '11 months') + INTERVAL '1 day','eft','EFT-AM-11','approved',15000.00,0, date_trunc('month', CURRENT_DATE - INTERVAL '11 months') + INTERVAL '1 day', date_trunc('month', CURRENT_DATE - INTERVAL '11 months') + INTERVAL '1 day');

-- =============================================
-- Insert deposit
-- =============================================

INSERT INTO public.deposit (id, lease_id, tenant_id, deposit_amount, amount_paid, payment_date, payment_reference, status, held_until, created_at, updated_at) VALUES
('aaaaaaaa-e000-4000-a010-000000000000','aaaaaaaa-3000-4000-a010-000000000000','aaaaaaaa-2000-4000-a010-000000000000',15000.00,15000.00, CURRENT_DATE - INTERVAL '1 year','DEP-AM-010','paid', CURRENT_DATE, CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE - INTERVAL '1 year');

-- =============================================
-- Recalculate tenant score to reflect payment history
-- =============================================

SELECT public.recalculate_tenant_score('aaaaaaaa-2000-4000-a010-000000000000', NULL);

-- =============================================
-- Add notifications for the tenant (using unique IDs)
-- =============================================

INSERT INTO public.notification (id, user_id, type, title, body, related_entity_id, related_entity_type, is_read, created_at) VALUES
('aaaaaaaa-1100-4000-a010-000000000010','aaaaaaaa-1000-4000-a010-000000000000','account_created','Welcome to Chihwa Rentals','Your tenant account has been created — welcome aboard!','aaaaaaaa-2000-4000-a010-000000000000','tenant',false, CURRENT_DATE - INTERVAL '1 year'),
('aaaaaaaa-1100-4000-a010-000000000011','aaaaaaaa-1000-4000-a010-000000000000','lease_expiring','Lease expiring soon','Your 12-month lease is coming to an end. Please contact us about renewal options.','aaaaaaaa-3000-4000-a010-000000000000','lease',false, CURRENT_DATE - INTERVAL '1 week');

-- =============================================
-- Add an audit log entry for creating this tenant
-- =============================================

INSERT INTO public.audit_log (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) VALUES
('c1a2b3c4-8000-4000-a000-000000000007','c1a2b3c4-1000-4000-a000-000000000001','CREATE','tenant','aaaaaaaa-2000-4000-a010-000000000000',NULL,'{"email":"abraham.moyo2@email.com","unit_id":"c1a2b3c4-6000-4000-a000-000000000011"}','172.16.4.139','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36', CURRENT_DATE - INTERVAL '1 year');