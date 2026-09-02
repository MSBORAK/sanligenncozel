-- =====================================================
-- KALICI KIVILCIM GRUPLARI
-- Kullanıcı isim verip kaydedebildiği, tekrar tekrar kullanabildiği
-- arkadaş gruplarını saklar (örn. "Yakın Arkadaşlar").
-- =====================================================

CREATE TABLE IF NOT EXISTS snap_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  member_user_ids UUID[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snap_groups_owner ON snap_groups(owner_id);

ALTER TABLE snap_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own groups" ON snap_groups;
CREATE POLICY "Users manage their own groups"
  ON snap_groups FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
