import { createClient } from "@/utils/supabase/server";
import { profilesHub, jobsHub, savedMakersHub } from "@/lib/supabase-helpers";
import { Database } from "@/lib/database.types";
import HubClient from "./HubClient";

export default async function EmployerHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { redirect } = await import("next/navigation");

  let currentUser = null;

  if (user) {
    // 1. Check if employer HAS completed onboarding (now tracked in makers table for all)
    const maker = await profilesHub.fetchById(user.id, supabase);
    currentUser = maker;
    
    if (!maker || !maker.onboarded) {
      redirect("/onboarding");
    }
  }

  // Fetch initial makers (public data)
  const makers = await profilesHub.fetchAll(supabase);

  let initialJobs: Database['public']['Tables']['jobs']['Row'][] = [];
  let initialSavedIds: string[] = [];

  if (user) {
    // Fetch employer's jobs
    initialJobs = await jobsHub.fetchForEmployer(user.id, supabase);

    // Fetch saved makers IDs using Hub
    const savedData = await savedMakersHub.fetchOwn(user.id, supabase);
    initialSavedIds = savedData?.map((s: { maker_id: string }) => s.maker_id) || [];
  }

  return (
    <HubClient 
      initialMakers={(makers as any[])} // Still need any for the complex join with proofs
      initialJobs={initialJobs}
      initialSavedIds={initialSavedIds}
      userId={user?.id ?? null}
      currentUser={currentUser}
    />
  );
}
