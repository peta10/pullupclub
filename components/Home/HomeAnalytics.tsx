'use client'

import { useEffect, useRef } from "react";
import { useMetaTracking } from "../../hooks/useMetaTracking";

const HomeAnalytics: React.FC = () => {
  const { trackEvent } = useMetaTracking();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      // Track ViewContent event for homepage
      trackEvent('ViewContent', {
        externalId: 'test-user-id'
      }, {
        content_name: 'Elite Fitness Competition - Pull-Up Club',
        content_category: 'Homepage',
        content_type: 'website',
        value: 0,
        currency: 'USD'
      }).catch(error => {
        console.error('Failed to track homepage view:', error);
      });
    }
  }, [trackEvent]);

  return null; // This component doesn't render anything visible
};

export default HomeAnalytics;