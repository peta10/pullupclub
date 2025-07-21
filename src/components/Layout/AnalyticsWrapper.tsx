import { useEffect } from 'react';
import { initMetaPixel } from '../../utils/meta-pixel';

export default function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Meta Pixel
    initMetaPixel(import.meta.env.VITE_META_PIXEL_ID || '1512318086417813');
  }, []);

  return <>{children}</>;
}