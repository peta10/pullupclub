import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Initialize i18n for both client and server
const initI18n = () => {
  if (typeof window !== 'undefined') {
    // Client-side initialization
    i18n
      .use(Backend)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        fallbackLng: 'en',
        debug: false,
        interpolation: { escapeValue: false },
        backend: { 
          loadPath: '/locales/{{lng}}/{{ns}}.json',
          crossDomain: false
        },
        detection: {
          order: ['localStorage', 'navigator', 'htmlTag'],
          caches: ['localStorage'],
        },
        ns: ['home', 'subscription', 'common', 'auth', 'admin', 'leaderboard', 'profile', 'rules', 'faq', 'ethos', 'submission'],
        defaultNS: 'common',
        preload: ['en'],
        saveMissing: false, // Disable to prevent performance issues
        react: {
          useSuspense: false, // Disable suspense to prevent hook issues
        }
      });
  } else {
    // Server-side initialization
    i18n
      .use(initReactI18next)
      .init({
        fallbackLng: 'en',
        debug: false,
        interpolation: { escapeValue: false },
        ns: ['home', 'subscription', 'common', 'auth', 'admin', 'leaderboard', 'profile', 'rules', 'faq', 'ethos', 'submission'],
        defaultNS: 'common',
        preload: ['en'],
        react: {
          useSuspense: false, // Disable suspense for SSR
        }
      });
  }
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