# NexClinic Testing Guide

This document outlines the testing strategy, existing test coverage, and instructions for running tests across the NexClinic system (Backend + Frontend).

## 1. What We Have Tested So Far

The system currently employs two main types of automated testing: **Backend API Tests** and **Frontend End-to-End (E2E) Tests**.

### Backend (Django / DRF)
We use Django's built-in `TestCase` along with Django Rest Framework's `APIClient` to perform integration tests on our API endpoints.

**Tested Areas:**
* **Patient Module (`backend/patient/tests/`):**
  * Profile updates (full name, email, emergency contacts, etc.).
  * Validation (rejecting duplicate emails).
  * File uploads (profile images, medical reports (PDF), and medical documents).
* **Doctor Module (`backend/doctor/tests/`):**
  * Profile updates (fees, languages, specialization).
  * Validation (rejecting duplicate emails, handling complex hospital payloads).
  * File uploads (multipart payload updates, profile images).
  * **Medical Records:** Creating medical records and prescriptions from the doctor's side, and ensuring the patient can successfully fetch and view them.
* **Hospital Module (`backend/hospital/tests/`):** Models, signals, views, and celery tasks tested in separate files.
* **Chat Module (`backend/chat/tests/`):** Models and views tested in separate files.
* **Users Module (`backend/users/tests/`):** Custom user model creation and authentication.

### Frontend (Next.js / Playwright)
We use Playwright for End-to-End (E2E) testing to simulate real user interactions in the browser.

**Tested Areas:**
* **Booking Appointment Flow (`frontend/e2e/book-appointment.spec.ts`):**
  * Verifies that the "Book Appointment" button is correctly disabled if a doctor has "No Slots Available".
  * Verifies that clicking an available doctor auto-selects them on the booking page and correctly filters the hospital dropdown options.

---

## 2. How to Test the System Currently

### Running Backend Tests
To run the backend tests, navigate to the `backend` directory and use the provided testing script or Django's `manage.py`.

```bash
cd backend
# Activate your virtual environment if you haven't
# Windows: nexclinic-venv\Scripts\activate
# Mac/Linux: source nexclinic-venv/bin/activate

# Option 1: Run all tests using Django's test runner
python manage.py test

# Option 2: Run tests for specific apps
python manage.py test doctor patient hospital

# Option 3: Run the custom testing script (outputs to test_out.log)
python run_tests_script.py
```

### Running Frontend E2E Tests
To run the frontend Playwright tests, navigate to the `frontend` directory.

```bash
cd frontend

# Install Playwright browsers (only needed the first time)
npx playwright install

# Run tests in headless mode (background)
npx playwright test

# Run tests in UI mode (opens a visual interface to see tests running)
npx playwright test --ui
```

---

## 3. How to Conduct Different Levels of Testing

To ensure complete robustness of the NexClinic system, a healthy testing pyramid involves different levels of testing. Here is how we can expand and conduct them:

### A. Unit Testing
**Goal:** Test isolated pieces of code (functions, methods, or single components) to ensure they work on their own.
* **Backend (Python):** Use Django's `TestCase` to test individual model methods, custom utility functions (like email senders), or complex property calculations without making HTTP requests.
* **Frontend (TypeScript/React):** We can introduce **Jest** and **React Testing Library**. 
  * *Example:* Testing a reusable `Button` component to ensure it fires an `onClick` event, or testing a date formatting utility function.

### B. Integration Testing (Currently Active in Backend)
**Goal:** Test how different parts of the system work together (e.g., Database + View + Serializer).
* **Backend:** This is what we currently do using `APIClient`. We send an HTTP request to an endpoint and verify that the database was updated correctly and the correct JSON was returned.
* **Frontend:** Testing a whole "Page" or "Form" component by mocking the API responses (using tools like **MSW - Mock Service Worker**).
  * *Example:* Rendering the `Medications` page, mocking a successful API fetch, and verifying that the medication cards render correctly.

### C. End-to-End (E2E) Testing (Currently Active in Frontend)
**Goal:** Test the entire application flow from the user's perspective, running a real browser against a running instance of the app (and potentially the real backend/database).
* **Tool:** Playwright (already configured in `frontend/e2e/`).
* **Strategy:** Write tests for critical user journeys (CUJs).
  * *Example 1:* Patient logs in -> Browses doctors -> Books an appointment -> Pays -> Sees confirmation.
  * *Example 2:* Doctor logs in -> Sees appointment -> Adds a medical record/prescription -> Completes appointment.

### D. Security & Permissions Testing
**Goal:** Ensure users can only access what they are allowed to.
* **Backend:** Write specific tests verifying that a `PATIENT` token gets a `403 Forbidden` when trying to access a `DOCTOR` endpoint (e.g., updating a doctor's profile).

### E. Manual / Exploratory Testing
**Goal:** Catch visual bugs, UX issues, or edge cases that automated tests might miss.
* **Strategy:** Regularly run the local dev servers (`npm run dev` and `python manage.py runserver`) and test features as a real user, especially after introducing complex integrations (like the recent MFA or Stripe Payment integrations).
