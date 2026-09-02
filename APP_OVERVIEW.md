# ŞanlıGenç — Uygulama Genel Bakış

Bu doküman, ŞanlıGenç mobil uygulamasının (React Native / Expo) tüm özelliklerini, ekranlarını ve teknik yapısını eksiksiz özetler.

## Uygulama Kimliği

- **Ad:** ŞanlıGenç
- **Amaç:** Şanlıurfa'daki gençlere yönelik şehir ve gençlik platformu — etkinlikler, indirim/fırsat kartı, ulaşım, tarihi/kültürel keşif içerikleri ve gençler arası sosyal ağ (ŞanlıSosyal) tek uygulamada birleşiyor.
- **Hedef kitle:** Şanlıurfa'da yaşayan gençler (13+ yaş), şehir çapında kullanım hedefleniyor (hobi projesi değil, gerçek üretim uygulaması).
- **Platform:** iOS + Android (Expo/React Native), tek kod tabanı.

## Teknik Altyapı

- **Framework:** React Native (0.81) + Expo SDK 54, TypeScript
- **Navigasyon:** React Navigation (Stack + alt sekmeli `PagerView` tabanlı custom tab bar — 5 ana sekme)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Row Level Security + pg_cron zamanlanmış görevler)
- **Kimlik doğrulama:** Şifresiz, e-posta + 6 haneli OTP kodu (Supabase Auth `signInWithOtp`)
- **Çoklu dil:** i18next / react-i18next — **6 dil** tam destekleniyor: Türkçe, İngilizce, Almanca, İspanyolca, Fransızca, Arapça (640 çeviri anahtarı, tüm dillerde eksiksiz eşleşiyor)
- **Harita:** react-native-maps (Şehir Radarı özelliği için heatmap + kullanıcı marker'ları)
- **Yapay zekâ:** Google Gemini API — client'ta değil, **Supabase Edge Function proxy** üzerinden çağrılıyor (API anahtarı güvenli, cihazda saklanmıyor)
- **Bildirimler:** expo-notifications altyapısı kurulu ama şu an **devre dışı** (push token toplanmıyor/gönderilmiyor)
- **Konum:** expo-location (Şehir Radarı ve Ulaşım "yakınımdaki duraklar" özellikleri için, izinli)
- **Kamera/Galeri:** expo-camera, expo-image-picker (kıvılcım foto/video çekimi, profil fotoğrafı)

## Ana Navigasyon (Alt Sekmeler)

1. **Ulaşım** (TransportScreen)
2. **Genç Kart** (GencKartScreen)
3. **Ana Sayfa** (HomeScreen) — varsayılan açılış sekmesi
4. **Hızlı Erişim** (HizliErisimScreen)
5. **Profil** (ProfileScreen)

## Özellik Modülleri

### 1. Giriş / Kayıt (Auth)
- Şifresiz e-posta + OTP kod girişi
- Tek ekranda hem "Kayıt Ol" hem "Giriş Yap" modu (varsayılan: Kayıt Ol, altta "Zaten hesabın var mı?" linki ile geçiş)
- Misafir modu (hesap oluşturmadan sınırlı gezinme)
- Kayıt sırasında Kullanım Şartları + Gizlilik Politikası onay kutusu (KVKK açık rıza)
- Profil tamamlama ekranı (isim, kullanıcı adı, profil fotoğrafı)

### 2. Ana Sayfa (HomeScreen)
- Öne çıkan etkinlikler, fırsatlar, hava durumu widget'ı
- Kültürel/tarihi "öne çıkan yerler" kartları (Keşfet içeriğinden)
- Hızlı arama girişi (GlobalSearch'e yönlendirir)

### 3. Genç Kart (GencKartScreen)
- Dijital indirim/fırsat kartı — Supabase `firsatlar` tablosundan gerçek zamanlı veri (admin panelden yönetiliyor)
- Kategoriye göre filtreleme, favorileme
- Fırsat detay sayfası (PartnerDetailScreen)

### 4. Etkinlikler (EventsScreen / EventDetailScreen)
- Şehirdeki etkinliklerin listesi, kategori/gün filtreleri
- Supabase `etkinlikler` tablosundan besleniyor
- Etkinlik detay sayfası, favorileme

### 5. Ulaşım (TransportScreen)
- Otobüs hat/durak bilgileri (statik veri seti, ~23 durak)
- Konum izniyle "yakınımdaki duraklar"
- Not: gerçek zamanlı canlı otobüs takibi yok (şehrin resmi sistemi bu özelliği desteklemiyor)

### 6. Keşfet / Kültürel Rotalar
- **Keşfet (Miras Koleksiyonu):** Şanlıurfa'nın tarihi/kültürel yerleri (Göbeklitepe, Balıklıgöl, Harran vb. — 16 yer), kategori filtreli, statik ama 6 dile çevrilmiş içerik
- **Gezi Rotaları (Cultural Route):** Hafta sonu gezi planları (9 rota), süre/aktivite bazlı, "sıcak saatlerde önerilen rota" akıllı öneri mantığı
- **Dergi (Magazine):** Öne çıkan yerlerin dergi tarzı sunumu

### 7. Hızlı Erişim (HizliErisimScreen)
- Eczaneler (PharmacyListScreen) — nöbetçi eczane listesi, yol tarifi/arama linki
- Kütüphaneler (LibraryListScreen)
- Hava durumu detayı (WeatherDetailScreen)

### 8. ŞanlıSosyal (Sosyal Ağ Modülü — SosyalScreen ve alt ekranları)
Uygulamanın en kapsamlı modülü, Snapchat benzeri geçici paylaşım + arkadaşlık sistemi:
- **Kıvılcım (Snap):** Fotoğraf/video çekip arkadaşlara veya herkese açık paylaşma — **4 saat sonra otomatik ve kalıcı olarak silinir** (hem görünürlükten hem veritabanından, pg_cron ile)
- **Gizlilik seçenekleri:** "Arkadaşlara Açık" / "Herkese Açık" (profil ayarından, `is_public` alanı)
- **Görüntülenme takibi:** Kıvılcımı kimlerin izlediğini gösteren liste (avatar + isim), "tekrar oynattı" rozeti
- **Şehir Radarı:** Canlı ısı haritası — "Arkadaşlar" modunda arkadaşların konumu (kimlikli), "Herkes" modunda anonim yoğunluk noktaları
- **Arkadaşlık sistemi:** İstek gönderme/kabul etme, kullanıcı adıyla arama, QR kod ile arkadaş ekleme
- **Sohbet (Chat):** Birebir mesajlaşma, kaybolan (snap) mesaj gönderme
- **Streak (seri) sistemi:** Günlük kıvılcım gönderme serisi, "streak buddy" (seri arkadaşı) özelliği
- **Grup kıvılcımı:** Belirli arkadaş grubuna özel paylaşım
- **Hikaye (Story) sistemi:** Kodda mevcut ama şu an hiçbir ekrandan erişilemiyor (kullanılmıyor, ileride aktif edilebilir)

### 9. Yapay Zekâ Asistanı (AssistantScreen)
- Google Gemini destekli sohbet asistanı, şehir/uygulama hakkında soruları yanıtlıyor
- API çağrıları güvenli şekilde sunucu tarafında (Edge Function) yapılıyor

### 10. Profil / Ayarlar (ProfileScreen)
- Hesap bilgileri düzenleme (isim, kullanıcı adı, profil fotoğrafı)
- Tema seçimi (açık/koyu/ters mod)
- Dil seçimi (6 dil)
- Bildirim ayarları
- Favoriler (etkinlik, fırsat, tarihi yer, durak)
- Gizlilik ayarları (profil herkese açık/arkadaşlara özel)
- Yasal belgeler: Gizlilik Politikası, Kullanım Şartları, KVKK Aydınlatma Metni (uygulama içi tam metin)
- Geri bildirim gönderme formu (şikayet/öneri, hata bildirimi, özellik isteği) — Supabase'e kaydediliyor
- Hesabımı Sil akışı
- Oturumu kapat

## Veritabanı (Supabase — Ana Tablolar)
`etkinlikler`, `firsatlar`, `kesfet`, `kesfet_yorumlar`, `user_profiles`, `social_posts` (kıvılcım), `social_stories`, `friendships`, `messages`, `conversation_participants`, `snaps`, `snap_groups`, `anonymous_posts` (radar), `geri_bildirimler`, `hesap_silme_talepleri`, `avatars` (storage)

Tüm hassas tablolarda **Row Level Security (RLS)** aktif ve canlı ortamda anon-key ile test edilerek doğrulanmış durumda (kullanıcılar sadece kendi verilerine, arkadaşlarının ve herkese açık profillerin verisine erişebiliyor).

## Bilinen Sınırlamalar / Henüz Tamamlanmamış Noktalar
- Etkinlik/fırsat gibi admin panelden yönetilen içerikler, uygulama dili değiştirildiğinde henüz otomatik çevrilmiyor (çeviri altyapısı var ama admin tarafında veri girilmemiş)
- Otobüs hat/durak verisi statik, gerçek zamanlı değil
- Hikaye (Story) özelliği kodda var ama aktif değil
- Bazı yasal metin detayları (veri sorumlusu resmi kimliği, yaş sınırı kesinleşmesi) hukuki danışmanlık sonrası netleşecek
