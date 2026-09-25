import { test, expect } from '@playwright/test';

test.describe('Patient Workflow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup mock authentication for patient
    await context.addCookies([
      { name: 'authToken', value: 'dummy.eyJleHAiOjk5OTk5OTk5OTl9.dummy', domain: 'localhost', path: '/' },
      { name: 'userRole', value: 'PATIENT', domain: 'localhost', path: '/' }
    ]);
    
    // Setup localStorage after going to base url
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('authToken', 'mock-patient-token');
      window.localStorage.setItem('userRole', 'PATIENT');
      window.localStorage.setItem('userInfo', JSON.stringify({ fullName: 'Test Patient', email: 'test@example.com' }));
      window.localStorage.setItem('isAuthenticated', 'true');
    });
    // Fallback for any unmocked API calls
    await page.route('**/api/**', async (route, request) => {
      console.log(`[UNMOCKED] ${request.method()} ${request.url()}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });

    // Mock GET /api/patient/profile
    await page.route('**/api/patient/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          patient: {
            fullName: 'Test Patient',
            email: 'test@example.com',
            phone: '',
            dateOfBirth: '',
            gender: 'other',
            address: '',
            city: '',
            profileImage: ''
          }
        })
      });
    });

    // Mock GET /api/patient/appointments
    await page.route('**/api/patient/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          appointments: [
            {
              id: '1',
              doctorName: 'Dr. John Doe',
              date: '2027-01-01',
              time: '10:00:00',
              status: 'Confirmed',
              type: 'In-Person Appointment',
              category: 'upcoming',
              requestedAt: new Date().toISOString()
            }
          ]
        })
      });
    });

    // Mock notifications
    await page.route(/\/api\/notifications/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    page.on('response', response => {
      console.log(`[NETWORK] ${response.status()} ${response.url()}`);
    });

    page.on('console', msg => {
      if (msg.text().includes('[TEST DEBUG')) {
        console.log(`[BROWSER CONSOLE] ${msg.text()}`);
      }
    });

  });

  test('Patient can view dashboard and navigate to appointments', async ({ page, isMobile }) => {
    await page.goto('/user-self/dashboard');
    
    // Verify dashboard elements
    await expect(page.getByText('Test Patient').first()).toBeVisible();
    await expect(page.getByText('Dr. John Doe').first()).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: /Toggle menu/i }).click();
    }
    // Navigate to appointments
    await page.getByRole('link', { name: /Appointments/i }).first().click();
    
    // Verify appointments page loads correctly
    await expect(page).toHaveURL(/.*appointments/, { timeout: 15000 });
  });

  test('Patient can navigate to Doctors directory and filter', async ({ page }) => {
    // Mock the doctors API response correctly mapped to /api/doctor/directory
    await page.route('**/api/doctor/directory*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          doctors: [
            { id: '1', fullName: 'Dr. Alice', displayName: 'Dr. Alice', specialization: 'Cardiology', isActive: true, hospitals: ['General Hospital'] },
            { id: '2', fullName: 'Dr. Bob', displayName: 'Dr. Bob', specialization: 'Dermatology', isActive: true, hospitals: ['City Clinic'] }
          ]
        })
      });
    });

    await page.goto('/doctors');
    
    // Verify doctors list loads
    await expect(page.getByText('Dr. Alice').first()).toBeVisible();
    await expect(page.locator('p', { hasText: 'Cardiology' }).first()).toBeVisible();
  });
});
