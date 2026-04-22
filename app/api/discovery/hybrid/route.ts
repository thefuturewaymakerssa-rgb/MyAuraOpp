import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbeddings } from "@/lib/ai-helpers";
import { logger } from "@/lib/logger";

/**
 * API: /api/discovery/hybrid
 * 
 * Future Matchmaker AI — Phase 3 🇿🇦🎥
 * Combines traditional keyword matching with semantic vector similarity.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { query, threshold = 0.5, limit = 10 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Search query protocol required." }, { status: 400 });
    }

    // 1. Generate embedding for the search query
    const queryEmbedding = await generateEmbeddings(query);

    // 2. Execute Hybrid Search RPC
    // This calls the postgres function 'hybrid_search_talent' defined in the migration
    const { data, error } = await (supabase as any).rpc('hybrid_search_talent', {
      query_text: query,
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    });

    if (error) {
      logger.error("[Hybrid Discovery] RPC Failure", error);
      throw error;
    }

    return NextResponse.json(data);

  } catch (err: any) {
    logger.error("[Hybrid Discovery] Critical failure", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
