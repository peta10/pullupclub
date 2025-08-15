import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// SSR-safe i18n configuration
const isClient = typeof window !== 'undefined';

// Simple, working configuration
const config = {
  fallbackLng: 'en',
  lng: 'en',
  debug: false,
  interpolation: { escapeValue: false },
  ns: ['common'],
  defaultNS: 'common',
  react: {
    useSuspense: false, // Critical for SSR compatibility
  },
  // Built-in resources to prevent loading issues
  resources: {
    en: {
      common: {
        loading: 'Loading...',
        error: 'Error',
        submit: 'Submit',
        cancel: 'Cancel',
        login: 'Login',
        logout: 'Logout',
        dashboard: 'Dashboard',
        profile: 'Profile',
        admin: 'Admin',
        welcome: 'Welcome',
        settings: 'Settings',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        close: 'Close',
        open: 'Open',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        home: 'Home',
        pullups: 'Pull-ups',
        submissions: 'Submissions',
        leaderboard: 'Leaderboard',
        subscription: 'Subscription',
        account: 'Account'
      }
    }
  }
};

// Initialize i18n properly
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init(config);
}

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