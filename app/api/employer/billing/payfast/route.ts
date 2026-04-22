import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { logger } from "@/lib/logger";

/**
 * PayFast Initiation API
 * Generates the signature and payment data for the R49/month Hirer Premium tier.
 * Redirects to PayFast Sandbox or Production based on PAYFAST_SANDBOX env.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merchant_id = process.env.PAYFAST_MERCHANT_ID || "10000100";
    const merchant_key = process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a";
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const return_url = `${baseUrl}/employer/hub?status=success`;
    const cancel_url = `${baseUrl}/employer/hub?status=cancel`;
    const notify_url = `${baseUrl}/api/employer/billing/payfast/webhook`;

    const data: Record<string, string> = {
      merchant_id,
      merchant_key,
      return_url,
      cancel_url,
      notify_url,
      name_first: user.email?.split('@')[0] || "Hirer",
      email_address: user.email || "",
      m_payment_id: `sub_${user.id}_${Date.now()}`,
      amount: "49.00",
      item_name: "Hirer Premium (Monthly)",
      subscription_type: "1", // Recurring
      billing_date: new Date().toISOString().split('T')[0],
      recurring_amount: "49.00",
      frequency: "3", // Monthly
      cycles: "0", // Infinite until cancelled
    };

    // Construct parameter string for signature
    let pfParamString = "";
    const keys = Object.keys(data).sort(); // PayFast expects sorted parameters? Actually they expect current order of fields usually, but sorted is safer if using a subset.
    
    // PayFast specific: The order matters if not mentioned otherwise, but usually alphabetical or specific sequence.
    // Standard PayFast sequence: merchant_id, merchant_key, return_url, cancel_url, notify_url, name_first, email_address, m_payment_id, amount, item_name, ...
    const sequence = ["merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url", "name_first", "email_address", "m_payment_id", "amount", "item_name", "subscription_type", "billing_date", "recurring_amount", "frequency", "cycles"];
    
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
    logger.error("[PayFast Init] Error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
