# NexClinic by NexAura

NexClinic is a web-based appointment and clinic management platform that connects patients with doctors through a secure, digital system.

## Quick Overview

This README gives a high-level overview of the project for all stakeholders. For technical setup and architecture deep-dives, see the sections below or refer to [DEV_GUIDE.md](DEV_GUIDE.md).

## Table of Contents
1. [The Problem](#the-problem)
2. [Our Solution](#our-solution)
3. [Project Scope](#project-scope)
4. [Technology Stack](#technology-stack)
5. [Key Features](#key-features)
6. [Project Team](#project-team)
7. [Documentation & Setup](#documentation--setup)
8. [Technical Reference](#technical-reference) — for developers and architects

---

## The Problem

Healthcare clinics and outpatient centers face several operational challenges:

- Patients cannot easily find available doctors or check real-time availability online.
- Manual appointment booking leads to double-bookings, missed appointments, and wasted clinic time.
- Doctors lack a centralized way to manage their schedules and patient information efficiently.
- No automated reminders result in high no-show rates and administrative overhead.
- Limited integration between patient records, prescriptions, and follow-up care.

## Our Solution

NexClinic automates the appointment lifecycle and clinic management process. It enables:

- Patients to find and book appointments with qualified doctors online.
- Doctors to manage availability, review bookings, and organize patient information.
- Clinics to streamline operations and reduce administrative burden.
- Automated reminders to reduce no-shows and improve patient engagement.

## Project Scope

NexClinic handles core outpatient workflows:

**In Scope:**
- Secure registration and email verification for patients and doctors.
- Doctor directory: search by name, specialization, and availability.
- Appointment booking: view slots, book, reschedule, or cancel.
- Doctor actions: accept, reject, or complete appointments.
- Email reminders and notifications.
- Prescription and medical record storage with secure file uploads.
- Real-time chat consultations between patients and doctors.
- Mock payment gateway integration for in-person appointments and chat bookings.
- Dynamic health news and announcements (via GNews API).
- Admin dashboards for clinic oversight.

**Planned for Future Releases:**
- AI-powered scheduling recommendations.
- Advanced analytics and reporting.

## Technology Stack

NexClinic uses modern, open-source, and widely-supported technologies:

- **Backend**: Python (Django) — robust server logic and REST API.
- **Frontend**: JavaScript/TypeScript (Next.js) — responsive, user-friendly web interface.
- **Database**: PostgreSQL (production) / SQLite (local development) — reliable data storage.
- **Hosting**: Cloud services (Vercel for frontend, Render/Heroku for backend) — scalable and secure.
- **Authentication**: Email + OTP verification — secure, user-friendly access.

## Key Features

### For Patients
✓ Create and verify account with email  
✓ Search for doctors by name and specialization  
✓ View availability and consultation fees  
✓ Book, reschedule, and cancel appointments  
✓ Pay for consultations using an integrated mock payment gateway  
✓ Receive email reminders before appointments  
✓ Securely store and access medical records  
✓ View complete appointment history  
✓ Chat with doctors for medical advice  
✓ Stay informed with dynamic health news and announcements  

### For Doctors
✓ Create and manage professional profiles  
✓ Set and update availability slots  
✓ Review and respond to appointment requests  
✓ Accept, reject, reschedule, or complete appointments  
✓ Provide medical advice via real-time chat consultations  
✓ Attach prescriptions and medical notes  
✓ View patient history and records  

### For Administrators
✓ Monitor overall clinic activity  
✓ View patient and doctor statistics  
✓ Manage clinic settings and policies  

## Project Team

**Team Name**: NexAura  
**Course**: CO2060 — Semester 3

- **E/23/076** — M.T. Dineth
- **E/23/266** — H.P.U.A. Perera
- **E/23/336** — S.M.D.S.B. Samarakoon
- **E/23/226** — J.G.G. Methmaka

## Documentation & Setup

**For Everyone:**
- [docs/README.md](docs/README.md) — Complete project description with roadmap and capabilities.

**For Developers:**
- [DEV_GUIDE.md](DEV_GUIDE.md) — Local setup, running the application, and testing.
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) — Deployment and integration with external services.
- [DATABASE_TABLES.txt](DATABASE_TABLES.txt) — Database schema reference.

---

## Technical Reference

The sections below are for developers, architects, and technical stakeholders who need detailed information about the system design.

## 1. System Scope

NexClinic addresses core outpatient workflow needs:

- Role-specific authentication and authorization for PATIENT, DOCTOR, and ADMIN users.
- OTP-gated account activation to ensure verified email ownership before account use.
- Doctor profile and availability management.
- Patient-side doctor discovery and appointment booking with mock payment gateway integration.
- Appointment lifecycle actions (accept, reject, complete, cancel, reschedule).
- Real-time patient-doctor chat consultation threads.
- Dynamic news section fetching up-to-date medical articles using GNews API.
- Frontend route guarding and API proxying with token refresh.

## 2. Architectural Overview

### 2.1 High-Level Components

- Backend API: Django + DRF + SimpleJWT.
- Frontend web app: Next.js App Router + TypeScript + Tailwind.
- Data layer: PostgreSQL (configured via DATABASE_URL; typically Supabase in deployment).
- Hosting model: backend on Render, frontend on Vercel.

### 2.2 Monorepo Layout

```text
e23-co2060-NexClinic/
|- backend/
|  |- main/            # Django project settings and root URL config
|  |- users/           # auth, OTP, user model, activity logging
|  |- doctor/          # doctor profile, slots, appointments, directory
|  |- patient/         # patient profile, booking and cancellation flows
|- frontend/
|  |- src/app/         # App Router pages and API route handlers
|  |- src/lib/         # shared server-side proxy/auth utilities
|  |- src/proxy.ts     # route protection logic (cookie + role checks)
|- docs/
|- README.md
|- DEV_GUIDE.md
```




## 5. End-to-End Request Flow

### 5.1 Patient Registration Flow

1. Frontend posts registration details to /api/auth/register.
2. Backend creates PendingUser and sends OTP email.
3. Frontend posts OTP to /api/auth/verify-otp.
4. Backend atomically creates CustomUser + PatientProfile and deletes pending record.

### 5.2 Doctor Appointment Booking Flow

1. Doctor creates appointment slots.
2. Patient fetches available slots (optionally by doctor/date filters).
3. Patient books a slot; backend creates Appointment with PENDING status.
4. Doctor accepts/rejects/completes/cancels or reschedules according to state rules.

## 6. Security and Reliability Notes

Current strengths:

- JWT + refresh token rotation.
- OTP activation before account usability.
- Role-based backend access checks on protected flows.
- HTTP-only auth cookies in frontend proxy.
- Transactional user/profile creation on OTP verification.

Operational assumptions:

- PostgreSQL connection is provided by DATABASE_URL.
- Email credentials are valid so OTP delivery can complete registration.
- CORS allowed origins are explicitly configured for deployed frontend domains.

## 7. Known Limitations and Improvement Opportunities

- Video consultation capabilities are yet to be implemented.
- Mock payment gateway is used instead of a real payment processor (e.g., Stripe, PayPal).
- Some profile responses still return static/default fallback values when optional data is missing.
- Frontend and backend route coverage should be validated in CI with integration tests.
- Observability can be extended by wiring UserActivityLog to analytics dashboards.

## 8. Documentation Index

- System architecture and behavior: this file.
- Setup and development workflows: [DEV_GUIDE.md](DEV_GUIDE.md).
- Integration notes: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).
- Table-level data reference: [DATABASE_TABLES.txt](DATABASE_TABLES.txt).
