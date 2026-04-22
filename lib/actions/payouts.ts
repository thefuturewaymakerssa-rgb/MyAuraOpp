import { createClient } from "@/utils/supabase/client";
import { Database } from "@/lib/database.types";

/**
 * Payout Logic for ShapaCV
 * Handles withdrawals to South African Mobile Money providers.
 */

export type Provider = "MTN MoMo" | "Vodacom mpesa";

export async function processPayout(userId: string, amount: number, provider: Provider, phoneNumber: string) {
  const supabase = createClient();

  // 1. Get user wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', userId)
    .single();

  if (walletError || !wallet) throw walletError || new Error("Wallet not found");

  // @ts-ignore
  if (wallet.balance < amount) {
    throw new Error("Insufficient balance for payout.");
  }

  // 2. Perform Transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    // @ts-ignore
    .insert({
      wallet_id: (wallet as any).id,
      type: 'withdrawal',
      amount: -amount,
      description: `Payout to ${provider} (${phoneNumber})`,
      status: 'pending'
    })
    .select()
    .single();

  if (txError || !transaction) throw txError || new Error("Transaction failed");

  // 3. Update Wallet Balance
  const { error: updateError } = await supabase
    .from('wallets')
    // @ts-ignore
    .update({ 
      balance: (wallet as any).balance - amount 
    })
    .eq('id', (wallet as any).id);

  if (updateError) throw updateError;

  // 4. Simulate External API Delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 5. Mark as completed
  await supabase
    .from('transactions')
    // @ts-ignore
    .update({ status: 'completed' })
    .eq('id', (transaction as any).id);

  return { success: true, transactionId: (transaction as any).id };
}
