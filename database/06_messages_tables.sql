-- =====================================================
-- MESAJLAŞMA TABLOLARI
-- Supabase SQL Editor'da çalıştır
-- =====================================================

-- 1. CONVERSATIONS (Sohbetler) TABLOSU
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CONVERSATION PARTICIPANTS (Sohbet Katılımcıları) TABLOSU
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- 3. MESSAGES (Mesajlar) TABLOSU
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- 4. CONVERSATION VIEW (Son mesaj bilgisi ile sohbetler)
CREATE OR REPLACE VIEW conversation_list AS
SELECT 
  c.id as conversation_id,
  c.created_at,
  c.updated_at,
  cp.user_id,
  (
    SELECT json_agg(json_build_object(
      'user_id', up.user_id,
      'name', up.name,
      'username', up.username,
      'avatar_url', up.avatar_url
    ))
    FROM conversation_participants cp2
    JOIN user_profiles up ON cp2.user_id = up.user_id
    WHERE cp2.conversation_id = c.id AND cp2.user_id != cp.user_id
  ) as other_participants,
  (
    SELECT json_build_object(
      'id', m.id,
      'content', m.content,
      'image_url', m.image_url,
      'sender_id', m.sender_id,
      'created_at', m.created_at,
      'is_read', m.is_read
    )
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) as last_message,
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id 
      AND m.sender_id != cp.user_id
      AND m.created_at > cp.last_read_at
  ) as unread_count
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id;

-- 5. FUNCTION: İki kullanıcı arasında sohbet oluştur veya mevcut olanı getir
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Mevcut sohbeti bul
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
  )
  AND (
    SELECT COUNT(*) FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
  ) = 2
  LIMIT 1;

  -- Eğer yoksa yeni oluştur
  IF conversation_id IS NULL THEN
    INSERT INTO conversations DEFAULT VALUES
    RETURNING id INTO conversation_id;

    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
      (conversation_id, user1_id),
      (conversation_id, user2_id);
  END IF;

  RETURN conversation_id;
END;
$$;

-- 6. FUNCTION: Mesaj gönderildiğinde conversation'ı güncelle
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Trigger oluştur
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- 7. FUNCTION: Mesajları okundu olarak işaretle
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mesajları okundu olarak işaretle
  UPDATE messages
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE;

  -- Kullanıcının last_read_at'ini güncelle
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$;
