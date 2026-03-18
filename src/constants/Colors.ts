/**
 * Dark: Police Blue + Marigold
 * Light: Dribbble - BİREBİR aynı hex değerleri
 */

// Dribbble tasarım - birebir aynı hex
export const DribbbleColors = {
  background: '#f8fafc',
  mint: '#E6F4EA',
  lightBlue: '#E1F0FF',
  lavender: '#F0E6FF',
  pink: '#F8E6F0',
  yellow: '#FEF9C3',
  cardWhite: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  progressBlue: '#3b82f6',
  borderLight: 'rgba(0,0,0,0.06)',
  storyBorder: '#c4b5fd',
  textPremium: '#1A2130',     // Koyu füme - premium kontrast
  iconGlowPurple: '#a78bfa',   // Etkinlik
  iconGlowBlue: '#60a5fa',     // Keşfet
  iconGlowPink: '#f472b6',     // Eczane
  iconGlowMint: '#34d399',     // Kütüphane
  iconGlowYellow: '#fbbf24',   // Gezi
};

// Açık tema için tema-uyumlu değerler (sayfa arası harmanlama)
export const LightTheme = {
  background: DribbbleColors.background,
  card: DribbbleColors.cardWhite,
  cardSoft: '#f8fafc',       // Çok hafif kartlar
  text: DribbbleColors.textPrimary,
  textSecondary: DribbbleColors.textSecondary,
  accent: DribbbleColors.progressBlue,
  border: DribbbleColors.borderLight,
  searchBg: '#F0F4FF',       // Arama çubuğu - lavanta tonu
  pillBg: '#E8F4FF',         // Area pill - mavi tonu
  pillActive: DribbbleColors.progressBlue,
};

export const Colors = {
  background: '#1a2b4a',
  backgroundDark: '#0f1a2e',
  backgroundLight: '#253858',

  primary: { indigo: '#f4a823', violet: '#1a2b4a', teal: '#f4a823', terracotta: '#e09520' },
  primaryHex: '#f4a823',
  pearl: '#EBDDC5',
  secondary: '#e2e8f0',

  cta: '#f4a823',
  accent: '#f4a823',
  buff: '#F3D58D',

  glassOverlay: 'rgba(255, 255, 255, 0.12)',
  glassBorderTop: 'rgba(255, 255, 255, 0.2)',
  glassBorderBottom: 'rgba(0, 0, 0, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassBorderThin: 'rgba(255, 255, 255, 0.18)',
  glassPrimary: 'rgba(244, 168, 35, 0.1)',
  glassPrimaryLight: 'rgba(244, 168, 35, 0.06)',

  primaryColors: { indigo: '#f4a823', violet: '#1a2b4a', teal: '#f4a823', terracotta: '#e09520' },
  accentColors: { amber: '#f4a823', gold: '#F3D58D', rose: '#f4a823', coral: '#f4a823' },
  textHighlight: '#F3D58D',
  lightGray: '#94a3b8',
  darkGray: '#334155',
  white: '#ffffff',
  black: '#0f172a',
  transparent: 'transparent',

  dark: {
    background: '#1a2b4a',
    card: 'rgba(255, 255, 255, 0.08)',
    accent: '#f4a823',
    border: 'rgba(255, 255, 255, 0.18)',
    text: '#f8fafc',
    textMuted: '#EBDDC5',
  },
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    accent: '#3b82f6',
    border: 'rgba(0, 0, 0, 0.06)',
    text: '#1e293b',
    textMuted: '#64748b',
  },
};

export const Gradients = {
  hero: ['#1a2b4a', '#243654', '#2a3f5f'] as const,
  heroWarm: ['#f4a823', '#f5b84d', '#f4a823'] as const,
  dark: ['#0f1a2e', '#1a2b4a', '#243654'] as const,
  card: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)'] as const,
  header: ['#1a2b4a', '#243654', '#2a3f5f'] as const,
  background: ['#1a2b4a', '#243654', '#2e4365'] as const,
  quoteCard: ['#c17d0a', '#f4a823', '#f5b84d'] as const,
  innerShadow: ['rgba(0,0,0,0.06)', 'transparent'] as const,

  meshMarigold: ['rgba(244, 168, 35, 0.2)', 'rgba(244, 168, 35, 0.06)', 'transparent'] as const,
  meshNavy: ['transparent', 'rgba(26, 43, 74, 0.4)', 'rgba(15, 26, 46, 0.5)'] as const,
  meshPearl: ['rgba(255, 255, 255, 0.06)', 'transparent'] as const,
  meshBuff: ['transparent', 'transparent', 'rgba(244, 168, 35, 0.08)'] as const,

  glassReflection: ['transparent', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0.06)', 'transparent'] as const,

  // Açık tema - Dribbble birebir
  backgroundLight: ['#f8fafc', '#f8fafc', '#f1f5f9'] as const,
  headerLight: ['#ffffff', '#fafafa', '#f8fafc'] as const,
  statsCardLight: ['#E6F4EA', '#E6F4EA'] as const,           // Mint - date card
  quoteCardLight: ['#F8E6F0', '#F8E6F0'] as const,           // Pink - chat widget
  quoteCardAltLight: ['#F0E6FF', '#F0E6FF'] as const,         // Lavender - schedule
  bentoLight: ['#ffffff', '#ffffff'] as const,
  // Bento pastel - düz sade renkler
  bentoLavender: ['#EDE7F6', '#EDE7F6'] as const,    // Düz lavanta (Etkinlik)
  bentoLightBlue: ['#E3F2FD', '#E3F2FD'] as const,   // Düz açık mavi (Keşfet)
  bentoPink: ['#FCE4EC', '#FCE4EC'] as const,         // Düz pembe (Eczane)
  bentoMint: ['#E8F5E9', '#E8F5E9'] as const,         // Düz mint (Kütüphane)
  bentoYellow: ['#FFFDE7', '#FFFDE7'] as const,        // Düz krem sarı (Gezi)
  innerShadowLight: ['rgba(0,0,0,0.02)', 'transparent'] as const,
  glassReflectionLight: ['transparent', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0.4)', 'transparent'] as const,
};
