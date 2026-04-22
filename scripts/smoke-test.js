/**
 * scripts/smoke-test.js
 *
 * Future WayMakers — Production Smoke Test
 *
 * Verifies all critical external dependencies are reachable before deploying.
 * Run with: node scripts/smoke-test.js
 * Or via: npm run smoke-test
 *
 * Exit codes:
 *   0 = all checks passed
 *   1 = one or more checks failed
 */

 
const https = require('https');
const http = require('http');

// Load env from .env.local in development
try {
  require('dotenv').config({ path: '.env.local' });
} catch {
  // dotenv optional — in CI env vars come from the environment directly
}

const CHECKS = [];
let passed = 0;
let failed = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function check(name, fn) {
  CHECKS.push({ name, fn });
}

async function fetch_url(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { timeout: 8000, ...options }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ─── Check 1: Supabase REST API reachable ────────────────────────────────────

check('Supabase REST API', async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set');

  const res = await fetch_url(`${url}/rest/v1/`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
  });
  if (res.status !== 200 && res.status !== 401) {
    throw new Error(`Unexpected status: ${res.status}`);
  }
});

// ─── Check 2: Upstash Redis ping ─────────────────────────────────────────────

check('Upstash Redis', async () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL or TOKEN not set');

  const res = await fetch_url(`${url}/ping`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = JSON.parse(res.body);
  if (body.result !== 'PONG') throw new Error(`Unexpected Redis response: ${res.body}`);
});

// ─── Check 3: PayFast sandbox endpoint reachable ─────────────────────────────

check('PayFast sandbox', async () => {
  const res = await fetch_url('https://sandbox.payfast.co.za/eng/process', {
    method: 'HEAD',
  });
  // PayFast redirects or returns 200/302/405 — any response means it's reachable
  if (!res.status) throw new Error('No response from PayFast sandbox');
});

// ─── Check 4: OpenAI API key valid ───────────────────────────────────────────

check('OpenAI API key', async () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'sk-placeholder') {
    console.log('    ⚠️  OPENAI_API_KEY is a placeholder — skipping live check');
    return;
  }
  const res = await fetch_url('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (res.status === 401) throw new Error('OpenAI API key is invalid');
  if (res.status !== 200) throw new Error(`OpenAI returned ${res.status}`);
});

// ─── Check 5: PWA service worker file exists ─────────────────────────────────

check('PWA sw.js exists in /public', async () => {
  const fs = require('fs');
  const path = require('path');
  const swPath = path.join(__dirname, '../public/sw.js');
  if (!fs.existsSync(swPath)) {
    throw new Error('public/sw.js not found — run `npm run build` first');
  }
  const size = fs.statSync(swPath).size;
  if (size < 1000) throw new Error(`public/sw.js is too small (${size} bytes) — may be corrupt`);
});

// ─── Check 6: Offline page exists ────────────────────────────────────────────

check('Offline fallback page exists', async () => {
  const fs = require('fs');
  const path = require('path');
  const offlinePath = path.join(__dirname, '../app/~offline/page.tsx');
  if (!fs.existsSync(offlinePath)) {
    throw new Error('app/~offline/page.tsx not found');
  }
});

// ─── Check 7: manifest.json valid ────────────────────────────────────────────

check('PWA manifest.json valid', async () => {
  const fs = require('fs');
  const path = require('path');
  const manifestPath = path.join(__dirname, '../public/manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error('public/manifest.json not found');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const required = ['name', 'short_name', 'start_url', 'display', 'icons'];
  for (const field of required) {
    if (!manifest[field]) throw new Error(`manifest.json missing required field: ${field}`);
  }
  if (!manifest.icons.some((i) => i.sizes?.includes('512'))) {
    throw new Error('manifest.json must have a 512x512 icon');
  }
});

// ─── Check 8: Required env vars present ──────────────────────────────────────

check('Required environment variables', async () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'PAYFAST_MERCHANT_ID',
    'PAYFAST_MERCHANT_KEY',
    'CRON_SECRET',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
});

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🔍 Future WayMakers — Smoke Test\n');
  console.log(`   Running ${CHECKS.length} checks...\n`);

  for (const { name, fn } of CHECKS) {
    try {
      await fn();
      console.log(`   ✅  ${name}`);
      passed++;
    } catch (err) {
      console.error(`   ❌  ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'─'.repeat(45)}`);
  console.log(`   ${passed} passed · ${failed} failed\n`);

  if (failed > 0) {
    console.error('🔴 Smoke test FAILED — resolve the above issues before deploying.\n');
    process.exit(1);
  } else {
    console.log('🟢 All smoke tests passed — ready to deploy.\n');
    process.exit(0);
  }
}

run();
