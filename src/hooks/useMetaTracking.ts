import { useState } from 'react';

interface ContentData {
  name?: string;
  category?: string;
  [key: string]: any;
}

export function useMetaTracking() {
  const [isLoading, setIsLoading] = useState(false);

  // Check if we're in production mode
  const isProduction = import.meta.env.MODE === 'production';
  
  // Get Facebook-specific parameters from cookies/localStorage
  const getFacebookParams = () => {
    if (typeof window === 'undefined') return {};
    
    const fbp = document.cookie.match(/_fbp=([^;]+)/)?.[1];
    const fbc = document.cookie.match(/_fbc=([^;]+)/)?.[1];
    const fb_login_id = localStorage.getItem('fb_login_id');

    return {
      fbp,
      fbc,
      fb_login_id,
    };
  };

  const trackEvent = async (eventName: string, userData = {}, customData = {}) => {
    // In development, we'll still track but log it
    if (!isProduction) {
      console.log('🔍 Meta tracking (dev mode):', { eventName, userData, customData });
      // Still track the event but mark it as test data
      if (window.fbq) {
        window.fbq('track', eventName, {
          ...customData,
          test_event_code: 'TEST12345', // Add your test event code here
          is_test: true
        });
      }
      return { success: true, dev: true };
    }

    setIsLoading(true);
    try {
      // Merge Facebook parameters with user data
      const facebookParams = getFacebookParams();
      const enrichedUserData = {
        ...userData,
        ...facebookParams,
      };

      const response = await fetch('/api/meta/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName,
          userData: enrichedUserData,
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