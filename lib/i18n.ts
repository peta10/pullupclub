import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

const initI18next = async (lng: string, ns: string | string[]) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(
      resourcesToBackend((language: string, namespace: string) =>
        import(`../public/locales/${language}/${namespace}.json`)
      )
    )
    .init({
      lng,
      fallbackLng: 'en',
      supportedLngs: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'ar'],
      defaultNS: typeof ns === 'string' ? ns : ns[0],
      ns,
      interpolation: {
        escapeValue: false,
      },
    });
  return i18nInstance;
};

export async function useTranslation(
  lng: string,
  ns: string | string[] = 'common',
  options: any = {}
) {
  const i18nextInstance = await initI18next(lng, ns);
  return {
    t: i18nextInstance.getFixedT(lng, Array.isArray(ns) ? ns[0] : ns),
    i18n: i18nextInstance,
  };
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
];

export { initI18next };