import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { contractsHub } from "@/lib/supabase-helpers";
import TalentContractsClient from "./TalentContractsClient";

export default async function TalentContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  let contracts = null;
  try {
    contracts = await contractsHub.fetchByMaker(user.id, supabase);
  } catch (err) {
    console.error("Error loading talent contracts:", err);
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Error loading contracts. Please try again later.</p>
      </div>
    );
  }

  return (
    <TalentContractsClient 
      initialContracts={contracts || []}
      userId={user.id}
    />
  );
}
