-- =====================================================
-- MESSAGES TABLOSU RLS POLİTİKALARINI KONTROL ET
-- Supabase SQL Editor'da çalıştır
-- =====================================================

-- 1. Messages tablosu politikalarını kontrol et
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'messages';

-- 2. Conversations tablosu politikalarını kontrol et
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'conversations';

-- 3. Conversation participants tablosu politikalarını kontrol et
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'conversation_participants';

-- 4. Hangi tablolar realtime'da aktif kontrol et
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 5. Replica identity kontrol et
SELECT n.nspname as schemaname, c.relname as tablename, c.relreplident
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN ('messages', 'conversations', 'conversation_participants', 'social_stories')
ORDER BY c.relname;

-- Beklenen sonuçlar:
-- relreplident = 'f' ise REPLICA IDENTITY FULL (istediğimiz bu)
-- relreplident = 'd' ise REPLICA IDENTITY DEFAULT
