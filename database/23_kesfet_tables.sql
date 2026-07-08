-- =====================================================
-- KEŞFET (Şanlıurfa mekânları) — kalıcı içerik tabloları
-- Supabase SQL Editor'da çalıştır
-- =====================================================

CREATE TABLE IF NOT EXISTS kesfet (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  baslik TEXT NOT NULL,
  aciklama TEXT,
  kategori TEXT NOT NULL CHECK (
    kategori IN ('historic', 'faith', 'nature', 'museum', 'bazaar')
  ),
  resim_url TEXT,
  sira INTEGER NOT NULL DEFAULT 0,
  one_cikan BOOLEAN NOT NULL DEFAULT FALSE,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kesfet_kategori ON kesfet(kategori);
CREATE INDEX IF NOT EXISTS idx_kesfet_sira ON kesfet(sira);
CREATE INDEX IF NOT EXISTS idx_kesfet_one_cikan ON kesfet(one_cikan) WHERE one_cikan = TRUE;

CREATE TABLE IF NOT EXISTS kesfet_yorumlar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kesfet_yorumlar_place ON kesfet_yorumlar(place_id);
CREATE INDEX IF NOT EXISTS idx_kesfet_yorumlar_created ON kesfet_yorumlar(created_at DESC);

ALTER TABLE kesfet ENABLE ROW LEVEL SECURITY;
ALTER TABLE kesfet_yorumlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kesfet_public_read" ON kesfet;
CREATE POLICY "kesfet_public_read"
  ON kesfet FOR SELECT
  USING (aktif = TRUE);

DROP POLICY IF EXISTS "kesfet_yorumlar_public_read" ON kesfet_yorumlar;
CREATE POLICY "kesfet_yorumlar_public_read"
  ON kesfet_yorumlar FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "kesfet_yorumlar_auth_insert" ON kesfet_yorumlar;
CREATE POLICY "kesfet_yorumlar_auth_insert"
  ON kesfet_yorumlar FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Görseller: Supabase Storage > bucket: kesfet_resimleri (public)
-- resim_url örnek: historic/gobeklitepe.jpg
