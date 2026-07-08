import { useThemeMode } from '@/context/ThemeContext';
import { Clean } from '@/constants/Colors';
import { Editorial } from '@/theme/colors';

/** Şanlı Editorial — Home / Transport / Genç Kart ile aynı krem/kahve tema değişkenleri */
export function useEditorialTheme() {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  return {
    isDark,
    pageBg: isDark ? '#0C0C0E' : Editorial.bg,
    cardBg: isDark ? '#18181B' : Editorial.surface,
    cardBdr: isDark ? 'rgba(255,255,255,0.12)' : Editorial.border,
    txt1: isDark ? '#F5F5F7' : Editorial.ink,
    txt2: isDark ? 'rgba(245,245,247,0.55)' : Editorial.coffeeSoft,
    ctaBg: isDark ? '#F5F5F7' : Editorial.coffee,
    ctaTxt: isDark ? '#111114' : Editorial.creamText,
    chipBg: isDark ? '#1F1F23' : Editorial.chip,
    divider: isDark ? 'rgba(255,255,255,0.06)' : Editorial.divider,
    amber: Clean.accent,
    editorial: Editorial,
  };
}
