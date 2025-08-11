'use client'

import { useEffect } from 'react';
import { initMetaPixel } from '../../utils/meta-pixel';

// Global flag to prevent multiple initializations
declare global {
  var __META_PIXEL_INITIALIZED__: boolean;
}

const AnalyticsWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Only initialize Meta Pixel if it hasn't been initialized yet
    if (typeof window !== 'undefined' && !window.__META_PIXEL_INITIALIZED__) {
      console.log('🔍 Meta Pixel: Initializing from AnalyticsWrapper');
      initMetaPixel();
      window.__META_PIXEL_INITIALIZED__ = true;
    }
  }, []);

  return <>{children}</>;
};

export default AnalyticsWrapper;