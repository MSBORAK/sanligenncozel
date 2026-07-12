import { useMemo } from 'react';
import { useThemeMode } from '@/context/ThemeContext';
import { Clean } from '@/constants/Colors';
import { Editorial } from '@/theme/colors';

export function useAppTheme() {
  const { mode } = useThemeMode();
  const isDark = mode !== 'light';
  const isInverse = mode === 'inverse';

  return useMemo(() => ({
    isDark,
    pageBg:  isInverse ? '#000000' : isDark ? Editorial.bg : '#FFFFFF',
    cardBg:  isInverse ? '#111114' : isDark ? Editorial.surface : Clean.surface,
    cardBdr: isInverse ? 'rgba(255,255,255,0.42)' : isDark ? Editorial.border : 'rgba(17,17,20,1)',
    txt1:    isInverse ? '#FFFFFF' : isDark ? Editorial.ink : Clean.textPrimary,
    txt2:    isInverse ? 'rgba(255,255,255,0.72)' : isDark ? Editorial.coffeeSoft : Clean.textSecondary,
    ctaBg:   isInverse ? '#E5E7EB' : isDark ? Editorial.coffee : Clean.ctaBg,
    ctaTxt:  isInverse ? '#111114' : isDark ? Editorial.creamText : Clean.ctaText,
    chipBg:  isInverse ? 'rgba(255,255,255,0.12)' : isDark ? Editorial.chip : Clean.bgSoft,
    accent:  '#F2600C',
    border:  isInverse ? 'rgba(255,255,255,0.32)' : isDark ? Editorial.borderSoft : Clean.border,
    divider: isInverse ? 'rgba(255,255,255,0.22)' : isDark ? Editorial.divider : Clean.divider,
  }), [isDark, isInverse]);
}
