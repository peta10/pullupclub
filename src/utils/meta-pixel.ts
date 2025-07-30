// Remove unused import
// import { createClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const PIXEL_ID = '1512318086417813';

// Initialize Meta Pixel
export function initMetaPixel() {
  if (typeof window === 'undefined') {
    console.log('🔍 Meta Pixel: Window not available (SSR)');
    return;
  }

  // Check if Meta Pixel is already loaded
  if (window.fbq) {
    console.log('🔍 Meta Pixel: Already initialized');
    return;
  }

  // Load Meta Pixel script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://connect.facebook.net/en_US/fbevents.js`;
  document.head.appendChild(script);

  // Initialize Meta Pixel
  window.fbq = function() {
    window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
  };
  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = '2.0';
  window.fbq.queue = [];

  // Track page view
  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');

  console.log('🔍 Meta Pixel: Initialized');
}

// We'll use the Supabase URL and anon key for the Meta Conversions API Edge Function

interface UserData {
  email?: string;
  external_id?: string;
}

export async function trackConversion(
  eventName: string,
  userData: UserData,
  customData: Record<string, any> = {}
) {
  try {
    // Client-side tracking
    trackPixelEvent(eventName, customData);

    // Server-side tracking via Supabase Edge Function
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-conversions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        event_name: eventName,
        user_data: userData,
        custom_data: customData,
      }),
    });
  } catch (error) {
    console.error('🔍 Meta Pixel: Error tracking conversion', { eventName, error });
  }
}

export function trackPixelEvent(eventName: string, parameters: Record<string, any> = {}) {
  if (typeof window === 'undefined') {
    console.log('🔍 Meta Pixel: Window not available (SSR)');
    return;
  }

  try {
    // Standard events should use 'track', custom events should use 'trackCustom'
    const standardEvents = [
      'PageView',
      'ViewContent',
      'Search',
      'AddToCart',
      'AddToWishlist',
      'InitiateCheckout',
      'AddPaymentInfo',
      'Purchase',
      'Lead',
      'CompleteRegistration',
      'Subscribe',
      'StartTrial'
    ];

    const trackMethod = standardEvents.includes(eventName) ? 'track' : 'trackCustom';
    window.fbq(trackMethod, eventName, parameters);
    
    console.log('🔍 Meta Pixel: Tracked event', { 
      method: trackMethod,
      eventName, 
      parameters
    });
  } catch (error) {
    console.error('🔍 Meta Pixel: Error tracking event', { eventName, parameters, error });
  }
}