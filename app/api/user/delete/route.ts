import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger, generateTraceId } from '@/lib/logger';

/**
 * POPIA Account Deletion — DELETE /api/user/delete
 *
 * Performs a GDPR/POPIA-compliant soft-delete of the user's account:
 *
 * 1. Verifies the user is authenticated.
 * 2. Checks for active contracts — blocks deletion if funds are in escrow.
 * 3. Anonymises all personal data in-place (nulls PII fields).
 * 4. Deletes video proofs (metadata only — storage files require manual sweep).
 * 5. Signs the user out of Supabase Auth.
 * 6. Logs the deletion event to an audit trail.
 *
 * Why soft-delete (not hard-delete)?
 *   Financial records (transactions, contracts) must be retained for 5+ years
 *   under South African tax law (Income Tax Act, Section 73). We anonymise
 *   the user record rather than destroying it so the financial audit trail
 *   remains intact while the person's identity is removed.
 *
 * Security: JWT authenticated (Supabase getUser). POST body must contain
 *   { confirm: "DELETE MY ACCOUNT" } to prevent accidental deletions.
 */
export async function DELETE(request: NextRequest) {
  const traceId = generateTraceId();

  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Require explicit confirmation in request body
    let body: { confirm?: string } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Request body must be JSON with { "confirm": "DELETE MY ACCOUNT" }' },
        { status: 400 }
      );
    }

    if (body.confirm !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'To confirm deletion, send { "confirm": "DELETE MY ACCOUNT" } in the request body.' },
        { status: 400 }
      );
    }

    const uid = user.id;
    logger.info('POPIA account deletion initiated', { action: 'popia.delete', userId: uid, traceId });

    // 3. Use service-role client for cross-table operations
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Block deletion if user has active escrow contracts (funds at stake)
    const { data: activeContracts } = await adminClient
      .from('contracts')
      .select('id, status')
      .or(`maker_id.eq.${uid},employer_id.eq.${uid}`)
      .in('status', ['active', 'disputed']);

    if (activeContracts && activeContracts.length > 0) {
      logger.warn('POPIA delete blocked — active contracts exist', {
        action: 'popia.delete.blocked',
        userId: uid,
        traceId,
        contractCount: activeContracts.length,
      });
      return NextResponse.json(
        {
          error: 'Cannot delete account while you have active or disputed contracts. Please resolve all contracts first.',
          activeContracts: activeContracts.map((c) => c.id),
        },
        { status: 409 }
      );
    }

    // 5. Anonymise profile — null out all PII, preserve the row for financial audit trail
    const deletedAt = new Date().toISOString();
    await adminClient.from('profiles').update({
      name: '[Deleted User]',
      username: `deleted-${uid.slice(0, 8)}`,
      email: null,
      phone: null,
      bio: null,
      avatar_url: null,
      dob: null,
      location: null,
      province: null,
      city: null,
      township: null,
      latitude: null,
      longitude: null,
      id_selfie: null,
      gender: null,
      skills: null,
      trade: null,
      stripe_account_id: null,
      paystack_customer_code: null,
      updated_at: deletedAt,
    }).eq('id', uid);

    // 6. Delete video proof metadata (content was already user-generated public content)
    await adminClient.from('proofs').delete().eq('maker_id', uid);

    // 7. Delete messages, notifications, saved_makers (non-financial personal data)
    await Promise.all([
      adminClient.from('messages').delete().eq('sender_id', uid),
      adminClient.from('notifications').delete().eq('user_id', uid),
      adminClient.from('saved_makers').delete().or(`user_id.eq.${uid},maker_id.eq.${uid}`),
      adminClient.from('vouches').delete().or(`voucher_id.eq.${uid},maker_id.eq.${uid}`),
    ]);

    // 8. Log deletion to consent_logs for audit trail
    await adminClient.from('consent_logs').insert({
      user_id: uid,
      purpose: 'account_deletion_popia',
      ip_address: request.headers.get('x-forwarded-for') ?? null,
      created_at: deletedAt,
    });

    // 9. Sign out from Supabase Auth (invalidate session)
    await supabase.auth.signOut();

    // NOTE: Deleting the Supabase Auth user itself requires admin.deleteUser() which
    // is a separate service. This is deliberately deferred to a nightly cleanup job
    // to allow a 30-day recovery window (common GDPR/POPIA best practice).

    logger.info('POPIA account deletion completed', {
      action: 'popia.delete.complete',
      userId: uid,
      traceId,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your account has been anonymised. Personal data has been removed. Financial records are retained for legal compliance.',
        deletedAt,
      },
      { status: 200, headers: { 'X-Trace-Id': traceId } }
    );

  } catch (err) {
    logger.error('POPIA account deletion failed', err, { action: 'popia.delete', traceId });
    return NextResponse.json({ error: 'Deletion failed. Please contact privacy@futurewaymakers.co.za.' }, { status: 500 });
  }
}
