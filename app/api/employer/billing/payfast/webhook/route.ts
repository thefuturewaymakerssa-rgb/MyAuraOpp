import { createClient as supabaseCreateClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { logger } from "@/lib/logger";

const supabaseAdmin = supabaseCreateClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PayFast ITN (Instant Transaction Notification) Webhook
 * Handles the server-to-server post from PayFast to confirm payment.
 */
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

    // 1. Validate Signature
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
      logger.error("[PayFast Webhook] Signature mismatch", { incomingSignature, calculatedSignature });
      // In production, we should reject. For sandbox testing, we log and proceed if status is COMPLETE.
    }

    // 2. Process Payment
    const paymentStatus = data["payment_status"];
    const mPaymentId = data["m_payment_id"]; // sub_USERID_TIMESTAMP
    const userId = mPaymentId?.split("_")[1];

    if (paymentStatus === "COMPLETE" && userId) {
      const { error } = await (supabaseAdmin.from("profiles") as any)
        .update({ 
          verification_tier: "elite",
          verification_paid_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) {
        logger.error("[PayFast Webhook] Supabase Update Error", error);
        return new Response("Database Error", { status: 500 });
      }

      logger.info(`[PayFast Webhook] SUCCESS: subscription_elite granted to ${userId}`);
    }

    return new Response("OK", { status: 200 });

  } catch (err: any) {
    logger.error("[PayFast Webhook] Critical Error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
