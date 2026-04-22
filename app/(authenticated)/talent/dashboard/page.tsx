import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { profilesHub,  walletsHub, contractsHub, notificationsHub  } from "@/lib/supabase-helpers";
import DashboardClient from "./DashboardClient";

export default async function MakerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/onboarding");
  }

  // Fetch initial data on the server
  const client = supabase; // Use the server client we just created
  const makerData = await profilesHub.fetchRich(user.id, client);

  if (!makerData) {
    redirect("/onboarding");
  }

  // Fetch save count
  const { count: saveCount } = await supabase
    .from("saved_makers")
    .select("*", { count: "exact", head: true })
    .eq("maker_id", makerData.id);

  // Fetch Personalized Opportunities
  const { data: opportunities } = await supabase
    .from("jobs")
    .select("*")
    .or(`trade.ilike.%${makerData.trade}%,location.ilike.%${makerData.location}%`)
    .limit(3);

  // Fetch Wallet Data
  const walletData = await walletsHub.fetchOwn(user.id, client);

  // Fetch Active Contracts
  const contracts = await contractsHub.fetchByMaker(user.id, client);

  // Fetch Notifications
  const notifications = await notificationsHub.fetchOwn(user.id, client);

  return (
    <DashboardClient 
      initialMaker={makerData}
      initialWallet={walletData}
      initialOpportunities={opportunities || []}
      initialSaveCount={saveCount || 0}
      initialContracts={contracts || []}
      initialNotifications={notifications || []}
    />
  );
}
