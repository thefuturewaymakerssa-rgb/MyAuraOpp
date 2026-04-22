import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration — Future WayMakers
 *
 * Runs against a local dev server (or a deployed URL in CI).
 * All tests live in tests/e2e/
 *
 * Usage:
 *   npx playwright test              # run all E2E tests
 *   npx playwright test --ui         # open interactive UI runner
 *   npx playwright show-report       # view latest HTML report
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Sequential for auth-state dependency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ["html", { outputFolder: "tests/playwright-report", open: "never" }],
    ["list"],
  ],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Viewport matching a typical SA budget smartphone
    viewport: { width: 390, height: 844 },
  },

  projects: [
    // ── Setup: log in once and save auth state ───────────────────────────────
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // ── Main test suite (uses saved auth state) ──────────────────────────────
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
        storageState: "tests/e2e/.auth/talent.json",
      },
      dependencies: ["setup"],
    },

    // ── Employer flows ───────────────────────────────────────────────────────
    {
      name: "employer-flows",
      use: {
        ...devices["Pixel 7"],
        storageState: "tests/e2e/.auth/employer.json",
      },
      dependencies: ["setup"],
      testMatch: /.*employer.*/,
    },
  ],

  // Start Next.js dev server automatically in local runs
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
