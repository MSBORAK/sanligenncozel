-- =====================================================
-- GRUP KIVILCIMI GİZLİLİK DÜZELTMESİ
-- social_posts RLS politikası recipient_user_ids'e bakmıyordu —
-- bir kullanıcı 2-5 arkadaşına özel "grup kıvılcımı" gönderdiğinde,
-- client tarafı bunu doğru filtreliyordu ama DB seviyesinde gönderenin
-- TÜM arkadaşları (gruba dahil olmasalar bile) o kıvılcımı direkt API
-- isteğiyle görebiliyordu. Bu politika artık recipient_user_ids
-- doluysa SADECE o listedeki kişilerin (+ gönderenin) görmesine izin
-- veriyor; boşsa eskisi gibi arkadaş/herkese-açık kuralı geçerli.
-- =====================================================

DROP POLICY IF EXISTS "Posts visible to owner, friends, or if public" ON social_posts;

CREATE POLICY "Posts visible to owner, friends, or if public"
  ON social_posts FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      recipient_user_ids IS NOT NULL
      AND array_length(recipient_user_ids, 1) > 0
      AND auth.uid() = ANY(recipient_user_ids)
    )
    OR (
      (recipient_user_ids IS NULL OR array_length(recipient_user_ids, 1) IS NULL)
      AND (
        EXISTS (
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
      )
    )
  );
