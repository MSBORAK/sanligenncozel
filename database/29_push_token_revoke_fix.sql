-- =====================================================
-- PUSH_TOKEN KOLONU İÇİN KESİN ERİŞİM ENGELİ
-- 28 numaralı migration'daki REVOKE SELECT (push_token) ... FROM anon, authenticated
-- test edildiğinde hâlâ okunabildi. Sebebi muhtemelen PUBLIC rolüne
-- ayrıca (veya Postgres default'u olarak) SELECT grant edilmiş olması —
-- anon/authenticated rolleri PUBLIC'ten miras alıyor, o yüzden sadece
-- anon/authenticated'dan revoke etmek yetmiyor, PUBLIC'ten de almak gerekiyor.
-- =====================================================

REVOKE SELECT (push_token) ON user_profiles FROM PUBLIC;
REVOKE SELECT (push_token) ON user_profiles FROM anon;
REVOKE SELECT (push_token) ON user_profiles FROM authenticated;
