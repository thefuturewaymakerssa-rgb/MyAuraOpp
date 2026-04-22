import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contractId, reason, evidence_url } = await req.json();

    if (!contractId || !reason) {
      return NextResponse.json({ error: "Missing dispute details" }, { status: 400 });
    }

    // 1. Verify user is party to the contract
    const { data: contract, error: fetchErr } = await (supabase
      .from('contracts')
      .select('id, employer_id, maker_id, status')
      .eq('id', contractId)
      .single() as any);

    if (fetchErr || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.employer_id !== user.id && contract.maker_id !== user.id) {
      return NextResponse.json({ error: "Not a party to this contract" }, { status: 403 });
    }

    // 2. Insert into reports table (using as a temporary dispute ledger)
    const { error: reportErr } = await (supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_id: contract.employer_id === user.id ? contract.maker_id : contract.employer_id,
        reason: `DISPUTE: ${reason}`,
        status: 'pending',
        metadata: {
           contract_id: contractId,
           evidence_url: evidence_url || null,
           type: 'contract_dispute'
        }
      } as any) as any);

    if (reportErr) {
       logger.error("[Dispute Create] Report creation failed", reportErr);
       return NextResponse.json({ error: "Dispute logging failed" }, { status: 500 });
    }

    // 3. Update contract status to 'disputed' to freeze escrow
    await (supabase
      .from('contracts') as any)
      .update({ status: 'disputed' })
      .eq('id', contractId);

    // 4. Notify both parties
    const participants = [contract.employer_id, contract.maker_id];
    await Promise.all(participants.map(pId => 
       (supabase.from('notifications').insert({
          user_id: pId,
          type: 'dispute_opened',
          message: `Escrow frozen. A dispute has been opened for your contract. Support has been notified.`
       } as any) as any)
    ));

    logger.info(`[Dispute opened] Contract ${contractId} by ${user.id}`);

    return NextResponse.json({ message: "Dispute protocol initiated. Escrow frozen." });

  } catch (err: any) {
    logger.error("[Dispute Create] Internal Error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
