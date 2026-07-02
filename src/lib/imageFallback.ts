import { Image } from 'react-native';

/**
 * Görsel eksik/boş olduğunda kırık placeholder yerine kullanılacak yerel Urfa görselleri.
 * via.placeholder.com kapandığı için artık kullanılmıyor; bunlar bundle'da, offline çalışır.
 */
const POOL: string[] = [
  Image.resolveAssetSource(require('@/assets/images/gobeklitepe.jpg')).uri,
  Image.resolveAssetSource(require('@/assets/images/harran.jpg')).uri,
  Image.resolveAssetSource(require('@/assets/images/balikligol.jpg')).uri,
  Image.resolveAssetSource(require('@/assets/images/urfakalesi.jpg')).uri,
];

/** Varsayılan tek görsel (seed yoksa). */
export const FALLBACK_IMAGE = POOL[0];

/**
 * Bir kimliğe/tohuma göre havuzdan tutarlı bir Urfa görseli döndürür.
 * Aynı id her zaman aynı görseli verir; farklı kartlar farklı görsel alır.
 */
export const cityFallback = (seed?: string | number | null): string => {
  if (seed == null) return POOL[0];
  const n =
    typeof seed === 'number'
      ? Math.abs(Math.trunc(seed))
      : String(seed)
          .split('')
          .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return POOL[n % POOL.length];
};
