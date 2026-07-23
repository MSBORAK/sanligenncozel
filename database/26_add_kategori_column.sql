-- =====================================================
-- KEŞFET tablosuna kategori kolonu ekle
-- Supabase SQL Editor'da çalıştır
-- =====================================================

-- Eğer kategori kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kesfet' AND column_name = 'kategori'
    ) THEN
        ALTER TABLE kesfet 
        ADD COLUMN kategori TEXT NOT NULL DEFAULT 'historic' 
        CHECK (kategori IN ('historic', 'faith', 'nature', 'museum', 'bazaar'));
        
        CREATE INDEX IF NOT EXISTS idx_kesfet_kategori ON kesfet(kategori);
    END IF;
END $$;

-- Eğer slug kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kesfet' AND column_name = 'slug'
    ) THEN
        ALTER TABLE kesfet 
        ADD COLUMN slug TEXT;
    END IF;
END $$;

-- Eğer sira kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kesfet' AND column_name = 'sira'
    ) THEN
        ALTER TABLE kesfet 
        ADD COLUMN sira INTEGER NOT NULL DEFAULT 0;
        
        CREATE INDEX IF NOT EXISTS idx_kesfet_sira ON kesfet(sira);
    END IF;
END $$;

-- Eğer one_cikan kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kesfet' AND column_name = 'one_cikan'
    ) THEN
        ALTER TABLE kesfet 
        ADD COLUMN one_cikan BOOLEAN NOT NULL DEFAULT FALSE;
        
        CREATE INDEX IF NOT EXISTS idx_kesfet_one_cikan ON kesfet(one_cikan) WHERE one_cikan = TRUE;
    END IF;
END $$;

-- Eğer aktif kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kesfet' AND column_name = 'aktif'
    ) THEN
        ALTER TABLE kesfet 
        ADD COLUMN aktif BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
END $$;

-- Mevcut kayıtları güncelle
UPDATE kesfet SET kategori = 'historic' WHERE kategori IS NULL OR kategori = '';
UPDATE kesfet SET aktif = TRUE WHERE aktif IS NULL;
UPDATE kesfet SET sira = id WHERE sira = 0;

SELECT 'Kategori kolonu başarıyla eklendi! Artık 24_kesfet_seed.sql dosyasını çalıştırabilirsiniz.' as mesaj;
