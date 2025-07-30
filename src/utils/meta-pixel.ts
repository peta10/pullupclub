declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export function initMetaPixel() {
  if (typeof window === 'undefined') {
    console.log('🔍 Meta Pixel: Window not available (SSR)');
    return;
  }

  // Check if pixel is already loaded
  if (window.fbq) {
    console.log('🔍 Meta Pixel: Already initialized');
    return;
  }

  console.warn('🔍 Meta Pixel: Not initialized. The pixel should be initialized via the base code in index.html');
}

export function trackPixelEvent(eventName: string, parameters: Record<string, any> = {}) {
  if (typeof window === 'undefined') {
    console.log('🔍 Meta Pixel: Window not available (SSR)');
    return;
  }

  // Ensure fbq queue exists
  if (!window.fbq) {
    window.fbq = function() {
      // @ts-ignore
      window.fbq.queue = window.fbq.queue || [];
      // @ts-ignore
      window.fbq.queue.push(arguments);
    };
  }

  try {
    // Add test_event_code in development
    const isDev = import.meta.env.MODE === 'development';
    const eventParams = isDev ? { ...parameters, test_event_code: 'TEST12345' } : parameters;

    window.fbq('track', eventName, eventParams);
    console.log('🔍 Meta Pixel: Tracked event', { eventName, parameters: eventParams });
  } catch (error) {
    console.error('🔍 Meta Pixel: Error tracking event', { eventName, parameters, error });
  }
} 