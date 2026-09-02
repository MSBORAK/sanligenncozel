-- =====================================================
-- KIVILCIM GÖRÜNTÜLENME + TEKRAR OYNATMA TAKİBİ
-- 18 numaralı migration'da mark_snap_viewed() fonksiyonu zaten
-- yazılmıştı ama client tarafında HİÇ ÇAĞRILMIYORDU — bu yüzden
-- "kaç kişi gördü" (göz ikonu) her zaman 0 gösteriyordu.
-- Bu migration fonksiyonu, izleyici daha önce görmüşse (yani
-- Snapchat'teki gibi "tekrar oynattı" durumu) TRUE döndürecek
-- şekilde günceller; client bu bilgiye göre gönderene bildirim
-- gönderebilir.
-- =====================================================

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
  END IF;

  RETURN was_already_viewed;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_snap_viewed(UUID, UUID) TO authenticated;
