-- =====================================================
-- Sohbet: yanıtlama, kalp tepkisi, görüldü (mevcut is_read ile UI)
-- Supabase SQL Editor'da çalıştır
-- =====================================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_snippet TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS heart_user_ids UUID[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);

COMMENT ON COLUMN messages.reply_snippet IS 'Yanıtlanan mesajın kısa metni (istemci doldurur)';
COMMENT ON COLUMN messages.heart_user_ids IS 'Kalp bırakan kullanıcı id listesi';

-- Güvenli kalp toggle: sadece sohbet katılımcıları
CREATE OR REPLACE FUNCTION toggle_message_heart(p_message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  conv UUID;
  arr UUID[];
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT conversation_id, COALESCE(heart_user_ids, '{}')
  INTO conv, arr
  FROM messages
  WHERE id = p_message_id;

  IF conv IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv AND user_id = uid
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF uid = ANY(arr) THEN
    UPDATE messages
    SET heart_user_ids = array_remove(arr, uid)
    WHERE id = p_message_id;
  ELSE
    UPDATE messages
    SET heart_user_ids = arr || uid
    WHERE id = p_message_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_message_heart(UUID) TO authenticated;
