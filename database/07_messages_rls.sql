-- =====================================================
-- MESAJLAŞMA RLS POLİTİKALARI
-- Supabase SQL Editor'da çalıştır
-- =====================================================

-- 1. CONVERSATIONS TABLOSU RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece katıldığı sohbetleri görebilir
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Kullanıcı yeni sohbet oluşturabilir
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (true);

-- 2. CONVERSATION PARTICIPANTS TABLOSU RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece katıldığı sohbetlerin katılımcılarını görebilir
CREATE POLICY "Users can view participants of their conversations"
ON conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Kullanıcı sohbete katılımcı ekleyebilir
CREATE POLICY "Users can add participants"
ON conversation_participants FOR INSERT
WITH CHECK (true);

-- Kullanıcı kendi last_read_at'ini güncelleyebilir
CREATE POLICY "Users can update their own participant record"
ON conversation_participants FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. MESSAGES TABLOSU RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece katıldığı sohbetlerin mesajlarını görebilir
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Kullanıcı sadece katıldığı sohbetlere mesaj gönderebilir
CREATE POLICY "Users can send messages to their conversations"
ON messages FOR INSERT
WITH CHECK (
  -- Gönderenin auth.uid() olması ve conversation'ın katılımcısı olması
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
  -- Conversation içindeki diğer katılımcı ile accepted friendship olmalı (1:1 konuşma)
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = messages.conversation_id
      AND cp2.user_id <> auth.uid()
      AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = 'accepted'
          AND (
            (f.sender_id = auth.uid() AND f.receiver_id = cp2.user_id)
            OR (f.sender_id = cp2.user_id AND f.receiver_id = auth.uid())
          )
      )
  )
  -- Hem benim, hem diğer tarafın engellemesi yok (çift yönlü kontrol)
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users b
    WHERE (
      (b.blocker_id = auth.uid() AND b.blocked_id IN (
         SELECT cp3.user_id FROM conversation_participants cp3
         WHERE cp3.conversation_id = messages.conversation_id
           AND cp3.user_id <> auth.uid()
      ))
      OR
      (b.blocked_id = auth.uid() AND b.blocker_id IN (
         SELECT cp4.user_id FROM conversation_participants cp4
         WHERE cp4.conversation_id = messages.conversation_id
           AND cp4.user_id <> auth.uid()
      ))
    )
  )
);

-- Kullanıcı sadece kendi mesajlarını güncelleyebilir (is_read için)
CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Kullanıcı sadece kendi mesajlarını silebilir
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (sender_id = auth.uid());

-- 4. REALTIME İÇİN PUBLICATION OLUŞTUR
-- Mesajlar için realtime subscription
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- 5. REALTIME İÇİN EK POLİTİKA
-- Mesajları dinlemek için SELECT yetkisi gerekli
-- Bu politika zaten yukarıda var ama emin olmak için tekrar kontrol edelim

-- Kullanıcıların kendi sohbetlerindeki değişiklikleri dinleyebilmesi için
-- RLS politikalarının SELECT'e izin vermesi yeterli
-- Yukarıdaki "Users can view messages in their conversations" politikası bunu sağlıyor
