-- =====================================================
-- KULLANICI ŞİKAYET SİSTEMİ
-- ŞanlıSosyal'de normal bir sosyal medya gibi "Şikayet Et" özelliği.
-- =====================================================

CREATE TABLE IF NOT EXISTS kullanici_sikayetleri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sikayet_eden_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sikayet_edilen_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sebep TEXT NOT NULL CHECK (sebep IN ('spam', 'taciz', 'uygunsuz_icerik', 'sahte_hesap', 'diger')),
  aciklama TEXT,
  durum TEXT NOT NULL DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'inceleniyor', 'sonuclandi')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sikayet_edilen ON kullanici_sikayetleri(sikayet_edilen_id);
CREATE INDEX IF NOT EXISTS idx_sikayet_eden ON kullanici_sikayetleri(sikayet_eden_id);

ALTER TABLE kullanici_sikayetleri ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi gönderdiği şikayetleri görebilir (kimin şikayet ettiğini
-- kimseye göstermiyoruz, şikayet edilen kişi de göremiyor)
DROP POLICY IF EXISTS "Users can view their own reports" ON kullanici_sikayetleri;
CREATE POLICY "Users can view their own reports"
  ON kullanici_sikayetleri FOR SELECT
  USING (auth.uid() = sikayet_eden_id);

DROP POLICY IF EXISTS "Users can file reports" ON kullanici_sikayetleri;
CREATE POLICY "Users can file reports"
  ON kullanici_sikayetleri FOR INSERT
  WITH CHECK (auth.uid() = sikayet_eden_id AND sikayet_eden_id != sikayet_edilen_id);
