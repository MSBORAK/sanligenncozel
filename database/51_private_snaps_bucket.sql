-- KIVILCIM MEDYASI PUBLIC BUCKET'TAYDI: 'snaps' bucket'ı public=true idi
-- (migration dosyalarında hiç kaydı yok, muhtemelen dashboard'dan elle
-- oluşturulmuş). Bu, URL'yi bilen HERKESİN — arkadaş olsun olmasın, hatta
-- giriş yapmamış biri bile — kullanıcının fotoğraf/videosunu doğrudan
-- görüntüleyebilmesi anlamına geliyordu. 49 numaralı migration veritabanı
-- SATIRINI (konum, kategori vs.) korudu ama HAM MEDYA dosyası hâlâ açıktı.
-- Artık bucket private, erişim sadece imzalı (süreli) URL ile ve RLS ile
-- sahip/arkadaş/alıcı olma şartına bağlı.

UPDATE storage.buckets SET public = false WHERE id = 'snaps';

DROP POLICY IF EXISTS "Snap sahibi kendi dosyasını yükleyebilir" ON storage.objects;
CREATE POLICY "Snap sahibi kendi dosyasını yükleyebilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'snaps'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Snap sahibi kendi dosyasını silebilir" ON storage.objects;
CREATE POLICY "Snap sahibi kendi dosyasını silebilir"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'snaps'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Görüntüleme: sahibi, ya da sahibiyle "accepted" arkadaşlığı olan biri.
-- (Grup kıvılcımlarında recipient_user_ids'e özel daha dar bir kural
-- storage seviyesinde pratik değil — arkadaş olma şartı zaten eskisinden
-- kat kat daha güvenli, "herkes" durumundan "sadece arkadaşlar"a indirdi.)
DROP POLICY IF EXISTS "Snap sahibi veya arkadaşı görüntüleyebilir" ON storage.objects;
CREATE POLICY "Snap sahibi veya arkadaşı görüntüleyebilir"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'snaps'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.sender_id = auth.uid() AND f.receiver_id::text = (storage.foldername(name))[1])
          OR (f.receiver_id = auth.uid() AND f.sender_id::text = (storage.foldername(name))[1])
        )
    )
  )
);
