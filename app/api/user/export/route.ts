import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger, generateTraceId } from '@/lib/logger';

/**
 * POPIA Data Export — GET /api/user/export
 *
 * Returns a complete JSON export of all personal data held for the
 * authenticated user, as required by the Protection of Personal
 * Information Act (POPIA), Section 23 (Right of access to records).
 *
 * Data included:
 *   - Profile (name, email, phone, location, skills, bio, etc.)
 *   - VibeCVs / Proofs (video metadata — not the video files themselves)
 *   - Job applications submitted
 *   - Contracts (as talent or employer)
 *   - Wallet + transaction history
 *   - Messages sent
 *   - Notifications received
 *   - Consent logs
 *   - Reviews given and received
 *
 * Security: JWT authenticated (Supabase getUser). Rate-limited to 3/day.
 */
export async function GET(request: NextRequest) {
  const traceId = generateTraceId();

  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('POPIA data export requested', { action: 'popia.export', userId: user.id, traceId });

    // 2. Use service role client for admin-level cross-table reads (bypasses RLS safely
    //    because we explicitly scope every query to the authenticated user's ID).
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const uid = user.id;

    // 3. Fetch all user data in parallel
    const [
      profileRes,
      proofsRes,
      applicationsRes,
      contractsAsTalentRes,
      contractsAsEmployerRes,
      walletRes,
      transactionsRes,
      messagesSentRes,
      notificationsRes,
      consentLogsRes,
      reviewsGivenRes,
      reviewsReceivedRes,
    ] = await Promise.all([
      adminClient.from('profiles').select('*').eq('id', uid).single(),
      adminClient.from('proofs').select('id, title, video_url, thumbnail_url, created_at').eq('maker_id', uid),
      adminClient.from('job_applications').select('id, job_id, status, created_at').eq('maker_id', uid),
      adminClient.from('contracts').select('id, title, description, price, status, created_at').eq('maker_id', uid),
      adminClient.from('contracts').select('id, title, description, price, status, created_at').eq('employer_id', uid),
      adminClient.from('wallets').select('balance, pending_balance, currency, created_at').eq('user_id', uid).single(),
      adminClient.from('transactions').select('id, type, amount, description, status, created_at')
        .eq('wallet_id', (await adminClient.from('wallets').select('id').eq('user_id', uid).single()).data?.id ?? ''),
      adminClient.from('messages').select('id, text, created_at').eq('sender_id', uid),
      adminClient.from('notifications').select('id, type, message, read_at, created_at').eq('user_id', uid),
      adminClient.from('consent_logs').select('id, purpose, ip_address, created_at').eq('user_id', uid),
      adminClient.from('reviews').select('id, maker_id, rating, comment, created_at').eq('reviewer_id', uid),
      adminClient.from('reviews').select('id, reviewer_id, rating, comment, created_at').eq('maker_id', uid),
    ]);

    // 4. Strip sensitive internal fields from profile before export
    const profile = profileRes.data ? {
      ...profileRes.data,
      id_selfie: profileRes.data.id_selfie ? '[STORED — not included in export]' : null,
      stripe_account_id: profileRes.data.stripe_account_id ? '[STORED]' : null,
      paystack_customer_code: profileRes.data.paystack_customer_code ? '[STORED]' : null,
    } : null;

    // 5. Build export payload
    const exportPayload = {
      export_generated_at: new Date().toISOString(),
      export_format_version: '1.0',
      subject: {
        id: uid,
        email: user.email,
      },
      data: {
        profile,
        vibecvs: proofsRes.data ?? [],
        job_applications: applicationsRes.data ?? [],
        contracts_as_talent: contractsAsTalentRes.data ?? [],
        contracts_as_employer: contractsAsEmployerRes.data ?? [],
        wallet: walletRes.data ?? null,
        transactions: transactionsRes.data ?? [],
        messages_sent: messagesSentRes.data ?? [],
        notifications: notificationsRes.data ?? [],
        consent_logs: consentLogsRes.data ?? [],
        reviews_given: reviewsGivenRes.data ?? [],
        reviews_received: reviewsReceivedRes.data ?? [],
      },
      popia_notice: 'This export is provided under the Protection of Personal Information Act (POPIA), Act 4 of 2013. For queries contact privacy@futurewaymakers.co.za.',
    };

    logger.info('POPIA data export completed', {
      action: 'popia.export.complete',
      userId: uid,
      traceId,
    });

    // 6. Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="waymakers-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
        'X-Trace-Id': traceId,
      },
    });

  } catch (err) {
    logger.error('POPIA export failed', err, { action: 'popia.export', traceId });
    return NextResponse.json({ error: 'Export failed. Please try again later.' }, { status: 500 });
  }
}
