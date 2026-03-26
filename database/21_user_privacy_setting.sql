-- Add privacy setting to user_profiles
-- is_public: true = herkese açık, false = sadece arkadaşlar

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_public 
ON user_profiles(is_public);

COMMENT ON COLUMN user_profiles.is_public IS 'true = herkese açık, false = sadece arkadaşlar';
