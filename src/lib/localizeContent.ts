/**
 * Supabase'ten gelen satırlarda dil bazlı alanları (baslik_en, aciklama_de vb.)
 * seçer. İlgili dil boşsa Türkçe (varsayılan alan) değerine düşer.
 */
export function pickLocalized(
  row: Record<string, any> | null | undefined,
  field: 'baslik' | 'aciklama',
  lang: string,
): string {
  if (!row) return '';
  if (lang === 'tr') return row[field] ?? '';
  const localized = row[`${field}_${lang}`];
  return typeof localized === 'string' && localized.trim() ? localized : (row[field] ?? '');
}
