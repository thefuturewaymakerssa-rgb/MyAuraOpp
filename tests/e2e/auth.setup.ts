/**
 * tests/e2e/auth.setup.ts
 *
 * Runs once before all tests. Logs in as two test users (talent + employer)
 * via the Supabase API directly (bypassing Google OAuth UI) and saves 
 * their auth cookies so subsequent tests skip login.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   E2E_TALENT_EMAIL, E2E_TALENT_PASSWORD
 *   E2E_EMPLOYER_EMAIL, E2E_EMPLOYER_PASSWORD
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const TALENT_AUTH_FILE = path.join(__dirname, ".auth/talent.json");
const EMPLOYER_AUTH_FILE = path.join(__dirname, ".auth/employer.json");

// Helper to authenticate via API and set cookies
async function authenticateViaApi(page: any, email: string, password: string, storageFile: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables missing. Ensure .env.local is loaded in Playwright.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw new Error(`Failed to authenticate ${email} via API: ${error?.message || 'No session returned'}`);
  }

  // To set cookies for the Next.js app, Playwright needs to navigate to the domain first
  await page.goto("/");

  const projectId = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectId}-auth-token`;

  // Supabase SSR expects the session stringified in cookies.
  // Note: For large sessions, SSR splits cookies into chunks (e.g. .0, .1).
  // Here we set the base cookie which handles most standard sessions.
  const sessionData = JSON.stringify(data.session);
  
  await page.context().addCookies([
    {
      name: cookieName,
      value: encodeURIComponent(sessionData),
      domain: new URL(page.url()).hostname,
      path: "/",
      sameSite: "Lax",
      secure: false // Set to true if testing against https locally
    }
  ]);

  // Save the authenticated state
  await page.context().storageState({ path: storageFile });
}

// ── Talent login setup ───────────────────────────────────────────────────────
setup("authenticate as talent", async ({ page }) => {
  const email = process.env.E2E_TALENT_EMAIL ?? "talent@test.waymakers.co.za";
  const password = process.env.E2E_TALENT_PASSWORD ?? "TestPass123!";
  await authenticateViaApi(page, email, password, TALENT_AUTH_FILE);
});

// ── Employer login setup ─────────────────────────────────────────────────────
setup("authenticate as employer", async ({ page }) => {
  const email = process.env.E2E_EMPLOYER_EMAIL ?? "employer@test.waymakers.co.za";
  const password = process.env.E2E_EMPLOYER_PASSWORD ?? "TestPass123!";
  await authenticateViaApi(page, email, password, EMPLOYER_AUTH_FILE);
});
