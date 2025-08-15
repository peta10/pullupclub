'use client';

import React from "react";
import Layout from "../../Layout/Layout";
import { useStableTranslation } from "../../../hooks/useStableTranslation";

const CookiesPolicyPage: React.FC = () => {
  const { t } = useStableTranslation('cookies');

  return (
    <Layout>
      <div className="bg-black py-16">
        <div className="container mx-auto px-4">
          <div className="prose prose-invert max-w-none">
            <div className="bg-gray-900 rounded-lg p-8 space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white">
                  {t('title')}
                </h1>
                <p className="text-gray-300 mt-2">{t('lastUpdated')}</p>
              </div>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t('whatAreCookies.title')}
                </h2>
                <p className="text-gray-300">
                  {t('whatAreCookies.description')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t('types.title')}
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('types.essential.title')}
                    </h3>
                    <p className="text-gray-300">
                      {t('types.essential.description')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('types.authentication.title')}
                    </h3>
                    <p className="text-gray-300">
                      {t('types.authentication.description')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('types.preference.title')}
                    </h3>
                    <p className="text-gray-300">
                      {t('types.preference.description')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('types.analytics.title')}
                    </h3>
                    <p className="text-gray-300">
                      {t('types.analytics.description')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('types.marketing.title')}
                    </h3>
                    <p className="text-gray-300">
                      {t('types.marketing.description')}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t('managing.title')}
                </h2>
                <p className="text-gray-300 mb-4">
                  {t('managing.description')}
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>{t('managing.options.block')}</li>
                  <li>{t('managing.options.delete')}</li>
                  <li>{t('managing.options.notify')}</li>
                  <li>{t('managing.options.thirdParty')}</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  {t('managing.note')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t('thirdParty.title')}
                </h2>
                <p className="text-gray-300 mb-4">
                  {t('thirdParty.description')}
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('thirdParty.analytics.title')}
                    </h3>
                    <p className="text-gray-300">
                      {t('thirdParty.analytics.description')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('thirdParty.stripe.title')}
                    </h3>
                    <p className="text-gray-300">
                      {t('thirdParty.stripe.description')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('thirdParty.social.title')}
                    </h3>
                    <p className="text-gray-300">
                      {t('thirdParty.social.description')}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t('updates.title')}
                </h2>
                <p className="text-gray-300">
                  {t('updates.description')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t('contact.title')}
                </h2>
                <p className="text-gray-300">
                  {t('contact.description')}
                </p>
                <div className="mt-2 text-gray-300">
                  <p>{t('contact.company')}</p>
                  <p>{t('contact.email')}</p>
                  <p>{t('contact.address.line1')}</p>
                  <p>{t('contact.address.line2')}</p>
                  <p>{t('contact.address.country')}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CookiesPolicyPage;
