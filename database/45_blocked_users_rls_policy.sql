-- Engelleme özelliği RLS'de gerçekten uygulanmıyordu: block_user() friendships'i
-- siler ama conversation_participants'ı intact bırakır, yani engellenen kişi
-- eski conversation'lara mesaj gönderebiliyordu. Artık mesaj gönderme policy'si
-- de engelleme kontrol ediyor.

DROP POLICY IF EXISTS "Blocked users cannot send messages" ON messages;

CREATE POLICY "Blocked users cannot send messages"
ON messages
FOR INSERT
WITH CHECK (
  -- sender, konuşmadaki diğer katılımcı tarafından engellenmemiş olmalı
  NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocked_id = auth.uid()
      AND blocker_id IN (
        SELECT cp.user_id FROM conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id
          AND cp.user_id <> auth.uid()
      )
  )
);

COMMENT ON POLICY "Blocked users cannot send messages" ON messages IS
  'Engellenen kullanıcılar mesaj gönderemez; engelleme çift yönlü kontrol edilir';
