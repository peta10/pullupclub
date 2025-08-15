'use client'

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Meta Pixel with no SSR
const MetaPixelClient = dynamic(() => import('./MetaPixelClient'), {
  ssr: false,
  loading: () => null
});

// Global flag to prevent multiple initializations
declare global {
  var __META_PIXEL_INITIALIZED__: boolean;
}

const AnalyticsWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <MetaPixelClient />
    </>
  );
};

export default AnalyticsWrapper;