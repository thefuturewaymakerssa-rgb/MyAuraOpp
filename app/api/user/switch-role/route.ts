import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { roleSwitchRateLimiter } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

/**
 * Role Switch API — toggles user between 'employer' and 'hustler'.
 *
 * Security:
 * 1. Authentication (Supabase getUser)
 * 2. Rate limiting (Upstash Redis — 5 switches per 24 hours per user)
 *
 * No request body needed — role is determined by current profile state.
 * POST /api/user/switch-role
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createClient();
    let user = null;
    try {
      const { data: { user: foundUser } } = await supabase.auth.getUser();
      user = foundUser;
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Rate Limiting — prevent abuse (e.g., spamming role changes to game the system)
    let rateLimitResult;
    try {
      rateLimitResult = await roleSwitchRateLimiter.limit(user.id);
    } catch {
      logger.warn('[SwitchRole] Rate limiter unavailable — failing open');
      rateLimitResult = { success: true, limit: 5, remaining: 4, reset: Date.now() + 86400000 };
    }

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({ error: 'You have switched roles too many times today. Please try again tomorrow.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 3. Fetch current role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 4. Toggle role
    const newRole = profile.role === 'employer' ? 'hustler' : 'employer';

    const { error: updateError } = await (supabase.from('profiles') as any)
      .update({ role: newRole })
      .eq('id', user.id);

    if (updateError) throw updateError;

    logger.info('[SwitchRole] Role switched', { userId: user.id, from: profile.role, to: newRole });

    return NextResponse.json({
      role: newRole,
      remaining: rateLimitResult.remaining,
    });

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Error switching role', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
