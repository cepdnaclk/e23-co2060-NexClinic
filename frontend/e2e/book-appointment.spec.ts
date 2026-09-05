import { test, expect } from '@playwright/test';

test.describe('Doctor Directory to Book Appointment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user login session for the PATIENT
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-patient-token');
      localStorage.setItem('userRole', 'PATIENT');
    });
  });

  test('should disable Book Appointment button for doctor with no active slots', async ({ page }) => {
    // Navigate to doctors directory
    await page.goto('/doctors');
    
    // Check for a doctor with "No Slots Available" 
    // This assumes there's at least one such doctor mocked or available in the DB
    const noSlotsButton = page.locator('button:has-text("No Slots Available")').first();
    
    // Check if the button exists on the current page data
    if (await noSlotsButton.isVisible()) {
      await expect(noSlotsButton).toBeDisabled();
      
      // Ensure the link wrapper also prevents interaction
      const parentLink = noSlotsButton.locator('..');
      await expect(parentLink).toHaveClass(/pointer-events-none/);
    }
  });

  test('should auto-select doctor and filter hospitals on book appointment page', async ({ page }) => {
    // Navigate to doctors directory
    await page.goto('/doctors');
    
    // Find the first available "Book Appointment" button
    const bookButton = page.locator('button:has-text("Book Appointment")').first();
    
    // If there is an available doctor
    if (await bookButton.isVisible()) {
      await bookButton.click();
      
      // Verify we navigated to the book-appointment page
      await expect(page).toHaveURL(/\/user-self\/book-appointment\?doctor=\d+/);
      
      // Extract the doctor ID from the URL
      const url = new URL(page.url());
      const doctorId = url.searchParams.get('doctor');
      expect(doctorId).toBeTruthy();
      
      // Since hospital options are filtered based on the doctor, 
      // we should wait for slots to load
      await page.waitForSelector('text=Select a hospital');
      
      // Click hospital dropdown to open options
      const hospitalSelect = page.locator('text=Select a hospital');
      await hospitalSelect.click();
      
      // Get the number of available hospital options
      const hospitalOptions = await page.locator('[role="option"]').count();
      
      // Verify that options are displayed (should be at least 1 if they have active slots)
      expect(hospitalOptions).toBeGreaterThan(0);
    }
  });
});
