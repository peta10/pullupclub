import React from "react";
import { Button } from "../../components/ui/Button";
import { Link } from "../../components/ui/Link";
import LeaderboardTable from "../../components/Leaderboard/LeaderboardTable";
import { useLeaderboardWithCache } from '../../hooks/useOptimizedQuery';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useTranslation } from "react-i18next";

const LeaderboardPreview: React.FC = () => {
  const { t } = useTranslation('home');
  const { data: cachedData = [], isLoading: cachedLoading } = useLeaderboardWithCache();
  const { leaderboardData: originalData = [], isLoading: originalLoading } = useLeaderboard();

  // Use fresh data if available, fall back to cached data
  const finalData = originalData?.length > 0 ? originalData : cachedData;
  const finalLoading = originalLoading && cachedLoading;
  const top5 = finalData.slice(0, 5);

  return (
    <section className="bg-black py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">{t('leaderboardPreview.title')}</h2>
          <div className="w-20 h-1 bg-[#9b9b6f] mx-auto mt-4 mb-6"></div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t('leaderboardPreview.subtitle')}
          </p>
        </div>
        {/* Mobile: Card layout */}
        <div className="md:hidden">
          <LeaderboardTable
            data={top5}
            loading={finalLoading}
            currentPage={1}
            itemsPerPage={5}
            mobileCardMode={true}
          />
        </div>
        {/* Desktop: Table layout */}
        <div className="hidden md:block">
          <LeaderboardTable
            data={top5}
            loading={finalLoading}
            currentPage={1}
            itemsPerPage={5}
            mobileCardMode={false}
          />
        </div>
        <div className="text-center mt-6">
          <Button variant="secondary" size="lg" className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-full px-8 py-3">
            <Link href="/leaderboard" className="text-white">
              {t('leaderboardPreview.viewFull')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardPreview;
