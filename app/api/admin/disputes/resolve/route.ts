import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { contractsHub, notificationsHub, transactionsHub } from "@/lib/supabase-helpers";
import { logger } from "@/lib/logger";
import { z } from "zod";

/**
 * Admin Dispute Resolution API
 * Resolves a disputed contract in favour of either the maker or employer.
 *
 * Security:
 * 1. JWT auth via Authorization: Bearer token (validated against Supabase)
 * 2. Role check: caller must have role = 'admin'
 * 3. Zod schema validation on request body
 *
 * POST /api/admin/disputes/resolve
 */

// Admin client to bypass RLS for financial transfers
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Input Schema ─────────────────────────────────────────────
const ResolveSchema = z.object({
  contractId: z.string().uuid('contractId must be a valid UUID'),
  decision: z.enum(['maker', 'employer']),
  reason: z.string().min(10, 'reason must be at least 10 characters').max(500),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth — validate Bearer token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Admin role check
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      logger.warn('[Admin:Disputes] Non-admin access attempt', { userId: user.id });
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // 3. Zod validation
    const body = await req.json();
    const parsed = ResolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { contractId, decision, reason } = parsed.data;

    // 4. Fetch the contract
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // 5. Process decision
    if (decision === "maker") {
      await transactionsHub.processContractPayment(contract, supabaseAdmin);

      await notificationsHub.insert({
        user_id: contract.maker_id,
        message: `⚖️ Dispute Resolved In Your Favor: The bag for "${contract.title}" has been released. Reason: ${reason}`,
        type: "contract_update"
      }, supabaseAdmin);

      await notificationsHub.insert({
        user_id: contract.employer_id,
        message: `⚖️ Dispute Resolved: Admin released funds to the maker for "${contract.title}". Reason: ${reason}`,
        type: "contract_update"
      }, supabaseAdmin);

    } else {
      // decision === "employer"
      await contractsHub.cancel(contract.id, supabaseAdmin);

      await notificationsHub.insert({
        user_id: contract.maker_id,
        message: `⚖️ Dispute Resolved: "${contract.title}" was cancelled and refunded to the employer. Reason: ${reason}`,
        type: "contract_update"
      }, supabaseAdmin);

      await notificationsHub.insert({
        user_id: contract.employer_id,
        message: `⚖️ Dispute Resolved In Your Favor: You have been refunded for "${contract.title}". Reason: ${reason}`,
        type: "contract_update"
      }, supabaseAdmin);
    }

    logger.info('[Admin:Disputes] Resolved', { contractId, decision, adminId: user.id });
    return NextResponse.json({ success: true, message: `Resolved in favor of ${decision}` });

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("Admin Dispute Resolve API Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
