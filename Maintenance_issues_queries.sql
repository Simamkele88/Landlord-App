-- =============================================
-- Maintenance Issues for Tenants at Hillbrow Heights (Property: c1a2b3c4-5000-4000-a000-000000000001)
-- All issues related to water, leaks, and mould
-- =============================================

-- Maintenance Issue 1: Sipho Dlamini (Unit 1) - Leaking kitchen tap (completed)
INSERT INTO public.maintenance_request (id, tenant_id, landlord_id, unit_id, reported_by, title, description, category, priority, status, assigned_to, scheduled_date, completed_at, completion_notes, tenant_confirmed, tenant_confirmed_at, escalated, actual_cost, estimated_cost, created_at, updated_at) VALUES
('aaaaaaaa-9000-4000-a101-000000000001','aaaaaaaa-2000-4000-a001-000000000000','c1a2b3c4-2000-4000-a000-000000000001','c1a2b3c4-6000-4000-a000-000000000001','aaaaaaaa-1000-4000-a001-000000000000','Kitchen tap leaking continuously - Unit 1','The kitchen tap in Unit 1 has been leaking steadily for over a week. Water is pooling on the counter and causing damage to the cabinet below. Dripping is audible throughout the night.','plumbing','medium','completed','c1a2b3c4-1000-4000-a000-000000000002', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '23 days','Replaced ceramic cartridge and O-rings. Tap no longer leaks. Water pressure restored. Cabinet dried and inspected for damage.',true, CURRENT_DATE - INTERVAL '22 days',false,650.00,650.00, CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '23 days');

INSERT INTO public.maintenance_update (id, request_id, updated_by, status_from, status_to, notes, created_at) VALUES
('aaaaaaaa-9100-4000-a101-000000000001','aaaaaaaa-9000-4000-a101-000000000001','c1a2b3c4-1000-4000-a000-000000000002','needs_repair','assigned','Assigned to caretaker for assessment of kitchen tap leak in Unit 1.', CURRENT_DATE - INTERVAL '27 days'),
('aaaaaaaa-9100-4000-a101-000000000002','aaaaaaaa-9000-4000-a101-000000000001','c1a2b3c4-1000-4000-a000-000000000002','assigned','in_progress','Ordered replacement cartridge. Unit 1 tenant requested urgent resolution.', CURRENT_DATE - INTERVAL '25 days'),
('aaaaaaaa-9100-4000-a101-000000000003','aaaaaaaa-9000-4000-a101-000000000001','c1a2b3c4-1000-4000-a000-000000000002','in_progress','completed','Tap repaired and tested. No leaks. Unit 1 tenant confirmed resolution.', CURRENT_DATE - INTERVAL '23 days');

-- Document for kitchen tap leak
INSERT INTO public.document (id, tenant_id, unit_id, uploaded_by, document_type, document_name, document_url, file_size, mime_type, description, verification_status, created_at, updated_at) VALUES
('aaaaaaaa-d000-4000-a101-000000000001',NULL,'c1a2b3c4-6000-4000-a000-000000000001','aaaaaaaa-1000-4000-a001-000000000000','maintenance_photo','Unit1_Kitchen_Tap_Leak.jpg','https://docs.example.com/maintenance/unit1_kitchen_tap.jpg',1500000,'image/jpeg','Photo of water pooling under kitchen tap in Unit 1. Damage to cabinet visible.','pending', CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '28 days');

INSERT INTO public.maintenance_photo (id, request_id, document_id, photo_type, uploaded_by, uploaded_at) VALUES
('aaaaaaaa-1400-4000-a101-000000000001','aaaaaaaa-9000-4000-a101-000000000001','aaaaaaaa-d000-4000-a101-000000000001','before','aaaaaaaa-1000-4000-a001-000000000000', CURRENT_DATE - INTERVAL '28 days');

-- =============================================

-- Maintenance Issue 2: Nomsa Khumalo (Unit 2) - Water stain on bathroom ceiling from upstairs leak (urgent, in progress)
INSERT INTO public.maintenance_request (id, tenant_id, landlord_id, unit_id, reported_by, title, description, category, priority, status, assigned_to, scheduled_date, tenant_confirmed, escalated, escalated_at, escalation_reason, actual_cost, estimated_cost, created_at, updated_at) VALUES
('aaaaaaaa-9000-4000-a102-000000000001','aaaaaaaa-2000-4000-a002-000000000000','c1a2b3c4-2000-4000-a000-000000000001','c1a2b3c4-6000-4000-a000-000000000002','aaaaaaaa-1000-4000-a002-000000000000','Water stain spreading on bathroom ceiling - Unit 2','Large water stain has appeared on the bathroom ceiling in Unit 2. It is growing daily and there is a persistent musty smell. Likely a leak from the unit above (Unit 3).','plumbing','urgent','in_progress','c1a2b3c4-1000-4000-a000-000000000003', CURRENT_DATE + INTERVAL '2 days',false,true, CURRENT_DATE - INTERVAL '4 days','Unit 3 tenant unresponsive - escalating to landlord for emergency access.',NULL,3800.00, CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE - INTERVAL '4 days');

INSERT INTO public.maintenance_update (id, request_id, updated_by, status_from, status_to, notes, created_at) VALUES
('aaaaaaaa-9100-4000-a102-000000000001','aaaaaaaa-9000-4000-a102-000000000001','c1a2b3c4-1000-4000-a000-000000000003','needs_repair','assigned','Assigned to caretaker for inspection of bathroom ceiling water stain in Unit 2.', CURRENT_DATE - INTERVAL '10 days'),
('aaaaaaaa-9100-4000-a102-000000000002','aaaaaaaa-9000-4000-a102-000000000001','c1a2b3c4-1000-4000-a000-000000000003','assigned','in_progress','Confirmed active leak from Unit 3 above. Attempted to contact Unit 3 tenant - no response. Escalating for emergency access.', CURRENT_DATE - INTERVAL '6 days'),
('aaaaaaaa-9100-4000-a102-000000000003','aaaaaaaa-9000-4000-a102-000000000001','c1a2b3c4-1000-4000-a000-000000000003','in_progress','pending_approval','Escalated to landlord. Unit 3 tenant unreachable for 4 days. Need to arrange emergency plumber access to Unit 3.', CURRENT_DATE - INTERVAL '4 days');

-- Document for bathroom ceiling stain
INSERT INTO public.document (id, tenant_id, unit_id, uploaded_by, document_type, document_name, document_url, file_size, mime_type, description, verification_status, created_at, updated_at) VALUES
('aaaaaaaa-d000-4000-a102-000000000001',NULL,'c1a2b3c4-6000-4000-a000-000000000002','aaaaaaaa-1000-4000-a002-000000000000','maintenance_photo','Unit2_Bathroom_Ceiling_Stain.jpg','https://docs.example.com/maintenance/unit2_bathroom_ceiling.jpg',2100000,'image/jpeg','Photo of water stain on Unit 2 bathroom ceiling. Growing daily with musty smell.','pending', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE - INTERVAL '12 days');

INSERT INTO public.maintenance_photo (id, request_id, document_id, photo_type, uploaded_by, uploaded_at) VALUES
('aaaaaaaa-1400-4000-a102-000000000001','aaaaaaaa-9000-4000-a102-000000000001','aaaaaaaa-d000-4000-a102-000000000001','before','aaaaaaaa-1000-4000-a002-000000000000', CURRENT_DATE - INTERVAL '12 days');

-- =============================================

-- Maintenance Issue 3: Abraham Moyo (Unit 4) - Mould in bedroom from damp wall (high priority, assigned)
INSERT INTO public.maintenance_request (id, tenant_id, landlord_id, unit_id, reported_by, title, description, category, priority, status, assigned_to, scheduled_date, tenant_confirmed, escalated, actual_cost, estimated_cost, created_at, updated_at) VALUES
('aaaaaaaa-9000-4000-a103-000000000001','aaaaaaaa-2000-4000-a010-000000000000','c1a2b3c4-2000-4000-a000-000000000001','c1a2b3c4-6000-4000-a000-000000000004','aaaaaaaa-1000-4000-a010-000000000000','Black mould spreading on bedroom wall - Unit 4','Significant black mould growth has appeared on the wall behind the wardrobe in Unit 4. The wall feels damp and there is a persistent musty smell. Mould has spread approximately 1 square metre.','structural','high','assigned','c1a2b3c4-1000-4000-a000-000000000002', CURRENT_DATE + INTERVAL '4 days',false,false,NULL,3200.00, CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE - INTERVAL '18 days');

INSERT INTO public.maintenance_update (id, request_id, updated_by, status_from, status_to, notes, created_at) VALUES
('aaaaaaaa-9100-4000-a103-000000000001','aaaaaaaa-9000-4000-a103-000000000001','c1a2b3c4-1000-4000-a000-000000000002','needs_repair','assigned','Assigned to caretaker for mould inspection in Unit 4 bedroom wardrobe.', CURRENT_DATE - INTERVAL '16 days'),
('aaaaaaaa-9100-4000-a103-000000000002','aaaaaaaa-9000-4000-a103-000000000001','c1a2b3c4-1000-4000-a000-000000000002','assigned','assigned','Confirmed mould growth from damp wall in Unit 4. Mould specialist scheduled. Tenant advised to remove clothing and keep area ventilated.', CURRENT_DATE - INTERVAL '12 days');

-- Document for bedroom mould
INSERT INTO public.document (id, tenant_id, unit_id, uploaded_by, document_type, document_name, document_url, file_size, mime_type, description, verification_status, created_at, updated_at) VALUES
('aaaaaaaa-d000-4000-a103-000000000001',NULL,'c1a2b3c4-6000-4000-a000-000000000004','aaaaaaaa-1000-4000-a010-000000000000','maintenance_photo','Unit4_Bedroom_Mould.jpg','https://docs.example.com/maintenance/unit4_bedroom_mould.jpg',3500000,'image/jpeg','Photo of black mould growth on Unit 4 bedroom wall behind wardrobe. Approximately 1 square metre affected.','pending', CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE - INTERVAL '18 days');

INSERT INTO public.maintenance_photo (id, request_id, document_id, photo_type, uploaded_by, uploaded_at) VALUES
('aaaaaaaa-1400-4000-a103-000000000001','aaaaaaaa-9000-4000-a103-000000000001','aaaaaaaa-d000-4000-a103-000000000001','before','aaaaaaaa-1000-4000-a010-000000000000', CURRENT_DATE - INTERVAL '18 days');

-- =============================================

-- Maintenance Issue 4: Realeboga Letsulo (Unit 3) - Leaking geyser causing water damage (emergency, needs repair)
INSERT INTO public.maintenance_request (id, tenant_id, landlord_id, unit_id, reported_by, title, description, category, priority, status, assigned_to, tenant_confirmed, escalated, actual_cost, estimated_cost, created_at, updated_at) VALUES
('aaaaaaaa-9000-4000-a104-000000000001','aaaaaaaa-2000-4000-a008-000000000000','c1a2b3c4-2000-4000-a000-000000000001','c1a2b3c4-6000-4000-a000-000000000007','aaaaaaaa-1000-4000-a008-000000000000','Geyser leaking - water damage to Unit 3 ceiling and floor','The geyser in Unit 3 bathroom is leaking significantly. Water has damaged the ceiling below (Unit 2) and is pooling on the bathroom floor. Electrical safety concern as water is near power outlets.','plumbing','emergency','needs_repair',NULL,false,true,NULL,2800.00, CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '6 days');

INSERT INTO public.maintenance_update (id, request_id, updated_by, status_from, status_to, notes, created_at) VALUES
('aaaaaaaa-9100-4000-a104-000000000001','aaaaaaaa-9000-4000-a104-000000000001','c1a2b3c4-1000-4000-a000-000000000001','needs_repair','pending_approval','Emergency geyser leak reported in Unit 3. Water turned off at mains. Electrician and plumber called immediately. Awaiting approval for geyser replacement.', CURRENT_DATE - INTERVAL '6 days'),
('aaaaaaaa-9100-4000-a104-000000000002','aaaaaaaa-9000-4000-a104-000000000001','c1a2b3c4-1000-4000-a000-000000000001','pending_approval','needs_repair','Unit 3 geyser requires full replacement. Parts ordered. Emergency temporary fix applied to stop active leak. Unit 3 tenant advised not to use bathroom until repairs complete. Unit 2 tenant notified of leak source.', CURRENT_DATE - INTERVAL '4 days');

-- Document for geyser leak
INSERT INTO public.document (id, tenant_id, unit_id, uploaded_by, document_type, document_name, document_url, file_size, mime_type, description, verification_status, created_at, updated_at) VALUES
('aaaaaaaa-d000-4000-a104-000000000001',NULL,'c1a2b3c4-6000-4000-a000-000000000007','aaaaaaaa-1000-4000-a008-000000000000','maintenance_photo','Unit3_Geyser_Leak.jpg','https://docs.example.com/maintenance/unit3_geyser_leak.jpg',2800000,'image/jpeg','Photo of leaking geyser in Unit 3 with water damage to ceiling and floor. Water pooling near electrical outlets.','pending', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '6 days');

INSERT INTO public.maintenance_photo (id, request_id, document_id, photo_type, uploaded_by, uploaded_at) VALUES
('aaaaaaaa-1400-4000-a104-000000000001','aaaaaaaa-9000-4000-a104-000000000001','aaaaaaaa-d000-4000-a104-000000000001','before','aaaaaaaa-1000-4000-a008-000000000000', CURRENT_DATE - INTERVAL '6 days');

-- =============================================
-- Add notifications for maintenance updates
-- =============================================

-- Notification for Sipho Dlamini (Unit 1 - tap repair completed)
INSERT INTO public.notification (id, user_id, type, title, body, related_entity_id, related_entity_type, is_read, created_at) VALUES
('aaaaaaaa-1100-4000-a101-000000000001','aaaaaaaa-1000-4000-a001-000000000000','maintenance_update','Unit 1 kitchen tap repair completed','Your kitchen tap has been repaired. The cartridge and O-rings were replaced. Please let us know if you experience any further issues.','aaaaaaaa-9000-4000-a101-000000000001','maintenance_request',false, CURRENT_DATE - INTERVAL '23 days');

-- Notification for Nomsa Khumalo (Unit 2 - ceiling stain escalated)
INSERT INTO public.notification (id, user_id, type, title, body, related_entity_id, related_entity_type, is_read, created_at) VALUES
('aaaaaaaa-1100-4000-a102-000000000001','aaaaaaaa-1000-4000-a002-000000000000','maintenance_update','Unit 2 ceiling leak awaiting landlord approval','Your bathroom ceiling leak has been traced to Unit 3 above. It is now awaiting landlord approval for emergency access to Unit 3.','aaaaaaaa-9000-4000-a102-000000000001','maintenance_request',false, CURRENT_DATE - INTERVAL '4 days');

-- Notification for Abraham Moyo (Unit 4 - mould inspection scheduled)
INSERT INTO public.notification (id, user_id, type, title, body, related_entity_id, related_entity_type, is_read, created_at) VALUES
('aaaaaaaa-1100-4000-a103-000000000001','aaaaaaaa-1000-4000-a010-000000000000','maintenance_update','Unit 4 mould inspection scheduled','A mould specialist has been scheduled to inspect the wardrobe mould in Unit 4. Please ensure the wardrobe is empty and ventilated.','aaaaaaaa-9000-4000-a103-000000000001','maintenance_request',false, CURRENT_DATE - INTERVAL '12 days');

-- Notification for Realeboga Letsulo (Unit 3 - geyser emergency)
INSERT INTO public.notification (id, user_id, type, title, body, related_entity_id, related_entity_type, is_read, created_at) VALUES
('aaaaaaaa-1100-4000-a104-000000000001','aaaaaaaa-1000-4000-a008-000000000000','maintenance_update','Unit 3 emergency geyser repair underway','Your geyser has been turned off due to a significant leak affecting both your unit and Unit 2 below. Water supply to your unit has been temporarily shut off. Parts have been ordered for replacement.','aaaaaaaa-9000-4000-a104-000000000001','maintenance_request',false, CURRENT_DATE - INTERVAL '4 days');