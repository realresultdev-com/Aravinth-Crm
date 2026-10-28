-- Dr. Aravinth Dental Care — Cloudflare D1 Relational Schema
-- Migration: 0001_initial_schema.sql

-- Staff Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'dentist', 'receptionist')),
    phone TEXT,
    email TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Active User Sessions (Token Hash stored, not plain token)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Patient Sequence Generator for concurrency-safe DAC-XXXXXX IDs
CREATE TABLE IF NOT EXISTS patient_sequence (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    next_val INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO patient_sequence (id, next_val) VALUES (1, 1);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY, -- e.g. DAC-000001
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    dob TEXT, -- YYYY-MM-DD
    age INTEGER,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other', '')),
    address TEXT,
    emergency_name TEXT,
    emergency_phone TEXT,
    registration_date TEXT NOT NULL DEFAULT (date('now')),
    -- Dental and Medical specific fields
    chief_complaint TEXT,
    medical_history TEXT,
    allergies TEXT,
    medications TEXT,
    dental_history TEXT,
    previous_treatments TEXT,
    dentist_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    dentist_id TEXT REFERENCES users(id),
    appointment_date TEXT NOT NULL, -- YYYY-MM-DD in Asia/Kolkata
    start_time TEXT NOT NULL, -- HH:MM
    end_time TEXT NOT NULL, -- HH:MM
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-show')) DEFAULT 'Scheduled',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Consultations Table (Clinical Records)
CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    dentist_id TEXT NOT NULL REFERENCES users(id),
    consultation_date TEXT NOT NULL DEFAULT (date('now')),
    chief_complaint TEXT,
    clinical_observations TEXT,
    examination_notes TEXT,
    diagnosis TEXT NOT NULL,
    treatment_recommendation TEXT,
    prescription_notes TEXT,
    follow_up_recommendation TEXT,
    next_review_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Treatments & Procedures Table
CREATE TABLE IF NOT EXISTS treatments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id TEXT REFERENCES consultations(id),
    procedure_name TEXT NOT NULL,
    tooth_number TEXT, -- e.g. "16", "21", "Universal/FDI numbering"
    description TEXT,
    estimated_cost_paise INTEGER NOT NULL DEFAULT 0,
    actual_cost_paise INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('Planned', 'In progress', 'Completed', 'Cancelled')) DEFAULT 'Planned',
    start_date TEXT,
    completion_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Payments & Billing (All financial values in integer minor units: Paise)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_id TEXT REFERENCES treatments(id),
    appointment_id TEXT REFERENCES appointments(id),
    receipt_number TEXT UNIQUE NOT NULL,
    total_amount_paise INTEGER NOT NULL DEFAULT 0,
    amount_paid_paise INTEGER NOT NULL DEFAULT 0,
    outstanding_balance_paise INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash', 'UPI', 'Card', 'Bank Transfer', 'Other')),
    payment_date TEXT NOT NULL DEFAULT (date('now')),
    transaction_reference TEXT,
    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Follow-ups Table
CREATE TABLE IF NOT EXISTS follow_ups (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id TEXT REFERENCES consultations(id),
    treatment_id TEXT REFERENCES treatments(id),
    follow_up_date TEXT NOT NULL, -- YYYY-MM-DD
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Completed', 'Rescheduled', 'Cancelled')) DEFAULT 'Pending',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit Logs Table (Clinical and financial activity tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Clinic Settings Table
CREATE TABLE IF NOT EXISTS clinic_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    clinic_name TEXT NOT NULL DEFAULT 'Dr. Aravinth Dental Care',
    phone TEXT NOT NULL DEFAULT '99526 02577',
    email TEXT NOT NULL DEFAULT 'draravinthsdentalcare2021@gmail.com',
    address TEXT NOT NULL DEFAULT 'Namakkal, Tamil Nadu, India',
    default_appointment_duration INTEGER NOT NULL DEFAULT 30,
    treatment_options TEXT NOT NULL, -- JSON array of standard treatments & pricing
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance and quick indexing
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_reg_date ON patients(registration_date);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist ON appointments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_status ON treatments(status);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date_status ON follow_ups(follow_up_date, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
