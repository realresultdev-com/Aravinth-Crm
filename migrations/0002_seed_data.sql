-- Dr. Aravinth Dental Care — Initial Seed Data
-- Migration: 0002_seed_data.sql

-- Initial Clinic Settings
INSERT OR REPLACE INTO clinic_settings (
    id, clinic_name, phone, email, address, default_appointment_duration, treatment_options, created_at, updated_at
) VALUES (
    'default',
    'Dr. Aravinth Dental Care',
    '99526 02577',
    'draravinthsdentalcare2021@gmail.com',
    'Namakkal, Tamil Nadu, India',
    30,
    '[
        {"id": "t1", "name": "Dental Consultation & Examination", "category": "General", "default_cost_paise": 30000},
        {"id": "t2", "name": "Ultrasonic Scaling & Polishing", "category": "Preventive", "default_cost_paise": 100000},
        {"id": "t3", "name": "Composite Resin Filling", "category": "Restorative", "default_cost_paise": 120000},
        {"id": "t4", "name": "Single Sitting Root Canal Treatment (RCT)", "category": "Endodontics", "default_cost_paise": 350000},
        {"id": "t5", "name": "Zirconia Crown / Ceramic Cap", "category": "Prosthodontics", "default_cost_paise": 650000},
        {"id": "t6", "name": "Simple Tooth Extraction", "category": "Oral Surgery", "default_cost_paise": 80000},
        {"id": "t7", "name": "Surgical Impaction (Wisdom Tooth)", "category": "Oral Surgery", "default_cost_paise": 300000},
        {"id": "t8", "name": "Laser Teeth Whitening", "category": "Cosmetic", "default_cost_paise": 500000},
        {"id": "t9", "name": "Orthodontic Aligners / Braces Consultation", "category": "Orthodontics", "default_cost_paise": 150000}
    ]',
    datetime('now'),
    datetime('now')
);

-- Seed Staff Accounts
-- 1. Admin: admin / admin
INSERT OR IGNORE INTO users (id, username, password_hash, salt, full_name, role, phone, email, is_active, created_at)
VALUES (
    'user_admin_01',
    'admin',
    '46f940a3416d5259866a9e0bdf93caacf0f72266d178136776ab76c1183c7c2e',
    '4e3a8ab98c0ab8e42852e7e1d591687e',
    'Dr. Aravinth (Admin)',
    'admin',
    '99526 02577',
    'draravinthsdentalcare2021@gmail.com',
    1,
    datetime('now')
);

-- 2. Dentist: dr.aravinth / Dental@2026
INSERT OR IGNORE INTO users (id, username, password_hash, salt, full_name, role, phone, email, is_active, created_at)
VALUES (
    'user_dentist_01',
    'dr.aravinth',
    'ff92bdfb6f1b6a81d21cce4abd8ecc4b164abe1349eb85e224c8a283515e7e56',
    'e02c4373e33fe00aa96a776b2969c203',
    'Dr. Aravinth BDS, MDS',
    'dentist',
    '99526 02577',
    'draravinthsdentalcare2021@gmail.com',
    1,
    datetime('now')
);

-- 3. Receptionist: reception / Clinic@2026
INSERT OR IGNORE INTO users (id, username, password_hash, salt, full_name, role, phone, email, is_active, created_at)
VALUES (
    'user_reception_01',
    'reception',
    'ff145d08b09d81249f43886bc84a46e259668b5732def7664a656e423196b922',
    '8c5fe3421fdc2ec6686aff887d46a8cb',
    'Front Desk Reception',
    'receptionist',
    '99526 02577',
    'draravinthsdentalcare2021@gmail.com',
    1,
    datetime('now')
);

-- Seed Initial Patients with realistic clinical records
INSERT OR IGNORE INTO patients (
    id, full_name, phone, email, dob, age, gender, address, emergency_name, emergency_phone,
    registration_date, chief_complaint, medical_history, allergies, medications, dental_history, dentist_notes, created_at, updated_at
) VALUES 
(
    'DAC-000001',
    'Senthil Kumar M',
    '98421 11223',
    'senthil.k@gmail.com',
    '1985-06-15',
    41,
    'Male',
    '14/B Trichy Road, Mohanur, Namakkal - 637015',
    'Kavitha Senthil',
    '98421 11224',
    date('now', '-10 days'),
    'Severe throbbing pain in lower left back tooth since 3 days, aggravating on cold water',
    'Type 2 Diabetes Mellitus (Controlled, HbA1c 6.8)',
    'Penicillin allergy',
    'Metformin 500mg OD',
    'Previous scaling done 2 years ago',
    'Deep caries tooth 36 involving pulp. Advised single sitting RCT followed by crown.',
    datetime('now', '-10 days'),
    datetime('now', '-2 days')
),
(
    'DAC-000002',
    'Ananya Ramesh',
    '94432 55667',
    'ananya.ramesh@yahoo.com',
    '1998-11-20',
    27,
    'Female',
    '52 Paramathi Road, Namakkal - 637001',
    'Ramesh Sundaram',
    '94432 55668',
    date('now', '-7 days'),
    'Bleeding gums while brushing and yellowish stains on front teeth',
    'None reported',
    'No known drug allergies',
    'None',
    'No previous major dental treatment',
    'Generalized marginal gingivitis with moderate supragingival calculus. Advised full mouth scaling and oral hygiene instruction.',
    datetime('now', '-7 days'),
    datetime('now', '-1 days')
),
(
    'DAC-000003',
    'Vigneshwaran P',
    '97890 88990',
    'vicky.p@outlook.com',
    '1992-03-08',
    34,
    'Male',
    '78 Salem Road, Near Bus Stand, Namakkal - 637002',
    'Palanisamy K',
    '97890 88991',
    date('now', '-4 days'),
    'Pain and swelling in lower right jaw near last molar',
    'Hypertension (Blood pressure normal with medication)',
    'No allergies',
    'Amlodipine 5mg',
    'Routine extraction of 26 in 2021',
    'Pericoronitis irt impacted tooth 48. Operculum inflamed. Operculectomy or surgical disimpaction indicated after antibiotic coverage.',
    datetime('now', '-4 days'),
    datetime('now', '-4 days')
),
(
    'DAC-000004',
    'Priya Sundaram',
    '99441 23456',
    'priya.s@gmail.com',
    '2001-08-14',
    24,
    'Female',
    '22 Thuraiyur Road, Sendamangalam, Namakkal - 637409',
    'Sundaram V',
    '99441 23457',
    date('now'),
    'Food lodgement and dark spot in upper right back tooth',
    'None',
    'Sulfa drugs allergy',
    'None',
    'Orthodontic treatment completed 3 years ago',
    'Occlusal pit and fissure caries in tooth 16, dentin involved. Restored with composite resin.',
    datetime('now'),
    datetime('now')
),
(
    'DAC-000005',
    'Murugesan K',
    '98427 34567',
    'murugesan.farm@gmail.com',
    '1968-12-04',
    57,
    'Male',
    'Rasipuram Main Road, Namakkal - 637408',
    'M. Selvi',
    '98427 34568',
    date('now', '-15 days'),
    'Missing back teeth, difficulty in chewing food',
    'None',
    'No known allergies',
    'None',
    'Multiple extractions over the past 5 years',
    'Partially edentulous arches. Discussed removable partial denture vs dental implants.',
    datetime('now', '-15 days'),
    datetime('now', '-5 days')
);

-- Update Sequence counter for patients
UPDATE patient_sequence SET next_val = 6 WHERE id = 1;

-- Appointments for Today and surrounding days
INSERT OR IGNORE INTO appointments (
    id, patient_id, dentist_id, appointment_date, start_time, end_time, duration_minutes, reason, status, notes, created_at
) VALUES 
(
    'apt-001',
    'DAC-000001',
    'user_dentist_01',
    date('now'),
    '10:00',
    '10:45',
    45,
    'Root Canal Treatment (Step 2 - Obturation)',
    'Confirmed',
    'Patient instructed to take breakfast prior to visit',
    datetime('now', '-1 day')
),
(
    'apt-002',
    'DAC-000004',
    'user_dentist_01',
    date('now'),
    '11:30',
    '12:00',
    30,
    'Tooth 16 Composite Restoration',
    'Scheduled',
    'Routine filling procedure',
    datetime('now')
),
(
    'apt-003',
    'DAC-000002',
    'user_dentist_01',
    date('now'),
    '16:00',
    '16:30',
    30,
    'Post-scaling review and fluoride application',
    'Scheduled',
    'Check gingival healing index',
    datetime('now', '-2 days')
),
(
    'apt-004',
    'DAC-000003',
    'user_dentist_01',
    date('now', '+1 day'),
    '11:00',
    '12:00',
    60,
    'Surgical Extraction - Impacted Tooth 48',
    'Scheduled',
    'Pre-op vitals check required',
    datetime('now', '-3 days')
);

-- Consultations Records
INSERT OR IGNORE INTO consultations (
    id, patient_id, dentist_id, consultation_date, chief_complaint, clinical_observations, examination_notes,
    diagnosis, treatment_recommendation, prescription_notes, follow_up_recommendation, next_review_date, created_at
) VALUES 
(
    'con-001',
    'DAC-000001',
    'user_dentist_01',
    date('now', '-10 days'),
    'Severe throbbing pain in lower left back tooth',
    'Deep disto-occlusal cavity irt 36. Tender on vertical percussion. Lingual gingiva healthy.',
    'IOPA X-ray reveals radiolucency involving enamel, dentin, and pulp with widened periodontal ligament space irt 36 apices.',
    'Irreversible Pulpitis with Acute Apical Periodontitis irt 36',
    'Endodontic therapy (RCT) irt 36 followed by full coverage CAD/CAM crown.',
    'Tab. Amoxicillin 500mg TDS x 5 days (Patient allergic to penicillin, prescribed Tab. Cefuroxime Axetil 500mg BD), Tab. Aceclofenac + Paracetamol BD x 3 days',
    'Review after 3 days for second sitting',
    date('now', '-7 days'),
    datetime('now', '-10 days')
),
(
    'con-002',
    'DAC-000002',
    'user_dentist_01',
    date('now', '-7 days'),
    'Bleeding gums while brushing',
    'Generalized plaque and subgingival calculus, marginal gingival erythema, probing depth 2-3mm.',
    'Full mouth examination reveals no mobility. Enamel surfaces intact.',
    'Chronic Generalized Plaque-Induced Marginal Gingivitis',
    'Ultrasonic scaling and polishing. Proper bass brushing technique demonstration.',
    'Chlorhexidine 0.2% mouthwash 10ml rinse twice daily for 2 weeks.',
    'Review in 7 days to check gingival response',
    date('now'),
    datetime('now', '-7 days')
);

-- Treatments & Procedures Records
INSERT OR IGNORE INTO treatments (
    id, patient_id, consultation_id, procedure_name, tooth_number, description,
    estimated_cost_paise, actual_cost_paise, status, start_date, completion_date, notes, created_at
) VALUES 
(
    'trt-001',
    'DAC-000001',
    'con-001',
    'Single Sitting Root Canal Treatment (RCT)',
    '36',
    'Access opening, biomechanical preparation (Protaper Gold), irrigation, canal disinfection',
    350000,
    350000,
    'In progress',
    date('now', '-10 days'),
    NULL,
    'Obturation planned today',
    datetime('now', '-10 days')
),
(
    'trt-002',
    'DAC-000001',
    'con-001',
    'Zirconia Crown / Ceramic Cap',
    '36',
    'CAD/CAM Monolithic Zirconia crown post-RCT',
    650000,
    650000,
    'Planned',
    NULL,
    NULL,
    'Impression to be taken post obturation',
    datetime('now', '-10 days')
),
(
    'trt-003',
    'DAC-000002',
    'con-002',
    'Ultrasonic Scaling & Polishing',
    'All',
    'Full mouth scaling with piezoelectric scaler and prophy paste polishing',
    100000,
    100000,
    'Completed',
    date('now', '-7 days'),
    date('now', '-7 days'),
    'Procedure completed smoothly. Gingival healing expected in 1 week.',
    datetime('now', '-7 days')
);

-- Payments Records (Values in Paise: 100 paise = 1 INR)
INSERT OR IGNORE INTO payments (
    id, patient_id, treatment_id, receipt_number, total_amount_paise, amount_paid_paise, outstanding_balance_paise,
    payment_method, payment_date, transaction_reference, notes, created_by, created_at
) VALUES 
(
    'pay-001',
    'DAC-000001',
    'trt-001',
    'RCP-2026-0001',
    350000,
    200000,
    150000,
    'UPI',
    date('now', '-10 days'),
    'UPI/783921894012/GPay',
    'Part payment for RCT irt 36. Balance Rs 1,500 due on completion.',
    'user_reception_01',
    datetime('now', '-10 days')
),
(
    'pay-002',
    'DAC-000002',
    'trt-003',
    'RCP-2026-0002',
    100000,
    100000,
    0,
    'Cash',
    date('now', '-7 days'),
    'CASH-REC-002',
    'Full payment for Ultrasonic Scaling & Polishing.',
    'user_reception_01',
    datetime('now', '-7 days')
);

-- Follow-ups Records
INSERT OR IGNORE INTO follow_ups (
    id, patient_id, consultation_id, treatment_id, follow_up_date, reason, status, notes, created_at
) VALUES 
(
    'fol-001',
    'DAC-000002',
    'con-002',
    'trt-003',
    date('now'),
    'Post-scaling gingival healing check & oral hygiene follow-up',
    'Pending',
    'Patient has an appointment today at 4:00 PM',
    datetime('now', '-7 days')
),
(
    'fol-002',
    'DAC-000001',
    'con-001',
    'trt-001',
    date('now', '+3 days'),
    'Check occlusion and final core buildup after obturation',
    'Pending',
    'Book crown preparation sitting',
    datetime('now', '-2 days')
);
