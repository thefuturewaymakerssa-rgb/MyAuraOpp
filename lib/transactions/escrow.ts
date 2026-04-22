import { createClient } from "@/utils/supabase/client";
import { Database } from "@/lib/database.types";

/**
 * Escrow Logic for ShapaCV
 * 
 * 1. Employer initiates payment.
 * 2. Funds are deducted from Employer balance.
 * 3. Funds are added to Maker's 'pending_balance'.
 * 4. Transaction is recorded as 'escrow'.
 * 5. Upon completion, funds move from 'pending_balance' to 'balance'.
 */

export async function initiateEscrow(walletId: string, jobId: string, amount: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('transactions')
    // @ts-ignore
    .insert({
      wallet_id: walletId,
      type: 'escrow',
      amount,
      description: `Escrow hold for Job: ${jobId}`,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function releaseEscrow(transactionId: string) {
  const supabase = createClient();

  // 1. Update transaction status
  const { error } = await supabase
    .from('transactions')
    // @ts-ignore
    .update({ status: 'completed' })
    .eq('id', transactionId);

  if (error) throw error;
  
  return { success: true };
}
