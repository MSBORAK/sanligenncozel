-- =====================================================
-- KIVILCIM AÇIKLAMASI — SUNUCU TARAFI UZUNLUK SINIRI
-- Mobil uygulamada kıvılcım açıklaması 200 karakterle sınırlı
-- (maxLength={200}) ama bu sadece client tarafında uygulanıyordu —
-- biri uygulamayı değiştirip doğrudan API'ye çok uzun bir metin
-- gönderebilirdi. Aynı sınırı veritabanı seviyesinde de zorunlu
-- kılıyoruz.
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'social_posts_content_length_check'
  ) THEN
    -- NOT VALID: var olan (muhtemelen zaten 4 saat içinde silinen) eski
    -- satırları geriye dönük doğrulamaya çalışıp hataya düşmesin,
    -- sadece bundan sonraki INSERT/UPDATE'lere uygulanır.
    ALTER TABLE social_posts
      ADD CONSTRAINT social_posts_content_length_check CHECK (char_length(content) <= 200) NOT VALID;
  END IF;
END $$;
