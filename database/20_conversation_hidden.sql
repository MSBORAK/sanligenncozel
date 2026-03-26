-- =====================================================
-- CONVERSATION HIDDEN COLUMN
-- Kullanıcılar sohbeti sadece kendileri için gizleyebilir
-- =====================================================

-- conversation_participants tablosuna hidden kolonu ekle
ALTER TABLE conversation_participants 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- Mevcut null değerleri false'a çevir
UPDATE conversation_participants 
SET hidden = false 
WHERE hidden IS NULL;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_conversation_participants_hidden 
ON conversation_participants(user_id, hidden);
