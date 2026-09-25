# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: patient-workflow.spec.ts >> Patient Workflow >> Patient can navigate to Doctors directory and filter
- Location: e2e\patient-workflow.spec.ts:53:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Dr. Alice')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Dr. Alice') with timeout 5000ms
  - waiting for getByText('Dr. Alice')

```

```yaml
- navigation:
  - link "NexClinic Logo NexClinic":
    - /url: /
    - img "NexClinic Logo"
    - text: NexClinic
  - link "News & Articles":
    - /url: /news-articles
  - link "Help":
    - /url: /help
  - button "Are you a Doctor? Click here":
    - link "Are you a Doctor? Click here":
      - /url: /doctor/login
- img "background"
- img "NexClinic Logo"
- heading "NexClinic" [level=1]
- heading "Welcome Back" [level=2]
- paragraph: Please sign in to your account
- text: Email Address
- img
- textbox "Email Address":
  - /placeholder: Enter your email
- text: Password
- img
- textbox "Password":
  - /placeholder: Enter your password
- button:
  - img
- button "Sign In"
- paragraph:
  - text: Forgot password?
  - link "Reset here":
    - /url: /reset-password
- paragraph:
  - text: Don't have an account?
  - link "Sign up here":
    - /url: /register
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Patient Workflow', () => {
  4  |   test.beforeEach(async ({ page, context }) => {
  5  |     // Setup mock authentication for patient
  6  |     await context.addCookies([
  7  |       { name: 'authToken', value: 'mock-patient-token', domain: 'localhost', path: '/' }
  8  |     ]);
  9  |     
  10 |     await page.goto('/');
  11 |     await page.evaluate(() => {
  12 |       localStorage.setItem('authToken', 'mock-patient-token');
  13 |       localStorage.setItem('userRole', 'PATIENT');
  14 |       localStorage.setItem('userInfo', JSON.stringify({ fullName: 'Test Patient', email: 'test@example.com' }));
  15 |     });
  16 |   });
  17 | 
  18 |   test('Patient can view dashboard and navigate to appointments', async ({ page }) => {
  19 |     // Mock the appointments API response
  20 |     await page.route('**/api/patient/appointments', async route => {
  21 |       await route.fulfill({
  22 |         status: 200,
  23 |         contentType: 'application/json',
  24 |         body: JSON.stringify({
  25 |           appointments: [
  26 |             {
  27 |               id: 1,
  28 |               doctor_name: 'Dr. John Doe',
  29 |               date: '2027-01-01',
  30 |               time: '10:00:00',
  31 |               status: 'CONFIRMED'
  32 |             }
  33 |           ]
  34 |         })
  35 |       });
  36 |     });
  37 | 
  38 |     await page.goto('/user-self/dashboard');
  39 |     
  40 |     // Verify dashboard elements
  41 |     await expect(page.getByText('Test Patient')).toBeVisible();
  42 |     await expect(page.getByText('Dashboard')).toBeVisible();
  43 | 
  44 |     // Navigate to appointments
  45 |     await page.click('text=Appointments');
  46 |     
  47 |     // Verify appointments page loads correctly
  48 |     await expect(page).toHaveURL(/.*appointments/);
  49 |     await expect(page.getByText('Dr. John Doe')).toBeVisible();
  50 |     await expect(page.getByText('2027-01-01')).toBeVisible();
  51 |   });
  52 | 
  53 |   test('Patient can navigate to Doctors directory and filter', async ({ page }) => {
  54 |     // Mock the doctors API response
  55 |     await page.route('**/api/doctor/public-list', async route => {
  56 |       await route.fulfill({
  57 |         status: 200,
  58 |         contentType: 'application/json',
  59 |         body: JSON.stringify({
  60 |           doctors: [
  61 |             { id: 1, name: 'Dr. Alice', specialization: 'Cardiology' },
  62 |             { id: 2, name: 'Dr. Bob', specialization: 'Dermatology' }
  63 |           ]
  64 |         })
  65 |       });
  66 |     });
  67 | 
  68 |     await page.goto('/doctors');
  69 |     
  70 |     // Verify doctors list loads
> 71 |     await expect(page.getByText('Dr. Alice')).toBeVisible();
     |                                               ^ Error: expect(locator).toBeVisible() failed
  72 |     await expect(page.getByText('Cardiology')).toBeVisible();
  73 | 
  74 |     // Optionally test filtering if applicable
  75 |     // e.g., await page.fill('input[placeholder="Search"]', 'Bob');
  76 |     // await expect(page.getByText('Dr. Alice')).not.toBeVisible();
  77 |   });
  78 | });
  79 | 
```