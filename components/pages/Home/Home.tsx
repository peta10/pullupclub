'use client'

import React, { useEffect, useRef } from "react";
import Layout from "../../Layout/Layout";
import Hero1 from "./Hero1";
import HowItWorks from "./HowItWorks";
import PerksSection from "./PerksSection";
import LeaderboardPreview from "./LeaderboardPreview";
import TestimonialSection from "./TestimonialSection";
import CTASection from "./CTASection";
import { useStableTranslation } from "../../../hooks/useStableTranslation";
import { useMetaTracking } from "../../../hooks/useMetaTracking";

const Home: React.FC = () => {
  const { t } = useStableTranslation("home");
  const { trackEvent } = useMetaTracking();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      // Track ViewContent event for homepage
      trackEvent('ViewContent', {
        externalId: 'test-user-id'
      }, {
        content_name: "Pull-Up Club - Elite Fitness Community",
        content_category: 'Homepage',
        content_type: 'website',
        value: 0,
        currency: 'USD'
      });
    }
  }, [trackEvent]);

  return (
    <>
      {/* Metadata is now handled by Next.js layout and metadata */}
      <Layout>
        <Hero1 />
        <HowItWorks />
        <PerksSection />
        <LeaderboardPreview />
        <TestimonialSection />
        <CTASection />
      </Layout>
    </>
  );
};

export default Home;
