'use client'

import { useEffect } from 'react';

const MetaPixelClient = () => {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if Meta Pixel is already initialized
    if (window.__META_PIXEL_INITIALIZED__) return;

    // Initialize Meta Pixel
    const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    
    if (!metaPixelId) {
      console.warn('Meta Pixel ID not found in environment variables');
      return;
    }

    // Meta Pixel initialization code
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
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
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    // Initialize the pixel
    window.fbq('init', metaPixelId);
    window.fbq('track', 'PageView');

    // Mark as initialized
    window.__META_PIXEL_INITIALIZED__ = true;
    
    console.log('🔍 Meta Pixel initialized successfully');
  }, []);

  return null;
};

export default MetaPixelClient;
