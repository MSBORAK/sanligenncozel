-- "Sohbeti sil" artık gerçek bir sıfırlama noktası oluşturuyor: silme anından
-- ÖNCEKİ mesajlar, o kullanıcı için bir daha hiç görünmez (WhatsApp mantığı).
-- Karşı taraf kendi tarafında hâlâ görebilir; hiçbir mesaj veritabanından
-- gerçekten silinmiyor, sadece "bu tarihten önceki mesajları bana gösterme"
-- işareti konuyor.
--
-- Önceki hata: "hidden" kolonu sadece listeden gizliyordu ama Kullanıcı Ara /
-- bildirim gibi yollarla aynı sohbete tekrar girildiğinde TÜM eski mesajlar
-- (silme öncesi dahil) yeniden görünüyordu — ayrıca yeni mesaj geldiğinde
-- "hidden"ı false'a çeviren hiçbir mekanizma yoktu, yani silme sonrası karşı
-- taraf tekrar yazarsa sohbet listede bir daha asla görünmüyordu.

ALTER TABLE conversation_participants
ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ;

COMMENT ON COLUMN conversation_participants.hidden_at IS 'Bu tarihten önceki mesajlar bu kullanıcı için gösterilmez (sohbeti sil = sıfırlama noktası)';

-- Yeni mesaj gelince alıcı tarafında hidden=false yap, sohbet listede tekrar görünsün.
CREATE OR REPLACE FUNCTION unhide_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_participants
  SET hidden = false
  WHERE conversation_id = NEW.conversation_id
    AND user_id <> NEW.sender_id
    AND hidden = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_unhide_conversation_on_new_message ON messages;
CREATE TRIGGER trigger_unhide_conversation_on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION unhide_conversation_on_new_message();
