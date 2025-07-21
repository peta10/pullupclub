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

  console.log('🔍 Meta Pixel: Initializing with ID', pixelId);

  // Meta Pixel Code
  (function (f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js',
    undefined,
    undefined,
    undefined
  );

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
  console.log('🔍 Meta Pixel: Initialized and tracked PageView');
}

export function trackPixelEvent(eventName: string, parameters: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
    console.log('🔍 Meta Pixel: Tracked event', { eventName, parameters });
  } else {
    console.warn('🔍 Meta Pixel: Failed to track event - fbq not initialized', { eventName, parameters });
  }
} 