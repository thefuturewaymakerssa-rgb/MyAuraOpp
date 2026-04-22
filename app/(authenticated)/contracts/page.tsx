import { createClient } from "@/utils/supabase/server";
import { profilesHub } from "@/lib/supabase-helpers";
import { redirect } from "next/navigation";

/**
 * /contracts — Role-based redirect.
 * Talent → /talent/contracts
 * Employer → /employer/contracts
 * Admin → /admin (or wherever)
 */
export default async function ContractsRedirectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await profilesHub.fetchById(user.id, supabase);

  if (!profile || !(profile as any).onboarded) {
    redirect("/onboarding");
  }

  const role = (profile as any).role;

  if (role === "employer") {
    redirect("/employer/contracts");
  } else if (role === "admin") {
    redirect("/admin");
  } else {
    redirect("/talent/contracts");
  }
}
