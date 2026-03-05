# NexAura Project 1 - Updated Developer Guide

This document reflects the current state of the repository and is intended for local development onboarding.

## 1. Project Overview

NexAura is a full-stack health platform with:
- Backend: Django + Django REST Framework + JWT auth + OTP-based registration verification.
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS.
- Auth model: Role-based users (`PATIENT`, `DOCTOR`, `ADMIN`) with protected frontend routes.

## 2. Current Repository Structure

```text
Nexaura-project1/
|- backend/
|  |- manage.py
|  |- requirements.txt
|  |- main/
|  |  |- settings.py
|  |  |- urls.py
|  |- users/
|  |  |- models.py
|  |  |- serializers.py
|  |  |- views.py
|  |  |- urls.py
|  |- doctor/
|  |  |- models.py
|  |  |- views.py
|  |  |- urls.py
|  |- patient/
|  |  |- models.py
|  |- ai/
|- frontend/
|  |- package.json
|  |- .env.example
|  |- src/
|  |  |- app/
|  |  |  |- (auth)/
|  |  |  |  |- login/page.tsx
|  |  |  |  |- register/page.tsx
|  |  |  |  |- doctor/login/
|  |  |  |  |- doctor/register/
|  |  |  |  |- verify-otp/page.tsx
|  |  |  |- (protected)/
|  |  |  |  |- user-self/
|  |  |  |  |- doctor-self/
|  |  |  |  |- admin/
|  |  |  |- api/
|  |  |  |  |- auth/
|  |  |  |  |  |- route.ts
|  |  |  |  |  |- login/route.ts
|  |  |  |  |  |- register/route.ts
|  |  |  |  |  |- doctor/login/route.ts
|  |  |  |  |  |- doctor/register/route.ts
|  |  |  |  |  |- verify-otp/route.ts
|  |  |  |  |  |- resend-otp/route.ts
|  |  |  |  |  |- logout/route.ts
|  |  |  |  |- doctor/
|  |  |- components/
|  |  |  |- user/
|  |  |  |- doctor/
|  |  |  |- buttons/
|  |  |  |- HomePage/
|  |  |- proxy.ts
|- docs/
|- DATABASE_TABLES.txt
|- README.md
|- README_2.md
```

## 3. Backend API Structure

Base backend URL (local): `http://localhost:8000`

Base API prefixes from `backend/main/urls.py`:
- `/api/users/`
- `/api/doctor/`

### 3.1 User/Auth Endpoints (`/api/users/`)

From `backend/users/urls.py`:
- `POST /api/users/register/` -> Patient registration (creates pending account + OTP email)
- `POST /api/users/login/` -> Patient login (JWT)
- `POST /api/users/doctor/register/` -> Doctor registration (creates pending account + OTP email)
- `POST /api/users/doctor/login/` -> Doctor login (JWT)
- `POST /api/users/verify-otp/` -> Activates pending account
- `POST /api/users/resend-otp/` -> Resends OTP
- `POST /api/users/token/refresh/` -> JWT token refresh

### 3.2 Doctor Endpoints (`/api/doctor/`)

From `backend/doctor/urls.py`:
- `GET /api/doctor/dashboard/`
- `GET/PUT /api/doctor/profile/`

## 4. Frontend API Proxy Layer (Next.js Route Handlers)

Base frontend URL (local): `http://localhost:3000`

Frontend route handlers under `frontend/src/app/api` proxy requests to Django using:
- `NEXT_PUBLIC_BACKEND_URL` (defaults to `http://localhost:8000`)

Auth proxies:
- `POST /api/auth/login` -> backend patient login
- `POST /api/auth/register` -> backend patient register
- `POST /api/auth/doctor/login` -> backend doctor login
- `POST /api/auth/doctor/register` -> backend doctor register
- `POST /api/auth/verify-otp` -> backend verify OTP
- `POST /api/auth/resend-otp` -> backend resend OTP

Protected route enforcement:
- File: `frontend/src/proxy.ts`
- Guarded paths:
  - `/user-self/*` requires `userRole=PATIENT`
  - `/doctor-self/*` requires `userRole=DOCTOR`
  - `/admin/*` requires `userRole=ADMIN`

## 5. Database Structure (Current Implemented Models)

Custom auth user model is enabled:
- `AUTH_USER_MODEL = users.CustomUser`

### 5.1 Core Tables

1. `users_customuser`
- Purpose: Main login identity and role owner.
- Important fields:
  - `id` (PK)
  - `email` (unique, used as username)
  - `username` (optional)
  - `role` (`ADMIN`, `PATIENT`, `DOCTOR`)
  - `is_active`, `is_staff`, `is_superuser`
  - `date_joined`, `last_login`, `password`

2. `users_pendinguser`
- Purpose: Temporary registration storage before OTP verification.
- Important fields:
  - `id` (PK)
  - `email` (unique)
  - `otp_code`
  - `password` (hashed)
  - `role`
  - `profile_data` (JSON)
  - `created_at`, `expires_at`

3. `patient_patientprofile`
- Purpose: Extended profile for patient users.
- Important fields:
  - `id` (PK)
  - `user` (OneToOne -> `users_customuser`)
  - `full_name`, `date_of_birth`, `gender`
  - `phone`, `address`, `medical_history`

4. `doctor_doctorprofile`
- Purpose: Extended profile for doctor users.
- Important fields:
  - `id` (PK)
  - `user` (OneToOne -> `users_customuser`)
  - `specialization`, `license_number`, `phone`
  - `full_name`, `preferred_name`, `nic_number`
  - `is_verified`

### 5.2 Relationship Summary

- One `users_customuser` can have either:
  - one `patient_patientprofile`, or
  - one `doctor_doctorprofile`
- `users_pendinguser` is temporary and deleted after OTP verification.

### 5.3 Django Default Tables

Django also creates default framework tables (migrations, sessions, admin logs, permissions, content types, etc.), such as:
- `django_migrations`
- `django_session`
- `django_admin_log`
- `auth_group`
- `auth_permission`
- `django_content_type`

## 6. Local Development Setup

## 6.1 Prerequisites

Install:
- Python 3.12+ recommended
- Node.js 18+ (Node 20 LTS recommended)
- npm
- PostgreSQL (if using default backend DB settings)

## 6.2 Backend Setup (Django)

From repo root:

```bash
cd backend
python -m venv .venv
```

Activate virtual environment:

Windows (PowerShell):
```bash
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Apply migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Run backend server:

```bash
python manage.py runserver
```

Backend runs at `http://localhost:8000`.

## 6.3 Backend Environment Notes

Current `settings.py` supports two DB modes:

1. `DATABASE_URL` provided:
- Uses PostgreSQL parsed from URL (Supabase-compatible)

2. `DATABASE_URL` not provided:
- Uses fallback DB env values (`DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`)

Example local DB environment values:

```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=nexclinic
DB_USER=nexaura
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

Optional for Supabase/Postgres SSL:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
DB_SSLMODE=require
```

## 6.4 Frontend Setup (Next.js)

From repo root:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` (or copy from `.env.example`):

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Run frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

## 6.5 Run Both Services

Use two terminals:

Terminal 1:
- Run Django server (`backend`)

Terminal 2:
- Run Next.js server (`frontend`)

## 7. End-to-End Auth Test Flow

1. General user (patient) registration:
- Open `http://localhost:3000/register`
- Submit form
- You should be redirected to `/verify-otp?email=...`

2. Doctor registration:
- Open `http://localhost:3000/doctor/register`
- Submit form
- You should be redirected to OTP verify page

3. OTP verification:
- Open `http://localhost:3000/verify-otp`
- Enter email + OTP

4. General user (Patient) login:
- Open `http://localhost:3000/login`
- On success -> `/user-self/dashboard`

5. Doctor login:
- Open `http://localhost:3000/doctor/login`
- On success -> `/doctor-self/dashboard`

## 8. Admin User Creation

Create a Django admin account:

```bash
cd backend
python manage.py createsuperuser
```

Then login to Django admin:
- `http://localhost:8000/admin/`

If needed, assign role `ADMIN` to the same user in admin panel or shell.

## 9. Troubleshooting

1. Frontend cannot reach backend:
- Check `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local`
- Ensure backend is running on `:8000`
- Ensure CORS allows `http://localhost:3000`

2. Login returns unauthorized:
- Ensure account is OTP-verified first
- Ensure password is correct
- Check backend logs for JWT errors

3. Redirect loop to login on protected page:
- Ensure login route sets both cookies:
  - `authToken`
  - `userRole`
- Ensure role matches protected path (`PATIENT` vs `DOCTOR`)

4. Migrations issues:
- Confirm DB credentials and server status
- Re-run `python manage.py migrate`

5. Email/OTP not sending:
- Verify SMTP credentials in `backend/main/settings.py`
- For production, move sensitive values to environment variables

## 10. Important Security Note

Current backend settings file contains hardcoded sensitive values (for example email credentials and secret key). Move these into environment variables before deployment.
