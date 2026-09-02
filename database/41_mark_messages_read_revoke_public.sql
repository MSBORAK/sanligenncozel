-- =====================================================
-- mark_messages_as_read FONKSİYONUNU ANON'A KAPAT
-- Diğer fonksiyonlarda (push_token, mark_snap_viewed) gördüğümüz aynı
-- kök neden: Postgres fonksiyonları varsayılan olarak PUBLIC'e açık
-- oluyor. Test edildi: anon key ile çağrılabiliyordu — bu, oturum
-- açmadan başkasının sohbetindeki mesajları "okundu" işaretlemeye
-- izin veriyordu.
-- =====================================================

REVOKE EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
