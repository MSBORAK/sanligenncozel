import { useMemo } from 'react';
import { useThemeMode } from '@/context/ThemeContext';
import { Clean } from '@/constants/Colors';
import { Editorial } from '@/theme/colors';

export function useAppTheme() {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  return useMemo(() => ({
    isDark,
    pageBg:  isDark ? Editorial.bg       : '#FFFFFF',
    cardBg:  isDark ? Editorial.surface   : Clean.surface,
    cardBdr: isDark ? Editorial.border    : 'rgba(17,17,20,1)',
    txt1:    isDark ? Editorial.ink       : Clean.textPrimary,
    txt2:    isDark ? Editorial.coffeeSoft : Clean.textSecondary,
    ctaBg:   isDark ? Editorial.coffee    : Clean.ctaBg,
    ctaTxt:  isDark ? Editorial.creamText : Clean.ctaText,
    chipBg:  isDark ? Editorial.chip      : Clean.bgSoft,
    accent:  '#F2600C',
    border:  isDark ? Editorial.borderSoft : Clean.border,
    divider: isDark ? Editorial.divider    : Clean.divider,
  }), [isDark]);
}
