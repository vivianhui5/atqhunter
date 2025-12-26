-- Add cover_image_url column to galleries table
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

