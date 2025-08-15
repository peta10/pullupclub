import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// SSR-safe i18n configuration
const isClient = typeof window !== 'undefined';

// Base configuration that works on both server and client
const baseConfig = {
  fallbackLng: 'en',
  debug: false,
  interpolation: { escapeValue: false },
  ns: ['home', 'subscription', 'common', 'auth', 'admin', 'leaderboard', 'profile', 'rules', 'faq', 'ethos', 'submission'],
  defaultNS: 'common',
  react: {
    useSuspense: false, // Critical for SSR compatibility
  },
  // Basic resources to prevent hydration mismatches
  resources: {
    en: {
      common: {
        loading: 'Loading...',
        error: 'Error',
        submit: 'Submit',
        cancel: 'Cancel',
      }
    }
  }
};

// Initialize i18n with proper SSR guards
const initI18n = () => {
  if (i18n.isInitialized) return i18n;

  if (isClient) {
    // Client-side: Load dynamic imports after hydration
    import('i18next-browser-languagedetector').then((LanguageDetector) => {
      import('i18next-http-backend').then((Backend) => {
        i18n
          .use(Backend.default)
          .use(LanguageDetector.default)
          .use(initReactI18next)
          .init({
            ...baseConfig,
            backend: { 
              loadPath: '/locales/{{lng}}/{{ns}}.json',
              crossDomain: false
            },
            detection: {
              order: ['localStorage', 'navigator', 'htmlTag'],
              caches: ['localStorage'],
            },
            preload: ['en'],
          });
      });
    });
  } else {
    // Server-side: Minimal initialization
    i18n
      .use(initReactI18next)
      .init({
        ...baseConfig,
        lng: 'en', // Default language for SSR
        preload: ['en'],
      });
  }

  return i18n;
};

// Initialize immediately
initI18n();

/** Central list of supported languages + flags + text-direction */
export const getAvailableLanguages = () => [
  { code: 'en', name: 'English',   flag: '🇺🇸', dir: 'ltr' },
  { code: 'es', name: 'Español',   flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'Français',  flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'Deutsch',   flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', dir: 'ltr' },
  { code: 'zh', name: '中文',       flag: '🇨🇳', dir: 'ltr' },
  { code: 'ja', name: '日本語',     flag: '🇯🇵', dir: 'ltr' },
  { code: 'ko', name: '한국어',     flag: '🇰🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية',    flag: '🇸🇦', dir: 'rtl' },
]

export default i18n; 