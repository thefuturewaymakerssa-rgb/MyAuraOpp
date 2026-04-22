import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbeddings } from "@/lib/ai-helpers";
import { logger } from "@/lib/logger";

/**
 * API: /api/ai/embed
 * 
 * Manually trigger or background-refresh the semantic embedding for a profile.
 * Aggregates name, trade, and bio into a single vector.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { profileId } = await req.json();

    if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

    // 1. Fetch current profile data
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('name, trade, bio')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "Profile not found protocol." }, { status: 404 });
    }

    // 2. Clear clean text for embedding
    const p = profile as { name: string; trade: string; bio: string | null };
    const textToEmbed = `Name: ${p.name}. Trade: ${p.trade}. Bio: ${p.bio || ''}`;
    
    // 3. Generate Vector
    const embedding = await generateEmbeddings(textToEmbed);

    // 4. Update Database
    const { error: updateError } = await (supabase.from('profiles') as any)
      .update({ embedding })
      .eq('id', profileId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: "Semantic identity synchronized." });

  } catch (err: any) {
    logger.error("[AI Embed API] Critical failure", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
