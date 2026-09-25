# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: doctor-workflow.spec.ts >> Doctor Workflow >> Doctor can view dashboard and appointments
- Location: e2e\doctor-workflow.spec.ts:18:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Dr. Jane Smith')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Dr. Jane Smith') with timeout 5000ms
  - waiting for getByText('Dr. Jane Smith')

```

```yaml
- navigation:
  - link "NexClinic Logo NexClinic":
    - /url: /
    - img "NexClinic Logo"
    - text: NexClinic
  - button "Toggle menu":
    - img
- img "background"
- img "NexClinic Logo"
- heading "NexClinic" [level=1]
- paragraph: Doctor Portal Access
- heading "Welcome Back Doctor!" [level=2]
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
- button "Login"
- paragraph:
  - text: Forgot password?
  - link "Reset here":
    - /url: /reset-password?role=doctor
- paragraph:
  - text: Don't have an account?
  - link "Register here":
    - /url: /doctor/register
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Doctor Workflow', () => {
  4  |   test.beforeEach(async ({ page, context }) => {
  5  |     // Setup mock authentication for doctor
  6  |     await context.addCookies([
  7  |       { name: 'authToken', value: 'mock-doctor-token', domain: 'localhost', path: '/' }
  8  |     ]);
  9  |     
  10 |     await page.goto('/');
  11 |     await page.evaluate(() => {
  12 |       localStorage.setItem('authToken', 'mock-doctor-token');
  13 |       localStorage.setItem('userRole', 'DOCTOR');
  14 |       localStorage.setItem('userInfo', JSON.stringify({ fullName: 'Dr. Jane Smith', email: 'doctor@example.com' }));
  15 |     });
  16 |   });
  17 | 
  18 |   test('Doctor can view dashboard and appointments', async ({ page }) => {
  19 |     // Mock the doctor dashboard/appointments API response
  20 |     await page.route('**/api/doctor/appointments', async route => {
  21 |       await route.fulfill({
  22 |         status: 200,
  23 |         contentType: 'application/json',
  24 |         body: JSON.stringify({
  25 |           appointments: [
  26 |             {
  27 |               id: 1,
  28 |               patient_name: 'John Patient',
  29 |               date: '2027-01-01',
  30 |               time: '11:00:00',
  31 |               status: 'CONFIRMED'
  32 |             }
  33 |           ]
  34 |         })
  35 |       });
  36 |     });
  37 | 
  38 |     await page.goto('/doctor-self/dashboard');
  39 |     
  40 |     // Verify dashboard elements
> 41 |     await expect(page.getByText('Dr. Jane Smith')).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  42 |     await expect(page.getByText('Dashboard')).toBeVisible();
  43 | 
  44 |     // Verify appointments appear on the dashboard or by navigating
  45 |     await expect(page.getByText('John Patient')).toBeVisible();
  46 |     await expect(page.getByText('11:00:00')).toBeVisible();
  47 |   });
  48 | 
  49 |   test('Doctor can navigate to manage availability', async ({ page }) => {
  50 |     await page.goto('/doctor-self/dashboard');
  51 |     
  52 |     // Attempt to navigate to the availability/slots page
  53 |     const availabilityLink = page.getByRole('link', { name: /availability|slots/i }).first();
  54 |     
  55 |     if (await availabilityLink.isVisible()) {
  56 |       await availabilityLink.click();
  57 |       await expect(page).toHaveURL(/.*availability|.*slots/);
  58 |       await expect(page.getByText('Add Slot').or(page.getByText('Add Availability'))).toBeVisible();
  59 |     }
  60 |   });
  61 | });
  62 | 
```