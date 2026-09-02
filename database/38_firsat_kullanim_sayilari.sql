-- =====================================================
-- ADMIN PANELDE "KAÇ KİŞİ KULLANDI" SAYISINI GÖSTERMEK İÇİN
-- firsat_kullanimlari tablosunun RLS'i her kullanıcının sadece
-- KENDİ kaydını görmesine izin veriyor — admin panel toplu sayıyı
-- okuyamaz. Kullanıcı isimlerini/kimliklerini açığa çıkarmadan
-- (sadece sayı), her fırsat için toplam kullanım adedini dönen
-- bir fonksiyon ekliyoruz.
-- =====================================================

CREATE OR REPLACE FUNCTION get_firsat_kullanim_sayilari()
RETURNS TABLE(firsat_id INTEGER, kullanim_sayisi BIGINT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT firsat_id, COUNT(*)::BIGINT AS kullanim_sayisi
  FROM firsat_kullanimlari
  GROUP BY firsat_id;
$$;

-- Sadece giriş yapmış (admin panelde oturum açmış) kullanıcılar çağırabilir,
-- hangi kullanıcının kullandığı değil sadece toplam sayı döner — kişisel veri sızmaz.
REVOKE EXECUTE ON FUNCTION get_firsat_kullanim_sayilari() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_firsat_kullanim_sayilari() FROM anon;
GRANT EXECUTE ON FUNCTION get_firsat_kullanim_sayilari() TO authenticated;
