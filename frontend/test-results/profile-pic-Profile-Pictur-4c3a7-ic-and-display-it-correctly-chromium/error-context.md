# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile-pic.spec.ts >> Profile Picture Update Flow >> should display dummy icon initially, upload profile pic, and display it correctly
- Location: e2e\profile-pic.spec.ts:7:7

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 120000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/user-self/profile" until "load"
  navigated to "http://localhost:3000/login"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]
  - alert [ref=e11]: NexClinic
  - navigation [ref=e13]:
    - generic [ref=e15]:
      - generic [ref=e16]:
        - link [ref=e17] [cursor=pointer]:
          - /url: /
          - img "NexClinic Logo" [ref=e18]
          - text: NexClinic
        - generic [ref=e19]:
          - link "News & Articles" [ref=e20] [cursor=pointer]:
            - /url: /news-articles
          - link "Help" [ref=e21] [cursor=pointer]:
            - /url: /help
      - button [ref=e23] [cursor=pointer]:
        - link "Are you a Doctor? Click here" [ref=e24]:
          - /url: /doctor/login
  - generic [ref=e25]:
    - img "background" [ref=e27]
    - generic [ref=e31]:
      - generic [ref=e32]:
        - img "NexClinic Logo" [ref=e34]
        - heading "NexClinic" [level=1] [ref=e35]
      - generic [ref=e36]:
        - generic [ref=e37]:
          - heading "Welcome Back" [level=2] [ref=e38]
          - paragraph [ref=e39]: Please sign in to your account
        - generic [ref=e40]:
          - generic [ref=e41]:
            - generic [ref=e42]: Email Address
            - textbox "Email Address" [ref=e44]:
              - /placeholder: Enter your email
          - generic [ref=e45]:
            - generic [ref=e46]: Password
            - generic [ref=e47]:
              - textbox "Password" [ref=e48]:
                - /placeholder: Enter your password
              - button [ref=e49] [cursor=pointer]
          - button "Sign In" [ref=e52] [cursor=pointer]
        - generic [ref=e53]:
          - paragraph [ref=e54]:
            - text: Forgot password?
            - link "Reset here" [ref=e55] [cursor=pointer]:
              - /url: /reset-password
          - paragraph [ref=e56]:
            - text: Don't have an account?
            - link "Sign up here" [ref=e57] [cursor=pointer]:
              - /url: /register
```

# Test source

```ts
  31  |               address: '',
  32  |               city: '',
  33  |               profileImage: ''
  34  |             },
  35  |             health: {
  36  |               bloodType: '',
  37  |               allergies: '',
  38  |               medications: '',
  39  |               medicalReports: '',
  40  |               medicalDocuments: '',
  41  |               medicalHistory: ''
  42  |             },
  43  |             emergencyContact: {
  44  |               name: '',
  45  |               phone: '',
  46  |               relation: '',
  47  |               email: ''
  48  |             }
  49  |           })
  50  |         });
  51  |       } else if (route.request().method() === 'PATCH') {
  52  |         // Mock PATCH response with a fake image URL
  53  |         await route.fulfill({
  54  |           status: 200,
  55  |           contentType: 'application/json',
  56  |           body: JSON.stringify({
  57  |             patient: {
  58  |               fullName: 'Test Patient',
  59  |               email: 'test@example.com',
  60  |               phone: '',
  61  |               dateOfBirth: '',
  62  |               gender: 'other',
  63  |               address: '',
  64  |               city: '',
  65  |               profileImage: 'https://via.placeholder.com/150'
  66  |             },
  67  |             health: {
  68  |               bloodType: '',
  69  |               allergies: '',
  70  |               medications: '',
  71  |               medicalReports: '',
  72  |               medicalDocuments: '',
  73  |               medicalHistory: ''
  74  |             },
  75  |             emergencyContact: {
  76  |               name: '',
  77  |               phone: '',
  78  |               relation: '',
  79  |               email: ''
  80  |             }
  81  |           })
  82  |         });
  83  |       } else {
  84  |         await route.continue();
  85  |       }
  86  |     });
  87  | 
  88  |     // Mock GET /api/patient/appointments
  89  |     await page.route('**/api/patient/appointments', async route => {
  90  |       if (route.request().method() === 'GET') {
  91  |         await route.fulfill({
  92  |           status: 200,
  93  |           contentType: 'application/json',
  94  |           body: JSON.stringify({
  95  |             appointments: []
  96  |           })
  97  |         });
  98  |       } else {
  99  |         await route.continue();
  100 |       }
  101 |     });
  102 | 
  103 |     // Mock GET /api/notifications*
  104 |     await page.route('**/api/notifications*', async route => {
  105 |       if (route.request().method() === 'GET') {
  106 |         await route.fulfill({
  107 |           status: 200,
  108 |           contentType: 'application/json',
  109 |           body: JSON.stringify([])
  110 |         });
  111 |       } else {
  112 |         await route.continue();
  113 |       }
  114 |     });
  115 | 
  116 |     await page.goto('/');
  117 |     await page.evaluate(() => {
  118 |       window.localStorage.setItem('authToken', 'mock-patient-token');
  119 |       window.localStorage.setItem('userRole', 'PATIENT');
  120 |       window.localStorage.setItem('userInfo', JSON.stringify({ fullName: 'Test Patient', email: 'test@example.com' }));
  121 |       window.localStorage.setItem('isAuthenticated', 'true');
  122 |     });
  123 | 
  124 |     // 2. Go to dashboard
  125 |     await page.locator('a[href="/user-self/dashboard"]').first().click();
  126 |     await page.waitForURL('**/user-self/dashboard');
  127 |     await page.waitForTimeout(2000);
  128 | 
  129 |     // 3. Go to profile page
  130 |     await page.locator('a[href="/user-self/profile"]').first().click();
> 131 |     await page.waitForURL('**/user-self/profile');
      |                ^ Error: page.waitForURL: Test timeout of 120000ms exceeded.
  132 |     await page.waitForTimeout(1000);
  133 | 
  134 |     // Click on Edit Profile
  135 |     await page.locator('a[href="/user-self/edit-profile"]').first().click();
  136 |     await page.waitForURL('**/user-self/edit-profile');
  137 |     await page.waitForTimeout(1000);
  138 | 
  139 |     // Check if the file input exists
  140 |     await page.waitForSelector('input[type="file"]', { state: 'attached' });
  141 |     
  142 |     // 4. Upload a new profile picture
  143 |     const testImagePath = path.join(__dirname, '..', '..', 'TestProfilePic', 'TestProfilePic.png');
  144 |     
  145 |     // Set the file to upload directly using the input
  146 |     await page.setInputFiles('input[type="file"]', testImagePath);
  147 | 
  148 |     // Click "Save Profile"
  149 |     await page.click('button:has-text("Save Profile")');
  150 | 
  151 |     // Wait for a few seconds to let upload finish
  152 |     await page.waitForTimeout(3000);
  153 | 
  154 |     // 5. Verify in Edit Profile page
  155 |     // The profile image should now be an <img> tag with src pointing to the uploaded image
  156 |     const profileImgEdit = page.locator('img[alt="Profile Picture"]').first();
  157 |     await expect(profileImgEdit).toBeVisible();
  158 | 
  159 |     // 6. Verify in Dashboard
  160 |     await page.locator('a[href="/user-self/dashboard"]').first().click();
  161 |     await page.waitForURL('**/user-self/dashboard');
  162 |     await page.waitForTimeout(2000);
  163 |     const profileImgDashboard = page.locator('img[alt="Profile Picture"]').first();
  164 |     await expect(profileImgDashboard).toBeVisible();
  165 |   });
  166 | });
  167 | 
```