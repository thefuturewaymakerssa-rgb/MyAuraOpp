import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { gzipSync } from 'zlib';

/**
 * Automated Daily Backup — Compressed & Offsite
 * Exports critical tables as gzip-compressed JSON to Supabase Storage.
 *
 * Schedule: 02:00 UTC daily (defined in vercel.json)
 * Security: Requires x-cron-secret header = CRON_SECRET env var
 * Storage: backups/<ISO-timestamp>/<table>.json.gz
 *
 * Pre-requisite: Create a 'backups' bucket in Supabase Storage (non-public).
 */

const TABLES = [
  'profiles',
  'wallets',
  'transactions',
  'contracts',
  'jobs',
  'consent_logs',
  'proofs',
] as const;

export async function POST(request: Request) {
  // ── Security Guard ──────────────────────────────────────────
  // Accepts both x-cron-secret (manual/CI) and Authorization: Bearer (Vercel native cron)
  const cronSecret =
    request.headers.get('x-cron-secret') ??
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Supabase Admin Client ────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── Pre-flight: verify backups bucket is accessible ──────────
  const { error: bucketError } = await supabase.storage.from('backups').list('', { limit: 1 });
  if (bucketError) {
    console.warn('[Backup] Bucket check failed — ensure "backups" bucket exists in Supabase Storage (private):', bucketError.message);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const results: Record<string, number | string> = {};

  // ── Export & compress each table ────────────────────────────
  for (const table of TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        results[table] = `error: ${error.message}`;
        console.error(`[Backup] Failed to fetch ${table}:`, error.message);
        continue;
      }

      // Gzip compress before upload (~5–10× size reduction)
      const jsonBuffer = Buffer.from(JSON.stringify(data, null, 0));
      const compressed = gzipSync(jsonBuffer);

      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(`${timestamp}/${table}.json.gz`, compressed, {
          contentType: 'application/gzip',
          upsert: true,
        });

      if (uploadError) {
        results[table] = `upload_error: ${uploadError.message}`;
        console.error(`[Backup] Failed to upload ${table}:`, uploadError.message);
      } else {
        results[table] = data?.length ?? 0;

      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results[table] = `exception: ${message}`;
      console.error(`[Backup] Exception on ${table}:`, message);
    }
  }

  const hasFailures = Object.values(results).some(v => typeof v === 'string');

  return NextResponse.json(
    {
      success: !hasFailures,
      timestamp,
      path: `backups/${timestamp}/`,
      results,
    },
    { status: hasFailures ? 207 : 200 }  // 207 Multi-Status if partial failures
  );
}
