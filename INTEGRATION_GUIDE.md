# NexAura Frontend-Backend Integration Guide

## Overview
This document describes the integration between the Next.js frontend and Django REST backend for the NexAura project, specifically the doctor login functionality.

## Architecture

### Frontend (Next.js)
- **Type**: React with Next.js 13+ App Router
- **Location**: `frontend/src/`
- **Key Component**: `components/doctor/DoctorLoginForm2.tsx`
- **API Route**: `app/api/auth/login/route.ts`

### Backend (Django)
- **Type**: Django REST Framework with JWT Authentication
- **Location**: `backend/`
- **Login Endpoint**: `/api/users/doctor/login/`
- **Authentication**: JWT (JSON Web Tokens)

## Setup Instructions

### Backend Setup

#### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

The `requirements.txt` includes:
- `djangorestframework` - REST API framework
- `djangorestframework_simplejwt` - JWT authentication
- `django-cors-headers` - CORS support for frontend requests
- `psycopg2-binary` - PostgreSQL database adapter

#### 2. Environment Configuration
The Django backend expects a PostgreSQL database. Update `main/settings.py` if needed:
```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "nexaura",
        "USER": "nexaura",
        "PASSWORD": "2ypnexaura",
        "HOST": "localhost",
        "PORT": 5432,
    }
}
```

#### 3. Run Migrations
```bash
python manage.py migrate
```

#### 4. Start Django Server
```bash
python manage.py runserver
```
The server will be available at `http://localhost:8000`

### Frontend Setup

#### 1. Install Dependencies
```bash
cd frontend
npm install
# or
yarn install
```

#### 2. Configure Backend URL
Create/update `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

For production, update this to your backend URL.

#### 3. Start Next.js Dev Server
```bash
npm run dev
# or
yarn dev
```
The frontend will be available at `http://localhost:3000`

## How It Works

### Doctor Login Flow

1. **User Input** (DoctorLoginForm2.tsx)
   - User enters email and password in the login form
   - Form validates empty fields

2. **Frontend API Call** 
   - `/api/auth/login` (Next.js API route) receives POST request
   - Route proxies the request to Django backend at `/api/users/doctor/login/`

3. **Backend Authentication**
   - Django validates credentials against CustomUser model
   - Credentials use `email` as the login field (CustomUser.USERNAME_FIELD = 'email')
   - Returns JWT access token and refresh token on successful authentication

4. **Token Storage**
   - Frontend stores tokens in localStorage:
     - `authToken` - JWT access token for API requests
     - `refreshToken` - Used to obtain new access token
     - `userInfo` - User information (email, etc.)

5. **Redirect**
   - After successful login, user is redirected to `/doctor/dashboard`

## API Endpoints

### Doctor Registration (SLMC ID Format)
Doctor signup accepts SLMC registration numbers in the following formats:

- Number only: `12345`
- Prefix + slash + number: `MB/1234`, `PMC/5678`

Validation rule used across backend and frontend:

- Regex: `^(\d{3,10}|[A-Za-z]{2,10}/\d{3,10})$`

Integration notes:

- Input is normalized to uppercase on the backend (for example, `mb/1234` becomes `MB/1234`).
- Spaces are removed before validation.
- Any other format is rejected with a validation error.

### Login
**Next.js Route:** `POST /api/auth/login`
```json
{
  "username": "doctor@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "email": "doctor@example.com"
  }
}
```

**Django Endpoint:** `POST /api/users/doctor/login/`
- Expects `email` and `password` fields
- Returns JWT tokens

### Custom User Model
The backend uses a custom user model: `users.CustomUser`
- **USERNAME_FIELD**: `email` (not username)
- **Roles**: ADMIN, PATIENT, DOCTOR
- **Fields**: email, role, is_active, is_staff, date_joined

## CORS Configuration

### Backend (Django)
Configured in `backend/main/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

CORS_ALLOW_CREDENTIALS = True
```

Add your frontend URL to this list for production deployments.

## Authentication Flow with JWT

### Access Token Usage
Include the token in API requests:
```typescript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
};
```

### Token Refresh
Use the refresh token to get a new access token:
```typescript
POST /api/users/token/refresh/
{
  "refresh": "refreshToken"
}
```

## Error Handling

### Login Errors
- **401 Unauthorized**: Incorrect email or password
- **400 Bad Request**: Missing or invalid fields
- **500 Server Error**: Backend error

The frontend displays user-friendly error messages for each case.

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS in production
2. **Token Storage**: Consider using httpOnly cookies instead of localStorage for better security
3. **CORS**: Restrict CORS origins to your domain in production
4. **Secret Key**: Change Django's SECRET_KEY in production
5. **Email Credentials**: Store email credentials in environment variables, not in settings.py

## Troubleshooting

### CORS Errors
- Ensure backend is running at the URL specified in `.env.local`
- Check `CORS_ALLOWED_ORIGINS` in Django settings
- Backend must be accessible from your frontend URL

### Login Failures
- Verify the user exists in the database
- Check that credentials are correct
- Look at Django logs for detailed error messages

### Token Issues
- Refresh token if access token expired
- Check token expiration settings in Django JWT configuration
- Ensure token is included in request headers

## Next Steps

1. Create similar login forms for Patient login
2. Implement token refresh logic
3. Create protected API routes requiring JWT authentication
4. Add logout functionality
5. Implement password reset functionality
6. Add user profile management

## Additional Resources

- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [Simple JWT Documentation](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [CORS Headers](https://github.com/adamchainz/django-cors-headers)
