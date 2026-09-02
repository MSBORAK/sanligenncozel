-- =====================================================
-- STORY FOREIGN KEY İLİŞKİLERİNİ DÜZELT
-- Supabase SQL Editor'da çalıştır
-- =====================================================

-- 1. Mevcut foreign key'i kontrol et
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'social_stories' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Eğer user_profiles'a foreign key yoksa ekle
-- Önce mevcut constraint'i sil (varsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'social_stories' 
    AND constraint_name = 'social_stories_user_id_fkey'
  ) THEN
    ALTER TABLE social_stories DROP CONSTRAINT social_stories_user_id_fkey;
  END IF;
END $$;

-- 3. user_profiles tablosuna foreign key ekle
-- Önce user_profiles'da user_id'nin unique olduğundan emin ol
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_user_id_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 4. social_stories'a foreign key ekle
ALTER TABLE social_stories 
ADD CONSTRAINT social_stories_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

-- 5. Kontrol et
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'social_stories' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'user_profiles';

-- Başarılı! Şimdi query çalışmalı.
