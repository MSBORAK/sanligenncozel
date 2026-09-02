-- 43'teki tetikleyici sadece ALICI tarafını (user_id <> sender_id) tekrar
-- görünür yapıyordu. Ama bir kullanıcı bir sohbeti sildikten SONRA kendisi
-- o kişiye tekrar mesaj/tepki gönderirse (örn. Kıvılcım'a tepki), gönderenin
-- kendi tarafı hâlâ "hidden=true" kalıyordu — mesaj gitti ama kendi Mesajlar
-- listesinde görünmüyordu. Artık yeni mesaj geldiğinde HER İKİ tarafın da
-- hidden'ı false'a çevriliyor.

CREATE OR REPLACE FUNCTION unhide_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_participants
  SET hidden = false
  WHERE conversation_id = NEW.conversation_id
    AND hidden = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
