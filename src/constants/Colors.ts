/**
 * Light: açık, ferah, pastel
 * Dark: koyu, derin, amber vurgulu
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
  background: '#060c1a',
  backgroundDark: '#040814',
  backgroundLight: '#f8fafc',

  primary: { indigo: '#f59e0b', violet: '#334155', teal: '#10b981', terracotta: '#d97706' },
  primaryHex: '#f59e0b',
  pearl: '#f8e3b0',
  secondary: '#e2e8f0',

  cta: '#f59e0b',
  accent: '#f59e0b',
  buff: '#f7d774',

  glassOverlay: 'rgba(255, 255, 255, 0.08)',
  glassBorderTop: 'rgba(255, 255, 255, 0.14)',
  glassBorderBottom: 'rgba(0, 0, 0, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBorderThin: 'rgba(255, 255, 255, 0.16)',
  glassPrimary: 'rgba(245, 158, 11, 0.1)',
  glassPrimaryLight: 'rgba(245, 158, 11, 0.06)',

  primaryColors: { indigo: '#f59e0b', violet: '#334155', teal: '#10b981', terracotta: '#d97706' },
  accentColors: { amber: '#f59e0b', gold: '#f7d774', rose: '#f472b6', coral: '#fb7185' },
  textHighlight: '#f7d774',
  lightGray: '#94a3b8',
  darkGray: '#334155',
  white: '#ffffff',
  black: '#0f172a',
  transparent: 'transparent',

  dark: {
    background: '#060c1a',
    card: 'rgba(255, 255, 255, 0.06)',
    accent: '#f59e0b',
    border: 'rgba(255, 255, 255, 0.12)',
    text: '#f8fafc',
    textMuted: 'rgba(248, 250, 252, 0.68)',
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
  hero: ['#060c1a', '#0f172a', '#111827'] as const,
  heroWarm: ['#f59e0b', '#fbbf24', '#f59e0b'] as const,
  dark: ['#040814', '#060c1a', '#0f172a'] as const,
  card: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)'] as const,
  header: ['#040814', '#060c1a', '#0f172a'] as const,
  background: ['#040814', '#060c1a', '#111827'] as const,
  quoteCard: ['#b45309', '#f59e0b', '#fbbf24'] as const,
  innerShadow: ['rgba(0,0,0,0.06)', 'transparent'] as const,

  meshMarigold: ['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.06)', 'transparent'] as const,
  meshNavy: ['transparent', 'rgba(6, 12, 26, 0.45)', 'rgba(4, 8, 20, 0.55)'] as const,
  meshPearl: ['rgba(255, 255, 255, 0.06)', 'transparent'] as const,
  meshBuff: ['transparent', 'transparent', 'rgba(245, 158, 11, 0.08)'] as const,

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
