'use client'

import { useEffect, useState } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';

// Initialize i18n on client side only
export const useI18n = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Import and initialize i18n
      import('../i18n').then(() => {
        setIsInitialized(true);
      }).catch(console.error);
    }
  }, []);

  const { t, i18n } = useI18nextTranslation();
  
  return {
    t: isInitialized ? t : (key: string) => key, // Fallback function
    i18n,
    isInitialized
  };
};

export default useI18n;