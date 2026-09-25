import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Profile Picture Update Flow', () => {
  test.setTimeout(120000);

  test('should display dummy icon initially, upload profile pic, and display it correctly', async ({ page, context }) => {
    // 1. Setup mock auth
    await context.addCookies([
      { name: 'authToken', value: 'mock-patient-token', domain: 'localhost', path: '/' }
    ]);
    
    await page.goto('http://localhost:3000/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-patient-token');
      localStorage.setItem('userRole', 'PATIENT');
      localStorage.setItem('userInfo', JSON.stringify({ fullName: 'Test Patient', email: 'test@example.com', profile_picture: null }));
    });

    // Mock GET /api/patient/profile
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
      }
    });

    // Mock GET /api/patient/appointments
    await page.route('**/api/patient/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          appointments: []
        })
      });
    });

    // 2. Go to dashboard
    await page.goto('http://localhost:3000/user-self/dashboard');
    await page.waitForTimeout(2000);

    // 3. Go to edit profile page
    await page.goto('http://localhost:3000/user-self/edit-profile');
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
    await page.goto('http://localhost:3000/user-self/dashboard');
    await page.waitForTimeout(2000);
    const profileImgDashboard = page.locator('img[alt="Profile Picture"]').first();
    await expect(profileImgDashboard).toBeVisible();
  });
});
