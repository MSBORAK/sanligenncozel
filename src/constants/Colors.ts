/**
 * Bütünsel Palet - Lacivert vs Altın Kontrastı
 * - Zemin: Police Blue
 * - Enerji: Marigold
 * - Yumuşaklık: Pearl
 * - Vurgu: Citrine Brown
 * - Işık: Buff
 */

export const Colors = {
  // Ana palet
  background: '#2E4365',       // Police Blue (zemin)
  backgroundDark: '#243654',    // Daha koyu - gradient üst
  backgroundLight: '#3a5280',   // Daha açık - gradient alt

  primary: { indigo: '#E59D2C', violet: '#2E4365', teal: '#E59D2C', terracotta: '#8A3B08' },
  primaryHex: '#E59D2C',       // Marigold (ikonlar, aktif durumlar)
  pearl: '#EBDDC5',            // Pearl (borders, metin detay)
  secondary: '#EBDDC5',

  cta: '#8A3B08',              // Citrine Brown (Günün Sözü, vurgular)
  accent: '#8A3B08',
  buff: '#F3D58D',             // Buff (başlıklar, hava durumu, badge)

  // Glassmorphism - Cam efekti
  glassOverlay: 'rgba(46, 67, 101, 0.15)',   // Police Blue %15
  glassBorderTop: 'rgba(235, 221, 197, 0.3)',  // Pearl %30 - üst kenar (ışık)
  glassBorderBottom: 'rgba(26, 39, 64, 0.35)',  // Alt kenar - koyu (gölge)
  glassBorder: 'rgba(235, 221, 197, 0.2)',
  glassBorderThin: 'rgba(235, 221, 197, 0.2)',
  glassPrimary: 'rgba(229, 157, 44, 0.1)',
  glassPrimaryLight: 'rgba(229, 157, 44, 0.08)',

  // Uyumluluk
  primaryColors: {
    indigo: '#E59D2C',
    violet: '#2E4365',
    teal: '#E59D2C',
    terracotta: '#8A3B08',
  },
  accentColors: {
    amber: '#E59D2C',
    gold: '#EBDDC5',
    rose: '#8A3B08',
    coral: '#8A3B08',
  },
  textHighlight: '#EBDDC5',
  lightGray: '#EBDDC5',
  darkGray: '#2E4365',
  white: '#ffffff',
  black: '#1a2740',
  transparent: 'transparent',

  // Dark theme
  dark: {
    background: '#2E4365',
    card: 'rgba(235, 221, 197, 0.08)',
    accent: '#E59D2C',
    border: '#EBDDC5',
    text: '#F3D58D',
    textMuted: '#EBDDC5',
  },
  light: {
    background: '#3a5280',
    card: 'rgba(235, 221, 197, 0.3)',
    accent: '#E59D2C',
    border: '#EBDDC5',
    text: '#1a2740',
    textMuted: '#8A3B08',
  },
};

// Gradient - üstten alta (darker → lighter) Police Blue
export const Gradients = {
  hero: ['#243654', '#2E4365', '#3a5280'] as const,
  heroWarm: ['#243654', '#2E4365', '#8A3B08'] as const,
  dark: ['#1a2740', '#243654', '#2E4365'] as const,
  card: ['rgba(235,221,197,0.06)', 'rgba(243,213,141,0.04)'] as const,
  header: ['#243654', '#2E4365', '#3a5280'] as const,
  background: ['#243654', '#2E4365', '#3a5280'] as const,  // Ekran arka plan gradyanı
  quoteCard: ['#8A3B08', '#a84d0a', '#E59D2C'] as const,   // Citrine Brown → Marigold
  innerShadow: ['rgba(0,0,0,0.06)', 'transparent'] as const,  // Inner shadow - üstten gömülme hissi

  // Mesh Gradient - köşelerden sızan atmosfer
  meshMarigold: ['rgba(229, 157, 44, 0.14)', 'rgba(229, 157, 44, 0.04)', 'transparent'] as const,
  meshNavy: ['transparent', 'rgba(26, 39, 64, 0.35)', 'rgba(26, 39, 64, 0.5)'] as const,
  meshPearl: ['rgba(235, 221, 197, 0.06)', 'transparent'] as const,
  meshBuff: ['transparent', 'transparent', 'rgba(243, 213, 141, 0.08)'] as const,

  // Glass Reflection - çapraz ince beyaz parlama (cam ışık yansıması)
  glassReflection: ['transparent', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.06)', 'transparent'] as const,
};
