-- =====================================================
-- GERİ BİLDİRİMLER TABLOSU
-- Profil > Geri Bildirim Gönder formu bu tabloya yazıyordu ama
-- tablo veritabanında hiç yoktu — supabase-js insert() hata verse
-- bile throw etmediği ve kod {error} kontrolü yapmadığı için,
-- kullanıcıya her zaman "başarıyla gönderildi" gösteriliyordu,
-- oysa hiçbir kayıt hiçbir zaman kaydedilmiyordu. Bu migration
-- tabloyu gerçekten oluşturur.
-- =====================================================

CREATE TABLE IF NOT EXISTS geri_bildirimler (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kullanici_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tur TEXT NOT NULL CHECK (tur IN ('sikayet_oneri', 'hata', 'ozellik_istegi')),
  baslik TEXT NOT NULL,
  aciklama TEXT NOT NULL,
  durum TEXT NOT NULL DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'inceleniyor', 'cozuldu', 'reddedildi')),
  olusturma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geri_bildirimler_kullanici_id ON geri_bildirimler(kullanici_id);

ALTER TABLE geri_bildirimler ENABLE ROW LEVEL SECURITY;

-- Kullanıcı yalnızca kendi gönderdiği geri bildirimi görebilir
DROP POLICY IF EXISTS "Users can view their own feedback" ON geri_bildirimler;
CREATE POLICY "Users can view their own feedback"
  ON geri_bildirimler FOR SELECT
  USING (auth.uid() = kullanici_id);

-- Yalnızca oturum açmış kullanıcı, kendi adına geri bildirim gönderebilir
DROP POLICY IF EXISTS "Authenticated users can insert their own feedback" ON geri_bildirimler;
CREATE POLICY "Authenticated users can insert their own feedback"
  ON geri_bildirimler FOR INSERT
  WITH CHECK (auth.uid() = kullanici_id);
