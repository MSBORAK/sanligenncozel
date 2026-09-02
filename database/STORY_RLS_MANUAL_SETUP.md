# Story RLS Politikalarını Manuel Kurulum

Eğer SQL dosyası "policy already exists" hatası veriyorsa, politikaları Supabase Dashboard'dan manuel olarak ekleyin.

## Adım 1: Mevcut Politikaları Sil

Supabase Dashboard > Authentication > Policies > social_stories

Mevcut tüm politikaları sil (Delete butonuna tıkla)

## Adım 2: Yeni Politikalar Ekle

### social_stories Tablosu

#### Politika 1: View (SELECT)
- **Name:** `Users can view their own stories or stories sent to them`
- **Policy Command:** `SELECT`
- **Target Roles:** `authenticated`
- **USING expression:**
```sql
(user_id = auth.uid()) OR (recipient_id = auth.uid()) OR (recipient_id IS NULL)
```

#### Politika 2: Insert (INSERT)
- **Name:** `Users can create their own stories`
- **Policy Command:** `INSERT`
- **Target Roles:** `authenticated`
- **WITH CHECK expression:**
```sql
user_id = auth.uid()
```

#### Politika 3: Delete (DELETE)
- **Name:** `Users can delete their own stories`
- **Policy Command:** `DELETE`
- **Target Roles:** `authenticated`
- **USING expression:**
```sql
user_id = auth.uid()
```

---

### story_views Tablosu

Supabase Dashboard > Authentication > Policies > story_views

#### Politika 1: View (SELECT)
- **Name:** `Story owners can view their story views`
- **Policy Command:** `SELECT`
- **Target Roles:** `authenticated`
- **USING expression:**
```sql
EXISTS (
  SELECT 1 FROM social_stories
  WHERE social_stories.id = story_views.story_id
  AND social_stories.user_id = auth.uid()
)
```

#### Politika 2: Insert (INSERT)
- **Name:** `Users can add their own views`
- **Policy Command:** `INSERT`
- **Target Roles:** `authenticated`
- **WITH CHECK expression:**
```sql
viewer_id = auth.uid()
```

## Adım 3: Test Et

SQL Editor'da çalıştır:

```sql
-- Kendi story'lerini görebiliyor musun?
SELECT * FROM social_stories WHERE user_id = auth.uid();

-- Sana gönderilen story'leri görebiliyor musun?
SELECT * FROM social_stories WHERE recipient_id = auth.uid();

-- Story oluşturabilir misin?
INSERT INTO social_stories (user_id, image_url, recipient_id, expires_at)
VALUES (
  auth.uid(),
  'https://example.com/test.jpg',
  'RECIPIENT_USER_ID'::uuid,
  NOW() + INTERVAL '24 hours'
);
```

## Alternatif: SQL ile Politika Ekleme

Eğer Dashboard kullanmak istemiyorsan, bu SQL'i çalıştır:

```sql
-- Önce tüm politikaları sil
DROP POLICY IF EXISTS "Users can view stories" ON social_stories;
DROP POLICY IF EXISTS "Users can view their own stories or stories sent to them" ON social_stories;
DROP POLICY IF EXISTS "Users can create stories" ON social_stories;
DROP POLICY IF EXISTS "Users can create their own stories" ON social_stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON social_stories;

-- Yeni politikaları ekle
CREATE POLICY "view_own_or_received_stories"
ON social_stories FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR recipient_id = auth.uid()
  OR recipient_id IS NULL
);

CREATE POLICY "create_own_stories"
ON social_stories FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_stories"
ON social_stories FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- story_views için
DROP POLICY IF EXISTS "Story owners can view their story views" ON story_views;
DROP POLICY IF EXISTS "Users can add their own views" ON story_views;

CREATE POLICY "view_own_story_views"
ON story_views FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM social_stories
    WHERE social_stories.id = story_views.story_id
    AND social_stories.user_id = auth.uid()
  )
);

CREATE POLICY "add_own_views"
ON story_views FOR INSERT
TO authenticated
WITH CHECK (viewer_id = auth.uid());
```

## Sorun Giderme

### Hata: "policy already exists"
**Çözüm:** Önce mevcut politikayı sil, sonra yenisini ekle

### Hata: "permission denied"
**Çözüm:** RLS'nin aktif olduğundan emin ol:
```sql
ALTER TABLE social_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
```

### Hata: "column recipient_id does not exist"
**Çözüm:** Önce kolonu ekle:
```sql
ALTER TABLE social_stories 
ADD COLUMN recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```
