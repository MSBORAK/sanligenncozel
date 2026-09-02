// Yasal metinler — hem ProfileScreen (Profil > Yasal) hem de CompleteProfileScreen
// (kayıt sırasında onay) tarafından kullanılır. Tek kaynak, iki yerde tekrar yazılmasın diye.

const SUPPORT_EMAIL = 'destek@sanligenc.app';
const DATA_CONTROLLER_NAME = 'MSE SOFT';
export const MINIMUM_AGE = 18;
export const LEGAL_LAST_UPDATED = '4 Ağustos 2026';

export const PRIVACY_POLICY_TEXT = `Son güncelleme: ${LEGAL_LAST_UPDATED}

ŞanlıGenç ("Uygulama"), Şanlıurfa'daki gençlere yönelik bir şehir ve gençlik platformudur. İşbu politika, Uygulamanın kullanımı sırasında hangi kişisel verilerin toplandığını, bu verilerin nasıl kullanıldığını ve kullanıcının haklarını açıklamaktadır.

1. Toplanan Veriler
• Hesap bilgileri: ad soyad, kullanıcı adı, e-posta adresi
• Profil fotoğrafı (yüklenmesi hâlinde)
• Uygulama içi etkileşimler: favoriler, yorumlar, puanlamalar, katılım sağlanan etkinlikler
• Konum bilgisi: yalnızca "yakındaki duraklar/mekânlar" ve Şehir Radarı gibi özelliklerin kullanılabilmesi amacıyla ve yalnızca izin verilmesi hâlinde
• Kıvılcım (ŞanlıSosyal) paylaşımları: fotoğraf/video ve paylaşım anındaki konum bilgisi — bu paylaşımlar 4 saat sonra sunucudan kalıcı olarak silinir
• Cihaz ve kullanım verileri: uygulama sürümü, hata kayıtları, genel kullanım istatistikleri

2. Verilerin Kullanım Amacı
Toplanan veriler yalnızca; hesabın yönetilmesi, etkinlik/fırsat/duyuru bilgilerinin sunulması, sosyal özelliklerin (ŞanlıSosyal) işletilmesi, Uygulamanın iyileştirilmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla kullanılır. Veriler reklam amaçlı profillemede kullanılmaz.

3. Veri Paylaşımı ve Yurt Dışı Aktarım
Veriler hiçbir şekilde reklam amacıyla üçüncü taraflarla paylaşılmaz veya satılmaz. Veriler yalnızca Uygulamanın işletilmesine yardımcı olan alt yüklenicilerle (barındırma ve veritabanı hizmeti — Supabase) paylaşılır; söz konusu hizmet sağlayıcılar da verileri yalnızca verilen talimatlar doğrultusunda işler. Uygulama herhangi bir üçüncü taraf reklam veya analitik yazılım geliştirme kiti (SDK) kullanmamaktadır.

Veriler, barındırma/veritabanı altyapı sağlayıcısı aracılığıyla Avrupa Birliği sınırları içinde (Frankfurt, Almanya) bulunan sunucularda saklanmaktadır. Bu husus, KVKK Aydınlatma Metni'nde yurt dışına veri aktarımı kapsamında ayrıca açıklanmaktadır.

4. Güvenlik
Veriler şifreli bağlantılar (HTTPS) üzerinden iletilir, erişim yetkilendirmesi bulunan güvenli sunucularda saklanır ve veritabanı satır bazlı erişim kontrolleri (Row Level Security) ile korunur. Bu sayede yalnızca hesap sahibi ve izin verilen kişiler ilgili verilere erişebilir.

5. Saklama Süresi
Veriler, hesabın aktif olduğu süre boyunca saklanır. Kıvılcım paylaşımları 4 saat sonra otomatik ve kalıcı olarak silinir. Hesabın silinmesi hâlinde, veriler KVKK'da öngörülen yasal saklama süreleri saklı kalmak kaydıyla makul bir süre içinde silinir veya anonim hâle getirilir.

6. Haklar
Kullanıcı; verilerine erişme, düzeltilmesini talep etme, silinmesini talep etme ve verilerin işlenmesine itiraz etme hakkına sahiptir. Ayrıntılı bilgi için "KVKK Aydınlatma Metni" incelenebilir.

7. İletişim
${DATA_CONTROLLER_NAME} — Sorularınız için: ${SUPPORT_EMAIL}`;

export const TERMS_OF_USE_TEXT = `Son güncelleme: ${LEGAL_LAST_UPDATED}

İşbu Kullanım Şartları, ŞanlıGenç uygulamasının kullanımına ilişkin kuralları düzenler. Uygulamanın kullanılması, bu şartların kabul edildiği anlamına gelir.

1. Hesap
Uygulamayı kullanabilmek için ${MINIMUM_AGE} yaşından büyük olmak ve hesap bilgilerinin doğru olması gerekmektedir. Hesap güvenliğinden kullanıcı sorumludur; şifre üçüncü kişilerle paylaşılmamalıdır.

2. Kullanım Kuralları
• Diğer kullanıcılara yönelik hakaret, taciz veya nefret söylemi içeren paylaşım yapılamaz.
• Sahte bilgi, spam veya yanıltıcı içerik paylaşılamaz.
• ŞanlıSosyal ve yorum alanlarında yalnızca yasal ve saygı çerçevesinde içerik paylaşılabilir.
• Başka bir kullanıcının izni olmaksızın görüntüsü veya içeriği paylaşılamaz; rahatsız edici davranışlarda bulunulamaz.
• Uygulamanın işleyişini bozacak nitelikte (bot kullanımı, otomasyon, tersine mühendislik vb.) girişimlerde bulunulamaz.

3. İçerikler
Genç Kart fırsatları, etkinlik bilgileri ve tarihi yer içerikleri bilgilendirme amaçlıdır. Anlaşmalı işletmeler tarafından sunulan kampanya koşulları önceden haber verilmeksizin değiştirilebilir.

4. Sorumluluk Sınırı
Uygulama "olduğu gibi" sunulmaktadır. Üçüncü taraf işletmelerin sunduğu hizmet ve kampanyalardan veya kullanıcılar tarafından paylaşılan içeriklerden doğabilecek anlaşmazlıklardan Uygulama sorumlu tutulamaz.

5. Hesap Kapatma
Kurallara aykırı davranış tespit edilmesi hâlinde hesap askıya alınabilir veya kapatılabilir. Kullanıcı, hesabını dilediği zaman "Hesabımı Sil" seçeneği ile kapatabilir.

6. Değişiklikler
İşbu şartlar zaman zaman güncellenebilir; önemli değişiklikler uygulama içinden bildirilir.

7. İletişim
${DATA_CONTROLLER_NAME} — ${SUPPORT_EMAIL}`;

export const KVKK_TEXT = `Son güncelleme: ${LEGAL_LAST_UPDATED}

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla ŞanlıGenç uygulamasının geliştiricisi tarafından aşağıdaki hususlarda bilgilendirme yapılmaktadır.

Veri Sorumlusu: ${DATA_CONTROLLER_NAME}
İletişim: ${SUPPORT_EMAIL}

1. Kişisel Verilerin İşlenme Amacı
Ad-soyad, kullanıcı adı, e-posta, profil fotoğrafı, konum (izin verilmesi hâlinde) ve uygulama içi etkileşim verileri; üyeliğin oluşturulması, hizmetlerin sunulması, Genç Kart fırsatlarının ve etkinliklerin kişiye özel gösterilmesi, ŞanlıSosyal üzerinden diğer kullanıcılarla bağlantı kurulabilmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir.

2. İşlenen Verilerin Aktarılabileceği Taraflar ve Yurt Dışı Aktarım
Veriler, hizmetin sunulabilmesi için zorunlu olduğu ölçüde barındırma/veritabanı altyapı sağlayıcısı ile ve yasal zorunluluk hâlinde yetkili kamu kurum ve kuruluşlarıyla paylaşılabilir. Veriler pazarlama amacıyla üçüncü kişilere satılmaz veya kiralanmaz.

Uygulamanın barındırma/veritabanı altyapı sağlayıcısı (Supabase) tarafından veriler Avrupa Birliği sınırları içinde (Frankfurt, Almanya) bulunan sunucularda saklanmaktadır. Bu, KVKK'nın 9. maddesi kapsamında yurt dışına kişisel veri aktarımı teşkil etmektedir. Bu aktarım, ilgili mevzuatta öngörülen uygun güvence mekanizmaları ve/veya kullanıcının açık rızası çerçevesinde gerçekleştirilmektedir.

3. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi
Veriler, Uygulamanın kullanımı sırasında elektronik ortamda; sözleşmenin kurulması ve ifası, açık rıza (konum ve kıvılcım paylaşımları gibi opsiyonel veriler bakımından) ve meşru menfaat hukuki sebeplerine dayanılarak toplanmaktadır.

4. KVKK'nın 11. Maddesi Kapsamındaki Haklar
Kişisel verinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, KVKK'da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme, yapılan işlemlerin ilgili üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhine bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işlenme sebebiyle zarara uğranılması hâlinde zararın giderilmesini talep etme hakları saklıdır.

5. Başvuru
İşbu haklar; Profil > Hesabımı Sil / Hesap Ayarları üzerinden veya ${SUPPORT_EMAIL} adresi aracılığıyla kullanılabilir. Başvurular en geç 30 gün içinde sonuçlandırılır.`;
