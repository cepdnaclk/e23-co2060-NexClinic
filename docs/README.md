---
layout: home
permalink: index.html

repository-name: e23-co2060-NexClinic
title: NexClinic
---

[comment]: # "NexClinic project documentation page for the e23-co2060-NexClinic repository"

<!--
This documentation page follows the department template. Replace supervisor emails and add `/docs/data/index.json` and images
(`cover_page.jpg`, `thumbnail.jpg`) when ready — cover: 940×352, thumbnail: 640×360.
-->

# NexClinic by NexAura

---

## Team
- E/23/076, M.T. Dineth, [email](e23076@eng.pdn.ac.lk)
- E/23/266, H.P.U.A. Perera, [email](e23266@eng.pdn.ac.lk)
- E/23/336, S.M.D.S.B. Samarakoon, [email](e23336@eng.pdn.ac.lk)
- E/23/226, J.G.G. Methmaka, [email](e23226@eng.pdn.ac.lk)

<!-- Add a project cover image in /docs/data if available -->

#### Table of Contents
1. [Project Overview](#project-overview)
2. [Key Capabilities](#key-capabilities)
3. [Solution Architecture](#solution-architecture)
4. [Backend Design](#backend-design)
5. [Frontend Design](#frontend-design)
6. [Data, Storage & Security](#data-storage--security)
7. [Testing & Quality Assurance](#testing--quality-assurance)
8. [Development & Deployment](#development--deployment)
9. [Roadmap & Planned Enhancements](#roadmap--planned-enhancements)
10. [Links](#links)

## Project Overview

NexClinic is a unified healthcare appointment and clinic practice management platform that provides end-to-end outpatient workflows for Patients, Doctors, and Administrators. The platform supports secure registration and verification, doctor discovery, availability and slot management, patient booking, and controlled appointment lifecycles with auditability and notifications.

The product is intentionally API-first and modular so clinics can adopt individual capabilities (booking, reminders, teleconsultation, payments, analytics) as needed.

## Key Capabilities

- Role-based identity: PATIENT / DOCTOR / ADMIN with OTP-gated verification and JWT access/refresh tokens.
- Doctor directory: specializations, fees, profiles, availability windows and verification metadata.
- Appointment engine: create slots, search availability, book slots (one appointment per slot), and enforce lifecycle transitions (PENDING → ACCEPTED/REJECTED → COMPLETED/CANCELLED).
- Patient experience: search & filter doctors, book/reschedule/cancel, view history and prescriptions.
- Notifications: OTP, booking confirmations, reminders, status updates via email and in-app notifications.
- Secure attachments: upload prescriptions and reports with access-control and optional external storage.
- Extensible APIs: designed for integrations with payments, AI services, SSO (Google), and analytics.

## Solution Architecture

Architecture components:

- Backend: Django + Django REST Framework (DRF). Business rules, transactional operations, email delivery, and background jobs live here.
- Frontend: Next.js App Router (TypeScript + Tailwind). Server-side proxy routes centralize auth and simplify client logic.
- Storage: relational DB (SQLite for local dev, PostgreSQL for production) and object storage for files.
- Deployment: backend on a typical PaaS (Render/Heroku), frontend on Vercel; environment variables drive configuration.

High-level request flow:

1. User interaction on frontend → server-side proxy.
2. Proxy validates cookies or refreshes tokens and forwards to backend API.
3. Backend enforces business rules, updates DB/storage, and returns results.

This pattern keeps tokens out of client-accessible JavaScript and provides a single origin for browser requests.

## Backend Design

Core backend design elements:

- Data model:
	- `CustomUser` with `role`, `email` as username, and auth flags.
	- `PendingUser` for unverified registrations (stores payload until OTP confirmation).
	- `PatientProfile` and `DoctorProfile` for domain-specific data.
	- `AppointmentAvailableSlot` and `Appointment` models to enforce uniqueness and non-overlap constraints.

- Registration & OTP flow:
	- Registration creates `PendingUser` and triggers OTP email.
	- OTP verification atomically creates `CustomUser` and profile, removing the pending record upon success.

- Authentication:
	- Short-lived access tokens, refresh token rotation and server-side blacklist to mitigate token reuse.

- Business rules:
	- Slot creation/upsert rejects overlapping intervals.
	- Appointment actions (accept/reject/complete/cancel/reschedule) validated against current state and ownership.

- API endpoints (representative):
	- `/api/users/register/`, `/api/users/verify-otp/`, `/api/users/token/refresh/`.
	- `/api/doctor/appointment-slots/`, `/api/doctor/appointments/`, `/api/doctor/profile/`.
	- `/api/patient/appointments/`, `/api/patient/appointment-slots/`, `/api/patient/profile/`.

Refer to the repository `README.md` for a comprehensive API surface overview.

## Frontend Design

Frontend patterns and responsibilities:

- Next.js App Router with server components and server-side route handlers under `/api/`.
- Server-side proxy handles cookie auth (`authToken`, `refreshToken`, `userRole`) and attempts a refresh on 401 responses before returning an error to the browser.
- Route protection enforced at server render time and reinforced on the client for UI-level access control.
- Pages include role-specific dashboards, slot creation UIs (for doctors), booking flows (for patients), and admin views.

This architecture centralizes auth logic and allows the frontend to remain focused on UX and presentation.

## Data, Storage & Security

- Database: use PostgreSQL in production for reliability and concurrency; SQLite is supported for local development.
- Files: prescription and report attachments should be stored in secure object storage (S3 or equivalent) with signed URLs for access.
- Security practices implemented:
	- OTP-based account activation to verify email ownership.
	- HTTP-only cookies and sameSite settings to reduce XSS/CSRF exposure.
	- JWT refresh rotation and blacklist to mitigate token replay.
	- Role-based permission checks at the API layer.

Follow `DEV_GUIDE.md` for environment variables and how to configure email providers and storage backends.

## Testing & Quality Assurance

Testing strategy:

- Unit tests: business logic validation for appointment lifecycle, slot overlap, and registration flows.
- Integration tests: endpoint-level tests including permission checks and transactional integrity.
- Manual E2E: routine checks for registration → booking → doctor action flows.
- Security checks: targeted tests for auth flows and file access controls.

Run tests locally with commands in `DEV_GUIDE.md`; use CI to run the same suites on pull requests.

## Development & Deployment

Local development quickstart (examples):

```powershell
# Activate Python virtualenv (Windows PowerShell)
& "nexclinic-venv\Scripts\Activate.ps1"
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend in another terminal
cd frontend
npm install
npm run dev
```

Deployment checklist:

- Use PostgreSQL and a managed object storage for production.
- Configure SMTP / transactional email provider for OTP delivery.
- Set `DEBUG=False`, rotate `SECRET_KEY`, and ensure TLS termination at the edge.
- Configure CI/CD to run tests, linting, and deploy on merge to `main`.

## Roadmap & Planned Enhancements

The product vision is a single, cohesive platform that grows beyond booking into a full clinic operations suite. Planned enhancements include:

- Doctor verification workflows and credential management.
- Prescription lifecycle: create, attach, and notify; support reminders and refill workflows.
- Secure file storage and patient record management with role-limited access.
- Real-time chat and teleconsultation interfaces for remote consultations.
- Payment gateway integration for paid consultations, invoices, and billing reports.
- AI-assisted scheduling and recommendation engines to optimize slot utilization.
- Provider reviews, dashboards, analytics, and admin tooling for operational insights.

These features are organized as incremental capabilities that plugin to the core APIs and data models, keeping the overall product cohesive rather than split into disjoint releases.

## Links

- Repository root: [README.md](../README.md)
- Development guide: [DEV_GUIDE.md](../DEV_GUIDE.md)
- Integration notes: [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)
- Database schema reference: [DATABASE_TABLES.txt](../DATABASE_TABLES.txt)

[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)