import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Discovery API — High-Fidelity Feed 🎥🇿🇦
// Used by k6 load test and vertical Discovery feed.

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("proofs")
      .select(`
        id, video_url, title, maker_id,
        maker:profiles!maker_id (id, name, trade, location, avatar_url, featured_until, latitude, longitude)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Discovery API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
