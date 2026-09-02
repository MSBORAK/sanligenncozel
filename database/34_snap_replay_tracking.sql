-- =====================================================
-- "TEKRAR OYNATTI" TAKİBİ
-- mark_snap_viewed() zaten "bu kişi daha önce de gördü mü" bilgisini
-- (was_already_viewed) döndürüyordu ama hiçbir yerde kalıcı olarak
-- saklanmıyordu. Bu migration, bir kullanıcı bir kıvılcımı ikinci kez
-- açtığında bunu replayed_by dizisine kaydeder, böylece kıvılcım
-- sahibi "izleyenler" listesinde kimin tekrar oynattığını görebilir.
-- =====================================================

ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS replayed_by UUID[] DEFAULT ARRAY[]::uuid[];

DROP FUNCTION IF EXISTS mark_snap_viewed(UUID, UUID);

CREATE OR REPLACE FUNCTION mark_snap_viewed(
  snap_id UUID,
  viewer_id UUID
)
RETURNS BOOLEAN  -- TRUE = viewer bu snap'i daha önce de görmüştü (tekrar oynatma)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  was_already_viewed BOOLEAN;
BEGIN
  SELECT viewer_id = ANY(COALESCE(viewed_by, ARRAY[]::uuid[]))
  INTO was_already_viewed
  FROM social_posts
  WHERE id = snap_id;

  IF was_already_viewed IS NULL THEN
    RETURN FALSE; -- snap bulunamadı
  END IF;

  IF NOT was_already_viewed THEN
    UPDATE social_posts
    SET viewed_by = array_append(COALESCE(viewed_by, ARRAY[]::uuid[]), viewer_id)
    WHERE id = snap_id;
  ELSE
    -- İkinci (veya sonraki) açılış = tekrar oynatma
    UPDATE social_posts
    SET replayed_by = array_append(COALESCE(replayed_by, ARRAY[]::uuid[]), viewer_id)
    WHERE id = snap_id
      AND NOT (viewer_id = ANY(COALESCE(replayed_by, ARRAY[]::uuid[])));
  END IF;

  RETURN was_already_viewed;
END;
$$;

REVOKE EXECUTE ON FUNCTION mark_snap_viewed(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mark_snap_viewed(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION mark_snap_viewed(UUID, UUID) TO authenticated;
