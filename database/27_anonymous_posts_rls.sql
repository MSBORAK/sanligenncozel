-- =====================================================
-- ANONYMOUS_POSTS RLS POLİTİKALARI
-- Şehir Radarı ısı haritası için kullanılan tablo.
-- Şu ana kadar RLS kapalıydı: herkes (anon key ile) okuyabiliyor,
-- yazabiliyor VE silebiliyordu. Bu migration bunu kapatır.
-- =====================================================

ALTER TABLE anonymous_posts ENABLE ROW LEVEL SECURITY;

-- Herkes ısı haritası noktalarını görebilir (radar herkese açık)
DROP POLICY IF EXISTS "Anonymous posts are viewable by everyone" ON anonymous_posts;
CREATE POLICY "Anonymous posts are viewable by everyone"
  ON anonymous_posts FOR SELECT
  USING (true);

-- Sadece giriş yapmış kullanıcılar yeni nokta ekleyebilir (kıvılcım paylaşırken)
DROP POLICY IF EXISTS "Authenticated users can insert anonymous posts" ON anonymous_posts;
CREATE POLICY "Authenticated users can insert anonymous posts"
  ON anonymous_posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE ve DELETE için hiçbir politika yok = kimse (anon dahil) değiştiremez/silemez
