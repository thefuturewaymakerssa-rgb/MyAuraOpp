import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { profilesHub } from "@/lib/supabase-helpers";

export default async function GigsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const maker = await profilesHub.fetchById(user.id, supabase);
  const role = (maker as any)?.role;

  // ⛔ Employers search for talent, not gigs — redirect to their hub
  if (role === "employer") {
    redirect("/employer/hub");
  }

  return <>{children}</>;
}
