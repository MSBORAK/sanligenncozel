-- =====================================================
-- STORY ALICILAR (RECIPIENTS) EKLEME
-- Supabase SQL Editor'da çalıştır
-- =====================================================

-- 1. social_stories tablosuna recipient_id kolonu ekle
ALTER TABLE social_stories 
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_social_stories_recipient_id ON social_stories(recipient_id);

-- 3. RLS Politikasını Güncelle - Sadece alıcı ve gönderen görebilir
-- Önce mevcut politikaları kontrol et ve sil
DO $$ 
BEGIN
  -- View policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_stories' 
    AND policyname = 'Users can view stories'
  ) THEN
    DROP POLICY "Users can view stories" ON social_stories;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_stories' 
    AND policyname = 'Users can view their own stories or stories sent to them'
  ) THEN
    DROP POLICY "Users can view their own stories or stories sent to them" ON social_stories;
  END IF;

  -- Create policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_stories' 
    AND policyname = 'Users can create stories'
  ) THEN
    DROP POLICY "Users can create stories" ON social_stories;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_stories' 
    AND policyname = 'Users can create their own stories'
  ) THEN
    DROP POLICY "Users can create their own stories" ON social_stories;
  END IF;

  -- Delete policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'social_stories' 
    AND policyname = 'Users can delete their own stories'
  ) THEN
    DROP POLICY "Users can delete their own stories" ON social_stories;
  END IF;
END $$;

-- Yeni politikaları oluştur
CREATE POLICY "Users can view their own stories or stories sent to them"
ON social_stories FOR SELECT
USING (
  user_id = auth.uid() 
  OR recipient_id = auth.uid()
  OR recipient_id IS NULL  -- Public stories (eski veriler için)
);

-- 4. Story oluşturma politikası
CREATE POLICY "Users can create their own stories"
ON social_stories FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 5. Kendi story'lerini silebilir
CREATE POLICY "Users can delete their own stories"
ON social_stories FOR DELETE
USING (user_id = auth.uid());

-- 6. Süresi dolmuş story'leri otomatik sil (Function)
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM social_stories
  WHERE expires_at < NOW();
END;
$$;

-- 7. Cron job için (Supabase Dashboard'dan pg_cron extension'ı aktif et)
-- Dashboard > Database > Extensions > pg_cron (Enable)
-- Sonra bu komutu çalıştır:

-- Her saat başı süresi dolmuş story'leri sil
-- SELECT cron.schedule(
--   'delete-expired-stories',
--   '0 * * * *',  -- Her saat başı
--   $$SELECT delete_expired_stories()$$
-- );

-- Manuel olarak test et:
-- SELECT delete_expired_stories();

-- 8. Story görüntüleme sayısını takip et (opsiyonel)
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES social_stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);

-- RLS
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Önce mevcut politikaları kontrol et ve sil
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'story_views' 
    AND policyname = 'Story owners can view their story views'
  ) THEN
    DROP POLICY "Story owners can view their story views" ON story_views;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'story_views' 
    AND policyname = 'Users can add their own views'
  ) THEN
    DROP POLICY "Users can add their own views" ON story_views;
  END IF;
END $$;

-- Story sahibi görüntülemeleri görebilir
CREATE POLICY "Story owners can view their story views"
ON story_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM social_stories
    WHERE social_stories.id = story_views.story_id
    AND social_stories.user_id = auth.uid()
  )
);

-- Kullanıcılar kendi görüntülemelerini ekleyebilir
CREATE POLICY "Users can add their own views"
ON story_views FOR INSERT
WITH CHECK (viewer_id = auth.uid());

-- 9. Story görüntüleme fonksiyonu
CREATE OR REPLACE FUNCTION mark_story_as_viewed(
  p_story_id UUID,
  p_viewer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO story_views (story_id, viewer_id)
  VALUES (p_story_id, p_viewer_id)
  ON CONFLICT (story_id, viewer_id) DO NOTHING;
END;
$$;

-- 10. Kullanıcının story'lerini getir (alıcı olarak)
CREATE OR REPLACE VIEW my_received_stories AS
SELECT 
  s.id,
  s.user_id,
  s.image_url,
  s.created_at,
  s.expires_at,
  up.name as sender_name,
  up.username as sender_username,
  up.avatar_url as sender_avatar,
  (
    SELECT COUNT(*)
    FROM story_views sv
    WHERE sv.story_id = s.id
  ) as view_count,
  EXISTS (
    SELECT 1 FROM story_views sv
    WHERE sv.story_id = s.id AND sv.viewer_id = auth.uid()
  ) as is_viewed
FROM social_stories s
JOIN user_profiles up ON s.user_id = up.user_id
WHERE s.recipient_id = auth.uid()
  AND s.expires_at > NOW()
ORDER BY s.created_at DESC;
