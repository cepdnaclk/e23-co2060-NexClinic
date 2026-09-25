# NexClinic Frontend-Backend Integration Guide

## Overview
This document describes the integration architecture between the Next.js frontend and Django REST backend for NexClinic, detailing the secure authentication flow, role-based access control (RBAC), and data synchronization.

## Architecture

### Frontend (Next.js)
- **Type**: React with Next.js App Router (Client & Server Components)
- **Location**: `frontend/`
- **Key Routing**: 
  - `src/app/(auth)/login` - Unified login for all roles
  - `src/app/(protected)/` - Role-specific dashboards
- **Middleware Protection**: `src/proxy.ts` (Next.js Middleware)

### Backend (Django)
- **Type**: Django REST Framework
- **Location**: `backend/`
- **Authentication**: JWT (JSON Web Tokens) strictly via `HttpOnly` cookies
- **Roles**: `PATIENT`, `DOCTOR`, `ADMIN`

---

## Authentication Flow (Unified Login)

To guarantee security against XSS and ensure proper server-side route protection, NexClinic uses an **HttpOnly Cookie-based Auth Flow**.

1. **User Input**
   - The user (Patient, Doctor, or Admin) submits their credentials via the unified login form.

2. **Backend Authentication**
   - The backend validates the credentials against the `CustomUser` model.
   - Upon success, the Django backend generates a JWT `access` and `refresh` token.
   - **Crucially**, these tokens are attached to the HTTP response as `Set-Cookie` headers (HttpOnly, Secure, SameSite=Lax) instead of returning them in the JSON body.

3. **Frontend Token Handling**
   - The frontend browser automatically stores the HttpOnly cookies.
   - A non-HttpOnly `userRole` or `isLoggedIn` flag may be set to aid the UI in rendering layout changes, but sensitive API requests rely entirely on the browser automatically attaching the HttpOnly auth cookies.

4. **Session Synchronization & Redirection**
   - The frontend router redirects the user to their respective dashboard (`/user-self/dashboard` for Patients, `/doctor-self/dashboard` for Doctors).

---

## Role-Based Access Control (RBAC)

 NexClinic implements a Two-Tier RBAC system:

### 1. Frontend Route Protection (`proxy.ts`)
The Next.js middleware intercepts all requests before the page renders:
- It inspects incoming cookies (`authToken` and `userRole`).
- If a user attempts to access a protected route without a valid token, they are caught by a `307 Temporary Redirect` to `/login`.
- It enforces role boundaries (e.g., ensuring a `PATIENT` cannot navigate to `/doctor-self/`).

### 2. Backend API Protection
The Django REST Framework utilizes custom permission classes (`IsDoctor`, `IsPatient`).
- Even if a user bypasses the frontend UI, the backend extracts the JWT payload from the incoming cookie header.
- If the role in the payload does not match the required role for the endpoint, it strictly returns a `403 Forbidden` response.

---

## Handling File Uploads (Profile Pictures & Medical Records)

Uploading binary data requires strict adherence to `multipart/form-data` protocols.

1. **Frontend Construction**:
   - The frontend uses the native `FormData` API to append files and JSON fields.
   - **Important**: Do *not* manually set the `Content-Type` header in the fetch/axios request. The browser must automatically set this to include the correct boundary string.

2. **Backend Parsing**:
   - Django REST Framework's `MultiPartParser` receives the payload.
   - Files are validated (size, extension) and stored securely in the configured media directory (or cloud bucket in production).

---

## State Synchronization

To prevent double-bookings and provide a responsive UX:
- NexClinic utilizes **Optimistic UI Updates**. When an API mutation occurs (e.g., booking a slot), the client-side state is immediately updated to reflect the new state, and a background re-fetch ensures synchronization with the Postgres database.
- Error states return standardized HTTP codes (`400 Bad Request`, `404 Not Found`, `415 Unsupported Media Type`), which the frontend maps to user-friendly toast notifications.

---

## Security Considerations

1. **HTTPS**: Absolute requirement in production for Secure cookies to function.
2. **HttpOnly Cookies**: Prevents Cross-Site Scripting (XSS) attacks from stealing session tokens.
3. **CORS Policy**: The backend strictly whitelists the frontend domain via `CORS_ALLOWED_ORIGINS` to prevent Cross-Origin resource theft.
4. **Environment Secrets**: `DJANGO_SECRET_KEY` and DB credentials are never exposed to the frontend build.
