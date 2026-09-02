-- Şehir Radarı'nda konumun gösterilip gösterilmeyeceğini kontrol eden,
-- profil gizliliğinden (is_public) BAĞIMSIZ, kendine özel bir ayar.
-- Önceki durum: radar'a dahil edilme kararı is_public'e bağlıydı, ama
-- is_public'i değiştirebilecek arayüz (SosyalProfile'daki "herkese açık /
-- sadece arkadaşlar" anahtarı) uygulamadan tamamen kaldırılmıştı — yani
-- kullanıcının konumunu radardan gizlemesinin FİİLEN hiçbir yolu yoktu.

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS radar_visible BOOLEAN DEFAULT true;

COMMENT ON COLUMN user_profiles.radar_visible IS 'true = Şehir Radarı''nda (anonim ısı haritası) konumu gösterilir, false = tamamen dışlanır';
