'use client'

import React, { useState, useEffect, useRef } from 'react';
import Layout from "../../Layout/Layout";
import BadgeLegend from "./BadgeLegend";
import LeaderboardTable from "../../Leaderboard/LeaderboardTable";
import LeaderboardFilters from "./LeaderboardFilters";
import PUCBankBanner from "../../PUCBank/PUCBankBanner";
import { LeaderboardFilters as FiltersType } from "../../../types";
import { LoadingState, ErrorState } from '../../ui/LoadingState';
import { useStableTranslation } from '../../../hooks/useStableTranslation';
import { useLeaderboard } from '../../../hooks/useLeaderboard';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getBadgesForSubmission } from '../../../data/mockData';
import { useMetaTracking } from '../../../hooks/useMetaTracking';
import { useAuth } from '../../../context/AuthContext';
import Image from 'next/image';

// PaginationControls component
const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useStableTranslation('leaderboard');

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push({ id: `page-${i}`, number: i });
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push({ id: `page-${i}`, number: i });
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push({ id: `page-${i}`, number: i });
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push({ id: `page-${i}`, number: i });
      }
    }
    return pages;
  };
  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('pagination.previous')}
      </button>
      {getPageNumbers().map((page) => (
        <button
          key={page.id}
          onClick={() => onPageChange(page.number)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            page.number === currentPage
              ? 'bg-[#918f6f] text-black'
              : 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
          }`}
        >
          {page.number}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('pagination.next')}
      </button>
    </div>
  );
};

const LeaderboardPage: React.FC = () => {
  const [filters, setFilters] = useState<FiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showBadgeLegend, setShowBadgeLegend] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useStableTranslation('leaderboard');
  const { leaderboardData: data = [], isLoading, error } = useLeaderboard();
  const { trackViewContent } = useMetaTracking();
  const { user } = useAuth();
  const hasTracked = useRef(false);

  // Filtering logic
  let filtered = data;
  if (filters) {
    if (filters.pullUpRange) {
      const range = filters.pullUpRange;
      const count = range === '50+' ? 50 : parseInt(range.split('-')[1], 10);
      const minCount = range === '50+' ? 50 : parseInt(range.split('-')[0], 10);
      filtered = filtered.filter(s => {
        const pullUps = s.actualPullUpCount ?? s.pullUpCount;
        return range === '50+' ? pullUps >= count : (pullUps >= minCount && pullUps <= count);
      });
    }
            if (filters.club) filtered = filtered.filter(s => s.organization === filters.club);
    if (filters.region) filtered = filtered.filter(s => s.region === filters.region);
    if (filters.gender) filtered = filtered.filter(s => s.gender === filters.gender);
    if (filters.ageGroup) {
      if (filters.ageGroup.includes('+')) {
        const min = parseInt(filters.ageGroup, 10);
        filtered = filtered.filter(s => s.age >= min);
      } else {
        const [min, max] = filters.ageGroup.split("-").map(Number);
        filtered = filtered.filter(s => s.age >= min && (max ? s.age <= max : true));
      }
    }
    if (filters.badge) {
      filtered = filtered.filter(s => {
        const pullUps = s.actualPullUpCount ?? s.pullUpCount;
        const badges = getBadgesForSubmission(pullUps, s.gender);
        
        // Extract the base badge ID from the filter (remove -male/-female suffix)
        const baseBadgeId = filters.badge?.replace(/-(male|female)$/, '') || '';
        const requiredGender = filters.badge?.includes('-male') ? 'Male' : 
                              filters.badge?.includes('-female') ? 'Female' : null;
        
        // Check if user has the badge and matches the gender requirement
        const hasBadge = badges.some(badge => badge.id === baseBadgeId);
        const genderMatches = !requiredGender || s.gender === requiredGender;
        
        return hasBadge && genderMatches;
      });
    }
  }

  // Sort by pull-up count DESC, then approvedAt ASC
  filtered = [...filtered].sort((a, b) => {
    const aCount = a.actualPullUpCount ?? a.pullUpCount;
    const bCount = b.actualPullUpCount ?? b.pullUpCount;
    if (aCount !== bCount) return bCount - aCount;
    if (a.approvedAt && b.approvedAt) return new Date(a.approvedAt).getTime() - new Date(b.approvedAt).getTime();
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  const handleFilterChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      // Track leaderboard view
      trackViewContent(
        {
          email: user?.email,
          externalId: user?.id
        },
        {
          name: 'PUC Leaderboard',
          category: 'leaderboard',
          type: 'page'
        }
      ).catch(console.error);
    }
  }, [trackViewContent, user]);

  if (isLoading) return <LoadingState message={t('table.loading')} />;
  if (error) return <ErrorState message={typeof error === 'string' ? error : t('common:errors.generic')} />;

  return (
    <Layout>
      <div className="bg-black py-10">
        <div className="container mx-auto px-4">

          <div className="flex items-center justify-center mb-4">
            <Image
              src="/PUClogo-optimized.webp"
              alt={t('common:misc.logoAlt')}
              width={40}
              height={40}
              className="h-10 w-auto mr-3"
              priority
            />
            <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          </div>
          
          {/* P.U.C Bank Banner - Right under title */}
          <div className="flex flex-col items-center mb-2">
            <PUCBankBanner />
            <p className="text-sm text-[#9b9b6f] font-medium mt-1 text-center">
              {t('pucBank.drain')}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 text-center">
              {t('pucBank.payouts')}
            </p>
          </div>
          
          <div className="text-center mb-8">
            <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Mobile: Collapsible Badge Legend */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setShowBadgeLegend(!showBadgeLegend)}
              className="w-full bg-gray-900 p-4 rounded-lg flex items-center justify-between text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
              aria-expanded={showBadgeLegend}
              aria-controls="badge-legend-mobile"
            >
              <span className="font-medium">{showBadgeLegend ? t('mobile.hideBadgeLegend') : t('mobile.showBadgeLegend')}</span>
              {showBadgeLegend ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showBadgeLegend && (
              <div id="badge-legend-mobile" className="mt-2">
                <BadgeLegend />
              </div>
            )}
          </div>

          {/* Mobile: Collapsible Filters */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full bg-gray-900 p-4 rounded-lg flex items-center justify-between text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
              aria-expanded={showFilters}
              aria-controls="filters-mobile"
            >
              <span className="font-medium">{showFilters ? t('mobile.hideFilters') : t('mobile.showFilters')}</span>
              {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showFilters && (
              <div id="filters-mobile" className="mt-2">
                <LeaderboardFilters filters={filters} onFilterChange={handleFilterChange} />
              </div>
            )}
          </div>

          {/* Mobile: Leaderboard Cards */}
          <div className="md:hidden">
            <LeaderboardTable
              data={currentItems}
              loading={isLoading}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              showFilters={false}
              filters={filters}
              onFilterChange={handleFilterChange}
              mobileCardMode={true}
            />
          </div>

          {/* Desktop: Always show Badge Legend, Filters, and Table */}
          <div className="hidden md:block">
            <BadgeLegend />
            <LeaderboardFilters filters={filters} onFilterChange={handleFilterChange} />
            <LeaderboardTable
              data={currentItems}
              loading={isLoading}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              showFilters={false}
              filters={filters}
              onFilterChange={handleFilterChange}
              mobileCardMode={false}
            />
          </div>

          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LeaderboardPage;
