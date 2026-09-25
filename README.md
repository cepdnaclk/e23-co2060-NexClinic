# NexClinic by NexAura

NexClinic is an advanced, full-stack clinic management platform designed to connect patients with doctors through a secure, highly-responsive digital ecosystem. 

Built with scalability, security, and user-experience in mind, NexClinic automates the entire appointment lifecycle for modern healthcare facilities.

## Quick Overview

This README provides a high-level overview of the project architecture and capabilities. For technical setup, deployment guidelines, and API integration, please refer to:
- [DEV_GUIDE.md](DEV_GUIDE.md) — Local setup and development workflows.
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) — Architecture, API flows, and security mechanics.

---

## Table of Contents
1. [The Problem](#the-problem)
2. [Our Solution](#our-solution)
3. [Technology Stack](#technology-stack)
4. [Key Features](#key-features)
5. [Security & Architecture](#security--architecture)
6. [Project Team](#project-team)

---

## The Problem

Outpatient centers and modern clinics often struggle with fragmented operational workflows:
- Patients lack transparent, real-time access to doctor availability and scheduling.
- Manual booking processes inevitably lead to scheduling conflicts, high no-show rates, and administrative fatigue.
- Medical practitioners lack a unified dashboard to manage their appointments, patient history, and direct consultations securely.

## Our Solution

NexClinic digitizes and unifies these workflows into a single, intuitive web application:
- **Patients** can seamlessly discover doctors, view real-time availability, manage their medical records, and book appointments.
- **Doctors** maintain full control over their schedules, reviewing and managing appointments, and consulting with patients directly.
- **Administrators** gain a bird's-eye view of clinic operations.
- **Automated Systems** handle notifications, reminders, and strict access controls to ensure data integrity and security.

---

## Technology Stack

NexClinic is engineered using a robust, modern technology stack ensuring high performance and security:

- **Frontend**: JavaScript/TypeScript with **Next.js (App Router)** & Tailwind CSS — Delivering a highly responsive, optimistic UI.
- **Backend**: Python with **Django REST Framework (DRF)** — Providing a robust, transactional API layer.
- **Database**: PostgreSQL (Production/Supabase) / SQLite (Local) — Ensuring reliable, relational data integrity.
- **Testing**: Playwright for cross-browser End-to-End (E2E) UI testing, and Django's native suite for API unit testing.
- **Authentication**: JWT secured strictly via HttpOnly Cookies, paired with OTP email verification.

---

#
---

## Security & Architecture

NexClinic was built with strict adherence to modern security paradigms:
- **Two-Tier RBAC:** Strict Role-Based Access Control enforced at the Next.js edge (Middleware) and the Django Backend (Permission Classes).
- **HttpOnly JWTs:** Complete mitigation of XSS session hijacking by utilizing HttpOnly, Secure cookies for all authentication tokens.
- **Optimistic State Sync:** UI state is managed via React Context/Zustand, ensuring the interface is instantly reactive while background re-fetches guarantee database synchronization.
- **Automated E2E Testing:** Critical user journeys are rigorously verified across Chromium, Edge, and Mobile Chrome environments to ensure cross-device reliability.

---

# Key Features

### For Patients
- ✓ **Unified Dashboard:** Secure, token-based session management.
- ✓ **Doctor Discovery:** Search and filter by name, specialization, and real-time availability.

- ✓ **Dynamic Booking:** Instantly book, reschedule, or cancel appointments.
- ✓ **Medical Records:** Securely upload, store, and manage profile pictures and medical documents.
- ✓ **Health News:** Stay informed with dynamic health news.


### For Doctors
- ✓ **Schedule Management:** Generate and publish availability slots seamlessly.
- ✓ **Appointment Lifecycle:** Accept, reject, or mark appointments as completed.
- ✓ **Patient Insights:** View patient medical history and consultation records in real-time.
- ✓ **Secure Profiles:** Maintain professional profiles verified by administrative oversight.


### For Hospital Administrators
- ✓ **Clinic Oversight:** Monitor overall system activity and manage overarching clinic policies.
- ✓ **User Management:** Manage patient and doctor accounts and handle schedules.
- ✓ **System Configuration:** Manage system settings and configurations.
- ✓ **Appointments Handling:** Handle overall medical appointments and cancellations.
- ✓ **System Analytics:** Monitor overall system performance and analytics.


# Project Team

**Team Name**: NexAura  

**Course**: CO2060 — Semester


- **E/23/076** — M.T. Dineth            - e23076@eng.pdn.ac.lk
- **E/23/226** — J.G.G. Methmaka        - e23226@eng.pdn.ac.lk
- **E/23/266** — H.P.U.A. Perera        - e23266@eng.pdn.ac.lk
- **E/23/336** — S.M.D.S.B. Samarakoon  - e23336@eng.pdn.ac.lk