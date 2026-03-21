-- =====================================================
-- DATABASE FUNCTIONS (Optimizasyon)
-- =====================================================

-- 1. LIKE/UNLIKE TOGGLE FUNCTION
CREATE OR REPLACE FUNCTION toggle_like(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Like var mı kontrol et
  SELECT EXISTS(
    SELECT 1 FROM social_likes 
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Unlike
    DELETE FROM social_likes 
    WHERE post_id = p_post_id AND user_id = p_user_id;
    
    UPDATE social_posts 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = p_post_id;
    
    RETURN FALSE;
  ELSE
    -- Like
    INSERT INTO social_likes (post_id, user_id) 
    VALUES (p_post_id, p_user_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
    
    UPDATE social_posts 
    SET likes_count = likes_count + 1 
    WHERE id = p_post_id;
    
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SAVE/UNSAVE TOGGLE FUNCTION
CREATE OR REPLACE FUNCTION toggle_save(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM social_saves 
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Unsave
    DELETE FROM social_saves 
    WHERE post_id = p_post_id AND user_id = p_user_id;
    RETURN FALSE;
  ELSE
    -- Save
    INSERT INTO social_saves (post_id, user_id) 
    VALUES (p_post_id, p_user_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FOLLOW/UNFOLLOW TOGGLE FUNCTION
CREATE OR REPLACE FUNCTION toggle_follow(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Kendini takip edemez
  IF p_follower_id = p_following_id THEN
    RAISE EXCEPTION 'Cannot follow yourself';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM social_follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Unfollow
    DELETE FROM social_follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id;
    
    -- Follower/following sayılarını güncelle
    UPDATE user_profiles 
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE user_id = p_follower_id;
    
    UPDATE user_profiles 
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE user_id = p_following_id;
    
    RETURN FALSE;
  ELSE
    -- Follow
    INSERT INTO social_follows (follower_id, following_id) 
    VALUES (p_follower_id, p_following_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
    
    -- Follower/following sayılarını güncelle
    UPDATE user_profiles 
    SET following_count = following_count + 1
    WHERE user_id = p_follower_id;
    
    UPDATE user_profiles 
    SET followers_count = followers_count + 1
    WHERE user_id = p_following_id;
    
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. COMMENT COUNT TRIGGER
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comments_count ON social_comments;
CREATE TRIGGER trigger_update_comments_count
AFTER INSERT OR DELETE ON social_comments
FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- 5. AUTO DELETE EXPIRED STORIES (Opsiyonel - Cron job ile çalıştır)
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM social_stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
