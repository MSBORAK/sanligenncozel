-- =====================================================
-- SNAP MESAJLARI İÇİN EK KOLONLAR
-- Supabase SQL Editor'da çalıştır
-- =====================================================

-- 1. Messages tablosuna snap özellikleri ekle
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_snap BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS snap_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS snap_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_messages_is_snap ON messages(is_snap);
CREATE INDEX IF NOT EXISTS idx_messages_snap_expires_at ON messages(snap_expires_at);

-- 3. Snap'i açıldı olarak işaretle fonksiyonu
CREATE OR REPLACE FUNCTION mark_snap_as_opened(
  p_message_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sadece alıcı snap'i açabilir (gönderen değil)
  UPDATE messages
  SET 
    snap_opened_at = NOW(),
    snap_expires_at = NOW() + INTERVAL '24 hours'
  WHERE id = p_message_id
    AND sender_id != p_user_id
    AND is_snap = TRUE
    AND snap_opened_at IS NULL;
END;
$$;

-- 4. Süresi dolmuş snap'leri temizle fonksiyonu
CREATE OR REPLACE FUNCTION delete_expired_snaps()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Süresi dolmuş snap'lerin image_url'ini temizle
  UPDATE messages
  SET 
    image_url = NULL,
    content = '🔒 Bu snap''in süresi doldu'
  WHERE is_snap = TRUE
    AND snap_expires_at IS NOT NULL
    AND snap_expires_at < NOW()
    AND image_url IS NOT NULL;
END;
$$;

-- 5. Test için manuel çalıştır
-- SELECT delete_expired_snaps();

-- 6. Cron job için (opsiyonel - pg_cron extension gerekli)
-- Her saat başı süresi dolmuş snap'leri temizle
-- SELECT cron.schedule(
--   'delete-expired-snaps',
--   '0 * * * *',  -- Her saat başı
--   $$SELECT delete_expired_snaps()$$
-- );

-- BAŞARILI!
-- Artık snap mesajları:
-- - is_snap = TRUE olarak işaretlenir
-- - İlk açıldığında snap_opened_at kaydedilir
-- - 24 saat sonra snap_expires_at geçer
-- - Süresi dolmuş snap'ler açılamaz
