-- =====================================================
-- ENGELLEME (BLOCK USER) ÖZELLİĞİ
-- ŞanlıSosyal'in normal bir sosyal medya gibi davranması için
-- engelleme sistemi ekleniyor. Engellenen kullanıcı: arama
-- sonuçlarında çıkmaz, arkadaşlık isteği gönderemez/gönderilemez,
-- kıvılcım alıcı listesinde görünmez, mesaj gönderemez.
-- =====================================================

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi engellediklerini ve kendisini engelleyenleri görebilir
-- (kendisini kimin engellediğini görmesi, o kişinin profiline erişimini
-- kısıtlamak için client tarafında gerekli).
DROP POLICY IF EXISTS "Users can view blocks involving them" ON blocked_users;
CREATE POLICY "Users can view blocks involving them"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

DROP POLICY IF EXISTS "Users can unblock their own blocks" ON blocked_users;
CREATE POLICY "Users can unblock their own blocks"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- Engelleme sırasında aradaki arkadaşlığı da otomatik sonlandıran fonksiyon
CREATE OR REPLACE FUNCTION block_user(p_blocked_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO blocked_users (blocker_id, blocked_id)
  VALUES (auth.uid(), p_blocked_id)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

  DELETE FROM friendships
  WHERE (sender_id = auth.uid() AND receiver_id = p_blocked_id)
     OR (sender_id = p_blocked_id AND receiver_id = auth.uid());
END;
$$;

REVOKE EXECUTE ON FUNCTION block_user(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION block_user(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION block_user(UUID) TO authenticated;

-- FRIENDSHIPS: engelli kişi arkadaşlık isteği gönderemesin
DROP POLICY IF EXISTS "Users can create friendship requests" ON friendships;
CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b
      WHERE (b.blocker_id = receiver_id AND b.blocked_id = sender_id)
         OR (b.blocker_id = sender_id AND b.blocked_id = receiver_id)
    )
  );
