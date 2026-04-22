import { createClient as supabaseCreateClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { logger } from "@/lib/logger";

const supabaseAdmin = supabaseCreateClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const data: Record<string, string> = {};
    
    params.forEach((value, key) => {
      if (key !== "signature") {
        data[key] = value;
      }
    });

    const incomingSignature = params.get("signature");
    const passphrase = process.env.PAYFAST_PASSPHRASE;

    let pfParamString = "";
    params.forEach((value, key) => {
        if (key !== "signature") {
            pfParamString += `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}&`;
        }
    });

    let finalString = pfParamString.slice(0, -1);
    if (passphrase) {
      finalString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
    }

    const calculatedSignature = crypto.createHash("md5").update(finalString).digest("hex");

    if (incomingSignature !== calculatedSignature) {
      logger.error("[Escrow Webhook] Signature mismatch", { incomingSignature, calculatedSignature });
    }

    const paymentStatus = data["payment_status"];
    const mPaymentId = data["m_payment_id"]; // escrow_CONTRACTID

    if (!mPaymentId?.startsWith("escrow_")) {
       return new NextResponse("Invalid prefix", { status: 400 });
    }

    const contractId = mPaymentId.replace("escrow_", "");

    if (paymentStatus === "COMPLETE" && contractId) {
      const amountGross = Number(data["amount_gross"]);
      
      // Reverse calculation to log audit trails
      // Employer paid: Gig + ProcessingFee
      // Processing fee was roughly (Gig * 0.032) + 2
      // Let's approximate Gig = (amountGross - 2) / 1.032
      const estimatedGigValue = (amountGross - 2) / 1.032;
      const estimatedPlatformFee = estimatedGigValue * 0.03;
      const estimatedProcessingFee = amountGross - estimatedGigValue;

      // 1. Update Contract
      const { error } = await (supabaseAdmin.from("contracts") as any)
        .update({ 
          escrow_funded: true,
          status: "active"
        })
        .eq("id", contractId);

      // 1b. Audit Log (Financial Ledger Hardening)
      await (supabaseAdmin.from("analytics_events") as any).insert({
        event_name: 'financial_escrow_funded',
        metadata: {
          contract_id: contractId,
          amount_gross: amountGross,
          estimated_gig_value: estimatedGigValue.toFixed(2),
          platform_fee: estimatedPlatformFee.toFixed(2),
          processing_fee: estimatedProcessingFee.toFixed(2),
          currency: 'ZAR',
          gateway: 'payfast'
        }
      });

      if (error) {
        logger.error("[Escrow Webhook] Failed to update contract", error);
        return new NextResponse("DB Error", { status: 500 });
      }

      // 2. Fetch contract to find maker_id and trigger notification
      const { data: contract } = await (supabaseAdmin.from("contracts") as any)
         .select("maker_id, title")
         .eq("id", contractId)
         .single();

      if (contract?.maker_id) {
         await (supabaseAdmin.from("notifications") as any).insert({
            user_id: contract.maker_id,
            message: `Bag secured! Escrow funded for "${contract.title}". You can begin work.`,
            type: "contract_new"
         });
      }

      logger.info(`[Escrow Webhook] Contract ${contractId} fully funded.`);
    }

    return new NextResponse("OK", { status: 200 });

  } catch (err: any) {
    logger.error("[Escrow Webhook] Error", err);
    return new NextResponse("Server Error", { status: 500 });
  }
}
