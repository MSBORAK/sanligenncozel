-- Arkadaşlık isteği göndermede hiçbir sınır yoktu — kod tarafında sadece
-- çift tıklamayı engelleyen bir state vardı (sendingRequestTo), bu da
-- doğrudan API çağrısıyla kolayca atlanabilir. Bir kullanıcı script ile
-- saniyede yüzlerce istek atıp herkesi taciz edebilirdi. Basit ama etkili
-- bir üst sınır: bir kullanıcının aynı anda en fazla 50 "pending" (bekleyen)
-- giden isteği olabilir — bu sınıra ulaşınca yeni istek reddedilir, kabul/red
-- ile sayı düşünce tekrar istek atabilir.

CREATE OR REPLACE FUNCTION check_pending_friend_request_limit()
RETURNS TRIGGER AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT COUNT(*) INTO pending_count
    FROM friendships
    WHERE sender_id = NEW.sender_id AND status = 'pending';

    IF pending_count >= 50 THEN
      RAISE EXCEPTION 'Çok fazla bekleyen arkadaşlık isteğin var, önce bazılarının yanıtlanmasını bekle.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_pending_friend_request_limit ON friendships;
CREATE TRIGGER trigger_check_pending_friend_request_limit
BEFORE INSERT ON friendships
FOR EACH ROW
EXECUTE FUNCTION check_pending_friend_request_limit();
