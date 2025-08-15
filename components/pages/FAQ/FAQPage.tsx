'use client'

import React, { useRef, useEffect } from "react";
import Layout from "../../Layout/Layout";
import { FaqSection } from "../../ui/faq-section";
import { useStableTranslation } from "../../../hooks/useStableTranslation";
import { useMetaTracking } from '../../../hooks/useMetaTracking';

const FAQPage: React.FC = () => {
  const { t } = useStableTranslation('faq');
  const { trackViewContent } = useMetaTracking();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      trackViewContent({}, {
        name: 'FAQ Page',
        category: 'faq',
        type: 'page'
      }).catch(() => {});
    }
  }, [trackViewContent]);

  const faqs = Array.from({ length: 14 }, (_, i) => ({
    question: t(`q${i + 1}.q`),
    answer: t(`q${i + 1}.a`),
  }));

  return (
    <Layout>
      {/* Metadata is now handled by Next.js layout and metadata */}
      <div className="bg-black py-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">{t('title')}</h1>
        </div>
        <FaqSection
          items={faqs}
        />
      </div>
    </Layout>
  );
};

export default FAQPage;
