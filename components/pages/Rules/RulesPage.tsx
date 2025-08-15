'use client';

import React from "react";
import { useStableTranslation } from "../../../hooks/useStableTranslation";
import CompetitionRules from "../Submission/CompetitionRules";

const RulesPage: React.FC = () => {
  const { t } = useStableTranslation('rules');

  return (
    <div className="bg-black py-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        <CompetitionRules />
      </div>
    </div>
  );
};

export default RulesPage;
