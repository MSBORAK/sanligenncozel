import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  modeLabel: string;
  toggleTheme: () => void;
};

const STORAGE_KEY = '@sanli_theme_mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'dark' || v === 'light') setMode(v);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      modeLabel: mode === 'light' ? 'Gün Doğumu' : 'Gün Batımı',
      toggleTheme,
    }),
    [mode, toggleTheme],
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
