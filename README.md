# NexAura Medical System

Complete developer and deployment guide for the NexAura medical platform.

This project includes:
- Backend: Django + DRF + JWT + OTP verification.
- Frontend: Next.js App Router + TypeScript + Tailwind.
- Database: Supabase PostgreSQL.
- Hosting: Backend on Render, Frontend on Vercel.

## 1. System Overview

NexAura is a role-based medical system with three roles:
- PATIENT
- DOCTOR
- ADMIN

Implemented core modules:
- OTP-based registration and account activation.
- Role-based login with JWT.
- Doctor and patient profile management.
- Appointment and slot management (doctor and patient flows).
- Protected frontend routes with middleware-like route guard logic.

## 2. Tech Stack

Backend:
- Django 6
- Django REST Framework
- SimpleJWT
- django-cors-headers
- psycopg2-binary
- python-dotenv
- gunicorn
- whitenoise

Frontend:
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

Database:
- Supabase PostgreSQL

## 3. Repository Structure

```text
e23-co2060-NexClinic/
|- backend/
|  |- manage.py
|  |- requirements.txt
|  |- build.sh
|  |- .env
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
|  |  |- views.py
|  |  |- urls.py
|  |- ai/
|- frontend/
|  |- package.json
|  |- .env.local
|  |- src/
|  |  |- app/
|  |  |  |- (auth)/
|  |  |  |- (protected)/
|  |  |  |- api/
|  |  |  |  |- auth/
|  |  |  |  |- doctor/
|  |  |  |  |- patient/
|  |  |- components/
|  |  |- proxy.ts
|- docs/
|- DATABASE_TABLES.txt
|- INTEGRATION_GUIDE.md
|- README.md
```

## 4. API Surface Summary

Backend base path prefixes:
- /api/users/
- /api/doctor/
- /api/patient/

Auth endpoints (users app):
- POST /api/users/register/
- POST /api/users/login/
- POST /api/users/doctor/register/
- POST /api/users/doctor/login/
- POST /api/users/verify-otp/
- POST /api/users/resend-otp/
- POST /api/users/token/refresh/

Doctor endpoints (doctor app):
- GET /api/doctor/specializations/
- GET /api/doctor/dashboard/
- GET/PUT /api/doctor/profile/
- GET /api/doctor/appointments/
- POST /api/doctor/appointments/{appointment_id}/action/
- POST /api/doctor/appointments/{appointment_id}/reschedule/
- GET/POST /api/doctor/appointment-slots/
- GET/PUT/DELETE /api/doctor/appointment-slots/{slot_id}/
- GET/POST /api/doctor/online-advice-slots/
- GET/PUT/DELETE /api/doctor/online-advice-slots/{slot_id}/

Patient endpoints (patient app):
- GET/PUT /api/patient/profile/
- GET /api/patient/appointments/
- POST /api/patient/appointments/{appointment_id}/cancel/
- GET /api/patient/appointment-slots/

Frontend proxy API routes (Next.js route handlers):
- /api/auth/*
- /api/doctor/*
- /api/patient/*

Protected route guard:
- frontend/src/proxy.ts
- /doctor-self/* -> requires DOCTOR
- /user-self/* -> requires PATIENT
- /admin/* -> requires ADMIN

## 5. Environment Variables

Quick setup from templates:

Windows PowerShell:

```bash
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

## 5.1 Backend .env (backend/.env)

Required variables:

```env
DJANGO_SECRET_KEY=your-strong-secret-key
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
```

Recommended variables:

```env
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DB_SSLMODE=require

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ALLOW_CREDENTIALS=True

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
```

Notes:
- Current backend settings require both DJANGO_SECRET_KEY and DATABASE_URL.
- DATABASE_URL is parsed in settings.py and used as the primary database source.
- DB_SSLMODE defaults to require.

## 5.2 Frontend .env.local (frontend/.env.local)

Required variable:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

For production frontend deployment, set this to your Render backend URL, for example:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-service.onrender.com
```

## 6. Local Setup Guide

## 6.1 Prerequisites

Install:
- Python 3.12+
- Node.js 20 LTS
- npm
- Supabase project (or any PostgreSQL instance)

## 6.2 Clone and Open

```bash
git clone <your-repo-url>
cd e23-co2060-NexClinic
```

## 6.3 Backend Local Setup

```bash
cd backend
python -m venv .venv
```

Activate venv:

Windows PowerShell:

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

Create backend .env file (or copy from backend/.env.example):

```bash
# backend/.env
DJANGO_SECRET_KEY=your-strong-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
DB_SSLMODE=require

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ALLOW_CREDENTIALS=True

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
```

Run migrations and server:

```bash
python manage.py migrate
python manage.py runserver
```

Backend URL:
- http://localhost:8000

## 6.4 Frontend Local Setup

From repository root:

```bash
cd frontend
npm install
```

Create frontend .env.local (or copy from frontend/.env.example):

```bash
# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Run frontend:

```bash
npm run dev
```

Frontend URL:
- http://localhost:3000

## 6.5 Local Smoke Test

1. Register patient: /register
2. Register doctor: /doctor/register
3. Verify OTP: /verify-otp
4. Patient login: /login
5. Doctor login: /doctor/login
6. Open protected dashboards and verify role-based redirects

## 6.6 Full Local Setup Commands (Copy-Paste)

Windows PowerShell (from repository root):

```bash
# Backend setup
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py runserver
```

Open a second terminal for frontend:

```bash
Set-Location frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

## 6.7 First-Time Verify Commands

Use these commands after setup to quickly confirm both services are healthy.

Windows PowerShell:

```bash
# Backend health check
Invoke-WebRequest http://localhost:8000/admin/ -UseBasicParsing | Select-Object StatusCode

# Frontend production build check
Set-Location frontend
npm run build

# Quick API check (example: doctor specializations via frontend proxy)
Invoke-WebRequest http://localhost:3000/api/doctor/specializations -UseBasicParsing | Select-Object StatusCode
```

macOS/Linux:

```bash
# Backend health check
curl -I http://localhost:8000/admin/

# Frontend production build check
cd frontend
npm run build

# Quick API check (example: doctor specializations via frontend proxy)
curl -i http://localhost:3000/api/doctor/specializations
```

Expected results:
- Backend health check returns HTTP 200 or HTTP 302.
- Frontend build completes without errors.
- API check returns HTTP 200 (or HTTP 401 for endpoints that require auth).

macOS/Linux (from repository root):

```bash
# Backend setup
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Open a second terminal for frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## 7. Supabase Setup Guide

1. Create a Supabase project.
2. Go to Project Settings -> Database -> Connection string.
3. Copy the URI connection string.
4. Use that URI as DATABASE_URL in backend .env (local) and Render environment variables.
5. Keep DB_SSLMODE=require.
6. Run migrations from backend to create/update tables.

Example:

```env
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DB_SSLMODE=require
```

## 8. Deploy Backend on Render

Create a Web Service in Render:
- Connect your repository.
- Root directory: backend
- Runtime: Python 3

Build command:

```bash
./build.sh
```

Start command:

```bash
gunicorn main.wsgi:application --bind 0.0.0.0:$PORT
```

Set Render environment variables:

```env
DJANGO_SECRET_KEY=your-production-secret
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-backend-service.onrender.com

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
DB_SSLMODE=require

CORS_ALLOWED_ORIGINS=https://your-frontend-project.vercel.app
CORS_ALLOW_CREDENTIALS=True

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
```

After deploy:
- Confirm API health by opening /admin/ or a known endpoint.
- Confirm migrations ran successfully from build logs.

## 9. Deploy Frontend on Vercel

Create/import project in Vercel:
- Framework: Next.js (auto-detected)
- Root directory: frontend

Set Vercel environment variable:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-service.onrender.com
```

Deploy.

After deploy:
- Test login and registration flow.
- Verify browser network calls go to Vercel API routes and proxy to Render backend.

## 9.1 Vercel CLI Commands

If you prefer terminal-based deployment:

```bash
npm install -g vercel
cd frontend
vercel login
vercel link
vercel env add NEXT_PUBLIC_BACKEND_URL production
vercel env add NEXT_PUBLIC_BACKEND_URL preview
vercel
vercel --prod
```

Recommended value for both preview and production env:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-service.onrender.com
```

## 10. Production Integration Checklist

1. Backend deployed and reachable on Render.
2. Supabase DATABASE_URL configured on Render.
3. CORS_ALLOWED_ORIGINS includes Vercel domain.
4. Frontend NEXT_PUBLIC_BACKEND_URL points to Render domain.
5. OTP email credentials are valid in backend env.
6. Role-based redirects work for PATIENT, DOCTOR, ADMIN.

## 11. Admin Setup

Create superuser:

```bash
cd backend
python manage.py createsuperuser
```

Admin URL:
- http://localhost:8000/admin/ (local)
- https://your-backend-service.onrender.com/admin/ (production)

## 12. Troubleshooting

Frontend cannot reach backend:
- Check NEXT_PUBLIC_BACKEND_URL value.
- Confirm backend service is live.

CORS issues:
- Ensure CORS_ALLOWED_ORIGINS contains frontend origin exactly.
- Include protocol (https://).

Database connection issues:
- Verify DATABASE_URL and DB_SSLMODE.
- Ensure Supabase network/credentials are valid.

Build/deploy issues on Render:
- Confirm root directory is backend.
- Confirm start command uses gunicorn main.wsgi:application.

Verify OTP/email failures:
- Confirm EMAIL_HOST_USER and EMAIL_HOST_PASSWORD.
- Use app passwords for Gmail SMTP.

## 13. Security Notes

- Never commit secrets in code or tracked files.
- Keep DJANGO_SECRET_KEY only in environment variables.
- Keep DATABASE_URL and SMTP credentials only in environment variables.
- Use DJANGO_DEBUG=False in production.
