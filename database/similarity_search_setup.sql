-- Create the similarity search function for RAG
-- This function should be executed in your Supabase SQL editor

-- Note: Google's text-embedding-004 produces 768-dimensional vectors
-- But we'll use IVFFlat index instead of HNSW to avoid dimension limits

CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  source_table text,
  source_id bigint,
  content text,
  metadata jsonb,
  chunk_index int,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    embeddings.source_table,
    embeddings.source_id,
    embeddings.content,
    embeddings.metadata,
    embeddings.chunk_index,
    1 - (embeddings.embedding <=> query_embedding) AS similarity
  FROM embeddings
  WHERE 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Drop the existing index if it exists
DROP INDEX IF EXISTS embeddings_embedding_idx;

-- Create IVFFlat index instead of HNSW (no dimension limit)
-- IVFFlat is better for datasets with many dimensions
CREATE INDEX embeddings_embedding_idx ON embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Alternative: If you have a smaller dataset, you can use a simple index
-- CREATE INDEX embeddings_embedding_idx ON embeddings 
-- USING btree ((embedding <=> '[0,0,0...]'::vector));

-- First, let's check the actual dimensions of existing embeddings
-- Run this to see what dimension your embeddings actually have:
-- SELECT array_length(embedding::float[], 1) as dimensions FROM embeddings LIMIT 1;

-- If your embeddings are NOT 768 dimensions, update the function accordingly
-- Google's text-embedding-004 should be 768, but let's be safe

-- Add RLS (Row Level Security) policies for embeddings table
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read embeddings" ON embeddings;
DROP POLICY IF EXISTS "Service role can manage embeddings" ON embeddings;

-- Allow authenticated users to read embeddings
CREATE POLICY "Users can read embeddings" ON embeddings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to insert/update/delete embeddings
CREATE POLICY "Service role can manage embeddings" ON embeddings
  FOR ALL USING (auth.role() = 'service_role');

-- Performance tip: Analyze the table after creating indexes
ANALYZE embeddings;