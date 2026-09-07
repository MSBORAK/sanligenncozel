-- =====================================================
-- SAHTE İSTEK AÇIĞI: toggle_like / toggle_save / toggle_follow /
-- mark_story_as_viewed fonksiyonları SECURITY DEFINER olmasına
-- rağmen p_user_id / p_follower_id / p_viewer_id parametresini
-- auth.uid() ile karşılaştırmadan kabul ediyordu. Yani herhangi bir
-- authenticated kullanıcı, bu parametreye BAŞKA bir kullanıcının
-- ID'sini vererek onun adına beğeni/kaydetme/takip işlemi yapabilir
-- veya story görüntüleme kaydı sahteleyebilirdi (rpc() çağrısı
-- doğrudan client'tan yapılabildiği için). Aynı sınıf açık
-- mark_snap_viewed ve mark_messages_as_read için daha önce
-- kapatılmıştı (33/41), bu dördü gözden kaçmıştı.
-- =====================================================

CREATE OR REPLACE FUNCTION toggle_like(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Yetkisiz: sadece kendi adına beğeni işlemi yapabilirsin';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM social_likes
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM social_likes
    WHERE post_id = p_post_id AND user_id = p_user_id;

    UPDATE social_posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = p_post_id;

    RETURN FALSE;
  ELSE
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

CREATE OR REPLACE FUNCTION toggle_save(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Yetkisiz: sadece kendi adına kaydetme işlemi yapabilirsin';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM social_saves
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM social_saves
    WHERE post_id = p_post_id AND user_id = p_user_id;
    RETURN FALSE;
  ELSE
    INSERT INTO social_saves (post_id, user_id)
    VALUES (p_post_id, p_user_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_follow(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_follower_id THEN
    RAISE EXCEPTION 'Yetkisiz: sadece kendi adına takip işlemi yapabilirsin';
  END IF;

  IF p_follower_id = p_following_id THEN
    RAISE EXCEPTION 'Cannot follow yourself';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM social_follows
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM social_follows
    WHERE follower_id = p_follower_id AND following_id = p_following_id;

    UPDATE user_profiles
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE user_id = p_follower_id;

    UPDATE user_profiles
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE user_id = p_following_id;

    RETURN FALSE;
  ELSE
    INSERT INTO social_follows (follower_id, following_id)
    VALUES (p_follower_id, p_following_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;

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

CREATE OR REPLACE FUNCTION mark_story_as_viewed(
  p_story_id UUID,
  p_viewer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_viewer_id THEN
    RAISE EXCEPTION 'Yetkisiz: sadece kendi görüntüleme kaydını oluşturabilirsin';
  END IF;

  INSERT INTO story_views (story_id, viewer_id)
  VALUES (p_story_id, p_viewer_id)
  ON CONFLICT (story_id, viewer_id) DO NOTHING;
END;
$$;

-- anon/misafir bu fonksiyonları hiç çağıramamalı; sadece giriş yapmış
-- kullanıcı, sadece kendi ID'siyle çağırabilir (yukarıdaki auth.uid()
-- kontrolüyle garanti altına alındı).
REVOKE EXECUTE ON FUNCTION toggle_like(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION toggle_like(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION toggle_like(UUID, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION toggle_save(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION toggle_save(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION toggle_save(UUID, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION toggle_follow(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION toggle_follow(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION toggle_follow(UUID, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION mark_story_as_viewed(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION mark_story_as_viewed(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION mark_story_as_viewed(UUID, UUID) TO authenticated;
