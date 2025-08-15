import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

// SSR-safe i18n configuration
const isClient = typeof window !== 'undefined';

// Simple, working configuration
const config = {
  fallbackLng: 'en',
  lng: 'en',
  debug: false,
  interpolation: { escapeValue: false },
  ns: ['common', 'auth', 'home', 'submission', 'subscription', 'leaderboard', 'profile', 'admin', 'faq', 'rules', 'ethos', 'cookies'],
  defaultNS: 'common',
  react: {
    useSuspense: false, // Critical for SSR compatibility - NO SUSPENSE per user memory
  },
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  // Built-in fallback resources to prevent loading issues
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

// Initialize i18n properly with error handling
const initializeI18n = async () => {
  if (i18n.isInitialized) return i18n;
  
  try {
    await i18n
      .use(Backend)
      .use(initReactI18next)
      .init(config);
    console.log('🌍 i18n initialized successfully');
    return i18n;
  } catch (error) {
    console.warn('🌍 i18n initialization error (non-critical):', error);
    // Fallback to basic configuration without backend
    try {
      await i18n
        .use(initReactI18next)
        .init({
          ...config,
          backend: undefined, // Remove backend for fallback
        });
      console.log('🌍 i18n initialized with fallback configuration');
      return i18n;
    } catch (fallbackError) {
      console.warn('🌍 i18n fallback initialization failed:', fallbackError);
      return i18n;
    }
  }
};

// Initialize immediately if possible, otherwise on first use
if (typeof window !== 'undefined') {
  initializeI18n();
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

// Export both the instance and the initialization function
export { initializeI18n };
export default i18n; 