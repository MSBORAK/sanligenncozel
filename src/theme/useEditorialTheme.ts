import { useThemeMode } from '@/context/ThemeContext';
import { Clean } from '@/constants/Colors';
import { Editorial } from '@/theme/colors';

/** Şanlı Editorial — Home / Transport / Genç Kart ile aynı krem/kahve tema değişkenleri */
export function useEditorialTheme() {
  const { mode } = useThemeMode();
  const isDark = mode !== 'light';
  const isInverse = mode === 'inverse';

  return {
    isDark,
    pageBg: isInverse ? '#000000' : isDark ? '#0C0C0E' : Editorial.bg,
    cardBg: isInverse ? '#111114' : isDark ? '#18181B' : Editorial.surface,
    cardBdr: isInverse ? 'rgba(255,255,255,0.42)' : isDark ? 'rgba(255,255,255,0.12)' : Editorial.border,
    txt1: isInverse ? '#F5F5F7' : isDark ? '#F5F5F7' : Editorial.ink,
    txt2: isInverse ? 'rgba(245,245,247,0.62)' : isDark ? 'rgba(245,245,247,0.55)' : Editorial.coffeeSoft,
    ctaBg: isInverse ? '#E5E7EB' : isDark ? '#F5F5F7' : Editorial.coffee,
    ctaTxt: isInverse ? '#111114' : isDark ? '#111114' : Editorial.creamText,
    chipBg: isInverse ? 'rgba(255,255,255,0.12)' : isDark ? '#1F1F23' : Editorial.chip,
    divider: isInverse ? 'rgba(255,255,255,0.22)' : isDark ? 'rgba(255,255,255,0.06)' : Editorial.divider,
    amber: Clean.accent,
    editorial: Editorial,
  };
}
