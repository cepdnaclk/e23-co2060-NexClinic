import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Profile Picture Update Flow', () => {
  test.setTimeout(120000);

  test('should display dummy icon initially, upload profile pic, and display it correctly', async ({ page, context }) => {
    // 1. Setup mock auth
    await context.addCookies([
      { name: 'authToken', value: 'dummy.eyJleHAiOjk5OTk5OTk5OTl9.dummy', domain: 'localhost', path: '/' },
      { name: 'userRole', value: 'PATIENT', domain: 'localhost', path: '/' }
    ]);
    
    page.on('response', response => {
      console.log('Response:', response.url(), response.status());
    });
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    await page.route('**/api/patient/profile', async route => {
      if (route.request().method() === 'GET') {
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
            },
            health: {
              bloodType: '',
              allergies: '',
              medications: '',
              medicalReports: '',
              medicalDocuments: '',
              medicalHistory: ''
            },
            emergencyContact: {
              name: '',
              phone: '',
              relation: '',
              email: ''
            }
          })
        });
      } else if (route.request().method() === 'PATCH') {
        // Mock PATCH response with a fake image URL
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
              profileImage: 'https://via.placeholder.com/150'
            },
            health: {
              bloodType: '',
              allergies: '',
              medications: '',
              medicalReports: '',
              medicalDocuments: '',
              medicalHistory: ''
            },
            emergencyContact: {
              name: '',
              phone: '',
              relation: '',
              email: ''
            }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock GET /api/patient/appointments
    await page.route('**/api/patient/appointments', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            appointments: []
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock GET /api/notifications*
    await page.route('**/api/notifications*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('authToken', 'mock-patient-token');
      window.localStorage.setItem('userRole', 'PATIENT');
      window.localStorage.setItem('userInfo', JSON.stringify({ fullName: 'Test Patient', email: 'test@example.com' }));
      window.localStorage.setItem('isAuthenticated', 'true');
    });

    // 2. Go to dashboard
    await page.locator('a[href="/user-self/dashboard"]').first().click();
    await page.waitForURL('**/user-self/dashboard');
    await page.waitForTimeout(2000);

    // 3. Go to profile page
    await page.locator('a[href="/user-self/profile"]').first().click();
    await page.waitForURL('**/user-self/profile');
    await page.waitForTimeout(1000);

    // Click on Edit Profile
    await page.locator('a[href="/user-self/edit-profile"]').first().click();
    await page.waitForURL('**/user-self/edit-profile');
    await page.waitForTimeout(1000);

    // Check if the file input exists
    await page.waitForSelector('input[type="file"]', { state: 'attached' });
    
    // 4. Upload a new profile picture
    const testImagePath = path.join(__dirname, '..', '..', 'TestProfilePic', 'TestProfilePic.png');
    
    // Set the file to upload directly using the input
    await page.setInputFiles('input[type="file"]', testImagePath);

    // Click "Save Profile"
    await page.click('button:has-text("Save Profile")');

    // Wait for a few seconds to let upload finish
    await page.waitForTimeout(3000);

    // 5. Verify in Edit Profile page
    // The profile image should now be an <img> tag with src pointing to the uploaded image
    const profileImgEdit = page.locator('img[alt="Profile Picture"]').first();
    await expect(profileImgEdit).toBeVisible();

    // 6. Verify in Dashboard
    await page.locator('a[href="/user-self/dashboard"]').first().click();
    await page.waitForURL('**/user-self/dashboard');
    await page.waitForTimeout(2000);
    const profileImgDashboard = page.locator('img[alt="Profile Picture"]').first();
    await expect(profileImgDashboard).toBeVisible();
  });
});
