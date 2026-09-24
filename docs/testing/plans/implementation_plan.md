# Frontend E2E Testing Plan

This plan outlines the steps to configure and implement End-to-End (E2E) testing for the frontend using Playwright. 

## User Review Required
> [!IMPORTANT]  
> We need a robust `playwright.config.ts` to execute tests properly. This plan introduces a standard configuration. Let me know if you have specific browsers you want to omit or include (the default uses Chromium).

## Proposed Changes

### 1. Playwright Configuration

#### [NEW] [playwright.config.ts](file:///d:/UoP/Semester_3/CO2060/cepdnaclk/e23-co2060-NexClinic/frontend/playwright.config.ts)
- Create a configuration file at the root of the `frontend` folder.
- Set `baseURL: 'http://localhost:3000'` so tests can run against the local Next.js dev server.
- Configure default test directories to `e2e/`.

---

### 2. E2E Test Implementation

I will add missing test files to cover the patient and doctor workflows that are critical to the system.

#### [NEW] [patient-workflow.spec.ts](file:///d:/UoP/Semester_3/CO2060/cepdnaclk/e23-co2060-NexClinic/frontend/e2e/patient-workflow.spec.ts)
- Test the ability to view the patient dashboard.
- Test that the appointment list renders properly on the dashboard (by mocking API responses if the backend isn't actively seeded with test data).
- Ensure patient authentication state directs appropriately.

#### [NEW] [doctor-workflow.spec.ts](file:///d:/UoP/Semester_3/CO2060/cepdnaclk/e23-co2060-NexClinic/frontend/e2e/doctor-workflow.spec.ts)
- Test logging in as a Doctor.
- Test viewing the doctor dashboard and appointments list.
- Test the UI interactions for accepting/rejecting an appointment.

## Verification Plan
### Automated Tests
- Start the Next.js development server locally in the background if it's not already running (`npm run dev`).
- Run `npx playwright test` to execute all E2E scripts.

### Documentation
- As requested, I will create a `docs/testing/E2E_REPORT.md` (or output a detailed artifact) summarizing the results and what each test accomplished throughout the run.
