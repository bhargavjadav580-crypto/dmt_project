# Hospital Flow — Patient Flow Management System

> **"Google Maps for hospital workflow."** Powerful underneath. So simple on top that a first-time, low-computer-literacy user can operate it without training.

A full-stack, end-to-end prototype designed to streamline patient movement across departments with zero dead buttons, real database persistence, and role-based workflows.

---

## 🚀 Quick Start (5 Commands)

```bash
# 1. Install dependencies
pnpm install
# or: npm install --legacy-peer-deps

# 2. Copy environment variables
cp .env.example .env

# 3. Initialize SQLite database schema
pnpm prisma db push
# or: npx prisma db push

# 4. Seed demo data (staff, catalog, wards, 40+ active patients)
pnpm db:seed
# or: npx tsx prisma/seed.ts

# 5. Start development server
pnpm dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Logins

Click any **1-Click Demo Login** button on `/login` or enter credentials manually:

| Role | Email | Password | Primary Station |
|---|---|---|---|
| **RECEPTIONIST** | `reception@hospital.flow` | `reception123` | Patient Registration & Token Queue |
| **NURSE** | `nurse@hospital.flow` | `nurse123` | Nurse Station & Vitals Triage |
| **DOCTOR** | `doctor1@hospital.flow` | `doctor123` | Doctor Consultation & Clinical Workspace |
| **LAB_TECH** | `lab@hospital.flow` | `lab123` | Laboratory Diagnostics & Result Entry |
| **PHARMACIST** | `pharma@hospital.flow` | `pharma123` | Pharmacy Dispensing Desk |
| **ADMISSION_STAFF** | `admission@hospital.flow` | `admission123` | Inpatient Admissions & Bed Board |
| **BILLING_STAFF** | `billing@hospital.flow` | `billing123` | Hospital Billing & Cashier Desk |
| **ADMIN** | `admin@hospital.flow` | `admin123` | Hospital Command Center & Audit Trail |

---

## 🧭 Patient Journey Flow

```
Register → Check-in → Department Queue → Nurse Assessment → Doctor Consultation
  → [Laboratory / Radiology → Result Review]
  → [Prescription → Pharmacy Dispense]
  → [Referral]
  → [Inpatient Admission → Bed Assignment]
  → Billing Clearance
  → Discharge (Hard-Stop Checklist)
```

Every screen answers, in order:
1. **Where is the patient now?**
2. **What happened so far?**
3. **What happens next, and who does it?**
4. **ONE obvious primary action.**

---

## 🛠️ Architecture & Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, React Server Components)
- **UI & Design**: Tailwind CSS, Radix UI primitives, Lucide icons, Framer Motion animations
- **Database & ORM**: SQLite (`dev.db`) with Prisma ORM. Schema is 100% portable to PostgreSQL.
- **Authentication**: Auth.js (NextAuth v5) credentials provider with bcryptjs password hashing and role enforcement.
- **Data Integrity**: Money stored strictly as integer **paise** (never floats), dates stored in UTC and rendered in `Asia/Kolkata`.
- **Validation**: Zod schemas on every form input and Server Action.
- **Testing**:
  - `npm test`: 60 Vitest tests covering workflow transitions, 25 table-driven `getNextAction` scenarios, discharge guards, billing math, and full E2E journeys.
  - `npm run test:e2e`: Playwright test suite validating browser rendering, unauthenticated public TV displays, and role workstations.

---

## 🧪 Verification Commands

```bash
# Typecheck
pnpm typecheck   # or: npx tsc --noEmit

# Lint
pnpm lint        # or: npm run lint

# Unit & Integration Tests (60/60 passing)
pnpm test        # or: npx vitest run

# Browser End-to-End Tests (10/10 passing)
pnpm test:e2e    # or: npx playwright test
```

---

## 📺 Public Waiting Room TV Display

Open in fullscreen on any lobby TV:
`http://localhost:3000/display/GENERAL_OPD`
- Live token number in 100pt+ high-contrast typography
- Audio chime & visual flash on token changes
- Next in line tokens in priority order
- Zero Protected Health Information (PHI) displayed

---

## 📄 Key Project Deliverables

- `docs/DECISIONS.md`: Architectural decisions and rationale.
- `docs/MICROCOPY.md`: Plain-language medical workflow microcopy guidelines.
- `prisma/schema.prisma`: Complete Prisma schema with relations, audit logs, and versioning.
- `src/server/workflow/transition.ts`: Central atomic state machine.
- `src/server/workflow/discharge-guard.ts`: 5-point discharge safety guard.
