-- =====================================================
-- HESAP SİLME TALEPLERİNİN GERÇEKTEN İŞLENMESİ
-- Profil > Hesabımı Sil'e basınca sadece hesap_silme_talepleri
-- tablosuna "beklemede" bir kayıt düşüyordu, ama bu talebi işleyip
-- hesabı gerçekten silen hiçbir mekanizma yoktu — kullanıcıya
-- "30 gün içinde silinecek" deniyordu ama bu doğru değildi, talep
-- sonsuza kadar beklemede kalıyordu. Bu migration, 30 günü dolan
-- talepleri günlük olarak gerçekten işleyip hesabı ve tüm kullanıcı
-- verisini kalıcı olarak siler.
--
-- NOT: Storage'daki dosyalar (profil fotoğrafı vb.) bu migration'ın
-- kapsamı dışında — saf SQL ile storage nesnelerini silmek mümkün
-- değil, sadece storage API üzerinden silinebilir. auth.users silinince
-- kullanıcı kimliği ve tüm ilişkili veritabanı satırları (profil,
-- arkadaşlıklar, mesajlar, gönderiler, şikayetler vb.) kalıcı olarak
-- siliniyor; bu KVKK/App Store gereksinimlerinin can alıcı kısmı.
-- =====================================================

-- hesap_silme_talepleri tablosu daha önce panelden elle oluşturulmuş
-- (hiçbir migration'da tanımı yoktu), burada güvence altına alıyoruz.
CREATE TABLE IF NOT EXISTS hesap_silme_talepleri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kullanici_id UUID,
  eposta TEXT,
  talep_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  durum TEXT NOT NULL DEFAULT 'beklemede',
  tamamlanma_tarihi TIMESTAMP WITH TIME ZONE
);

ALTER TABLE hesap_silme_talepleri ADD COLUMN IF NOT EXISTS tamamlanma_tarihi TIMESTAMP WITH TIME ZONE;

-- kullanici_id -> auth.users FK'sini ON DELETE SET NULL yapıyoruz ki
-- kullanıcı silindiğinde bu talep kaydı (denetim izi) de silinmesin.
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'hesap_silme_talepleri'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'kullanici_id'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE hesap_silme_talepleri DROP CONSTRAINT %I', fk_name);
  END IF;

  ALTER TABLE hesap_silme_talepleri
    ADD CONSTRAINT hesap_silme_talepleri_kullanici_id_fkey
    FOREIGN KEY (kullanici_id) REFERENCES auth.users(id) ON DELETE SET NULL;
END $$;

ALTER TABLE hesap_silme_talepleri ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own deletion requests" ON hesap_silme_talepleri;
CREATE POLICY "Users can view their own deletion requests"
  ON hesap_silme_talepleri FOR SELECT
  USING (auth.uid() = kullanici_id);

DROP POLICY IF EXISTS "Users can create their own deletion request" ON hesap_silme_talepleri;
CREATE POLICY "Users can create their own deletion request"
  ON hesap_silme_talepleri FOR INSERT
  WITH CHECK (auth.uid() = kullanici_id);

-- Kullanıcı fikrini değiştirip tekrar giriş yaparsa bekleyen talebini
-- kendisi iptal edebilsin (bkz. UserContext.tsx fetchProfile).
DROP POLICY IF EXISTS "Users can cancel their own pending deletion request" ON hesap_silme_talepleri;
CREATE POLICY "Users can cancel their own pending deletion request"
  ON hesap_silme_talepleri FOR UPDATE
  USING (auth.uid() = kullanici_id AND durum = 'beklemede')
  WITH CHECK (auth.uid() = kullanici_id AND durum = 'iptal_edildi');

-- Bekleyen ve 30 günü dolmuş talepleri gerçekten işleyen fonksiyon.
-- Çoğu tablo zaten auth.users(id) ON DELETE CASCADE ile tanımlı
-- (social_posts, messages, conversation_participants, user_profiles,
-- kesfet_yorumlar, kullanici_sikayetleri, blocked_users) — auth.users
-- satırı silinince onlar otomatik temizlenir. friendships tablosunun
-- şeması panelden oluşturulduğu ve cascade davranışı garanti olmadığı
-- için burada ayrıca elle temizleniyor.
CREATE OR REPLACE FUNCTION process_pending_account_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  FOR req IN
    SELECT id, kullanici_id
    FROM hesap_silme_talepleri
    WHERE durum = 'beklemede'
      AND kullanici_id IS NOT NULL
      AND talep_tarihi <= NOW() - INTERVAL '30 days'
  LOOP
    BEGIN
      DELETE FROM friendships WHERE sender_id = req.kullanici_id OR receiver_id = req.kullanici_id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
      NULL; -- şema farklıysa sessizce geç, asıl silme işlemini engellemesin
    END;

    -- auth.users satırını silmek, CASCADE tanımlı tüm tabloları otomatik temizler.
    DELETE FROM auth.users WHERE id = req.kullanici_id;

    UPDATE hesap_silme_talepleri
    SET durum = 'tamamlandi', tamamlanma_tarihi = NOW()
    WHERE id = req.id;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION process_pending_account_deletions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_pending_account_deletions() FROM anon;
REVOKE EXECUTE ON FUNCTION process_pending_account_deletions() FROM authenticated;

-- Günlük olarak (her gece 03:00'te) bekleyen talepleri işle.
SELECT cron.schedule(
  'process-account-deletions',
  '0 3 * * *',
  $$SELECT process_pending_account_deletions();$$
);
