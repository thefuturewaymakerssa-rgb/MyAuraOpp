import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import VibeFeedClient from "./VibeFeedClient";

export default async function VibeFeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all makers who are hustlers and have proofs
  const { data: makers, error } = await supabase
    .from('profiles')
    .select('*, proofs(*)')
    .in('role', ['hustler', 'freshie', 'graduate', 'reskiller']);

  if (error) {
    console.error("Error fetching makers for feed:", error);
  }

  // Flatten logic: Create a feed item for each proof 
  // Wait, typescript type for makers is any, but we know it has proofs
  const feedItems = (makers || []).flatMap((maker: any) => {
    if (!maker.proofs || maker.proofs.length === 0) return [];
    return maker.proofs.map((proof: any) => ({
      id: proof.id,
      makerId: maker.id,
      makerName: maker.name,
      makerAvatar: maker.avatar_url,
      makerTrade: maker.trade,
      makerLocation: maker.location,
      makerVerified: maker.identity_verified,
      videoUrl: proof.video_url,
      title: proof.title,
      createdAt: proof.created_at,
      hourlyRate: maker.hourly_rate || 0,
      latitude: maker.latitude || null,
      longitude: maker.longitude || null,
      role: maker.role || 'hustler',
      skills: maker.skills || [],
    }));
  });

  // Sort by newest first
  feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Fetch user's saved makers
  const { data: savedData } = await supabase
    .from('saved_makers')
    .select('maker_id')
    .eq('user_id', user.id);
    
  const savedIds = (savedData || []).map((s: any) => s.maker_id);

  return (
    <VibeFeedClient 
      initialFeed={feedItems}
      savedIds={savedIds}
      userId={user.id}
    />
  );
}
