-- Per-artwork public page view counter (incremented server-side on /artwork/[id] when not in admin preview)

ALTER TABLE artwork_posts
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_artwork_view_count(artwork_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE artwork_posts
  SET view_count = view_count + 1
  WHERE id = artwork_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_artwork_view_count(uuid) TO service_role;
