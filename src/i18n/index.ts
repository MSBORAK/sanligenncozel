import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import tr from '@/locales/tr';
import en from '@/locales/en';

// Almanca/İspanyolca/Fransızca/Arapça desteğinden vazgeçildi — sadece
// Türkçe ve İngilizce. Çeviri dosyaları (de/es/fr/ar.ts) ileride tekrar
// gerekirse diye src/locales altında duruyor, sadece burada kayıtlı değiller.
export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];
export const RTL_LANGUAGES: LanguageCode[] = [];

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

const deviceLanguageTag = Localization.getLocales()[0]?.languageCode ?? 'tr';
const initialLanguage: LanguageCode = SUPPORTED_LANGUAGES.includes(deviceLanguageTag as LanguageCode)
  ? (deviceLanguageTag as LanguageCode)
  : 'tr';

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
});

export default i18n;
