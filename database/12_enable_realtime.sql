-- =====================================================
-- REALTIME AYARLARI
-- Supabase SQL Editor'da çalıştır
-- =====================================================

-- 1. Realtime için tabloları publication'a ekle
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE social_stories;

-- 2. Realtime için replica identity ayarla (değişikliklerin takibi için)
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE conversation_participants REPLICA IDENTITY FULL;
ALTER TABLE social_stories REPLICA IDENTITY FULL;

-- 3. Kontrol et - hangi tablolar realtime'da aktif
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 4. RLS politikalarını kontrol et
-- Realtime çalışması için SELECT politikası olmalı
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'conversations', 'conversation_participants', 'social_stories');
