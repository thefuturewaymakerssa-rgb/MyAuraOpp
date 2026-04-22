"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Promotes a maker to "Featured" status for 7 days.
 * In a real app, this would be preceded by a successful payment gateway callback.
 */
export async function promoteMaker(makerId: string) {
  const supabase = await createClient();
  
  // Calculate expiry (7 days from now)
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + 7);

  const { error } = await (supabase
    .from("makers") as any)
    .update({ 
      featured_until: featuredUntil.toISOString() 
    })
    .eq("id", makerId);

  if (error) {
    console.error("Promotion Error:", error.message || error);
    throw new Error(`Failed to promote maker: ${error.message}`);
  }

  revalidatePath("/discovery");
  revalidatePath("/talent/dashboard");
  revalidatePath(`/talent/${makerId}`);

  return { success: true, expiry: featuredUntil.toISOString() };
}

/**
 * Checks if a maker is currently featured.
 */
export async function isFeatured(makerId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("makers") as any)
    .select("featured_until")
    .eq("id", makerId)
    .single();

  if (error || !data?.featured_until) return false;

  const expiry = new Date(data.featured_until as string);
  return expiry > new Date();
}

/**
 * Promotes a gig (job) to "Featured" status.
 */
export async function featureGig(jobId: string) {
  const supabase = await createClient();
  
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + 7);

  const { error } = await (supabase
    .from("jobs") as any)
    .update({ 
      featured_until: featuredUntil.toISOString() 
    })
    .eq("id", jobId);

  if (error) {
    console.error("Gig Promotion Error:", error.message || error);
    throw new Error(`Failed to feature gig: ${error.message}`);
  }

  revalidatePath("/gigs");
  revalidatePath("/employer/hub");

  return { success: true, expiry: featuredUntil.toISOString() };
}

/**
 * Processes a verification fee payment (R20).
 */
export async function payVerificationFee(makerId: string) {
  const supabase = await createClient();
  
  const { error } = await (supabase
    .from("makers") as any)
    .update({ 
      verification_paid_at: new Date().toISOString(),
      verification_tier: 'trusted' // Instant upgrade to trusted upon payment
    })
    .eq("id", makerId);

  if (error) {
    console.error("Verification Fee Error:", error.message || error);
    throw new Error(`Failed to process verification fee: ${error.message}`);
  }

  revalidatePath("/talent/dashboard");
  revalidatePath(`/talent/${makerId}`);

  return { success: true };
}

/**
 * Processes a gig listing fee (R200 - R500).
 * In a real app, the amount would be dynamic based on the package selected.
 */
export async function payForGigListing(jobId: string, amount: number = 200) {
  const supabase = await createClient();
  
  const { error } = await (supabase
    .from("jobs") as any)
    .update({ 
      payment_status: 'paid',
      payment_amount: amount,
      status: 'open' // Activate the gig upon payment
    })
    .eq("id", jobId);

  if (error) {
    console.error("Gig Payment Error:", error.message || error);
    throw new Error(`Failed to process gig payment: ${error.message}`);
  }

  revalidatePath("/gigs");
  revalidatePath("/employer/hub");

  return { success: true };
}
