/**
 * Internationalization Configuration (i18next + React)
 * Industry-standard i18n setup with language detection and fallbacks
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations directly with type assertion
const enTranslation = require('../../public/locales/en/translation.json') as Record<string, any>
const viTranslation = require('../../public/locales/vi/translation.json') as Record<string, any>

// Resource bundle
const resources = {
  en: {
    translation: enTranslation,
  },
  vi: {
    translation: viTranslation,
  },
}

// i18n configuration
i18n
  .use(LanguageDetector) // Detect language from browser/localStorage
  .use(initReactI18next) // Bind with React
  .init({
    resources,

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng: string) => {
        if (lng.startsWith('en')) return 'en';
        if (lng.startsWith('vi')) return 'vi';
        return lng;
      },
    },

    // Default settings
    fallbackLng: 'en',
    supportedLngs: ['en', 'vi'],
    defaultNS: 'translation',
    ns: ['translation'],

    // React i18next options
    react: {
      useSuspense: false, // Disable Suspense for SSR compatibility
    },

    // Debugging (enable in development)
    debug: false,

    // Interpolation
    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    // Compatibility with older versions
    compatibilityJSON: 'v4',
  })

export default i18n
export type { TFunction } from 'i18next'
