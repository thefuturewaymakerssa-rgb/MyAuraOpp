import { createClient } from "@/utils/supabase/server";
import { profilesHub } from "@/lib/supabase-helpers";
import { redirect } from "next/navigation";
import { Database } from "@/lib/database.types";

export default async function UnifiedRoleRouter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const maker = await profilesHub.fetchById(user.id, supabase);

  if (!maker || !(maker as any).onboarded) {
    redirect("/onboarding");
  }

  const role = (maker as any).role;

  if (role === "employer") {
    redirect("/employer/hub");
  } else {
    // Default: talent/hustler/unset all go to talent dashboard
    redirect("/talent/dashboard");
  }
}
