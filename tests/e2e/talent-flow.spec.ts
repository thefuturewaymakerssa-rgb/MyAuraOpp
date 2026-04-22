/**
 * tests/e2e/talent-flow.spec.ts
 *
 * Critical talent journey: Dashboard → Studio (upload) → Gig browse → Apply
 *
 * Acceptance criteria (Sprint 6.1):
 *   ✓ Dashboard loads with wallet balance visible
 *   ✓ Studio page renders and file input is accessible
 *   ✓ Upload triggers progress indicator (mocked file)
 *   ✓ Gig feed loads with at least a loading state
 *   ✓ Gig detail page opens and Apply button is present
 *   ✓ Offline page renders correctly when SW serves it
 */

import { test, expect } from "@playwright/test";

test.describe("Talent — Core Flow", () => {
  // ── Dashboard ──────────────────────────────────────────────────────────────

  test("dashboard loads and shows wallet section", async ({ page }) => {
    await page.goto("/talent/dashboard");
    await expect(page).toHaveTitle(/Future WayMakers/i);

    // Wallet balance area should be visible (actual value will vary)
    await expect(
      page.getByText(/wallet|balance|R\s*\d/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Vibe Studio ──────────────────────────────────────────────────────────

  test("vibe studio page renders and file upload input is accessible", async ({ page }) => {
    await page.goto("/talent/studio");

    await expect(page.getByText(/show your skill/i)).toBeVisible({ timeout: 10_000 });

    // The hidden file input must exist in the DOM (used by the upload button)
    const fileInput = page.locator('input[type="file"][accept*="video"]');
    await expect(fileInput).toBeAttached();
  });

  test("uploading a video file triggers the progress indicator", async ({ page }) => {
    await page.goto("/talent/studio");

    // Route /api/upload to return a mock success response instantly
    await page.route("/api/upload", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "https://storage.supabase.co/proofs/test-video.webm",
          path: "test-user/test-video.webm",
          remainingUploads: 7,
        }),
      });
    });

    // Simulate file selection
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-vibecv.webm",
      mimeType: "video/webm",
      buffer: Buffer.from("fake-video-content"),
    });

    // Progress indicator should appear
    await expect(page.getByText(/transmitting|uploading|processing/i)).toBeVisible({
      timeout: 5_000,
    });

    // Success state should show
    await expect(page.getByText(/vibe captured|success/i)).toBeVisible({ timeout: 10_000 });
  });

  // ── Gig Feed ─────────────────────────────────────────────────────────────

  test("gigs page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/gigs");
    await page.waitForLoadState("networkidle");

    // Should not have crashed
    expect(errors.filter((e) => !e.includes("warning"))).toHaveLength(0);

    // Page title should be correct
    await expect(page).toHaveTitle(/Future WayMakers/i);
  });

  // ── Gig Application ───────────────────────────────────────────────────────

  test("gig detail page has an apply button", async ({ page }) => {
    await page.goto("/gigs");

    // Click the first gig link
    const firstGigLink = page.getByRole("link", { name: /apply|view|details/i }).first();
    const count = await firstGigLink.count();

    if (count === 0) {
      // No gigs in test env — acceptable empty state
      test.skip();
      return;
    }

    await firstGigLink.click();
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /apply/i }).or(page.getByRole("link", { name: /apply/i }))
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── Offline Page ──────────────────────────────────────────────────────────

  test("offline page renders correctly", async ({ page }) => {
    await page.goto("/~offline");
    await expect(page.getByText(/link severed|offline|dead zone/i)).toBeVisible();
    await expect(page.locator("#offline-retry-btn")).toBeVisible();
  });

  // ── PWA Manifest ─────────────────────────────────────────────────────────

  test("manifest.json is valid and reachable", async ({ page }) => {
    const response = await page.request.get("/manifest.json");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
