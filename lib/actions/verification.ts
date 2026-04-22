import { createClient } from "@/utils/supabase/client";
import { Database } from "@/lib/database.types";
import { VerificationTier } from "@/components/VerificationBadge";

/**
 * Verification & Reliability Logic for ShapaCV
 * 
 * This module handles the automated progression of talent tiers 
 * and the calculation of reliability scores based on user interactions.
 */

export async function vouchForMaker(makerId: string) {
  const supabase = createClient();

  // 1. Get current reliability score and tier
  const { data: maker, error: fetchError } = await supabase
    .from('makers')
    .select('reliability_score, verification_tier, identity_verified')
    .eq('id', makerId)
    .single();

  if (fetchError || !maker) throw fetchError || new Error("Maker not found");

  // @ts-ignore
  const currentScore = Number(maker.reliability_score) || 0;
  const newScore = Math.min(5.0, currentScore + 0.1);

  // 3. Check for Tier Promotion
  // @ts-ignore
  let newTier = maker.verification_tier as VerificationTier;
  
  // @ts-ignore
  if (newTier === 'basic' && newScore >= 4.0) {
    newTier = 'trusted';
  } else if (newTier === 'trusted' && (maker as any).identity_verified && newScore >= 4.8) {
    newTier = 'verified';
  }

  // 4. Update Maker
  const { error: updateError } = await supabase
    .from('makers')
    // @ts-ignore
    .update({
      reliability_score: newScore,
      verification_tier: newTier
    } as any)
    .eq('id', makerId);

  if (updateError) throw updateError;

  return { newScore, newTier };
}

export async function checkProStatus(makerId: string) {
  const supabase = createClient();

  // Pro status requires 10+ completed gigs (simulated check)
  const { data: apps, error: appError } = await supabase
    .from('job_applications')
    .select('id')
    .eq('maker_id', makerId)
    .eq('status', 'completed');

  if (appError) throw appError;

  if (apps && (apps as any[]).length >= 10) {
    const { error: updateError } = await supabase
      .from('makers')
      // @ts-ignore
      .update({ verification_tier: 'pro' } as any)
      .eq('id', makerId);
    
    if (updateError) throw updateError;
    return true;
  }

  return false;
}
