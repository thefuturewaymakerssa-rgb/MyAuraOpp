/**
 * lib/ai-matching.ts
 *
 * Hybrid Discovery Scoring Engine — v2 (Sprint 6)
 *
 * Combines:
 *   - pgvector cosine similarity (70% weight) — semantic skill matching
 *   - Heuristic signals (30% weight):
 *       • Proximity density (location-aware for SA township economy)
 *       • Reputation (verification tier)
 *       • Historical resonance (saved / liked)
 *       • Signal freshness (recency boost)
 *
 * Falls back gracefully to heuristic-only scoring when:
 *   - No query embedding is provided
 *   - The proof has no stored embedding yet (not yet transcribed)
 */

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { generateEmbeddings } from "./ai-helpers";
import { logger } from "./logger";

import { scoreHeuristic, scoreDiscoveryMatch, FeedItemBase, MatchOptions } from "./scoring";

export interface RankedProof {
  id: string;
  maker_id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  transcript: string | null;
  detected_skills: string[] | null;
  created_at: string;
  /** pgvector cosine similarity (0–1). Null if no embedding exists yet. */
  similarity: number | null;
  /** Combined heuristic + vector score */
  hybridScore: number;
}

// ─── pgvector-powered semantic search ────────────────────────────────────────

const adminClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * semanticSearch
 *
 * Calls the `match_proofs` Supabase RPC function to find the top-N proofs
 * most similar to the query embedding using pgvector cosine distance.
 *
 * @param queryText  - Free-text job description or skill query from the employer
 * @param topN       - Maximum number of results to return
 * @param excludeId  - Exclude a specific maker (e.g., the employer themselves)
 */
export async function semanticSearch(
  queryText: string,
  topN = 50,
  excludeId?: string
): Promise<RankedProof[]> {
  const traceId = `semantic-${Date.now().toString(36)}`;

  // Guard: skip if no real API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-placeholder") {
    logger.warn("Semantic search skipped — OPENAI_API_KEY is placeholder", {
      action: "ai.search.skip",
      traceId,
    });
    return [];
  }

  try {
    // 1. Embed the query text
    const queryEmbedding = await logger.time(
      "ai.embed.query",
      () => generateEmbeddings(queryText),
      { action: "ai.embed.query", traceId }
    );

    // 2. Call pgvector RPC
    const { data, error } = await adminClient.rpc("match_proofs", {
      query_embedding: queryEmbedding,
      match_count: topN,
      filter_maker_id: excludeId ?? null,
    });

    if (error) {
      logger.warn("pgvector match_proofs RPC failed — falling back to heuristic", {
        action: "ai.search.rpc.fail",
        traceId,
        supabaseCode: error.code,
      });
      return [];
    }

    logger.info("Semantic search complete", {
      action: "ai.search.done",
      traceId,
      resultCount: data?.length ?? 0,
    });

    return (data ?? []).map((row: Omit<RankedProof, "hybridScore">) => ({
      ...row,
      hybridScore: row.similarity ?? 0,
    }));
  } catch (err) {
    logger.error("Semantic search failed", err, { action: "ai.search.error", traceId });
    return [];
  }
}

// Re-export for any existing backend consumers
export { scoreHeuristic, scoreDiscoveryMatch };
