import { createClient } from "@/utils/supabase/client";

/**
 * Declines a job application.
 */
export async function declineApplication(applicationId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await (supabase.from("job_applications") as any)
    .update({ status: 'rejected' })
    .eq('id', applicationId);
  
  if (error) throw error;
  return true;
}

/**
 * Accepts an application and auto-generates a contract.
 * Expects the raw job budget string (e.g. "R500" or "$100") and attempts to parse it to a number.
 */
export async function acceptApplication(
  applicationId: string, 
  jobId: string, 
  makerId: string, 
  jobTitle: string,
  jobDescription: string | null,
  jobBudgetSync: string | null
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Update application status
  const { error: updateError } = await (supabase.from("job_applications") as any)
    .update({ status: 'accepted' })
    .eq('id', applicationId);
  
  if (updateError) throw updateError;

  // 2. Parse price from budget string (strip non-numeric chars logic)
  let numericPrice = 0;
  if (jobBudgetSync) {
    const parsed = parseInt(jobBudgetSync.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed)) numericPrice = parsed;
  }

  // 3. Auto-generate contract
  const { data: contract, error: contractError } = await (supabase.from("contracts") as any)
    .insert({
      job_id: jobId,
      employer_id: user.id,
      maker_id: makerId,
      title: `Contract: ${jobTitle}`,
      description: jobDescription,
      price: numericPrice,
      status: 'active',
      escrow_funded: false
    })
    .select()
    .single();

  if (contractError) throw contractError;

  // 4. Update job status to filled
  await (supabase.from("jobs") as any)
     .update({ status: 'filled' })
     .eq('id', jobId);

  return contract;
}
