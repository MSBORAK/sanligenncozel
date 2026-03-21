-- =====================================================
-- MESAJLAŞMA TEST VE DEBUG
-- Supabase SQL Editor'da çalıştır
-- =====================================================

-- 1. MEVCUT KULLANICILARI GÖSTER
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. USER PROFILES KONTROL
SELECT 
  user_id,
  username,
  name,
  avatar_url
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- 3. MEVCUT SOHBETLERİ GÖSTER
SELECT 
  c.id as conversation_id,
  c.created_at,
  c.updated_at,
  (
    SELECT json_agg(json_build_object(
      'user_id', up.user_id,
      'username', up.username,
      'name', up.name
    ))
    FROM conversation_participants cp
    JOIN user_profiles up ON cp.user_id = up.user_id
    WHERE cp.conversation_id = c.id
  ) as participants,
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
  ) as message_count
FROM conversations c
ORDER BY c.updated_at DESC;

-- 4. TÜM MESAJLARI GÖSTER
SELECT 
  m.id,
  m.conversation_id,
  up.username as sender_username,
  up.name as sender_name,
  m.content,
  m.is_read,
  m.created_at
FROM messages m
JOIN user_profiles up ON m.sender_id = up.user_id
ORDER BY m.created_at DESC
LIMIT 50;

-- 5. BELİRLİ BİR SOHBET İÇİN MESAJLAR
-- conversation_id'yi değiştir
SELECT 
  m.id,
  up.username as sender,
  m.content,
  m.is_read,
  m.created_at
FROM messages m
JOIN user_profiles up ON m.sender_id = up.user_id
WHERE m.conversation_id = 'CONVERSATION_ID_BURAYA' -- Değiştir
ORDER BY m.created_at ASC;

-- 6. RLS POLİTİKALARINI KONTROL ET
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, policyname;

-- 7. REALTIME PUBLICATION KONTROL
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('conversations', 'conversation_participants', 'messages');

-- 8. İKİ KULLANICI ARASINDA SOHBET OLUŞTUR (TEST)
-- user1_id ve user2_id'yi değiştir
SELECT get_or_create_conversation(
  'USER1_ID_BURAYA'::uuid,  -- İlk kullanıcı ID
  'USER2_ID_BURAYA'::uuid   -- İkinci kullanıcı ID
);

-- 9. TEST MESAJI GÖNDER
-- conversation_id ve sender_id'yi değiştir
INSERT INTO messages (conversation_id, sender_id, content)
VALUES (
  'CONVERSATION_ID_BURAYA'::uuid,  -- Sohbet ID
  'SENDER_ID_BURAYA'::uuid,        -- Gönderen kullanıcı ID
  'Test mesajı - ' || NOW()::text
);

-- 10. OKUNMAMIŞ MESAJ SAYISI
-- user_id'yi değiştir
SELECT 
  c.id as conversation_id,
  (
    SELECT json_agg(json_build_object('username', up.username, 'name', up.name))
    FROM conversation_participants cp
    JOIN user_profiles up ON cp.user_id = up.user_id
    WHERE cp.conversation_id = c.id AND cp.user_id != 'USER_ID_BURAYA'::uuid
  ) as other_users,
  (
    SELECT COUNT(*)
    FROM messages m
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.conversation_id = c.id 
      AND m.sender_id != 'USER_ID_BURAYA'::uuid
      AND m.created_at > cp.last_read_at
      AND cp.user_id = 'USER_ID_BURAYA'::uuid
  ) as unread_count
FROM conversations c
WHERE EXISTS (
  SELECT 1 FROM conversation_participants
  WHERE conversation_id = c.id AND user_id = 'USER_ID_BURAYA'::uuid
);

-- 11. MESAJLARI OKUNDU OLARAK İŞARETLE (TEST)
-- conversation_id ve user_id'yi değiştir
SELECT mark_messages_as_read(
  'CONVERSATION_ID_BURAYA'::uuid,  -- Sohbet ID
  'USER_ID_BURAYA'::uuid           -- Kullanıcı ID
);

-- 12. TÜM MESAJLAŞMA VERİLERİNİ TEMİZLE (DİKKAT!)
-- Sadece test ortamında kullan!
-- TRUNCATE messages CASCADE;
-- TRUNCATE conversation_participants CASCADE;
-- TRUNCATE conversations CASCADE;

-- 13. REALTIME BAĞLANTILARINI KONTROL ET
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE application_name LIKE '%realtime%'
OR query LIKE '%messages%';
