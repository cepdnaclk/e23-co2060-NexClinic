# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\profile-pic.spec.ts >> Profile Picture Update Flow >> should display dummy icon initially, upload profile pic, and display it correctly
- Location: e2e\profile-pic.spec.ts:7:7

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('input[type="file"]')

```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - navigation [ref=f2e3]:
    - generic [ref=f2e5]:
      - generic [ref=f2e6]:
        - link [ref=f2e7] [cursor=pointer]:
          - /url: /
          - img "NexClinic Logo" [ref=f2e8]
          - text: NexClinic
        - generic [ref=f2e9]:
          - link "News & Articles" [ref=f2e10] [cursor=pointer]:
            - /url: /news-articles
          - link "Help" [ref=f2e11] [cursor=pointer]:
            - /url: /help
      - button [ref=f2e13] [cursor=pointer]:
        - link "Are you a Doctor? Click here" [ref=f2e14]:
          - /url: /doctor/login
  - generic [ref=f2e15]:
    - img "background" [ref=f2e17]
    - generic [ref=f2e21]:
      - generic [ref=f2e22]:
        - img "NexClinic Logo" [ref=f2e24]
        - heading "NexClinic" [level=1] [ref=f2e25]
        - paragraph [ref=f2e26]: Patient Portal Access
      - generic [ref=f2e27]:
        - generic [ref=f2e28]:
          - heading "Welcome Back" [level=2] [ref=f2e29]
          - paragraph [ref=f2e30]: Please sign in to your patient account
        - generic [ref=f2e31]:
          - generic [ref=f2e32]:
            - generic [ref=f2e33]: Email Address
            - textbox "Email Address" [ref=f2e35]:
              - /placeholder: Enter your email
          - generic [ref=f2e36]:
            - generic [ref=f2e37]: Password
            - generic [ref=f2e38]:
              - textbox "Password" [ref=f2e39]:
                - /placeholder: Enter your password
              - button [ref=f2e40] [cursor=pointer]
          - button "Sign In" [ref=f2e43] [cursor=pointer]
        - generic [ref=f2e44]:
          - paragraph [ref=f2e45]:
            - text: Forgot password?
            - link "Reset here" [ref=f2e46] [cursor=pointer]:
              - /url: /reset-password
          - paragraph [ref=f2e47]:
            - text: Don't have an account?
            - link "Sign up here" [ref=f2e48] [cursor=pointer]:
              - /url: /register
  - button "Open Next.js Dev Tools" [ref=f2e54] [cursor=pointer]
  - alert [ref=f2e58]
```

# Test source

```ts
  8   |     // 1. Setup mock auth
  9   |     await context.addCookies([
  10  |       { name: 'authToken', value: 'mock-patient-token', domain: 'localhost', path: '/' }
  11  |     ]);
  12  |     
  13  |     await page.goto('http://localhost:3000/');
  14  |     await page.evaluate(() => {
  15  |       localStorage.setItem('authToken', 'mock-patient-token');
  16  |       localStorage.setItem('userRole', 'PATIENT');
  17  |       localStorage.setItem('userInfo', JSON.stringify({ fullName: 'Test Patient', email: 'test@example.com', profile_picture: null }));
  18  |     });
  19  | 
  20  |     // Mock GET /api/patient/profile
  21  |     await page.route('**/api/patient/profile', async route => {
  22  |       if (route.request().method() === 'GET') {
  23  |         await route.fulfill({
  24  |           status: 200,
  25  |           contentType: 'application/json',
  26  |           body: JSON.stringify({
  27  |             patient: {
  28  |               fullName: 'Test Patient',
  29  |               email: 'test@example.com',
  30  |               phone: '',
  31  |               dateOfBirth: '',
  32  |               gender: 'other',
  33  |               address: '',
  34  |               city: '',
  35  |               profileImage: ''
  36  |             },
  37  |             health: {
  38  |               bloodType: '',
  39  |               allergies: '',
  40  |               medications: '',
  41  |               medicalReports: '',
  42  |               medicalDocuments: '',
  43  |               medicalHistory: ''
  44  |             },
  45  |             emergencyContact: {
  46  |               name: '',
  47  |               phone: '',
  48  |               relation: '',
  49  |               email: ''
  50  |             }
  51  |           })
  52  |         });
  53  |       } else if (route.request().method() === 'PATCH') {
  54  |         // Mock PATCH response with a fake image URL
  55  |         await route.fulfill({
  56  |           status: 200,
  57  |           contentType: 'application/json',
  58  |           body: JSON.stringify({
  59  |             patient: {
  60  |               fullName: 'Test Patient',
  61  |               email: 'test@example.com',
  62  |               phone: '',
  63  |               dateOfBirth: '',
  64  |               gender: 'other',
  65  |               address: '',
  66  |               city: '',
  67  |               profileImage: 'https://via.placeholder.com/150'
  68  |             },
  69  |             health: {
  70  |               bloodType: '',
  71  |               allergies: '',
  72  |               medications: '',
  73  |               medicalReports: '',
  74  |               medicalDocuments: '',
  75  |               medicalHistory: ''
  76  |             },
  77  |             emergencyContact: {
  78  |               name: '',
  79  |               phone: '',
  80  |               relation: '',
  81  |               email: ''
  82  |             }
  83  |           })
  84  |         });
  85  |       }
  86  |     });
  87  | 
  88  |     // Mock GET /api/patient/appointments
  89  |     await page.route('**/api/patient/appointments', async route => {
  90  |       await route.fulfill({
  91  |         status: 200,
  92  |         contentType: 'application/json',
  93  |         body: JSON.stringify({
  94  |           appointments: []
  95  |         })
  96  |       });
  97  |     });
  98  | 
  99  |     // 2. Go to dashboard
  100 |     await page.goto('http://localhost:3000/user-self/dashboard');
  101 |     await page.waitForTimeout(2000);
  102 | 
  103 |     // 3. Go to edit profile page
  104 |     await page.goto('http://localhost:3000/user-self/edit-profile');
  105 |     await page.waitForTimeout(1000);
  106 |     
  107 |     // Check if the file input exists
> 108 |     await page.waitForSelector('input[type="file"]', { state: 'attached' });
      |                ^ Error: page.waitForSelector: Test timeout of 120000ms exceeded.
  109 |     
  110 |     // 4. Upload a new profile picture
  111 |     const testImagePath = path.join(__dirname, '..', '..', 'TestProfilePic', 'TestProfilePic.png');
  112 |     
  113 |     // Set the file to upload directly using the input
  114 |     await page.setInputFiles('input[type="file"]', testImagePath);
  115 | 
  116 |     // Click "Save Profile"
  117 |     await page.click('button:has-text("Save Profile")');
  118 | 
  119 |     // Wait for a few seconds to let upload finish
  120 |     await page.waitForTimeout(3000);
  121 | 
  122 |     // 5. Verify in Edit Profile page
  123 |     // The profile image should now be an <img> tag with src pointing to the uploaded image
  124 |     const profileImgEdit = page.locator('img[alt="Profile Picture"]').first();
  125 |     await expect(profileImgEdit).toBeVisible();
  126 | 
  127 |     // 6. Verify in Dashboard
  128 |     await page.goto('http://localhost:3000/user-self/dashboard');
  129 |     await page.waitForTimeout(2000);
  130 |     const profileImgDashboard = page.locator('img[alt="Profile Picture"]').first();
  131 |     await expect(profileImgDashboard).toBeVisible();
  132 |   });
  133 | });
  134 | 
```