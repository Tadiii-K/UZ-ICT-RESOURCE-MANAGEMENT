-- =====================================================
-- UZ ICT Resource Management System — Mock Data
-- Run this in Supabase SQL Editor AFTER schema.sql and updates.sql
-- =====================================================
-- Default password for all demo accounts: Password123!
-- Demo accounts:
--   admin@uz.ac.zw        (Admin)
--   tech@uz.ac.zw         (Technician)
--   cs.rep@uz.ac.zw       (CS Dept Rep)
--   is.rep@uz.ac.zw       (IS Dept Rep)
--   lib.rep@uz.ac.zw      (Library Rep)
--   eng.rep@uz.ac.zw      (Engineering Rep)
-- =====================================================

DO $$
DECLARE
    -- Fixed user IDs
    v_admin_id  UUID := '11111111-1111-1111-1111-111111111101';
    v_tech_id   UUID := '11111111-1111-1111-1111-111111111102';
    v_cs_rep    UUID := '11111111-1111-1111-1111-111111111103';
    v_is_rep    UUID := '11111111-1111-1111-1111-111111111104';
    v_lib_rep   UUID := '11111111-1111-1111-1111-111111111105';
    v_eng_rep   UUID := '11111111-1111-1111-1111-111111111106';

    -- Department IDs (looked up from existing data)
    v_cs_dept   UUID;
    v_is_dept   UUID;
    v_lib_dept  UUID;
    v_adm_dept  UUID;
    v_eng_dept  UUID;
    v_ict_dept  UUID;

    -- Category IDs
    v_desktop   UUID;
    v_laptop    UUID;
    v_printer   UUID;
    v_network   UUID;
    v_server    UUID;
    v_projector UUID;
    v_ups       UUID;
    v_scanner   UUID;

    -- Asset IDs (pre-generated for cross-referencing in faults/maintenance/allocations)
    v_a_cs001   UUID := '22222222-0000-0000-0000-000000000001';
    v_a_cs002   UUID := '22222222-0000-0000-0000-000000000002';
    v_a_cs003   UUID := '22222222-0000-0000-0000-000000000003';
    v_a_cs004   UUID := '22222222-0000-0000-0000-000000000004';
    v_a_cs005   UUID := '22222222-0000-0000-0000-000000000005';
    v_a_cs006   UUID := '22222222-0000-0000-0000-000000000006';
    v_a_cs007   UUID := '22222222-0000-0000-0000-000000000007';
    v_a_cs008   UUID := '22222222-0000-0000-0000-000000000008';
    v_a_is001   UUID := '22222222-0000-0000-0000-000000000009';
    v_a_is002   UUID := '22222222-0000-0000-0000-000000000010';
    v_a_is003   UUID := '22222222-0000-0000-0000-000000000011';
    v_a_is004   UUID := '22222222-0000-0000-0000-000000000012';
    v_a_is005   UUID := '22222222-0000-0000-0000-000000000013';
    v_a_is006   UUID := '22222222-0000-0000-0000-000000000014';
    v_a_lib001  UUID := '22222222-0000-0000-0000-000000000015';
    v_a_lib002  UUID := '22222222-0000-0000-0000-000000000016';
    v_a_lib003  UUID := '22222222-0000-0000-0000-000000000017';
    v_a_lib004  UUID := '22222222-0000-0000-0000-000000000018';
    v_a_lib005  UUID := '22222222-0000-0000-0000-000000000019';
    v_a_adm001  UUID := '22222222-0000-0000-0000-000000000020';
    v_a_adm002  UUID := '22222222-0000-0000-0000-000000000021';
    v_a_adm003  UUID := '22222222-0000-0000-0000-000000000022';
    v_a_adm004  UUID := '22222222-0000-0000-0000-000000000023';
    v_a_eng001  UUID := '22222222-0000-0000-0000-000000000024';
    v_a_eng002  UUID := '22222222-0000-0000-0000-000000000025';
    v_a_eng003  UUID := '22222222-0000-0000-0000-000000000026';
    v_a_eng004  UUID := '22222222-0000-0000-0000-000000000027';
    v_a_ict001  UUID := '22222222-0000-0000-0000-000000000028';
    v_a_ict002  UUID := '22222222-0000-0000-0000-000000000029';
    v_a_ict003  UUID := '22222222-0000-0000-0000-000000000030';

BEGIN

    -- =========================================================
    -- RESOLVE DEPARTMENT & CATEGORY IDS
    -- =========================================================
    SELECT id INTO v_cs_dept   FROM departments WHERE name = 'Computer Science';
    SELECT id INTO v_is_dept   FROM departments WHERE name = 'Information Systems';
    SELECT id INTO v_lib_dept  FROM departments WHERE name = 'Library';
    SELECT id INTO v_adm_dept  FROM departments WHERE name = 'Administration';
    SELECT id INTO v_eng_dept  FROM departments WHERE name = 'Engineering';
    SELECT id INTO v_ict_dept  FROM departments WHERE name = 'ICT Services';

    SELECT id INTO v_desktop   FROM categories WHERE name = 'Desktop Computer';
    SELECT id INTO v_laptop    FROM categories WHERE name = 'Laptop';
    SELECT id INTO v_printer   FROM categories WHERE name = 'Printer';
    SELECT id INTO v_network   FROM categories WHERE name = 'Network Equipment';
    SELECT id INTO v_server    FROM categories WHERE name = 'Server';
    SELECT id INTO v_projector FROM categories WHERE name = 'Projector';
    SELECT id INTO v_ups       FROM categories WHERE name = 'UPS';
    SELECT id INTO v_scanner   FROM categories WHERE name = 'Scanner';


    -- =========================================================
    -- DEMO USERS  (auth.users + profiles)
    -- =========================================================
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, created_at, updated_at
    ) VALUES
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin@uz.ac.zw',   crypt('Password123!', gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"John Musiyiwa"}',
     FALSE, NOW() - INTERVAL '6 months', NOW()),

    (v_tech_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'tech@uz.ac.zw',    crypt('Password123!', gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Tatenda Chiweshe"}',
     FALSE, NOW() - INTERVAL '5 months', NOW()),

    (v_cs_rep,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'cs.rep@uz.ac.zw',  crypt('Password123!', gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Blessing Moyo"}',
     FALSE, NOW() - INTERVAL '4 months', NOW()),

    (v_is_rep,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'is.rep@uz.ac.zw',  crypt('Password123!', gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Chipo Zvakavapano"}',
     FALSE, NOW() - INTERVAL '3 months', NOW()),

    (v_lib_rep,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'lib.rep@uz.ac.zw', crypt('Password123!', gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Grace Madzima"}',
     FALSE, NOW() - INTERVAL '2 months', NOW()),

    (v_eng_rep,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'eng.rep@uz.ac.zw', crypt('Password123!', gen_salt('bf')), NOW(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Farai Mutumbe"}',
     FALSE, NOW() - INTERVAL '1 month',  NOW())
    ON CONFLICT DO NOTHING;

    -- Re-resolve user IDs in case the emails already existed with different IDs
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@uz.ac.zw' LIMIT 1;
    SELECT id INTO v_tech_id  FROM auth.users WHERE email = 'tech@uz.ac.zw'  LIMIT 1;
    SELECT id INTO v_cs_rep   FROM auth.users WHERE email = 'cs.rep@uz.ac.zw'  LIMIT 1;
    SELECT id INTO v_is_rep   FROM auth.users WHERE email = 'is.rep@uz.ac.zw'  LIMIT 1;
    SELECT id INTO v_lib_rep  FROM auth.users WHERE email = 'lib.rep@uz.ac.zw' LIMIT 1;
    SELECT id INTO v_eng_rep  FROM auth.users WHERE email = 'eng.rep@uz.ac.zw' LIMIT 1;

    -- Upsert profiles using the resolved IDs
    INSERT INTO profiles (id, email, full_name, role, department_id)
    VALUES
        (v_admin_id, 'admin@uz.ac.zw',   'John Musiyiwa',    'admin',          v_ict_dept),
        (v_tech_id,  'tech@uz.ac.zw',    'Tatenda Chiweshe', 'technician',     v_ict_dept),
        (v_cs_rep,   'cs.rep@uz.ac.zw',  'Blessing Moyo',    'department_rep', v_cs_dept),
        (v_is_rep,   'is.rep@uz.ac.zw',  'Chipo Zvakavapano','department_rep', v_is_dept),
        (v_lib_rep,  'lib.rep@uz.ac.zw', 'Grace Madzima',    'department_rep', v_lib_dept),
        (v_eng_rep,  'eng.rep@uz.ac.zw', 'Farai Mutumbe',    'department_rep', v_eng_dept)
    ON CONFLICT (id) DO UPDATE SET
        full_name     = EXCLUDED.full_name,
        role          = EXCLUDED.role,
        department_id = EXCLUDED.department_id;


    -- =========================================================
    -- ICT ASSETS  (30 assets across all departments)
    -- =========================================================
    INSERT INTO ict_assets (id, asset_tag, name, description, category_id, department_id, serial_number, status, purchase_date, warranty_expiry, assigned_user, location) VALUES

    -- Computer Science (8 assets)
    (v_a_cs001,'UZ-CS-001','Dell OptiPlex 7090',       'Student lab desktop computer',         v_desktop,   v_cs_dept, 'D7090-CS-001',   'active',            '2022-03-10','2025-03-10','Blessing Moyo',       'CS Computer Lab 1'),
    (v_a_cs002,'UZ-CS-002','Dell OptiPlex 7090',       'Student lab desktop computer',         v_desktop,   v_cs_dept, 'D7090-CS-002',   'active',            '2022-03-10','2025-03-10','Blessing Moyo',       'CS Computer Lab 1'),
    (v_a_cs003,'UZ-CS-003','Dell OptiPlex 7090',       'Student lab desktop computer',         v_desktop,   v_cs_dept, 'D7090-CS-003',   'faulty',            '2022-03-10','2025-03-10','Blessing Moyo',       'CS Computer Lab 1'),
    (v_a_cs004,'UZ-CS-004','HP EliteBook 850 G8',      'Head of Department laptop',            v_laptop,    v_cs_dept, 'ELITEBK-CS-001', 'active',            '2021-07-20','2024-07-20','Prof. R. Zvarevashe', 'HOD Office'),
    (v_a_cs005,'UZ-CS-005','HP EliteBook 850 G8',      'Lecturer laptop',                      v_laptop,    v_cs_dept, 'ELITEBK-CS-002', 'active',            '2021-07-20','2024-07-20','Dr. A. Mahachi',      'Lecture Room A'),
    (v_a_cs006,'UZ-CS-006','Epson EcoTank L3150',      'Office printer and scanner combo',     v_printer,   v_cs_dept, 'EPSON-CS-001',   'active',            '2023-01-15','2026-01-15', NULL,                 'CS Admin Office'),
    (v_a_cs007,'UZ-CS-007','Epson EB-X51 Projector',   'Classroom projector',                  v_projector, v_cs_dept, 'EBXP-CS-001',    'under_maintenance', '2020-08-05','2023-08-05', NULL,                 'CS Lab 2'),
    (v_a_cs008,'UZ-CS-008','Dell OptiPlex 3080',       'Student lab desktop computer',         v_desktop,   v_cs_dept, 'D3080-CS-001',   'active',            '2023-05-12','2026-05-12','Blessing Moyo',       'CS Computer Lab 2'),

    -- Information Systems (6 assets)
    (v_a_is001,'UZ-IS-001','HP ProDesk 400 G6',        'IS lab desktop',                       v_desktop,   v_is_dept, 'PRODESK-IS-001', 'active',            '2022-01-20','2025-01-20','Chipo Zvakavapano',   'IS Computer Lab'),
    (v_a_is002,'UZ-IS-002','HP ProDesk 400 G6',        'IS lab desktop',                       v_desktop,   v_is_dept, 'PRODESK-IS-002', 'active',            '2022-01-20','2025-01-20','Chipo Zvakavapano',   'IS Computer Lab'),
    (v_a_is003,'UZ-IS-003','HP ProDesk 400 G6',        'IS lab desktop',                       v_desktop,   v_is_dept, 'PRODESK-IS-003', 'faulty',            '2022-01-20','2025-01-20', NULL,                 'IS Computer Lab'),
    (v_a_is004,'UZ-IS-004','Lenovo ThinkPad E15',      'IS department laptop',                 v_laptop,    v_is_dept, 'THINKPAD-IS-001','active',            '2023-02-14','2026-02-14','Chipo Zvakavapano',   'IS Office'),
    (v_a_is005,'UZ-IS-005','HP LaserJet Pro M404dn',   'IS office printer',                    v_printer,   v_is_dept, 'HPLJ-IS-001',    'active',            '2021-11-30','2024-11-30', NULL,                 'IS Admin Office'),
    (v_a_is006,'UZ-IS-006','Epson EH-TW5400 Projector','IS lecture room projector',            v_projector, v_is_dept, 'EHTW-IS-001',    'active',            '2022-09-10','2025-09-10', NULL,                 'IS Lecture Room'),

    -- Library (5 assets)
    (v_a_lib001,'UZ-LIB-001','Dell Vostro 3910',       'Library service desk computer',        v_desktop,   v_lib_dept,'VOSTRO-LIB-001', 'active',            '2022-06-01','2025-06-01','Grace Madzima',       'Library Main Desk'),
    (v_a_lib002,'UZ-LIB-002','Dell Vostro 3910',       'Student OPAC terminal',                v_desktop,   v_lib_dept,'VOSTRO-LIB-002', 'active',            '2022-06-01','2025-06-01', NULL,                 'Library Study Area'),
    (v_a_lib003,'UZ-LIB-003','Dell Vostro 3910',       'Student OPAC terminal',                v_desktop,   v_lib_dept,'VOSTRO-LIB-003', 'active',            '2022-06-01','2025-06-01', NULL,                 'Library Study Area'),
    (v_a_lib004,'UZ-LIB-004','Canon imageRUNNER 2206', 'Library photocopier and printer',      v_printer,   v_lib_dept,'CANON-LIB-001',  'active',            '2021-03-22','2024-03-22', NULL,                 'Library Main Desk'),
    (v_a_lib005,'UZ-LIB-005','Canon DR-C225W Scanner', 'Document scanner for archiving',       v_scanner,   v_lib_dept,'DRCSCAN-LIB-001','active',            '2023-07-19','2026-07-19', NULL,                 'Library Archives'),

    -- Administration (4 assets)
    (v_a_adm001,'UZ-ADM-001','HP EliteDesk 800 G6',   'Registrar office desktop',             v_desktop,   v_adm_dept,'EDESK-ADM-001',  'active',            '2021-04-15','2024-04-15','Registrar Staff',     'Registrar Office'),
    (v_a_adm002,'UZ-ADM-002','HP EliteDesk 800 G6',   'Finance office desktop',               v_desktop,   v_adm_dept,'EDESK-ADM-002',  'active',            '2021-04-15','2024-04-15','Finance Staff',       'Finance Office'),
    (v_a_adm003,'UZ-ADM-003','HP EliteBook 1030 G4',  'Vice Chancellor executive laptop',     v_laptop,    v_adm_dept,'ELITE1030-ADM-001','active',           '2023-08-30','2026-08-30','Vice Chancellor',     'VC Office'),
    (v_a_adm004,'UZ-ADM-004','HP LaserJet Enterprise M608','High-volume admin printer',       v_printer,   v_adm_dept,'HPLJ-ADM-001',   'active',            '2020-02-10','2023-02-10', NULL,                 'Registrar Office'),

    -- Engineering (4 assets)
    (v_a_eng001,'UZ-ENG-001','Dell Precision 3650',    'Engineering CAD workstation',          v_desktop,   v_eng_dept,'PREC3650-ENG-001','active',           '2022-11-05','2025-11-05','Farai Mutumbe',       'ENG Computer Lab 1'),
    (v_a_eng002,'UZ-ENG-002','Dell Precision 3650',    'Engineering CAD workstation',          v_desktop,   v_eng_dept,'PREC3650-ENG-002','active',           '2022-11-05','2025-11-05','Farai Mutumbe',       'ENG Computer Lab 1'),
    (v_a_eng003,'UZ-ENG-003','Epson EB-L200W Projector','Engineering lecture hall projector',  v_projector, v_eng_dept,'EBL200-ENG-001', 'active',            '2023-03-18','2026-03-18', NULL,                 'ENG Lecture Hall'),
    (v_a_eng004,'UZ-ENG-004','Dell Vostro 3910',       'Decommissioned lab desktop',           v_desktop,   v_eng_dept,'VOSTRO-ENG-001', 'disposed',          '2018-06-12','2021-06-12', NULL,                 'Storage Room'),

    -- ICT Services (3 assets)
    (v_a_ict001,'UZ-ICT-001','Dell PowerEdge R740',    'Primary application server',           v_server,    v_ict_dept,'PWREDGE-ICT-001','active',            '2021-09-01','2026-09-01','ICT Admin',           'Main Server Room'),
    (v_a_ict002,'UZ-ICT-002','Cisco Catalyst 2960-X',  'Core network distribution switch',     v_network,   v_ict_dept,'CISCO-ICT-001',  'active',            '2020-05-14','2025-05-14','ICT Admin',           'Network Closet A'),
    (v_a_ict003,'UZ-ICT-003','APC Smart-UPS 1500VA',   'Server room UPS backup power',         v_ups,       v_ict_dept,'APCUPS-ICT-001', 'active',            '2022-12-01','2025-12-01','ICT Admin',           'Main Server Room')

    ON CONFLICT (asset_tag) DO NOTHING;


    -- =========================================================
    -- FAULT REPORTS  (8 reports across departments)
    -- =========================================================
    INSERT INTO fault_reports (asset_id, reported_by, description, priority, status, resolution_notes, created_at) VALUES
    (v_a_cs003, v_cs_rep,  'Screen flickers and turns off intermittently. Possibly GPU or display cable issue.',         'high',     'in_progress', NULL,                                                     NOW() - INTERVAL '8 days'),
    (v_a_cs007, v_cs_rep,  'Projector lamp not turning on. Lamp indicator light is red.',                                'medium',   'in_progress', NULL,                                                     NOW() - INTERVAL '5 days'),
    (v_a_is003, v_is_rep,  'Computer fails to boot past BIOS screen. Likely HDD failure.',                              'critical', 'in_progress', NULL,                                                     NOW() - INTERVAL '3 days'),
    (v_a_lib001, v_lib_rep,'Mouse not responding and keyboard intermittently disconnects.',                              'low',      'resolved',    'USB hub replaced. All peripherals now working normally.',  NOW() - INTERVAL '14 days'),
    (v_a_adm003, NULL,     'Laptop battery no longer charges. Device only works when plugged in.',                      'medium',   'reported',    NULL,                                                     NOW() - INTERVAL '2 days'),
    (v_a_eng001, v_eng_rep,'AutoCAD crashes when loading large drawing files. Possibly insufficient RAM.',               'medium',   'resolved',    'RAM upgraded from 8GB to 16GB. Issue fully resolved.',    NOW() - INTERVAL '20 days'),
    (v_a_ict002, NULL,     'Port 12 on the core switch not forwarding traffic. Affects IS Lab connectivity.',            'high',     'reported',    NULL,                                                     NOW() - INTERVAL '1 day'),
    (v_a_is006,  v_is_rep, 'Projector display is fuzzy and pixelated at full 1080p resolution.',                        'low',      'closed',      'Display settings recalibrated. No hardware fault found.',  NOW() - INTERVAL '30 days');


    -- =========================================================
    -- MAINTENANCE RECORDS  (6 records)
    -- =========================================================
    INSERT INTO maintenance_records (asset_id, technician_id, maintenance_type, description, actions_taken, status, scheduled_date, completed_date, cost) VALUES
    (v_a_cs007,  v_tech_id, 'corrective',  'Replace faulty projector lamp bulb',
     NULL,
     'in_progress', CURRENT_DATE, NULL, NULL),

    (v_a_is003,  v_tech_id, 'corrective',  'Hard drive replacement and OS reinstall',
     'Replaced failed HDD with 512GB SSD. Reinstalled Windows 11 Pro and all required software.',
     'completed', (CURRENT_DATE - 3), (CURRENT_DATE - 1), 89.00),

    (v_a_lib001, v_tech_id, 'corrective',  'Replace faulty USB hub and peripherals',
     'Replaced 4-port USB hub, optical mouse and membrane keyboard.',
     'completed', (CURRENT_DATE - 14), (CURRENT_DATE - 13), 45.00),

    (v_a_ict001, v_tech_id, 'preventive',  'Quarterly server maintenance and health check',
     'Cleaned dust filters, verified RAID-5 integrity, updated server firmware to v2.1.3, reviewed event logs.',
     'completed', (CURRENT_DATE - 30), (CURRENT_DATE - 30), 0.00),

    (v_a_ict002, v_tech_id, 'corrective',  'Network switch port 12 diagnostics',
     NULL,
     'scheduled', (CURRENT_DATE + 1), NULL, NULL),

    (v_a_cs001,  v_tech_id, 'preventive',  'Annual hardware inspection and cleaning',
     'Cleaned internal components, reseated RAM, updated BIOS to latest version v2.12.0.',
     'completed', (CURRENT_DATE - 60), (CURRENT_DATE - 60), 0.00);


    -- =========================================================
    -- ALLOCATIONS  (8 records)
    -- =========================================================
    INSERT INTO allocations (asset_id, from_department_id, to_department_id, allocated_by, assigned_to, return_date, status, notes) VALUES
    (v_a_cs001,  v_ict_dept, v_cs_dept,  v_admin_id, 'Blessing Moyo',       NULL,                   'active',   'Initial allocation to CS Computer Lab 1'),
    (v_a_is004,  v_adm_dept, v_is_dept,  v_admin_id, 'Chipo Zvakavapano',   NULL,                   'active',   'Transferred from Admin surplus stock to IS Dept'),
    (v_a_lib001, v_ict_dept, v_lib_dept, v_admin_id, 'Grace Madzima',       NULL,                   'active',   'Allocated to Library main service desk'),
    (v_a_eng003, v_ict_dept, v_eng_dept, v_admin_id, 'ENG Department',      NULL,                   'active',   'Projector allocated for Engineering lecture hall'),
    (v_a_adm003, v_ict_dept, v_adm_dept, v_admin_id, 'Vice Chancellor',     NULL,                   'active',   'Executive laptop provisioned for VC Office'),
    (v_a_cs005,  v_adm_dept, v_cs_dept,  v_admin_id, 'Dr. A. Mahachi',      CURRENT_DATE - 5,       'returned', 'Temporary loan for 2-day workshop. Returned on schedule.'),
    (v_a_is005,  v_ict_dept, v_is_dept,  v_admin_id, 'IS Office Staff',     NULL,                   'active',   'Printer allocated to IS Admin office'),
    (v_a_eng004, v_eng_dept, v_ict_dept, v_admin_id,  NULL,                 NULL,                   'cancelled','Disposal transfer cancelled — asset sent to storage instead');


    -- =========================================================
    -- SOFTWARE ASSETS  (8 licenses)
    -- =========================================================
    INSERT INTO software_assets (name, vendor, version, license_key, license_type, total_seats, department_id, status, purchase_date, license_expiry, cost, notes) VALUES
    ('Microsoft Office 365',        'Microsoft', '365',     'MS365-XXXX-XXXX-XXXX-XXXX', 'subscription', 100, NULL,        'active',   '2024-01-01', '2025-12-31', 4500.00, 'University-wide volume license. Covers all staff and student lab machines.'),
    ('Windows 11 Pro',              'Microsoft', '11 Pro',  'WIN11-XXXX-XXXX-XXXX-XXXX', 'perpetual',    100, NULL,        'active',   '2023-06-01',  NULL,        3200.00, 'OEM perpetual licenses bundled with all purchased desktop hardware.'),
    ('AutoCAD 2024',                'Autodesk',  '2024',    'ACAD-XXXX-XXXX-XXXX-XXXX',  'subscription',   5, v_eng_dept,  'active',   '2024-06-01', '2025-06-01', 2200.00, 'Engineering Department only. 5-seat subscription for CAD labs.'),
    ('MATLAB R2024a',               'MathWorks', 'R2024a',  'MATL-XXXX-XXXX-XXXX-XXXX',  'subscription',  10, v_eng_dept,  'expired',  '2023-01-01', '2024-03-31', 1800.00, 'License expired March 2024. Renewal request submitted (see Service Requests).'),
    ('Adobe Creative Cloud',        'Adobe',     '2024',    'ADCC-XXXX-XXXX-XXXX-XXXX',  'subscription',  10, v_cs_dept,   'active',   '2024-03-01', '2025-09-30', 1200.00, 'Shared between CS and IS Departments for design and multimedia courses.'),
    ('Kaspersky Endpoint Security', 'Kaspersky', '11.11',   'KASP-XXXX-XXXX-XXXX-XXXX',  'subscription', 150, NULL,        'active',   '2024-08-01', '2025-08-01',  600.00, 'University-wide endpoint antivirus protection. Managed from ICT Services.'),
    ('NetSim Network Simulator',    'Tetcos',    '13.0',    'NETS-XXXX-XXXX-XXXX-XXXX',  'subscription',  25, v_is_dept,   'active',   '2024-04-01', '2025-07-01',  950.00, 'IS Department. Used in COMP3214 Networking course.'),
    ('Oracle Database 21c',         'Oracle',    '21c',     'ORCL-XXXX-XXXX-XXXX-XXXX',  'perpetual',      2, v_ict_dept,  'active',   '2022-11-15', '2026-12-31', 5000.00, 'Production database for ICT Services core systems. 2-core perpetual license.');


    -- =========================================================
    -- SERVICE REQUESTS  (8 requests)
    -- =========================================================
    INSERT INTO service_requests (title, request_type, description, priority, status, department_id, requested_by, admin_notes, created_at) VALUES
    ('10 Additional Desktop Computers for CS Lab Expansion',
     'new_equipment',
     'CS Computer Lab 1 is operating at full capacity with 20 students per machine during peak hours. Requesting 10 additional Dell OptiPlex desktops to accommodate the increasing student enrollment in Computer Science.',
     'high', 'pending', v_cs_dept, v_cs_rep, NULL,
     NOW() - INTERVAL '5 days'),

    ('Microsoft Project Licenses for IS Department',
     'software',
     'Requesting 15 MS Project 2024 licenses for the IS Department project management course (COMP4105). Currently 45 students are sharing 3 licenses causing severe scheduling conflicts.',
     'medium', 'approved', v_is_dept, v_is_rep,
     'Approved by ICT Director. Procurement order PO-2025-0042 raised on 10 April.',
     NOW() - INTERVAL '12 days'),

    ('Network Connectivity Issue — IS Lab Room 3',
     'network',
     'Multiple computers in IS Lab Room 3 cannot connect to the campus network. Issue began after scheduled network maintenance on 10 April 2025. Approximately 12 machines affected.',
     'high', 'in_progress', v_is_dept, v_is_rep,
     'Technician Tatenda Chiweshe dispatched. Root cause identified as misconfigured VLAN on switch port 12.',
     NOW() - INTERVAL '3 days'),

    ('Replacement Printer for Administration Office 2',
     'new_equipment',
     'The existing printer in Admin Office 2 (UZ-ADM-004, HP LaserJet M608) is over 5 years old and jams frequently. Downtime is affecting administrative operations. Requesting a replacement unit.',
     'medium', 'pending', v_adm_dept, NULL, NULL,
     NOW() - INTERVAL '7 days'),

    ('Laptop for Visiting Lecturer — Prof. J. Ndlovu',
     'new_equipment',
     'Visiting lecturer Prof. J. Ndlovu from NUST requires a laptop for a 2-week intensive workshop (14–28 April 2025). The lecturer will be delivering the COMP4302 Advanced Algorithms module.',
     'low', 'fulfilled', v_cs_dept, v_cs_rep,
     'Loaner laptop (HP EliteBook 850 G8) provided from ICT Services stock. To be returned 28 April.',
     NOW() - INTERVAL '15 days'),

    ('MATLAB License Renewal and Expansion — Engineering',
     'software',
     'The current MATLAB R2024a license (10 seats, Engineering only) expired on 31 March 2024. Requesting renewal with expanded coverage (20 seats) to serve both Engineering and IS Departments for the next 2 years.',
     'high', 'pending', v_eng_dept, v_eng_rep, NULL,
     NOW() - INTERVAL '2 days'),

    ('WiFi Access Point for Library Study Area 2',
     'network',
     'WiFi signal strength in Library Study Area 2 drops below usable levels during peak hours (08:00–17:00). Students cannot conduct online research effectively. Requesting installation of an additional access point.',
     'medium', 'approved', v_lib_dept, v_lib_rep,
     'Approved. Cisco Aironet 1832i AP ordered. Installation scheduled for 18 April 2025.',
     NOW() - INTERVAL '20 days'),

    ('Emergency Data Recovery — Damaged Hard Drive (Dr. T. Moyo)',
     'other',
     'A hard drive containing 3 years of active research data for Dr. T. Moyo (Engineering) has mechanically failed. The drive contains unpublished research and PhD student supervision records. Requesting urgent professional data recovery.',
     'critical', 'in_progress', v_eng_dept, v_eng_rep,
     'Drive couriered to DataRecovery Solutions Harare on 13 April. Estimated 5–7 working days for recovery.',
     NOW() - INTERVAL '1 day');


END $$;
