import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { profilesHub } from "@/lib/supabase-helpers";

export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const maker = await profilesHub.fetchById(user.id, supabase);
  const role = (maker as any)?.role;

  // ⛔ Employers must NOT access /talent/* routes — redirect to their hub
  if (role === "employer") {
    redirect("/employer/hub");
  }

  return (
    <div className="flex-1 w-full relative">
      {/* Background Grain Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0" />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
