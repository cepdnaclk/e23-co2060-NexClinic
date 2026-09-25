# NexClinic Test Data Plan

Before executing the tests, I will generate the following deterministic test data in the local database. These users and entities will be used across the backend integration tests, frontend E2E tests, and performance load tests.

## 1. Test Users

All test users will have the standard password: `TestPass@123` (except for admin).

| User Role | Email | Name | Purpose |
| :--- | :--- | :--- | :--- |
| **Patient A** | `patientA@nexclinic.test` | Alice Smith | Primary patient for successful workflow testing. |
| **Patient B** | `patientB@nexclinic.test` | Bob Jones | Secondary patient used to test IDOR/BOLA (ensuring Alice can't access Bob's data). |
| **Doctor A** | `doctorA@nexclinic.test` | Dr. John Doe | Primary doctor (Cardiologist, LKR 2000 fee). |
| **Doctor B** | `doctorB@nexclinic.test` | Dr. Jane Roe | Secondary doctor (Dermatologist, LKR 1500 fee) for cross-access testing. |
| **Admin** | `admin@nexclinic.test` | Hospital Admin | Admin user to test role-based access control (Password: `AdminPass@123`). |

## 2. Mock Entities

### A. Doctor Availability Slots
- **Doctor A**: Monday, 09:00 AM - 12:00 PM
- **Doctor B**: Wednesday, 01:00 PM - 04:00 PM

### B. Appointments
- **Completed Appointment**: Patient A with Doctor A (status: `COMPLETED`) - Used to test Medical Record generation and viewing.
- **Pending/Upcoming Appointment**: Patient B with Doctor B (status: `CONFIRMED`) - Used to test cancellations and scheduling overlaps.

### C. Medical Records (Files)
- Mock PDF files associated with Patient A's completed appointment to test secure file fetching and AWS S3/storage handling.

