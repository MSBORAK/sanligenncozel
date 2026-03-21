-- =====================================================
-- HIZLI TEST VERİSİ
-- Kendi user_id'nle değiştir ve çalıştır
-- =====================================================

-- 1. Önce kendi user_id'ni bul:
-- SELECT id, email FROM auth.users LIMIT 1;

-- 2. Aşağıdaki 'YOUR_USER_ID_HERE' kısımlarını kendi user_id'nle değiştir

-- User Profile Oluştur/Güncelle
INSERT INTO user_profiles (user_id, name, username, avatar_url, bio)
VALUES 
  ('YOUR_USER_ID_HERE', 'Mert Yılmaz', '@mert', 'https://i.pravatar.cc/150?img=33', 'Şanlıurfa''dan merhaba! 👋')
ON CONFLICT (user_id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;

-- Örnek Postlar Ekle
INSERT INTO social_posts (user_id, content, image_url, likes_count, comments_count)
VALUES 
  ('YOUR_USER_ID_HERE', 'Bugün Balıklıgöl''de harika bir gün geçirdik! Şanlıurfa''nın tarihi dokusu muhteşem 🌟', 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?q=80&w=800', 234, 45),
  ('YOUR_USER_ID_HERE', 'Urfa kebabı deneyimi 🍖 Bu lezzeti kaçırmayın!', 'https://images.unsplash.com/photo-1529042410759-befb1204b468?q=80&w=800', 567, 89),
  ('YOUR_USER_ID_HERE', 'Harran''ın kümbet evleri 🏠 Tarihe yolculuk gibi...', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800', 892, 123);

-- Örnek Story Ekle (24 saat sonra otomatik silinir)
INSERT INTO social_stories (user_id, image_url)
VALUES 
  ('YOUR_USER_ID_HERE', 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?q=80&w=400');
