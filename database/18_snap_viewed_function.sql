-- =====================================================
-- SNAP GÖRÜNTÜLEME FONKSİYONU
-- Snap görüldüğünde viewed_by array'ine ekler
-- =====================================================

CREATE OR REPLACE FUNCTION mark_snap_viewed(
  snap_id UUID,
  viewer_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- viewed_by array'ine viewer_id'yi ekle (duplicate kontrolü ile)
  UPDATE social_posts
  SET viewed_by = array_append(
    COALESCE(viewed_by, ARRAY[]::uuid[]),
    viewer_id
  )
  WHERE id = snap_id
    AND NOT (viewer_id = ANY(COALESCE(viewed_by, ARRAY[]::uuid[])));
END;
$$;

-- Function'a execute izni ver
GRANT EXECUTE ON FUNCTION mark_snap_viewed(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_snap_viewed(UUID, UUID) TO anon;
