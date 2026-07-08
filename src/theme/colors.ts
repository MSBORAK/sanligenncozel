export const colors = {
  primary: '#7C3AED',
  secondary: '#3B82F6',
  accent: '#F59E0B',
  danger: '#EF4444',
  white: '#FFFFFF',
  textPrimary: 'rgba(255,255,255,1)',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.4)',
  glassBackground: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.18)',
  gradientStart: '#3B1F8C',
  gradientMid: '#1E3A8A',
  gradientEnd: '#6D28D9',
} as const;

export const Editorial = {
  bg: '#F5E9D6',
  surface: '#FBF2E3',
  chip: '#F1E3CB',
  ink: '#111114',
  coffee: '#2F2418',
  coffeeSoft: '#3A2A1A',
  creamText: '#FFF8EA',
  border: 'rgba(58,42,26,1)',
  borderSoft: 'rgba(58,42,26,0.28)',
  divider: 'rgba(58,42,26,0.14)',
} as const;

/** Genç Kart cüzdan kartı — editorial (kahve) ve clean (mono, siyah-beyaz UI uyumlu) */
export const GencKartCardTheme = {
  editorial: {
    label: 'Kahve',
    bgImage: require('@/assets/images/sanli-editorial-genc-kart-bg.png'),
    shadow: '#2F2418',
    holderLabel: 'rgba(255,248,234,0.65)',
    yearBorder: 'rgba(255,248,234,0.55)',
  },
  clean: {
    label: 'Mono',
    bgImage: require('@/assets/images/sanli-clean-genc-kart-bg.png'),
    shadow: '#111114',
    holderLabel: 'rgba(255,255,255,0.55)',
    yearBorder: 'rgba(255,255,255,0.45)',
  },
} as const;

export type GencKartCardVariant = keyof typeof GencKartCardTheme;

export type AppColors = typeof colors;
