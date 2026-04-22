-- Phase 3: Matchmaker AI Infrastructure
-- Enables vector search capabilities for semantic talent discovery.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to profiles
-- text-embedding-3-small uses 1536 dimensions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Create index for fast vector similarity search (IVFFlat or HNSW)
-- Using HNSW for better performance on high-dimensional vectors in 2026
CREATE INDEX IF NOT EXISTS profiles_embedding_idx ON public.profiles 
USING hnsw (embedding vector_cosine_ops);

-- 4. Hybrid Search Function
-- Combines keyword matching (ilike) with semantic similarity (<=>)
CREATE OR REPLACE FUNCTION hybrid_search_talent(
  query_text TEXT,
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  trade TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.trade,
    p.bio,
    p.location,
    p.avatar_url,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.profiles p
  WHERE 
    (p.trade ILIKE '%' || query_text || '%' OR p.bio ILIKE '%' || query_text || '%')
    AND (1 - (p.embedding <=> query_embedding) > match_threshold)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
