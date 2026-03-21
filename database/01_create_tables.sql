-- =====================================================
-- SOSYAL MEDYA TABLOLARI
-- Supabase SQL Editor'da sırayla çalıştır
-- =====================================================

-- 1. SOCIAL POSTS TABLOSU
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC);

-- 2. SOCIAL LIKES TABLOSU
CREATE TABLE IF NOT EXISTS social_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON social_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_user_id ON social_likes(user_id);

-- 3. SOCIAL COMMENTS TABLOSU
CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_user_id ON social_comments(user_id);

-- 4. SOCIAL SAVES TABLOSU
CREATE TABLE IF NOT EXISTS social_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_social_saves_post_id ON social_saves(post_id);
CREATE INDEX IF NOT EXISTS idx_social_saves_user_id ON social_saves(user_id);

-- 5. SOCIAL STORIES TABLOSU
CREATE TABLE IF NOT EXISTS social_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_social_stories_user_id ON social_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_social_stories_expires_at ON social_stories(expires_at);

-- 6. SOCIAL FOLLOWS TABLOSU
CREATE TABLE IF NOT EXISTS social_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_social_follows_follower_id ON social_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_follows_following_id ON social_follows(following_id);

-- 7. USER PROFILES TABLOSU (Eğer yoksa oluştur)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Eğer user_profiles zaten varsa, sadece eksik kolonları ekle
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
  END IF;
END $$;
