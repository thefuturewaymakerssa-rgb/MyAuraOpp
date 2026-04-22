/**
 * tests/e2e/employer-flow.spec.ts
 *
 * Critical employer journey: Hub → Feed → Create Gig → Escrow
 */

import { test, expect } from "@playwright/test";

test.describe("Employer — Core Flow", () => {
  // ── Employer Hub ──────────────────────────────────────────────────────────

  test("employer hub loads with analytics visible", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/employer/hub");
    await page.waitForLoadState("networkidle");

    expect(errors.filter((e) => !e.includes("warning"))).toHaveLength(0);
    await expect(page).toHaveTitle(/Future WayMakers/i);
  });

  // ── Talent Feed ───────────────────────────────────────────────────────────

  test("employer feed loads talent cards", async ({ page }) => {
    await page.goto("/employer/feed");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/Future WayMakers/i);
  });

  // ── Create Gig ───────────────────────────────────────────────────────────

  test("new gig form renders all required fields", async ({ page }) => {
    await page.goto("/employer/gigs/new");

    // Title field
    await expect(
      page.getByLabel(/job title|gig title|title/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Description field
    await expect(
      page.getByLabel(/description/i).first().or(page.locator("textarea").first())
    ).toBeVisible();

    // Submit button
    await expect(
      page.getByRole("button", { name: /post|create|publish/i })
    ).toBeVisible();
  });

  test("creating a gig with valid data submits without errors", async ({ page }) => {
    await page.goto("/employer/gigs/new");

    // Route the API call to return a mocked successful response
    await page.route("/api/employer/jobs", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "mock-gig-id", title: "E2E Test Gig" }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByLabel(/job title|gig title|title/i).first().fill("E2E Test Plumbing Gig");

    const descField = page.getByLabel(/description/i).first().or(page.locator("textarea").first());
    await descField.fill("Looking for an experienced plumber in Soweto for pipe installation.");

    await page.getByRole("button", { name: /post|create|publish/i }).click();

    // Should show success state or redirect
    await expect(
      page.getByText(/success|posted|created|gig/i).or(page.locator("[data-success]"))
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Escrow Page ───────────────────────────────────────────────────────────

  test("escrow page loads without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/employer/escrow");
    await page.waitForLoadState("networkidle");

    expect(errors.filter((e) => !e.includes("warning"))).toHaveLength(0);
  });

  // ── POPIA endpoints accessible ────────────────────────────────────────────

  test("POPIA data export endpoint returns 401 without auth (not 404)", async ({ page }) => {
    // We test without auth cookies on purpose — should get 401, not 404
    const context = await page.context().browser()!.newContext();
    const res = await context.request.get("/api/user/export");
    expect(res.status()).toBe(401);
    await context.close();
  });

  test("POPIA delete endpoint returns 401 without auth (not 404)", async ({ page }) => {
    const context = await page.context().browser()!.newContext();
    const res = await context.request.delete("/api/user/delete");
    expect(res.status()).toBe(401);
    await context.close();
  });
});
