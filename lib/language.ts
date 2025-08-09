// Language detection and management for Next.js
export function detectLanguage(): string {
  if (typeof window === 'undefined') {
    return 'en'; // Default for server-side rendering
  }
  
  // Check localStorage first
  const savedLang = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
  if (savedLang) {
    return savedLang;
  }
  
  // Check browser language
  const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
  const supportedLangs = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'ar'];
  
  return supportedLangs.includes(browserLang) ? browserLang : 'en';
}

export function setLanguage(lang: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }
}

export function getCurrentLanguage(): string {
  return detectLanguage();
}