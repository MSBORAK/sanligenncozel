-- Şehir Radarı için anonim nokta tablosu
-- Not: user_id tutulmaz; yalnızca bölgesel ısı verisi amaçlıdır.

CREATE TABLE IF NOT EXISTS anonymous_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  district TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anonymous_posts_created_at ON anonymous_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anonymous_posts_lat_lng ON anonymous_posts(latitude, longitude);
