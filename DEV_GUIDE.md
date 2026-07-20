# DEV_GUIDE.md

Developer setup, local workflow, and deployment guide for NexClinic.

## 1. Prerequisites

Install:

- Python 3.12+
- Node.js 20 LTS+
- npm
- PostgreSQL-compatible database (Supabase recommended for team parity)

## 2. Repository Bootstrap

```bash
git clone <your-repo-url>
cd e23-co2060-NexClinic
```

## 3. Environment Files

### 3.1 Backend env file

A template exists at backend/.env.example.

Windows PowerShell:

```bash
Copy-Item backend/.env.example backend/.env
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
```

### 3.2 Frontend env file

There is no committed frontend .env template in this repository.
Create frontend/.env.local manually.

Required values:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## 4. Backend Local Setup

From repository root:

```bash
cd backend
python -m venv .venv
```

Activate virtual environment:

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

Set backend environment values in backend/.env.

Minimum required:

```env
DJANGO_SECRET_KEY=your-strong-secret-key
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
```

Recommended development values:

```env
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DB_SSLMODE=require

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ALLOW_CREDENTIALS=True

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
```

If you want to keep Gmail for local development, set `EMAIL_HOST=smtp.gmail.com` and use the Gmail app password instead.

Run migrations and start backend:

```bash
python manage.py migrate
python manage.py runserver
```

Backend default URL:

- http://localhost:8000

## 5. Frontend Local Setup

From repository root:

```bash
cd frontend
npm install
```

Create frontend/.env.local:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Run dev server:

```bash
npm run dev
```

Frontend default URL:

- http://localhost:3000

## 6. First-Time Verification

### 6.1 Health and build checks

Windows PowerShell:

```bash
Invoke-WebRequest http://localhost:8000/admin/ -UseBasicParsing | Select-Object StatusCode

cd frontend
npm run build

Invoke-WebRequest http://localhost:3000/api/doctor/specializations -UseBasicParsing | Select-Object StatusCode
```

macOS/Linux:

```bash
curl -I http://localhost:8000/admin/

cd frontend
npm run build

curl -i http://localhost:3000/api/doctor/specializations
```

Expected:

- Backend admin check returns 200 or 302.
- Frontend build succeeds.
- Proxy API check returns 200 or an auth-related 401 depending on endpoint protection.

### 6.2 Functional smoke flow

1. Register a patient account.
2. Register a doctor account.
3. Verify OTP for both accounts.
4. Login as patient and doctor.
5. Test protected route redirects and role access.
6. Create slots as doctor and book as patient.

## 7. Daily Development Workflow

### 7.1 Backend workflow

```bash
cd backend
.\.venv\Scripts\Activate.ps1   # Windows
# source .venv/bin/activate       # macOS/Linux
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### 7.2 Frontend workflow

```bash
cd frontend
npm run dev
npm run lint
npm run build
```

### 7.3 Admin user creation

```bash
cd backend
python manage.py createsuperuser
```

## 8. API Development Notes

- Backend URL roots: /api/users/, /api/doctor/, /api/patient/.
- Frontend route handlers under src/app/api proxy to backend.
- Auth cookies are httpOnly and refreshed via /api/users/token/refresh/ through shared proxy utility.
- Role route protection is implemented in src/proxy.ts.

## 9. Database and Supabase

Supabase setup summary:

1. Create a Supabase project.
2. Copy the PostgreSQL connection URI.
3. Set DATABASE_URL in backend/.env (local) and hosting environment.
4. Keep DB_SSLMODE=require for remote TLS.
5. Run migrations from backend.

Example:

```env
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DB_SSLMODE=require
```

## 10. Activity Log Configuration

Activity log behavior is configured in code (not environment variables).

Configuration file:

- backend/users/activity_log_settings.py

What you can tune there:

- ACTIVITY_LOG_ENABLED
- ACTIVITY_LOG_LOG_ALL_VIEWS
- ACTIVITY_LOG_SENSITIVE_KEYS
- ACTIVITY_LOG_EXCLUDED_PATH_PREFIXES
- ACTIVITY_LOG_SENSITIVE_VIEW_PREFIXES
- ACTIVITY_LOG_MAX_STRING_LENGTH
- ACTIVITY_LOG_MAX_LIST_ITEMS
- ACTIVITY_LOG_MAX_DICT_ITEMS
- ACTIVITY_LOG_MAX_PAYLOAD_CHARS
- ACTIVITY_LOG_RETENTION_DAYS

Recommended low-cost defaults for small/free hosting:

- Keep ACTIVITY_LOG_LOG_ALL_VIEWS=False.
- Keep ACTIVITY_LOG_MAX_PAYLOAD_CHARS at 2000-4000.
- Keep ACTIVITY_LOG_RETENTION_DAYS at 90-180.

Prune old logs (uses ACTIVITY_LOG_RETENTION_DAYS by default):

```bash
cd backend
python manage.py prune_activity_logs --dry-run
python manage.py prune_activity_logs
```

Override retention for one run:

```bash
cd backend
python manage.py prune_activity_logs --days 30
```

## 11. Deployment

### 11.1 Backend (Render)

- Root directory: backend
- Runtime: Python

Build command:

```bash
./build.sh
```

Start command:

```bash
gunicorn main.wsgi:application --bind 0.0.0.0:$PORT
```

Required env vars on Render:

```env
DJANGO_SECRET_KEY=your-production-secret
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-backend-service.onrender.com

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
DB_SSLMODE=require

CORS_ALLOWED_ORIGINS=https://your-frontend-project.vercel.app
CORS_ALLOW_CREDENTIALS=True

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
```

### 11.2 Frontend (Vercel)

- Root directory: frontend
- Framework: Next.js

Set env vars:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-backend-service.onrender.com
```

Optional CLI flow:

```bash
npm install -g vercel
cd frontend
vercel login
vercel link
vercel env add NEXT_PUBLIC_BACKEND_URL production
vercel env add NEXT_PUBLIC_BACKEND_URL preview
vercel env add NEXT_PUBLIC_WS_URL production
vercel env add NEXT_PUBLIC_WS_URL preview
vercel
vercel --prod
```

## 12. Troubleshooting

Frontend cannot reach backend:

- Verify NEXT_PUBLIC_BACKEND_URL.
- Confirm backend server is running and reachable.

CORS errors:

- Ensure frontend origin is listed exactly in CORS_ALLOWED_ORIGINS.
- Include scheme and domain exactly (for example, https://your-domain.com).

Database failures:

- Recheck DATABASE_URL and DB_SSLMODE.
- Validate database credentials and network accessibility.

OTP delivery failures:

- Verify SMTP settings and app password values.
- Check provider-side restrictions for SMTP login and sending.

## 12. Security Checklist for Developers

- Do not commit backend/.env or frontend/.env.local.
- Keep DJANGO_SECRET_KEY, DATABASE_URL, and SMTP secrets in environment variables only.
- Use DJANGO_DEBUG=False in production.
- Use HTTPS origins for production CORS and frontend-backend communication.
