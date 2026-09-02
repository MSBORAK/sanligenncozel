# ŞanlıGenç - Gençlik Uygulaması Özellik Listesi

## 📱 Genel Bilgiler
- **Platform:** React Native (Expo)
- **Hedef Kitle:** 16-30 yaş Şanlıurfa gençleri
- **Tema:** Mor gradyan + glassmorphism tasarım
- **Backend:** Supabase (PostgreSQL + Storage)
- **AI:** Google Generative AI (ŞanlıAsistan)

---

## 🏠 Ana Sayfa (HomeScreen)

### Story Highlights
- 4 kategori story: Kültür Sanat, Ulaşım, Gençlik, Duyurular
- Supabase'den dinamik içerik çekme
- Story modal'ları ile detay görüntüleme
- Otomatik ilerleme çubuğu
- Swipe ile geçiş

### Widget'lar
- **Hava Durumu:** Anlık hava durumu, sıcaklık, animasyonlu ikonlar
- **Takvim:** Aylık/yıllık görünüm, özel günler (bayramlar, anma günleri), etkinlik gösterimi
- **Günün Sözü:** Günlük motivasyonel sözler

### Hızlı Erişim (5 İkon)
- Etkinlik (kırmızı)
- Keşfet (mavi)
- Nöbetçi Eczane (kırmızı)
- Kütüphaneler (yeşil)
- Gezi Rotası (turuncu)

### Genç Kart Fırsatları
- Yatay scroll ile partner mekanlar
- "Tümünü Gör" butonu
- Supabase'den dinamik fırsatlar
- Pull-to-refresh özelliği

---

## 🚌 Ulaşım (TransportScreen)

### Otobüs Sistemi
- Otobüs hatları ve sefer saatleri
- Durak arama ve filtreleme
- Bölge bazlı filtreleme (Merkez, Kampüs, vb.)
- Favori duraklar (kalp ikonu ile kaydetme)
- Yakındaki duraklar (konum bazlı)

### Harita Entegrasyonu
- React Native Maps ile interaktif harita
- Durak konumları (marker'lar)
- Yakınlık bazlı sıralama
- Harita genişletme/küçültme
- Konum izni ve otomatik odaklama

### Rota Planlama
- "Nereden - Nereye" seçimi
- Direkt ve aktarmalı rota önerileri
- Tahmini süre ve mesafe hesaplama
- Yol tarifi (Google Maps entegrasyonu)

---

## 💳 Genç Kart (GencKartScreen)

### Dijital Kart
- Mor gradyan tasarım
- Şanlıurfa kültürel motifleri (Göbeklitepe, Balıklıgöl, Harran)
- Kullanıcı adı ve yıl (2026)
- Glassmorphism efektleri

### Partner Mekanlar
- Kategori filtreleme: Tümü, Kafe, Sinema, Giyim
- Chip/Tag yapısı ile filtreleme
- Partner kartları (ikon, isim, indirim, açıklama)
- Partner detay sayfası
- Yol tarifi butonu

---

## 🤖 ŞanlıAsistan (AssistantScreen)

### AI Chat
- Google Generative AI entegrasyonu
- Şanlıurfa odaklı sistem prompt'u
- Gerçek zamanlı mesajlaşma
- Typing animasyonu
- Mesaj geçmişi

### Hızlı Aksiyon Butonları (10 Adet)
1. Otobüs Saatleri
2. İndirimler
3. Etkinlikler
4. Takvim
5. Kütüphaneler
6. Nöbetçi Eczane
7. Kültürel Rotalar
8. Kafeler
9. Sinemalar
10. Yardım

---

## 👤 Profil (ProfileScreen)

### Kullanıcı Bilgileri
- Avatar (gradyan border)
- İsim ve statü gösterimi
- Doğrulama rozeti (opsiyonel)

### Ayarlar
- **Hesap Ayarları:** İsim, email düzenleme
- **Gizlilik:** Konum, analitik, kişiselleştirme toggle'ları
- **Bildirimler:** Etkinlik, indirim, konum bildirimleri
- **Tema:** Dark/Light mode toggle

### Geri Bildirim Sistemi
- 3 tip geri bildirim:
  - Şikayet/Öneri
  - Hata Bildirimi
  - Özellik İsteği
- Supabase'e kayıt
- Modal form ile gönderim

---

## 📋 Liste Ekranları

### Etkinlikler (EventsScreen)
- Konserler, festivaller, tiyatrolar
- Tarih ve kategori filtreleme
- Etkinlik detay sayfası
- Yol tarifi

### Keşfet (MagazineScreen)
- Tarihi yerler, müzeler
- Kültürel miras noktaları
- Detay sayfası (açıklama, görseller)

### Nöbetçi Eczane (PharmacyListScreen)
- Eczane listesi (FlatList)
- Adres, telefon, mesafe
- "Nöbetçi" badge'i
- Yol tarifi (Google Maps)
- Telefon arama (Linking API)

### Kütüphaneler (LibraryListScreen)
- Kütüphane listesi
- Adres, çalışma saatleri, mesafe
- Yol tarifi
- Dark mode desteği

### Gezi Rotası (CulturalRouteScreen)
- Hafta sonu planları
- Kategori filtreleme (Tam Gün, Yarım Gün, Akşam)
- Süre, aktiviteler, ipuçları
- Yol tarifi

---

## 🔍 Detay Ekranları

### Partner Detail
- Partner bilgileri
- İndirim detayları
- Yol tarifi
- Harita görünümü

### Event Detail
- Etkinlik detayları
- Tarih, saat, konum
- Açıklama
- Yol tarifi

### Heritage Detail
- Tarihi yer detayları
- Açıklama ve görseller
- Konum bilgisi

### Weather Detail
- Detaylı hava durumu
- Haftalık tahmin
- Animasyonlu ikonlar

### Notifications
- Duyuru listesi
- Tarih ve kategori
- Detay görüntüleme

---

## 🎨 Tasarım Özellikleri

### Tema Sistemi
- Dark/Light mode
- ThemeContext ile global tema yönetimi
- Otomatik renk adaptasyonu

### Glassmorphism
- BlurView efektleri
- Şeffaf kartlar
- Gradient arka planlar

### Renk Paleti
- Mor gradyan (#8b5cf6, #ec4899, #3b82f6)
- Kategori bazlı renkler (kırmızı, mavi, yeşil, turuncu)
- Dark mode uyumlu renkler

### Animasyonlar
- Story progress animasyonu
- Hava durumu animasyonları
- Mesaj bubble animasyonları
- Swipe geçişleri

---

## 🔧 Teknik Özellikler

### Navigasyon
- Stack Navigator (detay sayfaları)
- Bottom Tab Navigator (5 ana tab)
- PagerView (swipe ile tab geçişi)
- Custom Tab Bar

### Backend Entegrasyonu
- Supabase PostgreSQL (fırsatlar, hikayeler, geri bildirimler, etkinlikler, magazine)
- Supabase Storage (resim yönetimi)
- Real-time veri çekme
- Image URL processing

### Harita ve Konum
- React Native Maps
- Expo Location
- Google Maps URL scheme (yol tarifi)
- Mesafe hesaplama

### AI Entegrasyonu
- Google Generative AI SDK
- Custom system prompt
- Chat history management

### Diğer
- Pull-to-refresh
- Linking API (telefon, harita)
- SafeAreaView
- KeyboardAvoidingView
- Platform detection (iOS/Android)

---

## 📊 Veri Yapıları

### Supabase Tabloları
- `firsatlar` (Genç Kart fırsatları)
- `hikayeler` (Story içerikleri)
- `geri_bildirimler` (Kullanıcı geri bildirimleri)
- `etkinlikler` (Etkinlik listesi)
- `magazine` (Keşfet içerikleri)

### Mock Data
- Kullanıcı bilgileri
- Otobüs hatları ve duraklar
- Partner mekanlar
- Etkinlikler
- Eczaneler
- Kütüphaneler
- Hafta sonu planları

---

## 🚀 Eksik Özellikler (Gelecek Geliştirmeler)

- Push notification sistemi
- QR kod okuma/gösterme
- Favoriler/kaydetme sistemi
- Global arama özelliği
- Sosyal özellikler (arkadaş ekleme, paylaşım)
- Puan/ödül sistemi
- Yorum ve değerlendirme
- Kişiselleştirilmiş öneriler
- Takvim entegrasyonu (cihaz takvimi)
- İstatistikler ve analitik

---

## 📝 Notlar

- Uygulama tamamen Türkçe
- Şanlıurfa şehri odaklı içerik
- Gençlik odaklı tasarım ve içerik
- Modern ve sivil bir görünüm
- Kullanıcı dostu arayüz
- Performans odaklı geliştirme
