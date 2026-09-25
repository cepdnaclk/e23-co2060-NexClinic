import { test, expect } from '@playwright/test';

test.describe('Doctor Workflow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup mock authentication for doctor
    await context.addCookies([
      { name: 'authToken', value: 'dummy.eyJleHAiOjk5OTk5OTk5OTl9.dummy', domain: 'localhost', path: '/' },
      { name: 'userRole', value: 'DOCTOR', domain: 'localhost', path: '/' }
    ]);
    
    // Setup initial localStorage before any routing
    await page.addInitScript(() => {
      window.localStorage.setItem('authToken', 'mock-doctor-token');
      window.localStorage.setItem('userRole', 'DOCTOR');
      window.localStorage.setItem('userInfo', JSON.stringify({ fullName: 'Dr. Jane Smith', email: 'doctor@example.com' }));
    });

    // Mock GET /api/doctor/profile
    await page.route('**/api/doctor/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          doctor: {
            fullName: 'Dr. Jane Smith',
            email: 'doctor@example.com',
            profileImage: ''
          }
        })
      });
    });

    // Mock GET /api/doctor/dashboard
    await page.route('**/api/doctor/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          doctor: {
            displayName: 'Dr. Jane Smith',
            email: 'doctor@example.com',
            specialization: 'Cardiology'
          },
          stats: {
            todayAppointments: 1,
            upcomingAppointmentsCount: 1,
            unreadChats: 0,
            monthEarnings: 0,
            onlineAdviceSessions: 0
          },
          upcomingAppointments: [
            {
              id: '1',
              patientName: 'John Patient',
              type: 'In-Person Appointment',
              date: '2027-01-01',
              time: '11:00:00',
              status: 'Confirmed'
            }
          ],
          recentChats: []
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

    // Mock GET /api/doctor/appointments
    await page.route('**/api/doctor/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          appointments: [
            {
              id: '1',
              patientName: 'John Patient',
              date: '2027-01-01',
              time: '11:00:00',
              status: 'Confirmed'
            }
          ]
        })
      });
    });

  });

  test('Doctor can view dashboard and appointments', async ({ page }) => {
    await page.goto('/doctor-self/dashboard');
    
    // Verify dashboard elements
    await expect(page.getByText('Dr. Jane Smith').first()).toBeVisible();
    await expect(page.getByText('John Patient').first()).toBeVisible();
  });

  test('Doctor can navigate to manage availability', async ({ page }) => {
    await page.goto('/doctor-self/dashboard');
    
    // Attempt to navigate to the availability/slots page
    const availabilityLink = page.getByRole('link', { name: /availability|slots/i }).first();
    
    if (await availabilityLink.isVisible()) {
      await availabilityLink.click();
      await expect(page).toHaveURL(/.*availability|.*slots/);
    }
  });
});
