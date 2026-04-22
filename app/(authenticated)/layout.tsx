import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { profilesHub } from "@/lib/supabase-helpers";
import { NavWrapper } from "@/components/NavWrapper";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch the user's profile to confirm onboarding status
  const maker = await profilesHub.fetchById(user.id, supabase);
  
  // 2. Identify the current path via middleware headers
  const headerList = await headers();
  const currentPath = headerList.get('x-pathname') || "";

  // 3. If no record exists or not onboarded, redirect to onboarding 
  // (unless already on onboarding, but onboarding is outside this layout group)
  // We also MUST allow the studio record path since talent needs it TO onboard.
  const isStudioPage = currentPath.includes('/talent/studio/record');

  if (!isStudioPage && (!maker || !(maker as any).onboarded)) {
    redirect("/onboarding");
  }

  const role = (maker as any)?.role || "hustler";

  // 4. Server-side Role Shielding
  const isEmployerPath = currentPath.startsWith('/employer');
  const isTalentPath = currentPath.startsWith('/talent');

  if (role === 'employer' && isTalentPath) {
    redirect('/employer/hub');
  }
  
  if ((role === 'hustler' || role === 'talent') && isEmployerPath) {
    redirect('/talent/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#0F766E]/30 relative">
      <NavWrapper role={role} user={user}>
        {children}
      </NavWrapper>
    </div>
  );
}
