-- =====================================================
-- ŞANLISOSYAL GİZLİLİK DÜZELTMESİ
-- Test: social_posts ve friendships tabloları oturum açmadan
-- (anon key ile) TAMAMEN okunabiliyordu — gerçek kıvılcım
-- fotoğrafları/videoları, GPS konumu ve tüm arkadaşlık grafiği
-- herkese açıktı, uygulamanın arkadaş/gizlilik mantığı sadece
-- istemci tarafında (UI) uygulanıyordu, veritabanı korumuyordu.
-- Bu migration bunu düzeltir.
-- =====================================================

-- 1) SOCIAL_POSTS: sadece sahibi, kabul edilmiş arkadaşları,
--    veya profili herkese açık (is_public = true) olan kullanıcının
--    paylaşımları görülebilir.
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON social_posts;
DROP POLICY IF EXISTS "Posts visible to owner, friends, or if public" ON social_posts;
CREATE POLICY "Posts visible to owner, friends, or if public"
  ON social_posts FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.sender_id = auth.uid() AND f.receiver_id = social_posts.user_id)
          OR (f.receiver_id = auth.uid() AND f.sender_id = social_posts.user_id)
        )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = social_posts.user_id AND up.is_public = true
    )
  );

-- 2) FRIENDSHIPS: RLS'i etkinleştir (kapalıysa). Kabul edilmiş
--    arkadaşlıklar (profildeki "arkadaş sayısı" gibi özellikler için)
--    oturum açmış herkese görünür kalır; bekleyen istekler ise
--    sadece isteği gönderen/alan kişiye görünür (kimin kime istek
--    attığı üçüncü kişilere sızmasın diye).
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Friendships are viewable by everyone" ON friendships;
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
CREATE POLICY "Accepted friendships visible to logged-in users, pending only to parties"
  ON friendships FOR SELECT
  USING (
    (status = 'accepted' AND auth.uid() IS NOT NULL)
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
  );

DROP POLICY IF EXISTS "Users can create friendship requests" ON friendships;
CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their own friendships" ON friendships;
CREATE POLICY "Users can update their own friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their own friendships" ON friendships;
CREATE POLICY "Users can delete their own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 3) USER_PROFILES: push_token hiçbir ekranda başka kullanıcılar
--    tarafından okunmuyor (sadece sahibi kendi tokenini yazıyor),
--    bu yüzden herkese açık SELECT'ten çıkarılıyor.
REVOKE SELECT (push_token) ON user_profiles FROM anon, authenticated;
