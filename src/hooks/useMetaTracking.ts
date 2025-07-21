import { useState } from 'react';

interface ContentData {
  name?: string;
  category?: string;
  [key: string]: any;
}

export function useMetaTracking() {
  const [isLoading, setIsLoading] = useState(false);

  // Disable tracking in development
  const isProduction = process.env.NODE_ENV === 'production';
  
  const trackEvent = async (eventName: string, userData = {}, customData = {}) => {
    if (!isProduction) {
      console.log('🔍 Meta tracking (dev mode):', { eventName, userData, customData });
      return { success: true, dev: true };
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/meta/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName,
          userData,
          customData,
          eventSourceUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Meta tracking success:', result);
      return result;
    } catch (error: any) {
      console.warn('Meta tracking failed:', error.message);
      // Return success to prevent error loops
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const trackViewContent = async (userData = {}, contentData: ContentData = {}) => {
    return trackEvent('ViewContent', userData, {
      content_name: contentData.name || (typeof document !== 'undefined' ? document.title : ''),
      content_category: contentData.category,
      ...contentData,
    });
  };

  return {
    trackEvent,
    trackViewContent,
    isLoading,
  };
} 