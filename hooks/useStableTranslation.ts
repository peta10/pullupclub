import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

/**
 * Stable wrapper for useTranslation that prevents hook order issues
 * and provides fallback values during i18n initialization
 */
export const useStableTranslation = (namespace: string = 'common') => {
  const [isReady, setIsReady] = useState(false);
  
  // Always call useTranslation to maintain hook order
  const translation = useTranslation(namespace);
  
  useEffect(() => {
    // Set ready when i18n is initialized
    if (translation.i18n.isInitialized) {
      setIsReady(true);
    }
    
    const handleInitialized = () => setIsReady(true);
    translation.i18n.on('initialized', handleInitialized);
    
    return () => {
      translation.i18n.off('initialized', handleInitialized);
    };
  }, [translation.i18n]);
  
  // Return stable t function that always works
  const stableT = (key: string, defaultValue?: string) => {
    if (!isReady) {
      return defaultValue || key;
    }
    
    // Only pass defaultValue if it's defined
    if (defaultValue !== undefined) {
      return translation.t(key, { defaultValue });
    }
    
    return translation.t(key);
  };
  
  return {
    t: stableT,
    i18n: translation.i18n,
    ready: isReady
  };
};

export default useStableTranslation;
