-- YAYIN ÖNCESİ MOCK/TEST VERİ TARAMASI — SADECE LİSTELER, HİÇBİR ŞEY SİLMEZ.
-- Her bloğu ayrı ayrı çalıştırıp sonuçları incele, gerçek olanları
-- (özellikle user_profiles'ta kendi gerçek hesabın) SİLME.

-- 1) Etkinlikler — bariz test kayıtları
SELECT id, baslik, tarih, konum, resim_url FROM etkinlikler
WHERE baslik ILIKE '%test%' OR baslik ILIKE '%yeni etkinlik%' OR baslik ILIKE '%supabase%'
   OR baslik ILIKE '%lorem%' OR baslik ILIKE '%örnek%' OR baslik ILIKE '%deneme%'
   OR resim_url IS NULL OR resim_url = '';

-- 2) Fırsatlar (Genç Kart) — bariz test kayıtları
SELECT id, baslik, aciklama, kategori FROM firsatlar
WHERE baslik ILIKE '%test%' OR baslik ILIKE '%deneme%' OR baslik ILIKE '%örnek%'
   OR baslik ILIKE '%optik dünya%' OR baslik ILIKE '%kafe mola%' OR baslik ILIKE '%şehir kitabevi%'
   OR baslik ILIKE '%fitzone%' OR baslik ILIKE '%sinema merkezi%';
   -- Not: son satırdaki isimler bu görüşmede BEN test için eklediğim kayıtlar.

-- 3) Keşfet içerikleri — test kaydı var mı
SELECT id, baslik, aciklama FROM kesfet
WHERE baslik ILIKE '%test%' OR baslik ILIKE '%deneme%' OR baslik ILIKE '%örnek%' OR baslik ILIKE '%lorem%';

-- 4) Keşfet yorumları — test yorumu var mı
SELECT id, place_id, user_id, comment, rating FROM kesfet_yorumlar
WHERE comment ILIKE '%test%' OR comment ILIKE '%deneme%';

-- 5) Kullanıcı profilleri — test hesapları (kullanıcı adına göre gözden geçir,
--    kendi GERÇEK hesabını yanlışlıkla silme!)
SELECT user_id, name, username FROM user_profiles ORDER BY user_id;

-- 6) Sosyal gönderiler (Kıvılcım) — test paylaşımları zaten 4 saatte otomatik
--    siliniyor, muhtemelen kontrol etmene bile gerek yok ama yine de:
SELECT id, user_id, content, created_at FROM social_posts ORDER BY created_at DESC LIMIT 50;

-- 7) Geri bildirimler / şikayetler / hesap silme talepleri — test sırasında
--    oluşmuş olabilir, yayından önce temizlenmeli
SELECT * FROM geri_bildirimler ORDER BY olusturma_tarihi DESC LIMIT 50;
SELECT * FROM kullanici_sikayetleri LIMIT 50;
SELECT * FROM hesap_silme_talepleri ORDER BY talep_tarihi DESC LIMIT 50;

-- 8) Arkadaşlık / mesaj verisi — test hesapları arasındaki tüm etkileşim
--    (gerçek kullanıcı verisi yayına kadar birikmeyeceği için muhtemelen
--    hepsi test verisi olacak, yayından hemen önce topluca temizlenebilir)
SELECT COUNT(*) AS toplam_arkadaslik FROM friendships;
SELECT COUNT(*) AS toplam_mesaj FROM messages;
SELECT COUNT(*) AS toplam_sohbet FROM conversation_participants;
