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
- E/23/226, J.G.G. Methmaka, [email](e23226@eng.pdn.ac.lk)
- E/23/266, H.P.U.A. Perera, [email](e23266@eng.pdn.ac.lk)
- E/23/336, S.M.D.S.B. Samarakoon, [email](e23336@eng.pdn.ac.lk)

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

NexClinic is a unified healthcare appointment and clinic practice management platform that digitizes and streamlines end-to-end outpatient workflows for Patients, Doctors, and Hospital Administrators. The platform addresses operational inefficiencies by offering secure registration, real-time doctor discovery, dynamic slot management, patient booking, and controlled appointment lifecycles.

Built with a modular, API-first approach, NexClinic bridges the gap between medical practitioners and patients while granting administrative oversight to ensure smooth clinical operations.

## Key Capabilities

**For Patients:**
- **Doctor Discovery:** Search and filter doctors by name, specialization, and real-time availability.
- **Dynamic Booking:** Instantly book, reschedule, or cancel appointments through an optimistic UI.
- **Medical Records:** Securely upload, store, and manage profile pictures and medical documents.
- **Teleconsultations & Payments:** Real-time patient-doctor chat consultations with mock payment gateway integration.
- **Health News:** Dynamic health news fetching via GNews API to keep patients informed.

**For Doctors:**
- **Schedule Management:** Generate and publish availability slots seamlessly.
- **Appointment Lifecycle:** Enforce state transitions (PENDING → ACCEPTED/REJECTED → COMPLETED/CANCELLED).
- **Patient Insights:** View patient medical history, consultations, and securely attached records.

**For Hospital Administrators:**
- **User Management:** Manage patient and doctor accounts, and handle scheduling conflicts.
- **System Configuration:** Oversee clinic policies, system settings, and overarching configuration.
- **System Analytics:** Monitor overall system performance, analytics, and operational activity.

## Solution Architecture

Our architecture guarantees scalability, fast rendering, and strict security:

- **Backend:** Python + Django REST Framework (DRF). Manages business rules, transactional database operations, multipart file uploads, and background tasks.
- **Frontend:** Next.js App Router (TypeScript + Tailwind CSS). Provides a highly reactive UI with optimistic state synchronization (Zustand/Context). Server-side proxy routing centralizes authentication and enforces role boundaries.
- **Data & Storage:** PostgreSQL for production-grade relational integrity, with native media storage capabilities for medical files and profile imagery.
- **Deployment:** The backend is configured for PaaS deployment (Render/Heroku), while the Next.js frontend is optimized for edge networks (Vercel).

**High-level Request Flow:**
1. A user interacts with the Next.js frontend.
2. The Next.js Edge Middleware (`proxy.ts`) intercepts the request, verifying HttpOnly auth cookies and validating the user's Role-Based Access Control (RBAC).
3. Authorized requests are proxied to the Django backend.
4. Django enforces final business rules and permissions (`IsPatient`, `IsDoctor`, `IsAdmin`), updates the PostgreSQL database, and responds.

## Data, Storage & Security

Security and data integrity are central to NexClinic's design:

- **Two-Tier RBAC:** Strict Role-Based Access Control enforced at both the Next.js frontend middleware and the Django backend API.
- **HttpOnly JWTs:** Authentication tokens (access/refresh) are handled strictly via HttpOnly, Secure cookies to completely mitigate Cross-Site Scripting (XSS) session hijacking.
- **OTP Verification:** Email-gated OTP verification ensures account ownership before system access is granted.
- **Secure File Uploads:** Multipart Form-Data parsing guarantees that medical records and profile pictures are safely transferred and stored on the server without CORS or boundary corruption.

## Testing & Quality Assurance

To ensure stability across devices and roles, we implemented a rigorous, multi-layered testing strategy:

- **Automated End-to-End (E2E) Testing:** Playwright is utilized to run automated cross-browser tests (Desktop Chromium, Microsoft Edge, and Mobile Chrome profiles), validating complex UI workflows like profile uploads and authentication state management.
- **Backend API Testing:** Django's native test suite is used to validate serializer integrity, prevent malformed data entry, and confirm appropriate error handling (400, 401, 403, 404).
- **Manual QA & Edge Cases:** Routine checks for UI reactivity, optimistic state updates (preventing double-bookings), and network latency simulations.

## Roadmap & Planned Enhancements

NexClinic is built as a cohesive foundation designed to grow. Future iterations aim to implement:

- **Advanced AI Integration:** AI-powered scheduling recommendations based on clinic traffic and patient symptoms.
- **Real-Time Video Consultations:** Upgrading the chat consultation feature to include WebRTC video capabilities.
- **Production Payment Processors:** Transitioning from the mock payment gateway to live integrations with Stripe or PayPal.
- **Deep Analytics Dashboards:** Implementing robust data visualization for Hospital Administrators to predict clinic bottlenecks.

## Links

- [Project Repository](https://github.com/cepdnaclk/e23-co2060-NexClinic)
- [Project Page](https://cepdnaclk.github.io/e23-co2060-NexClinic/)
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)

[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)