# Project Implementation Log - Email Authentication System

## Overview

Implemented a secure email authentication system using OTP (One-Time Password) for the Nexaura project. The system ensures that users are not created in the main database until their email address is verified.

## Key Implementations

### 1. Pending User Architecture

- **Goal**: Prevent unverified users from cluttering the main `CustomUser` table.
- **Implementation**:
  - Created `PendingUser` model in `users/models.py`.
  - Stores `email`, `hashed_password`, `otp_code`, `role`, and `profile_data` (JSON) temporarily.
  - Records are automatically overwritten if a user re-registers with the same email before verification.

### 2. Registration Logic Refactor

- **Goal**: Defer user creation until verification.
- **Implementation**:
  - Updated `PatientRegistrationSerializer` and `DoctorRegistrationSerializer`.
  - **Flow**: Validates input -> Creates `PendingUser` -> Generates OTP -> Sends Email.
  - **Response**: Returns the email address to key the frontend verification step.

### 3. Verification & Activation

- **Goal**: Securely activate users.
- **Implementation**:
  - Created `VerifyOTPView` in `users/views.py`.
  - **Logic**:
    - Checks payload for `email` and `otp`.
    - Validates OTP against `PendingUser`.
    - **Atomic Transaction**: Creates `CustomUser` + `Profile` (Patient/Doctor) and deletes `PendingUser` in one go.
  - **Error Handling**: specific messages for "User already verified" vs "Registration not found".

### 4. OTP Management

- **Goal**: Allow users to handle lost/expired codes.
- **Implementation**:
  - Created `ResendOTPView` in `users/views.py`.
  - Regenerates a new 6-digit code and resets the 10-minute expiration timer for the existing pending user.
  - Implemented duplicate check to ensure active users don't request OTPs.

### 5. Frontend Integration Templates

- **Goal**: Provide reference code for the Next.js frontend.
- **Implementation**:
  - Created `temp-templates/authService.ts`: TypeScript functions for `verifyOTP` and `resendOTP` using `fetch`.
  - Created `temp-templates/VerifyPage.tsx`: React component for the verification UI.
  - **Key Detail**: Enforced `Content-Type: application/json` header and `JSON.stringify` body to match backend expectations.

### 6. Bug Fixes & Refinements

- **KeyError Fix**: Resolved an issue where the registration response was missing the `email` field.
- **Data Validation**: Added checks in views to ensure `request.data` is a dictionary, preventing `attribute 'get' not found` errors.

### 7. Recent Enhancements

- **PendingUser Admin**: Registered `PendingUser` model to allow admins to view unverified registrations.
- **Timezone**: Configured `Asia/Colombo` as the project timezone.
- **Doctor Profile Updates**:
  - Added `full_name`, `preferred_name`, and `nic_number` to `DoctorProfile`.
  - Updated `DoctorRegistrationSerializer` to capture these fields.
  - Enhanced `DoctorProfileAdmin` to display names in the dashboard list.
- **Admin Notification**: Implemented an automated email to `nexclinicbynexaura@gmail.com` when a new doctor registers.

## API Documentation

### 1. Patient Registration

- **Endpoint:** `POST /api/users/patient/register/`
- **Description:** Initiates registration string for a patient. Creates a `PendingUser` record and sends an OTP.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "password2": "securepassword",
    "full_name": "John Doe",
    "phone": "1234567890",
    "date_of_birth": "1990-01-01",
    "gender": "Male",
    "address": "123 Main St"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "email": "user@example.com"
  }
  ```

### 2. Doctor Registration

- **Endpoint:** `POST /api/users/doctor/register/`
- **Description:** Initiates registration for a doctor. Creates a `PendingUser` record and sends an OTP.
- **Request Body:**
  ```json
  {
    "email": "doctor@example.com",
    "password": "securepassword",
    "password2": "securepassword",
    "full_name": "Dr. John Smith",
    "preferred_name": "Dr. Smith",
    "specialization": "Cardiology",
    "license_number": "LIC12345",
    "nic_number": "199012345678",
    "phone": "0987654321"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "email": "doctor@example.com"
  }
  ```

### 3. Verify OTP

- **Endpoint:** `POST /api/users/verify-otp/`
- **Description:** Verifies the OTP sent to the user's email. On success, creates the actual User and Profile records.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Account verified successfully"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: "Invalid OTP", "OTP has expired", "User is already verified", or "Registration not found".

### 4. Resend OTP

- **Endpoint:** `POST /api/users/resend-otp/`
- **Description:** Generates a new OTP for a pending user and resends the email.
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "OTP sent successfully"
  }
  ```

### 5. User Login

- **Endpoint:** `POST /api/users/patient/login/` OR `POST /api/users/doctor/login/`
- **Description:** Authenticates a user and returns JWT tokens (Access & Refresh).
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "refresh": "ey...",
    "access": "ey..."
  }
  ```

### 6. Refresh Token

- **Endpoint:** `POST /api/users/token/refresh/`
- **Description:** Generates a new Access Token using a valid Refresh Token.
- **Request Body:**
  ```json
  {
    "refresh": "ey..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access": "ey..."
  }
  ```

### 7. Admin Interface

- **URL:** `/admin/`
- **Description:** Standard Django Admin Dashboard for managing Users, Profiles, and other models.
- **Access:** Requires a Superuser account.
- **Create Superuser Command:**
  ```bash
  python manage.py createsuperuser
  ```
