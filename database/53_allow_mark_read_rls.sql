-- "Görüldü" hiç işaretlenmiyordu: messages tablosundaki UPDATE RLS kuralı
-- ("Users can update their own messages") sadece sender_id = auth.uid()
-- olan satırları güncellemeye izin veriyordu. Ama mark_messages_as_read()
-- fonksiyonu, ALICININ (mesajı okuyan kişi, sender_id != auth.uid()) karşı
-- tarafın gönderdiği mesajları is_read=true yapmasını gerektiriyor. Fonksiyon
-- SECURITY DEFINER olsa da, bu ayrı bir policy ile garantiye alınıyor —
-- kullanıcı sadece is_read alanını, sadece kendi katıldığı bir sohbette,
-- sadece kendisine gelen (sender_id kendisi olmayan) mesajlarda
-- güncelleyebilir.

DROP POLICY IF EXISTS "Users can mark received messages as read" ON messages;
CREATE POLICY "Users can mark received messages as read"
ON messages FOR UPDATE
USING (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
)
WITH CHECK (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
);
