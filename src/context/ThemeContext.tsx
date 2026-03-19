import React, { createContext, useContext, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  modeLabel: string;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  const value = useMemo(
    () => ({
      mode,
      modeLabel: mode === 'dark' ? 'Amber Gece' : 'Gündüz',
      toggleTheme: () => {
        setMode(prev => (prev === 'light' ? 'dark' : 'light'));
      },
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used inside ThemeProvider');
  }
  return ctx;
};


