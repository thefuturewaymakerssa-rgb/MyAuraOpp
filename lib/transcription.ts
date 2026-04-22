/**
 * lib/transcription.ts
 *
 * Async video transcription using OpenAI Whisper.
 *
 * Called AFTER a successful upload — fetches the video from Supabase Storage,
 * transcribes with Whisper, extracts skill keywords, and stores the result
 * back on the proof row. The skill embedding is then generated and saved
 * for pgvector-powered AI matching.
 *
 * This runs as a fire-and-forget background task — it should never block
 * the upload response to the user.
 */

import OpenAI from "openai";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { generateEmbeddings } from "./ai-helpers";
import { logger } from "./logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

const adminClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Skill keyword extractor ──────────────────────────────────────────────────

/**
 * Simple SA-trades keyword boost list.
 * Used to extract skills from transcripts for embedding and display.
 */
const SKILL_KEYWORDS = [
  "plumbing", "electrical", "welding", "carpentry", "painting", "tiling",
  "roofing", "plastering", "gardening", "cleaning", "cooking", "baking",
  "coding", "driving", "delivery", "security", "childcare", "caregiving",
  "tailoring", "sewing", "hairdressing", "beauty", "mechanic", "panel beating",
  "construction", "labourer", "brick laying", "concrete", "scaffolding",
];

function extractSkillsFromTranscript(transcript: string): string[] {
  const lower = transcript.toLowerCase();
  return SKILL_KEYWORDS.filter((skill) => lower.includes(skill));
}

// ─── Main transcription pipeline ─────────────────────────────────────────────

/**
 * transcribeAndEmbedProof
 *
 * Full pipeline: fetch video → Whisper transcription → skill extraction →
 * OpenAI embedding → store on proof row in Supabase.
 *
 * @param proofId  - The UUID of the proof row to update
 * @param videoUrl - Public Supabase Storage URL of the uploaded video
 * @param userId   - For structured logging
 */
export async function transcribeAndEmbedProof(
  proofId: string,
  videoUrl: string,
  userId: string
): Promise<void> {
  const traceId = `transcribe-${proofId.slice(0, 8)}`;

  // Guard: skip if no real API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-placeholder") {
    logger.warn("Transcription skipped — OPENAI_API_KEY is placeholder", {
      action: "transcription.skip",
      userId,
      traceId,
    });
    return;
  }

  try {
    logger.info("Transcription pipeline started", {
      action: "transcription.start",
      userId,
      traceId,
    });

    // 1. Fetch video from Supabase Storage as a blob
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video for transcription: ${videoResponse.status}`);
    }
    const videoBlob = await videoResponse.blob();

    // Whisper requires a File object with a filename
    const videoFile = new File([videoBlob], "vibecv.webm", { type: videoBlob.type || "video/webm" });

    // 2. Transcribe with Whisper
    const transcriptionStart = Date.now();
    const transcriptionResult = await openai.audio.transcriptions.create({
      file: videoFile,
      model: "whisper-1",
      language: "en",
      response_format: "text",
    });

    const transcript = typeof transcriptionResult === "string"
      ? transcriptionResult
      : (transcriptionResult as { text: string }).text;

    logger.info("Whisper transcription complete", {
      action: "transcription.whisper.done",
      userId,
      traceId,
      durationMs: Date.now() - transcriptionStart,
      transcriptLength: transcript.length,
    });

    // 3. Extract skills and build embedding text
    const detectedSkills = extractSkillsFromTranscript(transcript);
    const embeddingText = `${transcript} Skills: ${detectedSkills.join(", ")}`.trim();

    // 4. Generate OpenAI embedding vector
    const embeddingStart = Date.now();
    const embedding = await generateEmbeddings(embeddingText);

    logger.info("Embedding generated", {
      action: "transcription.embed.done",
      userId,
      traceId,
      durationMs: Date.now() - embeddingStart,
      skillsFound: detectedSkills.length,
    });

    // 5. Store transcript + embedding on the proof row
    // Note: transcript and embedding columns must be added via Supabase migration
    // See: supabase/migrations/YYYYMMDD_add_transcript_embedding.sql
    const { error: updateError } = await adminClient
      .from("proofs")
      .update({
        transcript,
        detected_skills: detectedSkills,
        embedding, // pgvector column — float8[] or vector(1536)
        transcribed_at: new Date().toISOString(),
      } as any)
      .eq("id", proofId);

    if (updateError) {
      // Non-fatal: transcript columns may not exist yet in dev
      logger.warn("Could not store transcript (columns may not exist yet)", {
        action: "transcription.store.warn",
        userId,
        traceId,
        supabaseCode: updateError.code,
      });
      return;
    }

    logger.info("Transcription pipeline complete", {
      action: "transcription.complete",
      userId,
      traceId,
      proofId,
    });
  } catch (err) {
    // Non-fatal: transcription failure should never block the user experience
    logger.error("Transcription pipeline failed", err, {
      action: "transcription.fail",
      userId,
      traceId,
      proofId,
    });
  }
}
