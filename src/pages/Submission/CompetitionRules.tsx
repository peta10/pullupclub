import React from 'react';
import { useTranslation } from 'react-i18next';

const CompetitionRules: React.FC = () => {
  const { t } = useTranslation('rules');

  return (
    <div className="max-w-3xl mx-auto bg-gray-900 rounded-lg p-8 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {t('mainTitle')}
      </h2>
      <p className="text-gray-300 mb-6">
        {t('introduction')}
      </p>

      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-bold text-white mb-3">{t('section1.title')}</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>{t('section1.point1')}</li>
            <li>{t('section1.point2')}</li>
            <li>{t('section1.point3')}</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-white mb-3">{t('section2.title')}</h3>
          <p className="text-gray-300 mb-2">{t('section2.intro')}</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>{t('section2.point1')}</li>
            <li>{t('section2.point2')}</li>
            <li>{t('section2.point3')}</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-white mb-3">{t('section3.title')}</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>{t('section3.point1')}</li>
            <li>{t('section3.point2')}</li>
            <li>{t('section3.point3')}</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-white mb-3">{t('section4.title')}</h3>
          <p className="text-gray-300 mb-2">{t('section4.intro')}</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>{t('section4.point1')}</li>
            <li>{t('section4.point2')}</li>
            <li>{t('section4.point3')}</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-white mb-3">{t('section5.title')}</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>{t('section5.point1')}</li>
            <li>{t('section5.point2')}</li>
          </ul>
        </section>
      </div>

      <div className="mt-8 p-4 bg-gray-700 rounded-lg">
        <p className="text-gray-300 text-sm">
          {t('conclusion')}
        </p>
      </div>
    </div>
  );
};

export default CompetitionRules;