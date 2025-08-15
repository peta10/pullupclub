import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { initializeI18n } from '../i18n';

/**
 * Stable wrapper for useTranslation that prevents hook order issues
 * and provides fallback values during i18n initialization
 */
export const useStableTranslation = (namespace: string = 'common') => {
  const [isReady, setIsReady] = useState(false);
  
  // Always call useTranslation to maintain hook order
  const translation = useTranslation(namespace);
  
  useEffect(() => {
    // Ensure i18n is initialized
    const ensureInitialized = async () => {
      try {
        await initializeI18n();
        if (translation.i18n && translation.i18n.isInitialized) {
          setIsReady(true);
        }
      } catch (error) {
        console.warn('Failed to initialize i18n in useStableTranslation:', error);
        setIsReady(true); // Set ready anyway to prevent hanging
      }
    };

    // Set ready when i18n is initialized
    if (translation.i18n && translation.i18n.isInitialized) {
      setIsReady(true);
    } else {
      ensureInitialized();
    }
    
    // Safely handle i18n event listeners
    if (translation.i18n && typeof translation.i18n.on === 'function') {
      const handleInitialized = () => setIsReady(true);
      translation.i18n.on('initialized', handleInitialized);
      
      return () => {
        if (translation.i18n && typeof translation.i18n.off === 'function') {
          translation.i18n.off('initialized', handleInitialized);
        }
      };
    }
  }, [translation.i18n]);
  
  // Return stable t function that always works
  const stableT = (key: string, options?: any) => {
    if (!isReady) {
      return options?.defaultValue || key;
    }
    
    // Pass through all options to the original t function
    return translation.t(key, options);
  };
  
  return {
    t: stableT,
    i18n: translation.i18n,
    ready: isReady
  };
};

export default useStableTranslation;
