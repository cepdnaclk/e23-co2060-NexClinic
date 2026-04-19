# NexClinic by NexAura

NexClinic is a full-stack healthcare platform with role-aware user journeys for patients, doctors, and administrators.

This README is a system analysis and architecture reference.
For setup, local development, and deployment procedures, use [DEV_GUIDE.md](DEV_GUIDE.md).

## 1. System Scope

NexClinic addresses core outpatient workflow needs:

- Role-specific authentication and authorization for PATIENT, DOCTOR, and ADMIN users.
- OTP-gated account activation to ensure verified email ownership before account use.
- Doctor profile and availability management.
- Patient-side doctor discovery and appointment booking.
- Appointment lifecycle actions (accept, reject, complete, cancel, reschedule).
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

## 3. Backend Analysis

### 3.1 Identity and Access Model

The backend uses a custom user model (email as username field) with role values:

- ADMIN
- PATIENT
- DOCTOR

Authentication is JWT-based:

- Access token lifetime: 5 minutes.
- Refresh token lifetime: 20 minutes.
- Refresh token rotation enabled.
- Blacklist after rotation enabled.

### 3.2 Registration and OTP Verification Design

NexClinic uses a two-stage registration flow:

1. Registration writes to a pending registration store (PendingUser) with hashed password and profile payload.
2. OTP verification promotes the pending record into the real user + profile tables in a single transaction.

Strengths of this approach:

- Unverified accounts do not become active users.
- Profile creation is atomic with user activation.
- OTP resend lifecycle is cleanly supported.

### 3.3 Core Domain Entities

- CustomUser: primary identity, role, and auth flags.
- PendingUser: temporary pre-verification registration record.
- PatientProfile: demographic and contact information for patients.
- DoctorProfile: professional identity, specialization, pricing, and visibility metadata.
- AppointmentAvailableSlot: concrete date/time slots for in-person bookings.
- DoctorOnlineAdviceAvailability: day/time windows for online advisory availability.
- Appointment: patient booking linked one-to-one with an appointment slot.

Important integrity constraints:

- One appointment per appointment slot (OneToOne relationship).
- Unique doctor slot windows per date/time combination.
- Validation that appointment.doctor matches slot.doctor.

### 3.4 Appointment Lifecycle Rules

Appointment status model:

- PENDING
- ACCEPTED
- REJECTED
- COMPLETED
- CANCELLED

Allowed transitions (doctor actions):

- accept: PENDING -> ACCEPTED
- reject: PENDING -> REJECTED
- complete: ACCEPTED -> COMPLETED
- cancel: PENDING or ACCEPTED -> CANCELLED

Patient cancellation:

- Allowed only when appointment is PENDING or ACCEPTED.

Rescheduling constraints:

- Disallowed for REJECTED, COMPLETED, and CANCELLED appointments.
- Target slot must exist, belong to the same doctor, and be unbooked.

### 3.5 Slot Management Logic

Doctor slot creation and updates enforce non-overlap rules:

- Bulk create is rejected if any submitted interval conflicts with existing intervals.
- Update operations validate time ordering and overlap prevention.
- Online advice slots use the same overlap strategy on weekday windows.

### 3.6 Backend API Surface

Base prefixes:

- /api/users/
- /api/doctor/
- /api/patient/

Users/auth endpoints:

- POST /api/users/register/
- POST /api/users/login/
- POST /api/users/doctor/register/
- POST /api/users/doctor/login/
- POST /api/users/verify-otp/
- POST /api/users/resend-otp/
- POST /api/users/token/refresh/
- POST /api/users/logout/

Doctor endpoints:

- GET /api/doctor/specializations/
- GET /api/doctor/directory/
- GET /api/doctor/directory/{doctor_id}/
- GET /api/doctor/dashboard/
- GET/PATCH /api/doctor/profile/
- GET /api/doctor/appointments/
- PATCH /api/doctor/appointments/{appointment_id}/action/
- PATCH /api/doctor/appointments/{appointment_id}/reschedule/
- GET/POST /api/doctor/appointment-slots/
- PATCH/DELETE /api/doctor/appointment-slots/{slot_id}/
- GET/POST /api/doctor/online-advice-slots/
- PATCH/DELETE /api/doctor/online-advice-slots/{slot_id}/

Patient endpoints:

- GET /api/patient/profile/
- GET/POST /api/patient/appointments/
- PATCH /api/patient/appointments/{appointment_id}/cancel/
- GET /api/patient/appointment-slots/

## 4. Frontend Analysis

### 4.1 Application Pattern

The frontend is structured as a Next.js App Router application with server route handlers under /api that proxy to Django.

This gives the project:

- A single frontend-origin API surface for browser clients.
- HTTP-only auth cookies managed on the server layer.
- Centralized token refresh handling through shared proxy logic.

### 4.2 Auth and Cookie Strategy

The frontend stores these auth cookies:

- authToken
- refreshToken
- userRole

Cookie behavior:

- httpOnly enabled.
- sameSite=lax.
- secure in production mode.

If a backend call returns 401, the proxy utility attempts refresh via /api/users/token/refresh/ and retries the original call.
If refresh fails, auth cookies are cleared and 401 is returned.

### 4.3 Route Protection

Route protection is implemented in [frontend/src/proxy.ts](frontend/src/proxy.ts):

- /doctor-self/* requires DOCTOR.
- /user-self/* requires PATIENT.
- /admin/* requires ADMIN.
- /doctors/* requires authenticated role in {DOCTOR, PATIENT, ADMIN}.

Protection includes token expiry checks by decoding JWT expiry values server-side.

### 4.4 Frontend API Proxy Surface

Frontend route handlers mirror backend domains:

- /api/auth/*
- /api/doctor/*
- /api/patient/*

This keeps browser-facing API shape stable even if backend hostnames change by environment.

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

- Chat capability is currently a placeholder in dashboard payloads.
- Some profile responses still return static/default fallback values when optional data is missing.
- Frontend and backend route coverage should be validated in CI with integration tests.
- Observability can be extended by wiring UserActivityLog to analytics dashboards.

## 8. Documentation Index

- System architecture and behavior: this file.
- Setup and development workflows: [DEV_GUIDE.md](DEV_GUIDE.md).
- Integration notes: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).
- Table-level data reference: [DATABASE_TABLES.txt](DATABASE_TABLES.txt).
