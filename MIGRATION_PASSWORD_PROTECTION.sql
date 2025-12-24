-- Migration: Add password protection to galleries and artwork_posts
-- Run this in your Supabase SQL Editor

-- Add password column to galleries table
ALTER TABLE galleries 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add password column to artwork_posts table
ALTER TABLE artwork_posts 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add index for password lookups (optional, but can help with queries)
CREATE INDEX IF NOT EXISTS idx_galleries_password ON galleries(password) WHERE password IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artwork_posts_password ON artwork_posts(password) WHERE password IS NOT NULL;

