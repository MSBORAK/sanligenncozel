import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://taljkterwvuwmazbkram.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbGprdGVyd3Z1d21hemJrcmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDI5MjQsImV4cCI6MjA4MTYxODkyNH0.I9JkJN5bOfaDqsmdNMgXotXqPGfK6OB1zQ5SMk-8epI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Supabase Storage'dan public URL al
 * @param bucket - Storage bucket adı (örn: 'images', 'story-images')
 * @param path - Dosya yolu (örn: 'story/baskan.jpg' veya 'firsatlar/kahve.jpg')
 * @returns Public URL string
 */
export const getStorageUrl = (bucket: string, path: string): string => {
  const { data } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Resim URL'i işle - eğer Supabase Storage path'i ise public URL'e çevir
 * @param urlOrPath - Tam URL string veya Storage path (örn: 'story/baskan.jpg')
 * @param bucket - Storage bucket adı (default: 'images')
 * @returns Kullanılabilir URL string veya null
 */
export const processImageUrl = (urlOrPath?: string | null, bucket: string = 'images'): string | null => {
  if (!urlOrPath || urlOrPath.trim() === '') return null;
  
  const trimmedPath = urlOrPath.trim();
  
  // Eğer zaten tam bir URL ise (http/https ile başlıyorsa) direkt dön
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }
  
  // Eğer Storage path'i ise (örn: 'story/baskan.jpg') public URL'e çevir
  try {
    return getStorageUrl(bucket, trimmedPath);
  } catch {
    return null;
  }
};
