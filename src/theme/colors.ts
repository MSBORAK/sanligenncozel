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

export type AppColors = typeof colors;
