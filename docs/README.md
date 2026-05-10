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
4. [Data, Storage & Security](#data-storage--security)
5. [Testing & Quality Assurance](#testing--quality-assurance)
6. [Roadmap & Planned Enhancements](#roadmap--planned-enhancements)
7. [Links](#links)

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


## Roadmap & Planned Enhancements

The product vision is a single, cohesive platform that grows beyond booking into a full clinic operations suite. Planned enhancements include:

- Doctor verification workflows and credential management.
- Prescription lifecycle: create, attach, and notify; support reminders and refill workflows.
- Secure file storage and patient record management with role-limited access.
- Real-time chat interfaces for remote consultations.
- Payment gateway integration for paid consultations, invoices, and billing reports.
- AI-assistance for users.
- Provider reviews, dashboards, analytics, and admin tooling for operational insights.

These features are organized as incremental capabilities that plugin to the core APIs and data models, keeping the overall product cohesive rather than split into disjoint releases.

## Links

- [Project Repository](https://github.com/cepdnaclk/e23-co2060-NexClinic)
- [Project Page](https://cepdnaclk.github.io/e23-co2060-NexClinic/)
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)

[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)