import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contractId, amount, itemName } = await req.json();

    if (!contractId || !amount) {
      return NextResponse.json({ error: "Missing contract details" }, { status: 400 });
    }

    // --- FEE HARDENING (2026 SURVIVAL BLUEPRINT) ---
    const gigAmount = Number(amount);
    const platformFee = gigAmount * 0.03; // 3% ShapaCV Success Fee
    const payfastProcessingFee = (gigAmount * 0.032) + 2.0; // Conservative CC fee logic
    const totalEscrowAmount = gigAmount + payfastProcessingFee; 
    
    // The "On-Top" Platform Fee (3%) is deducted from the talent payout later, 
    // but the employer handles the PayFast fee on top of the gig amount.
    // So if gig is R1000, Total = R1034. Talent gets R970.

    const merchant_id = process.env.PAYFAST_MERCHANT_ID || "10000100";
    const merchant_key = process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a";
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const return_url = `${baseUrl}/employer/escrow/new?maker_id=${user.id}&status=success&contract_id=${contractId}`;
    const cancel_url = `${baseUrl}/employer/escrow/new?maker_id=${user.id}&status=cancel`;
    const notify_url = `${baseUrl}/api/employer/escrow/payfast/webhook`;

    // Make sure amount is formatted as "X.00"
    const formattedAmount = totalEscrowAmount.toFixed(2);

    logger.info(`[PayFast Escrow] Processing Fee: R${payfastProcessingFee.toFixed(2)}, Expected Platform Fee: R${platformFee.toFixed(2)}`);

    const data: Record<string, string> = {
      merchant_id,
      merchant_key,
      return_url,
      cancel_url,
      notify_url,
      name_first: user.email?.split('@')[0] || "Hirer",
      email_address: user.email || "",
      m_payment_id: `escrow_${contractId}`,
      amount: formattedAmount,
      item_name: itemName || `Escrow Deposit (incl. R${payfastProcessingFee.toFixed(2)} proc. fee)`,
    };

    let pfParamString = "";
    const sequence = ["merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url", "name_first", "email_address", "m_payment_id", "amount", "item_name"];
    
    sequence.forEach((key) => {
      if (data[key] !== undefined && data[key] !== "") {
        pfParamString += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, "+")}&`;
      }
    });

    let finalString = pfParamString.slice(0, -1);
    if (passphrase) {
      finalString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
    }

    const signature = crypto.createHash("md5").update(finalString).digest("hex");
    data["signature"] = signature;

    const url = process.env.PAYFAST_SANDBOX === "true" 
      ? "https://sandbox.payfast.co.za/eng/process" 
      : "https://www.payfast.co.za/eng/process";

    return NextResponse.json({ url, data });

  } catch (err: any) {
    logger.error("[Escrow PayFast Init] Error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
