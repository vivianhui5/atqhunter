-- Add display_order column to galleries table
ALTER TABLE galleries 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Add display_order column to artwork_posts table  
ALTER TABLE artwork_posts
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_galleries_display_order ON galleries(display_order);
CREATE INDEX IF NOT EXISTS idx_artwork_posts_display_order ON artwork_posts(display_order);

