import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { proofsHub } from "@/lib/supabase-helpers";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const { proof_id } = await req.json();

    if (!proof_id) {
      return NextResponse.json({ error: "Proof ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    let user = null;
    try {
      const { data: { user: foundUser } } = await supabase.auth.getUser();
      user = foundUser;
    } catch (authErr) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }
    
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Check ownership first
    const { data: proof, error: fetchError } = await supabase
      .from('proofs')
      .select('maker_id')
      .eq('id', proof_id)
      .single<{ maker_id: string }>();

    if (fetchError || !proof) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    if (proof.maker_id !== user.id) {
       return NextResponse.json({ error: "Forbidden: You do not own this proof" }, { status: 403 });
    }

    // 2. Use the central Hub for consistent DB and Storage deletion
    await proofsHub.delete(proof_id, supabase);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("Delete proof API error", error, { path: "/api/maker/delete-proof" });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
