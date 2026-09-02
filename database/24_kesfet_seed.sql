-- =====================================================
-- KEŞFET kalıcı içerik — tüm mekânlar + 3 yeni tarihi yer
-- Önce 23_kesfet_tables.sql çalıştırılmalı
-- Görselleri kesfet_resimleri bucket'ına yükle; resim_url path ile eşleşmeli
-- =====================================================

INSERT INTO kesfet (slug, baslik, aciklama, kategori, resim_url, sira, one_cikan) VALUES
(
  'gobeklitepe',
  'Göbeklitepe',
  'Göbeklitepe, insanlık tarihinin bilinen en eski tapınak alanlarından biridir ve Şanlıurfa''nın kuzeydoğusunda yer alır. MÖ 10. binyıla tarihlenen T biçimli devasa dikilitaşları, üzerlerindeki hayvan ve sembol kabartmalarıyla neolitik dönemin inanç dünyasına dair benzersiz ipuçları sunar. Bugün UNESCO Dünya Mirası listesinde yer alan Göbeklitepe, "tarihin sıfır noktası" olarak anılır.',
  'historic',
  'historic/gobeklitepe.jpg',
  1,
  TRUE
),
(
  'balikligol',
  'Balıklıgöl',
  'Balıklıgöl, Şanlıurfa şehir merkezinde yer alan ve Hz. İbrahim''in ateşe atıldığı yer olarak rivayet edilen kutsal bir mekândır. Efsaneye göre ateş suya, odunlar ise balığa dönüşür; bu yüzden göldeki sazan balıkları kutsal kabul edilir ve avlanmaz. Çevresindeki tarihi camiler, medreseler ve çarşılarla birlikte Balıklıgöl, hem manevi atmosferi hem de mimarisiyle kentin simgelerindendir.',
  'faith',
  'faith/balikligol.jpg',
  2,
  TRUE
),
(
  'urfa-kalesi',
  'Urfa Kalesi',
  'Şehrin merkezindeki tepe üzerinde yer alan Urfa Kalesi, farklı dönemlerden izler taşıyan ve şehir manzarasına hâkim tarihi bir yapıdır.',
  'historic',
  'historic/urfa-kalesi.jpg',
  3,
  TRUE
),
(
  'harran-oren-yeri',
  'Harran Ören Yeri',
  'Konik kubbeli evleri ve antik geçmişiyle Harran, bölgenin en önemli kültürel miraslarından biridir.',
  'historic',
  'historic/harran-oren-yeri.jpg',
  4,
  TRUE
),
(
  'harran-ulu-camii',
  'Harran Ulu Camii',
  'Anadolu''nun en eski camilerinden biri kabul edilen Harran Ulu Camii, Harran antik kentinin önemli bir parçasıdır.',
  'faith',
  'faith/harran-ulu-camii.jpg',
  5,
  FALSE
),
(
  'sogmatar',
  'Soğmatar Antik Kenti',
  'Kaya kabartmaları ve ay kültü kalıntılarıyla dikkat çeken, Şuayb Şehri yakınındaki antik yerleşim.',
  'historic',
  'historic/sogmatar.jpg',
  6,
  FALSE
),
(
  'bazda-magaralari',
  'Bazda Mağaraları',
  'Antik taş ocakları olarak kullanılan, etkileyici kaya oluşumlarına sahip tarihi bir alan.',
  'historic',
  'historic/bazda-magaralari.jpg',
  7,
  FALSE
),
(
  'rumkale',
  'Rumkale',
  'Fırat kıyısında, çoğunlukla Halfeti tekne turlarıyla görülebilen tarihi bir kale.',
  'historic',
  'historic/rumkale.jpg',
  8,
  FALSE
),
(
  'suayb-sehri',
  'Şuayb Şehri',
  'Harran yakınlarında, kaya yerleşimleri ve antik kalıntılarıyla bilinen Şuayb Şehri; Soğmatar rotasıyla birlikte gezilen önemli bir tarihî alandır.',
  'historic',
  'historic/suayb-sehri.jpg',
  9,
  FALSE
),
(
  'nevali-cori',
  'Nevali Çori',
  'Göbeklitepe''den önceye uzanan, insanlık tarihinin en eski tapınak yapılarından birine ev sahipliği yapan arkeolojik alan. Neolitik dönemin inanç ve mimari gelişimini anlamak için kritik bir duraktır.',
  'historic',
  'historic/nevali-cori.jpg',
  10,
  FALSE
),
(
  'haleplibahce-antik-kenti',
  'Haleplibahçe Antik Kenti',
  'Roma dönemine ait mozaik ve kalıntılarıyla ünlü antik yerleşim; Haleplibahçe Mozaik Müzesi''nin hemen yakınında, kazı alanı olarak ziyaret edilebilir.',
  'historic',
  'historic/haleplibahce-antik-kenti.jpg',
  11,
  FALSE
),
(
  'kelaynak',
  'Birecik Kelaynak Üretme İstasyonu',
  'Nesli tehlike altındaki kelaynak kuşlarının gözlemlenebildiği bir koruma merkezi.',
  'nature',
  'nature/kelaynak.jpg',
  12,
  FALSE
),
(
  'arkeoloji-muzesi',
  'Şanlıurfa Arkeoloji Müzesi',
  'Göbeklitepe ve Taş Tepeler buluntularını barındıran, Türkiye''nin en zengin arkeoloji müzelerinden biri.',
  'museum',
  'museum/arkeoloji-muzesi.jpg',
  13,
  FALSE
),
(
  'haleplibahce-mozaik-muzesi',
  'Haleplibahçe Mozaik Müzesi',
  'Amazon Kraliçeleri mozaiği başta olmak üzere önemli Roma dönemi eserlerine ev sahipliği yapan müze.',
  'museum',
  'museum/haleplibahce-mozaik-muzesi.jpg',
  14,
  TRUE
),
(
  'gumruk-hani',
  'Gümrük Hanı',
  'Tarihi atmosferi ve geleneksel kahveleriyle dinlenmek için ideal, tarihi bir han.',
  'bazaar',
  'bazaar/gumruk-hani.jpg',
  15,
  FALSE
),
(
  'urfa-carsilari',
  'Tarihi Urfa Çarşıları',
  'Bakırcılar, isot ve yöresel ürün çarşılarıyla canlı bir alışveriş deneyimi sunan tarihi çarşı bölgesi.',
  'bazaar',
  'bazaar/urfa-carsilari.jpg',
  16,
  FALSE
),
(
  'karaali-parki',
  'Karaali Parkı',
  'Karaali Parkı, yeşil alanları ve yürüyüş yolları ile şehir merkezine çok yakın bir nefes alma noktasıdır.',
  'nature',
  'nature/karaali-parki.jpg',
  17,
  FALSE
),
(
  'firat-kiyisi',
  'Fırat Nehri Kıyısı',
  'Fırat Nehri kıyısında gün batımını izlemek, Şanlıurfa''da doğayla baş başa kalmanın en keyifli yollarından biridir.',
  'nature',
  'nature/firat-kiyisi.jpg',
  18,
  FALSE
),
(
  'halfeti-sakli-cennet',
  'Halfeti Saklı Cennet',
  'Halfeti çevresinde doğal manzaralarıyla öne çıkan sakin bir gezi noktası. Sular altında kalan tarihî dokusu ve Fırat manzarasıyla bölgenin en özel rotalarından biridir.',
  'nature',
  'nature/halfeti-sakli-cennet.jpg',
  19,
  FALSE
)
ON CONFLICT (slug) DO UPDATE SET
  baslik = EXCLUDED.baslik,
  aciklama = EXCLUDED.aciklama,
  kategori = EXCLUDED.kategori,
  resim_url = EXCLUDED.resim_url,
  sira = EXCLUDED.sira,
  one_cikan = EXCLUDED.one_cikan,
  aktif = TRUE,
  updated_at = NOW();
