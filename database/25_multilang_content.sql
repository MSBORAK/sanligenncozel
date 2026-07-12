-- =====================================================
-- Çok dilli içerik alanları — etkinlikler, firsatlar, kesfet
-- Admin panelden her dil için ayrı başlık/açıklama girilebilir.
-- Boş bırakılan diller, mobil uygulamada Türkçe (baslik/aciklama)
-- alanına otomatik düşer (fallback).
-- Supabase SQL Editor'da çalıştır.
-- =====================================================

ALTER TABLE etkinlikler
  ADD COLUMN IF NOT EXISTS baslik_en TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_en TEXT,
  ADD COLUMN IF NOT EXISTS baslik_de TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_de TEXT,
  ADD COLUMN IF NOT EXISTS baslik_es TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_es TEXT,
  ADD COLUMN IF NOT EXISTS baslik_fr TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_fr TEXT,
  ADD COLUMN IF NOT EXISTS baslik_ar TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_ar TEXT;

ALTER TABLE firsatlar
  ADD COLUMN IF NOT EXISTS baslik_en TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_en TEXT,
  ADD COLUMN IF NOT EXISTS baslik_de TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_de TEXT,
  ADD COLUMN IF NOT EXISTS baslik_es TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_es TEXT,
  ADD COLUMN IF NOT EXISTS baslik_fr TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_fr TEXT,
  ADD COLUMN IF NOT EXISTS baslik_ar TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_ar TEXT;

ALTER TABLE kesfet
  ADD COLUMN IF NOT EXISTS baslik_en TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_en TEXT,
  ADD COLUMN IF NOT EXISTS baslik_de TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_de TEXT,
  ADD COLUMN IF NOT EXISTS baslik_es TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_es TEXT,
  ADD COLUMN IF NOT EXISTS baslik_fr TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_fr TEXT,
  ADD COLUMN IF NOT EXISTS baslik_ar TEXT,
  ADD COLUMN IF NOT EXISTS aciklama_ar TEXT;
