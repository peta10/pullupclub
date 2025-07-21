import { useState } from 'react';

interface UserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  externalId?: string;
  fbp?: string;
}

interface ContentData {
  name?: string;
  category?: string;
  type?: string;
  [key: string]: any;
}

interface TrialData {
  predictedValue?: number;
  type?: string;
  [key: string]: any;
}

interface PurchaseData {
  value: number;
  currency?: string;
  orderId?: string;
  [key: string]: any;
}

export function useMetaTracking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleApiCall = async (endpoint: string, data: any) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/meta/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          eventSourceUrl: window.location.href,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'API call failed');
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      console.error(`Meta ${endpoint} error:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const trackEvent = async (eventName: string, userData: UserData = {}, customData = {}) => {
    return handleApiCall('track-event', {
      eventName,
      userData,
      customData,
    });
  };

  const trackPurchase = async (userData: UserData, purchaseData: PurchaseData) => {
    const { value, currency = 'USD', orderId, ...customData } = purchaseData;
    
    return handleApiCall('track-purchase', {
      userData,
      value,
      currency,
      orderId,
      ...customData,
    });
  };

  const trackRegistration = async (userData: UserData, customData = {}) => {
    return trackEvent('CompleteRegistration', userData, customData);
  };

  const trackViewContent = async (userData: UserData, contentData: ContentData = {}) => {
    return trackEvent('ViewContent', userData, {
      content_name: contentData.name || document.title,
      content_category: contentData.category,
      content_type: contentData.type || 'page',
      ...contentData,
    });
  };

  const trackStartTrial = async (userData: UserData, trialData: TrialData = {}) => {
    return trackEvent('StartTrial', userData, {
      predicted_ltv: trialData.predictedValue,
      trial_type: trialData.type,
      ...trialData,
    });
  };

  const trackSubscribe = async (userData: UserData, subscriptionData = {}) => {
    return trackEvent('Subscribe', userData, subscriptionData);
  };

  const trackLeadGeneration = async (userData: UserData, leadData = {}) => {
    return trackEvent('Lead', userData, leadData);
  };

  const trackAddToCart = async (userData: UserData, cartData = {}) => {
    return trackEvent('AddToCart', userData, cartData);
  };

  const clearError = () => setError(null);

  return {
    trackEvent,
    trackPurchase,
    trackRegistration,
    trackViewContent,
    trackStartTrial,
    trackSubscribe,
    trackLeadGeneration,
    trackAddToCart,
    isLoading,
    error,
    clearError,
  };
} 