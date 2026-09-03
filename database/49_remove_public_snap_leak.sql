-- GİZLİLİK AÇIĞI: social_posts SELECT RLS'inde "is_public = true" dalı hâlâ
-- duruyordu. SosyalScreen.tsx'teki yorum satırı "ŞanlıSosyal artık sadece
-- arkadaşlara özel — Herkes akışı kaldırıldı" diyor ve uygulama arayüzü bunu
-- doğru şekilde uyguluyor (client-side filtre), AMA veritabanı hâlâ eski
-- kuralı taşıyor: is_public=true olan bir kullanıcının TÜM kıvılcımları
-- (GPS konumu, foto/video URL'si dahil) arkadaş olmayan HERKES tarafından
-- doğrudan Supabase REST/anon key ile okunabiliyordu — uygulamanın kendi
-- arayüzü bunu göstermese bile ham veri sızdırıyordu.

DROP POLICY IF EXISTS "Posts visible to owner, friends, or if public" ON social_posts;

CREATE POLICY "Posts visible to owner, recipients, or accepted friends"
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
      AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = 'accepted'
          AND (
            (f.sender_id = auth.uid() AND f.receiver_id = social_posts.user_id)
            OR (f.receiver_id = auth.uid() AND f.sender_id = social_posts.user_id)
          )
      )
    )
  );
