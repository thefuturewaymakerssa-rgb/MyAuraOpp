/**
 * lib/config.ts
 *
 * Centralised environment configuration with Zod validation.
 * The app will throw a descriptive error at startup if any required
 * variable is missing or malformed — preventing silent misconfigurations.
 *
 * Usage (server-side only):
 *   import { config } from '@/lib/config';
 *   const url = config.SUPABASE_URL;
 */

import { z } from 'zod';

// ─── Schema ───────────────────────────────────────────────────────────────────

const configSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(10, 'UPSTASH_REDIS_REST_TOKEN is required'),

  // PayFast
  PAYFAST_MERCHANT_ID: z.string().min(1, 'PAYFAST_MERCHANT_ID is required'),
  PAYFAST_MERCHANT_KEY: z.string().min(1, 'PAYFAST_MERCHANT_KEY is required'),
  PAYFAST_PASSPHRASE: z.string().min(1, 'PAYFAST_PASSPHRASE is required'),

  // OpenAI
  OPENAI_API_KEY: z.string().min(10, 'OPENAI_API_KEY is required'),

  // Cron auth secret
  CRON_SECRET: z.string().min(10, 'CRON_SECRET is required'),

  // Runtime
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

// ─── Validation ───────────────────────────────────────────────────────────────

type Config = z.infer<typeof configSchema>;

function validateConfig(): Config {
  // Skip strict validation during Next.js build (dummy values used in CI)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return process.env as unknown as Config;
  }

  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((e) => `  ✗ ${String(e.path.join('.'))}: ${e.message}`)
      .join('\n');

    throw new Error(
      `\n\n🔴 Future WayMakers — Environment Configuration Error\n` +
      `The following required environment variables are missing or invalid:\n\n` +
      missing +
      `\n\nCopy .env.example → .env.local and fill in the values.\n`
    );
  }

  return result.data;
}

// ─── Export ───────────────────────────────────────────────────────────────────

// Evaluated once per server process — throws immediately if invalid
export const config: Config = validateConfig();
