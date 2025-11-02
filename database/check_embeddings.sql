-- Diagnostic queries to check your embedding setup
-- Run these in your Supabase SQL Editor to diagnose issues

-- 1. Check if pgvector extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 2. Check your embeddings table structure
\d embeddings;

-- 3. Check if you have any existing embeddings and their dimensions
SELECT 
    COUNT(*) as total_embeddings,
    array_length(embedding::float[], 1) as embedding_dimensions
FROM embeddings 
LIMIT 1;

-- 4. If you have embeddings, check a sample
SELECT 
    source_table,
    source_id,
    LENGTH(content) as content_length,
    array_length(embedding::float[], 1) as dimensions,
    created_at
FROM embeddings 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check existing indexes on embeddings table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'embeddings';

-- 6. If you need to recreate the embeddings table with correct vector size:
-- WARNING: This will delete all existing embeddings!
/*
DROP TABLE IF EXISTS embeddings CASCADE;

CREATE TABLE embeddings (
    id bigserial PRIMARY KEY,
    source_table text NOT NULL,
    source_id bigint NOT NULL,
    chunk_index integer NOT NULL DEFAULT 0,
    content text NOT NULL,
    metadata jsonb,
    embedding vector(768), -- Adjust this number based on your actual embedding dimensions
    created_at timestamptz DEFAULT now()
);
*/

-- 7. Test vector operations (run this after you have some embeddings)
/*
SELECT 
    source_table,
    content,
    embedding <=> '[0.1,0.2,0.3,...]'::vector as distance
FROM embeddings 
ORDER BY embedding <=> '[0.1,0.2,0.3,...]'::vector
LIMIT 3;
*/
