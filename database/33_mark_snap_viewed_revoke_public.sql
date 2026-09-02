-- =====================================================
-- mark_snap_viewed FONKSİYONUNU ANON'A KAPAT
-- 32 numaralı migration'da fonksiyona sadece "authenticated" grant
-- edilmişti ama Postgres'te fonksiyonlar varsayılan olarak PUBLIC'e
-- açık olur (push_token kolonunda yaşanan sorunla aynı kök neden).
-- Test edildi: anon key ile mark_snap_viewed çağrılabiliyordu —
-- bu, oturum açmadan sahte viewer_id ile görüntülenme sayısını
-- manipüle etmeye izin veriyordu. PUBLIC'ten açıkça alıyoruz.
-- =====================================================

REVOKE EXECUTE ON FUNCTION mark_snap_viewed(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mark_snap_viewed(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION mark_snap_viewed(UUID, UUID) TO authenticated;
