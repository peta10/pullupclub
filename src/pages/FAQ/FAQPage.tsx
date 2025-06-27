import React from "react";
import Layout from "../../components/Layout/Layout";
import { FaqSection } from "../../components/ui/faq-section";
import { useTranslation } from "react-i18next";
import Head from "../../components/Layout/Head";

const FAQPage: React.FC = () => {
  const { t } = useTranslation('faq');

  const faqs = Array.from({ length: 14 }, (_, i) => ({
    question: t(`q${i + 1}.q`),
    answer: t(`q${i + 1}.a`),
  }));

  return (
    <Layout>
      <Head>
        <title>{t("meta.title")}</title>
        <meta name="description" content={t("meta.description")} />
      </Head>
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
