import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { LanguageCode, RTL_LANGUAGES, SUPPORTED_LANGUAGES } from '@/i18n';

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  supportedLanguages: readonly LanguageCode[];
};

const STORAGE_KEY = '@sanli_language';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(i18n.language as LanguageCode);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && SUPPORTED_LANGUAGES.includes(saved as LanguageCode)) {
        i18n.changeLanguage(saved);
        setLanguageState(saved as LanguageCode);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);

    // RTL (Arapça) değişimi native tarafta uygulanabilmesi için uygulama
    // yeniden başlatılmalı — yön anlık olarak değişmez.
    const shouldBeRTL = RTL_LANGUAGES.includes(lang);
    if (shouldBeRTL !== I18nManager.isRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
      try {
        await Updates.reloadAsync();
      } catch {
        // Expo Go / dev ortamında reloadAsync çalışmayabilir — kullanıcı elle yeniden başlatır
      }
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, supportedLanguages: SUPPORTED_LANGUAGES }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return ctx;
};
