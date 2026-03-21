# Sosyal Medya Database Kurulum Rehberi

## Adım Adım Kurulum

### 1. Supabase Dashboard'a Git
- https://supabase.com/dashboard
- Projenizi seçin
- Sol menüden **SQL Editor**'ü açın

### 2. SQL Dosyalarını Sırayla Çalıştır

#### Adım 1: Tabloları Oluştur
```bash
database/01_create_tables.sql
```
- Bu dosyayı SQL Editor'e kopyala
- **RUN** butonuna tıkla
- ✅ "Success. No rows returned" mesajını görmelisin

#### Adım 2: Güvenlik Politikalarını Aktifleştir
```bash
database/02_enable_rls.sql
```
- Bu dosyayı SQL Editor'e kopyala
- **RUN** butonuna tıkla
- ✅ RLS politikaları aktif olacak

#### Adım 3: Optimizasyon Fonksiyonlarını Ekle
```bash
database/03_functions.sql
```
- Bu dosyayı SQL Editor'e kopyala
- **RUN** butonuna tıkla
- ✅ Toggle fonksiyonları ve trigger'lar oluşacak

#### Adım 3.5: Mesajlaşma Tablolarını Oluştur
```bash
database/06_messages_tables.sql
```
- Bu dosyayı SQL Editor'e kopyala
- **RUN** butonuna tıkla
- ✅ Mesajlaşma tabloları, view ve fonksiyonları oluşacak

#### Adım 3.6: Mesajlaşma RLS Politikalarını Ekle
```bash
database/07_messages_rls.sql
```
- Bu dosyayı SQL Editor'e kopyala
- **RUN** butonuna tıkla
- ✅ Mesajlaşma güvenlik politikaları aktif olacak

#### Adım 4: Test Verisi Ekle (Opsiyonel)
```bash
database/04_sample_data.sql
```
- Önce kendi user_id'ni bul:
  ```sql
  SELECT id FROM auth.users LIMIT 1;
  ```
- Dosyadaki `YOUR_USER_ID_HERE` kısımlarını değiştir
- SQL Editor'e kopyala ve çalıştır

### 3. Storage Bucket Oluştur

#### Supabase Dashboard'da:
1. Sol menüden **Storage** seç
2. **New Bucket** butonuna tıkla
3. Ayarlar:
   - **Name:** `social-media`
   - **Public:** ✅ (Açık)
   - **File size limit:** 5 MB
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp`
4. **Create Bucket** butonuna tıkla

#### Bucket Policies (Güvenlik):
Storage bucket'ı seçtikten sonra **Policies** sekmesine git:

```sql
-- Herkes okuyabilir
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'social-media' );

-- Sadece authenticated kullanıcılar upload edebilir
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'social-media' 
  AND auth.role() = 'authenticated'
);

-- Sadece kendi dosyalarını silebilir
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'social-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Tabloları Kontrol Et

SQL Editor'de çalıştır:
```sql
-- Tüm sosyal medya tablolarını listele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'social_%';

-- Tablo yapılarını kontrol et
SELECT * FROM social_posts LIMIT 1;
SELECT * FROM social_likes LIMIT 1;
SELECT * FROM social_comments LIMIT 1;
SELECT * FROM social_saves LIMIT 1;
SELECT * FROM social_stories LIMIT 1;
SELECT * FROM social_follows LIMIT 1;
```

### 5. RLS Politikalarını Test Et

```sql
-- Mevcut kullanıcı olarak post oluştur
INSERT INTO social_posts (user_id, content)
VALUES (auth.uid(), 'Test post');

-- Kendi postlarını görebilir misin?
SELECT * FROM social_posts WHERE user_id = auth.uid();
```

## Hata Giderme

### Hata: "relation does not exist"
- Tabloları oluşturmayı unuttun
- `01_create_tables.sql` dosyasını çalıştır

### Hata: "permission denied"
- RLS politikaları yanlış yapılandırılmış
- `02_enable_rls.sql` dosyasını tekrar çalıştır

### Hata: "foreign key constraint"
- `user_profiles` tablosu yok
- Önce user_profiles tablosunu oluştur veya foreign key'i kaldır

### Hata: "function does not exist"
- Fonksiyonları oluşturmayı unuttun
- `03_functions.sql` dosyasını çalıştır

## Performans İpuçları

1. **Index'leri kontrol et:**
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename LIKE 'social_%';
```

2. **Slow query'leri bul:**
```sql
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%social_%'
ORDER BY mean_time DESC
LIMIT 10;
```

3. **Realtime'ı sadece gerekli yerlerde kullan:**
- Posts için: ✅ (yeni postlar için)
- Likes için: ❌ (gereksiz, optimistic update yeterli)
- Comments için: ✅ (yeni yorumlar için)

## Güvenlik Kontrol Listesi

- ✅ RLS tüm tablolarda aktif
- ✅ Storage bucket policies ayarlandı
- ✅ User sadece kendi içeriğini düzenleyebilir
- ✅ Foreign key constraints var
- ✅ UNIQUE constraints var (duplicate önleme)
- ✅ CHECK constraints var (self-follow önleme)

## Sonraki Adımlar

1. ✅ Database kurulumu tamamlandı
2. ✅ React Native app Supabase'e bağlı
3. 🔄 Test kullanıcısı oluştur ve test et
4. 🔄 Realtime subscriptions ekle (opsiyonel)
5. 🔄 Image upload fonksiyonu ekle
6. 🔄 Push notifications ekle (opsiyonel)

## Yardım

Sorun yaşarsan:
1. Supabase Dashboard > Logs > Database
2. Hata mesajlarını kontrol et
3. SQL Editor'de manuel sorgu dene
