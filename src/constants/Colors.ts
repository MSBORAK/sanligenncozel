/**
 * Şanlıurfa odaklı renk paleti
 * - Balıklıgöl teal
 * - Urfa taşı terracotta
 * - Göbeklitepe gold
 */

export const Colors = {
  primary: {
    indigo: '#0d9488',   // Balıklıgöl teal (ana)
    violet: '#0f766e',   // Koyu teal
    teal: '#14b8a6',
    terracotta: '#c65d2c',
  },
  accent: {
    amber: '#eab308',
    gold: '#d4a853',
    rose: '#c65d2c',
    coral: '#e07c54',
  },
  background: '#f8f6f2',
  lightGray: '#f0ebe3',
  darkGray: '#292524',
  white: '#ffffff',
  black: '#0a0a09',
  transparent: 'transparent',
};

// Gradient presets - teal ağırlıklı, turuncu yok
export const Gradients = {
  hero: ['#0f766e', '#0d9488', '#14b8a6'] as const,
  heroWarm: ['#0d9488', '#0f766e', '#14b8a6'] as const,
  dark: ['#1c1917', '#292524', '#0f766e'] as const,
};
