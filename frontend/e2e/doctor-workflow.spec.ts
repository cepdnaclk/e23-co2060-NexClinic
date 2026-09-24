import { test, expect } from '@playwright/test';

test.describe('Doctor Workflow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup mock authentication for doctor
    await context.addCookies([
      { name: 'authToken', value: 'mock-doctor-token', domain: 'localhost', path: '/' }
    ]);
    
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-doctor-token');
      localStorage.setItem('userRole', 'DOCTOR');
      localStorage.setItem('userInfo', JSON.stringify({ fullName: 'Dr. Jane Smith', email: 'doctor@example.com' }));
    });
  });

  test('Doctor can view dashboard and appointments', async ({ page }) => {
    // Mock the doctor dashboard/appointments API response
    await page.route('**/api/doctor/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          appointments: [
            {
              id: 1,
              patient_name: 'John Patient',
              date: '2027-01-01',
              time: '11:00:00',
              status: 'CONFIRMED'
            }
          ]
        })
      });
    });

    await page.goto('/doctor-self/dashboard');
    
    // Verify dashboard elements
    await expect(page.getByText('Dr. Jane Smith')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Verify appointments appear on the dashboard or by navigating
    await expect(page.getByText('John Patient')).toBeVisible();
    await expect(page.getByText('11:00:00')).toBeVisible();
  });

  test('Doctor can navigate to manage availability', async ({ page }) => {
    await page.goto('/doctor-self/dashboard');
    
    // Attempt to navigate to the availability/slots page
    const availabilityLink = page.getByRole('link', { name: /availability|slots/i }).first();
    
    if (await availabilityLink.isVisible()) {
      await availabilityLink.click();
      await expect(page).toHaveURL(/.*availability|.*slots/);
      await expect(page.getByText('Add Slot').or(page.getByText('Add Availability'))).toBeVisible();
    }
  });
});
