-- =====================================================
-- İKİNCİ BİR PUBLIC BUCKET AÇIĞI: 'social-media' bucket'ı da
-- (README.md'de "Public: ✅ Açık" olarak belgelenmiş, 'snaps' ile
-- aynı sınıf hata) tamamen herkese açıktı. Bu bucket DM'de gönderilen
-- kıvılcım yanıtları (SendSnapScreen) VE Kıvılcım gönderileri
-- (CreatePostScreen) için kullanılıyor — yani özel mesajlaşma
-- fotoğrafları, URL'yi bilen HERKES tarafından (arkadaş olsun olmasın,
-- giriş yapmamış biri bile) görüntülenebiliyordu. 'snaps' bucket'ında
-- 51 numaralı migration ile kapatılan aynı açığın ikizi.
-- =====================================================

UPDATE storage.buckets SET public = false WHERE id = 'social-media';

DROP POLICY IF EXISTS "social-media sahibi kendi dosyasını yükleyebilir" ON storage.objects;
CREATE POLICY "social-media sahibi kendi dosyasını yükleyebilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "social-media sahibi kendi dosyasını silebilir" ON storage.objects;
CREATE POLICY "social-media sahibi kendi dosyasını silebilir"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Görüntüleme: sahibi, ya da sahibiyle "accepted" arkadaşlığı olan biri
-- (snaps bucket'ındaki gerekçenin aynısı: DM/kıvılcım görselleri zaten
-- sadece arkadaşlar arasında paylaşılıyor).
DROP POLICY IF EXISTS "social-media sahibi veya arkadaşı görüntüleyebilir" ON storage.objects;
CREATE POLICY "social-media sahibi veya arkadaşı görüntüleyebilir"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'social-media'
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
