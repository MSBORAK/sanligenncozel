-- =====================================================
-- STORY ALICILAR - BASİT VERSİYON
-- Eğer 09_add_story_recipients.sql hata verirse bunu kullan
-- =====================================================

-- 1. Recipient kolonu ekle
ALTER TABLE social_stories 
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Index ekle
CREATE INDEX IF NOT EXISTS idx_social_stories_recipient_id ON social_stories(recipient_id);

-- 3. Süresi dolmuş story'leri sil fonksiyonu
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

-- 4. Story görüntüleme tablosu
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES social_stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);

-- 5. Story görüntüleme fonksiyonu
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

-- 6. Alınan story'ler view
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

-- 7. RLS için story_views tablosunu aktif et
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- BAŞARILI! 
-- Şimdi Supabase Dashboard'dan RLS politikalarını manuel olarak ekle:

-- social_stories için:
-- 1. "Users can view their own stories or stories sent to them" (SELECT)
--    USING: user_id = auth.uid() OR recipient_id = auth.uid() OR recipient_id IS NULL

-- 2. "Users can create their own stories" (INSERT)
--    WITH CHECK: user_id = auth.uid()

-- 3. "Users can delete their own stories" (DELETE)
--    USING: user_id = auth.uid()

-- story_views için:
-- 1. "Story owners can view their story views" (SELECT)
--    USING: EXISTS (SELECT 1 FROM social_stories WHERE social_stories.id = story_views.story_id AND social_stories.user_id = auth.uid())

-- 2. "Users can add their own views" (INSERT)
--    WITH CHECK: viewer_id = auth.uid()
