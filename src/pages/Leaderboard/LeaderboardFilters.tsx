import React from 'react';
import { LeaderboardFilters as FiltersType } from '../../types';
import badges, { clubs, getAgeGroups } from '../../data/mockData';
import { useTranslation } from 'react-i18next';

interface LeaderboardFiltersProps {
  filters: FiltersType;
  onFilterChange: (filters: FiltersType) => void;
}

const LeaderboardFilters: React.FC<LeaderboardFiltersProps> = ({ filters, onFilterChange }) => {
  const { t } = useTranslation('leaderboard');
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const allowedRegions = [
    'North America',
    'South America',
    'Europe',
    'Asia',
    'Middle East',
    'Africa',
    'Australia/Oceania'
  ];

  const pullUpRanges = [
    '0-9',
    '10-19',
    '20-29',
    '30-39',
    '40-49',
    '50+'
  ];

  return (
    <div className="bg-gray-900 p-4 rounded-lg mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h3 className="text-white text-lg font-medium mb-4 md:mb-0">{t('filters.title')}</h3>
        <button onClick={clearFilters} className="text-sm text-[#9b9b6f] hover:text-[#7a7a58]">
          {t('filters.clear')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.pullUps')}</label>
          <select name="pullUpRange" value={filters.pullUpRange || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allPullUps')}</option>
            {pullUpRanges.map((range) => (
              <option key={range} value={range}>{range} Pull-Ups</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.club')}</label>
          <select name="club" value={filters.club || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allClubs')}</option>
            {clubs.map((club) => (
              <option key={club} value={club}>{club}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.region')}</label>
          <select name="region" value={filters.region || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allRegions')}</option>
            {allowedRegions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.ageGroup')}</label>
          <select name="ageGroup" value={filters.ageGroup || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allAges')}</option>
            {getAgeGroups().map((ageGroup) => (
              <option key={ageGroup} value={ageGroup}>{ageGroup}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.gender')}</label>
          <select name="gender" value={filters.gender || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allGenders')}</option>
            <option value="Male">{t('filters.male')}</option>
            <option value="Female">{t('filters.female')}</option>
            <option value="Other">{t('filters.other')}</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.badge')}</label>
          <select name="badge" value={filters.badge || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allBadges')}</option>
            {badges.map((badge: any) => (
              <option key={badge.id} value={badge.id}>{badge.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardFilters;