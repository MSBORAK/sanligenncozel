-- KIVILCIM "4 SAATTE KAYBOLUR" VAADİ — GERÇEKTEN SAĞLANMIYORDU
-- Client kodu her kıvılcım eklerken expires_at değeri gönderiyordu, ama bu
-- kolon migration dosyalarının hiçbirinde social_posts tablosuna eklenmemiş
-- (muhtemelen dashboard'dan elle eklenmiş, iz bırakmadan). Ayrıca 31 numaralı
-- migration'daki delete_expired_social_posts() fonksiyonu hazırdı ama
-- cron.schedule() satırı BİLEREK yorum satırı bırakılmıştı — hiç
-- çalıştırılmamış olabilir. Sonuç: "4 saat sonra silinir" sadece client
-- tarafında feed'i filtreleyen bir yanılsamaydı, veritabanında kayıtlar
-- (foto/video/konum dahil) süresiz kalıyordu.

-- 1. Kolonun gerçekten var olduğundan emin ol (varsa dokunmaz)
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Eski satırlarda expires_at boşsa created_at + 4 saat olarak doldur
UPDATE social_posts
SET expires_at = created_at + INTERVAL '4 hours'
WHERE expires_at IS NULL;

-- 2. Silme fonksiyonu (31'de tanımlıydı, burada da CREATE OR REPLACE ile garantiye alıyoruz)
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

-- 3. pg_cron uzantısını etkinleştir ve saatlik çalıştır
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('delete-expired-social-posts')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-expired-social-posts');

SELECT cron.schedule(
  'delete-expired-social-posts',
  '0 * * * *',  -- Her saat başı
  $$SELECT delete_expired_social_posts()$$
);
