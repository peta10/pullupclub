'use client'

import { useState, useEffect } from 'react';

interface ContentData {
  name?: string;
  category?: string;
  [key: string]: any;
}

export function useMetaTracking() {
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side after hydration
    setIsClient(true);
  }, []);

  // Check if we're in production mode
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Get Facebook-specific parameters from cookies/localStorage
  const getFacebookParams = () => {
    if (!isClient) return {};
    
    try {
      const fbp = document.cookie.match(/_fbp=([^;]+)/)?.[1];
      const fbc = document.cookie.match(/_fbc=([^;]+)/)?.[1];
      const fb_login_id = localStorage.getItem('fb_login_id');

      return {
        fbp,
        fbc,
        fb_login_id,
      };
    } catch (error) {
      console.warn('Error getting Facebook params:', error);
      return {};
    }
  };

  // Enhanced user data collection
  const getEnhancedUserData = (userData: any = {}) => {
    if (!isClient) return userData;

    try {
      const facebookParams = getFacebookParams();
      
      // Get additional browser/user data
      const enhancedData = {
        ...userData,
        ...facebookParams,
        // Add page URL for context
        page_url: window.location.href,
        page_path: window.location.pathname,
      };

      return enhancedData;
    } catch (error) {
      console.warn('Error enhancing user data:', error);
      return userData;
    }
  };

  const trackEvent = async (eventName: string, userData = {}, customData = {}) => {
    // Don't track during SSR
    if (!isClient) {
      console.log('🔍 Meta tracking skipped (SSR)');
      return { success: false, reason: 'SSR' };
    }

    // In development, we'll still track but log it
    if (!isProduction) {
      console.log('🔍 Meta tracking (dev mode):', { eventName, userData, customData });
      // Still track the event but mark it as test data
      if (typeof window !== 'undefined' && window.fbq) {
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
      // Enhance user data with Facebook parameters and additional context
      const enrichedUserData = getEnhancedUserData(userData);

      // Add referrer to custom_data instead of user_data
      const enrichedCustomData = {
        ...customData,
        referrer: document.referrer || '',
      };

      const response = await fetch('/api/meta/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName,
          userData: enrichedUserData,
          customData: enrichedCustomData,
          eventSourceUrl: window.location.href,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Meta event tracked successfully:', eventName);
        return { success: true, ...result };
      } else {
        console.error('❌ Meta tracking failed:', result);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Meta tracking error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const trackViewContent = async (userData = {}, contentData: ContentData = {}) => {
    return trackEvent('ViewContent', userData, {
      content_name: contentData.name || (isClient ? document.title : ''),
      content_category: contentData.category,
      ...contentData,
    });
  };

  // Enhanced purchase tracking
  const trackPurchase = async (userData = {}, purchaseData = {}) => {
    return trackEvent('Purchase', userData, {
      currency: 'USD',
      ...purchaseData,
    });
  };

  // Enhanced lead tracking
  const trackLead = async (userData = {}, leadData = {}) => {
    return trackEvent('Lead', userData, {
      content_name: 'PUC Membership',
      content_category: 'Subscription',
      ...leadData,
    });
  };

  return {
    trackEvent,
    trackViewContent,
    trackPurchase,
    trackLead,
    isLoading,
    isClient,
  };
} 