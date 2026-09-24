# NexClinic Testing & Bug Report

## 1. Migration Bug (Critical)
**Location:** `backend/patient/migrations/0024_repair_patient_profile_file_columns.py`
**Description:** The custom `RunPython` migration attempts to access the `.column` attribute of `medical_documents` and `medical_reports`. Since these are `ManyToOneRel` reverse relationships, they do not have a `.column` attribute, leading to an `AttributeError`.
**Impact:** This entirely breaks the ability to recreate a clean test database from scratch using `manage.py test`, preventing CI/CD pipelines from functioning out-of-the-box.
**Status:** I applied a temporary hotfix (`hasattr(field, 'column')`) in the local workspace to unblock testing.

## 2. Dependency Vulnerabilities (Critical)
**Location:** Backend (`requirements.txt`) & Frontend (`package.json`)
**Description:** 
- Running `pip-audit` revealed **138 known vulnerabilities** across 12 packages in the backend.
- Running `npm audit` revealed **11 vulnerabilities** (1 low, 2 moderate, 7 high, 1 critical) in the frontend.

**Notable Backend Packages:**
- `django (6.0.1)`: Contains multiple CVEs (e.g., PYSEC-2026-42, PYSEC-2026-43) requiring upgrade to `6.0.2` or later.
- `djangorestframework (3.16.1)`: Known vulnerabilities requiring upgrade to `3.17.2`.
- `pillow (12.1.1)`: Numerous high-severity CVEs.
- `cryptography (49.0.0)`, `pyjwt (2.10.1)`, `setuptools (65.5.0)`

**Notable Frontend Packages:**
- `next (9.3.4-canary.0 - 16.3.2)`: Critical CVEs including Remote Code Execution, SSRF, and cache confusion (e.g., GHSA-p293-qw3h-jr36).
- `axios (1.0.0 - 1.17.0)`: High severity prototype pollution vulnerabilities.
- `js-yaml`, `nanoid`, `postcss`

**Impact:** Using vulnerable dependencies exposes the clinic's healthcare data to known exploits.
**Recommendation:** Perform a comprehensive dependency upgrade (`npm audit fix` and `pip install --upgrade`).

## 3. Signal Handler & Testability Bug (Moderate)
**Location:** `backend/notifications/signals.py`
**Description:** The `post_save` signal listener for appointments calls `.strftime('%I:%M %p')` on `instance.slot.start_time`. However, if the slot was created using a string (e.g., `"10:00:00"`), Django stores the string in memory before refreshing from the DB. This causes an `AttributeError` during object creation.
**Impact:** Prevents programmatic test generation and certain API flows unless objects are refreshed from the DB.

## 4. IDOR / RBAC Vulnerabilities
**Status:** Verification of IDOR vulnerabilities using automated tests has been blocked due to the cascading backend bugs identified above (migrations failing, signal handlers crashing). 
**Observation:** Based on the codebase review, object-level permissions (e.g., checking if the logged-in patient owns the appointment being accessed) appear to be inconsistently enforced in viewsets. This requires fixing the test environment (Bug #1 and #3) to run full comprehensive assertions.
