-- Per-gallery public page view counter (/?gallery=id for any depth; incremented server-side when not in admin preview)

ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_gallery_view_count(gallery_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE galleries
  SET view_count = view_count + 1
  WHERE id = gallery_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_gallery_view_count(uuid) TO service_role;
