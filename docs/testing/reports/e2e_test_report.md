# Frontend End-to-End Test Report (Playwright)

## Overview
As part of Phase 4 of the QA testing strategy, end-to-end tests were implemented for the frontend of the **NexClinic** application using Playwright. 

The tests were executed across three browser profiles:
- Desktop Chromium
- Microsoft Edge
- Mobile Chrome (Pixel 5 emulation)

**Total Tests Run**: 21
**Passed**: 9
**Failed**: 12

---

## Test Implementation

Two new test suites were introduced to cover core user workflows:
1. **Patient Workflow (`patient-workflow.spec.ts`)**: Tests the patient dashboard visibility and navigation to the appointments directory.
2. **Doctor Workflow (`doctor-workflow.spec.ts`)**: Tests the doctor dashboard and availability management links.

These were run alongside the existing `book-appointment.spec.ts` and `profile-pic.spec.ts` test suites.

---

## Failure Analysis

12 tests failed consistently across all browser environments. Below is an analysis of the root causes:

### 1. Patient & Doctor Workflow Suites (Next.js SSR vs. Client Mocking)
**Failing Tests:**
- `Patient can view dashboard and navigate to appointments` (Timeout finding 'Test Patient')
- `Patient can navigate to Doctors directory and filter` (Timeout finding 'Dr. Alice')
- `Doctor can view dashboard and appointments` (Timeout finding 'Dr. Jane Smith')

**Root Cause:**
The Next.js 13+ App Router often performs data fetching on the server side (Server Components). Playwright's `page.route` only intercepts network requests initiated from the browser (Client Components). Because the data is being fetched on the server, our mocked API responses are ignored, and the frontend attempts to fetch data from the actual backend (which is either unreachable, unauthenticated, or returning empty data). 
**Recommendation**: The testing strategy needs to be adjusted. Instead of `page.route`, we either need to:
- Seed a test database and run E2E tests against a real backend instance.
- Create a dedicated mock server that the Next.js backend hits during tests.

### 2. Profile Picture Upload Flow
**Failing Test:**
- `should display dummy icon initially, upload profile pic, and display it correctly`

**Root Cause:**
The test timed out after 120,000ms waiting for the `input[type="file"]` locator to become attached to the DOM on the `/user-self/edit-profile` page.
This indicates a UI regression or discrepancy—either the file input has been removed, conditionally hidden, or is rendering under a different selector (e.g., a hidden input triggered by a custom button click that isn't instantly attached).

---

## Passed Tests

- **`book-appointment.spec.ts`**:
  - `should disable Book Appointment button for doctor with no active slots`
  - `should auto-select doctor and filter hospitals on book appointment page`

These tests passed successfully across all browsers, confirming that the client-side logic for disabling buttons and filtering hospitals functions correctly when the conditions are met in the DOM.

---

## Conclusion and Next Steps

The frontend E2E framework is now successfully configured for multi-browser and mobile testing. However, the reliance on Playwright's network interception (`page.route`) is incompatible with Next.js Server Components. 

To achieve a green E2E test suite:
1. **Rethink Mocking**: Transition from client-side network mocking to a seeded integration test environment with a live backend database.
2. **Investigate UI**: Review the `/user-self/edit-profile` page to determine why the file input selector is missing or unattached.
