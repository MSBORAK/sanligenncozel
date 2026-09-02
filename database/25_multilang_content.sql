-- =====================================================
-- ÇOK DİLLİ İÇERİK ALANLARI — etkinlikler, firsatlar, kesfet
-- Admin panelden İngilizce başlık/açıklama girilebilir.
-- Boş bırakılırsa, mobil uygulamada Türkçe (baslik/aciklama)
-- alanına otomatik düşer (fallback).
-- Not: Uygulama artık sadece Türkçe + İngilizce destekliyor,
-- bu yüzden sadece _en kolonları ekleniyor (de/es/fr/ar'a gerek yok).
-- Supabase SQL Editor'da çalıştır.
-- =====================================================

ALTER TABLE etkinlikler
  ADD COLUMN IF NOT EXISTS baslik_en TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_en TEXT;

ALTER TABLE firsatlar
  ADD COLUMN IF NOT EXISTS baslik_en TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_en TEXT;

ALTER TABLE kesfet
  ADD COLUMN IF NOT EXISTS baslik_en TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_en TEXT;
