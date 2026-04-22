-- Migration: Add transcript and pgvector embedding to proofs
-- Run in Supabase Dashboard → SQL Editor, or via CLI:
--   supabase db push

-- 1. Enable the pgvector extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add transcript and embedding columns to the proofs table
ALTER TABLE proofs
  ADD COLUMN IF NOT EXISTS transcript        TEXT,
  ADD COLUMN IF NOT EXISTS detected_skills   TEXT[],
  ADD COLUMN IF NOT EXISTS embedding         vector(1536),   -- text-embedding-3-small dimensions
  ADD COLUMN IF NOT EXISTS transcribed_at    TIMESTAMPTZ;

-- 3. Create an IVFFlat index for approximate nearest-neighbour search
--    Lists = sqrt(expected_rows). Start at 100, tune after beta.
CREATE INDEX IF NOT EXISTS proofs_embedding_idx
  ON proofs
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. Create a Postgres function for hybrid similarity search
--    Used by /api/discovery/hybrid to find top-N matching proofs.
CREATE OR REPLACE FUNCTION match_proofs(
  query_embedding vector(1536),
  match_count     INT DEFAULT 20,
  filter_maker_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  maker_id        UUID,
  title           TEXT,
  video_url       TEXT,
  thumbnail_url   TEXT,
  transcript      TEXT,
  detected_skills TEXT[],
  created_at      TIMESTAMPTZ,
  similarity      FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.maker_id,
    p.title,
    p.video_url,
    p.thumbnail_url,
    p.transcript,
    p.detected_skills,
    p.created_at,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM proofs p
  WHERE
    p.embedding IS NOT NULL
    AND (filter_maker_id IS NULL OR p.maker_id != filter_maker_id)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Grant execute on the function to the anon and authenticated roles
GRANT EXECUTE ON FUNCTION match_proofs TO anon, authenticated;

-- 6. RLS: ensure embedding column doesn't expose private data
--    (proofs table should already have RLS enabled from earlier migrations)
-- No additional policies needed — embedding is treated as a public field
-- since the proof video itself is already public after publish.

COMMENT ON COLUMN proofs.transcript IS
  'Whisper-generated transcript of the VibeCV video. Used for AI search and display subtitles.';
COMMENT ON COLUMN proofs.detected_skills IS
  'Skills extracted from transcript via keyword matching. Seeds the talent profile skills array.';
COMMENT ON COLUMN proofs.embedding IS
  'OpenAI text-embedding-3-small vector (1536 dims). Used for pgvector cosine similarity search.';
COMMENT ON COLUMN proofs.transcribed_at IS
  'Timestamp of when the transcription pipeline completed. NULL = not yet transcribed.';
