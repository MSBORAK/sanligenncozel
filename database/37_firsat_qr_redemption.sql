-- =====================================================
-- GENÇKART FIRSATLARI — TEK KULLANIMLIK QR DOĞRULAMA
-- Karar: her işletmenin SABİT bir QR kodu olacak (kasada dursun),
-- müşteri kendi telefonuyla okutacak. Esnaf hiçbir ekstra iş
-- yapmayacak. Aynı kullanıcı aynı fırsatı ikinci kez kullanamayacak.
-- =====================================================

-- 1) Her fırsata benzersiz, tahmin edilemez bir QR token'ı ekle
ALTER TABLE firsatlar ADD COLUMN IF NOT EXISTS qr_token UUID DEFAULT uuid_generate_v4() NOT NULL;

-- Var olan satırlarda token boşsa doldur (DEFAULT yeni satırlar için otomatik çalışır,
-- ama tablo zaten dolu olduğu için mevcut satırları da garantiye alıyoruz)
UPDATE firsatlar SET qr_token = uuid_generate_v4() WHERE qr_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_firsatlar_qr_token ON firsatlar(qr_token);

-- 2) Kullanım kayıtları tablosu — kim, hangi fırsatı, ne zaman kullandı
CREATE TABLE IF NOT EXISTS firsat_kullanimlari (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  firsat_id INTEGER REFERENCES firsatlar(id) ON DELETE CASCADE NOT NULL,
  kullanim_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, firsat_id)
);

CREATE INDEX IF NOT EXISTS idx_firsat_kullanimlari_user ON firsat_kullanimlari(user_id);
CREATE INDEX IF NOT EXISTS idx_firsat_kullanimlari_firsat ON firsat_kullanimlari(firsat_id);

ALTER TABLE firsat_kullanimlari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own redemptions" ON firsat_kullanimlari;
CREATE POLICY "Users can view their own redemptions"
  ON firsat_kullanimlari FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can redeem for themselves" ON firsat_kullanimlari;
CREATE POLICY "Users can redeem for themselves"
  ON firsat_kullanimlari FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3) QR okutulduğunda çağrılacak fonksiyon: token'ı doğrular, tekilliği
-- garanti eder (unique constraint zaten var ama anlamlı hata mesajı için
-- burada da kontrol ediyoruz), kullanım kaydını oluşturur.
CREATE OR REPLACE FUNCTION redeem_firsat_qr(p_qr_token UUID)
RETURNS TABLE(basarili BOOLEAN, mesaj TEXT, firsat_baslik TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_firsat_id INTEGER;
  v_baslik TEXT;
  v_already BOOLEAN;
BEGIN
  SELECT id, baslik INTO v_firsat_id, v_baslik
  FROM firsatlar WHERE qr_token = p_qr_token;

  IF v_firsat_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'gecersiz_qr'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM firsat_kullanimlari
    WHERE user_id = auth.uid() AND firsat_id = v_firsat_id
  ) INTO v_already;

  IF v_already THEN
    RETURN QUERY SELECT FALSE, 'zaten_kullanildi'::TEXT, v_baslik;
    RETURN;
  END IF;

  INSERT INTO firsat_kullanimlari (user_id, firsat_id) VALUES (auth.uid(), v_firsat_id);
  RETURN QUERY SELECT TRUE, 'basarili'::TEXT, v_baslik;
END;
$$;

REVOKE EXECUTE ON FUNCTION redeem_firsat_qr(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION redeem_firsat_qr(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION redeem_firsat_qr(UUID) TO authenticated;
