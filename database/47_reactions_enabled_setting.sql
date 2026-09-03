-- "Tepkiler Açık/Kapalı" anahtarı Sosyal Profil ekranında vardı ama tamamen
-- göstermelikti: hiçbir yere kaydedilmiyordu, kapatınca uygulamayı kapatıp
-- açtığında (hatta ekrandan çıkıp geri döndüğünde bile) sıfırlanıyordu, ve
-- SnapViewScreen tarafında zaten hardcoded true kullanılıyordu — yani
-- kapatsan bile başkaları kıvılcımına yine de tepki bırakabiliyordu.

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS reactions_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN user_profiles.reactions_enabled IS 'false ise başkaları bu kullanıcının kıvılcımlarına emoji/mesaj tepkisi bırakamaz';
