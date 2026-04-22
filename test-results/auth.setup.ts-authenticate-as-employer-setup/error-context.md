# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> authenticate as employer
- Location: tests\e2e\auth.setup.ts:44:6

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - link "Shapa Logo WayMakers. Future Proof Your Hustle" [ref=e4] [cursor=pointer]:
      - /url: /
      - img "Shapa Logo" [ref=e6]
      - generic [ref=e7]:
        - heading "WayMakers." [level=2] [ref=e8]
        - paragraph [ref=e9]: Future Proof Your Hustle
    - generic [ref=e10]:
      - generic [ref=e11]:
        - heading "Access The Gateway." [level=1] [ref=e12]:
          - text: Access
          - text: The Gateway.
        - paragraph [ref=e13]: Welcome back Boss. Welcome back Hustler. One simple entry to move your vision forward.
      - generic [ref=e14]:
        - button "Continue with Google" [ref=e16]:
          - img [ref=e17]
          - generic [ref=e23]: Continue with Google
        - paragraph [ref=e24]: 🔒 Secure OAuth Gateway Powered by Google
      - generic [ref=e25]:
        - paragraph [ref=e26]: 🚧 Dev/Test Login Bypass
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]: Email
            - textbox "Email" [ref=e30]:
              - /placeholder: Test Email
              - text: employer@test.waymakers.co.za
          - generic [ref=e31]:
            - generic [ref=e32]: Password
            - textbox "Password" [ref=e33]:
              - /placeholder: Test Password
              - text: TestPass123!
          - generic [ref=e34]: Invalid login credentials
          - button "Log In" [active] [ref=e35]
      - generic [ref=e36]:
        - paragraph [ref=e37]: Joining 50,000+ local WayMakers
        - generic [ref=e38]:
          - img "user" [ref=e40]
          - img "user" [ref=e42]
          - img "user" [ref=e44]
          - img "user" [ref=e46]
          - img "user" [ref=e48]
          - generic [ref=e49]: +50k
    - paragraph [ref=e50]:
      - text: Don't have a partner profile?
      - link "GET STARTED →" [ref=e51] [cursor=pointer]:
        - /url: /onboarding
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e57] [cursor=pointer]:
    - img [ref=e58]
  - alert [ref=e61]
```

# Test source

```ts
  1  | /**
  2  |  * tests/e2e/auth.setup.ts
  3  |  *
  4  |  * Runs once before all tests. Logs in as two test users (talent + employer)
  5  |  * and saves their auth cookies/localStorage so subsequent tests skip login.
  6  |  *
  7  |  * Required env vars (CI secrets):
  8  |  *   E2E_TALENT_EMAIL, E2E_TALENT_PASSWORD
  9  |  *   E2E_EMPLOYER_EMAIL, E2E_EMPLOYER_PASSWORD
  10 |  */
  11 | 
  12 | import { test as setup, expect } from "@playwright/test";
  13 | import path from "path";
  14 | 
  15 | const TALENT_AUTH_FILE = path.join(__dirname, ".auth/talent.json");
  16 | const EMPLOYER_AUTH_FILE = path.join(__dirname, ".auth/employer.json");
  17 | 
  18 | // ── Talent login setup ───────────────────────────────────────────────────────
  19 | 
  20 | setup("authenticate as talent", async ({ page }) => {
  21 |   const email = process.env.E2E_TALENT_EMAIL ?? "talent@test.waymakers.co.za";
  22 |   const password = process.env.E2E_TALENT_PASSWORD ?? "TestPass123!";
  23 | 
  24 |   await page.goto("/login?dev=true");
  25 |   await page.getByLabel(/email/i).fill(email);
  26 |   await page.getByLabel(/password/i).fill(password);
  27 |   await page.getByRole("button", { name: /log in/i }).click();
  28 | 
  29 |   // Check for immediate auth error to fail fast instead of hanging
  30 |   const errText = await page.locator("#dev-login-error").textContent({ timeout: 2000 }).catch(() => null);
  31 |   if (errText && errText.trim() !== "") {
  32 |     throw new Error(`Auth Setup Failed: ${errText}`);
  33 |   }
  34 | 
  35 |   // Wait for redirect to dashboard
  36 |   await page.waitForURL(/\/(talent\/dashboard|dashboard|feed)/, { timeout: 15_000 });
  37 |   await expect(page).not.toHaveURL(/login/);
  38 | 
  39 |   await page.context().storageState({ path: TALENT_AUTH_FILE });
  40 | });
  41 | 
  42 | // ── Employer login setup ─────────────────────────────────────────────────────
  43 | 
  44 | setup("authenticate as employer", async ({ page }) => {
  45 |   const email = process.env.E2E_EMPLOYER_EMAIL ?? "employer@test.waymakers.co.za";
  46 |   const password = process.env.E2E_EMPLOYER_PASSWORD ?? "TestPass123!";
  47 | 
  48 |   await page.goto("/login?dev=true");
  49 |   await page.getByLabel(/email/i).fill(email);
  50 |   await page.getByLabel(/password/i).fill(password);
  51 |   await page.getByRole("button", { name: /log in/i }).click();
  52 | 
  53 |   const errText = await page.locator("#dev-login-error").textContent({ timeout: 2000 }).catch(() => null);
  54 |   if (errText && errText.trim() !== "") {
  55 |     throw new Error(`Auth Setup Failed: ${errText}`);
  56 |   }
  57 | 
> 58 |   await page.waitForURL(/\/(employer|hub|feed)/, { timeout: 15_000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  59 |   await expect(page).not.toHaveURL(/login/);
  60 | 
  61 |   await page.context().storageState({ path: EMPLOYER_AUTH_FILE });
  62 | });
  63 | 
```