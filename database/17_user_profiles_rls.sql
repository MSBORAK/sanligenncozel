-- =====================================================
-- USER PROFILES RLS POLİTİKALARI
-- Profil güncelleme için gerekli
-- =====================================================

-- RLS'i etkinleştir
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Herkes profilleri görebilir
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON user_profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON user_profiles FOR SELECT 
  USING (true);

-- Kullanıcılar kendi profillerini oluşturabilir
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
CREATE POLICY "Users can create their own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi profillerini güncelleyebilir
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Kullanıcılar kendi profillerini silebilir
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
CREATE POLICY "Users can delete their own profile" 
  ON user_profiles FOR DELETE 
  USING (auth.uid() = user_id);
