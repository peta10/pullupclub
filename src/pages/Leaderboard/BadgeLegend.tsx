import React from "react";
import badges from "../../data/mockData";
import { Award } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

const BadgeLegend: React.FC = () => {
  const { t } = useTranslation('leaderboard');
  
  return (
    <div className="bg-gray-900 p-4 rounded-lg mb-6">
      <div className="flex items-center mb-4">
        <Award size={20} className="text-[#9b9b6f] mr-2" />
        <h3 className="text-white text-lg font-medium">{t('badgeLegend.title')}</h3>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {badges.map((badge: any) => (
          <div
            key={badge.id}
            className="flex flex-col items-center text-center"
          >
            <img
              src={`/badge-${badge.id.toLowerCase()}-men-256.webp`}
              alt={badge.name}
              className="w-32 h-32 mb-2 object-contain"
            />
            <h4 className="text-[#9b9b6f] font-bold">{badge.name}</h4>
            <div className="font-bold text-white">
              <Trans
                i18nKey="badgeLegend.pullUpsRequired"
                t={t}
                values={{ count: badge.criteria.value }}
                components={[<span className="font-bold text-white"/>]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeLegend;
