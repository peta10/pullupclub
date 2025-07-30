declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export function initMetaPixel(pixelId: string) {
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
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
    console.log('🔍 Meta Pixel: Tracked event', { eventName, parameters });
  } else {
    console.warn('🔍 Meta Pixel: Failed to track event - fbq not initialized', { eventName, parameters });
  }
} 