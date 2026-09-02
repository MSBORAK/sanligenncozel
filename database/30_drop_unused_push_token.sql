-- =====================================================
-- PUSH_TOKEN KOLONUNU TAMAMEN KALDIR
-- 29 numaralı migration'daki kolon bazlı REVOKE işe yaramadı çünkü
-- user_profiles tablosunda zaten tablo-geneli (table-level) SELECT
-- izni var — Postgres'te tablo-geneli grant, kolon bazlı revoke'dan
-- önceliklidir, o yüzden kolonu tek tek gizlemek mümkün olmuyor.
--
-- push_token kodda hiçbir yerde okunmuyor/yazılmıyor (push notification
-- sistemi zaten tamamen devre dışı, registerForPushNotificationsAsync
-- no-op) ve orijinal tablo şemasında (01_create_tables.sql) bile yok —
-- muhtemelen Supabase dashboard'dan elle eklenmiş, kullanılmayan bir alan.
-- En kesin çözüm: kolonu tamamen silmek.
-- =====================================================

ALTER TABLE user_profiles DROP COLUMN IF EXISTS push_token;
