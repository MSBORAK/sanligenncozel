import { supabase, processImageUrl } from '@/lib/supabase';
import { cityFallback } from '@/lib/imageFallback';
import type { HeritageCategory } from '@/types';

export interface KesfetRow {
  id: number;
  slug?: string | null;
  baslik: string;
  aciklama?: string | null;
  kategori?: string | null;
  resim_url?: string | null;
  sira?: number | null;
  one_cikan?: boolean | null;
  aktif?: boolean | null;
}

export interface KesfetPlace {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  category: HeritageCategory;
  image: string;
  featured: boolean;
  sortOrder: number;
}

const VALID_CATEGORIES = new Set<HeritageCategory>(['historic', 'faith', 'nature', 'museum', 'bazaar']);

export function mapKesfetRow(row: KesfetRow): KesfetPlace {
  const category = VALID_CATEGORIES.has(row.kategori as HeritageCategory)
    ? (row.kategori as HeritageCategory)
    : 'historic';

  return {
    id: row.id.toString(),
    slug: row.slug ?? undefined,
    title: row.baslik,
    description: row.aciklama ?? undefined,
    category,
    image: processImageUrl(row.resim_url, 'kesfet_resimleri') || cityFallback(row.id),
    featured: Boolean(row.one_cikan),
    sortOrder: row.sira ?? 0,
  };
}

export function sortKesfetPlaces(items: KesfetPlace[]): KesfetPlace[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'tr'));
}

export async function fetchKesfetPlaces(): Promise<KesfetPlace[]> {
  const { data, error } = await supabase
    .from('kesfet')
    .select('*')
    .eq('aktif', true)
    .order('sira', { ascending: true });

  if (error || !data) return [];
  return sortKesfetPlaces((data as KesfetRow[]).map(mapKesfetRow));
}

export async function fetchKesfetByCategory(category: HeritageCategory): Promise<KesfetPlace[]> {
  const { data, error } = await supabase
    .from('kesfet')
    .select('*')
    .eq('aktif', true)
    .eq('kategori', category)
    .order('sira', { ascending: true });

  if (error || !data) return [];
  return sortKesfetPlaces((data as KesfetRow[]).map(mapKesfetRow));
}

export async function fetchKesfetById(id: string): Promise<KesfetPlace | null> {
  const numericId = /^\d+$/.test(id) ? parseInt(id, 10) : null;
  if (numericId == null) return null;

  const { data, error } = await supabase.from('kesfet').select('*').eq('id', numericId).eq('aktif', true).single();
  if (error || !data) return null;
  return mapKesfetRow(data as KesfetRow);
}
