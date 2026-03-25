# ŞanlıSosyal — Yol Haritası Durum Takibi

Bu dosya artık fikir listesi + mevcut durum takibidir.

## Durum legend

- ✅ Yapıldı
- 🟡 Kısmen yapıldı
- ⬜ Yapılmadı

## Öncelikli fikirler (senin listenden)

| # | Özellik | Durum | Ne yapmışız | Ne eksik |
|---|---------|-------|-------------|----------|
| 1 | **Streak sistemi** | ✅ | DB tarafında `snap_streak_current`, `snap_streak_best`, `refresh_snap_streak`, `buddy_mutual_snap_streak` var; uygulama ekranında da streak değerleri gösteriliyor. | İsteğe bağlı "kurtarma" mekaniği yok. |
| 2 | **Grup kıvılcımı** | ✅ | `recipient_user_ids` alanı eklendi; uygulamada 2–5 kişiye gönderim ve görünürlük filtresi kullanılıyor. | Geliştirilebilir ama temel özellik çalışır durumda. |
| 3 | **Anonim mod** | ✅ | `anonymous_posts` tablosu ve Şehir Radarı entegrasyonu eklendi; radar kimliksiz noktalardan besleniyor. | Moderasyon/rate-limit tarafı ileride güçlendirilebilir. |
| 4 | **"Urfa'da şu an"** | ✅ | Son 4 saat hareketlilik + canlı gösterge + en hareketli bölgeler özeti eklendi. | İleri seviye metrikler (mahalle trend grafiği vb.) opsiyonel. |

## Daha önce konuşulan diğer başlıklar

| Başlık | Durum | Ne yapmışız | Ne eksik |
|---|---|---|---|
| Ana uygulama **Bildirimler** ekranı ile ŞanlıSosyal olaylarının birleştirilmesi/filtrelenmesi | ✅ | Bildirim ekranı artık arkadaşlık istekleri + mesajlar + kıvılcımları tek listede topluyor. | Olay türüne göre sekme/filtre UX'i ileride eklenebilir. |
| **Push bildirimleri** production (EAS, `projectId`, güvenli gönderim) | ✅ | `projectId` runtime'da EAS config'den okunuyor; proxy endpoint desteği eklendi (`EXPO_PUBLIC_PUSH_PROXY_URL`). | Sunucu tarafı imzalama/edge function ile daha da sertleştirilebilir. |
| **ŞanlıAsistan** API key/kota | ✅ | API key kontrolü + dakika/gün kota limiti eklendi; limit aşımında API çağrısı kesiliyor. | Kurumsal seviye kota için backend-rate-limit eklenebilir. |
| Kamera & akış **UX cilası** | ✅ | Akış/radar tarafında görsel iyileştirmeler ve canlı hissi veren UI elemanları var. | Sürekli iterasyon yapılabilir. |
| Kıvılcımda **gönderen tarafı** için tepki özeti | ⬜ | Belirgin bir gönderen tepki özeti bulunmadı. | Özelliğin tasarlanıp eklenmesi gerekiyor. |
| **ŞanlıSosyal profil** Bento genişletmesi | ✅ | Profilde Bento kart yapısı ve istatistik kartları kullanılıyor. | İleri seviye metriklerle zenginleştirilebilir. |

---

*Son güncelleme: maddeler durum bazlı netleştirildi (yapıldı / kısmen / yapılmadı).*
