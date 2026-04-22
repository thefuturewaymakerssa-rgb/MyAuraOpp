import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { profilesHub } from "@/lib/supabase-helpers";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const maker = await profilesHub.fetchById(user.id, supabase);
  const role = (maker as any)?.role;

  // ⛔ Only employers may access /employer/* routes
  if (role !== "employer") {
    redirect("/talent/dashboard");
  }

  return (
    <div className="flex-1 w-full relative">
      {/* Subtle Mesh Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] z-0" />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
