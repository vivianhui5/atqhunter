-- Migration: Add nested folder structure to galleries
-- Run this in your Supabase SQL Editor

-- Add parent_id column to galleries table
ALTER TABLE galleries 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES galleries(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_galleries_parent_id ON galleries(parent_id);

-- Update existing galleries to have null parent_id (they become root galleries)
UPDATE galleries SET parent_id = NULL WHERE parent_id IS NULL;

