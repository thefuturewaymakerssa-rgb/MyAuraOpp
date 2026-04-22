import { createClient } from "@/utils/supabase/server";
import { transactionsHub, notificationsHub } from "@/lib/supabase-helpers";
import { NextResponse } from "next/server";

/**
 * Trigger this endpoint every 24 hours via Cron (e.g., Vercel Cron / GitHub Actions)
 * Logic: Auto-completes contracts in 'delivered' status for > 7 days.
 *
 * Security: Requires x-cron-secret header matching CRON_SECRET env var.
 * Generate secret: openssl rand -hex 32
 */
export async function GET(request: Request) {
  // 1. Strict CRON_SECRET guard — accepts both:
  //    - x-cron-secret header (manual curl / GitHub Actions)
  //    - Authorization: Bearer (Vercel's native cron injection)
  const cronSecret =
    request.headers.get('x-cron-secret') ??
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();
  const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 2. Find eligible contracts: 
    // Status = 'delivered' AND updated_at < SEVEN_DAYS_AGO
    const { data: contracts, error } = await (supabase
      .from('contracts') as any)
      .select('*')
      .eq('status', 'delivered')
      .lt('updated_at', SEVEN_DAYS_AGO);

    if (error) throw error;
    if (!contracts || (contracts as any[]).length === 0) {
      return NextResponse.json({ message: "No contracts ready for auto-release." });
    }

    const results = [];

    // 3. Process each contract
    for (const contract of (contracts as any[])) {
      try {
        // Atomic release logic (includes fee deduction)
        await transactionsHub.processContractPayment(contract, supabase);

        // Notify both parties
        await notificationsHub.insert({
          user_id: contract.maker_id,
          message: `⌛ Auto-Release: The contract "${contract.title}" was auto-completed as 7 days passed since delivery.`,
          type: 'contract_update'
        }, supabase);

        await notificationsHub.insert({
          user_id: contract.employer_id,
          message: `⌛ Auto-Release: The contract "${contract.title}" was auto-completed as 7 days passed since delivery.`,
          type: 'contract_update'
        }, supabase);

        results.push({ id: contract.id, status: 'success' });
      } catch (err) {
        console.error(`Failed to auto-release contract ${contract.id}:`, err);
        results.push({ id: contract.id, status: 'failed', error: String(err) });
      }
    }

    return NextResponse.json({ 
      processed: contracts.length,
      results 
    });

  } catch (err) {
    console.error("Cron Job Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
