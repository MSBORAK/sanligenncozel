-- =====================================================
-- 1) update_user_avatar RPC — Şanlı Sosyal profil ekranındaki
-- avatar değiştirme, hiçbir migration'da tanımlı olmayan bu
-- fonksiyonu çağırıyordu (muhtemelen panelden elle oluşturulmuştu).
-- Kayıp/tutarsız olma ihtimaline karşı burada güvence altına alıyoruz.
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_avatar(p_user_id UUID, p_avatar_url TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Yetkisiz: sadece kendi avatarını güncelleyebilirsin';
  END IF;

  UPDATE user_profiles
  SET avatar_url = p_avatar_url, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_user_avatar(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION update_user_avatar(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION update_user_avatar(UUID, TEXT) TO authenticated;

-- =====================================================
-- 2) Hesap silindiğinde storage'daki dosyaları da temizle.
-- Avatar iki farklı yolda yükleniyor olabilir (CompleteProfileScreen:
-- "{userId}/avatar.ext", SosyalProfileScreen: "avatars/{userId}_*.jpg"),
-- snap'ler ise "{userId}/*.ext" altında. storage.objects satırlarını
-- silmek Supabase'de dosyanın kendisini de siler.
-- =====================================================
CREATE OR REPLACE FUNCTION process_pending_account_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
  uid_text TEXT;
BEGIN
  FOR req IN
    SELECT id, kullanici_id
    FROM hesap_silme_talepleri
    WHERE durum = 'beklemede'
      AND kullanici_id IS NOT NULL
      AND talep_tarihi <= NOW() - INTERVAL '30 days'
  LOOP
    uid_text := req.kullanici_id::TEXT;

    BEGIN
      DELETE FROM friendships WHERE sender_id = req.kullanici_id OR receiver_id = req.kullanici_id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
      NULL;
    END;

    -- Storage: avatar (iki olası yol) + tüm kıvılcım/snap dosyaları
    BEGIN
      DELETE FROM storage.objects
      WHERE bucket_id = 'avatars'
        AND (name LIKE uid_text || '/%' OR name LIKE 'avatars/' || uid_text || '_%');

      DELETE FROM storage.objects
      WHERE bucket_id = 'snaps'
        AND name LIKE uid_text || '/%';
    EXCEPTION WHEN undefined_table OR undefined_column THEN
      NULL;
    END;

    -- auth.users satırını silmek, CASCADE tanımlı tüm tabloları otomatik temizler.
    DELETE FROM auth.users WHERE id = req.kullanici_id;

    UPDATE hesap_silme_talepleri
    SET durum = 'tamamlandi', tamamlanma_tarihi = NOW()
    WHERE id = req.id;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION process_pending_account_deletions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_pending_account_deletions() FROM anon;
REVOKE EXECUTE ON FUNCTION process_pending_account_deletions() FROM authenticated;
