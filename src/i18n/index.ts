import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import tr from '@/locales/tr';
import en from '@/locales/en';
import de from '@/locales/de';
import es from '@/locales/es';
import fr from '@/locales/fr';
import ar from '@/locales/ar';

export const SUPPORTED_LANGUAGES = ['tr', 'en', 'de', 'es', 'fr', 'ar'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];
export const RTL_LANGUAGES: LanguageCode[] = ['ar'];

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
  fr: { translation: fr },
  ar: { translation: ar },
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
