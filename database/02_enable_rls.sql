-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- Güvenlik için mutlaka çalıştır
-- =====================================================

-- 1. SOCIAL POSTS RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON social_posts;
CREATE POLICY "Posts are viewable by everyone" 
  ON social_posts FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can create their own posts" ON social_posts;
CREATE POLICY "Users can create their own posts" 
  ON social_posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON social_posts;
CREATE POLICY "Users can update their own posts" 
  ON social_posts FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON social_posts;
CREATE POLICY "Users can delete their own posts" 
  ON social_posts FOR DELETE 
  USING (auth.uid() = user_id);

-- 2. SOCIAL LIKES RLS
ALTER TABLE social_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON social_likes;
CREATE POLICY "Likes are viewable by everyone" 
  ON social_likes FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON social_likes;
CREATE POLICY "Users can like posts" 
  ON social_likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON social_likes;
CREATE POLICY "Users can unlike posts" 
  ON social_likes FOR DELETE 
  USING (auth.uid() = user_id);

-- 3. SOCIAL COMMENTS RLS
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON social_comments;
CREATE POLICY "Comments are viewable by everyone" 
  ON social_comments FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON social_comments;
CREATE POLICY "Users can create comments" 
  ON social_comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON social_comments;
CREATE POLICY "Users can update their own comments" 
  ON social_comments FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON social_comments;
CREATE POLICY "Users can delete their own comments" 
  ON social_comments FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. SOCIAL SAVES RLS
ALTER TABLE social_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saves" ON social_saves;
CREATE POLICY "Users can view their own saves" 
  ON social_saves FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save posts" ON social_saves;
CREATE POLICY "Users can save posts" 
  ON social_saves FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave posts" ON social_saves;
CREATE POLICY "Users can unsave posts" 
  ON social_saves FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. SOCIAL STORIES RLS
ALTER TABLE social_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active stories are viewable by everyone" ON social_stories;
CREATE POLICY "Active stories are viewable by everyone" 
  ON social_stories FOR SELECT 
  USING (expires_at > NOW());

DROP POLICY IF EXISTS "Users can create their own stories" ON social_stories;
CREATE POLICY "Users can create their own stories" 
  ON social_stories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stories" ON social_stories;
CREATE POLICY "Users can delete their own stories" 
  ON social_stories FOR DELETE 
  USING (auth.uid() = user_id);

-- 6. SOCIAL FOLLOWS RLS
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON social_follows;
CREATE POLICY "Follows are viewable by everyone" 
  ON social_follows FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON social_follows;
CREATE POLICY "Users can follow others" 
  ON social_follows FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow others" ON social_follows;
CREATE POLICY "Users can unfollow others" 
  ON social_follows FOR DELETE 
  USING (auth.uid() = follower_id);
