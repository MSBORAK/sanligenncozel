import React, { createContext, useContext, useMemo } from 'react';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  modeLabel: string;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Dark mode geçici olarak kaldırıldı — uygulama sadece açık (gündüz) temada çalışıyor.
// İleride geri eklenecekse: mode'u tekrar state'e bağla ve toggleTheme'i işlevsel yap.
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: 'light',
      modeLabel: 'Gündüz',
      toggleTheme: () => {},
    }),
    []
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


