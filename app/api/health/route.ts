import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Health Check Endpoint
 * Returns real database connectivity status + latency.
 * Used by hosting platforms, uptime monitors, and load balancers.
 * GET /api/health
 */
export async function GET() {
  const start = Date.now();

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.from('profiles').select('id').limit(1);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
      environment: process.env.NODE_ENV,
      latency_ms: Date.now() - start,
      database: error ? 'degraded' : 'healthy',
    });
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - start,
        error: 'db_unreachable',
      },
      { status: 503 }
    );
  }
}
