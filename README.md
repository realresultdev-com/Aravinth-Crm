# Dr. Aravinth Dental Care — Patient Management CRM
**Namakkal, Tamil Nadu, India**  
*Production-ready Patient Management CRM built on Cloudflare's Free Developer Platform.*

---

## 1. Overview & Architecture

This application is a complete, responsive healthcare CRM tailored specifically for the clinical and front-desk workflows of **Dr. Aravinth Dental Care** in Namakkal.

The entire system is engineered to run exclusively within **Cloudflare's Free Developer Platform** without requiring external VPS, MongoDB, Firebase, Supabase, AWS, or separate Node/Express servers.

```
                    ┌────────────────────────────────────────┐
                    │      Cloudflare Developer Platform      │
                    │                                        │
  Browser / Phone ─▶│  Cloudflare Worker (`worker/index.ts`) │
                    │     ├── /api/*  ─▶ REST API Handler     │
                    │     └── /*      ─▶ Static Assets (SPA) │
                    │                      (React 19 + Vite) │
                    │                                        │
                    │  Cloudflare D1 Database (SQLite)        │
                    │     └── Relational Schema & Indices    │
                    └────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite 8
- **Design System**: Apple-inspired healthcare aesthetic (`#FAFAF7` background, `#276B65` restrained teal accent, `#E2E5E0` borders, `#202421` primary text)
- **Backend**: Cloudflare Worker with TypeScript
- **Database**: Cloudflare D1 (SQLite-compatible serverless database)
- **Authentication**: Web Crypto PBKDF2 (SHA-256, 100,000 iterations), Secure HttpOnly SameSite Session Cookies, SHA-256 token hashing
- **Deployment**: Wrangler CLI & Cloudflare Workers with Static Assets

---

## 2. Seed Staff Accounts (Pre-configured for Initial Access)

All accounts are encrypted using PBKDF2 with unique cryptographic salts:

| Role | Username | Password | Full Name | Primary Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin` | Dr. Aravinth (Admin) | Full clinic control, user creation, settings, financial audits |
| **Dentist** | `dr.aravinth` | `Dental@2026` | Dr. Aravinth BDS, MDS | Clinical consultations, diagnoses, procedures, prescriptions |
| **Reception** | `reception` | `Clinic@2026` | Front Desk Reception | Patient registration, appointment booking, payments & receipts |

> [!NOTE]
> Change initial passwords after first deployment using the **Settings > Account Security** panel.

---

## 3. Core Modules Implemented

1. **Clinic Operations Dashboard**:
   - Live query metrics from D1 (Total patients, today's appointments, completed consultations today, pending payments in INR, upcoming follow-ups).
   - Real-time today's appointment schedule table with status toggling.
   - Quick action shortcuts for patient registration, scheduling, and billing.

2. **Patient Registration & Directory**:
   - Safe sequential ID generation: `DAC-000001`, `DAC-000002`, etc.
   - Intelligent duplicate detection warning on phone number and name.
   - Comprehensive dental-specific clinical intake: Chief complaints, systemic illnesses, drug allergies (Penicillin, Sulfa), current medications, dental history, and dentist notes.
   - Server-side search (ID, name, phone) and server-side pagination.

3. **Patient Profile & Clinical History**:
   - Tabbed view: Overview, Personal Demographics, Medical & Dental History, Appointments, Consultation History, Treatment Records, Payments Ledger, and Follow-ups.
   - Role-based clinical masking for reception staff.

4. **Appointment Management**:
   - Daily and weekly appointment views in `Asia/Kolkata` local timezone.
   - Overlap conflict detection enforcing doctor schedule availability.
   - Status tracking: Scheduled, Confirmed, Completed, Cancelled, No-show.

5. **Clinical Consultations**:
   - Dentist diagnosis entry, clinical observations, examination findings, treatment recommendations, prescription notes.
   - Automatic generation of linked follow-up review tasks.

6. **Treatment & Procedure Tracking**:
   - Procedure plans, FDI tooth numbering, estimated and actual costs.
   - Milestones: Planned, In progress, Completed, Cancelled.

7. **Payments & Billing**:
   - Integer minor units (**paise**: ₹1 = 100 paise) avoiding floating-point rounding errors.
   - Unique official receipt numbers: `RCP-YYYY-XXXX`.
   - Partial payments, balance calculations, payment methods (Cash, UPI, Card, Bank Transfer).
   - Printable official clinic receipt modal.

8. **Clinic Settings**:
   - Prepopulated with Dr. Aravinth Dental Care official details (Namakkal, Phone: 99526 02577, Email: draravinthsdentalcare2021@gmail.com).
   - Staff user management (admin only).

---

## 4. Local Development Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Apply D1 Database Migrations (Local SQLite)
```bash
npm run db:migrate:local
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Run Cloudflare Worker Dev Server (Backend + Local D1)
```bash
npm run dev:worker
```
*Server will be live on `http://127.0.0.1:8787`.*

### 5. Run Vite Development Server (Frontend with HMR)
```bash
npm run dev
```

---

## 5. Production Cloudflare Deployment Guide

### Step 1: Login to Cloudflare via Wrangler
```bash
npx wrangler login
```

### Step 2: Create Remote Cloudflare D1 Database
```bash
npx wrangler d1 create aravinth_dental_db
```
*Copy the generated `database_id` into `wrangler.jsonc` under `d1_databases[0].database_id`.*

### Step 3: Run Remote Migrations on Cloudflare D1
```bash
npm run db:migrate:remote
```

### Step 4: Build and Deploy to Cloudflare Workers
```bash
npm run deploy
```
*Wrangler will build the frontend assets into `./dist`, bundle the Worker API, and deploy everything to your Cloudflare account under `*.workers.dev`.*

---

## 6. Cloudflare Free-Tier Allowances & Boundaries

| Resource | Cloudflare Free Allowance | Clinic CRM Usage |
| :--- | :--- | :--- |
| **Worker Invocations** | 100,000 requests / day | ~500–2,000 / day for standard clinic operations |
| **Worker CPU Time** | 10 ms / request | Worker endpoints complete in ~1–3 ms |
| **D1 Database Reads** | 5,000,000 rows read / day | Efficient indexed queries with server-side pagination |
| **D1 Database Writes** | 100,000 rows written / day | Clinic records average ~50–200 writes / day |
| **D1 Storage** | 5 GB storage | Sufficient for hundreds of thousands of patient text records |
| **Static Assets** | Unlimited requests | Served globally via Cloudflare CDN edge |

---

## 7. Data Privacy & Compliance Notice

- All clinical patient records are stored with encryption-in-transit (HTTPS).
- Plaintext passwords and plaintext session tokens are **never** stored in the database.
- Medical notes are never logged in application debug output.
- For compliance with Indian Digital Personal Data Protection (DPDP) Act and healthcare standards, verify clinical backup and data retention policies before importing legacy patient records.
