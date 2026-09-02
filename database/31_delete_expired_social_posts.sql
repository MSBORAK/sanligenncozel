-- =====================================================
-- SÜRESİ DOLAN KIVILCIMLARI (social_posts) VERİTABANINDAN GERÇEKTEN SİL
-- Şu ana kadar expires_at sadece client tarafında feed'i filtrelemek
-- için kullanılıyordu — süresi dolan kıvılcım satırları (foto/video/GPS)
-- veritabanında sonsuza kadar kalıyordu. Bu, "4 saat sonra kaybolur"
-- vaadiyle çelişiyordu. Bu migration, social_stories ve messages
-- (snap_expires_at) için zaten kullanılan aynı pg_cron desenini
-- social_posts için de kurar.
-- =====================================================

-- 1. Süresi dolmuş kıvılcımları silen fonksiyon
CREATE OR REPLACE FUNCTION delete_expired_social_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM social_posts
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$;

-- 2. Manuel test (SQL Editor'de tek başına çalıştırıp deneyebilirsin):
-- SELECT delete_expired_social_posts();

-- 3. Otomatik çalıştırmak için pg_cron gerekli:
--    Supabase Dashboard > Database > Extensions > pg_cron'u Enable et.
--    Sonra AŞAĞIDAKİ SATIRLARI AYRICA çalıştır (yorum satırı olduğu için
--    otomatik çalışmaz, bilerek elle aktif ediyorsun):

-- SELECT cron.schedule(
--   'delete-expired-social-posts',
--   '0 * * * *',  -- Her saat başı
--   $$SELECT delete_expired_social_posts()$$
-- );
