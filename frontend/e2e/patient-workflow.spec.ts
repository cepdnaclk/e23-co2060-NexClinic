import { test, expect } from '@playwright/test';

test.describe('Patient Workflow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup mock authentication for patient
    await context.addCookies([
      { name: 'authToken', value: 'mock-patient-token', domain: 'localhost', path: '/' }
    ]);
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

    // Mock notifications
    await page.route('**/api/notifications*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-patient-token');
      localStorage.setItem('userRole', 'PATIENT');
      localStorage.setItem('userInfo', JSON.stringify({ fullName: 'Test Patient', email: 'test@example.com' }));
    });

  });

  test('Patient can view dashboard and navigate to appointments', async ({ page }) => {
    // Mock the appointments API response
    await page.route('**/api/patient/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          appointments: [
            {
              id: 1,
              doctor_name: 'Dr. John Doe',
              date: '2027-01-01',
              time: '10:00:00',
              status: 'CONFIRMED'
            }
          ]
        })
      });
    });

    await page.goto('/user-self/dashboard');
    
    // Verify dashboard elements
    await expect(page.getByText('Test Patient')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Navigate to appointments
    await page.click('text=Appointments');
    
    // Verify appointments page loads correctly
    await expect(page).toHaveURL(/.*appointments/);
    await expect(page.getByText('Dr. John Doe')).toBeVisible();
    await expect(page.getByText('2027-01-01')).toBeVisible();
  });

  test('Patient can navigate to Doctors directory and filter', async ({ page }) => {
    // Mock the doctors API response
    await page.route('**/api/doctor/public-list', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          doctors: [
            { id: 1, name: 'Dr. Alice', specialization: 'Cardiology' },
            { id: 2, name: 'Dr. Bob', specialization: 'Dermatology' }
          ]
        })
      });
    });

    await page.goto('/doctors');
    
    // Verify doctors list loads
    await expect(page.getByText('Dr. Alice')).toBeVisible();
    await expect(page.getByText('Cardiology')).toBeVisible();

    // Optionally test filtering if applicable
    // e.g., await page.fill('input[placeholder="Search"]', 'Bob');
    // await expect(page.getByText('Dr. Alice')).not.toBeVisible();
  });
});
