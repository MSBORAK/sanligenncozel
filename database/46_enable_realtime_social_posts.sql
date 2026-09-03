-- Akış (Kıvılcım) sekmesi yeni paylaşımı anında göstermiyordu çünkü
-- social_posts tablosu supabase_realtime publication'ına hiç eklenmemişti
-- (messages/conversations/conversation_participants/social_stories eklenmiş
-- ama social_posts unutulmuş). Kullanıcı sekmeden çıkıp geri dönmeden yeni
-- kıvılcımı göremiyordu. Aynı şekilde friendships de eklenmemişti: birini
-- arkadaşlıktan çıkarınca/engelleyince Akış ekranı bunu anında yakalayamıyor,
-- çıkarılan kişinin kıvılcımı listede kalmaya devam ediyordu.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'social_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_posts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'blocked_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blocked_users;
  END IF;
END $$;

ALTER TABLE social_posts REPLICA IDENTITY FULL;
ALTER TABLE friendships REPLICA IDENTITY FULL;
ALTER TABLE blocked_users REPLICA IDENTITY FULL;
